import {
    createStorySection,
    createPostCard,
    createPostsFeed,
    createPostHeader,
    createPostContent,
    createPostCategories,
    createPostActions,
    createPostComments
} from './postsTemplates.js';
import {
    handleCreatePost,
    handlePostReaction,
    handleCommentSubmit,
    handleSavePost,
    handlePostSubmit,
    fetchPosts
} from './postsApi.js';
import {
    handleCategorySelection,
    setupVideoDropZone,
    handleImageUpload,
    setupDropZone,
    handleVideoUpload
} from './postsEvent.js';
import { setupCommentEventListeners, setupPostMenuHandlers } from './postsEvents.js';

import { setupInfiniteScroll } from '../../utils.js';
// main functions
function createMainContent() {
    return `
        <main class="main-content">

            ${createStorySection()}
            ${createPostCard()}
            ${createPostsFeed()}
        </main>
    `;
}

function setupPostEventListeners() {
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
        closeModalBtn.removeEventListener('click', closeModals);
        closeModalBtn.addEventListener('click', closeModals);
    }

    // Create post button
    const createPostBtn = document.querySelector('.create-post-btn');
    if (createPostBtn) {
        createPostBtn.addEventListener('click', showCreatePostModal);
    }

     // Image upload handling
     const imageUpload = document.getElementById('image-upload');
     if (imageUpload) {
         imageUpload.addEventListener('change', handleImageUpload);
     }

    // Setup drop zone
    setupDropZone();

    // Setup infinite scroll
    setupInfiniteScroll();

    // Text post input trigger
    const textPostTrigger = document.querySelector('.text-post-trigger');
    if (textPostTrigger) {
        textPostTrigger.addEventListener('click', showTextPostModal);
    }

    // Add event listeners for all close modal buttons and cancel buttons
    document.querySelectorAll('.close-modal, .cancel-button').forEach(btn => {
        btn.removeEventListener('click', closeModals);
        btn.addEventListener('click', closeModals);
    });

    // Video upload handling
    const videoUpload = document.getElementById('video-upload');
    if (videoUpload) {
        videoUpload.addEventListener('change', handleVideoUpload);
    }

    // Video post button
    const createVideoBtn = document.querySelector('.create-video-btn');
    if (createVideoBtn) {
        createVideoBtn.addEventListener('click', showVideoPostModal);
    }

    // Setup video drop zone
    setupVideoDropZone();

    // Add input monitoring
    document.querySelectorAll('#title-input-text, #thought-input-text').forEach(input => {
        input.addEventListener('input', (e) => {});
    });

    // Ensure post button has correct listener
    document.querySelectorAll('.modal-content .post-button').forEach(btn => {
        btn.removeEventListener('click', handlePostSubmit);
        btn.addEventListener('click', handlePostSubmit);
    });

    // Setup category selection handlers
    document.querySelectorAll('.category-dropdown').forEach(dropdown => {
        dropdown.addEventListener('change', handleCategorySelection);
    });

    // Setup comment event listeners
    setupCommentEventListeners();

    

    // Add this after the other event listener setups
    setupPostMenuHandlers();
}

// Move these functions outside of any other function and them
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

function showTextPostModal() {
    const modal = document.getElementById('text-post-modal');
    if (modal) {
        modal.style.display = 'block';
    }
}

function closeModals() {
    const modals = document.querySelectorAll('.modal-overlay');
    modals.forEach(modal => {
        modal.style.display = 'none';
    });
}


function renderPosts(posts, append = false, singlePost = false) {
    const postsContainer = document.getElementById('posts-container');
    if (!postsContainer) return;

    

    // Add type checking and error handling
    if (!Array.isArray(posts)) {
        console.error('Expected posts to be an array, received:', typeof posts);
        posts = []; // Set to empty array to prevent errors
    }

    const postsHTML = posts.map(post => `
        <div class="post-card" id="post-${post.id}">
            ${createPostHeader(post)}
            ${createPostContent(post)}
            ${createPostCategories(post)}
            ${createPostActions(post)}
            ${createPostComments(post)}
        </div>
    `).join('');

    if (append && singlePost) {
        postsContainer.innerHTML  = postsHTML + postsContainer.innerHTML;
    } else if (append){
        postsContainer.innerHTML += postsHTML;
    } else {
        postsContainer.innerHTML = postsHTML;
    }

    // Reattach event listeners for the new posts
    setupPostEventListeners();
}


function showVideoPostModal() {
    const modal = document.getElementById('video-post-modal');
    if (modal) {
        modal.style.display = 'block';
    }
}

export {
    fetchPosts, renderPosts,
    closePostModal, showCreatePostModal,
    closeModals, showTextPostModal, showVideoPostModal,
    setupPostEventListeners,createMainContent
};

           