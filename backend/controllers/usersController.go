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

func (uc *UsersController) SearchUsers(query string, currentUserID, page, limit int) ([]models.User, error) {
	offset := (page - 1) * limit
	// Add % for LIKE pattern matching
	searchPattern := "%" + query + "%"

	sqlQuery := `
		SELECT DISTINCT
			u.id, u.nickname, u.email, u.first_name, u.last_name, 
			u.age, u.gender, u.profession, u.avatar,
			COALESCE(us.is_online, FALSE) as is_online,
			COALESCE(us.last_seen, datetime(u.created_at)) as last_seen
		FROM users u
		LEFT JOIN user_status us ON u.id = us.user_id
		WHERE u.id != ? AND (
			u.nickname LIKE ? OR
			u.first_name LIKE ? OR
			u.last_name LIKE ?
		)
		ORDER BY 
			CASE 
				WHEN u.nickname LIKE ? THEN 1
				WHEN u.first_name LIKE ? THEN 2
				WHEN u.last_name LIKE ? THEN 3
				ELSE 4
			END,
			u.nickname ASC
		LIMIT ? OFFSET ?
	`

	rows, err := uc.db.Query(
		sqlQuery,
		currentUserID,
		searchPattern, searchPattern, searchPattern, // for WHERE clause
		searchPattern, searchPattern, searchPattern, // for ORDER BY clause
		limit, offset,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to search users: %w", err)
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

// GetUserAbout retrieves user's about information
func (uc *UsersController) GetUserAbout(userID int) (*models.UserAbout, error) {
	var about models.UserAbout
	query := `SELECT * FROM user_about WHERE user_id = ?`
	err := uc.db.QueryRow(query, userID).Scan(
		&about.UserID,
		&about.Bio,
		&about.DateOfBirth,
		&about.RelationshipStatus,
		&about.Location,
		&about.GithubURL,
		&about.LinkedinURL,
		&about.TwitterURL,
		&about.PhoneNumber,
		&about.Interests,
		&about.IsProfilePublic,
		&about.ShowEmail,
		&about.ShowPhone,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get user about: %w", err)
	}
	return &about, nil
}

// UpsertUserAbout creates or updates user's about information
func (uc *UsersController) UpsertUserAbout(about *models.UserAbout) error {
	query := `
		INSERT INTO user_about (
			user_id, bio, date_of_birth, relationship_status, location,
			github_url, linkedin_url, twitter_url, phone_number, interests,
			is_profile_public, show_email, show_phone
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		ON CONFLICT(user_id) DO UPDATE SET
			bio = ?, date_of_birth = ?, relationship_status = ?, location = ?,
			github_url = ?, linkedin_url = ?, twitter_url = ?, phone_number = ?,
			interests = ?, is_profile_public = ?, show_email = ?, show_phone = ?
	`

	_, err := uc.db.Exec(query,
		about.UserID, about.Bio, about.DateOfBirth, about.RelationshipStatus, about.Location,
		about.GithubURL, about.LinkedinURL, about.TwitterURL, about.PhoneNumber, about.Interests,
		about.IsProfilePublic, about.ShowEmail, about.ShowPhone,
		// Update values
		about.Bio, about.DateOfBirth, about.RelationshipStatus, about.Location,
		about.GithubURL, about.LinkedinURL, about.TwitterURL, about.PhoneNumber, about.Interests,
		about.IsProfilePublic, about.ShowEmail, about.ShowPhone,
	)
	if err != nil {
		return fmt.Errorf("failed to upsert user about: %w", err)
	}
	return nil
}

// GetUserExperiences retrieves all experiences for a user
func (uc *UsersController) GetUserExperiences(userID int) ([]models.UserExperience, error) {
	query := `SELECT * FROM user_experience WHERE user_id = ? ORDER BY start_date DESC`
	rows, err := uc.db.Query(query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user experiences: %w", err)
	}
	defer rows.Close()

	var experiences []models.UserExperience
	for rows.Next() {
		var exp models.UserExperience
		var endDate sql.NullTime
		err := rows.Scan(
			&exp.ID, &exp.UserID, &exp.CompanyName, &exp.Role,
			&exp.Category, &exp.Location, &exp.StartDate, &endDate,
			&exp.IsCurrent, &exp.Description,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan experience: %w", err)
		}
		if endDate.Valid {
			exp.EndDate = &endDate.Time
		}
		experiences = append(experiences, exp)
	}
	return experiences, nil
}

// CreateExperience adds a new experience entry
func (uc *UsersController) CreateExperience(exp *models.UserExperience) error {
	query := `
		INSERT INTO user_experience (
			user_id, company_name, role, category, location,
			start_date, end_date, is_current, description
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
	`

	result, err := uc.db.Exec(query,
		exp.UserID, exp.CompanyName, exp.Role, exp.Category, exp.Location,
		exp.StartDate, exp.EndDate, exp.IsCurrent, exp.Description,
	)
	if err != nil {
		return fmt.Errorf("failed to create experience: %w", err)
	}

	id, err := result.LastInsertId()
	if err != nil {
		return fmt.Errorf("failed to get last insert id: %w", err)
	}
	exp.ID = int(id)
	return nil
}

// UpdateExperience updates an existing experience entry
func (uc *UsersController) UpdateExperience(exp *models.UserExperience) error {
	query := `
		UPDATE user_experience SET
			company_name = ?, role = ?, category = ?, location = ?,
			start_date = ?, end_date = ?, is_current = ?, description = ?
		WHERE id = ? AND user_id = ?
	`

	result, err := uc.db.Exec(query,
		exp.CompanyName, exp.Role, exp.Category, exp.Location,
		exp.StartDate, exp.EndDate, exp.IsCurrent, exp.Description,
		exp.ID, exp.UserID,
	)
	if err != nil {
		return fmt.Errorf("failed to update experience: %w", err)
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}
	if rows == 0 {
		return fmt.Errorf("experience not found or unauthorized")
	}
	return nil
}

// DeleteExperience removes an experience entry
func (uc *UsersController) DeleteExperience(userID, experienceID int) error {
	query := `DELETE FROM user_experience WHERE id = ? AND user_id = ?`
	result, err := uc.db.Exec(query, experienceID, userID)
	if err != nil {
		return fmt.Errorf("failed to delete experience: %w", err)
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}
	if rows == 0 {
		return fmt.Errorf("experience not found or unauthorized")
	}
	return nil
}

func (uc *UsersController) GetUserFriends(userID, offset, limit int) (models.FriendResponse, error) {
	// First, get total count of friends
	var totalFriends int
	countQuery := `
		SELECT COUNT(*) FROM (
			SELECT f1.following_id
			FROM followers f1
			JOIN followers f2 ON f1.following_id = f2.follower_id 
				AND f1.follower_id = f2.following_id
			WHERE f1.follower_id = ?
		) mutual_follows
	`
	err := uc.db.QueryRow(countQuery, userID).Scan(&totalFriends)
	if err != nil {
		return models.FriendResponse{}, fmt.Errorf("failed to count friends: %w", err)
	}

	// Then get the paginated friends list
	query := `
		SELECT u.id, u.nickname, u.avatar
		FROM users u
		JOIN followers f1 ON u.id = f1.following_id
		JOIN followers f2 ON f1.following_id = f2.follower_id 
			AND f1.follower_id = f2.following_id
		WHERE f1.follower_id = ?
		ORDER BY u.nickname
		LIMIT ? OFFSET ?
	`

	rows, err := uc.db.Query(query, userID, limit, offset)
	if err != nil {
		return models.FriendResponse{}, fmt.Errorf("failed to fetch friends: %w", err)
	}
	defer rows.Close()

	var friends []models.FriendInfo
	for rows.Next() {
		var friend models.FriendInfo
		var avatar sql.NullString
		err := rows.Scan(&friend.ID, &friend.Nickname, &avatar)
		if err != nil {
			return models.FriendResponse{}, fmt.Errorf("failed to scan friend: %w", err)
		}
		if avatar.Valid {
			avatarStr := avatar.String
			friend.Avatar = &avatarStr
		}
		friends = append(friends, friend)
	}

	if err = rows.Err(); err != nil {
		return models.FriendResponse{}, fmt.Errorf("error iterating friends: %w", err)
	}

	return models.FriendResponse{
		Friends:      friends,
		TotalFriends: totalFriends,
	}, nil
}

func (uc *UsersController) DeleteUser(userID int) error {
	// Start a transaction to ensure all deletions are atomic
	tx, err := uc.db.Begin()
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback() // Rollback if there's an error

	// Delete user's data from various tables
	// Note: Some of these deletes might be handled by ON DELETE CASCADE in the database
	tables := []string{
		"sessions",
		"csrf_tokens",
		"user_votes",
		"post_images",
		"comments",
		"posts",
		"messages",
		"conversations",
		"followers",
		"user_status",
		"user_about",
		"user_experience",
		"users", // Delete the user last
	}

	for _, table := range tables {
		query := fmt.Sprintf("DELETE FROM %s WHERE user_id = ?", table)
		_, err := tx.Exec(query, userID)
		if err != nil {
			return fmt.Errorf("failed to delete from %s: %w", table, err)
		}
	}

	// Commit the transaction
	if err := tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}
