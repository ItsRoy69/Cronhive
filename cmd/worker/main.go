package main

import (
	"context"
	"log/slog"
	"os"
	"os/signal"
	"syscall"

	"github.com/ItsRoy69/cronhive/internal/config"
	"github.com/ItsRoy69/cronhive/internal/storage"
	"github.com/ItsRoy69/cronhive/internal/store"
	"github.com/ItsRoy69/cronhive/internal/worker"
)

func main() {
	cfg := config.Load()
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	pool, err := store.NewPool(ctx, cfg.DatabaseURL)
	if err != nil {
		slog.Error("db connect failed", "err", err)
		os.Exit(1)
	}
	defer pool.Close()

	w := worker.New(pool, 10)
	if cfg.S3Endpoint != "" {
		uploader, err := storage.NewS3Uploader(cfg.S3Endpoint, cfg.S3Bucket, cfg.S3AccessKey, cfg.S3SecretKey)
		if err != nil {
			slog.Warn("s3 uploader init failed, logs stored inline", "err", err)
		} else {
			w = w.WithUploader(uploader)
			slog.Info("s3 log uploader enabled", "bucket", cfg.S3Bucket)
		}
	}

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	go func() {
		<-quit
		slog.Info("worker shutting down")
		cancel()
	}()

	w.Run(ctx)
}
