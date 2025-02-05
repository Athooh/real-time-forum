package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	// "github.com/go-chi/chi"
	"github.com/google/uuid"
)

// User struct definition
type User struct {
	ID        string `json:"user_id"`
	Nickname  string `json:"nickname"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
}

// Post struct definition
type Post struct {
	ID        string    `json:"id"`
	UserID    string    `json:"user_id"`
	Content   string    `json:"content"`
	Category  string    `json:"category"`
	Timestamp time.Time `json:"timestamp"`
	User      User      `json:"user"`
}

func GetPostsHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		page, _ := strconv.Atoi(r.URL.Query().Get("page"))
		limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))

		if page < 1 {
			page = 1
		}
		if limit < 1 || limit > 50 {
			limit = 10
		}

		offset := (page - 1) * limit

		rows, err := db.Query(`
            SELECT p.post_id, p.user_id, p.content, p.category, p.timestamp,
                   u.nickname, u.first_name, u.last_name
            FROM posts p
            JOIN users u ON p.user_id = u.user_id
            ORDER BY p.timestamp DESC
            LIMIT ? OFFSET ?
        `, limit, offset)
		if err != nil {
			http.Error(w, "Failed to fetch posts", http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		var posts []Post
		for rows.Next() {
			var p Post
			err := rows.Scan(
				&p.ID, &p.UserID, &p.Content, &p.Category, &p.Timestamp,
				&p.User.Nickname, &p.User.FirstName, &p.User.LastName,
			)
			if err != nil {
				continue
			}
			posts = append(posts, p)
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"posts": posts,
			"page":  page,
		})
	}
}

func CreatePostHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID := r.Context().Value("userID").(string)

		var post struct {
			Content  string `json:"content"`
			Category string `json:"category"`
		}

		if err := json.NewDecoder(r.Body).Decode(&post); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		postID := uuid.New().String()
		_, err := db.Exec(`
            INSERT INTO posts (post_id, user_id, content, category, timestamp)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
        `, postID, userID, post.Content, post.Category)
		if err != nil {
			http.Error(w, "Failed to create post", http.StatusInternalServerError)
			return
		}

		// Fetch the newly created post with user details
		var newPost Post
		err = db.QueryRow(`
            SELECT p.post_id, p.user_id, p.content, p.category, p.timestamp,
                   u.nickname, u.first_name, u.last_name
            FROM posts p
            JOIN users u ON p.user_id = u.user_id
            WHERE p.post_id = ?
        `, postID).Scan(
			&newPost.ID, &newPost.UserID, &newPost.Content, &newPost.Category,
			&newPost.Timestamp, &newPost.User.Nickname, &newPost.User.FirstName,
			&newPost.User.LastName,
		)
		if err != nil {
			http.Error(w, "Failed to fetch created post", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(newPost)
	}
}

func UpdatePostHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID := r.Context().Value("userID").(string)
		postID := r.URL.Query().Get("postID")

		var update struct {
			Content string `json:"content"`
		}

		if err := json.NewDecoder(r.Body).Decode(&update); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		// Verify post ownership
		var ownerID string
		err := db.QueryRow("SELECT user_id FROM posts WHERE post_id = ?", postID).Scan(&ownerID)
		if err != nil || ownerID != userID {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		_, err = db.Exec("UPDATE posts SET content = ? WHERE post_id = ?", update.Content, postID)
		if err != nil {
			http.Error(w, "Failed to update post", http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusOK)
	}
}

func DeletePostHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID := r.Context().Value("userID").(string)
		postID := r.URL.Query().Get("postID")

		// Verify post ownership
		var ownerID string
		err := db.QueryRow("SELECT user_id FROM posts WHERE post_id = ?", postID).Scan(&ownerID)
		if err != nil || ownerID != userID {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		// Delete post and its comments
		tx, err := db.Begin()
		if err != nil {
			http.Error(w, "Transaction failed", http.StatusInternalServerError)
			return
		}

		_, err = tx.Exec("DELETE FROM comments WHERE post_id = ?", postID)
		if err != nil {
			tx.Rollback()
			http.Error(w, "Failed to delete comments", http.StatusInternalServerError)
			return
		}

		_, err = tx.Exec("DELETE FROM posts WHERE post_id = ?", postID)
		if err != nil {
			tx.Rollback()
			http.Error(w, "Failed to delete post", http.StatusInternalServerError)
			return
		}

		if err := tx.Commit(); err != nil {
			http.Error(w, "Failed to commit transaction", http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusOK)
	}
}
