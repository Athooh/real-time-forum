package middleware

import "net/http"

func CORSMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// List of allowed origins
		// allowedOrigins := []string{
		// 	"http://localhost:3000",
		// 	"https://your-production-domain.com",
		// }

		// Get the request's origin
		origin := r.Header.Get("Origin")

		w.Header().Set("Access-Control-Allow-Origin", origin)
		// Check if the origin is allowed
		// for _, allowedOrigin := range allowedOrigins {
		// 	if origin == allowedOrigin {
		// 		w.Header().Set("Access-Control-Allow-Origin", origin)
		// 		break
		// 	}
		// }

		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-CSRF-Token, content-security-policy")
		w.Header().Set("Access-Control-Allow-Credentials", "true")

		// Handle OPTIONS requests (preflight CORS requests)
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		// Call the next handler in the chain
		next.ServeHTTP(w, r)
	})
}
