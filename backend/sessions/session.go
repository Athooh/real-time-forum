// auth/session.go
package auth

import (
	"database/sql"
	"errors"
	"fmt"
	"net/http"
	"time"

	"forum/backend/controllers"
	"forum/backend/logger"
	"forum/backend/utils"

	"github.com/google/uuid"
)

// CreateSession creates a new session for a user
func CreateSession(db *sql.DB, w http.ResponseWriter, userID int) (string, error) {
	if userID <= 0 {
		return "", errors.New("invalid user ID")
	}

	// Delete all existing sessions for the user
	err := controllers.DeleteUserSessions(db, userID)
	if err != nil {
		return "", err
	}

	// Create a new session
	sessionToken := uuid.New().String()
	expiresAt := time.Now().Add(24 * time.Hour)

	// Generate JWT token
	jwtToken, err := utils.GenerateJWT(fmt.Sprintf("%d", userID))
	if err != nil {
		return "", err
	}

	// Store session and JWT token in the database
	err = controllers.AddSessionWithToken(db, sessionToken, userID, expiresAt, jwtToken)
	if err != nil {
		return "", err
	}

	// Set the session cookie
	http.SetCookie(w, &http.Cookie{
		Name:     "session_token",
		Value:    sessionToken,
		Path:     "/",
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteStrictMode,
		MaxAge:   86400, // 24 hours
	})

	return jwtToken, nil
}

func DeleteSession(db *sql.DB, w http.ResponseWriter, cookie *http.Cookie) {
	if cookie == nil || db == nil {
		return
	}
	sessionToken := cookie.Value

	// Delete the session from the database
	err := controllers.DeleteSession(db, sessionToken)
	if err != nil {
		logger.Error("Failed to delete session: %v", err)
	}

	// Invalidate the cookie
	http.SetCookie(w, &http.Cookie{
		Name:   "session_token",
		MaxAge: -1,
	})
}
