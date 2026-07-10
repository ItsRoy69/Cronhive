package scheduler

import (
	"context"
	"log"
	"time"

	"github.com/google/uuid"
)

func (s *Scheduler) pollAndDispatch(ctx context.Context) error {
	now := time.Now().UTC()

	rows, err := s.db.Query(ctx, `
		SELECT id, cron_expr, timezone, tenant_id
		FROM jobs
		WHERE status = 'active'
		  AND next_run_at <= $1
		ORDER BY next_run_at
		LIMIT 100
		FOR UPDATE SKIP LOCKED
	`, now)
	if err != nil {
		return err
	}
	defer rows.Close()

	type jobRow struct {
		id       string
		cronExpr string
		timezone string
		tenantID string
	}

	var jobs []jobRow
	for rows.Next() {
		var j jobRow
		if err := rows.Scan(&j.id, &j.cronExpr, &j.timezone, &j.tenantID); err != nil {
			log.Printf("scan error: %v", err)
			continue
		}
		jobs = append(jobs, j)
	}
	rows.Close()

	for _, j := range jobs {
		nextRun, err := s.nextRun(j.cronExpr, j.timezone)
		if err != nil {
			log.Printf("next run calc error for job %s: %v", j.id, err)
			continue
		}

		if err := s.enqueue(ctx, j.id, j.tenantID, nextRun, now); err != nil {
			log.Printf("enqueue error for job %s: %v", j.id, err)
			continue
		}

		log.Printf("dispatched job %s, next run at %s", j.id, nextRun.Format(time.RFC3339))
	}

	return nil
}

func (s *Scheduler) enqueue(ctx context.Context, jobID, tenantID string, nextRun, scheduledAt time.Time) error {
	tx, err := s.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	runID := uuid.New().String()

	_, err = tx.Exec(ctx, `
		INSERT INTO runs (id, job_id, tenant_id, status, scheduled_at)
		VALUES ($1, $2, $3, 'queued', $4)
	`, runID, jobID, tenantID, scheduledAt)
	if err != nil {
		return err
	}

	_, err = tx.Exec(ctx, `
		INSERT INTO run_queue (run_id, priority, visible_at)
		VALUES ($1, 0, now())
	`, runID)
	if err != nil {
		return err
	}

	_, err = tx.Exec(ctx, `
		UPDATE jobs
		SET last_run_at = $1, next_run_at = $2
		WHERE id = $3
	`, scheduledAt, nextRun, jobID)
	if err != nil {
		return err
	}

	return tx.Commit(ctx)
}