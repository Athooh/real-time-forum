package models

import (
	"database/sql"
	"time"
)

type Comment struct {
	ID        int
	PostID    int
	UserID    int
	User      UserProfile
	ParentID  sql.NullInt64
	Author    string
	Content   string
	Likes     int
	HasReplies bool
	Dislikes  int
	Timestamp time.Time
	Replies   []Comment `json:"replies,omitempty"`
}
