package routes

import (
	"database/sql"
	"net/http"

	"forum/backend/controllers"
	"forum/backend/handlers"
	"forum/backend/middleware"
)

func SetupCommentRoutes(db *sql.DB) {
	CommentController := controllers.NewCommentController(db)

	http.Handle("/comments", middleware.ApplyMiddleware(
		http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			switch r.Method {
			case http.MethodPost:
				handlers.CreateCommentHandler(CommentController).ServeHTTP(w, r)
			case http.MethodDelete:
				handlers.DeleteCommentHandler(CommentController).ServeHTTP(w, r)
			case http.MethodGet:
				handlers.GetCommentsHandler(CommentController).ServeHTTP(w, r)
			default:
				w.WriteHeader(http.StatusMethodNotAllowed)
			}
		}),
		middleware.JWTAuthMiddleware,
		middleware.SessionAuthMiddleware,
	))
}
