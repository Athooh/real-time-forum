package utils

import (
	"database/sql"
	"strings"
	"time"
)

func RetryOnLocked(db *sql.DB, fn func() error) error {
	maxRetries := 5
	backoff := 100 * time.Millisecond

	var err error
	for i := 0; i < maxRetries; i++ {
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
