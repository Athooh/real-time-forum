package utils

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"forum/backend/logger"
)

func UploadFile(r *http.Request, formName string, userID int) (string, error) {
	var filePath string

	file, handler, err := r.FormFile(formName)
	if err != nil && err != http.ErrMissingFile {
		logger.Error("Failed to retrieve file %v", err)
		return "", err
	}

	if file != nil {
		defer file.Close()

		// Generate a unique filename
		timestamp := time.Now().Unix()
		fileExt := filepath.Ext(handler.Filename)
		newFilename := fmt.Sprintf("User%s_%d%s", strconv.Itoa(userID), timestamp, fileExt)

		// Define the parent upload directory
		parentDir := "uploads"

		// Determine subdirectory based on form field name
		var uploadDir string
		switch formName {
		case "profile_image":
			uploadDir = filepath.Join(parentDir, "profile_images")
		case "post_image":
			uploadDir = filepath.Join(parentDir, "post_images")
		case "post_video":
			uploadDir = filepath.Join(parentDir, "post_videos")
		default:
			uploadDir = filepath.Join(parentDir, "misc")
		}

		// Use forward slashes for web URLs
		filePath = fmt.Sprintf("/%s/%s", uploadDir, newFilename)
		// Use filepath.Join for the system path
		fullPath := filepath.Join(".", uploadDir, newFilename)

		// Create the upload directory if it doesn't exist
		if err := os.MkdirAll(uploadDir, os.ModePerm); err != nil {
			logger.Error("Failed to create upload directory: %v", err)
			return "", err
		}

		// Save the file to the server's filesystem
		dst, err := os.Create(fullPath)
		if err != nil {
			logger.Error("Failed to create file on server: %v", err)
			return "", err
		}
		defer dst.Close()

		_, err = io.Copy(dst, file)
		if err != nil {
			logger.Error("Failed to save file content: %v", err)
			return "", err
		}
	}
	return filePath, nil
}

func RemoveImages(imagePaths []string) error {
	for _, imagePath := range imagePaths {
		// Remove the "uploads/" prefix if it exists in the imagePath
		cleanedPath := strings.TrimPrefix(imagePath, "/")

		// Check if the file exists before attempting to delete it
		if _, err := os.Stat(cleanedPath); os.IsNotExist(err) {
			return nil
		}

		// Delete the file
		if err := os.Remove(cleanedPath); err != nil {
			return fmt.Errorf("failed to delete image file %s: %w", imagePath, err)
		}

	}
	return nil
}
