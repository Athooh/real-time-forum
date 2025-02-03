package middleware

import (
    "encoding/json"
    "net/http"
    "your-project/backend/utils"
)

type ErrorResponse struct {
    Error   string `json:"error"`
    Code    int    `json:"code"`
    Message string `json:"message"`
}

func ErrorHandler(logger *utils.Logger) func(http.HandlerFunc) http.HandlerFunc {
    return func(next http.HandlerFunc) http.HandlerFunc {
        return func(w http.ResponseWriter, r *http.Request) {
            defer func() {
                if err := recover(); err != nil {
                    logger.Error("Panic recovered: %v", err)
                    response := ErrorResponse{
                        Error:   "Internal Server Error",
                        Code:    http.StatusInternalServerError,
                        Message: "An unexpected error occurred",
                    }
                    w.Header().Set("Content-Type", "application/json")
                    w.WriteHeader(http.StatusInternalServerError)
                    json.NewEncoder(w).Encode(response)
                }
            }()
            next.ServeHTTP(w, r)
        }
    }
} 