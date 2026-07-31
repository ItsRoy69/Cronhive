package main

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/ItsRoy69/cronhive/internal/alerter"
	"github.com/ItsRoy69/cronhive/internal/api"
	"github.com/ItsRoy69/cronhive/internal/config"
	"github.com/ItsRoy69/cronhive/internal/metrics"
	"github.com/ItsRoy69/cronhive/internal/scheduler"
	"github.com/ItsRoy69/cronhive/internal/storage"
	"github.com/ItsRoy69/cronhive/internal/store"
	"github.com/ItsRoy69/cronhive/internal/worker"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

func main() {
	subcmd := "serve"
	if len(os.Args) > 1 {
		subcmd = os.Args[1]
	}

	cfg := config.Load()
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	switch subcmd {
	case "migrate":
		runMigrate(cfg)
	case "seed":
		runSeed(ctx, cfg)
	case "serve":
		runServe(ctx, cancel, cfg)
	default:
		fmt.Fprintf(os.Stderr, "unknown subcommand: %s\nusage: server [migrate|seed|serve]\n", subcmd)
		os.Exit(1)
	}
}

func runMigrate(cfg *config.Config) {
	if err := store.RunMigrations(cfg.DatabaseURL); err != nil {
		slog.Error("migration failed", "err", err)
		os.Exit(1)
	}
	slog.Info("migrations applied")
}

func runSeed(ctx context.Context, cfg *config.Config) {
	pool, err := store.NewPool(ctx, cfg.DatabaseURL)
	if err != nil {
		slog.Error("db connect failed", "err", err)
		os.Exit(1)
	}
	defer pool.Close()
	if err := store.Seed(ctx, pool); err != nil {
		slog.Error("seed failed", "err", err)
		os.Exit(1)
	}
}

func runServe(ctx context.Context, cancel context.CancelFunc, cfg *config.Config) {
	slog.Info("running migrations")
	if err := store.RunMigrations(cfg.DatabaseURL); err != nil {
		slog.Error("migration error", "err", err)
		os.Exit(1)
	}

	pool, err := store.NewPool(ctx, cfg.DatabaseURL)
	if err != nil {
		slog.Error("failed to connect to database", "err", err)
		os.Exit(1)
	}
	defer pool.Close()
	slog.Info("connected to database")

	metrics.StartQueueDepthPoller(ctx, pool)

	if err := store.Seed(ctx, pool); err != nil {
		slog.Warn("seed warning", "err", err)
	}

	sched := scheduler.New(pool)
	go sched.Run(ctx)

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
	go w.Run(ctx)

	a := alerter.New(pool, cfg)
	go a.Listen(ctx)

	h := api.NewHandler(pool, sched, cfg.JWTSecret)

	allowedOrigins := strings.Split(cfg.AllowedOrigins, ",")

	r := chi.NewRouter()
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   allowedOrigins,
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		if err := pool.Ping(r.Context()); err != nil {
			w.WriteHeader(http.StatusServiceUnavailable)
			w.Write([]byte(`{"status":"unhealthy","error":"db unreachable"}`))
			return
		}
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"ok"}`))
	})
	r.Handle("/metrics", promhttp.Handler())

	// Public auth routes
	r.Route("/api/v1/auth", func(r chi.Router) {
		r.Post("/signup", h.Signup)
		r.Post("/login", h.Login)
	})

	r.Route("/api/v1", func(r chi.Router) {
		r.Use(api.AuthMiddleware(pool, cfg.JWTSecret))
		r.Use(api.RateLimitMiddleware(cfg.RateLimitRPS))

		r.Route("/jobs", func(r chi.Router) {
			r.Get("/", h.ListJobs)
			r.Post("/", h.CreateJob)
			r.Get("/{jobID}", h.GetJob)
			r.Put("/{jobID}", h.UpdateJob)
			r.Delete("/{jobID}", h.DeleteJob)
			r.Post("/{jobID}/pause", h.PauseJob)
			r.Post("/{jobID}/resume", h.ResumeJob)
			r.Post("/{jobID}/trigger", h.TriggerJob)
			r.Get("/{jobID}/runs", h.ListRuns)
		})

		r.Route("/runs", func(r chi.Router) {
			r.Get("/{runID}", h.GetRun)
			r.Get("/{runID}/logs", h.GetRunLogs)
		})

		r.Route("/alerts", func(r chi.Router) {
			r.Get("/", h.ListAlertConfigs)
			r.Post("/", h.CreateAlertConfig)
			r.Get("/{configID}", h.GetAlertConfig)
			r.Put("/{configID}", h.UpdateAlertConfig)
			r.Delete("/{configID}", h.DeleteAlertConfig)
		})

		r.Route("/keys", func(r chi.Router) {
			r.Get("/", h.ListAPIKeys)
			r.Post("/", h.CreateAPIKey)
			r.Delete("/{keyID}", h.RevokeAPIKey)
		})
	})

	srv := &http.Server{
		Addr:         fmt.Sprintf(":%s", cfg.Port),
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 60 * time.Second,
		IdleTimeout:  120 * time.Second,
	}

	go func() {
		slog.Info("server starting", "addr", srv.Addr)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			slog.Error("server error", "err", err)
			os.Exit(1)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	slog.Info("shutting down...")
	cancel()

	shutCtx, shutCancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer shutCancel()
	if err := srv.Shutdown(shutCtx); err != nil {
		slog.Error("forced shutdown", "err", err)
	}
	slog.Info("server stopped")
}
