package store

import (
	"context"
	"crypto/sha256"
	"fmt"
	"log"

	"github.com/jackc/pgx/v5/pgxpool"
)

const DevAPIKey = "ch_dev_key_cronhive_local"

func Seed(ctx context.Context, db *pgxpool.Pool) error {
	var count int
	db.QueryRow(ctx, "SELECT COUNT(*) FROM tenants").Scan(&count)
	if count > 0 {
		log.Println("database already seeded, skipping")
		return nil
	}

	hash := fmt.Sprintf("%x", sha256.Sum256([]byte(DevAPIKey)))

	_, err := db.Exec(ctx, `
		INSERT INTO tenants (id, name, plan)
		VALUES ('00000000-0000-0000-0000-000000000001', 'dev-tenant', 'free')
	`)
	if err != nil {
		return fmt.Errorf("insert tenant: %w", err)
	}

	_, err = db.Exec(ctx, `
		INSERT INTO api_keys (tenant_id, key_hash, label)
		VALUES ('00000000-0000-0000-0000-000000000001', $1, 'dev key')
	`, hash)
	if err != nil {
		return fmt.Errorf("insert api_key: %w", err)
	}

	_, err = db.Exec(ctx, `
		INSERT INTO jobs (
			tenant_id, name, cron_expr, timezone,
			http_url, http_method, next_run_at
		) VALUES (
			'00000000-0000-0000-0000-000000000001',
			'test-job',
			'* * * * *',
			'UTC',
			'https://httpbin.org/post',
			'POST',
			now()
		)
	`)
	if err != nil {
		return fmt.Errorf("insert job: %w", err)
	}

	log.Printf("database seeded — dev API key: %s", DevAPIKey)
	return nil
}