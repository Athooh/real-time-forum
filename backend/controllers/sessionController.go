package controllers

import (
	"context"
	"database/sql"
	"log"
	"net/http"
	"time"

	"forum/backend/logger"
	"forum/backend/utils"
)

// Helper function to check if a session is valid
func IsValidSession(db *sql.DB, sessionToken string) (int, bool) {
	userID, expiresAt, err := GetSession(db, sessionToken)
	if err != nil {
		return userID, false
	}

	// Check if the session has expired
	if time.Now().After(expiresAt) {
		// Delete the expired session
		_ = DeleteSession(db, sessionToken)
		return userID, false
	}

	return userID, true
}

func GetSessionToken(r *http.Request) (string, error) {
	sessionToken, err := r.Cookie("session_token")
	if err != nil {
		return "", err
	}

	return sessionToken.Value, err
}

// GetSession retrieves session data from the database
func GetSession(db *sql.DB, sessionToken string) (int, time.Time, error) {
	var userID int
	var expiresAt time.Time
	err := db.QueryRow("SELECT user_id, expires_at FROM sessions WHERE session_token = ?", sessionToken).
		Scan(&userID, &expiresAt)
	return userID, expiresAt, err
}

// DeleteSession deletes a session from the database
func DeleteSession(db *sql.DB, sessionToken string) error {
	_, err := db.Exec("DELETE FROM sessions WHERE session_token = ?", sessionToken)
	return err
}

// DeleteExpiredSessions deletes all expired sessions from the database
func DeleteExpiredSessions(db *sql.DB) error {
	_, err := db.Exec("DELETE FROM sessions WHERE expires_at < ?", time.Now())
	return err
}

func DeleteUserSessions(db *sql.DB, userID int) error {
	_, err := db.Exec("DELETE FROM sessions WHERE user_id = ?", userID)
	return err
}

// Cleanup expired sessions and mark associated users as offline
func CleanupExpiredSessions(ctx context.Context, db *sql.DB) {
	// Run cleanup immediately when the function is called
	logger.Info("Running initial cleanup of expired sessions...")
	cleanupExpiredSessionsAndMarkOffline(db)

	// Start a ticker to run cleanup at intervals of one hour
	ticker := time.NewTicker(1 * time.Hour)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			logger.Info("Stopping session cleanup task...")
			return
		case <-ticker.C:
			logger.Info("Cleaning up expired sessions...")
			cleanupExpiredSessionsAndMarkOffline(db)
		}
	}
}

func cleanupExpiredSessionsAndMarkOffline(db *sql.DB) {
	// Start a transaction
	tx, err := db.Begin()
	if err != nil {
		log.Printf("Failed to start transaction: %v\n", err)
		return
	}
	defer tx.Rollback()

	// Modified query to get all users who have no active sessions
	rows, err := tx.Query(`
		SELECT DISTINCT u.id 
		FROM users u 
		LEFT JOIN sessions s ON u.id = s.user_id AND s.expires_at >= ?
		WHERE s.session_token IS NULL`, time.Now())
	if err != nil {
		log.Printf("Failed to query users without active sessions: %v\n", err)
		return
	}
	defer rows.Close()

	// Collect user IDs to mark as offline
	var userIDs []int
	for rows.Next() {
		var userID int
		if err := rows.Scan(&userID); err != nil {
			log.Printf("Failed to scan user ID: %v\n", err)
			continue
		}
		userIDs = append(userIDs, userID)
	}

	// Delete expired sessions
	_, err = tx.Exec("DELETE FROM sessions WHERE expires_at < ?", time.Now())
	if err != nil {
		log.Printf("Failed to clean up expired sessions: %v\n", err)
		return
	}

	// Commit the transaction
	if err := tx.Commit(); err != nil {
		log.Printf("Failed to commit transaction: %v\n", err)
		return
	}

	var foundError bool
	// Mark users as offline
	if len(userIDs) > 0 {
		for _, userID := range userIDs {
			err := utils.MarkUserOffline(userID)
			if err != nil {
				foundError = true
			}
		}
		if !foundError {
			logger.Info("Marked %d users as offline due to no active sessions", len(userIDs))
		}
	}
}

func AddSessionWithToken(db *sql.DB, sessionToken string, userID int, expiresAt time.Time, jwtToken string) error {
	_, err := db.Exec("INSERT INTO sessions (session_token, user_id, expires_at, jwt_token) VALUES (?, ?, ?, ?)",
		sessionToken, userID, expiresAt, jwtToken)
	return err
}
