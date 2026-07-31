package api

import (
	"net/http"
	"sync"

	"golang.org/x/time/rate"
)

type rateLimiter struct {
	mu       sync.Mutex
	limiters map[string]*rate.Limiter
	rps      rate.Limit
	burst    int
}

func newRateLimiter(rps int) *rateLimiter {
	return &rateLimiter{
		limiters: make(map[string]*rate.Limiter),
		rps:      rate.Limit(rps),
		burst:    rps * 2,
	}
}

func (rl *rateLimiter) get(key string) *rate.Limiter {
	rl.mu.Lock()
	defer rl.mu.Unlock()
	if l, ok := rl.limiters[key]; ok {
		return l
	}
	l := rate.NewLimiter(rl.rps, rl.burst)
	rl.limiters[key] = l
	return l
}

func RateLimitMiddleware(rps int) func(http.Handler) http.Handler {
	rl := newRateLimiter(rps)
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// key on tenant if authenticated, fallback to IP
			key := r.RemoteAddr
			if tid, ok := r.Context().Value(tenantKey).(string); ok && tid != "" {
				key = tid
			}
			if !rl.get(key).Allow() {
				jsonError(w, "rate limit exceeded", http.StatusTooManyRequests)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}
