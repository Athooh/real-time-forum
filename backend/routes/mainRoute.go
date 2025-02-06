package routes

import (
	"database/sql"
	"net/http"

	"forum/backend/handlers"
)

func MainRoute(db *sql.DB) {
	http.HandleFunc("/", handlers.HomeHandler(db))
}
