package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"

	"forum/backend/controllers"
	"forum/backend/logger"
	"forum/backend/models"
)

type Comment struct {
	ID        string `json:"id"`
	PostID    string `json:"post_id"`
	UserID    string `json:"user_id"`
	Content   string `json:"content"`
	Timestamp string `json:"timestamp"`
}

func CreateCommentHandler(cc *controllers.CommentController) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userIDAny := r.Context().Value(models.UserIDKey)
		userIDStr, ok := userIDAny.(string)
		if !ok {
			logger.Error("Failed to convert userID to string - remote_addr: %s, method: %s, path: %s",
				r.RemoteAddr,
				r.Method,
				r.URL.Path,
			)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		userID, err := strconv.Atoi(userIDStr)
		if err != nil {
			logger.Error("Failed to convert userID to int - remote_addr: %s, method: %s, path: %s",
				r.RemoteAddr,
				r.Method,
				r.URL.Path,
			)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		var Decodecomment struct {
			PostID   int    `json:"post_id"`
			Content  string `json:"content"`
			ParentID *int   `json:"parent_id,omitempty"`
		}
		if err := json.NewDecoder(r.Body).Decode(&Decodecomment); err != nil {
			logger.Error("Failed to decode comment body: %v - remote_addr: %s, method: %s, path: %s",
				err,
				r.RemoteAddr,
				r.Method,
				r.URL.Path,
			)
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{
				"error": "Invalid request body",
			})
			return
		}

		userName, err := controllers.GetUsernameByID(cc.DB, userID)
		if err != nil {
			logger.Error("Failed to get username: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		if Decodecomment.PostID <= 0 || userID <= 0 || Decodecomment.Content == "" {
			logger.Error("Invalid comment creation request: missing post_id, content, or user_id: %v",
				Decodecomment,
			)
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{
				"error": "missing post_id, user_id, or content",
			})
			return
		}

		commentInsert := models.Comment{
			PostID:  Decodecomment.PostID,
			UserID:  userID,
			Content: Decodecomment.Content,
			Author:  userName,
			ParentID: sql.NullInt64{
				Int64: 0,
				Valid: false,
			},
		}

		if Decodecomment.ParentID != nil {
			commentInsert.ParentID = sql.NullInt64{
				Int64: int64(*Decodecomment.ParentID),
				Valid: true,
			}
		}

		commentID, err := cc.CreateComment(commentInsert)
		if err != nil {
			logger.Error("Failed to create comment: %v - remote_addr: %s, method: %s, path: %s",
				err,
				r.RemoteAddr,
				r.Method,
				r.URL.Path,
			)
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{
				"error": "Failed to create comment",
			})
			return
		}

		// Get post author ID
		var postAuthorID int
		err = cc.DB.QueryRow("SELECT user_id FROM posts WHERE id = ?", Decodecomment.PostID).Scan(&postAuthorID)
		if err != nil {
			logger.Error("Failed to get post author ID: %v", err)
			// Continue without notification since the comment was created successfully
		} else if postAuthorID != userID { // Don't notify if user comments on their own post
			// Create notification for post author
			notification := models.Notification{
				RecipientID: postAuthorID,
				ActorID:     userID,
				Type:        "comment",
				EntityType:  "post",
				EntityID:    Decodecomment.PostID,
				Message:     fmt.Sprintf("%s commented on your post", userName),
			}

			nc := controllers.NewNotificationController(cc.DB)
			_, err = nc.CreateNotification(notification)
			if err == nil {
				// Get the created notification with actor details
				notifications, _, err := nc.GetNotifications(postAuthorID, 1, 0)
				if err == nil && len(notifications) > 0 {
					// Convert notification to JSON bytes
					msgBytes, err := json.Marshal(map[string]interface{}{
						"type":    "new_notification",
						"payload": notifications[0],
					})
					if err == nil {
						// Send notification to post author
						SendToUser(postAuthorID, msgBytes)
					}
				}
			}
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"comment_id": commentID,
			"message":    "Comment created successfully",
		})
	}
}

func DeleteCommentHandler(cc *controllers.CommentController) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userIDAny := r.Context().Value(models.UserIDKey).(string)
		userIDInt, err := strconv.Atoi(userIDAny)
		if err != nil {
			logger.Error("Failed to convert userID to int - remote_addr: %s, method: %s, path: %s",
				r.RemoteAddr,
				r.Method,
				r.URL.Path,
			)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		commentID := r.URL.Query().Get("comment_id")

		commentIDInt, err := strconv.Atoi(commentID)
		if err != nil {
			logger.Error("Failed to convert commentID to int - remote_addr: %s, method: %s, path: %s",
				r.RemoteAddr,
				r.Method,
				r.URL.Path,
			)
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		if err := cc.DeleteComment(commentIDInt, userIDInt); err != nil {
			if err.Error() == "unauthorized to delete this comment" {
				http.Error(w, err.Error(), http.StatusUnauthorized)
				return
			}
			logger.Error("Failed to delete comment: %v - remote_addr: %s, method: %s, path: %s",
				err,
				r.RemoteAddr,
				r.Method,
				r.URL.Path,
			)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{
			"message": "Comment deleted successfully",
		})
	}
}

func GetCommentsHandler(cc *controllers.CommentController) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		postIDStr := r.URL.Query().Get("post_id")
		postID, err := strconv.Atoi(postIDStr)
		if err != nil {
			logger.Error("Failed to convert postID to int - remote_addr: %s, method: %s, path: %s",
				r.RemoteAddr,
				r.Method,
				r.URL.Path,
			)
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		comments, err := controllers.NewPostController(cc.DB).GetPostComments(postID)
		if err != nil {
			logger.Error("Failed to fetch comments: %v - remote_addr: %s, method: %s, path: %s",
				err,
				r.RemoteAddr,
				r.Method,
				r.URL.Path,
			)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		json.NewEncoder(w).Encode(comments)
	}
}

func LikeCommentHandler(cc *controllers.CommentController) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		commentID := r.URL.Query().Get("comment_id")
		commentIDInt, err := strconv.Atoi(commentID)
		if err != nil {
			logger.Error("Failed to convert commentID to int - remote_addr: %s, method: %s, path: %s",
				r.RemoteAddr,
				r.Method,
				r.URL.Path,
			)
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		if err := cc.LikeComment(commentIDInt); err != nil {
			logger.Error("Failed to like comment: %v - remote_addr: %s, method: %s, path: %s",
				err,
				r.RemoteAddr,
				r.Method,
				r.URL.Path,
			)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusOK)
	}
}

func UnlikeCommentHandler(cc *controllers.CommentController) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		commentID := r.URL.Query().Get("comment_id")
		commentIDInt, err := strconv.Atoi(commentID)
		if err != nil {
			logger.Error("Failed to convert commentID to int - remote_addr: %s, method: %s, path: %s",
				r.RemoteAddr,
				r.Method,
				r.URL.Path,
			)
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		if err := cc.UnlikeComment(commentIDInt); err != nil {
			logger.Error("Failed to unlike comment: %v - remote_addr: %s, method: %s, path: %s",
				err,
				r.RemoteAddr,
				r.Method,
				r.URL.Path,
			)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusOK)
	}
}

func DislikeCommentHandler(cc *controllers.CommentController) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		commentID := r.URL.Query().Get("comment_id")
		commentIDInt, err := strconv.Atoi(commentID)
		if err != nil {
			logger.Error("Failed to convert commentID to int - remote_addr: %s, method: %s, path: %s",
				r.RemoteAddr,
				r.Method,
				r.URL.Path,
			)
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		if err := cc.DislikeComment(commentIDInt); err != nil {
			logger.Error("Failed to dislike comment: %v - remote_addr: %s, method: %s, path: %s",
				err,
				r.RemoteAddr,
				r.Method,
				r.URL.Path,
			)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusOK)
	}
}

func UndislikeCommentHandler(cc *controllers.CommentController) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		commentID := r.URL.Query().Get("comment_id")
		commentIDInt, err := strconv.Atoi(commentID)
		if err != nil {
			logger.Error("Failed to convert commentID to int - remote_addr: %s, method: %s, path: %s",
				r.RemoteAddr,
				r.Method,
				r.URL.Path,
			)
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		if err := cc.UndislikeComment(commentIDInt); err != nil {
			logger.Error("Failed to undislike comment: %v - remote_addr: %s, method: %s, path: %s",
				err,
				r.RemoteAddr,
				r.Method,
				r.URL.Path,
			)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusOK)
	}
}
