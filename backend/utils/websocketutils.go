package utils

import (
	"encoding/json"
	"log"
	"sync"

	"forum/backend/database"
	"forum/backend/logger"

	"github.com/gorilla/websocket"
)

var (
	Clients = make(map[*websocket.Conn]int)
	Mutex   = sync.Mutex{}
)

// Broadcast sends a message to all connected clients
func Broadcast(message []byte) {
	Mutex.Lock()
	defer Mutex.Unlock()

	for client := range Clients {
		err := client.WriteMessage(websocket.TextMessage, message)
		if err != nil {
			log.Println("Error broadcasting message:", err)
			client.Close()
			delete(Clients, client)
		}
	}
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
