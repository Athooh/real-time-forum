package controllers

import (
	"database/sql"
	"fmt"
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

func (fc *FollowersController) GetUserFollowers(userID int) ([]int, error) {
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

func (fc *FollowersController) GetUserFollowing(userID int) ([]int, error) {
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

func (fc *FollowersController) GetUserFollowersCount(userID int) (int, error) {
	var count int
	err := fc.db.QueryRow("SELECT COUNT(*) FROM followers WHERE following_id = ?", userID).Scan(&count)
	return count, err
}

func (fc *FollowersController) GetUserFollowingCount(userID int) (int, error) {
	var count int
	err := fc.db.QueryRow("SELECT COUNT(*) FROM followers WHERE follower_id = ?", userID).Scan(&count)
	return count, err
}
