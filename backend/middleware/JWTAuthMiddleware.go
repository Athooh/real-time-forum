package middleware

import (
	"context"
	"net/http"
	"strings"

	"forum/backend/logger"
	"forum/backend/models"
	"forum/backend/utils"
)

func JWTAuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Try to get the token from the Authorization header
		authHeader := r.Header.Get("Authorization")
		var tokenString string

		if authHeader != "" {
			tokenString = strings.TrimPrefix(authHeader, "Bearer ")
		} else {
			// If no Authorization header, try to get the token from the query parameters
			tokenString = r.URL.Query().Get("token")
		}

		// If no token is found in either location, deny access
		if tokenString == "" {
			logger.Warning("Unauthorized attempt - Token missing - remote_addr: %s, method: %s, path: %s",
				r.RemoteAddr,
				r.Method,
				r.URL.Path,
			)
			http.Error(w, "Token missing", http.StatusUnauthorized)
			return
		}

		// Validate the token
		claims, err := utils.ValidateJWT(tokenString)
		if err != nil || claims.UserID == "" {
			logger.Warning("Unauthorized attempt - Invalid token - remote_addr: %s, method: %s, path: %s",
				r.RemoteAddr,
				r.Method,
				r.URL.Path,
			)
			http.Error(w, "Invalid token", http.StatusUnauthorized)
			return
		}

		// Attach the user ID to the request context
		ctx := context.WithValue(r.Context(), models.UserIDKey, claims.UserID)
		r = r.WithContext(ctx)

		// Pass the request to the next handler
		next.ServeHTTP(w, r)
	})
}
