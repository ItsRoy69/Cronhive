package api

import (
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
)

func (h *Handler) GetRun(w http.ResponseWriter, r *http.Request) {
	tenantID := r.Context().Value(tenantKey).(string)
	runID := chi.URLParam(r, "runID")

	var run struct {
		ID          string     `json:"id"`
		JobID       string     `json:"job_id"`
		Status      string     `json:"status"`
		Attempt     int        `json:"attempt"`
		HTTPStatus  *int       `json:"http_status"`
		DurationMs  *int       `json:"duration_ms"`
		ScheduledAt *time.Time `json:"scheduled_at"`
		StartedAt   *time.Time `json:"started_at"`
		FinishedAt  *time.Time `json:"finished_at"`
		ErrorMsg    *string    `json:"error_msg"`
		LogURL      *string    `json:"log_url"`
		CreatedAt   time.Time  `json:"created_at"`
	}

	err := h.db.QueryRow(r.Context(), `
		SELECT id, job_id, status, attempt, http_status, duration_ms,
		       scheduled_at, started_at, finished_at, error_msg, log_url, created_at
		FROM runs
		WHERE id = $1 AND tenant_id = $2
	`, runID, tenantID).Scan(
		&run.ID, &run.JobID, &run.Status, &run.Attempt,
		&run.HTTPStatus, &run.DurationMs,
		&run.ScheduledAt, &run.StartedAt, &run.FinishedAt,
		&run.ErrorMsg, &run.LogURL, &run.CreatedAt,
	)
	if err != nil {
		jsonError(w, "run not found", 404)
		return
	}

	jsonOK(w, run)
}

func (h *Handler) GetRunLogs(w http.ResponseWriter, r *http.Request) {
	tenantID := r.Context().Value(tenantKey).(string)
	runID := chi.URLParam(r, "runID")

	var logInline []byte
	var logURL *string

	err := h.db.QueryRow(r.Context(), `
		SELECT log_inline, log_url
		FROM runs
		WHERE id = $1 AND tenant_id = $2
	`, runID, tenantID).Scan(&logInline, &logURL)
	if err != nil {
		jsonError(w, "run not found", 404)
		return
	}

	if len(logInline) > 0 {
		w.Header().Set("Content-Type", "text/plain; charset=utf-8")
		w.Write(logInline)
		return
	}

	if logURL != nil && *logURL != "" {
		jsonOK(w, map[string]string{"log_url": *logURL})
		return
	}

	jsonOK(w, map[string]string{"message": "no logs available"})
}
