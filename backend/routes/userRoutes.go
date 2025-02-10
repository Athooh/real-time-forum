package routes

import (
	"database/sql"
	"net/http"

	"forum/backend/controllers"
	"forum/backend/handlers"
	"forum/backend/middleware"
)

func SetupUserRoutes(db *sql.DB) {
	userController := controllers.NewUsersController(db)

	http.Handle("/api/users/stats", middleware.ApplyMiddleware(
		http.HandlerFunc(handlers.GetUserStatsHandler(userController)),
		middleware.CORSMiddleware,
		middleware.JWTAuthMiddleware,
		middleware.SessionAuthMiddleware,
		middleware.ErrorHandler(handlers.ServeErrorPage),
		middleware.ValidatePathAndMethod("/api/users/stats", http.MethodGet),
	))

	http.Handle("/api/users", middleware.ApplyMiddleware(
		http.HandlerFunc(handlers.GetUsersHandler(userController)),
		middleware.CORSMiddleware,
		middleware.JWTAuthMiddleware,
		middleware.SessionAuthMiddleware,
		middleware.ErrorHandler(handlers.ServeErrorPage),
		middleware.ValidatePathAndMethod("/api/users", http.MethodGet),
	))
}
