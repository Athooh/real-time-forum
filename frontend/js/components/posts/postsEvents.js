import { NotificationType, showNotification } from '../../utils/notifications.js';
import { submitComment, refreshComments } from './postsApi.js';

export function setupCommentEventListeners() {
    // Toggle comments
    document.querySelectorAll('.toggle-comments-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const postId = e.currentTarget.dataset.postId;
            const commentsContent = document.querySelector(`#comments-section-${postId} .comments-content`);
            if (commentsContent) {
                const isHidden = commentsContent.style.display === 'none';
                commentsContent.style.display = isHidden ? 'block' : 'none';
                
                // Update the comment count text
                const commentCount = document.querySelectorAll(`#comments-${postId} .comment`).length;
                e.currentTarget.querySelector('span').textContent = 
                    `Comments (${commentCount}) ${isHidden ? '▼' : '▲'}`;
            }
        });
    });

    // Reply button
    document.querySelectorAll('.reply-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const commentId = e.currentTarget.dataset.commentId;
            const replyInput = document.querySelector(`#reply-input-${commentId}`);
            if (replyInput) {
                replyInput.style.display = replyInput.style.display === 'none' ? 'block' : 'none';
            }
        });
    });

    // Load more comments
    document.querySelectorAll('.load-more-comments').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const postId = e.currentTarget.dataset.postId;
            try {
                e.currentTarget.textContent = 'Loading...';
                e.currentTarget.disabled = true;
                
                // In a real implementation, this would fetch more comments from the server
                // For now, we'll just disable the button
                e.currentTarget.textContent = 'No more comments to load';
            } catch (error) {
                showNotification('Failed to load more comments', NotificationType.ERROR);
                e.currentTarget.textContent = 'Load more comments';
                e.currentTarget.disabled = false;
            }
        });
    });

    // Comment submission
    document.querySelectorAll('.comment-input').forEach(input => {
        input.addEventListener('keypress', async (e) => {
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
        });
    });

    // Reply submission
    document.querySelectorAll('.reply-input').forEach(input => {
        input.addEventListener('keypress', async (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                const commentId = e.target.dataset.commentId;
                const content = e.target.value.trim();

                if (content) {
                    try {
                        // Here you would call your API to submit the reply
                        // await submitReply(commentId, content);
                        e.target.value = '';
                        // await refreshComments(postId);
                        showNotification('Reply posted successfully!', NotificationType.SUCCESS);
                    } catch (error) {
                        showNotification('Failed to post reply', NotificationType.ERROR);
                    }
                }
            }
        });
    });
} 