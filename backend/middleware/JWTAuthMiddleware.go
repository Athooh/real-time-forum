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
		logger.Info("JWTAuthMiddleware called")
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
		logger.Info("tokenString: %s", tokenString)
		claims, err := utils.ValidateJWT(tokenString)
		logger.Info("claims: %v", claims)
		if err != nil || claims.UserID == "" {
			logger.Warning("Unauthorized attempt  Invalid token - remote_addr: %s, method: %s, path: %s",
				r.RemoteAddr,
				r.Method,
				r.URL.Path,
			)
			http.Error(w, "Invalid token", http.StatusUnauthorized)
			return
		}

		ctx := context.WithValue(r.Context(), models.UserIDKey, claims.UserID)
		r = r.WithContext(ctx)

		next.ServeHTTP(w, r)
	})
}
