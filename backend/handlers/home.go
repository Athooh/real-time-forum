package handlers

import (
	"database/sql"
	"html/template"
	"net/http"

	"forum/logger"
)

func HomeHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Load the index.html file
		tmpl, err := template.ParseFiles("/home/rayzy/github/real-time-forum/frontend/index.html")
		if err != nil {
			logger.Error("Failed to load homepage: %v", err)
			http.Error(w, "Failed to load homepage", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "text/html")
		if err := tmpl.Execute(w, nil); err != nil {
			logger.Error("Failed to render homepage %v", err)
			http.Error(w, "Failed to render homepage", http.StatusInternalServerError)
		}
	}
}
