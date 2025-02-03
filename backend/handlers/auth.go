package handlers

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

func RegisterHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var user struct {
			Nickname  string `json:"nickname"`
			Email    string `json:"email"`
			Password string `json:"password"`
			FirstName string `json:"first_name"`
			LastName  string `json:"last_name"`
			Age      int    `json:"age"`
			Gender   string `json:"gender"`
		}

		if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]string{
				"error": "Invalid request format",
			})
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		// Validate required fields
		if user.Nickname == "" || user.Email == "" || user.Password == "" {
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]string{
				"error": "Missing required fields",
			})
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		// Hash password
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
		if err != nil {
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]string{
				"error": "Server error",
			})
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		// Insert user
		userID := uuid.New().String()
		result, err := db.Exec(`
            INSERT INTO users (user_id, nickname, email, password, first_name, last_name, age, gender)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, userID, user.Nickname, user.Email, hashedPassword, user.FirstName, user.LastName, user.Age, user.Gender)

		if err != nil {
			log.Printf("Database error: %v", err)
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{
				"error": "Failed to create user",
			})
			return
		}

		// Check if the row was actually inserted
		rowsAffected, err := result.RowsAffected()
		if err != nil || rowsAffected == 0 {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{
				"error": "Failed to create user",
			})
			return
		}

		// Set headers first
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		
		// Then write response
		json.NewEncoder(w).Encode(map[string]string{
			"message": "Registration successful",
			"user_id": userID,
		})
	}
}

func LoginHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var credentials struct {
			Identifier string `json:"identifier"`
			Password   string `json:"password"`
		}

		if err := json.NewDecoder(r.Body).Decode(&credentials); err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{
				"error": "Invalid request format",
			})
			return
		}

		var user struct {
			ID       string
			Password string
		}

		// Try to find user by email or nickname
		err := db.QueryRow(`
            SELECT user_id, password 
            FROM users 
            WHERE email = ? OR nickname = ?
        `, credentials.Identifier, credentials.Identifier).Scan(&user.ID, &user.Password)

		if err == sql.ErrNoRows {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusUnauthorized)
			json.NewEncoder(w).Encode(map[string]string{
				"error": "Invalid credentials",
			})
			return
		}

		if err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{
				"error": "Server error",
			})
			return
		}

		if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(credentials.Password)); err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusUnauthorized)
			json.NewEncoder(w).Encode(map[string]string{
				"error": "Invalid credentials",
			})
			return
		}

		// Generate token
		token := uuid.New().String()
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{
			"token":   token,
			"user_id": user.ID,
		})
	}
}
