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
			w.drain(ctx)
		}
	}
}

func (w *Worker) drain(ctx context.Context) {
	for {
		select {
		case w.sem <- struct{}{}:
			claimed := make(chan bool, 1)
			go func() {
				defer func() { <-w.sem }()
				ok := w.claimAndRun(ctx)
				claimed <- ok
			}()
			if !<-claimed {
				return
			}
		default:
			return
		}
	}
}