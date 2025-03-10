package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"sync"
	"syscall"
	"time"

	"forum/backend/controllers"
	"forum/backend/database"
	"forum/backend/logger"
	"forum/backend/routes"

	_ "github.com/mattn/go-sqlite3"
)

func main() {
	if err := logger.Init(); err != nil {
		log.Fatal(err)
	}

	// Initialize database tables
	db, err := database.InitializeDatabase()
	if db == nil {
		log.Fatal("Failed to initialize database:", err)
	}
	if err != nil {
		log.Fatal("Failed to initialize database:", err)
	}
	defer db.Close()

	// Initialize handlers
	// Create a context that cancels on interrupt signals (e.g., Ctrl+C)
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Use a WaitGroup to wait for cleanup goroutines to finish
	var wg sync.WaitGroup

	// Start cleanup tasks in separate goroutines
	wg.Add(1)
	go func() {
		defer wg.Done()
		controllers.CleanupExpiredCSRFTokens(ctx, db)
	}()

	wg.Add(1)
	go func() {
		defer wg.Done()
		controllers.CleanupExpiredSessions(ctx, db)
	}()

	// Determine the port to listen on
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080" // Default to port 8080 in development
	}

	// Update your server configuration
	server := &http.Server{
		Addr:              ":" + port,       // Listen on the determined port
		ReadTimeout:       15 * time.Second, // Max time to read the entire request
		WriteTimeout:      15 * time.Second, // Max time to write the response
		IdleTimeout:       60 * time.Second, // Max time to keep idle connections alive
		ReadHeaderTimeout: 5 * time.Second,  // Max time to read request headers
		MaxHeaderBytes:    1 << 20,          // Max size of request headers (1 MB)
	}

	routes.ServeStaticFolder()
	routes.UserRegAndLogin(db)
	routes.MainRoute(db)
	routes.PostRoute(db)
	routes.WebScokcetRoute()
	routes.SetupFollowersRoutes(db)
	routes.SetupUserRoutes(db)
	routes.MessagesRoutes(db)
	routes.SetupCommentRoutes(db)
	routes.NotificationRoutes(db)

	logger.Info("Starting Application...")

	// Run the server in a goroutine
	go func() {
		log.Printf("Server running at http://localhost:%s\n", port)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Printf("Server failed to start: %v\n", err)
		}
	}()

	// Wait for interrupt signal (e.g., Ctrl+C) to gracefully shut down the server
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)
	<-stop

	// Shutdown the server gracefully
	log.Println("Shutting down server...")
	if err := server.Shutdown(ctx); err != nil {
		log.Printf("Server shutdown error: %v\n", err)
	}

	// Cancel the context to signal cleanup tasks to stop
	cancel()

	// Wait for cleanup tasks to finish
	wg.Wait()

	log.Println("Application closed")
}
