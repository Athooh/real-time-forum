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

	http.Handle("/api/users/search", middleware.ApplyMiddleware(
		http.HandlerFunc(handlers.SearchUsersHandler(userController)),
		middleware.CORSMiddleware,
		middleware.JWTAuthMiddleware,
		middleware.SessionAuthMiddleware,
	))

	// User About routes
	http.Handle("/api/users/about", middleware.ApplyMiddleware(
		http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			switch r.Method {
			case http.MethodGet:
				handlers.GetUserAboutHandler(userController)(w, r)
			case http.MethodPost, http.MethodPut:
				handlers.UpsertUserAboutHandler(userController)(w, r)
			default:
				w.WriteHeader(http.StatusMethodNotAllowed)
			}
		}),
		middleware.CORSMiddleware,
		middleware.JWTAuthMiddleware,
		middleware.SessionAuthMiddleware,
	))

	// User Experience routes
	http.Handle("/api/users/experience", middleware.ApplyMiddleware(
		http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			switch r.Method {
			case http.MethodGet:
				handlers.GetUserExperiencesHandler(userController)(w, r)
			case http.MethodPost:
				handlers.CreateExperienceHandler(userController)(w, r)
			case http.MethodPut:
				handlers.UpdateExperienceHandler(userController)(w, r)
			case http.MethodDelete:
				handlers.DeleteExperienceHandler(userController)(w, r)
			default:
				w.WriteHeader(http.StatusMethodNotAllowed)
			}
		}),
		middleware.CORSMiddleware,
		middleware.JWTAuthMiddleware,
		middleware.SessionAuthMiddleware,
	))

	// User Friends route
	http.Handle("/api/users/friends", middleware.ApplyMiddleware(
		handlers.GetUserFriendsHandler(userController),
		middleware.CORSMiddleware,
		middleware.JWTAuthMiddleware,
		middleware.SessionAuthMiddleware,
	))

	// Delete User route
	http.Handle("/api/users/delete", middleware.ApplyMiddleware(
		http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if r.Method != http.MethodDelete {
				w.WriteHeader(http.StatusMethodNotAllowed)
				return
			}
			handlers.DeleteUserHandler(userController)(w, r)
		}),
		middleware.CORSMiddleware,
		middleware.JWTAuthMiddleware,
		middleware.SessionAuthMiddleware,
	))
}
