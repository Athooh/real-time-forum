package controllers

import (
	"database/sql"
	"testing"
	"time"

	"forum/backend/controllers"
	"forum/backend/models"
	"forum/backend/utils"
)

func TestCommentController_CreateComment(t *testing.T) {
	// Initialize logger for tests
	helper := utils.NewTestHelper(t)
	defer helper.Cleanup()

	// Setup test database
	testDB := utils.SetupTestDB(t)
	defer testDB.Cleanup()

	// Create comment controller
	cc := &controllers.CommentController{
		DB: testDB.DB,
	}

	// Define test cases
	tests := []struct {
		name    string
		setup   func(t *testing.T, db *sql.DB)
		comment models.Comment
		want    int
		wantErr bool
	}{
		{
			name: "Valid comment creation",
			setup: func(t *testing.T, db *sql.DB) {
				// Insert a user into the users table
				userQuery := `
					INSERT INTO users (id, nickname, email, password, first_name, last_name, age, gender)
					VALUES (?, ?, ?, ?, ?, ?, ?, ?)
				`
				_, err := db.Exec(userQuery, 2, "testuser2", "test@example2.com", "password123", "Test2", "User2", 25, "male")
				if err != nil {
					t.Fatalf("Failed to insert user: %v", err)
				}

				// Insert a post into the posts table
				postQuery := `
					INSERT INTO posts (id, user_id, author, title, content, category, timestamp)
					VALUES (?, ?, ?, ?, ?, ?, ?)
				`
				_, err = db.Exec(postQuery, 2, 2, "Rayzy", "Test Post", "This is a test post.", "General", time.Now())
				if err != nil {
					t.Fatalf("Failed to insert post: %v", err)
				}
			},
			comment: models.Comment{
				UserID:   2,
				PostID:   2,
				Content:  "This is a valid comment.",
				ParentID: sql.NullInt64{}, // Optional field
			},
			want:    1, // Assuming a successful creation returns a positive ID
			wantErr: false,
		},
		{
			name: "Missing required fields",
			comment: models.Comment{
				UserID:  0, // Missing user ID
				PostID:  1,
				Content: "This comment has no user ID.",
			},
			want:    0,
			wantErr: true,
		},
		{
			name: "Invalid user ID",
			comment: models.Comment{
				UserID:  -1, // Invalid user ID
				PostID:  1,
				Content: "This comment has an invalid user ID.",
			},
			want:    0,
			wantErr: true,
		},
		{
			name: "Invalid post ID",
			comment: models.Comment{
				UserID:  1,
				PostID:  -1, // Invalid post ID
				Content: "This comment has an invalid post ID.",
			},
			want:    0,
			wantErr: true,
		},
		{
			name: "Empty content",
			comment: models.Comment{
				UserID:  1,
				PostID:  1,
				Content: "", // Empty content
			},
			want:    0,
			wantErr: true,
		},
		{
			name: "Duplicate comment (same user, post, and content)",
			comment: models.Comment{
				UserID:  1,
				PostID:  1,
				Content: "This is a duplicate comment.",
			},
			want:    0,
			wantErr: true,
		},
		{
			name: "Valid reply to another comment",
			setup: func(t *testing.T, db *sql.DB) {
				// Insert a user into the users table
				userQuery := `
					INSERT INTO users (id, nickname, email, password, first_name, last_name, age, gender)
					VALUES (?, ?, ?, ?, ?, ?, ?, ?)
				`
				_, err := db.Exec(userQuery, 1, "testuser", "test@example.com", "password123", "Test", "User", 25, "male")
				if err != nil {
					t.Fatalf("Failed to insert user: %v", err)
				}

				// Insert a post into the posts table
				postQuery := `
					INSERT INTO posts (id, user_id, author, title, content, category, timestamp)
					VALUES (?, ?, ?, ?, ?, ?, ?)
				`
				_, err = db.Exec(postQuery, 1, 1, "Rayzy", "Test Post", "This is a test post.", "General", time.Now())
				if err != nil {
					t.Fatalf("Failed to insert post: %v", err)
				}

				// Insert a parent comment into the comments table
				parentQuery := `
					INSERT INTO comments (post_id, user_id, author, content, timestamp)
					VALUES (?, ?, ?, ?, ?)
				`
				_, err = db.Exec(parentQuery, 1, 1, "User1", "This is the parent comment.", time.Now())
				if err != nil {
					t.Fatalf("Failed to insert parent comment: %v", err)
				}
			},
			comment: models.Comment{
				UserID:   1,
				PostID:   1,
				Content:  "This is a reply to another comment.",
				ParentID: sql.NullInt64{Int64: 1, Valid: true}, // Parent comment ID
			},
			want:    3,
			wantErr: false,
		},
		{
			name: "Invalid parent comment ID",
			comment: models.Comment{
				UserID:   1,
				PostID:   1,
				Content:  "This comment references a non-existent parent.",
				ParentID: sql.NullInt64{Int64: 999, Valid: true}, // Non-existent parent ID
			},
			want:    0,
			wantErr: true,
		},
	}

	// Run test cases
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Run setup function if it exists
			if tt.setup != nil {
				tt.setup(t, testDB.DB)
			}

			// Call CreateComment
			got, err := cc.CreateComment(tt.comment)

			// Check if error matches expectation
			if (err != nil) != tt.wantErr {
				t.Errorf("CommentController.CreateComment() error = %v, wantErr %v", err, tt.wantErr)
				return
			}

			// Check if returned ID matches expectation
			if got != tt.want && !tt.wantErr {
				t.Errorf("CommentController.CreateComment() = %v, want %v", got, tt.want)
			}

			// If no error, verify comment was actually created in the database
			if !tt.wantErr {
				var count int
				err := testDB.DB.QueryRow("SELECT COUNT(*) FROM comments WHERE id = ?", got).Scan(&count)
				if err != nil {
					t.Errorf("Failed to verify comment creation: %v", err)
				}
				if count != 1 {
					t.Errorf("Comment was not created in database")
				}
			}
		})
	}
}
