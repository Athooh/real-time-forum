package routes

import (
	"net/http"

	"forum/backend/handlers"
	"forum/backend/middleware"
)

func WebScokcetRoute() {
	http.Handle("/ws", middleware.ApplyMiddleware(
		http.HandlerFunc(handlers.WebSocketHandler),
	))
}
