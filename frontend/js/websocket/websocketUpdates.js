import { renderPosts } from "../components/posts/posts.js";
import { showNotification, NotificationType } from "../utils/notifications.js";

import { createNotificationItem } from "../components/header/headerTemplate.js";

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

  const messageBadge = document.querySelector(".message-badge");

  const unreadCountElement = document.getElementById("messages-unread-count");

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

export function handleNewNotification(data) {
  // Add notification to list
  const notificationsList = document.querySelector(".notifications-list");
  if (notificationsList) {
    const notificationHTML = createNotificationItem(data);
    notificationsList.insertAdjacentHTML("afterbegin", notificationHTML);
  }

  // Update badge count
  const badge = document.querySelector(".notification-badge");
  if (badge) {
    const currentCount = parseInt(badge.textContent) || 0;
    const newCount = currentCount + 1;
    badge.textContent = newCount;
    badge.style.display = newCount > 0 ? "block" : "none";
  }

  // Show notification toast
  showNotification(data.message, NotificationType.INFO);
}
