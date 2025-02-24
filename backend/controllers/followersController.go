package controllers

import (
	"database/sql"
	"fmt"

	"forum/backend/models"
)

type FollowersController struct {
	db *sql.DB
}

func NewFollowersController(db *sql.DB) *FollowersController {
	return &FollowersController{db: db}
}

func (fc *FollowersController) InsertUserFollower(followerID, followingID int) error {
	tx, err := fc.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// Check if the relationship already exists
	var exists int
	err = tx.QueryRow("SELECT COUNT(*) FROM followers WHERE follower_id = ? AND following_id = ?",
		followerID, followingID).Scan(&exists)
	if err != nil {
		return err
	}

	if exists > 0 {
		return fmt.Errorf("relationship already exists")
	}

	// Insert the new relationship
	_, err = tx.Exec("INSERT INTO followers (follower_id, following_id) VALUES (?, ?)",
		followerID, followingID)
	if err != nil {
		return err
	}

	return tx.Commit()
}

func (fc *FollowersController) DeleteUserFollower(followerID, followingID int) error {
	_, err := fc.db.Exec("DELETE FROM followers WHERE follower_id = ? AND following_id = ?", followerID, followingID)
	return err
}

func (fc *FollowersController) GetUserFollowers(userID int, page, limit int) ([]models.UserFollower, error) {
	offset := (page - 1) * limit
	query := `
		SELECT u.id, u.nickname, u.avatar, u.profession
		FROM users u
		INNER JOIN followers f ON u.id = f.follower_id
		WHERE f.following_id = ?
		ORDER BY f.followed_at DESC
		LIMIT ? OFFSET ?
	`

	rows, err := fc.db.Query(query, userID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var followers []models.UserFollower
	for rows.Next() {
		var follower models.UserFollower
		var avatar sql.NullString
		var profession sql.NullString

		err := rows.Scan(&follower.ID, &follower.Nickname, &avatar, &profession)
		if err != nil {
			return nil, err
		}

		if avatar.Valid {
			follower.Avatar = &avatar.String
		}
		if profession.Valid {
			follower.Profession = profession.String
		}

		followers = append(followers, follower)
	}

	return followers, nil
}

func (fc *FollowersController) GetUserFollowing(userID int, page, limit int) ([]models.UserFollower, error) {
	offset := (page - 1) * limit
	query := `
		SELECT u.id, u.nickname, u.avatar, u.profession
		FROM users u
		INNER JOIN followers f ON u.id = f.following_id
		WHERE f.follower_id = ?
		ORDER BY f.followed_at DESC
		LIMIT ? OFFSET ?
	`

	rows, err := fc.db.Query(query, userID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var following []models.UserFollower
	for rows.Next() {
		var user models.UserFollower
		var avatar sql.NullString
		var profession sql.NullString

		err := rows.Scan(&user.ID, &user.Nickname, &avatar, &profession)
		if err != nil {
			return nil, err
		}

		if avatar.Valid {
			user.Avatar = &avatar.String
		}
		if profession.Valid {
			user.Profession = profession.String
		}

		following = append(following, user)
	}

	return following, nil
}

func (fc *FollowersController) GetFollowCounts(userID int) (int, int, error) {
	var followersCount, followingCount int

	// Get followers count
	err := fc.db.QueryRow("SELECT COUNT(*) FROM followers WHERE following_id = ?", userID).Scan(&followersCount)
	if err != nil {
		return 0, 0, err
	}

	// Get following count
	err = fc.db.QueryRow("SELECT COUNT(*) FROM followers WHERE follower_id = ?", userID).Scan(&followingCount)
	if err != nil {
		return 0, 0, err
	}

	return followersCount, followingCount, nil
}

func (fc *FollowersController) IsFollowing(followerID, followingID int) (bool, error) {
	var exists bool
	err := fc.db.QueryRow(
		"SELECT EXISTS(SELECT 1 FROM followers WHERE follower_id = ? AND following_id = ?)",
		followerID, followingID,
	).Scan(&exists)
	return exists, err
}

func (fc *FollowersController) GetUserFollowersId(userID int) ([]int, error) {
	rows, err := fc.db.Query("SELECT follower_id FROM followers WHERE following_id = ?", userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	followers := []int{}
	for rows.Next() {
		var followerID int
		if err := rows.Scan(&followerID); err != nil {
			return nil, err
		}
		followers = append(followers, followerID)
	}
	return followers, nil
}

func (fc *FollowersController) GetUserFollowingId(userID int) ([]int, error) {
	rows, err := fc.db.Query("SELECT following_id FROM followers WHERE follower_id = ?", userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	following := []int{}
	for rows.Next() {
		var followingID int
		if err := rows.Scan(&followingID); err != nil {
			return nil, err
		}
		following = append(following, followingID)
	}
	return following, nil
}
