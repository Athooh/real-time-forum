package models

import (
	"database/sql"
	"time"
)

type Comment struct {
	ID        int
	PostID    int
	UserID    int
	User      User
	ParentID  sql.NullInt64
	Author    string
	Content   string
	Likes     int
	Dislikes  int
	UserVote  sql.NullString
	Timestamp time.Time
	Replies   []Comment `json:"replies,omitempty"`
	Depth     int       `json:"depth"`
}
