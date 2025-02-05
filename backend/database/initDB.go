package database

import (
	"database/sql"
	"log"
	"os"
	"path/filepath"
)

var GloabalDB *sql.DB

// InitializeDatabase creates all necessary tables if they don't exist
func InitializeDatabase() (*sql.DB, error) {
	// Create database directory in backend folder
	dbDir := filepath.Join(".", "data")
	if err := os.MkdirAll(dbDir, 0o755); err != nil {
		log.Fatal("Failed to create database directory:", err)
	}

	// Open database connection with absolute path
	dbPath := filepath.Join(dbDir, "forum.db")
	db, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		log.Fatal("Failed to open database:", err)
	}

	GloabalDB = db
	// Create tables
	_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS users (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			nickname TEXT UNIQUE,
			email TEXT UNIQUE,
			password TEXT,
			first_name TEXT,
			last_name TEXT,
			age INTEGER,
			gender TEXT,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		);

		CREATE TABLE IF NOT EXISTS posts (
			post_id TEXT PRIMARY KEY,
			user_id INTEGER,
			title TEXT,
			content TEXT,
			category TEXT,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (user_id) REFERENCES users(id)
		);

		CREATE TABLE IF NOT EXISTS messages (
			message_id TEXT PRIMARY KEY,
			sender_id INTEGER,
			receiver_id INTEGER,
			content TEXT,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (sender_id) REFERENCES users(id),
			FOREIGN KEY (receiver_id) REFERENCES users(id)
		);

		CREATE TABLE IF NOT EXISTS comments (
			comment_id TEXT PRIMARY KEY,
			post_id TEXT,
			user_id INTEGER,
			content TEXT,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (post_id) REFERENCES posts(post_id),
			FOREIGN KEY (user_id) REFERENCES users(id)
		);

		CREATE TABLE IF NOT EXISTS sessions (
			session_token TEXT PRIMARY KEY,
			jwt_token TEXT,
			user_id INTEGER NOT NULL,
			expires_at DATETIME NOT NULL,
			FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
		);

		CREATE TABLE IF NOT EXISTS csrf_tokens (
			session_token TEXT NOT NULL,
			csrf_token TEXT NOT NULL,
			expires_at DATETIME NOT NULL,
			PRIMARY KEY (session_token),
			FOREIGN KEY (session_token) REFERENCES sessions (session_token) ON DELETE CASCADE
		);
	`)
	return db, err
}
