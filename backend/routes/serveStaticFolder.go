package routes

import (
	"net/http"

	"forum/backend/middleware"
)

func ServeStaticFolder() {
	http.Handle("/css/", middleware.ApplyMiddleware(
		http.StripPrefix("/css/", http.FileServer(http.Dir("frontend/css"))),
		middleware.SetCSPHeaders,
	))
	http.Handle("/images/", middleware.ApplyMiddleware(
		http.StripPrefix("/images/", http.FileServer(http.Dir("frontend/images"))),
		middleware.SetCSPHeaders,
	))
	http.Handle("/js/", middleware.ApplyMiddleware(
		http.StripPrefix("/js/", http.FileServer(http.Dir("frontend/js"))),
		middleware.SetCSPHeaders,
	))
	// http.Handle("/uploads/", middleware.ApplyMiddleware(
	// 	http.StripPrefix("/uploads/", http.FileServer(http.Dir("./uploads"))),
	// 	middleware.SetCSPHeaders,
	// ))
}
