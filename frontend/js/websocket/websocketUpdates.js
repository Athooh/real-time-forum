import { renderPosts } from "../components/posts/posts.js";
import { showNotification, NotificationType } from "../utils/notifications.js";

import { createNotificationItem } from "../components/header/headerTemplate.js";
import { updateNotificationBadge } from "../components/header/headerEvent.js";
import { updateTypingStatus } from "../components/messages/messagesTemplates.js";

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
  // Update badge count first
  const badge = document.querySelector(".notification-badge");
  if (badge) {
    const currentCount = parseInt(badge.textContent) || 0;
    const newCount = currentCount + 1;
    updateNotificationBadge(newCount);
  }

  // Add notification to list if it's open
  const notificationsList = document.querySelector(".notifications-list");
  if (notificationsList) {
    const notificationHTML = createNotificationItem(data);
    notificationsList.insertAdjacentHTML("afterbegin", notificationHTML);
  }

  // Show notification toast
  showNotification(data.message, NotificationType.INFO);
}

export function handleMessageListUpdate(data) {
  const messagesList = document.getElementById("messages-list");
  if (!messagesList) return;

  const { user } = data;
  const existingItem = messagesList.querySelector(
    `[data-user-id="${user.id}"]`
  );

  if (existingItem) {
    // Update unread status and badge
    if (user.unread_messages > 0) {
      existingItem.classList.add("unread-message");
      let unreadBadge = existingItem.querySelector(".unread-badge");
      if (!unreadBadge) {
        unreadBadge = document.createElement("span");
        unreadBadge.className = "unread-badge";
        existingItem.querySelector("h4").appendChild(unreadBadge);
      }
      unreadBadge.textContent = user.unread_messages;
    } else {
      existingItem.classList.remove("unread-message");
      const unreadBadge = existingItem.querySelector(".unread-badge");
      if (unreadBadge) unreadBadge.remove();
    }

    // Update message preview
    const messagePreview = existingItem.querySelector(".message-preview");
    if (messagePreview) {
      messagePreview.textContent =
        user.last_message || "Click to start a conversation";
    }

    // Move to top if there's a new message
    if (user.last_message) {
      messagesList.insertAdjacentElement("afterbegin", existingItem);
    }
  } else {
    const unreadClass = user.unread_messages > 0 ? "unread-message" : "";
    const unreadBadge =
      user.unread_messages > 0
        ? `<span class="unread-badge">${user.unread_messages}</span>`
        : "";

    const newMessageHTML = `
      <div class="message-item ${unreadClass}" data-user-id="${user.id}">
        <div class="user-avatar-wrapper">
          <img src="${user.avatar || "images/avatar.png"}" alt="${
      user.nickname
    }" class="user-avatar">
          <span class="status-indicator ${
            user.is_online ? "online" : "offline"
          }"></span>
        </div>
        <div class="message-content">
          <div class="message-header">
            <h4>${user.nickname} ${unreadBadge}</h4>
            <span class="user-info">${user.first_name} ${user.last_name}</span>
          </div>
          <p class="message-preview">${
            user.last_message || "Click to start a conversation"
          }</p>
        </div>
      </div>
    `;

    // Add new item at the top
    messagesList.insertAdjacentHTML("afterbegin", newMessageHTML);
  }
  showNotification(
    `You have a new Message from ${user.nickname || "anonymouse"}`,
    NotificationType.INFO
  );
}

export function handleMessageListMarkAsRead(data) {
  const { userId } = data;
  // Update the specific message item's appearance
  const messageItem = document.querySelector(
    `.message-item[data-user-id="${userId}"]`
  );
  if (messageItem) {
    // Remove unread styling
    messageItem.classList.remove("unread-message");

    // Remove unread badge
    const unreadBadge = messageItem.querySelector(".unread-badge");
    if (unreadBadge) {
      unreadBadge.remove();
    }

    // Reset message preview styling
    const messagePreview = messageItem.querySelector(".message-preview");
    if (messagePreview) {
      messagePreview.style.fontWeight = "normal";
      messagePreview.style.color = "var(--text-muted)";
    }
  } else {
    console.error("Message item not found");
  }
}

export function handleTypingStatus(data) {
  const { sender_id, recipient_id, is_typing } = data;
  const currentUserId = parseInt(
    JSON.parse(localStorage.getItem("userData")).id
  );

  // Only proceed if we are the recipient
  if (currentUserId !== recipient_id) {
    return;
  }

  // Get the current chat window's user ID
  const chatMessages = document.getElementById("chat-messages");
  if (!chatMessages) return;

  // Only show typing indicator if we're chatting with the sender
  if (chatMessages.dataset.userId === sender_id.toString()) {
    updateTypingStatus(sender_id, is_typing);
  }
}
