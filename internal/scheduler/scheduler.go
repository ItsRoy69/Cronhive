package scheduler

import (
	"context"
	"log"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/robfig/cron/v3"
)

const leaderLockKey = 7482901

type Scheduler struct {
	db     *pgxpool.Pool
	parser cron.Parser
}

func New(db *pgxpool.Pool) *Scheduler {
	return &Scheduler{
		db: db,
		parser: cron.NewParser(
			cron.Minute | cron.Hour | cron.Dom | cron.Month | cron.Dow,
		),
	}
}

func (s *Scheduler) Run(ctx context.Context) {
	log.Println("scheduler starting...")

	conn, err := s.acquireLeader(ctx)
	if err != nil {
		log.Printf("scheduler: failed to acquire leader lock: %v", err)
		return
	}
	defer func() {
		_, _ = conn.Exec(context.Background(), "SELECT pg_advisory_unlock($1)", leaderLockKey)
		conn.Release()
		log.Println("scheduler: released leader lock")
	}()

	log.Println("scheduler: acquired leader lock")

	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			log.Println("scheduler stopping")
			return
		case <-ticker.C:
			if err := s.pollAndDispatch(ctx); err != nil {
				log.Printf("scheduler poll error: %v", err)
			}
		}
	}
}

func (s *Scheduler) acquireLeader(ctx context.Context) (*pgxpool.Conn, error) {
	conn, err := s.db.Acquire(ctx)
	if err != nil {
		return nil, err
	}

	for {
		var acquired bool
		err := conn.QueryRow(ctx,
			"SELECT pg_try_advisory_lock($1)", leaderLockKey,
		).Scan(&acquired)
		if err != nil {
			conn.Release()
			return nil, err
		}
		if acquired {
			return conn, nil
		}

		select {
		case <-ctx.Done():
			conn.Release()
			return nil, ctx.Err()
		case <-time.After(2 * time.Second):
		}
	}
}