package handlers

import (
	"encoding/json"
	"html/template"
	"net/http"

	"forum/backend/logger"
)

// ServeErrorPage renders an error page with the given status code, title and message
func ServeErrorPage(w http.ResponseWriter, status int, title string, message string) {
	// Check if it's an API request by looking at the Accept header
	if w.Header().Get("Content-Type") == "application/json" {

		json.NewEncoder(w).Encode(map[string]string{
			"error":  message,
			"title":  title,
			"status": http.StatusText(status),
		})
		return
	}

	// For HTML requests, create template data
	data := struct {
		Status  int
		Title   string
		Message string
	}{
		Status:  status,
		Title:   title,
		Message: message,
	}

	// Parse and execute error template
	tmpl, err := template.ParseFiles("frontend/templates/error.html")
	if err != nil {
		// If template parsing fails, send JSON response
		w.Header().Set("Content-Type", "application/json")

		json.NewEncoder(w).Encode(map[string]string{
			"error":  message,
			"title":  "Template Error",
			"status": http.StatusText(status),
		})
		return
	}

	// Set content type for HTML response
	w.Header().Set("Content-Type", "text/html; charset=utf-8")

	if err := tmpl.Execute(w, data); err != nil {
		// If template execution fails after headers are sent,
		// we can only log the error since we can't write another response
		logger.Error("Template execution failed: %v", err)
	}
}
