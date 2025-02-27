package utils

import (
	"database/sql"
	"os"
	"path/filepath"
	"testing"

	"forum/backend/database"

	_ "github.com/mattn/go-sqlite3"
)

// TestDB holds the test database connection and cleanup function
type TestDB struct {
	DB            *sql.DB
	Cleanup       func()
	ClearDatabase func()
}

// SetupTestDB creates a new test database and returns a cleanup function
func SetupTestDB(t *testing.T) *TestDB {
	// Create temporary directory for test database
	tmpDir, err := os.MkdirTemp("", "forum_test_*")
	if err != nil {
		t.Fatalf("Failed to create temp directory: %v", err)
	}

	// Create test database path
	dbPath := filepath.Join(tmpDir, "test.db")
	db, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		os.RemoveAll(tmpDir)
		t.Fatalf("Failed to open test database: %v", err)
	}

	// Create all necessary tables
	if err := createTestTables(db); err != nil {
		db.Close()
		os.RemoveAll(tmpDir)
		t.Fatalf("Failed to create test tables: %v", err)
	}

	cleanup := func() {
		db.Close()
		os.RemoveAll(tmpDir)
	}

	clearDatabase := func() {
		db.Exec("DELETE FROM users")

		db.Exec("DELETE FROM posts")

		db.Exec("DELETE FROM comments")
	}

	return &TestDB{
		DB:            db,
		Cleanup:       cleanup,
		ClearDatabase: clearDatabase,
	}
}

// createTestTables creates all the necessary tables for testing
func createTestTables(db *sql.DB) error {
	// Enable foreign keys
	if _, err := db.Exec("PRAGMA foreign_keys = ON"); err != nil {
		return err
	}

	// Create tables (using the same schema as in initDB.go)
	_, err := db.Exec(database.TableQueries)
	return err
}
