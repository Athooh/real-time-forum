package handlers

import (
	"html/template"
	"net/http"
)

// ServeErrorPage renders an error page with the given status code, title and message
func ServeErrorPage(w http.ResponseWriter, status int, title string, message string) {
	// Set the response status code
	w.WriteHeader(status)

	// Create template data
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
		// If template parsing fails, fall back to basic error message
		http.Error(w, message, status)
		return
	}

	// Execute the template
	if err := tmpl.Execute(w, data); err != nil {
		// If template execution fails, fall back to basic error message
		http.Error(w, message, status)
		return
	}
}
