package middleware

import (
	"net/http"

	"forum/backend/handlers"
	"forum/backend/logger"
)

// ValidatePathAndMethod is a middleware factory that returns a middleware function
// to validate the path and method of incoming requests.
func ValidatePathAndMethod(expectedPath string, expectedMethod string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Check if the path and method match the expected values
			if r.URL.Path != expectedPath {
				logger.Warning("Page Not Found - remote_addr: %s, method: %s, path: %s",
					r.RemoteAddr,
					r.Method,
					r.URL.Path,
				)
				w.WriteHeader(http.StatusNotFound)
				handlers.ServeErrorPage(w, http.StatusNotFound, "Page Not Found", "The page you are looking for does not exist.")
				return
			} else if r.Method != expectedMethod {
				logger.Warning("Method Not Allowed - remote_addr: %s, method: %s, path: %s",
					r.RemoteAddr,
					r.Method,
					r.URL.Path,
				)
				w.WriteHeader(http.StatusMethodNotAllowed)
				handlers.ServeErrorPage(w, http.StatusMethodNotAllowed, "Method Not Allowed", "The method you are trying to use is not allowed.")
			}

			// Call the next handler if validation passes
			next.ServeHTTP(w, r)
		})
	}
}
