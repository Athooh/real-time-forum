// controllers/authController.go
package controllers

import (
	"database/sql"
	"errors"
	"net/mail"
	"regexp"
	"strings"

	"forum/backend/logger"
	"forum/backend/models"

	"golang.org/x/crypto/bcrypt"
)

type AuthController struct {
	DB *sql.DB
}

func NewAuthController(db *sql.DB) *AuthController {
	return &AuthController{DB: db}
}

func (ac *AuthController) RegisterUser(user models.User) (int64, error) {
	if user.Email == "" || user.Nickname == "" || user.Password == "" {
		logger.Warning("Registration failed - missing required fields")
		return 0, errors.New("missing required fields")
	}
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		logger.Error("Failed to hash password: %v", err)
		return 0, errors.New("internal server error")
	}

	result, err := ac.DB.Exec(`
            INSERT INTO users (nickname, email, password, first_name, last_name, age, gender)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, user.Nickname, user.Email, hashedPassword, user.FirstName, user.LastName, user.Age, user.Gender)
	if err != nil {
		logger.Warning("Registration failed - duplicate email or username: %v", err)
		return 0, errors.New("email or username already taken")
	}

	// Get the auto-generated user ID
	userID, err := result.LastInsertId()
	if err != nil {
		logger.Error("Failed to retrieve user ID after registration: %v", err)
		return 0, errors.New("failed to complete registration")
	}

	// Return the user ID
	return userID, nil
}

func (ac *AuthController) AuthenticateUser(credentials models.LoginRequest) (*models.User, error) {
	user := &models.User{}
	err := ac.DB.QueryRow(`
	SELECT id, password 
	FROM users 
	WHERE email = ? OR nickname = ?
`, credentials.Identifier, credentials.Identifier).Scan(&user.ID, &user.Password)
	if err != nil {
		logger.Warning("Authentication failed - invalid credentials: %s error: %v", credentials.Identifier, err)
		return nil, errors.New("invalid credentials")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(credentials.Password)); err != nil {
		logger.Warning("Authentication failed - invalid password for user: %s", credentials.Identifier)
		return nil, errors.New("invalid password")
	}

	return user, nil
}

// isValidEmail checks if the email is in a valid format
func (ac *AuthController) IsValidEmail(email string) bool {
	_, err := mail.ParseAddress(email)
	if err != nil {
		logger.Debug("Invalid email format: %s", email)
		return false
	}
	return true
}

// isValidUsername checks if the username meets the requirements
func (ac *AuthController) IsValidUsername(username string) bool {
	if len(username) < 3 || len(username) > 20 {
		logger.Debug("Invalid username length: %s", username)
		return false
	}
	// Only allow letters, numbers, and underscores
	regex := regexp.MustCompile(`^[a-zA-Z0-9_]+$`)
	if !regex.MatchString(username) {
		logger.Debug("Username contains invalid characters: %s", username)
		return false
	}
	return true
}

// isValidPassword checks if the password meets the requirements
func (ac *AuthController) IsValidPassword(password string) bool {
	if len(password) < 8 {
		return false
	}
	// Check for at least one uppercase, one lowercase, one number, and one special character
	hasUpper := regexp.MustCompile(`[A-Z]`).MatchString(password)
	hasLower := regexp.MustCompile(`[a-z]`).MatchString(password)
	hasNumber := regexp.MustCompile(`[0-9]`).MatchString(password)
	hasSpecial := regexp.MustCompile(`[!@#$%^&*()_+{}|:"<>?~\-=[\]\\;',./]`).MatchString(password)

	if !hasUpper || !hasLower || !hasNumber || !hasSpecial {
		logger.Debug("Password does not meet complexity requirements")
		return false
	}
	return true
}

// sanitizeInput removes potentially dangerous characters to prevent XSS
func (ac *AuthController) SanitizeInput(input string) string {
	// Replace HTML tags and special characters
	input = strings.ReplaceAll(input, "<", "&lt;")
	input = strings.ReplaceAll(input, ">", "&gt;")
	input = strings.ReplaceAll(input, "&", "&amp;")
	input = strings.ReplaceAll(input, "\"", "&quot;")
	input = strings.ReplaceAll(input, "'", "&#39;")
	return input
}

// Function to retrieve username based on user ID from SQLite database
func GetUsernameByID(db *sql.DB, userID int) string {
	var username string

	// Query to fetch the username for the given user ID
	query := `SELECT username FROM users WHERE id = ?`
	err := db.QueryRow(query, userID).Scan(&username)
	if err != nil {
		if err == sql.ErrNoRows {
			// No rows were found for the given user ID
			return ""
		}
		// Other database errors
		return ""
	}

	return username
}
