package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
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