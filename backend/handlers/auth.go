package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"forum/backend/controllers"
	"forum/backend/database"
	"forum/backend/logger"
	"forum/backend/models"
	auth "forum/backend/sessions"
	"forum/backend/utils"
)

func RegisterHandler(ac *controllers.AuthController) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var user models.User

		if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]string{
				"error": "Invalid request format",
			})
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		// Validate required fields
		if !ac.IsValidEmail(user.Email) || !ac.IsValidUsername(user.Nickname) || !ac.IsValidPassword(user.Password) {
			logger.Warning("Invalid input data userNickname: %s, userEmail: %s, userPassword: %s", user.Nickname, user.Email, user.Password)
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]string{
				"error": "Invalid input data",
			})
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		// sabitize input
		user.Nickname = ac.SanitizeInput(user.Nickname)
		user.Email = ac.SanitizeInput(user.Email)
		user.Password = ac.SanitizeInput(user.Password)

		// Register user
		userID, err := ac.RegisterUser(user)
		if err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{
				"error": err.Error(),
			})
			return
		}

		logger.Info("User registered successfully userID: %d (nickname: %s, email: %s)", userID, user.Nickname, user.Email)

		// After successful registration, broadcast new user
		newUserEvent := map[string]interface{}{
			"type": "new_user",
			"payload": map[string]interface{}{
				"id":         userID,
				"nickname":   user.Nickname,
				"profession": user.Profession,
				"avatar":     user.Avatar,
			},
		}
		msgBytes, err := json.Marshal(newUserEvent)
		if err != nil {
			logger.Error("Failed to marshal new user event: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		Broadcast(msgBytes)
		// Set headers first
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)

		// Then write response
		json.NewEncoder(w).Encode(map[string]interface{}{
			"message": "Registration successful",
		})
	}
}

func LoginHandler(ac *controllers.AuthController) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var credentials struct {
			Identifier string `json:"identifier"`
			Password   string `json:"password"`
		}

		if err := json.NewDecoder(r.Body).Decode(&credentials); err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{
				"error": "Invalid request format",
			})
			return
		}

		if !ac.IsValidEmail(credentials.Identifier) && !ac.IsValidUsername(credentials.Identifier) {
			logger.Warning("Invalid input data userIdentifier: %s", credentials.Identifier)
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{
				"error": "Invalid input data",
			})
			return
		}

		// sabitize input
		credentials.Identifier = ac.SanitizeInput(credentials.Identifier)
		credentials.Password = ac.SanitizeInput(credentials.Password)

		// Authenticate user
		user, err := ac.AuthenticateUser(credentials)
		if err != nil {
			logger.Error("Authentication failed: %v", err)
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusUnauthorized)
			json.NewEncoder(w).Encode(map[string]string{
				"error": err.Error(),
			})
			return
		}

		token, err := auth.CreateSession(ac.DB, w, int(user.ID))
		if err != nil {
			logger.Error("Failed to create session: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{
				"error": "Failed to create session",
			})
			return
		}
		logger.Info("User logged in successfully userID: %d (nickname: %s, email: %s)", user.ID, user.Nickname, user.Email)

		// Generate token

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"message":  "Login successful",
			"userData": user,
			"token":    token,
		})
	}
}

func LogoutHandler(w http.ResponseWriter, r *http.Request) {
	// Get the session cookie
	cookie, err := r.Cookie("session_token")
	if err != nil {
		logger.Debug("Logout attempted with no active session")
		w.WriteHeader(http.StatusUnauthorized)
		return
	}

	userIDStr := r.Context().Value(models.UserIDKey).(string)
	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		logger.Error("Failed to convert userID to int: %v", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	// Delete the session from the database
	sessionToken := cookie.Value
	err = controllers.DeleteSession(database.GloabalDB, sessionToken)
	if err != nil {
		logger.Error("Failed to delete session: %v", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	// Remove user from WebSocket connections and mark as offline
	mutex.Lock()
	for conn, usrID := range clients {
		if usrID == userID {
			conn.Close()
			delete(clients, conn)
			break
		}
	}
	mutex.Unlock()

	// Mark user as offline in database and broadcast status
	MarkUserOffline(userID)

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
		logger.Error("Error creating offline message: %v", err)
	} else {
		Broadcast(msgBytes)
	}

	// Clear the session cookie on the client
	http.SetCookie(w, &http.Cookie{
		Name:     "session_token",
		Value:    "",
		Path:     "/",
		MaxAge:   -1, // Expire the cookie immediately
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteStrictMode,
	})

	logger.Info("User successfully logged out")
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"message": "User is logged out successfully",
	})
}

func ValidateTokenHandler(w http.ResponseWriter, r *http.Request) {
	var requestData struct {
		Token string `json:"token"`
	}

	if err := json.NewDecoder(r.Body).Decode(&requestData); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{
			"error": "Invalid request body",
		})
		return
	}

	_, err := utils.ValidateJWT(requestData.Token)
	if err != nil {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{
			"error": err.Error(),
		})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]bool{
		"valid": true,
	})
}
