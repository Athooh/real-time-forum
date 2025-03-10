package models

import (
	"database/sql"
	"time"
)

type Conversation struct {
	ID              int           `json:"id"`
	User1ID         int           `json:"user1_id"`
	User2ID         int           `json:"user2_id"`
	LatestMessageID sql.NullInt64 `json:"latest_message_id"`
	CreatedAt       time.Time     `json:"created_at"`
}

type MessageUser struct {
	ID       int    `json:"id"`
	Nickname string `json:"nickname"`
	Avatar   string `json:"avatar"`
	IsOnline bool   `json:"isOnline"`
}

type Message struct {
	ID             int         `json:"id"`
	SenderID       int         `json:"sender_id"`
	RecipientID    int         `json:"recipient_id"`
	ConversationID int         `json:"conversation_id"`
	Content        string      `json:"content"`
	SentAt         string      `json:"timestamp"`
	IsRead         bool        `json:"is_read"`
	User           MessageUser `json:"user"`
}

type TypingStatus struct {
	SenderID    int    `json:"sender_id"`
	RecipientID int    `json:"recipient_id"`
	IsTyping    bool   `json:"is_typing"`
}
