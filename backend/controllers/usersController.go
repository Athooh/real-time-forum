package controllers

import (
	"database/sql"
	"fmt"
	"time"

	"forum/backend/models"
)

type UsersController struct {
	db *sql.DB
}

func NewUsersController(db *sql.DB) *UsersController {
	return &UsersController{db: db}
}

func (uc *UsersController) GetUsers(currentUserID, page, limit int) ([]models.User, error) {
	offset := (page - 1) * limit

	query := `
		SELECT 
			u.id, u.nickname, u.email, u.first_name, u.last_name, 
			u.age, u.gender, u.profession, u.avatar,
			COALESCE(us.is_online, FALSE) as is_online,
			COALESCE(us.last_seen, datetime(u.created_at)) as last_seen
		FROM users u
		LEFT JOIN user_status us ON u.id = us.user_id
		WHERE u.id != ?
		ORDER BY u.id DESC
		LIMIT ? OFFSET ?
	`

	rows, err := uc.db.Query(query, currentUserID, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch users: %w", err)
	}
	defer rows.Close()

	var users []models.User
	for rows.Next() {
		var user models.User
		var avatar, profession, gender sql.NullString
		var lastSeenStr sql.NullString

		err := rows.Scan(
			&user.ID,
			&user.Nickname,
			&user.Email,
			&user.FirstName,
			&user.LastName,
			&user.Age,
			&gender,
			&profession,
			&avatar,
			&user.IsOnline,
			&lastSeenStr,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan user: %w", err)
		}

		// Handle NULL values
		if gender.Valid {
			user.Gender = gender.String
		}

		if profession.Valid {
			user.Profession = profession.String
		}

		if avatar.Valid {
			avatarStr := avatar.String
			user.Avatar = &avatarStr
		}

		// Parse the last_seen timestamp string
		if lastSeenStr.Valid {
			parsedTime, err := time.Parse("2006-01-02 15:04:05", lastSeenStr.String)
			if err != nil {
				return nil, fmt.Errorf("failed to parse last_seen timestamp: %w", err)
			}
			user.LastSeen = parsedTime
		}

		users = append(users, user)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating users: %w", err)
	}

	return users, nil
}

func (uc *UsersController) GetUserStats(userID int) (models.UserStats, error) {
	var stats models.UserStats

	// Get posts count
	err := uc.db.QueryRow("SELECT COUNT(*) FROM posts WHERE user_id = ?", userID).Scan(&stats.PostsCount)
	if err != nil {
		return stats, fmt.Errorf("failed to get posts count: %w", err)
	}

	// Get followers count
	err = uc.db.QueryRow("SELECT COUNT(*) FROM followers WHERE following_id = ?", userID).Scan(&stats.FollowersCount)
	if err != nil {
		return stats, fmt.Errorf("failed to get followers count: %w", err)
	}

	// Get following count
	err = uc.db.QueryRow("SELECT COUNT(*) FROM followers WHERE follower_id = ?", userID).Scan(&stats.FollowingCount)
	if err != nil {
		return stats, fmt.Errorf("failed to get following count: %w", err)
	}

	return stats, nil
}
