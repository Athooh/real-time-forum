package controllers

import (
	"database/sql"
	"log"
	"time"

	"forum/backend/models"
)

type MessageController struct {
	db *sql.DB
}

func NewMessageController(db *sql.DB) *MessageController {
	return &MessageController{db: db}
}

func (mc *MessageController) CreateConversationIfNotExists(user1ID, user2ID int) (int, error) {
	query := `
        INSERT OR IGNORE INTO conversations (user1_id, user2_id)
        VALUES (?, ?)
    `
	_, err := mc.db.Exec(query, min(user1ID, user2ID), max(user1ID, user2ID))
	if err != nil {
		return 0, err
	}

	var convID int
	query = `
        SELECT id FROM conversations
        WHERE user1_id = ? AND user2_id = ?
    `
	row := mc.db.QueryRow(query, min(user1ID, user2ID), max(user1ID, user2ID))
	if err := row.Scan(&convID); err != nil {
		return 0, err
	}
	return convID, nil
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

func max(a, b int) int {
	if a > b {
		return a
	}
	return b
}

func (mc *MessageController) SendMessageController(senderID, recipientID int, content string) (int, string, error) {
	// Step 1: Ensure the conversation exists
	convID, err := mc.CreateConversationIfNotExists(senderID, recipientID)
	if err != nil {
		return 0, "", err
	}

	// Step 2: Insert the message
	query := `
        INSERT INTO messages (sender_id, recipient_id, conversation_id, content, sent_at)
        VALUES (?, ?, ?, ?, ?)
    `
	result, err := mc.db.Exec(query, senderID, recipientID, convID, content, time.Now())
	if err != nil {
		return 0, "", err
	}

	msgID, err := result.LastInsertId()
	if err != nil {
		return 0, "", err
	}

	// Step 3: Update the latest_message_id and updated_at in the conversation
	query = `
        UPDATE conversations
        SET latest_message_id = ?, updated_at = ?
        WHERE id = ?
    `
	_, err = mc.db.Exec(query, msgID, time.Now(), convID)
	if err != nil {
		return 0, "", err
	}

	// Step 4: Get the message timestamp
	var sentAt string
	query = `
        SELECT sent_at 
        FROM messages 
        WHERE id = ?
    `
	err = mc.db.QueryRow(query, msgID).Scan(&sentAt)
	if err != nil {
		return 0, "", err
	}

	return int(msgID), sentAt, nil
}

func (mc *MessageController) GetMessagesInConversation(user1ID, user2ID, offset, limit int) ([]models.Message, error) {
	var messages []models.Message

	query := `
        SELECT 
            m.id, 
            m.sender_id, 
            m.recipient_id, 
            m.conversation_id, 
            m.content, 
            m.sent_at, 
            m.is_read,
            CASE 
                WHEN m.sender_id = ? THEN r.nickname
                ELSE s.nickname
            END as other_user_nickname,
            CASE 
                WHEN m.sender_id = ? THEN r.avatar
                ELSE s.avatar
            END as other_user_avatar,
            CASE 
                WHEN m.sender_id = ? THEN r_status.is_online
                ELSE s_status.is_online
            END as other_user_online
        FROM messages m
        JOIN conversations c ON m.conversation_id = c.id
        JOIN users s ON m.sender_id = s.id
        JOIN users r ON m.recipient_id = r.id
        LEFT JOIN user_status s_status ON s.id = s_status.user_id
        LEFT JOIN user_status r_status ON r.id = r_status.user_id
        WHERE (c.user1_id = ? AND c.user2_id = ?) OR (c.user1_id = ? AND c.user2_id = ?)
        ORDER BY m.sent_at DESC
        LIMIT ? OFFSET ?
    `

	rows, err := mc.db.Query(query,
		user1ID, user1ID, user1ID, // For the CASE statements
		user1ID, user2ID, user2ID, user1ID, // For the WHERE clause
		limit, offset,
	)
	if err != nil {
		log.Printf("Query error: %v", err)
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var msg models.Message
		var nickname, avatar sql.NullString
		var isOnline bool

		err := rows.Scan(
			&msg.ID,
			&msg.SenderID,
			&msg.RecipientID,
			&msg.ConversationID,
			&msg.Content,
			&msg.SentAt,
			&msg.IsRead,
			&nickname,
			&avatar,
			&isOnline,
		)
		if err != nil {
			log.Printf("Row scan error: %v", err)
			return nil, err
		}

		// Set the User field to the other user's information
		otherUserID := msg.SenderID
		if msg.SenderID == user1ID {
			otherUserID = msg.RecipientID
		}

		msg.User = models.MessageUser{
			ID:       otherUserID,
			Nickname: nickname.String,
			Avatar:   avatar.String,
			IsOnline: isOnline,
		}

		messages = append(messages, msg)
	}
	// for i, msg := range messages {
	// 	fmt.Printf("Message %d:\n", i)
	// 	fmt.Printf("  ID: %d\n", msg.ID)
	// 	fmt.Printf("  SenderID: %d\n", msg.SenderID)
	// 	fmt.Printf("  RecipientID: %d\n", msg.RecipientID)
	// 	fmt.Printf("  ConversationID: %d\n", msg.ConversationID)
	// 	fmt.Printf("  Content: %s\n", msg.Content)
	// 	fmt.Printf("  SentAt: %v\n", msg.SentAt)
	// 	fmt.Printf("  IsRead: %v\n", msg.IsRead)
	// 	fmt.Printf("  User: {ID: %d, Nickname: %s, Avatar: %s, IsOnline: %v}\n",
	// 		msg.User.ID, msg.User.Nickname, msg.User.Avatar, msg.User.IsOnline)
	// 	fmt.Println()
	// }

	return messages, nil
}

func (mc *MessageController) MarkMessageAsRead(msgID int) (int, error) {
	// First mark the message as read
	query := `
        UPDATE messages
        SET is_read = TRUE
        WHERE id = ?
    `
	_, err := mc.db.Exec(query, msgID)
	if err != nil {
		return 0, err
	}

	// Get the recipient_id for the message we just marked as read
	var recipientID int
	query = `
        SELECT recipient_id 
        FROM messages 
        WHERE id = ?
    `
	err = mc.db.QueryRow(query, msgID).Scan(&recipientID)
	if err != nil {
		return 0, err
	}

	// Count remaining unread messages for this recipient
	var unreadCount int
	query = `
        SELECT COUNT(*) 
        FROM messages 
        WHERE recipient_id = ? AND is_read = FALSE
    `
	err = mc.db.QueryRow(query, recipientID).Scan(&unreadCount)
	if err != nil {
		return 0, err
	}

	return unreadCount, nil
}

func (mc *MessageController) GetAllMessages(userID, limit, offset int) ([]models.Message, error) {
	query := `
        SELECT 
            m.id, m.sender_id, m.recipient_id, m.conversation_id, m.content, m.sent_at, m.is_read,
            CASE 
                WHEN m.sender_id = ? THEN r.nickname
                ELSE s.nickname
            END as other_user_nickname,
            CASE 
                WHEN m.sender_id = ? THEN r.avatar
                ELSE s.avatar
            END as other_user_avatar,
            CASE 
                WHEN m.sender_id = ? THEN r_status.is_online
                ELSE s_status.is_online
            END as other_user_online
        FROM messages m
        JOIN users s ON m.sender_id = s.id
        JOIN users r ON m.recipient_id = r.id
        LEFT JOIN user_status s_status ON s.id = s_status.user_id
        LEFT JOIN user_status r_status ON r.id = r_status.user_id
        WHERE m.sender_id = ? OR m.recipient_id = ?
        ORDER BY m.sent_at DESC
        LIMIT ? OFFSET ?
    `

	rows, err := mc.db.Query(query,
		userID, userID, userID, // For the CASE statements
		userID, userID, // For the WHERE clause
		limit, offset,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var messages []models.Message

	for rows.Next() {
		var msg models.Message
		var nickname, avatar sql.NullString
		var isOnline bool

		err := rows.Scan(
			&msg.ID,
			&msg.SenderID,
			&msg.RecipientID,
			&msg.ConversationID,
			&msg.Content,
			&msg.SentAt,
			&msg.IsRead,
			&nickname,
			&avatar,
			&isOnline,
		)
		if err != nil {
			return nil, err
		}

		// Set the User field to the other user's information
		otherUserID := msg.SenderID
		if msg.SenderID == userID {
			otherUserID = msg.RecipientID
		}

		msg.User = models.MessageUser{
			ID:       otherUserID,
			Nickname: nickname.String,
			Avatar:   avatar.String,
			IsOnline: isOnline,
		}

		messages = append(messages, msg)
	}

	return messages, nil
}

func (mc *MessageController) GetUserInfo(userID int) (models.MessageUser, error) {
	var userInfo models.MessageUser
	var avatarNull sql.NullString

	err := mc.db.QueryRow(`
		SELECT u.id, u.nickname, u.avatar, COALESCE(us.is_online, false) 
		FROM users u 
		LEFT JOIN user_status us ON u.id = us.user_id 
		WHERE u.id = ?`, userID).Scan(
		&userInfo.ID,
		&userInfo.Nickname,
		&avatarNull,
		&userInfo.IsOnline,
	)
	if err != nil {
		return models.MessageUser{}, err
	}

	// Convert NullString to string, empty string if NULL
	userInfo.Avatar = avatarNull.String

	return userInfo, nil
}

func (mc *MessageController) GetUnreadMessageCount(userID int) (int, error) {
	var count int
	query := `
		SELECT COUNT(*) 
		FROM messages 
		WHERE recipient_id = ? AND is_read = false
	`
	err := mc.db.QueryRow(query, userID).Scan(&count)
	if err != nil {
		return 0, err
	}

	return count, nil
}
