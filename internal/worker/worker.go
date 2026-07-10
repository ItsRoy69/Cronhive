package worker

import (
	"context"
	"log"
	"net/http"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Worker struct {
	db         *pgxpool.Pool
	httpClient *http.Client
	concurrent int
	sem        chan struct{}
}

func New(db *pgxpool.Pool, concurrent int) *Worker {
	return &Worker{
		db: db,
		httpClient: &http.Client{
			Timeout: 120 * time.Second,
		},
		concurrent: concurrent,
		sem:        make(chan struct{}, concurrent),
	}
}

func (w *Worker) Run(ctx context.Context) {
	log.Println("worker starting...")
	ticker := time.NewTicker(2 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			log.Println("worker stopping")
			return
		case <-ticker.C:
			w.sem <- struct{}{}
			go func() {
				defer func() { <-w.sem }()
				w.claimAndRun(ctx)
			}()
		}
	}
}