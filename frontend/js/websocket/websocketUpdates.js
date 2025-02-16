import { renderPosts } from "../components/posts/posts.js";

function handleWebsocketUpdatePost(post) {
    if (post) {
        // Wrap the single post in an array
        renderPosts([post], true,true);
    }
}

export { handleWebsocketUpdatePost };

export function handlePostReactionUpdate(data) {
    const { post_id, likes, dislikes } = data;
    
    // Update like count
    const likeBtn = document.querySelector(`.action-like-btn[data-post-id="${post_id}"]`);
    if (likeBtn) {
        const likeSpan = likeBtn.querySelector('span');
        if (likeSpan) {
            likeSpan.textContent = `Like (${likes || 0})`;
        }
    }

    // Update dislike count
    const dislikeBtn = document.querySelector(`.action-dislike-btn[data-post-id="${post_id}"]`);
    if (dislikeBtn) {
        const dislikeSpan = dislikeBtn.querySelector('span');
        if (dislikeSpan) {
            dislikeSpan.textContent = `Dislike (${dislikes || 0})`;
        }
    }
}