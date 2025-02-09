import { escapeHTML, formatTimeAgo } from '../../utils.js';


// Helper functions
function createStorySection() {
    return `
        <div class="stories-section">
            <div class="story-cards">
                <div class="story-card create-story">
                    <div class="story-add">
                        <i class="fas fa-plus"></i>
                    </div>
                    <p>Create Story</p>
                </div>
            </div>
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
                    <img src="images/events.png" alt="" srcset="">
                    <span>Event</span>
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
    return `
        <div class="post-header">
            <div class="post-user">
                <img src="${post.user.avatar || 'images/avatar.png'}" alt="User" class="user-avatar">
                <div class="user-info">
                    <h4>${escapeHTML(post.user.nickname)}</h4>
                    <span class="post-meta">${post.user.profession} • ${formatTimeAgo(post.timestamp)}</span>
                </div>
            </div>
            <button class="post-menu-btn">
                <i class="fas fa-ellipsis"></i>
            </button>
        </div>
    `;
}

function createPostContent(post) {
    return `
        <div class="post-content">
            ${post.title ? `<div class="post-title"><h3>${escapeHTML(post.title)}</h3></div>` : ''}
            ${post.image ? `<img src="${post.image}" alt="Post Image" class="post-image">` : ''}
            <div class="post-description">
                <p>${escapeHTML(post.content)}</p>
            </div>
        </div>
    `;
}

function createPostCategories(post) {
    if (!post.categories || post.categories.length === 0) return '';
    
    return `
        <div class="post-categories">
            ${post.categories.map(category => `
                <span class="category-tag">${escapeHTML(category)}</span>
            `).join('')}
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
            <li class="action-btn" onclick="toggleComments('${post.id}')">
                <i class="far fa-comment"></i>
                <span>Comments (${post.comments?.length || 0})</span>
            </li>
            <li class="action-btn save-post" data-post-id="${post.id}">
                <i class="far fa-bookmark"></i>
                <span>Save</span>
            </li>
        </div>
    `;
}

function createPostComments(post) {
    return `
        <div class="post-comments">
            <div class="comment-input-wrapper">
                <img src="images/avatar.png" alt="User" class="user-avatar">
                <div class="comment-input-container">
                    <input type="text" placeholder="Write a comment..." class="comment-input" data-post-id="${post.id}">
                    <button class="comment-submit-btn">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
            </div>
            <div class="comments-container" id="comments-${post.id}">
                <!-- Comments will be dynamically inserted here -->
            </div>
        </div>
    `;
}

function createComment(comment) {
    return `
        <div class="comment" id="comment-${comment.id}">
            <img src="${comment.user.avatar || 'images/avatar.png'}" alt="User" class="user-avatar">
            <div class="comment-content">
                <div class="comment-header">
                    <strong>${escapeHTML(comment.user.nickname)}</strong>
                    <small>${formatTimeAgo(comment.timestamp)}</small>
                </div>
                <p>${escapeHTML(comment.content)}</p>
            </div>
        </div>
    `;
}

function createPostsFeed() {
    return `
        <div class="posts-feed" id="posts-container">
            <!-- Post 1 -->
            <div class="post-card">
                <div class="post-header">
                    <div class="post-user">
                        <img src="images/avatar.png" alt="User" class="user-avatar">
                        <div class="user-info">
                            <h4>John Doe</h4>
                            <span class="post-meta">Software Engineer • 2h ago</span>
                        </div>
                    </div>
                    <button class="post-menu-btn">
                        <i class="fas fa-ellipsis"></i>
                    </button>
                </div>
                <div class="post-content">
                    <div class="post-title">
                        <h3>Just launched my new project! 🚀</h3>
                    </div>
                    <img src="images/project.png" alt="Post Image" class="post-image">
                    <div class="post-description">
                        <p>Check out this amazing UI design for a modern forum.</p>
                    </div>
                </div>
                <div class="post-categories">
                    <span class="category-tag">Design</span>
                    <span class="category-tag">UI/UX</span>
                    <span class="category-tag">Web Development</span>
                </div>
                <div class="post-actions">
                    <li class="action-like-btn">
                        <i class="fa-solid fa-thumbs-up"></i>
                        <span>Like (1.2k)</span>
                    </li>
                    <li class="action-dislike-btn">
                        <i class="fa-solid fa-thumbs-down"></i>
                        <span>Dislike (2)</span>
                    </li>
                    <li class="action-btn">
                        <i class="far fa-comment"></i>
                        <span>Comments (84)</span>
                    </li>
                    <li class="action-btn">
                        <i class="far fa-bookmark"></i>
                        <span>Save</span>
                    </li>
                </div>
                <div class="post-comments">
                    <div class="comment-input-wrapper">
                        <img src="images/avatar.png" alt="User" class="user-avatar">
                        <div class="comment-input-container">
                            <input type="text" placeholder="Write a comment..." class="comment-input">
                            <button class="comment-submit-btn">
                                <i class="fas fa-paper-plane"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Post 2 & 3 with similar structure but different content -->
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
    createStorySection
};