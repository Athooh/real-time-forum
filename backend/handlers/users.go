package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"

	"forum/backend/controllers"
	"forum/backend/logger"
	"forum/backend/models"
)

func GetOnlineUsersHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Add CORS headers
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET")
		w.Header().Set("Content-Type", "application/json")

		rows, err := db.Query(`
			SELECT user_id, nickname, first_name, last_name 
			FROM users
		`)
		if err != nil {
			json.NewEncoder(w).Encode(map[string]string{
				"error": "Failed to fetch users",
			})
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		var users []User
		for rows.Next() {
			var u User
			if err := rows.Scan(&u.ID, &u.Nickname, &u.FirstName, &u.LastName); err != nil {
				continue
			}
			users = append(users, u)
		}

		if err := json.NewEncoder(w).Encode(users); err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
	}
}

func GetUsersHandler(uc *controllers.UsersController) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		userID := r.Context().Value(models.UserIDKey).(string)
		userIDInt, err := strconv.Atoi(userID)
		if err != nil {
			logger.Error("Invalid user ID: %v", err)
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{
				"error": "Invalid user ID",
			})
			return
		}

		page, _ := strconv.Atoi(r.URL.Query().Get("page"))
		limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))

		if page < 1 {
			page = 1
		}
		if limit < 1 || limit > 50 {
			limit = 5
		}

		users, err := uc.GetUsers(userIDInt, page, limit)
		if err != nil {
			logger.Error("Failed to get users: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{
				"error": "Failed to fetch users",
			})
			return
		}

		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(users)
	}
}

func GetUserStatsHandler(uc *controllers.UsersController) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Set JSON content type header
		w.Header().Set("Content-Type", "application/json")

		userID := r.Context().Value(models.UserIDKey).(string)

		userIDInt, err := strconv.Atoi(userID)
		if err != nil {
			logger.Error("Invalid user ID: %v", err)
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{
				"error": "Invalid user ID",
			})
			return
		}

		stats, err := uc.GetUserStats(userIDInt)
		if err != nil {
			logger.Error("Failed to get user stats: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{
				"error": "Failed to fetch user stats",
			})
			return
		}

		if err := json.NewEncoder(w).Encode(stats); err != nil {
			logger.Error("Failed to encode response: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{
				"error": "Failed to encode response",
			})
			return
		}
	}
}

func RegisterUserHandler(uc *controllers.UsersController) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// ... existing registration code ...

		
	}
}
