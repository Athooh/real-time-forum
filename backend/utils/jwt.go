package utils

import (
	"database/sql"
	"errors"
	"time"

	"forum/database"

	"github.com/golang-jwt/jwt"
)

var jwtSecret = []byte("your-secret-key") // In production, use environment variable

type Claims struct {
	UserID string `json:"user_id"`
	jwt.StandardClaims
}

func GenerateJWT(userID string) (string, error) {
	claims := &Claims{
		UserID: userID,
		StandardClaims: jwt.StandardClaims{
			ExpiresAt: time.Now().Add(24 * time.Hour).Unix(), // Token expires in 24 hours
			IssuedAt:  time.Now().Unix(),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret)
}

func ValidateJWT(tokenString string) (*Claims, error) {
	claims := &Claims{}
	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		return jwtSecret, nil
	})

	if err != nil || !token.Valid {
		return nil, err
	}

	// Check if the token exists in the database and is not expired
	var expiresAt time.Time
	err = database.GloabalDB.QueryRow("SELECT expires_at FROM sessions WHERE jwt_token = ?", tokenString).Scan(&expiresAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, errors.New("token not found in database")
		}
		return nil, err
	}

	if time.Now().After(expiresAt) {
		return nil, errors.New("token has expired")
	}

	return claims, nil
}
