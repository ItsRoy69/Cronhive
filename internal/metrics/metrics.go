package metrics

import (
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
