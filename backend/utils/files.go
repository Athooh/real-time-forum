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

	"github.com/google/uuid"
)

func UploadFile(r *http.Request, formName string, userID int, fileIndex int) (string, error) {
	var filePath string

	logger.Info("Starting file upload process for formName: %s, userID: %d, fileIndex: %d", formName, userID, fileIndex)

	// Get all files for the form field
	if r.MultipartForm == nil || r.MultipartForm.File == nil {
		return "", fmt.Errorf("no multipart form found")
	}

	files := r.MultipartForm.File[formName]
	if len(files) <= fileIndex {
		return "", fmt.Errorf("file index %d out of range", fileIndex)
	}

	// Get the specific file by index
	handler := files[fileIndex]
	file, err := handler.Open()
	if err != nil {
		logger.Error("Failed to open file: %v", err)
		return "", err
	}
	defer file.Close()

	// Log file details
	logger.Info("Processing file: %s, size: %d bytes", handler.Filename, handler.Size)

	// Generate a unique filename with UUID
	timestamp := time.Now().Unix()
	fileExt := filepath.Ext(handler.Filename)
	uniqueID := uuid.New().String()
	newFilename := fmt.Sprintf("User%s_%s_%d%s", strconv.Itoa(userID), uniqueID, timestamp, fileExt)

	logger.Info("Generated new filename: %s", newFilename)

	// Define the parent upload directory
	parentDir := "uploads"

	// Determine subdirectory based on form field name
	var uploadDir string
	switch formName {
	case "profile-image":
		uploadDir = filepath.Join(parentDir, "profile_images")
	case "post-images":
		uploadDir = filepath.Join(parentDir, "post_images")
	case "post-video":
		uploadDir = filepath.Join(parentDir, "post_videos")
	default:
		uploadDir = filepath.Join(parentDir, "misc")
	}

	// Use forward slashes for web URLs
	filePath = fmt.Sprintf("/%s/%s", uploadDir, newFilename)
	// Use filepath.Join for the system path
	fullPath := filepath.Join(".", uploadDir, newFilename)

	logger.Info("File will be saved to: %s", fullPath)

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

	written, err := io.Copy(dst, file)
	if err != nil {
		logger.Error("Failed to save file content: %v", err)
		return "", err
	}

	logger.Info("Successfully saved file. Bytes written: %d", written)
	logger.Info("Completed file upload process. FilePath: %s", filePath)
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
