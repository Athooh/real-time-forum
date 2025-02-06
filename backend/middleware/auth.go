package middleware

import (
	"net/http"
	"strings"

	"forum/backend/controllers"
	"forum/backend/database"
	"forum/backend/logger"
	"forum/backend/utils"
)

// Middleware to check if the user is authenticated
func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Check if the user is authenticated
		sessionCookie, err := r.Cookie("session_token")
		if err != nil || sessionCookie == nil || sessionCookie.Value == "" {
			logger.Warning("Unauthorized attempt  nil sessionCookie - remote_addr: %s, method: %s, path: %s",
				r.RemoteAddr,
				r.Method,
				r.URL.Path,
			)
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		// Validating the session token
		if _, valid := controllers.IsValidSession(database.GloabalDB, sessionCookie.Value); !valid {
			logger.Warning("Unauthorized attempt  Invalid Session - remote_addr: %s, method: %s, path: %s",
				r.RemoteAddr,
				r.Method,
				r.URL.Path,
			)
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		// User is authenticated, call the next handler
		next.ServeHTTP(w, r)
	})
}

// Middleware chain to apply multiple middleware functions
func ApplyMiddleware(handler http.Handler, middlewares ...func(http.Handler) http.Handler) http.Handler {
	for _, middleware := range middlewares {
		handler = middleware(handler)
	}
	return handler
}

func JWTAuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			logger.Warning("Unauthorized attempt  Authorization header missing - remote_addr: %s, method: %s, path: %s",
				r.RemoteAddr,
				r.Method,
				r.URL.Path,
			)
			http.Error(w, "Authorization header missing", http.StatusUnauthorized)
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		_, err := utils.ValidateJWT(tokenString)
		if err != nil {
			logger.Warning("Unauthorized attempt  Invalid token - remote_addr: %s, method: %s, path: %s",
				r.RemoteAddr,
				r.Method,
				r.URL.Path,
			)
			http.Error(w, "Invalid token", http.StatusUnauthorized)
			return
		}

		// Add claims to context if needed
		// ctx := context.WithValue(r.Context(), "userID", claims.UserID)
		// r = r.WithContext(ctx)

		next.ServeHTTP(w, r)
	})
}
