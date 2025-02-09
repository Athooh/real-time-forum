import { NotificationType, showNotification } from '../../utils/notifications.js';
import { DUMMY_DATA } from '../../utils/dummy-data.js';
import { forumState } from '../../state.js';
import { authenticatedFetch } from '../../security.js';
import { renderPosts, closePostModal, closeModals } from './posts.js';
import { SelectedCategories } from './postsEvent.js';

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

async function handlePostSubmit(e) {
    e.preventDefault();
    
    const modal = e.target.closest('.modal-content');
    const titleInput = modal.querySelector('#title-input-text');
    const thoughtInput = modal.querySelector('#thought-input-text');
    
    try {
        // Close modal immediately to improve UX
        closeModals();
        showNotification('Creating your post...', NotificationType.INFO);

        const response = await createPost({
            title: titleInput?.value?.trim(),
            content: thoughtInput?.value?.trim(),
            modal: modal
        });

        if (!response) {
            return; // createPost already showed an error notification
        }

        // Success path
        await fetchPosts();
        showNotification('Post created successfully!', NotificationType.SUCCESS);
        
        // Clear the form
        if (modal) {
            titleInput.value = '';
            thoughtInput.value = '';
            const categoryDropdown = modal.querySelector('.category-dropdown');
            if (categoryDropdown) {
                categoryDropdown.value = 'default';
            }
            
            // Clear selected categories
            SelectedCategories.clear();
            const selectedCategoriesContainer = modal.querySelector('.selected-categories');
            if (selectedCategoriesContainer) {
                selectedCategoriesContainer.innerHTML = '';
            }
            
            // Clear previews
            const imagePreviewArea = document.getElementById('imagePreviewArea');
            if (imagePreviewArea) {
                imagePreviewArea.innerHTML = '';
            }
            
            const videoPreviewArea = document.getElementById('videoPreviewArea');
            if (videoPreviewArea) {
                videoPreviewArea.innerHTML = '';
            }
        }
    } catch (error) {
        console.error('Error in handlePostSubmit:', error);
        showNotification('Failed to create post', NotificationType.ERROR);
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

async function createPost({ title, content, modal }) {
    if (!modal) return null;

    try {
        // Create FormData object
        const formData = new FormData();
        formData.append('title', title);
        formData.append('content', content);

        // Add categories
        const selectedCategories = Array.from(SelectedCategories);
        if (selectedCategories.length > 0) {
            formData.append('category', selectedCategories.join(','));
        }

        // Add images if they exist
        const imagePreviewArea = modal.querySelector('#imagePreviewArea');
        if (imagePreviewArea) {
            const imagePreviews = imagePreviewArea.querySelectorAll('.image-preview img');
            const imagePromises = Array.from(imagePreviews).map(async (img, index) => {
                if (img.src.startsWith('data:image')) {
                    const response = await fetch(img.src);
                    const blob = await response.blob();
                    formData.append('post-images', blob, `image${index}.jpg`);
                }
            });
            await Promise.all(imagePromises);
        }

        // Add video if it exists
        const videoPreviewArea = modal.querySelector('#videoPreviewArea');
        if (videoPreviewArea) {
            const videoSource = videoPreviewArea.querySelector('video source');
            if (videoSource?.src) {
                const videoBlob = await fetch(videoSource.src).then(r => r.blob());
                formData.append('post-video', videoBlob, 'video.mp4');

                // Add upload progress tracking
                const response = await authenticatedFetch('/api/posts', {
                    method: 'POST',
                    body: formData,
                    onUploadProgress: (progressEvent) => {
                        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        showNotification(`Uploading video: ${percentCompleted}%`, NotificationType.INFO);
                    }
                });

                return handleResponse(response);
            }
        }

        // If no video, make regular request
        const response = await authenticatedFetch('/api/posts', {
            method: 'POST',
            body: formData
        });

        return handleResponse(response);

    } catch (error) {
        console.error('Error creating post:', error);
        showNotification(error.message || 'Failed to create post', NotificationType.ERROR);
        return null;
    }
}

// Helper function to handle API response
async function handleResponse(response) {
    const responseText = await response.text();
    
    try {
        const responseData = JSON.parse(responseText);
        
        if (!response.ok) {
            throw new Error(responseData.error || 'Failed to create post');
        }
        
        return responseData;
    } catch (parseError) {
        console.error('Raw response:', responseText);
        throw new Error('Server returned invalid JSON: ' + responseText);
    }
}

async function reactToPost(postId, isLike) {
    try {
        const response = await authenticatedFetch(`/api/posts/${postId}/react`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ isLike })
        });

        if (!response.ok) {
            throw new Error('Failed to update reaction');
        }

        return response.json();
    } catch (error) {
        console.error('Error reacting to post:', error);
        throw error;
    }
}

async function submitComment(postId, content) {
    try {
        const response = await authenticatedFetch(`/api/posts/${postId}/comments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ content })
        });

        if (!response.ok) {
            throw new Error('Failed to submit comment');
        }

        return response.json();
    } catch (error) {
        console.error('Error submitting comment:', error);
        throw error;
    }
}

async function savePost(postId) {
    try {
        const response = await authenticatedFetch(`/api/posts/${postId}/save`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error('Failed to save post');
        }

        return response.json();
    } catch (error) {
        console.error('Error saving post:', error);
        throw error;
    }
}

export { handleCreatePost, handlePostReaction, handlePostSubmit, handleCommentSubmit, handleSavePost, fetchPosts };