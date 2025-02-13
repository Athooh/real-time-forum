package routes

import (
	"database/sql"
	"net/http"

	"forum/backend/controllers"
	"forum/backend/handlers"
	"forum/backend/middleware"
)

func UserRegAndLogin(db *sql.DB) {
	AuthController := controllers.NewAuthController(db)
	http.Handle("/register", middleware.ApplyMiddleware(
		http.HandlerFunc(handlers.RegisterHandler(AuthController)),
		middleware.CORSMiddleware,
		middleware.ErrorHandler(handlers.ServeErrorPage),
	))

	http.Handle("/login", middleware.ApplyMiddleware(
		http.HandlerFunc(handlers.LoginHandler(AuthController)),
		middleware.CORSMiddleware,
		middleware.ErrorHandler(handlers.ServeErrorPage),
	))

	http.Handle("/validate-token", http.HandlerFunc(handlers.ValidateTokenHandler))
	http.Handle("/logout", middleware.ApplyMiddleware(
		http.HandlerFunc(handlers.LogoutHandler),
		middleware.SessionAuthMiddleware,
		middleware.JWTAuthMiddleware,
		middleware.ErrorHandler(handlers.ServeErrorPage),
	))
}
