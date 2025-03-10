package routes

import (
	"database/sql"
	"net/http"

	"forum/backend/controllers"
	"forum/backend/handlers"
	"forum/backend/middleware"
)

func MessagesRoutes(db *sql.DB) {
	mc := controllers.NewMessageController(db)

	http.Handle("/messages", middleware.ApplyMiddleware(
		http.HandlerFunc(handlers.GetAllMessagesHandler(mc)),
		middleware.SessionAuthMiddleware,
		middleware.JWTAuthMiddleware,
		middleware.CORSMiddleware,
		middleware.SetCSPHeaders,
	))
	http.Handle("/messages/conversation", middleware.ApplyMiddleware(
		http.HandlerFunc(handlers.GetMessagesConversationHandler(mc)),
		middleware.SessionAuthMiddleware,
		middleware.JWTAuthMiddleware,
		middleware.CORSMiddleware,
		middleware.SetCSPHeaders,
	))

	http.Handle("/messages/send", middleware.ApplyMiddleware(
		http.HandlerFunc(handlers.SendMessageHandler(mc)),
		middleware.SessionAuthMiddleware,
		middleware.JWTAuthMiddleware,
		middleware.CORSMiddleware,
		middleware.SetCSPHeaders,
	))
	http.Handle("/messages/mark-as-read", middleware.ApplyMiddleware(
		http.HandlerFunc(handlers.MarkMessageAsReadHandler(mc)),
		middleware.SessionAuthMiddleware,
		middleware.JWTAuthMiddleware,
		middleware.CORSMiddleware,
		middleware.SetCSPHeaders,
	))

	http.Handle("/messages/unread-count", middleware.ApplyMiddleware(
		http.HandlerFunc(handlers.GetUnreadCountHandler(mc)),
		middleware.SessionAuthMiddleware,
		middleware.JWTAuthMiddleware,
		middleware.CORSMiddleware,
		middleware.SetCSPHeaders,
	))

	http.Handle("/messages/typing-status", middleware.ApplyMiddleware(
		http.HandlerFunc(handlers.TypingStatusHandler),
		middleware.SessionAuthMiddleware,
		middleware.JWTAuthMiddleware,
		middleware.CORSMiddleware,
		middleware.SetCSPHeaders,
	))
}
