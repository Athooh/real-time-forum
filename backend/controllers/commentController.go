package controllers

import (
	"database/sql"
	"errors"
	"time"

	"forum/backend/models"
)

type CommentController struct {
	DB *sql.DB
}

func NewCommentController(db *sql.DB) *CommentController {
	return &CommentController{DB: db}
}

// CreateComment creates a new comment for a post
func (c *CommentController) CreateComment(comment models.Comment) (int, error) {
	query := `
		INSERT INTO comments (post_id, user_id, parent_id, author, content, timestamp)
		VALUES (?, ?, ?, ?, ?, ?)
	`
	result, err := c.DB.Exec(query, comment.PostID, comment.UserID, comment.ParentID, comment.Author, comment.Content, time.Now())
	if err != nil {
		return 0, err
	}

	commentID, err := result.LastInsertId()
	if err != nil {
		return 0, err
	}

	return int(commentID), nil
}

// DeleteComment deletes a comment and its replies
func (c *CommentController) DeleteComment(commentID, userID int) error {
	// Check if the user owns the comment
	var ownerID int
	err := c.DB.QueryRow("SELECT user_id FROM comments WHERE id = ?", commentID).Scan(&ownerID)
	if err != nil {
		return err
	}

	if ownerID != userID {
		return errors.New("unauthorized to delete this comment")
	}

	// Delete the comment and its replies (cascade delete will handle replies)
	_, err = c.DB.Exec("DELETE FROM comments WHERE id = ?", commentID)
	return err
}

// LikeComment adds a like to a comment
func (c *CommentController) LikeComment(commentID int) error {
	_, err := c.DB.Exec("UPDATE comments SET likes = likes + 1 WHERE id = ?", commentID)
	return err
}

// UnlikeComment removes a like from a comment
func (c *CommentController) UnlikeComment(commentID int) error {
	_, err := c.DB.Exec("UPDATE comments SET likes = likes - 1 WHERE id = ?", commentID)
	return err
}

// DislikeComment adds a dislike to a comment
func (c *CommentController) DislikeComment(commentID int) error {
	_, err := c.DB.Exec("UPDATE comments SET dislikes = dislikes + 1 WHERE id = ?", commentID)
	return err
}

// UndislikeComment removes a dislike from a comment
func (c *CommentController) UndislikeComment(commentID int) error {
	_, err := c.DB.Exec("UPDATE comments SET dislikes = dislikes - 1 WHERE id = ?", commentID)
	return err
}

// GetCommentsByPostID retrieves all comments for a specific post
func (c *CommentController) GetCommentsByPostID(postID int) ([]models.Comment, error) {
	query := `
		SELECT id, post_id, user_id, parent_id, author, content, likes, dislikes, timestamp
		FROM comments
		WHERE post_id = ?
		ORDER BY timestamp DESC
	`
	rows, err := c.DB.Query(query, postID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var comments []models.Comment
	for rows.Next() {
		var comment models.Comment
		var parentID sql.NullInt64
		err := rows.Scan(
			&comment.ID,
			&comment.PostID,
			&comment.UserID,
			&parentID,
			&comment.Author,
			&comment.Content,
			&comment.Likes,
			&comment.Dislikes,
			&comment.Timestamp,
		)
		if err != nil {
			return nil, err
		}
		if parentID.Valid {
			comment.ParentID = sql.NullInt64{
				Int64: parentID.Int64,
				Valid: true,
			}
		}
		comments = append(comments, comment)
	}
	return comments, nil
}
