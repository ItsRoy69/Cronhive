package alerter

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"net/smtp"
	"strings"
	"time"

	"github.com/ItsRoy69/cronhive/internal/config"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Alerter struct {
	db         *pgxpool.Pool
	cfg        *config.Config
	httpClient *http.Client
}

func New(db *pgxpool.Pool, cfg *config.Config) *Alerter {
	return &Alerter{
		db:         db,
		cfg:        cfg,
		httpClient: &http.Client{Timeout: 10 * time.Second},
	}
}

type runEvent struct {
	Event string `json:"event"`
	RunID string `json:"run_id"`
}

type alertConfig struct {
	OnFailure  bool
	OnDead     bool
	OnRecovery bool
	SlackURL   *string
	Email      *string
	WebhookURL *string
}

func (a *Alerter) Listen(ctx context.Context) {
	slog.Info("alerter starting")

	conn, err := a.db.Acquire(ctx)
	if err != nil {
		slog.Error("alerter failed to acquire connection", "err", err)
		return
	}
	defer conn.Release()

	if _, err := conn.Exec(ctx, "LISTEN run_events"); err != nil {
		slog.Error("alerter LISTEN failed", "err", err)
		return
	}

	for {
		notification, err := conn.Conn().WaitForNotification(ctx)
		if err != nil {
			if ctx.Err() != nil {
				return
			}
			slog.Error("alerter notification error", "err", err)
			return
		}

		var event runEvent
		if err := json.Unmarshal([]byte(notification.Payload), &event); err != nil {
			slog.Error("alerter failed to parse event", "err", err)
			continue
		}

		go a.handleEvent(ctx, event)
	}
}

func (a *Alerter) handleEvent(ctx context.Context, event runEvent) {
	configs, err := a.loadConfigs(ctx, event.RunID)
	if err != nil {
		slog.Error("alerter failed to load configs", "run_id", event.RunID, "err", err)
		return
	}

	// Promote run.success → run.recovery if previous run was failed/dead
	if event.Event == "run.success" && a.isRecovery(ctx, event.RunID) {
		event.Event = "run.recovery"
	}

	for _, cfg := range configs {
		switch event.Event {
		case "run.failure":
			if !cfg.OnFailure {
				continue
			}
		case "run.dead":
			if !cfg.OnDead {
				continue
			}
		case "run.recovery":
			if !cfg.OnRecovery {
				continue
			}
		}

		if cfg.SlackURL != nil {
			a.sendSlack(ctx, *cfg.SlackURL, event)
		}
		if cfg.WebhookURL != nil {
			a.sendWebhook(ctx, *cfg.WebhookURL, event)
		}
		if cfg.Email != nil && a.cfg.SMTPHost != "" {
			a.sendEmail(*cfg.Email, event)
		}
	}
}

func (a *Alerter) isRecovery(ctx context.Context, runID string) bool {
	var jobID string
	if err := a.db.QueryRow(ctx, "SELECT job_id FROM runs WHERE id = $1", runID).Scan(&jobID); err != nil {
		return false
	}

	var prevStatus string
	err := a.db.QueryRow(ctx, `
		SELECT status FROM runs
		WHERE job_id = $1 AND id != $2
		ORDER BY created_at DESC LIMIT 1
	`, jobID, runID).Scan(&prevStatus)
	return err == nil && (prevStatus == "failed" || prevStatus == "dead")
}

func (a *Alerter) loadConfigs(ctx context.Context, runID string) ([]alertConfig, error) {
	rows, err := a.db.Query(ctx, `
		SELECT ac.on_failure, ac.on_dead, ac.on_recovery,
		       ac.slack_url, ac.email, ac.webhook_url
		FROM alert_configs ac
		JOIN runs r ON r.tenant_id = ac.tenant_id
		WHERE r.id = $1
		  AND (ac.job_id IS NULL OR ac.job_id = r.job_id)
	`, runID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var configs []alertConfig
	for rows.Next() {
		var cfg alertConfig
		if err := rows.Scan(
			&cfg.OnFailure, &cfg.OnDead, &cfg.OnRecovery,
			&cfg.SlackURL, &cfg.Email, &cfg.WebhookURL,
		); err != nil {
			continue
		}
		configs = append(configs, cfg)
	}
	return configs, nil
}

func (a *Alerter) sendSlack(ctx context.Context, webhookURL string, event runEvent) {
	emoji := "✅"
	if event.Event == "run.failure" || event.Event == "run.dead" {
		emoji = "🔴"
	} else if event.Event == "run.recovery" {
		emoji = "🟢"
	}

	payload := map[string]string{
		"text": fmt.Sprintf("%s CronHive: `%s` — run `%s`", emoji, event.Event, event.RunID),
	}

	body, _ := json.Marshal(payload)
	req, err := http.NewRequestWithContext(ctx, "POST", webhookURL, bytes.NewReader(body))
	if err != nil {
		slog.Error("slack request build error", "err", err)
		return
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := a.httpClient.Do(req)
	if err != nil {
		slog.Error("slack send error", "err", err)
		return
	}
	defer resp.Body.Close()
	slog.Info("slack alert sent", "run_id", event.RunID, "status", resp.StatusCode)
}

func (a *Alerter) sendWebhook(ctx context.Context, webhookURL string, event runEvent) {
	body, _ := json.Marshal(event)
	req, err := http.NewRequestWithContext(ctx, "POST", webhookURL, bytes.NewReader(body))
	if err != nil {
		return
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Cronhive-Event", event.Event)

	resp, err := a.httpClient.Do(req)
	if err != nil {
		slog.Error("webhook send error", "err", err)
		return
	}
	defer resp.Body.Close()
	slog.Info("webhook alert sent", "run_id", event.RunID, "status", resp.StatusCode)
}

func (a *Alerter) sendEmail(to string, event runEvent) {
	subject := fmt.Sprintf("CronHive: %s — run %s", event.Event, event.RunID)
	body := strings.Join([]string{
		"From: " + a.cfg.SMTPFrom,
		"To: " + to,
		"Subject: " + subject,
		"",
		fmt.Sprintf("Event: %s\nRun ID: %s", event.Event, event.RunID),
	}, "\r\n")

	addr := fmt.Sprintf("%s:%s", a.cfg.SMTPHost, a.cfg.SMTPPort)
	var auth smtp.Auth
	if a.cfg.SMTPUser != "" {
		auth = smtp.PlainAuth("", a.cfg.SMTPUser, a.cfg.SMTPPass, a.cfg.SMTPHost)
	}

	if err := smtp.SendMail(addr, auth, a.cfg.SMTPFrom, []string{to}, []byte(body)); err != nil {
		slog.Error("email send error", "to", to, "err", err)
		return
	}
	slog.Info("email alert sent", "to", to, "event", event.Event)
}
