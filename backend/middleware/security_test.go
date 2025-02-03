package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

func TestRateLimiter(t *testing.T) {
	limiter := NewRateLimiter(3, time.Second)
	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	tests := []struct {
		name       string
		requests   int
		wantStatus int
	}{
		{
			name:       "Under limit",
			requests:   2,
			wantStatus: http.StatusOK,
		},
		{
			name:       "At limit",
			requests:   3,
			wantStatus: http.StatusOK,
		},
		{
			name:       "Exceed limit",
			requests:   4,
			wantStatus: http.StatusTooManyRequests,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			for i := 0; i < tt.requests; i++ {
				req := httptest.NewRequest("GET", "/test", nil)
				rr := httptest.NewRecorder()
				
				limitedHandler := limiter.RateLimit(handler)
				limitedHandler.ServeHTTP(rr, req)

				if i == tt.requests-1 && rr.Code != tt.wantStatus {
					t.Errorf("RateLimit() status = %v, want %v", rr.Code, tt.wantStatus)
				}
			}
		})
	}
}

func TestCSRFProtection(t *testing.T) {
	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	tests := []struct {
		name       string
		method     string
		setToken   bool
		wantStatus int
	}{
		{
			name:       "GET request",
			method:     "GET",
			setToken:   false,
			wantStatus: http.StatusOK,
		},
		{
			name:       "POST with valid token",
			method:     "POST",
			setToken:   true,
			wantStatus: http.StatusOK,
		},
		{
			name:       "POST without token",
			method:     "POST",
			setToken:   false,
			wantStatus: http.StatusForbidden,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(tt.method, "/test", nil)
			rr := httptest.NewRecorder()

			if tt.setToken {
				token := generateCSRFToken()
				req.Header.Set("X-CSRF-Token", token)
			}

			protectedHandler := CSRFMiddleware(handler)
			protectedHandler.ServeHTTP(rr, req)

			if rr.Code != tt.wantStatus {
				t.Errorf("CSRFMiddleware() status = %v, want %v", rr.Code, tt.wantStatus)
			}
		})
	}
} 