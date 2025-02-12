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
			profession TEXT,
			avatar TEXT,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		);

		CREATE INDEX IF NOT EXISTS idx_users_nickname ON users(nickname);
		CREATE INDEX IF NOT EXISTS idx_users_first_name ON users(first_name);
		CREATE INDEX IF NOT EXISTS idx_users_last_name ON users(last_name);

		CREATE TABLE IF NOT EXISTS followers (
			follower_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			following_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			followed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			PRIMARY KEY (follower_id, following_id)
		);

		CREATE TABLE IF NOT EXISTS user_status (
			user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
			is_online BOOLEAN NOT NULL DEFAULT FALSE,
			last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		);

		CREATE TABLE IF NOT EXISTS posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            author TEXT NOT NULL,
            user_id INTEGER NOT NULL,
            category TEXT NOT NULL,
            likes INTEGER DEFAULT 0,
            dislikes INTEGER DEFAULT 0,
            content TEXT NOT NULL,
            video_url TEXT,
            timestamp DATETIME NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        );

		CREATE TABLE IF NOT EXISTS post_images (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            post_id INTEGER NOT NULL,
            image_url TEXT NOT NULL,
            FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE
        );

		CREATE TABLE IF NOT EXISTS user_votes (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
            post_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            user_vote TEXT CHECK(user_vote IN ('like', 'dislike')),
            FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE,
			FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
		);

		CREATE TABLE IF NOT EXISTS comments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            post_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            parent_id INTEGER DEFAULT NULL,
            author TEXT NOT NULL,
            content TEXT NOT NULL,
            likes INTEGER DEFAULT 0,
            dislikes INTEGER DEFAULT 0,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
            FOREIGN KEY (parent_id) REFERENCES comments (id) ON DELETE CASCADE
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

		CREATE TABLE IF NOT EXISTS conversations (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			user1_id INTEGER NOT NULL,
			user2_id INTEGER NOT NULL,
			latest_message_id INTEGER,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY(user1_id) REFERENCES users(id) ON DELETE CASCADE,
			FOREIGN KEY(user2_id) REFERENCES users(id) ON DELETE CASCADE,
			UNIQUE(user1_id, user2_id)
		);

		CREATE TABLE IF NOT EXISTS messages (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			sender_id INTEGER NOT NULL,
			recipient_id INTEGER NOT NULL,
			conversation_id INTEGER,
			content TEXT NOT NULL,
			sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			is_read BOOLEAN DEFAULT FALSE,
			FOREIGN KEY(sender_id) REFERENCES users(id) ON DELETE CASCADE,
			FOREIGN KEY(recipient_id) REFERENCES users(id) ON DELETE CASCADE,
			FOREIGN KEY(conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
		);
	`)
	return db, err
}
