package utils

import (
	"database/sql"
	"testing"

	"forum/backend/logger"
	"forum/backend/models"

	"golang.org/x/crypto/bcrypt"
)

// CreateTestUser creates a test user and returns the user ID
func CreateTestUser(t *testing.T, db *sql.DB) (int64, models.User) {
	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("testpassword"), bcrypt.DefaultCost)
	user := models.User{
		Nickname:  "testuser",
		Email:     "test@example.com",
		Password:  string(hashedPassword),
		FirstName: "Test",
		LastName:  "User",
		Age:       25,
		Gender:    "male",
	}

	result, err := db.Exec(`
		INSERT INTO users (nickname, email, password, first_name, last_name, age, gender)
		VALUES (?, ?, ?, ?, ?, ?, ?)`,
		user.Nickname, user.Email, user.Password, user.FirstName, user.LastName, user.Age, user.Gender)
	if err != nil {
		t.Fatalf("Failed to create test user: %v", err)
	}

	userID, _ := result.LastInsertId()
	user.ID = int(userID)
	return userID, user
}

// CleanupTestUser removes a test user and all related data
func CleanupTestUser(t *testing.T, db *sql.DB, userID int64) {
	_, err := db.Exec("DELETE FROM users WHERE id = ?", userID)
	if err != nil {
		t.Errorf("Failed to cleanup test user: %v", err)
	}
}

// TestHelper provides utilities for test setup and cleanup
type TestHelper struct {
	t *testing.T
}

// NewTestHelper creates a new TestHelper instance
func NewTestHelper(t *testing.T) *TestHelper {
	helper := &TestHelper{t: t}
	helper.SetupLogger()
	return helper
}

// SetupLogger initializes the logger for tests
func (h *TestHelper) SetupLogger() {
	if err := logger.Init(); err != nil {
		h.t.Fatalf("Failed to initialize logger: %v", err)
	}
}

// Cleanup performs necessary cleanup after tests
func (h *TestHelper) Cleanup() {
	// Add any cleanup logic here
	// For now, we'll just ensure the logger is properly closed
	if err := logger.Close(); err != nil {
		h.t.Errorf("Failed to cleanup logger: %v", err)
	}
}
