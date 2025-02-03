package handlers

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"golang.org/x/crypto/bcrypt"
)

func TestRegisterHandler(t *testing.T) {
	// Test cases
	tests := []struct {
		name       string
		input      map[string]interface{}
		wantStatus int
	}{
		{
			name: "Valid Registration",
			input: map[string]interface{}{
				"nickname":  "testuser",
				"age":       25,
				"gender":    "male",
				"firstName": "Test",
				"lastName":  "User",
				"email":     "test@example.com",
				"password":  "SecurePass123!",
			},
			wantStatus: http.StatusCreated,
		},
		{
			name: "Missing Required Fields",
			input: map[string]interface{}{
				"nickname": "testuser",
				"email":    "test@example.com",
			},
			wantStatus: http.StatusBadRequest,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Create request body
			body, _ := json.Marshal(tt.input)
			req := httptest.NewRequest("POST", "/register", bytes.NewBuffer(body))
			req.Header.Set("Content-Type", "application/json")

			// Create response recorder
			rr := httptest.NewRecorder()

			// Call handler
			handler := RegisterHandler(testDB)
			handler.ServeHTTP(rr, req)

			// Check status code
			if status := rr.Code; status != tt.wantStatus {
				t.Errorf("handler returned wrong status code: got %v want %v",
					status, tt.wantStatus)
			}
		})
	}
}

func TestLoginHandler(t *testing.T) {
	tests := []struct {
		name       string
		input      map[string]interface{}
		setupDB    func(*sql.DB)
		wantStatus int
	}{
		{
			name: "Valid Login with Email",
			input: map[string]interface{}{
				"identifier": "test@example.com",
				"password":   "SecurePass123!",
			},
			setupDB: func(db *sql.DB) {
				hashedPass, _ := bcrypt.GenerateFromPassword([]byte("SecurePass123!"), bcrypt.DefaultCost)
				db.Exec(`INSERT INTO users (user_id, email, password) VALUES (?, ?, ?)`,
					"test-uuid", "test@example.com", hashedPass)
			},
			wantStatus: http.StatusOK,
		},
		{
			name: "Invalid Password",
			input: map[string]interface{}{
				"identifier": "test@example.com",
				"password":   "WrongPass123!",
			},
			setupDB: func(db *sql.DB) {
				hashedPass, _ := bcrypt.GenerateFromPassword([]byte("SecurePass123!"), bcrypt.DefaultCost)
				db.Exec(`INSERT INTO users (user_id, email, password) VALUES (?, ?, ?)`,
					"test-uuid", "test@example.com", hashedPass)
			},
			wantStatus: http.StatusUnauthorized,
		},
		{
			name: "User Not Found",
			input: map[string]interface{}{
				"identifier": "nonexistent@example.com",
				"password":   "SecurePass123!",
			},
			setupDB:    func(db *sql.DB) {},
			wantStatus: http.StatusUnauthorized,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Setup test database
			tt.setupDB(testDB)

			body, _ := json.Marshal(tt.input)
			req := httptest.NewRequest("POST", "/login", bytes.NewBuffer(body))
			req.Header.Set("Content-Type", "application/json")

			rr := httptest.NewRecorder()
			handler := LoginHandler(testDB)
			handler.ServeHTTP(rr, req)

			if status := rr.Code; status != tt.wantStatus {
				t.Errorf("handler returned wrong status code: got %v want %v",
					status, tt.wantStatus)
			}

			// Clean up test database
			testDB.Exec("DELETE FROM users")
		})
	}
}
