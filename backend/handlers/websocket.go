package handlers

import (
	"encoding/base64"
	"encoding/json"
	"log"
	"net/http"
	"sync"

	"forum/backend/logger"
	"forum/backend/models"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

// A map to store all active WebSocket connections
var (
	clients = make(map[*websocket.Conn]bool)
	mutex   = &sync.Mutex{}
)

// Broadcast sends a message to all connected clients
func broadcast(message []byte) {
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
	logger.Info("websocketHandler Called")
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		logger.Error("Failed to upgrade connection: %v", err)
		http.Error(w, "Failed to upgrade connection", http.StatusInternalServerError)
		return
	}
	defer conn.Close()

	logger.Info("Connection upgraded to WebSocket")

	// Add the new client to the clients map
	mutex.Lock()
	clients[conn] = true
	mutex.Unlock()
	logger.Info("Client added to connection")

	for {
		_, message, err := conn.ReadMessage()
		if err != nil {
			logger.Error("Error reading message: %v", err)
			mutex.Lock()
			delete(clients, conn)
			mutex.Unlock()
			break
		}

		logger.Info("Received message: %s", message)

		// Example: Broadcast the message to all clients
		broadcast(message)
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
	broadcast(msgBytes)
}
