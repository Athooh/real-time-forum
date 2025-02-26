import { escapeHTML, formatTimeAgo } from "../../utils.js";
import { BASE_URL } from "../../state.js";


// Helper functions
function createStorySection() {
  const stories = [
    { user: "Alice", image: "images/avatar.png" },
    { user: "Bob", image: "images/avatar1.png" },
    { user: "Charlie", image: "images/avatar2.png" },
    { user: "Allan", image: "images/avatar3.png" },
    { user: "Mel", image: "images/avatar4.png" },
    { user: "Charlie", image: "images/avatar2.png" },
  ];

  return `
        <div class="stories-section">
            <div class="story-cards">
                <div class="story-card create-story">
                    <div class="story-add">
                        <i class="fas fa-plus"></i>
                    </div>
                    <p>Create Story</p>
                </div>
                ${stories
                  .map(
                    (story) => `
                    <div class="story-card">
                        <div class="story-overlay">
                            <p class="story-username">${story.user}</p>
                        </div>
                        <img src="${story.image}" alt="${story.user}'s story">
                    </div>
                `
                  )
                  .join("")}
            </div>
        </div>
    `;
}

function createStoriesSlider(stories) {
  return `
        <div class="stories-slider auto-scroll">
            ${stories
              .map(
                (story) => `
                <div class="story-card">
                    <div class="story-overlay">
                        <p class="story-username">${story.user}</p>
                    </div>
                    <img src="${story.image}" alt="${story.user}'s story">
                </div>
            `
              )
              .join("")}
        </div>
    `;
}

function createCategorySelection() {
  return `
        <div class="category-selection">
            <select class="category-dropdown">
                <option value="default" selected>Select category</option>
                <option value="technology">Technology</option>
                <option value="design">Design</option>
                <option value="programming">Programming</option>
                <option value="lifestyle">Lifestyle</option>
                <option value="gaming">Gaming</option>
                <option value="other">Other</option>
            </select>
            <div class="selected-categories"></div>
        </div>
    `;
}

function createImagePostModal() {
  return `
        <div id="create-post-modal" class="modal-overlay">
            <div class="modal-content">
                <div class="modal-header">
                    <div class="modal-title">Add post photo</div>
                    <button class="close-button close-modal">x</button>
                </div>
                
                <div class="user-input-section">
                    <img src="images/avatar.png" alt="User" class="user-avatar">
                    <div class="input-container">
                        <textarea id="title-input-text" class="title-input" placeholder="Title" maxlength="100" ></textarea>
                    </div>
                </div>
                <textarea id="thought-input-text" class="thought-input" placeholder="Share your thoughts..." maxlength="2000" ></textarea>

                <div class="upload-section" id="dropZone">
                    <svg class="upload-icon" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-5-7l-3 3.72L9 13l-3 4h12l-4-5z"/>
                    </svg>
                    <div class="upload-text">Drag here or click to upload photo.</div>
                </div>

                <div id="imagePreviewArea" class="image-preview-area"></div>

                <input type="file" id="image-upload" style="display: none" accept="image/*" multiple>

                <div class="button-section">
                    ${createCategorySelection()}
                    <div class="right-buttons">
                        <button type="button" class="cancel-button">Cancel</button>
                        <button class="post-button">Post</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function createTextPostModal() {
  return `
        <div id="text-post-modal" class="modal-overlay">
            <div class="modal-content">
                <div class="modal-header">
                    <div class="modal-title">Create Post</div>
                    <button class="close-button close-modal">×</button>
                </div>
                
                <div class="user-input-section">
                    <img src="images/avatar.png" alt="User" class="user-avatar">
                    <div class="input-container">
                        <textarea id="title-input-text" class="title-input" placeholder="Title" maxlength="100" ></textarea>
                    </div>
                </div>
                <textarea id="thought-input-text" class="thought-input text-only" placeholder="Share your thoughts..." maxlength="2000" rows="5"></textarea>

                <div class="button-section">
                    ${createCategorySelection()}
                    <div class="right-buttons">
                        <button type="button" class="cancel-button">Cancel</button>
                        <button class="post-button">Post</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function createVideoPostModal() {
  return `
        <div id="video-post-modal" class="modal-overlay">
            <div class="modal-content">
                <div class="modal-header">
                    <div class="modal-title">Add post video</div>
                    <button class="close-button close-modal">x</button>
                </div>
                
                <div class="user-input-section">
                    <img src="images/avatar.png" alt="User" class="user-avatar">
                    <div class="input-container">
                        <textarea id="title-input-text" class="title-input" placeholder="Title" maxlength="100" ></textarea>
                    </div>
                </div>
                <textarea id="thought-input-text" class="thought-input" placeholder="Share your thoughts..." maxlength="2000" ></textarea>

                <div class="upload-section" id="videoDropZone">
                    <svg class="upload-icon" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
                    </svg>
                    <div class="upload-text">Drag here or click to upload video.</div>
                </div>

                <div id="videoPreviewArea" class="video-preview-area"></div>

                <input type="file" id="video-upload" style="display: none" accept="video/*">

                <div class="button-section">
                    ${createCategorySelection()}
                    <div class="right-buttons">
                        <button type="button" class="cancel-button">Cancel</button>
                        <button class="post-button">Post</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function createPostCard() {
  return `
        <div class="create-post-card">
            <div class="post-input-section">
                <img src="images/avatar.png" alt="User" class="user-avatar">
                <div class="post-input">
                    <input type="text" placeholder="Share your thoughts..." readonly class="text-post-trigger">
                </div>
            </div>
            <div class="post-actions">
                <button class="post-action-btn create-post-btn">
                    <img src="images/picture.png" alt="" srcset="">
                    <span>Photo</span>
                </button>
                <button class="post-action-btn create-video-btn">
                    <img src="images/videos.png" alt="" srcset="">
                    <span>Video</span>
                </button>
                <button class="post-action-btn">
                    <img src="images/feelings.png" alt="" srcset="">
                    <span>Feeling</span>
                </button>
                <button class="post-action-btn">
                    <img src="images/tag.png" alt="" srcset="">
                    <span>Category</span>
                </button>
            </div>
        </div>
        ${createImagePostModal()}
        ${createTextPostModal()}
        ${createVideoPostModal()}
    `;
}

function createPostHeader(post) {
  const timeId = `post-time-${post.id}`;
  return `
        <div class="post-header">
            <div class="post-user">
                <img src="${
                  post.user.avatar || "images/avatar.png"
                }" alt="User" class="user-avatar">
                <div class="user-info">
                    <h4>${escapeHTML(post.user.nickname)}</h4>
                    <span class="post-meta">${
                      post.user.profession
                        ? `${post.user.profession} • `
                        : "Feature in progress • "
                    }<span id="${timeId}">${formatTimeAgo(post.timestamp)}</span></span>
                </div>
            </div>
            <div class="post-menu">
                <button class="post-menu-btn">
                    <i class="fas fa-ellipsis"></i>
                </button>
                <div class="post-menu-dropdown">
                    <button class="menu-item edit-post-btn">
                        <i class="fas fa-edit"></i>
                        Edit Post
                    </button>
                    <button class="menu-item delete-post-btn" data-post-id="${
                      post.id
                    }">
                        <i class="fas fa-trash-alt"></i>
                        Delete Post
                    </button>
                </div>
            </div>
        </div>
    `;
}

function createPostContent(post) {
  const createImageGrid = (images) => {
    if (!images || images.length === 0) return "";

    const gridClasses = {
      1: "single-image",
      2: "two-images",
      3: "three-images",
      4: "four-images",
      5: "five-images",
    };

    // Normalize image paths to ensure they start with "/"
    const normalizeImagePath = (path) => {
      // Remove any leading "/" to avoid double slashes
      path = path.replace(/^\/+/, "");
      // Ensure path starts with "/"
      return path.startsWith("/") ? path : `/${path}`;
    };

    const gridClass = gridClasses[Math.min(images.length, 5)] || "five-images";

    return `
            <div class="post-media-grid ${gridClass}">
                ${images
                  .slice(0, 5)
                  .map(
                    (image, index) => `
                    <div class="grid-item">
                        <img src="${BASE_URL}/${normalizeImagePath(
                      image
                    )}" alt="Post Image ${index + 1}" class="post-image">
                        ${
                          images.length > 5 && index === 4
                            ? `
                            <div class="more-overlay">+${
                              images.length - 5
                            }</div>
                        `
                            : ""
                        }
                    </div>
                `
                  )
                  .join("")}
            </div>
        `;
  };

  return `
        <div class="post-content">
            ${
              post.title
                ? `<div class="post-title"><h3>${escapeHTML(
                    post.title
                  )}</h3></div>`
                : ""
            }
            ${
              post.video_url.Valid
                ? `
                <div class="post-video-container">
                    <video class="post-video" controls>
                        <source src="${post.video_url.String}" type="video/mp4">
                        Your browser does not support the video tag.
                    </video>
                </div>
            `
                : post.images
                ? createImageGrid(post.images)
                : post.image
                ? `
                <div class="post-media-grid single-image">
                    <div class="grid-item">
                        <img src="${post.image}" alt="Post Image" class="post-image">
                    </div>
                </div>
            `
                : ""
            }
            <div class="post-description">
                <p>${escapeHTML(post.content)}</p>
            </div>
        </div>
    `;
}

function createPostCategories(post) {
  if (!post.category) return "";

  // Handle both array and comma-separated string formats
  const categoryArray = Array.isArray(post.category)
    ? post.category
    : post.category.split(",").map((cat) => cat.trim());

  if (categoryArray.length === 0) return "";

  return `
        <div class="post-categories">
            ${categoryArray
              .map(
                (category) => `
                <span class="category-tag">${escapeHTML(category)}</span>
            `
              )
              .join("")}
        </div>
    `;
}

function createPostActions(post) {
  return `
        <div class="post-actions">
            <li class="action-like-btn" data-post-id="${post.id}">
                <i class="fa-solid fa-thumbs-up"></i>
                <span>Like (${post.likes || 0})</span>
            </li>
            <li class="action-dislike-btn" data-post-id="${post.id}">
                <i class="fa-solid fa-thumbs-down"></i>
                <span>Dislike (${post.dislikes || 0})</span>
            </li>
            <li class="toggle-comments-btn active" data-post-id="${post.id}">
                <i class="far fa-comment"></i>
                <span>Comments (${post.comments?.length || 0})</span>
            </li>
        </div>
    `;
}

function createPostComments(post) {

    const userData = JSON.parse(localStorage.getItem("userDataAbout"))
    const avatar = userData.profile.avatar || "images/avatar.png"

  return `
        <div class="post-comments" id="comments-section-${post.id}">
            <div class="comments-content" style="display: none;">
                <div class="comment-input-wrapper">
                    <img src="${
                      avatar|| "images/avatar.png"
                    }" alt="User" class="user-avatar">
                    <div class="comment-input-container">
                        <input type="text" placeholder="Write a comment..." class="comment-input" data-post-id="${
                          post.id
                        }">
                        <button class="comment-submit-btn" data-post-id="${
                          post.id
                        }">
                            <i class="fas fa-paper-plane"></i>
                        </button>
                    </div>
                </div>
                <div class="comments-container" id="comments-${post.id}">
                    ${
                      post.comments
                        ? post.comments
                            .filter((comment) => !comment.ParentID?.Valid) // Only get parent comments
                            .map((comment) => {
                              return createComment(
                                comment,
                                false,
                                comment.replies && comment.replies.length > 0
                              );
                            })
                            .join("")
                        : ""
                    }
                </div>
                ${
                  post.comments?.length > 0
                    ? `
                    <button class="load-more-comments" data-post-id="${post.id}">
                        Load more comments
                    </button>
                `
                    : ""
                }
            </div>
        </div>
    `;
}

function createComment(comment, isReply = false, hasReplies = false) {
  if (!comment) return "";

  const user = comment.User || {};
  const nickname = user.nickname || "Anonymous";
  const avatar = user.avatar || "images/avatar.png";

  return `
        <div class="comment ${hasReplies ? "has-replies" : ""} ${
    isReply ? "comment-reply" : ""
  }" id="comment-${comment.ID}">
            <div class="comment-main">
                <img src="${avatar}" alt="User" class="user-avatar">
                <div class="comment-content">
                    <div class="comment-header">
                        <strong>${escapeHTML(nickname)}</strong>
                        <small>${formatTimeAgo(comment.Timestamp)}</small>
                    </div>
                    <p>${escapeHTML(comment.Content)}</p>
                    ${
                      !isReply
                        ? `
                        <div class="comment-actions">
                            <button class="reply-btn" data-comment-id="${comment.ID}">
                                Reply
                            </button>
                        </div>
                    `
                        : ""
                    }
                </div>
            </div>
            ${
              hasReplies
                ? `
                <div class="reply-container" id="replies-${comment.ID}">
                    ${comment.replies
                      .map((reply) => createComment(reply, true, false))
                      .join("")}
                </div>
            `
                : ""
            }
            ${
              !isReply
                ? `
                <div class="reply-input-container" id="reply-input-${comment.ID}" style="display: none;">
                    <div class="comment-input-wrapper">
                        <img src="${avatar}" alt="User" class="user-avatar">
                        <div class="comment-input-container">
                            <input type="text" placeholder="Write a reply..." class="reply-input data-comment-id="${comment.ID}" data-post-id="${comment.PostID}">
                            <button class="reply-submit-btn" data-comment-id="${comment.ID}" data-post-id="${comment.PostID}">
                                <i class="fas fa-paper-plane"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `
                : ""
            }
        </div>
    `;
}

function createPostsFeed() {
  return `
        <div class="posts-feed" id="posts-container">
            <!-- Post 1 -->
        </div>
    `;
}

export {
  createPostCard,
  createPostHeader,
  createPostContent,
  createPostCategories,
  createPostActions,
  createPostComments,
  createComment,
  createPostsFeed,
  createStorySection,
  createImagePostModal,
  createTextPostModal,
  createVideoPostModal,
  createStoriesSlider,
};
