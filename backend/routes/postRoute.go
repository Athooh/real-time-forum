package routes

import (
	"database/sql"
	"net/http"

	"forum/backend/controllers"
	"forum/backend/handlers"
	"forum/backend/middleware"
)

func PostRoute(db *sql.DB) {
	PostController := controllers.NewPostController(db)

	http.Handle("/api/posts", middleware.ApplyMiddleware(
		http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			switch r.Method {
			case http.MethodPost:
				handlers.CreatePostHandler(PostController).ServeHTTP(w, r)
			case http.MethodGet:
				handlers.GetPostsHandler(PostController).ServeHTTP(w, r)
			case http.MethodDelete:
				handlers.DeletePostHandler(PostController).ServeHTTP(w, r)
			case http.MethodPut:
				handlers.UpdatePostHandler(PostController).ServeHTTP(w, r)
			default:
				w.WriteHeader(http.StatusMethodNotAllowed)
			}
		}),
		middleware.ErrorHandler(handlers.ServeErrorPage),
		middleware.JWTAuthMiddleware,
		middleware.SessionAuthMiddleware,
	))

	http.Handle("/api/posts/vote", middleware.ApplyMiddleware(
		handlers.HandleVotePost(PostController),
		middleware.JWTAuthMiddleware,
		middleware.SessionAuthMiddleware,
	))
}
