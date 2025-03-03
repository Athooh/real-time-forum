package handlers

import (
	"encoding/base64"
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"forum/backend/logger"
	"forum/backend/models"
	"forum/backend/utils"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

// Add a function to send message to specific user
func SendToUser(userID int, message []byte) {
	utils.Mutex.Lock()
	defer utils.Mutex.Unlock()

	found := false
	for conn, connUserID := range utils.Clients {
		if connUserID == userID {
			found = true
			logger.Info("Sending message to user %d", userID)
			err := conn.WriteMessage(websocket.TextMessage, message)
			if err != nil {
				logger.Error("Error sending message to user %d: %v", userID, err)
				conn.Close()
				delete(utils.Clients, conn)
			}
		}
	}

	if !found {
		logger.Warning("No active WebSocket connection found for user %d", userID)
	}
}

// WebSocketHandler manages WebSocket connections
func WebSocketHandler(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		logger.Error("Failed to upgrade connection: %v", err)
		http.Error(w, "Failed to upgrade connection", http.StatusInternalServerError)
		return
	}

	userID := r.Context().Value(models.UserIDKey).(string)
	userIDInt, err := strconv.Atoi(userID)
	if err != nil {
		logger.Error("Invalid user ID: %v", err)
		conn.Close()
		return
	}

	// Store the user ID with the connection
	utils.Mutex.Lock()
	utils.Clients[conn] = userIDInt
	utils.Mutex.Unlock()

	// Mark user as online
	utils.MarkUserOnline(userIDInt)

	// Start a goroutine to handle this client's messages
	go handleClientMessages(conn, userIDInt)
}

// handleClientMessages processes messages from a single client
func handleClientMessages(conn *websocket.Conn, userIDInt int) {
	// Set initial ping deadline
	conn.SetReadDeadline(time.Now().Add(40 * time.Second))

	// Setup ping handler
	conn.SetPingHandler(func(string) error {
		conn.SetReadDeadline(time.Now().Add(40 * time.Second))
		return nil
	})

	// Add close handler
	conn.SetCloseHandler(func(code int, text string) error {
		if code != websocket.CloseGoingAway &&
			code != websocket.CloseNormalClosure {
			logger.Warning("WebSocket closed with code %d: %s", code, text)
		} else {
			logger.Info("WebSocket connection closed normally for user %d", userIDInt)
		}
		return nil
	})

	defer func() {
		utils.Mutex.Lock()
		delete(utils.Clients, conn)
		utils.Mutex.Unlock()
		utils.MarkUserOffline(userIDInt)
		conn.Close()
	}()

	for {
		_, message, err := conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err,
				websocket.CloseGoingAway,
				websocket.CloseNormalClosure) {
				logger.Error("Error reading message: %v", err)
			}
			break
		}

		// Try to parse the message as JSON
		var msg struct {
			Type string `json:"type"`
		}

		if err := json.Unmarshal(message, &msg); err == nil && msg.Type == "ping" {
			// Update the read deadline when we receive a ping
			conn.SetReadDeadline(time.Now().Add(40 * time.Second))
			utils.MarkUserOnline(userIDInt)
			continue
		}

		utils.Broadcast(message)
	}
}

// BroadcastNewPost sends a new post notification to all clients
func BroadcastNewPost(post models.Post) {
	payload, err := json.Marshal(post)
	if err != nil {
		logger.Error("Error marshaling post data: %v", err)
		return
	}

	// Encode the payload as base64
	encodedPayload := base64.StdEncoding.EncodeToString(payload)

	// Create a message object
	message := map[string]interface{}{
		"type":    "new_post",
		"payload": encodedPayload,
	}

	msgBytes, err := json.Marshal(message)
	if err != nil {
		logger.Error("Error creating message: %v", err)
		return
	}

	// Broadcast the message
	utils.Broadcast(msgBytes)
}

// Add new function to broadcast post reactions
func BroadcastPostReaction(postID int, likes int, dislikes int) {
	message := struct {
		Type    string `json:"type"`
		Payload struct {
			PostID   int `json:"post_id"`
			Likes    int `json:"likes"`
			Dislikes int `json:"dislikes"`
		} `json:"payload"`
	}{
		Type: "post_reaction",
		Payload: struct {
			PostID   int `json:"post_id"`
			Likes    int `json:"likes"`
			Dislikes int `json:"dislikes"`
		}{
			PostID:   postID,
			Likes:    likes,
			Dislikes: dislikes,
		},
	}

	messageBytes, err := json.Marshal(message)
	if err != nil {
		logger.Error("Failed to marshal post reaction message: %v", err)
		return
	}

	utils.Broadcast(messageBytes)
}

// Add this function to broadcast unread count updates
func BroadcastUnreadCount(userID, unreadCount int) {
	message := map[string]interface{}{
		"type": "unread_count_update",
		"payload": map[string]interface{}{
			"unreadCount": unreadCount,
		},
	}

	msgBytes, err := json.Marshal(message)
	if err != nil {
		logger.Error("Error creating unread count message: %v", err)
		return
	}

	// Send only to the specific user
	SendToUser(userID, msgBytes)
}

// BroadcastMessageListMarkAsRead sends a message list mark as read notification to all clients
func BroadcastMessageListMarkAsRead(userID, recipientID int) {
	message := map[string]interface{}{
		"type": "message_list_mark_as_read",
		"payload": map[string]interface{}{
			"userId": recipientID,
		},
	}

	msgBytes, err := json.Marshal(message)
	if err != nil {
		logger.Error("Error creating message list mark as read message: %v", err)
		return
	}

	SendToUser(userID, msgBytes)
}

// Add this function after the WebSocketHandler function
func BroadcastTypingStatus(senderID, recipientID int, isTyping bool) {
	message := map[string]interface{}{
		"type": "typing_status",
		"payload": map[string]interface{}{
			"sender_id":    senderID,
			"recipient_id": recipientID,
			"is_typing":    isTyping,
		},
	}

	msgBytes, err := json.Marshal(message)
	if err != nil {
		logger.Error("Error creating typing status message: %v", err)
		return
	}

	// Send only to the recipient
	SendToUser(recipientID, msgBytes)
}
