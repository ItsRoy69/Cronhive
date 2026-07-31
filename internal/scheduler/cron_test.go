package scheduler

import (
	"testing"
	"time"
)

func newTestScheduler() *Scheduler {
	return New(nil)
}

func TestNextRun_EveryMinute(t *testing.T) {
	s := newTestScheduler()
	next, err := s.NextRun("* * * * *", "UTC")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if next.Before(time.Now()) {
		t.Error("next run should be in the future")
	}
	if next.After(time.Now().Add(61 * time.Second)) {
		t.Error("next run should be within the next minute")
	}
}

func TestNextRun_InvalidExpression(t *testing.T) {
	s := newTestScheduler()
	_, err := s.NextRun("not-a-cron", "UTC")
	if err == nil {
		t.Error("expected error for invalid cron expression")
	}
}

func TestNextRun_InvalidTimezoneDefaultsUTC(t *testing.T) {
	s := newTestScheduler()
	next, err := s.NextRun("* * * * *", "Bad/Zone")
	if err != nil {
		t.Fatalf("invalid timezone should fall back to UTC, got error: %v", err)
	}
	if next.IsZero() {
		t.Error("expected non-zero time")
	}
}

func TestNextRun_FutureResult(t *testing.T) {
	s := newTestScheduler()
	// "0 0 1 1 *" = once a year on Jan 1
	next, err := s.NextRun("0 0 1 1 *", "UTC")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !next.After(time.Now()) {
		t.Error("next run should be in the future")
	}
}

func TestNextRun_Timezone(t *testing.T) {
	s := newTestScheduler()
	utcNext, _ := s.NextRun("0 12 * * *", "UTC")
	nyNext, _ := s.NextRun("0 12 * * *", "America/New_York")

	// NY is UTC-4 or UTC-5 depending on DST, so UTC 12:00 and NY 12:00 differ
	diff := utcNext.Sub(nyNext)
	if diff == 0 {
		t.Error("UTC and New_York runs should differ for 'noon daily' cron")
	}
}
