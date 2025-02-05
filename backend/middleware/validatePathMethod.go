package middleware

import (
	"net/http"
)

// ValidatePathAndMethod is a middleware factory that returns a middleware function
// to validate the path and method of incoming requests.
func ValidatePathAndMethod(expectedPath string, expectedMethod string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Check if the path and method match the expected values
			if r.URL.Path != expectedPath {
				w.WriteHeader(http.StatusNotFound)
				http.Error(w, "Page Not Found", http.StatusNotFound)
				return
			} else if r.Method != expectedMethod {
				w.WriteHeader(http.StatusMethodNotAllowed)
				http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
			}

			// Call the next handler if validation passes
			next.ServeHTTP(w, r)
		})
	}
}
