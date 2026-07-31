package worker

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"strings"
	"time"

	"github.com/ItsRoy69/cronhive/internal/metrics"
)

type runDetails struct {
	ID           string
	JobID        string
	TenantID     string
	HTTPURL      string
	HTTPMethod   string
	HTTPBody     string
	TimeoutSecs  int
	MaxRetries   int
	Attempt      int
	HTTPHeaders  map[string]string
	RetryBackoff string
}

func (w *Worker) claimAndRun(ctx context.Context) bool {
	var runID string
	err := w.db.QueryRow(ctx, `
		WITH claimed AS (
			SELECT rq.run_id FROM run_queue rq
			JOIN runs r ON r.id = rq.run_id
			WHERE rq.visible_at <= now()
			  AND r.status = 'queued'
			ORDER BY rq.priority DESC, rq.visible_at
			LIMIT 1
			FOR UPDATE OF rq SKIP LOCKED
		)
		DELETE FROM run_queue
		WHERE run_id = (SELECT run_id FROM claimed)
		RETURNING run_id
	`).Scan(&runID)

	if err != nil || runID == "" {
		return false
	}

	run, err := w.loadRun(ctx, runID)
	if err != nil {
		slog.Error("failed to load run", "run_id", runID, "err", err)
		return false
	}

	w.execute(ctx, run)
	return true
}

func (w *Worker) loadRun(ctx context.Context, runID string) (*runDetails, error) {
	run := &runDetails{ID: runID, HTTPHeaders: make(map[string]string)}

	var headersJSON []byte
	err := w.db.QueryRow(ctx, `
		SELECT r.id, r.job_id, r.tenant_id, r.attempt,
			j.http_url, j.http_method, COALESCE(j.http_body, ''),
			j.timeout_secs, j.max_retries, j.http_headers,
			j.retry_backoff
		FROM runs r
		JOIN jobs j ON j.id = r.job_id
		WHERE r.id = $1
	`, runID).Scan(
		&run.ID, &run.JobID, &run.TenantID, &run.Attempt,
		&run.HTTPURL, &run.HTTPMethod, &run.HTTPBody,
		&run.TimeoutSecs, &run.MaxRetries, &headersJSON,
		&run.RetryBackoff,
	)
	if err == nil && len(headersJSON) > 0 {
		_ = json.Unmarshal(headersJSON, &run.HTTPHeaders)
	}
	return run, err
}

func (w *Worker) execute(ctx context.Context, run *runDetails) {
	slog.Info("executing run", "run_id", run.ID, "attempt", run.Attempt, "url", run.HTTPURL)

	w.updateStatus(ctx, run.ID, "running", "")

	timeout := time.Duration(run.TimeoutSecs) * time.Second
	reqCtx, cancel := context.WithTimeout(ctx, timeout)
	defer cancel()

	var bodyReader io.Reader
	if run.HTTPBody != "" {
		bodyReader = strings.NewReader(run.HTTPBody)
	}

	req, err := http.NewRequestWithContext(reqCtx, run.HTTPMethod, run.HTTPURL, bodyReader)
	if err != nil {
		w.handleFailure(ctx, run, fmt.Sprintf("failed to build request: %v", err))
		return
	}

	for k, v := range run.HTTPHeaders {
		req.Header.Set(k, v)
	}

	req.Header.Set("X-Cronhive-Run-ID", run.ID)
	req.Header.Set("X-Cronhive-Job-ID", run.JobID)
	if run.HTTPBody != "" {
		req.Header.Set("Content-Type", "application/json")
	}

	start := time.Now()
	resp, err := w.httpClient.Do(req)
	durationMs := int(time.Since(start).Milliseconds())

	if err != nil {
		w.handleFailure(ctx, run, fmt.Sprintf("http error: %v", err))
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(io.LimitReader(resp.Body, 1*1024*1024)) // 1 MB max read

	if resp.StatusCode >= 400 {
		w.handleFailure(ctx, run, fmt.Sprintf("http %d: %s",
			resp.StatusCode, truncate(string(body), 500)))
		return
	}

	w.handleSuccess(ctx, run, resp.StatusCode, durationMs, body)
}

func (w *Worker) updateStatus(ctx context.Context, runID, status, errMsg string) {
	_, err := w.db.Exec(ctx, `
		UPDATE runs SET
			status = $1,
			started_at = CASE WHEN $1 = 'running' THEN now() ELSE started_at END,
			finished_at = CASE WHEN $1 IN ('success','failed','dead') THEN now() ELSE finished_at END,
			error_msg = NULLIF($2, '')
		WHERE id = $3
	`, status, errMsg, runID)
	if err != nil {
		slog.Error("failed to update run status", "err", err)
	}
}

func (w *Worker) handleSuccess(ctx context.Context, run *runDetails, httpStatus, durationMs int, body []byte) {
	slog.Info("run succeeded", "run_id", run.ID, "http_status", httpStatus, "duration_ms", durationMs)

	metrics.RunsTotal.WithLabelValues("success").Inc()
	metrics.RunDurationMs.WithLabelValues("success").Observe(float64(durationMs))

	var logInline []byte
	var logURL *string

	if w.uploader != nil && len(body) > 10*1024 {
		key := fmt.Sprintf("runs/%s/response.txt", run.ID)
		url, err := w.uploader.Upload(ctx, key, body)
		if err != nil {
			slog.Error("s3 upload failed, storing inline", "err", err)
			logInline = truncateBytes(body, 64*1024)
		} else {
			logURL = &url
		}
	} else {
		logInline = truncateBytes(body, 64*1024)
	}

	_, err := w.db.Exec(ctx, `
		UPDATE runs SET
			status = 'success',
			http_status = $1,
			duration_ms = $2,
			log_inline = $3,
			log_url = $4,
			finished_at = now()
		WHERE id = $5
	`, httpStatus, durationMs, logInline, logURL, run.ID)
	if err != nil {
		slog.Error("failed to save success", "err", err)
	}

	w.notifyEvent(ctx, run.ID, "run.success")
}

func (w *Worker) handleFailure(ctx context.Context, run *runDetails, errMsg string) {
	slog.Warn("run failed", "run_id", run.ID, "attempt", run.Attempt, "err", errMsg)

	if run.Attempt < run.MaxRetries {
		delay := backoffDelay(run.RetryBackoff, run.Attempt)
		visibleAt := time.Now().Add(delay)

		metrics.RunsTotal.WithLabelValues("retry").Inc()

		_, err := w.db.Exec(ctx, `
			UPDATE runs SET
				status = 'queued',
				attempt = attempt + 1,
				error_msg = $1,
				finished_at = null
			WHERE id = $2
		`, errMsg, run.ID)
		if err != nil {
			slog.Error("failed to update run for retry", "err", err)
			return
		}

		_, err = w.db.Exec(ctx, `
			INSERT INTO run_queue (run_id, priority, visible_at)
			VALUES ($1, 0, $2)
		`, run.ID, visibleAt)
		if err != nil {
			slog.Error("failed to requeue run", "err", err)
		}

		slog.Info("run requeued", "run_id", run.ID, "backoff", run.RetryBackoff, "retry_at", visibleAt.Format(time.RFC3339))
		w.notifyEvent(ctx, run.ID, "run.failure")
		return
	}

	metrics.RunsTotal.WithLabelValues("dead").Inc()
	w.updateStatus(ctx, run.ID, "dead", errMsg)
	w.notifyEvent(ctx, run.ID, "run.dead")
}

func backoffDelay(strategy string, attempt int) time.Duration {
	switch strategy {
	case "fixed":
		return 30 * time.Second
	case "linear":
		return time.Duration(30*(attempt+1)) * time.Second
	default: // exponential
		return time.Duration(30*(1<<attempt)) * time.Second
	}
}

func (w *Worker) notifyEvent(ctx context.Context, runID, event string) {
	_, err := w.db.Exec(ctx, `
		SELECT pg_notify('run_events', json_build_object(
			'event', $1::text,
			'run_id', $2::text
		)::text)
	`, event, runID)
	if err != nil {
		slog.Error("notify error", "err", err)
	}
}

func truncate(s string, n int) string {
	if len(s) <= n {
		return s
	}
	return s[:n] + "..."
}

func truncateBytes(b []byte, n int) []byte {
	if len(b) <= n {
		return b
	}
	return b[:n]
}
