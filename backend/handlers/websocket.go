package handlers

import (
	"encoding/base64"
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	"sync"
	"time"

	"forum/backend/database"
	"forum/backend/logger"
	"forum/backend/models"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

// Update the clients map to store user IDs
var (
	clients = make(map[*websocket.Conn]int) // Changed from bool to int to store userID
	mutex   = &sync.Mutex{}
)

// Add a function to send message to specific user
func SendToUser(userID int, message []byte) {
	mutex.Lock()
	defer mutex.Unlock()

	found := false
	for conn, connUserID := range clients {
		if connUserID == userID {
			found = true
			logger.Info("Sending message to user %d", userID)
			err := conn.WriteMessage(websocket.TextMessage, message)
			if err != nil {
				logger.Error("Error sending message to user %d: %v", userID, err)
				conn.Close()
				delete(clients, conn)
			}
		}
	}

	if !found {
		logger.Warning("No active WebSocket connection found for user %d", userID)
	}
}

// Broadcast sends a message to all connected clients
func Broadcast(message []byte) {
	mutex.Lock()
	defer mutex.Unlock()

	for client := range clients {
		err := client.WriteMessage(websocket.TextMessage, message)
		if err != nil {
			log.Println("Error broadcasting message:", err)
			client.Close()
			delete(clients, client)
		}
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
	mutex.Lock()
	clients[conn] = userIDInt
	mutex.Unlock()

	// Mark user as online
	MarkUserOnline(userIDInt)

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

	defer func() {
		mutex.Lock()
		delete(clients, conn)
		mutex.Unlock()
		MarkUserOffline(userIDInt)
		conn.Close()
	}()

	for {
		_, message, err := conn.ReadMessage()
		if err != nil {
			logger.Error("Error reading message: %v", err)
			break
		}

		// Try to parse the message as JSON
		var msg struct {
			Type string `json:"type"`
		}

		if err := json.Unmarshal(message, &msg); err == nil && msg.Type == "ping" {
			// Update the read deadline when we receive a ping
			conn.SetReadDeadline(time.Now().Add(40 * time.Second))
			MarkUserOnline(userIDInt)
			continue
		}

		logger.Info("Received message: %s", message)
		Broadcast(message)
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
	Broadcast(msgBytes)
}

func MarkUserOnline(userID int) {
	stmt := `
		INSERT INTO user_status (user_id, is_online, last_seen) 
		VALUES (?, TRUE, datetime('now'))
		ON CONFLICT (user_id) 
		DO UPDATE SET 
			is_online = TRUE,
			last_seen = datetime('now')
	`
	if _, err := database.GloabalDB.Exec(stmt, userID); err != nil {
		logger.Error("Failed to update user online status: %v", err)
		return
	}

	// Broadcast online status
	onlineEvent := map[string]interface{}{
		"type": "user_online",
		"payload": map[string]interface{}{
			"userId":   userID,
			"isOnline": true,
		},
	}
	msgBytes, err := json.Marshal(onlineEvent)
	if err != nil {
		logger.Error("Error creating message: %v", err)
		return
	}
	Broadcast(msgBytes)
}

func MarkUserOffline(userID int) {
	stmt := `
		INSERT INTO user_status (user_id, is_online, last_seen) 
		VALUES (?, FALSE, datetime('now'))
		ON CONFLICT (user_id) 
		DO UPDATE SET 
			is_online = FALSE,
			last_seen = datetime('now')
	`
	if _, err := database.GloabalDB.Exec(stmt, userID); err != nil {
		logger.Error("Failed to update user offline status: %v", err)
		return
	}

	// Broadcast offline status
	offlineEvent := map[string]interface{}{
		"type": "user_offline",
		"payload": map[string]interface{}{
			"userId":   userID,
			"isOnline": false,
		},
	}
	msgBytes, err := json.Marshal(offlineEvent)
	if err != nil {
		logger.Error("Error creating message: %v", err)
		return
	}
	Broadcast(msgBytes)
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

	Broadcast(messageBytes)
}
