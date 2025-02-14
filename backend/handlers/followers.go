package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"forum/backend/controllers"
	"forum/backend/logger"
	"forum/backend/models"
)

type FollowResponse struct {
	Connections []models.UserFollower `json:"connections"`
	TotalCount  int                   `json:"totalCount"`
}

func FollowUserHandler(fc *controllers.FollowersController) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID := r.Context().Value(models.UserIDKey).(string)

		// Parse the user ID to follow from the request
		var requestBody struct {
			FollowingID int `json:"following_id"`
		}

		if err := json.NewDecoder(r.Body).Decode(&requestBody); err != nil {
			logger.Error("Invalid request body: %v", err)
			w.WriteHeader(http.StatusBadRequest)
			return
		}
		if requestBody.FollowingID == 0 {
			logger.Error("Invalid following ID: %v", requestBody.FollowingID)
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		// Convert current user ID from string to int
		followerID, err := strconv.Atoi(userID)
		if err != nil {
			logger.Error("Invalid user ID: %v", err)
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		// Create followers controller and insert the relationship
		if err := fc.InsertUserFollower(followerID, requestBody.FollowingID); err != nil {
			logger.Error("Failed to follow user: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		// Get counts for both users
		followersCount, followingCount, err := fc.GetFollowCounts(requestBody.FollowingID)
		if err != nil {
			logger.Error("Failed to get counts: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		// Create the follow event message
		followEvent := map[string]interface{}{
			"type": "user_followed",
			"payload": map[string]interface{}{
				"followerId":     followerID,
				"followingId":    requestBody.FollowingID,
				"followersCount": followersCount,
				"followingCount": followingCount,
			},
		}

		// Convert the event to JSON
		msgBytes, err := json.Marshal(followEvent)
		if err != nil {
			logger.Error("Error creating message: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		// Send the message to both users involved
		SendToUser(followerID, msgBytes)              // Send to the follower
		SendToUser(requestBody.FollowingID, msgBytes) // Send to the person being followed

		// Send success response
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{
			"message": "Successfully followed user",
		})
	}
}

func UnfollowUserHandler(fc *controllers.FollowersController) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID := r.Context().Value(models.UserIDKey).(string)

		// Parse the user ID to unfollow from the request
		var requestBody struct {
			FollowingID int `json:"following_id"`
		}

		if err := json.NewDecoder(r.Body).Decode(&requestBody); err != nil {
			logger.Error("Invalid request body: %v", err)
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		if requestBody.FollowingID == 0 {
			logger.Error("Invalid following ID: %v", requestBody.FollowingID)
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		// Convert current user ID from string to int
		followerID, err := strconv.Atoi(userID)
		if err != nil {
			logger.Error("Invalid user ID: %v", err)
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		// Delete the follower relationship
		if err := fc.DeleteUserFollower(followerID, requestBody.FollowingID); err != nil {
			logger.Error("Failed to unfollow user: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		// Get updated counts after unfollowing
		followersCount, followingCount, err := fc.GetFollowCounts(requestBody.FollowingID)
		if err != nil {
			logger.Error("Failed to get counts: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		response := map[string]interface{}{
			"message":         "Successfully unfollowed user",
			"followers_count": followersCount,
			"following_count": followingCount,
		}

		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(response)
	}
}

func GetFollowCountsHandler(fc *controllers.FollowersController) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Get user ID from query parameter
		userIDStr := r.Context().Value(models.UserIDKey).(string)
		if userIDStr == "" {
			logger.Error("User ID is required")
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		userID, err := strconv.Atoi(userIDStr)
		if err != nil {
			logger.Error("Invalid user ID: %v", err)
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		followersCount, followingCount, err := fc.GetFollowCounts(userID)
		if err != nil {
			logger.Error("Failed to get counts: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		response := map[string]interface{}{
			"followers_count": followersCount,
			"following_count": followingCount,
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
	}
}

func GetUserFollowingListHandler(fc *controllers.FollowersController) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID := r.Context().Value(models.UserIDKey).(string)

		followerID, err := strconv.Atoi(userID)
		if err != nil {
			logger.Error("Invalid user ID: %v", err)
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		followingList, err := fc.GetUserFollowingId(followerID)
		if err != nil {
			logger.Error("Failed to get following list: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(followingList)
	}
}

func GetUserFollowersHandler(fc *controllers.FollowersController) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID := r.Context().Value(models.UserIDKey).(string)

		userIDInt, err := strconv.Atoi(userID)
		if err != nil {
			logger.Error("Invalid user ID: %v", err)
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		if userIDInt == 0 {
			logger.Error("Unauthorized")
			w.WriteHeader(http.StatusUnauthorized)
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

		followers, err := fc.GetUserFollowers(userIDInt, page, limit)
		if err != nil {
			logger.Error("Failed to fetch followers: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		followersCount, _, err := fc.GetFollowCounts(userIDInt)
		if err != nil {
			logger.Error("Failed to fetch counts: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		response := FollowResponse{
			Connections: followers,
			TotalCount:  followersCount,
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
	}
}

func GetUserFollowingHandler(fc *controllers.FollowersController) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID := r.Context().Value(models.UserIDKey).(string)

		userIDInt, err := strconv.Atoi(userID)
		if err != nil {
			logger.Error("Invalid user ID: %v", err)
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		if userIDInt == 0 {
			logger.Error("Unauthorized")
			w.WriteHeader(http.StatusUnauthorized)
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

		following, err := fc.GetUserFollowing(userIDInt, page, limit)
		if err != nil {
			logger.Error("Failed to fetch following: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		_, followingCount, err := fc.GetFollowCounts(userIDInt)
		if err != nil {
			logger.Error("Failed to fetch counts: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		response := FollowResponse{
			Connections: following,
			TotalCount:  followingCount,
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
	}
}
