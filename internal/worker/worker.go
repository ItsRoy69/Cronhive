package worker

import (
	"context"
	"log/slog"
	"net/http"
	"time"

	"github.com/ItsRoy69/cronhive/internal/storage"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Worker struct {
	db         *pgxpool.Pool
	httpClient *http.Client
	concurrent int
	sem        chan struct{}
	uploader   *storage.S3Uploader
}

func New(db *pgxpool.Pool, concurrent int) *Worker {
	return &Worker{
		db:         db,
		httpClient: &http.Client{Timeout: 120 * time.Second},
		concurrent: concurrent,
		sem:        make(chan struct{}, concurrent),
	}
}

func (w *Worker) WithUploader(u *storage.S3Uploader) *Worker {
	w.uploader = u
	return w
}

func (w *Worker) Run(ctx context.Context) {
	slog.Info("worker starting")
	ticker := time.NewTicker(2 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			slog.Info("worker stopping")
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
