package middleware

import (
	"encoding/json"
	"net/http"
	"strings"
)

type responseWriter struct {
	http.ResponseWriter
	status  int
	written bool
}

func (rw *responseWriter) WriteHeader(code int) {
	if !rw.written {
		rw.status = code
		rw.ResponseWriter.WriteHeader(code)
		rw.written = true
	}
}

func (rw *responseWriter) Write(b []byte) (int, error) {
	if !rw.written {
		rw.written = true
		if rw.status == 0 {
			rw.status = http.StatusOK
		}
	}
	return rw.ResponseWriter.Write(b)
}

// ErrorHandler takes a ServeErrorPageFunc as a dependency
func ErrorHandler(serveErrorPageFunc func(w http.ResponseWriter, status int, title string, message string)) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Create a custom response writer to capture the status
			rw := &responseWriter{ResponseWriter: w, status: http.StatusOK}

			// Check if it's an API/AJAX request
			isAPIRequest := r.Header.Get("X-Requested-With") == "XMLHttpRequest" ||
				r.Header.Get("Accept") == "application/json" ||
				strings.HasPrefix(r.Header.Get("Content-Type"), "application/json") ||
				strings.HasPrefix(r.URL.Path, "/api/")

			// Call the next handler with our custom response writer
			next.ServeHTTP(rw, r)

			// If the response has already been written, don't do anything else
			if rw.written {
				return
			}

			// Only handle errors if status is >= 400
			if rw.status >= 400 {
				if isAPIRequest {
					// For API requests, ensure we're sending JSON
					w.Header().Set("Content-Type", "application/json")
					w.WriteHeader(rw.status)
					json.NewEncoder(w).Encode(map[string]string{
						"error": http.StatusText(rw.status),
					})
					return
				}

				// For regular web requests, serve the error page
				switch rw.status {
				case http.StatusNotFound:
					serveErrorPageFunc(w, http.StatusNotFound, "Page Not Found", "The requested page could not be found.")
				case http.StatusInternalServerError:
					serveErrorPageFunc(w, http.StatusInternalServerError, "Internal Server Error", "An unexpected error occurred.")
				default:
					serveErrorPageFunc(w, rw.status, "Error", "An unexpected error occurred.")
				}
			}
		})
	}
}
