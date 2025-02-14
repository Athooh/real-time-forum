package controllers

import (
	"database/sql"
	"fmt"
	"log"
	"time"

	"forum/backend/models"

	"golang.org/x/crypto/bcrypt"
)

type UsersController struct {
	db *sql.DB
}

func NewUsersController(db *sql.DB) *UsersController {
	return &UsersController{db: db}
}

func (uc *UsersController) VerifyPassword(userID int, currentPassword string) error {
	var hashedPassword string
	err := uc.db.QueryRow("SELECT password FROM users WHERE id = ?", userID).Scan(&hashedPassword)
	if err != nil {
		return err
	}

	return bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(currentPassword))
}

func (uc *UsersController) UpdatePassword(userID int, newPassword string) error {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	_, err = uc.db.Exec("UPDATE users SET password = ? WHERE id = ?", hashedPassword, userID)
	return err
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

	// Use NullString for nullable string fields
	var bio, relationshipStatus, location, githubURL, linkedinURL,
		twitterURL, phoneNumber, interests, website sql.NullString

	query := `
        SELECT 
            user_id, bio, date_of_birth, relationship_status, location, 
            github_url, linkedin_url, twitter_url, phone_number, interests, 
            is_profile_public, show_email, show_phone, website 
        FROM user_about 
        WHERE user_id = ?
    `

	err := uc.db.QueryRow(query, userID).Scan(
		&about.UserID,
		&bio,
		&about.DateOfBirth,
		&relationshipStatus,
		&location,
		&githubURL,
		&linkedinURL,
		&twitterURL,
		&phoneNumber,
		&interests,
		&about.IsProfilePublic,
		&about.ShowEmail,
		&about.ShowPhone,
		&website,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get user about: %w", err)
	}

	// Assign nullable fields
	if bio.Valid {
		about.Bio = bio.String
	}
	if relationshipStatus.Valid {
		about.RelationshipStatus = relationshipStatus.String
	}
	if location.Valid {
		about.Location = location.String
	}
	if githubURL.Valid {
		about.GithubURL = githubURL.String
	}
	if linkedinURL.Valid {
		about.LinkedinURL = linkedinURL.String
	}
	if twitterURL.Valid {
		about.TwitterURL = twitterURL.String
	}
	if phoneNumber.Valid {
		about.PhoneNumber = phoneNumber.String
	}
	if interests.Valid {
		if interests.String == "true" || interests.String == "false" {
			log.Printf("Warning: 'interests' column contains unexpected boolean-like value: %v", interests.String)
			about.Interests = "" // Handle as needed
		} else {
			about.Interests = interests.String
		}
	}
	if website.Valid {
		about.Website = website.String
	}

	return &about, nil
}

// UpsertUserAbout creates or updates user's about information
func (uc *UsersController) UpsertUserAbout(about *models.UserAbout) error {
	query := `
		INSERT INTO user_about (
			user_id, bio, date_of_birth, relationship_status, location,
			github_url, linkedin_url, twitter_url, phone_number, interests,
			is_profile_public, show_email, show_phone, website
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		ON CONFLICT(user_id) DO UPDATE SET
			bio = ?, date_of_birth = ?, relationship_status = ?, location = ?,
			github_url = ?, linkedin_url = ?, twitter_url = ?, phone_number = ?,
			interests = ?, is_profile_public = ?, show_email = ?, show_phone = ?,
			website = ?
	`

	_, err := uc.db.Exec(query,
		about.UserID, about.Bio, about.DateOfBirth, about.RelationshipStatus, about.Location,
		about.GithubURL, about.LinkedinURL, about.TwitterURL, about.PhoneNumber, about.Interests,
		about.IsProfilePublic, about.ShowEmail, about.ShowPhone, about.Website,
		// Update values
		about.Bio, about.DateOfBirth, about.RelationshipStatus, about.Location,
		about.GithubURL, about.LinkedinURL, about.TwitterURL, about.PhoneNumber, about.Interests,
		about.IsProfilePublic, about.ShowEmail, about.ShowPhone, about.Website,
	)
	if err != nil {
		return fmt.Errorf("failed to upsert user about: %w", err)
	}
	return nil
}

// GetUserProfile retrieves user's profile information
func (uc *UsersController) GetUserProfile(userID int) (*models.UserProfile, error) {
	query := `
		SELECT nickname, email, avatar, cover_image ,profession, age, created_at
		FROM users 
		WHERE id = ?
	`
	var profile models.UserProfile
	var nickname, email sql.NullString
	var avatar, coverImage, profession sql.NullString
	var age sql.NullInt32
	var createdAt sql.NullTime
	err := uc.db.QueryRow(query, userID).Scan(
		&nickname,
		&email,
		&avatar,
		&coverImage,
		&profession,
		&age,
		&createdAt,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get user profile: %w", err)
	}

	profile.Nickname = nickname.String
	profile.Email = email.String
	if avatar.Valid {
		profile.Avatar = &avatar.String
	}
	if coverImage.Valid {
		profile.CoverImage = &coverImage.String
	}
	if profession.Valid {
		profile.Profession = profession.String
	}
	if age.Valid {
		profile.Age = int(age.Int32)
	}
	if createdAt.Valid {
		profile.CreatedAt = createdAt.Time
	}

	return &profile, nil
}

// UpsertUserProfile updates user's profile information
func (uc *UsersController) UpsertUserProfile(profile *models.UserProfile) error {
	query := `
		UPDATE users 
		SET nickname = COALESCE(?, nickname),
		    email = COALESCE(?, email),
		    avatar = COALESCE(?, avatar),
		    age = COALESCE(?, age),
		    cover_image = COALESCE(?, cover_image),
		    profession = COALESCE(?, profession)
		WHERE nickname = ? OR email = ?
	`

	result, err := uc.db.Exec(query,
		profile.Nickname,
		profile.Email,
		profile.Avatar,
		profile.Age,
		profile.CoverImage,
		profile.Profession,
		profile.Nickname,
		profile.Email,
	)
	if err != nil {
		return fmt.Errorf("failed to update user profile: %w", err)
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rows == 0 {
		return fmt.Errorf("no user found with nickname %s or email %s", profile.Nickname, profile.Email)
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

func (uc *UsersController) GetUserFriends(userID, offset, limit int) (map[string]interface{}, error) {
	query := `
		SELECT 
			u.id, u.nickname, u.avatar, 
			COALESCE(us.is_online, FALSE) as is_online,
			(
				SELECT COUNT(*) 
				FROM followers f2 
				WHERE f2.follower_id IN (
					SELECT follower_id 
					FROM followers 
					WHERE following_id = ?
				)
				AND f2.following_id IN (
					SELECT following_id 
					FROM followers 
					WHERE follower_id = ?
				)
			) as mutual_friends
		FROM followers f
		JOIN users u ON f.following_id = u.id
		LEFT JOIN user_status us ON u.id = us.user_id
		WHERE f.follower_id = ?
		LIMIT ? OFFSET ?
	`

	rows, err := uc.db.Query(query, userID, userID, userID, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch friends: %w", err)
	}
	defer rows.Close()

	var friends []map[string]interface{}
	for rows.Next() {
		var friend struct {
			ID            int
			Nickname      string
			Avatar        sql.NullString
			IsOnline      bool
			MutualFriends int
		}

		if err := rows.Scan(&friend.ID, &friend.Nickname, &friend.Avatar, &friend.IsOnline, &friend.MutualFriends); err != nil {
			return nil, fmt.Errorf("failed to scan friend: %w", err)
		}

		friends = append(friends, map[string]interface{}{
			"id":             friend.ID,
			"nickname":       friend.Nickname,
			"avatar":         friend.Avatar.String,
			"is_online":      friend.IsOnline,
			"mutual_friends": friend.MutualFriends,
		})
	}

	// Get total count
	var totalCount int
	err = uc.db.QueryRow("SELECT COUNT(*) FROM followers WHERE follower_id = ?", userID).Scan(&totalCount)
	if err != nil {
		return nil, fmt.Errorf("failed to get total friends count: %w", err)
	}

	return map[string]interface{}{
		"friends":    friends,
		"totalCount": totalCount,
	}, nil
}

func (uc *UsersController) DeleteUser(userID int) error {
	// Start a transaction to ensure all deletions are atomic
	tx, err := uc.db.Begin()
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	// Since we have ON DELETE CASCADE set up in the database,
	// we only need to delete from the users table and the rest will cascade
	query := "DELETE FROM users WHERE id = ?"
	_, err = tx.Exec(query, userID)
	if err != nil {
		return fmt.Errorf("failed to delete user: %w", err)
	}

	// Commit the transaction
	if err := tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}

func (uc *UsersController) GetUserPhotos(userID int) ([]string, error) {
	query := `
        SELECT DISTINCT pi.image_url
        FROM post_images pi
        JOIN posts p ON pi.post_id = p.id
        WHERE p.user_id = ?
        ORDER BY p.timestamp DESC
    `

	rows, err := uc.db.Query(query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch user photos: %w", err)
	}
	defer rows.Close()

	var photos []string
	for rows.Next() {
		var photoURL string
		if err := rows.Scan(&photoURL); err != nil {
			return nil, fmt.Errorf("failed to scan photo URL: %w", err)
		}
		photos = append(photos, photoURL)
	}

	return photos, nil
}
