import { renderPosts } from "../components/posts/posts.js";

function handleWebsocketUpdatePost(post) {
  if (post) {
    // Wrap the single post in an array
    renderPosts([post], true, true);
  }
}

export { handleWebsocketUpdatePost };

export function handlePostReactionUpdate(data) {
  const { post_id, likes, dislikes } = data;

  // Update like count
  const likeBtn = document.querySelector(
    `.action-like-btn[data-post-id="${post_id}"]`
  );
  if (likeBtn) {
    const likeSpan = likeBtn.querySelector("span");
    if (likeSpan) {
      likeSpan.textContent = `Like (${likes || 0})`;
    }
  }

  // Update dislike count
  const dislikeBtn = document.querySelector(
    `.action-dislike-btn[data-post-id="${post_id}"]`
  );
  if (dislikeBtn) {
    const dislikeSpan = dislikeBtn.querySelector("span");
    if (dislikeSpan) {
      dislikeSpan.textContent = `Dislike (${dislikes || 0})`;
    }
  }
}

export function handleUnreadCountUpdate(data) {
  const { unreadCount } = data;
  const unreadCountElement = document.querySelector(
    ".messages-header h3 .unread-count"
  );
  const messageBadge = document.querySelector(".message-badge");
  const envelopeIcon = document.querySelector("#messages-btn .fa-envelope");

  if (unreadCountElement) {
    if (unreadCount > 0) {
      unreadCountElement.textContent = unreadCount;
      unreadCountElement.style.display = "inline";
    } else {
      unreadCountElement.style.display = "none";
    }
  }

  if (messageBadge) {
    if (unreadCount > 0) {
      messageBadge.textContent = unreadCount > 99 ? "99+" : unreadCount;
      messageBadge.style.display = "flex";

      // Update the selector to target the wrapper
      const iconWrapper = document.querySelector("#messages-btn .icon-wrapper");
      iconWrapper.classList.add("shake-animation");
      setTimeout(() => {
        iconWrapper.classList.remove("shake-animation");
      }, 500);
    } else {
      messageBadge.style.display = "none";
    }
  }
}
