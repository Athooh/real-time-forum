package models

import (
	"database/sql"
	"time"
)

type Post struct {
	ID        int            `json:"id"`
	User      User           `json:"user"`
	Author    string         `json:"author"`
	Title     string         `json:"title"`
	UserID    int            `json:"user_id"`
	Category  string         `json:"category"`
	Likes     int            `json:"likes"`
	Dislikes  int            `json:"dislikes"`
	Content   string         `json:"content"`
	Timestamp time.Time      `json:"timestamp"`
	VideoUrl  sql.NullString `json:"video_url"`
	Images    []string       `json:"images"`
	Comments  []Comment      `json:"comments"`
}
