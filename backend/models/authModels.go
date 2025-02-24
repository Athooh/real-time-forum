package models

import "time"

type User struct {
	ID         int       `json:"id"`
	Nickname   string    `json:"nickname"`
	Email      string    `json:"email"`
	Password   string    `json:"password"`
	FirstName  string    `json:"first_name"`
	LastName   string    `json:"last_name"`
	Age        int       `json:"age"`
	Gender     string    `json:"gender"`
	Profession string    `json:"profession"`
	Avatar     *string   `json:"avatar"`
	CoverImage *string   `json:"cover_image"`
	IsOnline   bool      `json:"is_online"`
	LastSeen   time.Time `json:"last_seen"`
}

type LoginRequest struct {
	Identifier string `json:"identifier"`
	Password   string `json:"password"`
}
