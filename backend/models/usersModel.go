package models

import (
	"time"
)

type UserStats struct {
	PostsCount     int `json:"posts_count"`
	FollowersCount int `json:"followers_count"`
	FollowingCount int `json:"following_count"`
}

type UserAbout struct {
	UserID             int       `json:"user_id"`
	Bio                string    `json:"bio"`
	DateOfBirth        time.Time `json:"date_of_birth"`
	RelationshipStatus string    `json:"relationship_status"`
	Location           string    `json:"location"`
	GithubURL          string    `json:"github_url"`
	LinkedinURL        string    `json:"linkedin_url"`
	TwitterURL         string    `json:"twitter_url"`
	PhoneNumber        string    `json:"phone_number"`
	Interests          string    `json:"interests"`
	IsProfilePublic    bool      `json:"is_profile_public"`
	ShowEmail          bool      `json:"show_email"`
	ShowPhone          bool      `json:"show_phone"`
}

type UserExperience struct {
	ID          int        `json:"id"`
	UserID      int        `json:"user_id"`
	CompanyName string     `json:"company_name"`
	Role        string     `json:"role"`
	Category    string     `json:"category"`
	Location    string     `json:"location"`
	StartDate   time.Time  `json:"start_date"`
	EndDate     *time.Time `json:"end_date,omitempty"`
	IsCurrent   bool       `json:"is_current"`
	Description string     `json:"description"`
}

type FriendResponse struct {
	Friends      []FriendInfo `json:"friends"`
	TotalFriends int          `json:"total_friends"`
}

type FriendInfo struct {
	ID       int     `json:"id"`
	Nickname string  `json:"nickname"`
	Avatar   *string `json:"avatar"`
}
