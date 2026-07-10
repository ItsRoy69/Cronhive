package worker

import (
	"context"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"time"
)

type runDetails struct {
	ID          string
	JobID       string
	TenantID    string
	HTTPURL     string
	HTTPMethod  string
	HTTPBody    string
	TimeoutSecs int
	MaxRetries  int
	Attempt     int
	HTTPHeaders map[string]string
}

func (w *Worker) claimAndRun(ctx context.Context) {
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
		return
	}

	run, err := w.loadRun(ctx, runID)
	if err != nil {
		log.Printf("failed to load run %s: %v", runID, err)
		return
	}

	w.execute(ctx, run)
}

func (w *Worker) loadRun(ctx context.Context, runID string) (*runDetails, error) {
	run := &runDetails{ID: runID, HTTPHeaders: make(map[string]string)}

	err := w.db.QueryRow(ctx, `
		SELECT r.id, r.job_id, r.tenant_id, r.attempt,
			j.http_url, j.http_method, j.http_body,
			j.timeout_secs, j.max_retries
		FROM runs r
		JOIN jobs j ON j.id = r.job_id
		WHERE r.id = $1
	`, runID).Scan(
		&run.ID, &run.JobID, &run.TenantID, &run.Attempt,
		&run.HTTPURL, &run.HTTPMethod, &run.HTTPBody,
		&run.TimeoutSecs, &run.MaxRetries,
	)
	return run, err
}

func (w *Worker) execute(ctx context.Context, run *runDetails) {
	log.Printf("executing run %s (attempt %d) → %s %s",
		run.ID, run.Attempt, run.HTTPMethod, run.HTTPURL)

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

	body, _ := io.ReadAll(io.LimitReader(resp.Body, 64*1024))

	if resp.StatusCode >= 400 {
		w.handleFailure(ctx, run, fmt.Sprintf("http %d: %s",
			resp.StatusCode, truncate(string(body), 500)))
		return
	}

	w.handleSuccess(ctx, run.ID, resp.StatusCode, durationMs, body)
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
		log.Printf("failed to update run status: %v", err)
	}
}

func (w *Worker) handleSuccess(ctx context.Context, runID string, httpStatus, durationMs int, body []byte) {
	log.Printf("run %s succeeded (%d) in %dms", runID, httpStatus, durationMs)
	_, err := w.db.Exec(ctx, `
		UPDATE runs SET
			status = 'success',
			http_status = $1,
			duration_ms = $2,
			log_inline = $3,
			finished_at = now()
		WHERE id = $4
	`, httpStatus, durationMs, body, runID)
	if err != nil {
		log.Printf("failed to save success: %v", err)
	}

	w.notifyEvent(ctx, runID, "run.success")
}

func (w *Worker) handleFailure(ctx context.Context, run *runDetails, errMsg string) {
	log.Printf("run %s failed (attempt %d): %s", run.ID, run.Attempt, errMsg)

	if run.Attempt < run.MaxRetries {
		delay := time.Duration(30*(1<<run.Attempt)) * time.Second
		visibleAt := time.Now().Add(delay)

		_, err := w.db.Exec(ctx, `
			UPDATE runs SET
				status = 'queued',
				attempt = attempt + 1,
				error_msg = $1,
				finished_at = null
			WHERE id = $2
		`, errMsg, run.ID)
		if err != nil {
			log.Printf("failed to update run for retry: %v", err)
			return
		}

		_, err = w.db.Exec(ctx, `
			INSERT INTO run_queue (run_id, priority, visible_at)
			VALUES ($1, 0, $2)
		`, run.ID, visibleAt)
		if err != nil {
			log.Printf("failed to requeue run: %v", err)
		}

		log.Printf("run %s requeued, retrying at %s", run.ID, visibleAt.Format(time.RFC3339))
		return
	}

	w.updateStatus(ctx, run.ID, "dead", errMsg)
	w.notifyEvent(ctx, run.ID, "run.dead")
}

func (w *Worker) notifyEvent(ctx context.Context, runID, event string) {
	_, err := w.db.Exec(ctx, `
		SELECT pg_notify('run_events', json_build_object(
			'event', $1,
			'run_id', $2
		)::text)
	`, event, runID)
	if err != nil {
		log.Printf("notify error: %v", err)
	}
}

func truncate(s string, n int) string {
	if len(s) <= n {
		return s
	}
	return s[:n] + "..."
}