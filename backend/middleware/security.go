package middleware

import (
	"crypto/rand"
	"encoding/base64"
	"net/http"
	"sync"
	"time"
)

var (
	csrfTokens = make(map[string]time.Time)
	csrfMutex  sync.RWMutex
)

// CSRF Middleware
func CSRFMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Skip CSRF check for GET requests
		if r.Method == "GET" {
			token := generateCSRFToken()
			w.Header().Set("X-CSRF-Token", token)
			next.ServeHTTP(w, r)
			return
		}

		// Verify CSRF token for other methods
		token := r.Header.Get("X-CSRF-Token")
		if !validateCSRFToken(token) {
			http.Error(w, "Invalid CSRF token", http.StatusForbidden)
			return
		}

		next.ServeHTTP(w, r)
	}
}

func generateCSRFToken() string {
	b := make([]byte, 32)
	rand.Read(b)
	token := base64.StdEncoding.EncodeToString(b)
	
	csrfMutex.Lock()
	csrfTokens[token] = time.Now()
	csrfMutex.Unlock()
	
	return token
}

func validateCSRFToken(token string) bool {
	csrfMutex.RLock()
	timestamp, exists := csrfTokens[token]
	csrfMutex.RUnlock()
	
	if !exists {
		return false
	}
	
	// Token expires after 1 hour
	if time.Since(timestamp) > time.Hour {
		csrfMutex.Lock()
		delete(csrfTokens, token)
		csrfMutex.Unlock()
		return false
	}
	
	return true
} 