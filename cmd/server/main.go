package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"github.com/ItsRoy69/cronhive/internal/config"
	"github.com/ItsRoy69/cronhive/internal/scheduler"
	"github.com/ItsRoy69/cronhive/internal/store"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

func main() {
	cfg := config.Load()
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	log.Println("running migrations...")
	if err := store.RunMigrations(cfg.DatabaseURL); err != nil {
		log.Fatalf("migration error: %v", err)
	}

	pool, err := store.NewPool(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}
	defer pool.Close()
	log.Println("connected to database")

	if err := store.Seed(ctx, pool); err != nil {
		log.Printf("seed warning: %v", err)
	}

	sched := scheduler.New(pool)
	go sched.Run(ctx)

	r := chi.NewRouter()
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"ok"}`))
	})

	go func() {
		addr := fmt.Sprintf(":%s", cfg.Port)
		log.Printf("server starting on %s", addr)
		if err := http.ListenAndServe(addr, r); err != nil {
			log.Fatalf("server failed: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("shutting down...")
	cancel()
}