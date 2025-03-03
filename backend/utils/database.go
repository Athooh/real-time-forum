package utils

import (
	"database/sql"
	"strings"
	"time"

	"forum/backend/logger"
)

func RetryOnLocked(db *sql.DB, fn func() error) error {
	maxRetries := 5
	backoff := 100 * time.Millisecond

	var err error
	for i := 0; i < maxRetries; i++ {
		if i > 1 {
			logger.Warning("Retrying database operation %d of %d", i+1, maxRetries)
		}
		err = fn()
		if err == nil {
			return nil
		}

		if strings.Contains(err.Error(), "database is locked") {
			time.Sleep(backoff)
			backoff *= 2 // Exponential backoff
			continue
		}
		return err // Return immediately for other errors
	}
	return err
}
