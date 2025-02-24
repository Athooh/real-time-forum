package routes

import (
	"database/sql"
	"net/http"

	"forum/backend/controllers"
	"forum/backend/handlers"
	"forum/backend/middleware"
)

func NotificationRoutes(db *sql.DB) {
	nc := controllers.NewNotificationController(db)

	http.Handle("/api/notifications", middleware.ApplyMiddleware(
		http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			switch r.Method {
			case http.MethodGet:
				handlers.GetNotificationsHandler(nc).ServeHTTP(w, r)
			default:
				w.WriteHeader(http.StatusMethodNotAllowed)
			}
		}),
		middleware.SessionAuthMiddleware,
		middleware.CORSMiddleware,
		middleware.JWTAuthMiddleware,
	))
	http.Handle("/api/notifications/clear", middleware.ApplyMiddleware(
		handlers.ClearNotificationsHandler(nc),
		middleware.SessionAuthMiddleware,
		middleware.CORSMiddleware,
		middleware.JWTAuthMiddleware,
	))
	http.Handle("/api/notifications/read", middleware.ApplyMiddleware(
		handlers.MarkNotificationAsReadHandler(nc),
		middleware.SessionAuthMiddleware,
		middleware.CORSMiddleware,
		middleware.JWTAuthMiddleware,
	))
}
