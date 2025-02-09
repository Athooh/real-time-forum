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

	"github.com/google/uuid"
)

func UploadFile(r *http.Request, formName string, userID int, fileIndex int) (string, error) {
	var filePath string

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
		return "", err
	}
	defer file.Close()

	// Generate a unique filename with UUID
	timestamp := time.Now().Unix()
	fileExt := filepath.Ext(handler.Filename)
	uniqueID := uuid.New().String()
	newFilename := fmt.Sprintf("User%s_%s_%d%s", strconv.Itoa(userID), uniqueID, timestamp, fileExt)

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

	// Use forward slashes for web URLs and ensure consistent format
	filePath = fmt.Sprintf("/%s/%s", uploadDir, newFilename) // Add leading slash

	// Use filepath.Join for the system path
	fullPath := filepath.Join(".", uploadDir, newFilename)

	// Create the upload directory if it doesn't exist
	if err := os.MkdirAll(uploadDir, os.ModePerm); err != nil {
		return "", err
	}

	// Save the file to the server's filesystem
	dst, err := os.Create(fullPath)
	if err != nil {
		return "", err
	}
	defer dst.Close()

	_, err = io.Copy(dst, file)
	if err != nil {
		return "", err
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
