package api

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/ItsRoy69/cronhive/internal/scheduler"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

func parsePageParams(r *http.Request) (limit, offset int) {
	limit, _ = strconv.Atoi(r.URL.Query().Get("limit"))
	offset, _ = strconv.Atoi(r.URL.Query().Get("offset"))
	if limit <= 0 || limit > 200 {
		limit = 50
	}
	if offset < 0 {
		offset = 0
	}
	return
}

type Handler struct {
	db   *pgxpool.Pool
	sched *scheduler.Scheduler
}

func NewHandler(db *pgxpool.Pool, sched *scheduler.Scheduler) *Handler {
	return &Handler{db: db, sched: sched}
}

func (h *Handler) ListJobs(w http.ResponseWriter, r *http.Request) {
	tenantID := r.Context().Value(tenantKey).(string)
	limit, offset := parsePageParams(r)

	rows, err := h.db.Query(r.Context(), `
		SELECT id, name, cron_expr, timezone, http_url, http_method,
		       status, next_run_at, last_run_at, created_at
		FROM jobs
		WHERE tenant_id = $1
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3
	`, tenantID, limit, offset)
	if err != nil {
		jsonError(w, "failed to list jobs", 500)
		return
	}
	defer rows.Close()

	type job struct {
		ID         string     `json:"id"`
		Name       string     `json:"name"`
		CronExpr   string     `json:"cron_expr"`
		Timezone   string     `json:"timezone"`
		HTTPURL    string     `json:"http_url"`
		HTTPMethod string     `json:"http_method"`
		Status     string     `json:"status"`
		NextRunAt  *time.Time `json:"next_run_at"`
		LastRunAt  *time.Time `json:"last_run_at"`
		CreatedAt  time.Time  `json:"created_at"`
	}

	var jobs []job
	for rows.Next() {
		var j job
		if err := rows.Scan(
			&j.ID, &j.Name, &j.CronExpr, &j.Timezone,
			&j.HTTPURL, &j.HTTPMethod, &j.Status,
			&j.NextRunAt, &j.LastRunAt, &j.CreatedAt,
		); err != nil {
			continue
		}
		jobs = append(jobs, j)
	}

	if jobs == nil {
		jobs = []job{}
	}
	jsonOK(w, jobs)
}

func (h *Handler) CreateJob(w http.ResponseWriter, r *http.Request) {
	tenantID := r.Context().Value(tenantKey).(string)

	var body struct {
		Name        string            `json:"name"`
		CronExpr    string            `json:"cron_expr"`
		Timezone    string            `json:"timezone"`
		HTTPURL     string            `json:"http_url"`
		HTTPMethod  string            `json:"http_method"`
		HTTPHeaders map[string]string `json:"http_headers"`
		HTTPBody    string            `json:"http_body"`
		TimeoutSecs int               `json:"timeout_secs"`
		MaxRetries  int               `json:"max_retries"`
	}

	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		jsonError(w, "invalid request body", 400)
		return
	}

	if body.Name == "" || body.CronExpr == "" || body.HTTPURL == "" {
		jsonError(w, "name, cron_expr and http_url are required", 400)
		return
	}
	if body.Timezone == "" {
		body.Timezone = "UTC"
	}
	if body.HTTPMethod == "" {
		body.HTTPMethod = "POST"
	}
	if body.TimeoutSecs == 0 {
		body.TimeoutSecs = 30
	}
	if body.MaxRetries == 0 {
		body.MaxRetries = 3
	}

	nextRun, err := h.sched.NextRun(body.CronExpr, body.Timezone)
	if err != nil {
		jsonError(w, "invalid cron_expr: "+err.Error(), 400)
		return
	}

	headers, _ := json.Marshal(body.HTTPHeaders)
	id := uuid.New().String()

	_, err = h.db.Exec(r.Context(), `
		INSERT INTO jobs (
			id, tenant_id, name, cron_expr, timezone,
			http_url, http_method, http_headers, http_body,
			timeout_secs, max_retries, next_run_at
		) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
	`, id, tenantID, body.Name, body.CronExpr, body.Timezone,
		body.HTTPURL, body.HTTPMethod, headers, body.HTTPBody,
		body.TimeoutSecs, body.MaxRetries, nextRun)
	if err != nil {
		jsonError(w, "failed to create job", 500)
		return
	}

	w.WriteHeader(http.StatusCreated)
	jsonOK(w, map[string]string{"id": id, "next_run_at": nextRun.Format(time.RFC3339)})
}

func (h *Handler) GetJob(w http.ResponseWriter, r *http.Request) {
	tenantID := r.Context().Value(tenantKey).(string)
	jobID := chi.URLParam(r, "jobID")

	var job struct {
		ID          string            `json:"id"`
		Name        string            `json:"name"`
		CronExpr    string            `json:"cron_expr"`
		Timezone    string            `json:"timezone"`
		HTTPURL     string            `json:"http_url"`
		HTTPMethod  string            `json:"http_method"`
		HTTPHeaders map[string]string `json:"http_headers"`
		TimeoutSecs int               `json:"timeout_secs"`
		MaxRetries  int               `json:"max_retries"`
		Status      string            `json:"status"`
		NextRunAt   *time.Time        `json:"next_run_at"`
		LastRunAt   *time.Time        `json:"last_run_at"`
		CreatedAt   time.Time         `json:"created_at"`
	}

	err := h.db.QueryRow(r.Context(), `
		SELECT id, name, cron_expr, timezone, http_url, http_method,
		       http_headers, timeout_secs, max_retries,
		       status, next_run_at, last_run_at, created_at
		FROM jobs WHERE id = $1 AND tenant_id = $2
	`, jobID, tenantID).Scan(
		&job.ID, &job.Name, &job.CronExpr, &job.Timezone,
		&job.HTTPURL, &job.HTTPMethod, &job.HTTPHeaders,
		&job.TimeoutSecs, &job.MaxRetries,
		&job.Status, &job.NextRunAt, &job.LastRunAt, &job.CreatedAt,
	)
	if err != nil {
		jsonError(w, "job not found", 404)
		return
	}

	jsonOK(w, job)
}

func (h *Handler) DeleteJob(w http.ResponseWriter, r *http.Request) {
	tenantID := r.Context().Value(tenantKey).(string)
	jobID := chi.URLParam(r, "jobID")

	_, err := h.db.Exec(r.Context(),
		"UPDATE jobs SET status = 'deleted' WHERE id = $1 AND tenant_id = $2",
		jobID, tenantID)
	if err != nil {
		jsonError(w, "failed to delete job", 500)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) PauseJob(w http.ResponseWriter, r *http.Request) {
	tenantID := r.Context().Value(tenantKey).(string)
	jobID := chi.URLParam(r, "jobID")

	_, err := h.db.Exec(r.Context(),
		"UPDATE jobs SET status = 'paused' WHERE id = $1 AND tenant_id = $2",
		jobID, tenantID)
	if err != nil {
		jsonError(w, "failed to pause job", 500)
		return
	}
	jsonOK(w, map[string]string{"status": "paused"})
}

func (h *Handler) ResumeJob(w http.ResponseWriter, r *http.Request) {
	tenantID := r.Context().Value(tenantKey).(string)
	jobID := chi.URLParam(r, "jobID")

	_, err := h.db.Exec(r.Context(),
		"UPDATE jobs SET status = 'active' WHERE id = $1 AND tenant_id = $2",
		jobID, tenantID)
	if err != nil {
		jsonError(w, "failed to resume job", 500)
		return
	}
	jsonOK(w, map[string]string{"status": "active"})
}

func (h *Handler) TriggerJob(w http.ResponseWriter, r *http.Request) {
	tenantID := r.Context().Value(tenantKey).(string)
	jobID := chi.URLParam(r, "jobID")

	runID := uuid.New().String()
	_, err := h.db.Exec(r.Context(), `
		INSERT INTO runs (id, job_id, tenant_id, status, scheduled_at)
		VALUES ($1, $2, $3, 'queued', now())
	`, runID, jobID, tenantID)
	if err != nil {
		jsonError(w, "failed to trigger job", 500)
		return
	}

	_, err = h.db.Exec(r.Context(),
		"INSERT INTO run_queue (run_id, priority) VALUES ($1, 10)", runID)
	if err != nil {
		jsonError(w, "failed to enqueue run", 500)
		return
	}

	w.WriteHeader(http.StatusAccepted)
	jsonOK(w, map[string]string{"run_id": runID})
}

func (h *Handler) ListRuns(w http.ResponseWriter, r *http.Request) {
	tenantID := r.Context().Value(tenantKey).(string)
	jobID := chi.URLParam(r, "jobID")
	limit, offset := parsePageParams(r)

	rows, err := h.db.Query(r.Context(), `
		SELECT id, status, attempt, http_status, duration_ms,
		       scheduled_at, started_at, finished_at, error_msg, created_at
		FROM runs
		WHERE job_id = $1 AND tenant_id = $2
		ORDER BY created_at DESC
		LIMIT $3 OFFSET $4
	`, jobID, tenantID, limit, offset)
	if err != nil {
		jsonError(w, "failed to list runs", 500)
		return
	}
	defer rows.Close()

	type run struct {
		ID          string     `json:"id"`
		Status      string     `json:"status"`
		Attempt     int        `json:"attempt"`
		HTTPStatus  *int       `json:"http_status"`
		DurationMs  *int       `json:"duration_ms"`
		ScheduledAt *time.Time `json:"scheduled_at"`
		StartedAt   *time.Time `json:"started_at"`
		FinishedAt  *time.Time `json:"finished_at"`
		ErrorMsg    *string    `json:"error_msg"`
		CreatedAt   time.Time  `json:"created_at"`
	}

	var runs []run
	for rows.Next() {
		var ru run
		if err := rows.Scan(
			&ru.ID, &ru.Status, &ru.Attempt, &ru.HTTPStatus,
			&ru.DurationMs, &ru.ScheduledAt, &ru.StartedAt,
			&ru.FinishedAt, &ru.ErrorMsg, &ru.CreatedAt,
		); err != nil {
			continue
		}
		runs = append(runs, ru)
	}

	if runs == nil {
		runs = []run{}
	}
	jsonOK(w, runs)
}

func (h *Handler) UpdateJob(w http.ResponseWriter, r *http.Request) {
	tenantID := r.Context().Value(tenantKey).(string)
	jobID := chi.URLParam(r, "jobID")

	var body struct {
		Name        *string            `json:"name"`
		CronExpr    *string            `json:"cron_expr"`
		Timezone    *string            `json:"timezone"`
		HTTPURL     *string            `json:"http_url"`
		HTTPMethod  *string            `json:"http_method"`
		HTTPHeaders map[string]string  `json:"http_headers"`
		HTTPBody    *string            `json:"http_body"`
		TimeoutSecs *int               `json:"timeout_secs"`
		MaxRetries  *int               `json:"max_retries"`
	}

	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		jsonError(w, "invalid request body", 400)
		return
	}

	var nextRun *time.Time
	if body.CronExpr != nil {
		tz := "UTC"
		if body.Timezone != nil {
			tz = *body.Timezone
		}
		nr, err := h.sched.NextRun(*body.CronExpr, tz)
		if err != nil {
			jsonError(w, "invalid cron_expr: "+err.Error(), 400)
			return
		}
		nextRun = &nr
	}

	var headers []byte
	if body.HTTPHeaders != nil {
		headers, _ = json.Marshal(body.HTTPHeaders)
	}

	tag, err := h.db.Exec(r.Context(), `
		UPDATE jobs SET
			name         = COALESCE($1, name),
			cron_expr    = COALESCE($2, cron_expr),
			timezone     = COALESCE($3, timezone),
			http_url     = COALESCE($4, http_url),
			http_method  = COALESCE($5, http_method),
			http_headers = COALESCE($6, http_headers),
			http_body    = COALESCE($7, http_body),
			timeout_secs = COALESCE($8, timeout_secs),
			max_retries  = COALESCE($9, max_retries),
			next_run_at  = COALESCE($10, next_run_at)
		WHERE id = $11 AND tenant_id = $12
	`, body.Name, body.CronExpr, body.Timezone, body.HTTPURL,
		body.HTTPMethod, headers, body.HTTPBody,
		body.TimeoutSecs, body.MaxRetries, nextRun,
		jobID, tenantID)
	if err != nil {
		jsonError(w, "failed to update job", 500)
		return
	}
	if tag.RowsAffected() == 0 {
		jsonError(w, "job not found", 404)
		return
	}

	jsonOK(w, map[string]string{"status": "updated"})
}