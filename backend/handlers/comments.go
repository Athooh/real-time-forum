package handlers

import (
    "encoding/json"
    "net/http"
    "database/sql"
    "github.com/google/uuid"
)

type Comment struct {
    ID        string    `json:"id"`
    PostID    string    `json:"post_id"`
    UserID    string    `json:"user_id"`
    Content   string    `json:"content"`
    Timestamp string    `json:"timestamp"`
}

func CreateCommentHandler(db *sql.DB) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        userID := r.Context().Value("userID").(string)
        
        var comment struct {
            PostID  string `json:"post_id"`
            Content string `json:"content"`
        }
        
        if err := json.NewDecoder(r.Body).Decode(&comment); err != nil {
            http.Error(w, "Invalid request body", http.StatusBadRequest)
            return
        }
        
        commentID := uuid.New().String()
        
        _, err := db.Exec(`
            INSERT INTO comments (comment_id, post_id, user_id, content)
            VALUES (?, ?, ?, ?)
        `, commentID, comment.PostID, userID, comment.Content)
        
        if err != nil {
            http.Error(w, "Failed to create comment", http.StatusInternalServerError)
            return
        }
        
        w.WriteHeader(http.StatusCreated)
    }
}

func GetCommentsHandler(db *sql.DB) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        postID := r.URL.Query().Get("post_id")
        
        rows, err := db.Query(`
            SELECT c.comment_id, c.content, c.timestamp, u.nickname
            FROM comments c
            JOIN users u ON c.user_id = u.user_id
            WHERE c.post_id = ?
            ORDER BY c.timestamp DESC
        `, postID)
        
        if err != nil {
            http.Error(w, "Failed to fetch comments", http.StatusInternalServerError)
            return
        }
        defer rows.Close()
        
        var comments []Comment
        for rows.Next() {
            var c Comment
            if err := rows.Scan(&c.ID, &c.Content, &c.Timestamp, &c.UserID); err != nil {
                http.Error(w, "Failed to scan comments", http.StatusInternalServerError)
                return
            }
            comments = append(comments, c)
        }
        
        json.NewEncoder(w).Encode(comments)
    }
} 