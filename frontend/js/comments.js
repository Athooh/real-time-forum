// DOM Elements
const commentForm = document.getElementById('comment-form');

// Create Comment
async function createComment(postId, content) {
    try {
        const response = await authenticatedFetch('/comments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                post_id: postId,
                content: content,
            }),
        });

        if (response.ok) {
            // Refresh comments for this post
            await fetchComments(postId);
        } else {
            console.error('Failed to create comment');
        }
    } catch (error) {
        console.error('Error creating comment:', error);
    }
}

// Fetch Comments
async function fetchComments(postId) {
    try {
        const response = await authenticatedFetch(`/comments?post_id=${postId}`);
        if (response.ok) {
            const comments = await response.json();
            renderComments(postId, comments);
        } else {
            console.error('Failed to fetch comments');
        }
    } catch (error) {
        console.error('Error fetching comments:', error);
    }
}

// Debounce utility
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Comment form handler
function handleCommentSubmit(postId, form) {
    const content = form.querySelector('textarea').value;
    if (!content.trim()) return;

    createComment(postId, content)
        .then(() => {
            form.querySelector('textarea').value = '';
            form.style.display = 'none';
        })
        .catch(error => console.error('Error submitting comment:', error));
}

// Show comment form
function showCommentForm(postId) {
    const commentsSection = document.querySelector(`#comments-${postId}`);
    const form = commentsSection.querySelector('.comment-form');
    form.style.display = 'block';
    form.onsubmit = (e) => {
        e.preventDefault();
        handleCommentSubmit(postId, form);
    };
}

// Debounced comment fetching
const debouncedFetchComments = debounce((postId) => {
    fetchComments(postId);
}, 300);

// Update comment rendering with timestamps
function renderComments(postId, comments) {
    const commentsContainer = document.querySelector(`#comments-${postId} .comments-container`);
    commentsContainer.innerHTML = comments.map(comment => `
        <div class="comment">
            <div class="comment-header">
                <strong>${escapeHTML(comment.user_id)}</strong>
                <small>${new Date(comment.timestamp).toLocaleString()}</small>
            </div>
            <p>${escapeHTML(comment.content)}</p>
        </div>
    `).join('');
}

// Update event listener code
document.addEventListener('DOMContentLoaded', () => {
    const commentForm = document.getElementById('comment-form');
    if (commentForm) {
        commentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const postId = e.target.dataset.postId;
            const content = e.target.elements.content.value;
            
            if (content.trim()) {
                await createComment(postId, content);
                e.target.reset();
            }
        });
    }
});
