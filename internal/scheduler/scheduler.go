package scheduler

import (
	"context"
	"log"
	"time"

	"github.com/ItsRoy69/cronhive/internal/store"
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
	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			log.Println("scheduler stopping")
			return
		case <-ticker.C:
			if s.tryAcquireLeader(ctx) {
				if err := s.pollAndDispatch(ctx); err != nil {
					log.Printf("scheduler poll error: %v", err)
				}
			}
		}
	}
}

func (s *Scheduler) tryAcquireLeader(ctx context.Context) bool {
	var acquired bool
	err := s.db.QueryRow(ctx,
		"SELECT pg_try_advisory_lock($1)", leaderLockKey,
	).Scan(&acquired)
	if err != nil {
		log.Printf("leader election error: %v", err)
		return false
	}
	return acquired
}