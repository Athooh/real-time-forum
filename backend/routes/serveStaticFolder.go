package routes

import (
	"net/http"

	"forum/middleware"
)

func ServeStaticFolder() {
	http.Handle("/css/", middleware.ApplyMiddleware(
		http.StripPrefix("/css/", http.FileServer(http.Dir("/home/rayzy/github/real-time-forum/frontend/css"))),
		middleware.SetCSPHeaders,
	))
	http.Handle("/images/", middleware.ApplyMiddleware(
		http.StripPrefix("/images/", http.FileServer(http.Dir("/home/rayzy/github/real-time-forum/frontend/images"))),
		middleware.SetCSPHeaders,
	))
	http.Handle("/js/", middleware.ApplyMiddleware(
		http.StripPrefix("/js/", http.FileServer(http.Dir("/home/rayzy/github/real-time-forum/frontend/js"))),
		middleware.SetCSPHeaders,
	))
	// http.Handle("/uploads/", middleware.ApplyMiddleware(
	// 	http.StripPrefix("/uploads/", http.FileServer(http.Dir("./uploads"))),
	// 	middleware.SetCSPHeaders,
	// ))
}
