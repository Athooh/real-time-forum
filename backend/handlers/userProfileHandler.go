package handlers

import (
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

func GetUserAboutHandler(uc *controllers.UsersController) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		userID := r.Context().Value(models.UserIDKey).(string)
		userIDInt, err := strconv.Atoi(userID)
		if err != nil {
			logger.Error("Invalid user ID: %v", err)
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "Invalid user ID"})
			return
		}

		about, err := uc.GetUserAbout(userIDInt)
		if err != nil {
			logger.Error("Failed to get user about: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "Failed to fetch user information"})
			return
		}

		// Get user profile data
		profile, err := uc.GetUserProfile(userIDInt)
		if err != nil {
			logger.Error("Failed to get user profile: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "Failed to fetch user profile"})
			return
		}

		if about == nil && profile == nil {
			logger.Error("User information not found")
			w.WriteHeader(http.StatusNotFound)
			json.NewEncoder(w).Encode(map[string]string{"error": "User information not found"})
			return
		}

		// Combine about and profile data in response
		response := map[string]interface{}{
			"about":   about,
			"profile": profile,
		}

		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(response)
	}
}

func UpsertUserAboutHandler(uc *controllers.UsersController) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		// Parse multipart form with 10MB max memory
		if err := r.ParseMultipartForm(10 << 20); err != nil {
			logger.Error("Failed to parse multipart form: %v", err)
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "Failed to parse form data"})
			return
		}

		userID := r.Context().Value(models.UserIDKey).(string)
		userIDInt, err := strconv.Atoi(userID)
		if err != nil {
			logger.Error("Invalid user ID: %v", err)
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "Invalid user ID"})
			return
		}

		// Get the settings JSON from form data
		settingsJSON := r.FormValue("settings")
		if settingsJSON == "" {
			logger.Error("No settings data provided")
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "No settings data provided"})
			return
		}

		var requestBody struct {
			Profile struct {
				Nickname   string `json:"nickname"`
				Email      string `json:"email"`
				Profession string `json:"profession"`
			} `json:"profile"`
			About struct {
				Bio                string    `json:"bio"`
				DateOfBirth        time.Time `json:"date_of_birth"`
				RelationshipStatus string    `json:"relationship_status"`
				Website            string    `json:"website"`
				Location           string    `json:"location"`
				GithubURL          string    `json:"github_url"`
				LinkedinURL        string    `json:"linkedin_url"`
				TwitterURL         string    `json:"twitter_url"`
				PhoneNumber        string    `json:"phone_number"`
				Interests          string    `json:"interests"`
				IsProfilePublic    bool      `json:"is_profile_public"`
				ShowEmail          bool      `json:"show_email"`
				ShowPhone          bool      `json:"show_phone"`
			} `json:"about"`
		}

		if err := json.Unmarshal([]byte(settingsJSON), &requestBody); err != nil {
			logger.Error("Failed to decode settings JSON: %v", err)
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "Invalid settings data"})
			return
		}

		fmt.Println("website: ", requestBody.About.Website)
		// Handle file uploads
		var avatarPath, coverPath string

		// Upload avatar if provided
		if _, _, err := r.FormFile("avatar"); err == nil {
			avatarPath, err = utils.UploadFile(r, "avatar", userIDInt, 0)
			if err != nil {
				logger.Error("Failed to upload avatar: %v", err)
				w.WriteHeader(http.StatusInternalServerError)
				json.NewEncoder(w).Encode(map[string]string{"error": "Failed to upload avatar"})
				return
			}
		}

		// Upload cover photo if provided
		if _, _, err := r.FormFile("cover_photo"); err == nil {
			coverPath, err = utils.UploadFile(r, "cover_photo", userIDInt, 0)
			if err != nil {
				logger.Error("Failed to upload cover photo: %v", err)
				w.WriteHeader(http.StatusInternalServerError)
				json.NewEncoder(w).Encode(map[string]string{"error": "Failed to upload cover photo"})
				return
			}
		}

		// Update profile with new data
		profile := models.UserProfile{
			Nickname:   requestBody.Profile.Nickname,
			Email:      requestBody.Profile.Email,
			Profession: requestBody.Profile.Profession,
		}

		// Only set image paths if new files were uploaded
		if avatarPath != "" {
			profile.Avatar = &avatarPath
		}
		if coverPath != "" {
			profile.CoverImage = &coverPath
		}

		if err := uc.UpsertUserProfile(&profile); err != nil {
			logger.Error("Failed to update user profile: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "Failed to update user profile"})
			return
		}

		// Update about information
		about := models.UserAbout{
			UserID:             userIDInt,
			Bio:                requestBody.About.Bio,
			DateOfBirth:        requestBody.About.DateOfBirth,
			RelationshipStatus: requestBody.About.RelationshipStatus,
			Location:           requestBody.About.Location,
			GithubURL:          requestBody.About.GithubURL,
			LinkedinURL:        requestBody.About.LinkedinURL,
			TwitterURL:         requestBody.About.TwitterURL,
			PhoneNumber:        requestBody.About.PhoneNumber,
			Interests:          requestBody.About.Interests,
			IsProfilePublic:    requestBody.About.IsProfilePublic,
			ShowEmail:          requestBody.About.ShowEmail,
			ShowPhone:          requestBody.About.ShowPhone,
			Website:            requestBody.About.Website,
		}

		if err := uc.UpsertUserAbout(&about); err != nil {
			logger.Error("Failed to update user about: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "Failed to update user information"})
			return
		}

		// Return success response with updated data
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"profile": profile,
			"about":   about,
		})
	}
}

func GetUserExperiencesHandler(uc *controllers.UsersController) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		userID := r.Context().Value(models.UserIDKey).(string)
		userIDInt, err := strconv.Atoi(userID)
		if err != nil {
			logger.Error("Invalid user ID: %v", err)
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "Invalid user ID"})
			return
		}

		experiences, err := uc.GetUserExperiences(userIDInt)
		if err != nil {
			logger.Error("Failed to get user experiences: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "Failed to fetch user experiences"})
			return
		}

		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(experiences)
	}
}

func CreateExperienceHandler(uc *controllers.UsersController) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		userID := r.Context().Value(models.UserIDKey).(string)
		userIDInt, err := strconv.Atoi(userID)
		if err != nil {
			logger.Error("Invalid user ID: %v", err)
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "Invalid user ID"})
			return
		}

		var exp models.UserExperience
		if err := json.NewDecoder(r.Body).Decode(&exp); err != nil {
			logger.Error("Failed to decode request body: %v", err)
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "Invalid request body"})
			return
		}

		exp.UserID = userIDInt

		if err := uc.CreateExperience(&exp); err != nil {
			logger.Error("Failed to create experience: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "Failed to create experience"})
			return
		}

		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(exp)
	}
}

func UpdateExperienceHandler(uc *controllers.UsersController) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		userID := r.Context().Value(models.UserIDKey).(string)
		userIDInt, err := strconv.Atoi(userID)
		if err != nil {
			logger.Error("Invalid user ID: %v", err)
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "Invalid user ID"})
			return
		}

		expID := r.URL.Query().Get("id")
		expIDInt, err := strconv.Atoi(expID)
		if err != nil {
			logger.Error("Invalid experience ID: %v", err)
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "Invalid experience ID"})
			return
		}

		var exp models.UserExperience
		if err := json.NewDecoder(r.Body).Decode(&exp); err != nil {
			logger.Error("Failed to decode request body: %v", err)
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "Invalid request body"})
			return
		}

		exp.ID = expIDInt
		exp.UserID = userIDInt

		if err := uc.UpdateExperience(&exp); err != nil {
			logger.Error("Failed to update experience: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "Failed to update experience"})
			return
		}

		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(exp)
	}
}

func DeleteExperienceHandler(uc *controllers.UsersController) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		userID := r.Context().Value(models.UserIDKey).(string)
		userIDInt, err := strconv.Atoi(userID)
		if err != nil {
			logger.Error("Invalid user ID: %v", err)
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "Invalid user ID"})
			return
		}

		expID := r.URL.Query().Get("id")
		expIDInt, err := strconv.Atoi(expID)
		if err != nil {
			logger.Error("Invalid experience ID: %v", err)
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "Invalid experience ID"})
			return
		}

		if err := uc.DeleteExperience(userIDInt, expIDInt); err != nil {
			logger.Error("Failed to delete experience: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "Failed to delete experience"})
			return
		}

		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{"message": "Experience deleted successfully"})
	}
}

func GetUserFriendsHandler(uc *controllers.UsersController) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		// Get user ID from context
		userID := r.Context().Value(models.UserIDKey).(string)
		userIDInt, err := strconv.Atoi(userID)
		if err != nil {
			logger.Error("Invalid user ID: %v", err)
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "Invalid user ID"})
			return
		}

		// Get pagination parameters
		page, _ := strconv.Atoi(r.URL.Query().Get("page"))
		limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))

		if page < 1 {
			page = 1
		}
		if limit < 1 || limit > 50 {
			limit = 10
		}

		offset := (page - 1) * limit

		// Get friends
		response, err := uc.GetUserFriends(userIDInt, offset, limit)
		if err != nil {
			logger.Error("Failed to get user friends: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "Failed to fetch friends"})
			return
		}

		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(response)
	}
}

func DeleteUserHandler(uc *controllers.UsersController) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		// Get user ID from context
		userID := r.Context().Value(models.UserIDKey).(string)
		userIDInt, err := strconv.Atoi(userID)
		if err != nil {
			logger.Error("Invalid user ID: %v", err)
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "Invalid user ID"})
			return
		}

		// Delete the user and all related data
		err = uc.DeleteUser(userIDInt)
		if err != nil {
			logger.Error("Failed to delete user: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "Failed to delete user"})
			return
		}

		// Return success response
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{
			"message": "User and all related data deleted successfully",
		})
	}
}

func GetUserPhotosHandler(uc *controllers.UsersController) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Get user ID from URL parameter
		userIDStr := r.URL.Query().Get("userId")
		userID, err := strconv.Atoi(userIDStr)
		if err != nil {
			logger.Error("Invalid user ID: %v", err)
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		// Fetch user's photos
		photos, err := uc.GetUserPhotos(userID)
		if err != nil {
			logger.Error("Failed to fetch user photos: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		// Return photos as JSON
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(photos)
	}
}
