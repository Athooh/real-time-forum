package utils

import (
	"crypto/hmac"
	"crypto/sha256"
	"database/sql"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"forum/backend/database"
)

var secretKey = []byte("your-secret-key") // In production, use environment variable

type Header struct {
	Alg string `json:"alg"`
	Typ string `json:"typ"`
}

type Payload struct {
	UserID    string `json:"user_id"`
	ExpiresAt int64  `json:"exp"`
	IssuedAt  int64  `json:"iat"`
}

func base64URLEncode(data []byte) string {
	return strings.TrimRight(base64.URLEncoding.EncodeToString(data), "=")
}

func base64URLDecode(str string) ([]byte, error) {
	if l := len(str) % 4; l > 0 {
		str += strings.Repeat("=", 4-l)
	}
	return base64.URLEncoding.DecodeString(str)
}

func GenerateJWT(userID string) (string, error) {
	// Create header
	header := Header{
		Alg: "HS256",
		Typ: "JWT",
	}

	// Create payload
	payload := Payload{
		UserID:    userID,
		ExpiresAt: time.Now().Add(24 * time.Hour).Unix(),
		IssuedAt:  time.Now().Unix(),
	}

	// Convert header and payload to JSON
	headerJSON, err := json.Marshal(header)
	if err != nil {
		return "", err
	}

	payloadJSON, err := json.Marshal(payload)
	if err != nil {
		return "", err
	}

	// Create base64-encoded header and payload
	encodedHeader := base64URLEncode(headerJSON)
	encodedPayload := base64URLEncode(payloadJSON)

	// Create signature
	signatureInput := encodedHeader + "." + encodedPayload
	h := hmac.New(sha256.New, secretKey)
	h.Write([]byte(signatureInput))
	signature := base64URLEncode(h.Sum(nil))

	// Combine all parts
	token := fmt.Sprintf("%s.%s.%s", encodedHeader, encodedPayload, signature)
	return token, nil
}

func ValidateJWT(tokenString string) (*Payload, error) {
	// Split the token
	parts := strings.Split(tokenString, ".")
	if len(parts) != 3 {
		return nil, errors.New("invalid token format")
	}

	// Verify signature
	signatureInput := parts[0] + "." + parts[1]
	h := hmac.New(sha256.New, secretKey)
	h.Write([]byte(signatureInput))
	expectedSignature := base64URLEncode(h.Sum(nil))

	if expectedSignature != parts[2] {
		return nil, errors.New("invalid signature")
	}

	// Decode payload
	payloadJSON, err := base64URLDecode(parts[1])
	if err != nil {
		return nil, err
	}

	var payload Payload
	if err := json.Unmarshal(payloadJSON, &payload); err != nil {
		return nil, err
	}

	// Check expiration
	if time.Now().Unix() > payload.ExpiresAt {
		return nil, errors.New("token has expired")
	}

	// Check if token exists in database and is not expired
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

	return &payload, nil
}
