package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"

	"forum/backend/controllers"
	"forum/backend/logger"
	"forum/backend/models"
)

func CreateNotificationHandler(nc *controllers.NotificationController) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var notification models.Notification

		if err := json.NewDecoder(r.Body).Decode(&notification); err != nil {
			logger.Error("Invalid request body in CreateNotificationHandler %v", err)
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		fmt.Printf("Creating notification: RecipientID=%d, ActorID=%d, Type=%s, EntityType=%s, EntityID=%d, Message=%s\n",
			notification.RecipientID,
			notification.ActorID,
			notification.Type,
			notification.EntityType,
			notification.EntityID,
			notification.Message)

		_, err := nc.CreateNotification(notification)
		if err != nil {
			logger.Error("Failed to create notification in CreateNotificationHandler %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		// Convert notification to JSON bytes
		msgBytes, err := json.Marshal(map[string]interface{}{
			"type":    "NEW_NOTIFICATION",
			"payload": notification,
		})
		if err != nil {
			logger.Error("Error creating notification message: %v", err)
		} else {
			// Send only to the notification recipient
			SendToUser(int(notification.RecipientID), msgBytes)
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(notification)
	}
}

func GetNotificationsHandler(nc *controllers.NotificationController) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID := r.Context().Value(models.UserIDKey).(string)
		userIDInt, err := strconv.Atoi(userID)
		if err != nil {
			logger.Error("Invalid user ID in GetNotificationsHandler %v", err)
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

		notifications, unreadCount, err := nc.GetNotifications(userIDInt, limit, offset)
		if err != nil {
			logger.Error("Failed to fetch notifications in GetNotificationsHandler %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		response := map[string]interface{}{
			"notifications": notifications,
			"unread":        unreadCount,
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
	}
}

func MarkNotificationAsReadHandler(nc *controllers.NotificationController) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		notificationID := r.URL.Query().Get("notificationId")
		userID := r.Context().Value(models.UserIDKey).(string)
		userIDInt, err := strconv.Atoi(userID)
		if err != nil {
			logger.Error("Invalid user ID in MarkNotificationAsReadHandler %v", err)
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		notificationIDInt, err := strconv.Atoi(notificationID)
		if err != nil {
			logger.Error("Invalid notification ID in MarkNotificationAsReadHandler %v", err)
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		unreadCount, err := nc.MarkNotificationAsRead(notificationIDInt, userIDInt)
		if err != nil {
			logger.Error("Failed to mark notification as read in MarkNotificationAsReadHandler %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success":      true,
			"unread_count": unreadCount,
		})
	}
}

func ClearNotificationsHandler(nc *controllers.NotificationController) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID := r.Context().Value(models.UserIDKey).(string)
		userIDInt, err := strconv.Atoi(userID)
		if err != nil {
			logger.Error("Invalid user ID in ClearNotificationsHandler %v", err)
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		err = nc.ClearNotifications(userIDInt)
		if err != nil {
			logger.Error("Failed to clear notifications in ClearNotificationsHandler %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{
			"success": "All notifications cleared successfully",
		})
	}
}
