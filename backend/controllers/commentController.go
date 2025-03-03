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

// GetCommentWithDetails retrieves a single comment with all its details
func (c *CommentController) GetCommentWithDetails(commentID int) (*models.Comment, error) {
	query := `
		SELECT c.id, c.post_id, c.user_id, c.parent_id, c.author, c.content, 
			   c.likes, c.dislikes, c.timestamp,
			   u.id as user_id, u.nickname, u.email, u.avatar, u.cover_image, u.profession, u.age, u.created_at,
			   EXISTS(SELECT 1 FROM comments r WHERE r.parent_id = c.id) as has_replies
		FROM comments c
		LEFT JOIN users u ON c.user_id = u.id
		WHERE c.id = ?
	`
	var comment models.Comment
	var parentID sql.NullInt64
	var avatar, coverImage sql.NullString
	var profession sql.NullString
	var age sql.NullInt32

	err := c.DB.QueryRow(query, commentID).Scan(
		&comment.ID,
		&comment.PostID,
		&comment.UserID,
		&parentID,
		&comment.Author,
		&comment.Content,
		&comment.Likes,
		&comment.Dislikes,
		&comment.Timestamp,
		&comment.User.ID,
		&comment.User.Nickname,
		&comment.User.Email,
		&avatar,
		&coverImage,
		&profession,
		&age,
		&comment.User.CreatedAt,
		&comment.HasReplies,
	)
	if err != nil {
		return nil, err
	}

	// Handle nullable fields
	if avatar.Valid {
		comment.User.Avatar = &avatar.String
	}
	if coverImage.Valid {
		comment.User.CoverImage = &coverImage.String
	}
	if profession.Valid {
		comment.User.Profession = profession.String
	}
	if age.Valid {
		comment.User.Age = int(age.Int32)
	}

	if parentID.Valid {
		comment.ParentID = sql.NullInt64{
			Int64: parentID.Int64,
			Valid: true,
		}
	}

	// Fetch replies if they exist
	if comment.HasReplies {
		replies, err := c.getReplies(comment.ID)
		if err != nil {
			return nil, err
		}
		comment.Replies = replies
	}

	return &comment, nil
}

// Helper function to get replies recursively
func (c *CommentController) getReplies(parentID int) ([]models.Comment, error) {
	query := `
		SELECT c.id, c.post_id, c.user_id, c.parent_id, c.author, c.content, 
			   c.likes, c.dislikes, c.timestamp,
			   u.id as user_id, u.nickname, u.email, u.avatar, u.cover_image, u.profession, u.age, u.created_at,
			   EXISTS(SELECT 1 FROM comments r WHERE r.parent_id = c.id) as has_replies
		FROM comments c
		LEFT JOIN users u ON c.user_id = u.id
		WHERE c.parent_id = ?
		ORDER BY c.timestamp ASC
	`
	rows, err := c.DB.Query(query, parentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var replies []models.Comment
	for rows.Next() {
		var reply models.Comment
		var parentID sql.NullInt64
		var avatar, coverImage sql.NullString
		var profession sql.NullString
		var age sql.NullInt32

		err := rows.Scan(
			&reply.ID,
			&reply.PostID,
			&reply.UserID,
			&parentID,
			&reply.Author,
			&reply.Content,
			&reply.Likes,
			&reply.Dislikes,
			&reply.Timestamp,
			&reply.User.ID,
			&reply.User.Nickname,
			&reply.User.Email,
			&avatar,
			&coverImage,
			&profession,
			&age,
			&reply.User.CreatedAt,
			&reply.HasReplies,
		)
		if err != nil {
			return nil, err
		}

		// Handle nullable fields
		if avatar.Valid {
			reply.User.Avatar = &avatar.String
		}
		if coverImage.Valid {
			reply.User.CoverImage = &coverImage.String
		}
		if profession.Valid {
			reply.User.Profession = profession.String
		}
		if age.Valid {
			reply.User.Age = int(age.Int32)
		}

		if parentID.Valid {
			reply.ParentID = sql.NullInt64{
				Int64: parentID.Int64,
				Valid: true,
			}
		}

		// Recursively fetch nested replies
		if reply.HasReplies {
			nestedReplies, err := c.getReplies(reply.ID)
			if err != nil {
				return nil, err
			}
			reply.Replies = nestedReplies
		}

		replies = append(replies, reply)
	}
	return replies, nil
}

// GetCommentCount returns the total number of comments for a specific post
func (c *CommentController) GetCommentCount(postID int) int {
	var count int
	err := c.DB.QueryRow("SELECT COUNT(*) FROM comments WHERE post_id = ?", postID).Scan(&count)
	if err != nil {
		return 0
	}
	return count
}
