package middleware

import (
	"net/http"
	"sync"
	"time"
)

type RateLimiter struct {
	requests map[string][]time.Time
	mu       sync.RWMutex
	limit    int
	window   time.Duration
}

func NewRateLimiter(limit int, window time.Duration) *RateLimiter {
	return &RateLimiter{
		requests: make(map[string][]time.Time),
		limit:    limit,
		window:   window,
	}
}

func (rl *RateLimiter) RateLimit(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ip := r.RemoteAddr

		rl.mu.Lock()
		defer rl.mu.Unlock()

		now := time.Now()
		windowStart := now.Add(-rl.window)

		// Remove old requests
		var recent []time.Time
		for _, t := range rl.requests[ip] {
			if t.After(windowStart) {
				recent = append(recent, t)
			}
		}
		rl.requests[ip] = recent

		// Check if limit exceeded
		if len(recent) >= rl.limit {
			w.Header().Set("Retry-After", rl.window.String())
			http.Error(w, "Rate limit exceeded", http.StatusTooManyRequests)
			return
		}

		// Add current request
		rl.requests[ip] = append(rl.requests[ip], now)
		next.ServeHTTP(w, r)
	}
} 