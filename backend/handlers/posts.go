package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"forum/backend/controllers"
	"forum/backend/logger"
	"forum/backend/models"
	"forum/backend/utils"
)

// User struct definition
type User struct {
	ID        string `json:"user_id"`
	Nickname  string `json:"nickname"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
}

type VoteRequest struct {
	PostID   int    `json:"post_id"`
	VoteType string `json:"reaction_type"`
}

func GetPostsHandler(pc *controllers.PostController) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		page, _ := strconv.Atoi(r.URL.Query().Get("page"))
		limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))

		if page < 1 {
			page = 1
		}
		if limit < 1 || limit > 50 {
			limit = 10
		}

		offset := (page - 1) * limit

		posts, err := pc.GetAllPosts(offset, limit)
		if err != nil {
			logger.Error("Failed to fetch posts: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"posts": posts,
			"page":  page,
		})
	}
}

func CreatePostHandler(pc *controllers.PostController) http.HandlerFunc {
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

		// Inside CreatePostHandler, before processing files
		logger.Info("Starting to process files for post creation")
		if r.MultipartForm != nil {
			logger.Info("MultipartForm details:")
			for key, files := range r.MultipartForm.File {
				logger.Info("Key: %s, Number of files: %d", key, len(files))
				for i, fileHeader := range files {
					logger.Info("File %d: name=%s, size=%d bytes", i, fileHeader.Filename, fileHeader.Size)
				}
			}
		}

		// Parse multipart form
		if err := r.ParseMultipartForm(10 << 20); err != nil {
			logger.Error("Failed to parse multipart form: %v", err)
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{
				"error": "Failed to parse form data",
			})
			return
		}

		// Extract form fields
		title := r.FormValue("title")
		content := r.FormValue("content")
		category := r.FormValue("category")

		// Validate required fields
		if title == "" {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{
				"error": "Title is required",
			})
			return
		}

		if category == "" {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{
				"error": "Category is required",
			})
			return
		}

		// Check for video upload
		var videoPath string
		if form := r.MultipartForm; form != nil && form.File["post-video"] != nil && len(form.File["post-video"]) > 0 {
			videoPath, err = utils.UploadFile(r, "post-video", userID, 0)
			if err != nil {
				logger.Error("Failed to save video file: %v", err)
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusInternalServerError)
				json.NewEncoder(w).Encode(map[string]string{
					"error": "Failed to save video file",
				})
				return
			}
		}

		// Check for image uploads
		var imagePaths []string
		if videoPath == "" { // Only process images if no video was uploaded
			form := r.MultipartForm
			if form != nil && form.File["post-images"] != nil {
				logger.Info("Found %d images to process", len(form.File["post-images"]))
				for i, fileHeader := range form.File["post-images"] {
					logger.Info("Processing image %d: %s", i, fileHeader.Filename)
					imagePath, err := utils.UploadFile(r, "post-images", userID, i)
					if err != nil {
						logger.Error("Failed to save image file: %v", err)
						w.Header().Set("Content-Type", "application/json")
						w.WriteHeader(http.StatusInternalServerError)
						json.NewEncoder(w).Encode(map[string]string{
							"error": "Failed to save image file",
						})
						return
					}
					if imagePath != "" {
						imagePaths = append(imagePaths, imagePath)
					}
				}
			}
		}

		if content == "" && len(imagePaths) == 0 && videoPath == "" {
			logger.Warning("Invalid post creation request: missing content, images, and video")
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{
				"error": "Either content, images, or video is required",
			})
			return
		}

		userName, err := controllers.GetUsernameByID(pc.DB, userID)
		if err != nil || userName == "" {
			logger.Error("Failed to get username: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		// Create post
		post := models.Post{
			Title:     title,
			Author:    userName,
			UserID:    userID,
			Category:  category,
			Content:   content,
			Timestamp: time.Now(),
			VideoUrl: sql.NullString{
				String: videoPath,
				Valid:  videoPath != "",
			},
			Images: imagePaths,
		}

		// Insert post
		postID, err := pc.InsertPost(post)
		if err != nil {
			logger.Error("Failed to insert post: %v", err)
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{
				"error": "Failed to create post",
			})
			return
		}

		createdPost, err := pc.GetPostByID(postID)
		if err != nil {
			logger.Error("Failed to get Post by ID: %v", err)
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{
				"error": "Failed to create post",
			})
		}

		BroadcastNewPost(createdPost)

		// After successfully creating the post and broadcasting it
		postCount, err := pc.GetUserPostCount(userID)
		if err != nil {
			logger.Error("Failed to get user post count: %v", err)
		} else {
			// Create post count update message
			postCountEvent := map[string]interface{}{
				"type": "post_count_update",
				"payload": map[string]interface{}{
					"postCount": postCount,
				},
			}

			// Convert to JSON
			msgBytes, err := json.Marshal(postCountEvent)
			if err != nil {
				logger.Error("Error creating post count message: %v", err)
			} else {
				// Send only to the post creator
				SendToUser(userID, msgBytes)
			}
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"message": "Post created successfully",
		})
	}
}

func UpdatePostHandler(pc *controllers.PostController) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID := r.Context().Value("userID").(int)
		postIDStr := r.URL.Query().Get("postID")

		postID, err := strconv.Atoi(postIDStr)
		if err != nil {
			logger.Error("Failed to convertpostId to int - remote_addr: %s, method: %s, path: %s",
				r.RemoteAddr,
				r.Method,
				r.URL.Path,
			)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		// Parse multipart form
		if err := r.ParseMultipartForm(10 << 20); err != nil {
			logger.Error("Failed to parse multipart form: %v", err)
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{
				"error": "Failed to parse form data",
			})
			return
		}

		// Get existing post
		existingPost, err := pc.GetPostByID(postID)
		if err != nil {
			logger.Error("Failed to fetch post: %v", err)
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{
				"error": "Failed to fetch post",
			})
			return
		}

		// Verify post ownership
		isAuthor, err := pc.IsPostAuthor(existingPost.ID, userID)
		if err != nil || !isAuthor {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusUnauthorized)
			json.NewEncoder(w).Encode(map[string]string{
				"error": "Unauthorized",
			})
			return
		}

		// Extract form fields
		title := r.FormValue("title")
		content := r.FormValue("content")
		category := r.FormValue("category")

		// Update fields if provided
		if title != "" {
			existingPost.Title = title
		}
		if content != "" {
			existingPost.Content = content
		}
		if category != "" {
			existingPost.Category = category
		}

		// Handle video upload
		var videoPath string
		if form := r.MultipartForm; form != nil && form.File["post-video"] != nil && len(form.File["post-video"]) > 0 {
			videoPath, err = utils.UploadFile(r, "post-video", userID, 0)
			if err != nil {
				logger.Error("Failed to save video file: %v", err)
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusInternalServerError)
				json.NewEncoder(w).Encode(map[string]string{
					"error": "Failed to save video file",
				})
				return
			}
		}
		if videoPath != "" {
			existingPost.VideoUrl = sql.NullString{
				String: videoPath,
				Valid:  true,
			}
		}

		// Handle image uploads
		if videoPath == "" { // Only process images if no video was uploaded
			form := r.MultipartForm
			if form != nil && form.File["post-images"] != nil {
				var imagePaths []string
				for i := range form.File["post-images"] {
					imagePath, err := utils.UploadFile(r, "post-images", userID, i)
					if err != nil {
						logger.Error("Failed to save image file: %v", err)
						w.Header().Set("Content-Type", "application/json")
						w.WriteHeader(http.StatusInternalServerError)
						json.NewEncoder(w).Encode(map[string]string{
							"error": "Failed to save image file",
						})
						return
					}
					imagePaths = append(imagePaths, imagePath)
				}
				existingPost.Images = imagePaths
			}
		}

		// Update post
		err = pc.UpdatePost(existingPost)
		if err != nil {
			logger.Error("Failed to update post: %v", err)
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{
				"error": "Failed to update post",
			})
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{
			"message": "Post updated successfully",
		})
	}
}

func DeletePostHandler(pc *controllers.PostController) http.HandlerFunc {
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
			logger.Error("Failed to convert userID to int: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		postIDStr := r.URL.Query().Get("postID")

		postID, err := strconv.Atoi(postIDStr)
		if err != nil {
			logger.Error("Invalid post ID: %v", err)
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{
				"error": "Invalid post ID",
			})
			return
		}

		logger.Warning("Received delete request for post ID: %d", postID)
		// Verify post ownership
		isAuthor, err := pc.IsPostAuthor(postID, userID)
		if err != nil || !isAuthor {
			logger.Error("Failed to verify post ownership: %v", err)
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusUnauthorized)
			json.NewEncoder(w).Encode(map[string]string{
				"error": "Unauthorized",
			})
			return
		}

		logger.Warning("Post ownership verified, deleting post ID: %d", postID)
		// Delete post
		err = pc.DeletePost(postID, userID)
		if err != nil {
			logger.Error("Failed to delete post: %v", err)
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{
				"error": "Failed to delete post",
			})
			return
		}

		logger.Warning("Post deleted successfully")

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{
			"message": "Post deleted successfully",
		})
	}
}

func HandleVotePost(pc *controllers.PostController) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Get user ID from context
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
			logger.Error("Failed to convert userID to int: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		// Parse request body
		var req VoteRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			logger.Error("Failed to decode vote request: %v", err)
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{
				"error": "Invalid request format",
			})
			return
		}

		// Validate vote type
		if req.VoteType != "like" && req.VoteType != "dislike" {
			logger.Error("Invalid vote type: %s", req.VoteType)
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{
				"error": "Invalid vote type",
			})
			return
		}

		// Handle the vote
		sameVote, err := pc.HandleVote(req.PostID, userID, req.VoteType)
		if err != nil {
			logger.Error("Failed to handle vote: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{
				"error": "Failed to process vote",
			})
			return
		}

		// Get updated post to return new counts
		post, err := pc.GetPostByID(req.PostID)
		if err != nil {
			logger.Error("Failed to get updated post: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{
				"error": "Failed to get updated post",
			})
			return
		}

		// Only create and send notification if the recipient is not the current user
		if post.User.ID != userID && !sameVote {

			// Get username of voter
			userName, err := controllers.GetUsernameByID(pc.DB, userID)
			if err != nil {
				logger.Error("Failed to get username: %v", err)
				userName = "Someone" // Fallback if username lookup fails
			}

			// Create notification for post author
			notification := models.Notification{
				RecipientID: post.User.ID,
				ActorID:     userID,
				Type:        req.VoteType,
				EntityType:  "post",
				EntityID:    req.PostID,
				Message:     fmt.Sprintf("%s %sd your post: %s", userName, req.VoteType, post.Title),
			}

			nc := controllers.NewNotificationController(pc.DB)
			_, err = nc.CreateNotification(notification)
			if err != nil {
				logger.Error("Failed to create notification: %v", err)
			} else {
				// Get the created notification with actor details
				notifications, _, err := nc.GetNotifications(post.User.ID, 1, 0)
				if err != nil {
					logger.Error("Failed to get notifications: %v", err)
				}
				if err == nil && len(notifications) > 0 {
					// Convert notification to JSON bytes
					msgBytes, err := json.Marshal(map[string]interface{}{
						"type":    "new_notification",
						"payload": notifications[0],
					})
					if err == nil {
						// Send notification to post author
						SendToUser(post.User.ID, msgBytes)
					}
				}
			}
		}

		// Get user's current vote status
		currentVote, err := pc.GetUserVote(req.PostID, userID)
		if err != nil {
			logger.Error("Failed to get user vote: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{
				"error": "Failed to get vote status",
			})
			return
		}

		// Broadcast the update via WebSocket
		BroadcastPostReaction(req.PostID, post.Likes, post.Dislikes)

		// Return response to original requester
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"likes":       post.Likes,
			"dislikes":    post.Dislikes,
			"currentVote": currentVote,
		})
	}
}
