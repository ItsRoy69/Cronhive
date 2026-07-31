package worker

import (
	"testing"
	"time"
)

func TestBackoffDelay_Fixed(t *testing.T) {
	for attempt := 0; attempt < 5; attempt++ {
		got := backoffDelay("fixed", attempt)
		if got != 30*time.Second {
			t.Errorf("fixed attempt %d: got %v, want 30s", attempt, got)
		}
	}
}

func TestBackoffDelay_Linear(t *testing.T) {
	cases := []struct {
		attempt int
		want    time.Duration
	}{
		{0, 30 * time.Second},
		{1, 60 * time.Second},
		{2, 90 * time.Second},
		{3, 120 * time.Second},
	}
	for _, tc := range cases {
		got := backoffDelay("linear", tc.attempt)
		if got != tc.want {
			t.Errorf("linear attempt %d: got %v, want %v", tc.attempt, got, tc.want)
		}
	}
}

func TestBackoffDelay_Exponential(t *testing.T) {
	cases := []struct {
		attempt int
		want    time.Duration
	}{
		{0, 30 * time.Second},
		{1, 60 * time.Second},
		{2, 120 * time.Second},
		{3, 240 * time.Second},
	}
	for _, tc := range cases {
		got := backoffDelay("exponential", tc.attempt)
		if got != tc.want {
			t.Errorf("exponential attempt %d: got %v, want %v", tc.attempt, got, tc.want)
		}
	}
}

func TestBackoffDelay_DefaultIsExponential(t *testing.T) {
	// empty string and unknown strategy default to exponential
	for _, strategy := range []string{"", "unknown"} {
		got := backoffDelay(strategy, 2)
		want := backoffDelay("exponential", 2)
		if got != want {
			t.Errorf("strategy %q attempt 2: got %v, want %v (exponential)", strategy, got, want)
		}
	}
}

func TestTruncate(t *testing.T) {
	cases := []struct {
		input string
		n     int
		want  string
	}{
		{"hello", 10, "hello"},
		{"hello world", 5, "hello..."},
		{"", 5, ""},
	}
	for _, tc := range cases {
		got := truncate(tc.input, tc.n)
		if got != tc.want {
			t.Errorf("truncate(%q, %d) = %q, want %q", tc.input, tc.n, got, tc.want)
		}
	}
}
