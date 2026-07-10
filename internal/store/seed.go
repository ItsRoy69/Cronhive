package store

import (
	"context"
	"log"

	"github.com/jackc/pgx/v5/pgxpool"
)

func Seed(ctx context.Context, db *pgxpool.Pool) error {
	var count int
	db.QueryRow(ctx, "SELECT COUNT(*) FROM tenants").Scan(&count)
	if count > 0 {
		log.Println("database already seeded, skipping")
		return nil
	}

	_, err := db.Exec(ctx, `
		INSERT INTO tenants (id, name, plan)
		VALUES ('00000000-0000-0000-0000-000000000001', 'dev-tenant', 'free');

		INSERT INTO api_keys (tenant_id, key_hash, label)
		VALUES (
			'00000000-0000-0000-0000-000000000001',
			'dev-key-hash-not-for-production',
			'dev key'
		);

		INSERT INTO jobs (
			tenant_id, name, cron_expr, timezone,
			http_url, http_method, next_run_at
		) VALUES (
			'00000000-0000-0000-0000-000000000001',
			'test-job',
			'* * * * *',
			'UTC',
			'https://webhook.site/test',
			'POST',
			now()
		);
	`)
	if err != nil {
		return err
	}

	log.Println("database seeded successfully")
	return nil
}