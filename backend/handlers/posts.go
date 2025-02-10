package handlers

import (
	"database/sql"
	"encoding/json"
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
		userID := r.Context().Value("userID").(int)
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

		// Verify post ownership
		isAuthor, err := pc.IsPostAuthor(postID, userID)
		if err != nil || !isAuthor {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusUnauthorized)
			json.NewEncoder(w).Encode(map[string]string{
				"error": "Unauthorized",
			})
			return
		}

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

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{
			"message": "Post deleted successfully",
		})
	}
}
