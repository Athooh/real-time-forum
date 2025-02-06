package routes

import (
	"database/sql"
	"net/http"

	"forum/backend/controllers"
	"forum/backend/handlers"
)

func UserRegAndLogin(db *sql.DB) {
	AuthController := controllers.NewAuthController(db)
	http.Handle("/register", handlers.RegisterHandler(AuthController))

	http.Handle("/login", handlers.LoginHandler(AuthController))

	http.Handle("/validate-token", http.HandlerFunc(handlers.ValidateTokenHandler))
	http.Handle("/logout", http.HandlerFunc(handlers.LogoutHandler))
}
