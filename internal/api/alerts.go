package api

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

func (h *Handler) ListAlertConfigs(w http.ResponseWriter, r *http.Request) {
	tenantID := r.Context().Value(tenantKey).(string)

	rows, err := h.db.Query(r.Context(), `
		SELECT id, job_id, on_failure, on_dead, on_recovery,
		       slack_url, email, webhook_url, created_at
		FROM alert_configs
		WHERE tenant_id = $1
		ORDER BY created_at DESC
	`, tenantID)
	if err != nil {
		jsonError(w, "failed to list alert configs", 500)
		return
	}
	defer rows.Close()

	type alertConfig struct {
		ID         string     `json:"id"`
		JobID      *string    `json:"job_id"`
		OnFailure  bool       `json:"on_failure"`
		OnDead     bool       `json:"on_dead"`
		OnRecovery bool       `json:"on_recovery"`
		SlackURL   *string    `json:"slack_url"`
		Email      *string    `json:"email"`
		WebhookURL *string    `json:"webhook_url"`
		CreatedAt  time.Time  `json:"created_at"`
	}

	var configs []alertConfig
	for rows.Next() {
		var c alertConfig
		if err := rows.Scan(
			&c.ID, &c.JobID, &c.OnFailure, &c.OnDead, &c.OnRecovery,
			&c.SlackURL, &c.Email, &c.WebhookURL, &c.CreatedAt,
		); err != nil {
			continue
		}
		configs = append(configs, c)
	}

	if configs == nil {
		configs = []alertConfig{}
	}
	jsonOK(w, configs)
}

func (h *Handler) CreateAlertConfig(w http.ResponseWriter, r *http.Request) {
	tenantID := r.Context().Value(tenantKey).(string)

	var body struct {
		JobID      *string `json:"job_id"`
		OnFailure  *bool   `json:"on_failure"`
		OnDead     *bool   `json:"on_dead"`
		OnRecovery *bool   `json:"on_recovery"`
		SlackURL   *string `json:"slack_url"`
		Email      *string `json:"email"`
		WebhookURL *string `json:"webhook_url"`
	}

	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		jsonError(w, "invalid request body", 400)
		return
	}

	onFailure := true
	if body.OnFailure != nil {
		onFailure = *body.OnFailure
	}
	onDead := true
	if body.OnDead != nil {
		onDead = *body.OnDead
	}
	onRecovery := false
	if body.OnRecovery != nil {
		onRecovery = *body.OnRecovery
	}

	id := uuid.New().String()
	_, err := h.db.Exec(r.Context(), `
		INSERT INTO alert_configs (id, tenant_id, job_id, on_failure, on_dead, on_recovery, slack_url, email, webhook_url)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
	`, id, tenantID, body.JobID, onFailure, onDead, onRecovery, body.SlackURL, body.Email, body.WebhookURL)
	if err != nil {
		jsonError(w, "failed to create alert config", 500)
		return
	}

	w.WriteHeader(http.StatusCreated)
	jsonOK(w, map[string]string{"id": id})
}

func (h *Handler) GetAlertConfig(w http.ResponseWriter, r *http.Request) {
	tenantID := r.Context().Value(tenantKey).(string)
	configID := chi.URLParam(r, "configID")

	var config struct {
		ID         string    `json:"id"`
		JobID      *string   `json:"job_id"`
		OnFailure  bool      `json:"on_failure"`
		OnDead     bool      `json:"on_dead"`
		OnRecovery bool      `json:"on_recovery"`
		SlackURL   *string   `json:"slack_url"`
		Email      *string   `json:"email"`
		WebhookURL *string   `json:"webhook_url"`
		CreatedAt  time.Time `json:"created_at"`
	}

	err := h.db.QueryRow(r.Context(), `
		SELECT id, job_id, on_failure, on_dead, on_recovery,
		       slack_url, email, webhook_url, created_at
		FROM alert_configs
		WHERE id = $1 AND tenant_id = $2
	`, configID, tenantID).Scan(
		&config.ID, &config.JobID, &config.OnFailure, &config.OnDead, &config.OnRecovery,
		&config.SlackURL, &config.Email, &config.WebhookURL, &config.CreatedAt,
	)
	if err != nil {
		jsonError(w, "alert config not found", 404)
		return
	}

	jsonOK(w, config)
}

func (h *Handler) UpdateAlertConfig(w http.ResponseWriter, r *http.Request) {
	tenantID := r.Context().Value(tenantKey).(string)
	configID := chi.URLParam(r, "configID")

	var body struct {
		OnFailure  *bool   `json:"on_failure"`
		OnDead     *bool   `json:"on_dead"`
		OnRecovery *bool   `json:"on_recovery"`
		SlackURL   *string `json:"slack_url"`
		Email      *string `json:"email"`
		WebhookURL *string `json:"webhook_url"`
	}

	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		jsonError(w, "invalid request body", 400)
		return
	}

	tag, err := h.db.Exec(r.Context(), `
		UPDATE alert_configs SET
			on_failure  = COALESCE($1, on_failure),
			on_dead     = COALESCE($2, on_dead),
			on_recovery = COALESCE($3, on_recovery),
			slack_url   = COALESCE($4, slack_url),
			email       = COALESCE($5, email),
			webhook_url = COALESCE($6, webhook_url)
		WHERE id = $7 AND tenant_id = $8
	`, body.OnFailure, body.OnDead, body.OnRecovery, body.SlackURL, body.Email, body.WebhookURL, configID, tenantID)
	if err != nil {
		jsonError(w, "failed to update alert config", 500)
		return
	}
	if tag.RowsAffected() == 0 {
		jsonError(w, "alert config not found", 404)
		return
	}

	jsonOK(w, map[string]string{"status": "updated"})
}

func (h *Handler) DeleteAlertConfig(w http.ResponseWriter, r *http.Request) {
	tenantID := r.Context().Value(tenantKey).(string)
	configID := chi.URLParam(r, "configID")

	_, err := h.db.Exec(r.Context(),
		"DELETE FROM alert_configs WHERE id = $1 AND tenant_id = $2",
		configID, tenantID)
	if err != nil {
		jsonError(w, "failed to delete alert config", 500)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
