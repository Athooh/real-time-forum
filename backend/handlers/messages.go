package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"forum/backend/controllers"
	"forum/backend/logger"
	"forum/backend/models"
)

func SendMessageHandler(mc *controllers.MessageController) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID := r.Context().Value(models.UserIDKey).(string)

		userIDInt, err := strconv.Atoi(userID)
		if err != nil {
			logger.Error("Invalid user ID in SendMessageHandler %v", err)
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		var req struct {
			RecipientID int    `json:"recipient_id"`
			Content     string `json:"content"`
		}

		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			logger.Error("Invalid request body in SendMessageHandler %v", err)
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		_, timestamp, err := mc.SendMessageController(userIDInt, req.RecipientID, req.Content)
		if err != nil {
			logger.Error("Failed to send message in SendMessageHandler %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		// Get sender's information
		senderInfo, err := mc.GetUserInfo(userIDInt)
		if err != nil {
			logger.Error("Failed to get sender info in SendMessageHandler %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		// Modified WebSocket payload
		payload := map[string]interface{}{
			"type": "new_message",
			"payload": map[string]interface{}{
				"sender_id": userIDInt,
				"content":   req.Content,
				"timestamp": timestamp,
				"user": map[string]interface{}{
					"id":       senderInfo.ID,
					"nickname": senderInfo.Nickname,
					"avatar":   senderInfo.Avatar,
					"isOnline": senderInfo.IsOnline,
				},
			},
		}

		payloadBytes, _ := json.Marshal(payload)
		SendToUser(req.RecipientID, payloadBytes)

		unreadCount, err := mc.GetUnreadMessageCount(req.RecipientID)
		if err != nil {
			logger.Error("Failed to get unread message count in SendMessageHandler %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		BroadcastUnreadCount(req.RecipientID, unreadCount)

		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"message": "Message sent successfully",
		})
	}
}

func GetMessagesConversationHandler(mc *controllers.MessageController) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID := r.Context().Value(models.UserIDKey).(string)
		page, _ := strconv.Atoi(r.URL.Query().Get("page"))
		limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))

		if page < 1 {
			page = 1
		}
		if limit < 1 || limit > 50 {
			limit = 10
		}

		offset := (page - 1) * limit

		userIDInt, err := strconv.Atoi(userID)
		if err != nil {
			logger.Error("Invalid user ID in GetMessagesConversationHandler %v", err)
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		recipientID := r.URL.Query().Get("recipient_id")
		recipientIDInt, err := strconv.Atoi(recipientID)
		if err != nil {
			logger.Error("Invalid recipient ID in GetMessagesConversationHandler %v", err)
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		messages, err := mc.GetMessagesInConversation(userIDInt, recipientIDInt, offset, limit)
		if err != nil {
			logger.Error("Failed to get messages in GetMessagesConversationHandler %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(messages)
	}
}

func GetAllMessagesHandler(mc *controllers.MessageController) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID := r.Context().Value(models.UserIDKey).(string)
		userIDInt, err := strconv.Atoi(userID)
		if err != nil {
			logger.Error("Invalid user ID in GetAllMessagesHandler %v", err)
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		page, _ := strconv.Atoi(r.URL.Query().Get("page"))
		limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))

		if page < 1 {
			page = 1
		}
		if limit < 1 || limit > 50 {
			limit = 10
		}

		offset := (page - 1) * limit

		messages, err := mc.GetAllMessages(userIDInt, limit, offset)
		if err != nil {
			logger.Error("Failed to get all messages in GetAllMessagesHandler %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(messages)
	}
}

func MarkMessageAsReadHandler(mc *controllers.MessageController) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID := r.Context().Value(models.UserIDKey).(string)
		userIDInt, err := strconv.Atoi(userID)
		if err != nil {
			logger.Error("Invalid user ID in MarkMessageAsReadHandler %v", err)
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		msgIDStr := r.URL.Query().Get("msgID")
		msgID, err := strconv.Atoi(msgIDStr)
		if err != nil {
			logger.Error("Invalid message ID in MarkMessageAsReadHandler %v", err)
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		response, err := mc.MarkMessageAsRead(msgID)
		if err != nil {
			logger.Error("Failed to mark message as read %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		unreadCount := response.UnreadCount
		senderID := response.UserId

		BroadcastUnreadCount(userIDInt, unreadCount)

		BroadcastMessageListMarkAsRead(userIDInt, senderID)

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{"status": "success"})
	}
}

func GetUnreadCountHandler(mc *controllers.MessageController) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID := r.Context().Value(models.UserIDKey).(string)
		userIDInt, err := strconv.Atoi(userID)
		if err != nil {
			logger.Error("Invalid user ID in GetUnreadCountHandler %v", err)
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		count, err := mc.GetUnreadMessageCount(userIDInt)
		if err != nil {
			logger.Error("Failed to get unread message count in GetUnreadCountHandler %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]int{
			"unreadCount": count,
		})
	}
}

func TypingStatusHandler(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(models.UserIDKey).(string)
	senderID, err := strconv.Atoi(userID)
	if err != nil {
		logger.Error("Invalid user ID in TypingStatusHandler %v", err)
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	var req struct {
		RecipientID int  `json:"recipient_id"`
		IsTyping    bool `json:"is_typing"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		logger.Error("Invalid request body in TypingStatusHandler %v", err)
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	// Broadcast typing status through WebSocket
	BroadcastTypingStatus(senderID, req.RecipientID, req.IsTyping)

	w.WriteHeader(http.StatusOK)
}
