package utils

import (
	"log"
	"os"
	"time"
)

type Logger struct {
	InfoLog  *log.Logger
	ErrorLog *log.Logger
}

func NewLogger() *Logger {
	// Create logs directory if it doesn't exist
	if err := os.MkdirAll("logs", 0755); err != nil {
		log.Fatal("Failed to create logs directory:", err)
	}

	// Open log files
	currentTime := time.Now().Format("2006-01-02")
	infoFile, err := os.OpenFile(
		"logs/info_"+currentTime+".log",
		os.O_CREATE|os.O_WRONLY|os.O_APPEND,
		0666,
	)
	if err != nil {
		log.Fatal("Failed to open info log file:", err)
	}

	errorFile, err := os.OpenFile(
		"logs/error_"+currentTime+".log",
		os.O_CREATE|os.O_WRONLY|os.O_APPEND,
		0666,
	)
	if err != nil {
		log.Fatal("Failed to open error log file:", err)
	}

	return &Logger{
		InfoLog:  log.New(infoFile, "INFO: ", log.Ldate|log.Ltime|log.Lshortfile),
		ErrorLog: log.New(errorFile, "ERROR: ", log.Ldate|log.Ltime|log.Lshortfile),
	}
}

func (l *Logger) Error(format string, v ...interface{}) {
	l.ErrorLog.Printf(format, v...)
}

func (l *Logger) Info(format string, v ...interface{}) {
	l.InfoLog.Printf(format, v...)
} 