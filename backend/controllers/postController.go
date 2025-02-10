package controllers

import (
	"database/sql"
	"errors"
	"fmt"

	"forum/backend/models"
	"forum/backend/utils"
)

type PostController struct {
	DB *sql.DB
}

func NewPostController(db *sql.DB) *PostController {
	return &PostController{DB: db}
}

func (pc *PostController) InsertPost(post models.Post) (int, error) {
	tx, err := pc.DB.Begin()
	if err != nil {
		return 0, fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	// Insert the post
	result, err := tx.Exec(`
		INSERT INTO posts (title, user_id, author, category, likes, dislikes, content, timestamp, video_url)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
	`, post.Title, post.UserID, post.Author, post.Category, post.Likes, post.Dislikes, post.Content, post.Timestamp, post.VideoUrl)
	if err != nil {
		return 0, fmt.Errorf("failed to insert post: %w", err)
	}

	postID, err := result.LastInsertId()
	if err != nil {
		return 0, fmt.Errorf("failed to get last insert ID: %w", err)
	}

	// Insert images if any
	for _, imagePath := range post.Images {
		_, err = tx.Exec(`
			INSERT INTO post_images (post_id, image_url)
			VALUES (?, ?);
		`, postID, imagePath)
		if err != nil {
			return 0, fmt.Errorf("failed to insert image: %w", err)
		}
	}

	if err := tx.Commit(); err != nil {
		return 0, fmt.Errorf("failed to commit transaction: %w", err)
	}

	return int(postID), nil
}

func (pc *PostController) GetAllPosts(offset, limit int) ([]models.Post, error) {
	query := `
		SELECT 
			p.id, p.title, p.content, p.category, p.likes, p.dislikes, p.timestamp, p.video_url,
			u.id, u.nickname, u.profession, u.avatar
		FROM posts p
		JOIN users u ON p.user_id = u.id
		ORDER BY p.timestamp DESC
		LIMIT ? OFFSET ?
	`

	rows, err := pc.DB.Query(query, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch posts: %w", err)
	}
	defer rows.Close()

	var posts []models.Post
	for rows.Next() {
		var post models.Post
		var user models.User
		var profession, avatar sql.NullString // Use sql.NullString for nullable fields

		err := rows.Scan(
			&post.ID, &post.Title, &post.Content, &post.Category,
			&post.Likes, &post.Dislikes, &post.Timestamp, &post.VideoUrl,
			&user.ID, &user.Nickname, &profession, &avatar,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan post: %w", err)
		}

		// Set the values only if they are valid
		if avatar.Valid {
			avatarStr := avatar.String
			user.Avatar = &avatarStr
		}
		if profession.Valid {
			user.Profession = profession.String
		}

		post.User = user

		images, err := pc.GetPostImages(post.ID)
		if err != nil {
			return posts, err
		}

		post.Images = images

		// Fetch comments for this post
		comments, err := pc.GetPostComments(post.ID)
		if err != nil {
			return nil, fmt.Errorf("failed to fetch comments: %w", err)
		}
		post.Comments = comments

		posts = append(posts, post)
	}

	return posts, nil
}

func (pc *PostController) GetPostImages(postId int) ([]string, error) {
	// Fetch images for this post
	imageQuery := `
	SELECT image_url 
	FROM post_images 
	WHERE post_id = ?
`
	imageRows, err := pc.DB.Query(imageQuery, postId)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch images: %w", err)
	}
	defer imageRows.Close()

	var images []string
	for imageRows.Next() {
		var imagePath string
		if err := imageRows.Scan(&imagePath); err != nil {
			return nil, fmt.Errorf("failed to scan image path: %w", err)
		}
		images = append(images, imagePath)
	}

	return images, nil
}

func (pc *PostController) GetPostComments(postID int) ([]models.Comment, error) {
	query := `
		SELECT 
			c.id, c.content, c.timestamp,
			u.id, u.nickname, u.profession, u.avatar
		FROM comments c
		JOIN users u ON c.user_id = u.id
		WHERE c.post_id = ?
		ORDER BY c.timestamp DESC
	`

	rows, err := pc.DB.Query(query, postID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch comments: %w", err)
	}
	defer rows.Close()

	var comments []models.Comment
	for rows.Next() {
		var comment models.Comment
		var user models.User
		err := rows.Scan(
			&comment.ID, &comment.PostID, &comment.UserID, &comment.Content, &comment.Timestamp,
			&user.ID, &user.Nickname, &user.Profession, &user.Avatar,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan comment: %w", err)
		}
		comment.User = user
		comments = append(comments, comment)
	}

	return comments, nil
}

func (pc *PostController) GetPostByID(postID int) (models.Post, error) {
	// Query to fetch the post details along with user details
	query := `
        SELECT 
            p.id, p.title, p.content, p.category, p.likes, p.dislikes, p.timestamp, p.video_url,
            u.id, u.nickname, u.profession, u.avatar
        FROM posts p
        JOIN users u ON p.user_id = u.id
        WHERE p.id = ?;
    `

	row := pc.DB.QueryRow(query, postID)

	var post models.Post
	var user models.User
	var profession, avatar sql.NullString // Use sql.NullString for nullable fields

	err := row.Scan(
		&post.ID, &post.Title, &post.Content, &post.Category,
		&post.Likes, &post.Dislikes, &post.Timestamp, &post.VideoUrl,
		&user.ID, &user.Nickname, &profession, &avatar,
	)
	if err != nil {
		return post, fmt.Errorf("failed to fetch post: %w", err)
	}

	// Set the values only if they are valid
	if avatar.Valid {
		avatarStr := avatar.String
		user.Avatar = &avatarStr
	}
	if profession.Valid {
		user.Profession = profession.String
	}
	post.User = user

	// Fetch images for this post
	imageQuery := `
        SELECT image_url 
        FROM post_images 
        WHERE post_id = ?;
    `
	rows, err := pc.DB.Query(imageQuery, post.ID)
	if err != nil {
		return post, fmt.Errorf("failed to fetch images: %w", err)
	}
	defer rows.Close()

	var images []string
	for rows.Next() {
		var imagePath string
		if err := rows.Scan(&imagePath); err != nil {
			return post, fmt.Errorf("failed to scan image path: %w", err)
		}
		images = append(images, imagePath)
	}
	post.Images = images

	comments, err := pc.GetPostComments(post.ID)
	if err != nil {
		return post, err
	}
	post.Comments = comments

	return post, nil
}

func (pc *PostController) UpdatePost(post models.Post) error {
	// Prepare the SQL statement for updating the post
	query := `
	UPDATE posts
	SET title = ?, author = ?, user_id = ?, category = ?, likes = ?, dislikes = ?, content = ?, video_url = ?, timestamp = ?
	WHERE id = ?;
	`

	// Execute the SQL statement with the post data
	result, err := pc.DB.Exec(query,
		post.Title,
		post.Author,
		post.UserID,
		post.Category,
		post.Likes,
		post.Dislikes,
		post.Content,
		post.VideoUrl,
		post.Timestamp,
		post.ID,
	)
	if err != nil {
		return fmt.Errorf("failed to update post: %w", err)
	}

	// Check if any rows were affected
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to check rows affected: %w", err)
	}
	if rowsAffected == 0 {
		return fmt.Errorf("no post found with ID %d", post.ID)
	}

	return nil
}

// DeletePost deletes a post from the database by its ID, along with its comments and associated images
func (pc *PostController) DeletePost(postID, userID int) error {
	// Ensure the database connection is not nil
	if pc.DB == nil {
		return errors.New("database connection is nil")
	}

	// Begin a transaction to ensure atomicity
	tx, err := pc.DB.Begin()
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback() // Rollback in case of error

	// Step 1: Delete all comments associated with the post
	_, err = tx.Exec(`
		DELETE FROM comments 
		WHERE post_id = ?;
	`, postID)
	if err != nil {
		return fmt.Errorf("failed to delete comments: %w", err)
	}

	// Step 2: Fetch image paths associated with the post before deleting the post
	var imagePaths []string
	rows, err := tx.Query(`
		SELECT image_url FROM posts 
		WHERE id = ? AND user_id = ?;
	`, postID, userID)
	if err != nil {
		return fmt.Errorf("failed to fetch image paths: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var imagePath sql.NullString // Use sql.NullString to handle NULL values
		if err := rows.Scan(&imagePath); err != nil {
			return fmt.Errorf("failed to scan image path: %w", err)
		}
		if imagePath.Valid && imagePath.String != "" { // Only append non-empty paths
			imagePaths = append(imagePaths, imagePath.String)
		}
	}

	// Step 3: Delete the post
	result, err := tx.Exec(`
		DELETE FROM posts 
		WHERE id = ? AND user_id = ?;
	`, postID, userID)
	if err != nil {
		return fmt.Errorf("failed to delete post: %w", err)
	}

	// Check if the post was actually deleted
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to check rows affected: %w", err)
	}
	if rowsAffected == 0 {
		return errors.New("no post found with the given ID or user ID")
	}

	// Step 4: Delete the image files from the upload folder
	err = utils.RemoveImages(imagePaths)
	if err != nil {
		return fmt.Errorf("failed to delete image files: %w", err)
	}

	// Commit the transaction
	if err := tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}

func (pc *PostController) IsPostAuthor(postID, userID int) (bool, error) {
	var authorID int

	err := pc.DB.QueryRow(`
		SELECT user_id 
		FROM posts 
		WHERE id = ?
	`, postID).Scan(&authorID)
	if err != nil {
		if err == sql.ErrNoRows {
			return false, nil
		}

		return false, fmt.Errorf("failed to fetch post author: %w", err)
	}

	// Compare the post's author ID with the provided userID
	return authorID == userID, nil
}
