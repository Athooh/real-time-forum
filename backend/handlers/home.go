package handlers

import (
	"database/sql"
	"html/template"
	"net/http"

	"forum/backend/logger"
)

func HomeHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Load the index.html file
		tmpl, err := template.ParseFiles("frontend/index.html")
		if err != nil {
			logger.Error("Failed to load homepage: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "text/html")
		if err := tmpl.Execute(w, nil); err != nil {
			logger.Error("Failed to render homepage %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
	}
}
