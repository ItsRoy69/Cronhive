package metrics

import (
	"context"
	"log/slog"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
)

var (
	RunsTotal = promauto.NewCounterVec(prometheus.CounterOpts{
		Name: "cronhive_runs_total",
		Help: "Total runs by status",
	}, []string{"status"})

	QueueDepth = promauto.NewGauge(prometheus.GaugeOpts{
		Name: "cronhive_queue_depth",
		Help: "Current run_queue depth",
	})

	RunDurationMs = promauto.NewHistogramVec(prometheus.HistogramOpts{
		Name:    "cronhive_run_duration_ms",
		Help:    "Run execution duration in milliseconds",
		Buckets: prometheus.ExponentialBuckets(50, 2, 12),
	}, []string{"status"})
)

func StartQueueDepthPoller(ctx context.Context, db *pgxpool.Pool) {
	go func() {
		ticker := time.NewTicker(15 * time.Second)
		defer ticker.Stop()
		for {
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
				var count float64
				if err := db.QueryRow(ctx, "SELECT COUNT(*) FROM run_queue").Scan(&count); err != nil {
					slog.Warn("queue depth poll failed", "err", err)
					continue
				}
				QueueDepth.Set(count)
			}
		}
	}()
}
