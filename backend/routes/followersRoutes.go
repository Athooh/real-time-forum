package routes

import (
	"database/sql"
	"net/http"

	"forum/backend/controllers"
	"forum/backend/handlers"
	"forum/backend/middleware"
)

func SetupFollowersRoutes(db *sql.DB) {
	followerController := controllers.NewFollowersController(db)

	http.Handle("/api/followers/follow", middleware.ApplyMiddleware(
		http.HandlerFunc(handlers.FollowUserHandler(followerController)),
		middleware.JWTAuthMiddleware,
		middleware.SessionAuthMiddleware,
		middleware.ErrorHandler(handlers.ServeErrorPage),
		middleware.ValidatePathAndMethod("/api/followers/follow", http.MethodPost),
	))

	http.Handle("/api/followers/unfollow", middleware.ApplyMiddleware(
		http.HandlerFunc(handlers.UnfollowUserHandler(followerController)),
		middleware.JWTAuthMiddleware,
		middleware.SessionAuthMiddleware,
		middleware.ErrorHandler(handlers.ServeErrorPage),
		middleware.ValidatePathAndMethod("/api/followers/unfollow", http.MethodPost),
	))

	http.Handle("/api/followers/counts", middleware.ApplyMiddleware(
		http.HandlerFunc(handlers.GetFollowCountsHandler(followerController)),
		middleware.JWTAuthMiddleware,
		middleware.SessionAuthMiddleware,
		middleware.ErrorHandler(handlers.ServeErrorPage),
		middleware.ValidatePathAndMethod("/api/followers/counts", http.MethodGet),
	))

	http.Handle("/api/followers/following", middleware.ApplyMiddleware(
		http.HandlerFunc(handlers.GetUserFollowingListHandler(followerController)),
		middleware.JWTAuthMiddleware,
		middleware.SessionAuthMiddleware,
		middleware.ErrorHandler(handlers.ServeErrorPage),
		middleware.ValidatePathAndMethod("/api/followers/following", http.MethodGet),
	))
}
