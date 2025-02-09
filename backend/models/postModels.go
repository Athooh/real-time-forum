package models

import (
	"database/sql"
	"time"
)

type Post struct {
	ID        int            `json:"id"`
	Title     string         `json:"title"`
	Author    string         `json:"author"`
	UserID    int            `json:"user_id"`
	Category  string         `json:"category"`
	Likes     int            `json:"likes"`
	Dislikes  int            `json:"dislikes"`
	UserVote  string         `json:"user_vote"`
	Content   string         `json:"content"`
	Timestamp time.Time      `json:"timestamp"`
	VideoUrl  sql.NullString `json:"video_url"`
	Images    []string       `json:"images"`
}
