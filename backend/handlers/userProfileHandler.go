package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"forum/backend/controllers"
	"forum/backend/logger"
	"forum/backend/models"
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

		if about == nil {
			w.WriteHeader(http.StatusNotFound)
			json.NewEncoder(w).Encode(map[string]string{"error": "User about information not found"})
			return
		}

		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(about)
	}
}

func UpsertUserAboutHandler(uc *controllers.UsersController) http.HandlerFunc {
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

		var about models.UserAbout
		if err := json.NewDecoder(r.Body).Decode(&about); err != nil {
			logger.Error("Failed to decode request body: %v", err)
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "Invalid request body"})
			return
		}

		about.UserID = userIDInt

		if err := uc.UpsertUserAbout(&about); err != nil {
			logger.Error("Failed to upsert user about: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "Failed to update user information"})
			return
		}

		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(about)
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
