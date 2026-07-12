package alerter

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Alerter struct {
	db         *pgxpool.Pool
	httpClient *http.Client
}

func New(db *pgxpool.Pool) *Alerter {
	return &Alerter{
		db: db,
		httpClient: &http.Client{Timeout: 10 * time.Second},
	}
}

type runEvent struct {
	Event string `json:"event"`
	RunID string `json:"run_id"`
}

type alertConfig struct {
	SlackURL   *string
	Email      *string
	WebhookURL *string
}

func (a *Alerter) Listen(ctx context.Context) {
	log.Println("alerter starting...")

	conn, err := a.db.Acquire(ctx)
	if err != nil {
		log.Printf("alerter failed to acquire connection: %v", err)
		return
	}
	defer conn.Release()

	if _, err := conn.Exec(ctx, "LISTEN run_events"); err != nil {
		log.Printf("alerter LISTEN failed: %v", err)
		return
	}

	for {
		notification, err := conn.Conn().WaitForNotification(ctx)
		if err != nil {
			if ctx.Err() != nil {
				return
			}
			log.Printf("alerter notification error: %v", err)
			return
		}

		var event runEvent
		if err := json.Unmarshal([]byte(notification.Payload), &event); err != nil {
			log.Printf("alerter failed to parse event: %v", err)
			continue
		}

		go a.handleEvent(ctx, event)
	}
}

func (a *Alerter) handleEvent(ctx context.Context, event runEvent) {
	configs, err := a.loadConfigs(ctx, event.RunID)
	if err != nil {
		log.Printf("alerter failed to load configs for run %s: %v", event.RunID, err)
		return
	}

	for _, cfg := range configs {
		if cfg.SlackURL != nil {
			a.sendSlack(ctx, *cfg.SlackURL, event)
		}
		if cfg.WebhookURL != nil {
			a.sendWebhook(ctx, *cfg.WebhookURL, event)
		}
	}
}

func (a *Alerter) loadConfigs(ctx context.Context, runID string) ([]alertConfig, error) {
	rows, err := a.db.Query(ctx, `
		SELECT ac.slack_url, ac.email, ac.webhook_url
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
		if err := rows.Scan(&cfg.SlackURL, &cfg.Email, &cfg.WebhookURL); err != nil {
			continue
		}
		configs = append(configs, cfg)
	}
	return configs, nil
}

func (a *Alerter) sendSlack(ctx context.Context, webhookURL string, event runEvent) {
	emoji := "✅"
	if event.Event == "run.failed" || event.Event == "run.dead" {
		emoji = "🔴"
	}

	payload := map[string]string{
		"text": fmt.Sprintf("%s CronHive: `%s` — run `%s`",
			emoji, event.Event, event.RunID),
	}

	body, _ := json.Marshal(payload)
	req, err := http.NewRequestWithContext(ctx, "POST", webhookURL, bytes.NewReader(body))
	if err != nil {
		log.Printf("slack request build error: %v", err)
		return
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := a.httpClient.Do(req)
	if err != nil {
		log.Printf("slack send error: %v", err)
		return
	}
	defer resp.Body.Close()
	log.Printf("slack alert sent for run %s (%d)", event.RunID, resp.StatusCode)
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
		log.Printf("webhook send error: %v", err)
		return
	}
	defer resp.Body.Close()
	log.Printf("webhook alert sent for run %s (%d)", event.RunID, resp.StatusCode)
}