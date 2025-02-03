// Global state
const postsContainer = document.getElementById('posts');
const createPostButton = document.getElementById('create-post');
const { isLoading } = window.forumState;

// Add pagination state
let currentPage = 1;
const postsPerPage = 10;
let hasMorePosts = true;

// Add retry mechanism for failed post fetching
async function fetchPostsWithRetry(page = 1, append = false, retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            if (isLoading) return;
            isLoading = true;
            
            const response = await authenticatedFetch(`/posts?page=${page}&limit=${postsPerPage}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch posts: ${response.statusText}`);
            }
            
            const data = await response.json();
            hasMorePosts = data.posts.length === postsPerPage;
            
            if (append) {
                renderPosts(data.posts, true);
            } else {
                renderPosts(data.posts, false);
            }
            return true;
            
        } catch (error) {
            console.error(`Attempt ${attempt} failed:`, error);
            if (attempt === retries) {
                showError('Failed to load posts. Please check your connection and try again.');
                return false;
            }
            // Wait before retrying (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        } finally {
            isLoading = false;
        }
    }
}

// Error display function
function showError(message) {
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.innerHTML = `
        <p>${message}</p>
        <button onclick="retryLastOperation()">Retry</button>
    `;
    postsContainer.prepend(errorElement);
}

// Retry mechanism
let lastOperation = null;
function retryLastOperation() {
    if (lastOperation) {
        const errorMessages = document.querySelectorAll('.error-message');
        errorMessages.forEach(msg => msg.remove());
        lastOperation();
    }
}

// Update scroll handler with retry mechanism
const debouncedHandleScroll = debounce(async () => {
    if (isLoading || !hasMorePosts) return;

    const scrollPosition = window.innerHeight + window.scrollY;
    const scrollThreshold = document.documentElement.scrollHeight - 200;

    if (scrollPosition >= scrollThreshold) {
        currentPage++;
        lastOperation = () => fetchPostsWithRetry(currentPage, true);
        await lastOperation();
    }
}, 250);

// Add missing showOfflineMessage function
function showOfflineMessage() {
    const offlineMessage = document.createElement('div');
    offlineMessage.className = 'offline-message';
    offlineMessage.innerHTML = `
        <i class="fas fa-wifi-slash"></i>
        <p>You're offline. Showing cached posts.</p>
    `;
    postsContainer.prepend(offlineMessage);
}

// Update fetchPosts with proper authentication
async function fetchPosts(page = 1, append = false) {
    if (window.forumState.isLoading) return;
    window.forumState.isLoading = true;

    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No authentication token found');
        }

        const response = await fetch(`/posts?page=${page}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            renderPosts(data.posts, append);
        } else {
            throw new Error('Failed to fetch posts');
        }
    } catch (error) {
        console.error('Error fetching posts:', error);
    } finally {
        window.forumState.isLoading = false;
    }
}

// Render Posts
function renderPosts(posts, append = false) {
    if (!append) {
        postsContainer.innerHTML = '';
    }

    posts.forEach((post) => {
        const postElement = document.createElement('div');
        postElement.classList.add('post');
        if (post.isNew) {
            postElement.classList.add('fade-in');
        }
        postElement.id = `post-${post.id}`;
        
        postElement.innerHTML = `
            <div class="post-header">
                <div class="post-user">
                    <strong>${escapeHTML(post.user.nickname)}</strong>
                    <span class="post-category">${escapeHTML(post.category)}</span>
                </div>
                <small class="post-time">${new Date(post.timestamp).toLocaleString()}</small>
            </div>
            <div class="post-content">${escapeHTML(post.content)}</div>
            <div class="post-actions">
                <button class="comment-btn" onclick="showCommentForm('${post.id}')">
                    <i class="fas fa-comment"></i> Comment
                </button>
            </div>
            <div class="comments-section" id="comments-${post.id}">
                <div class="comments-container"></div>
                <form class="comment-form" style="display: none;">
                    <textarea placeholder="Write a comment..." required></textarea>
                    <button type="submit">Submit</button>
                </form>
            </div>
        `;
        
        postsContainer.appendChild(postElement);
        debouncedFetchComments(post.id);
    });
}

// Handle Post Creation
createPostButton.addEventListener('click', () => {
    const content = prompt('Enter your post content:');
    if (content) {
        createPost(content);
    }
});

async function createPost(content) {
    try {
        const response = await fetch('/posts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
            body: JSON.stringify({ content }),
        });

        if (response.ok) {
            fetchPosts(); // Refresh the post feed
        } else {
            console.error('Failed to create post');
        }
    } catch (error) {
        console.error('Error creating post:', error);
    }
}

// Add post creation modal
function showCreatePostModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h2>Create New Post</h2>
            <form id="create-post-form">
                <select name="category" required>
                    <option value="">Select Category</option>
                    <option value="general">General</option>
                    <option value="technology">Technology</option>
                    <option value="gaming">Gaming</option>
                    <option value="other">Other</option>
                </select>
                <textarea name="content" placeholder="What's on your mind?" required></textarea>
                <div class="modal-actions">
                    <button type="button" onclick="closeModal()">Cancel</button>
                    <button type="submit">Post</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
}

// Add post interaction feedback
function addPostInteractionFeedback() {
    // Like/Comment button feedback
    document.addEventListener('click', (e) => {
        if (e.target.matches('.comment-btn, .like-btn')) {
            const button = e.target;
            button.classList.add('button-pressed');
            setTimeout(() => button.classList.remove('button-pressed'), 200);
        }
    });

    // Form submission feedback
    const createPostForm = document.getElementById('create-post-form');
    if (createPostForm) {
        createPostForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitButton = createPostForm.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            submitButton.textContent = 'Posting...';
            
            try {
                const formData = new FormData(createPostForm);
                const content = formData.get('content');
                const category = formData.get('category');
                
                await createPost(content, category);
                closeModal();
                showToast('Post created successfully!');
            } catch (error) {
                showError('Failed to create post. Please try again.');
            } finally {
                submitButton.disabled = false;
                submitButton.textContent = 'Post';
            }
        });
    }
}

// Toast notification
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('toast-fade-in');
        setTimeout(() => {
            toast.classList.add('toast-fade-out');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }, 100);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (token) {
        fetchPosts();
        addPostInteractionFeedback();
        window.addEventListener('scroll', debouncedHandleScroll);
    }
});

// Clean up on page change/unmount
function cleanup() {
    window.removeEventListener('scroll', debouncedHandleScroll);
}

// Initial Fetch of Posts
fetchPosts();