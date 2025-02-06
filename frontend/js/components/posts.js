import { NotificationType, showNotification } from '../utils/notifications.js';
import { DUMMY_DATA } from '../utils/dummy-data.js';
import { forumState } from '../state.js';
import { escapeHTML } from '../utils.js';

// Export main functions
export function createMainContent() {
    return `
        <main class="main-content">

            ${createStorySection()}
            ${createPostCard()}
            ${createPostsFeed()}
        </main>
    `;
}

export function setupPostEventListeners() {
    // Create post form submission
    const createPostForm = document.getElementById('create-post-form');
    if (createPostForm) {
        createPostForm.addEventListener('submit', handleCreatePost);
    }

    // Like/Dislike buttons
    document.querySelectorAll('.action-like-btn, .action-dislike-btn').forEach(btn => {
        btn.addEventListener('click', handlePostReaction);
    });

    // Comment submission
    document.querySelectorAll('.comment-input').forEach(input => {
        input.addEventListener('keypress', handleCommentSubmit);
    });

    // Save post
    document.querySelectorAll('.save-post').forEach(btn => {
        btn.addEventListener('click', handleSavePost);
    });

    // Modal close button
    const closeModalBtn = document.querySelector('.close-modal');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closePostModal);
    }

    // Create post button
    const createPostBtn = document.querySelector('.create-post-btn');
    if (createPostBtn) {
        createPostBtn.addEventListener('click', showCreatePostModal);
    }
}

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

function createPostCard() {
    return `
        <div class="create-post-card">
            <div class="post-input-section">
                <img src="images/avatar.png" alt="User" class="user-avatar">
                <div class="post-input">
                    <input type="text" placeholder="Share your thoughts...">
                </div>
            </div>
            <div class="post-actions">
                <button class="post-action-btn">
                    <img src="images/picture.png" alt="" srcset="">
                    <span>Photo</span>
                </button>
                <button class="post-action-btn">
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

async function handleCreatePost(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);

    try {
        const response = await createPost(formData);
        if (response.ok) {
            closePostModal();
            await refreshPosts();
            showNotification('Post created successfully!', NotificationType.SUCCESS);
        }
    } catch (error) {
        showNotification('Failed to create post', NotificationType.ERROR);
    }
}

async function handlePostReaction(e) {
    const postId = e.currentTarget.dataset.postId;
    const isLike = e.currentTarget.classList.contains('action-like-btn');
    
    try {
        await reactToPost(postId, isLike);
        updatePostReactions(postId);
    } catch (error) {
        showNotification('Failed to update reaction', NotificationType.ERROR);
    }
}

async function handleCommentSubmit(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const postId = e.target.dataset.postId;
        const content = e.target.value.trim();

        if (content) {
            try {
                await submitComment(postId, content);
                e.target.value = '';
                await refreshComments(postId);
            } catch (error) {
                showNotification('Failed to post comment', NotificationType.ERROR);
            }
        }
    }
}

async function handleSavePost(e) {
    const postId = e.currentTarget.dataset.postId;
    try {
        await savePost(postId);
        e.currentTarget.classList.toggle('saved');
        showNotification('Post saved successfully!', NotificationType.SUCCESS);
    } catch (error) {
        showNotification('Failed to save post', NotificationType.ERROR);
    }
}

// Utility functions
function formatTimeAgo(timestamp) {
    // Implement time formatting logic
    return new Date(timestamp).toLocaleString();
}

// Add these new functions for modal handling
function showCreatePostModal() {
    const modal = document.getElementById('create-post-modal');
    if (modal) {
        modal.style.display = 'block';
    }
}

function closePostModal() {
    const modal = document.getElementById('create-post-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Update fetchPosts to use forumState instead of window.forumState
async function fetchPosts(page = 1, append = false) {
    if (forumState.isLoading) return;
    forumState.isLoading = true;

    try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Use dummy data
        const posts = DUMMY_DATA.posts;
        renderPosts(posts, append);
        
    } catch (error) {
        console.error('Error fetching posts:', error);
        showNotification('Failed to load posts', NotificationType.ERROR);
    } finally {
        forumState.isLoading = false;
    }
}

function renderPosts(posts, append = false) {
    const postsContainer = document.getElementById('posts-container');
    if (!postsContainer) return;

    const postsHTML = posts.map(post => `
        <div class="post-card" id="post-${post.id}">
            ${createPostHeader(post)}
            ${createPostContent(post)}
            ${createPostCategories(post)}
            ${createPostActions(post)}
            ${createPostComments(post)}
        </div>
    `).join('');

    if (append) {
        postsContainer.innerHTML += postsHTML;
    } else {
        postsContainer.innerHTML = postsHTML;
    }

    // Reattach event listeners for the new posts
    setupPostEventListeners();
}

export { fetchPosts };
// Export for use in other components
           