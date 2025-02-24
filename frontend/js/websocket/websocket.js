import { NotificationType, showNotification } from "../utils/notifications.js";
import { escapeHTML } from "../utils.js";
import {
  handleWebsocketUpdatePost,
  handlePostReactionUpdate,
  handleUnreadCountUpdate,
} from "./websocketUpdates.js";
import { formatNumber, formatTimeAgo } from "../utils.js";
import { fetchUserPhotos } from "../components/profile/profileApi.js";

export let globalSocket = null;
export let isIntentionalLogout = false;

export function initializeWebSocket() {
  resetLogoutState();
  let reconnectAttempts = 0;
  const maxReconnectAttempts = 5;
  const baseDelay = 1000; // Start with 1 second delay
  let reconnectTimeout;

  function connect() {
    const token = localStorage.getItem("token");

    // If there's already an active connection, close it
    if (globalSocket && globalSocket.readyState === WebSocket.OPEN) {
      globalSocket.close();
    }

    const socket = new WebSocket(`ws://localhost:8080/ws?token=${token}`);
    globalSocket = socket; // Store socket in global variable

    // Keep connection alive with ping-pong
    const pingInterval = setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: "ping" }));
      }
    }, 30000);

    socket.onopen = () => {
      console.log("WebSocket connection established");
      reconnectAttempts = 0; // Reset reconnect attempts on successful connection
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleWebSocketMessage(data);
    };

    socket.onclose = (event) => {
      console.log("WebSocket connection closed");
      clearInterval(pingInterval);

      // Don't attempt to reconnect if the closure was clean and intended
      if (event.wasClean || isIntentionalLogout) {
        console.log("WebSocket connection closed cleanly or intentionally");
        return;
      }

      // Only attempt to reconnect if we haven't exceeded max attempts
      if (reconnectAttempts < maxReconnectAttempts) {
        // Exponential backoff
        const delay = Math.min(
          baseDelay * Math.pow(2, reconnectAttempts),
          30000
        );
        console.log(
          `Attempting to reconnect in ${delay}ms... (Attempt ${
            reconnectAttempts + 1
          }/${maxReconnectAttempts})`
        );

        clearTimeout(reconnectTimeout);
        reconnectTimeout = setTimeout(() => {
          reconnectAttempts++;
          connect();
        }, delay);
      } else {
        console.log("Max reconnection attempts reached");
        // Optionally notify the user that the connection was lost
        showNotification(
          "Connection lost. Please refresh the page.",
          NotificationType.ERROR
        );
      }
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
      clearInterval(pingInterval);
    };

    return socket;
  }

  // Initial connection
  const socket = connect();

  // Add a cleanup function
  const cleanup = () => {
    clearTimeout(reconnectTimeout);
    if (socket.readyState === WebSocket.OPEN) {
      socket.close();
    }
    globalSocket = null;
  };

  // Return both the socket and cleanup function
  return { socket, cleanup };
}

// Add a function to check and reinitialize the connection if needed
export function ensureWebSocketConnection() {
  if (!globalSocket || globalSocket.readyState !== WebSocket.OPEN) {
    console.log("WebSocket connection not open, initializing...");
    initializeWebSocket();
  }
}

// Send a message via WebSocket
function sendMessage(message) {
  if (globalSocket.readyState === WebSocket.OPEN) {
    globalSocket.send(JSON.stringify({ type: "message", content: message }));
  } else {
    console.error("WebSocket is not open");
  }
}

export const WebSocketMessageType = {
  NEW_POST: "new_post",
  USER_ONLINE: "user_online",
  USER_OFFLINE: "user_offline",
  USER_FOLLOWED: "user_followed",
  USER_UNFOLLOWED: "user_unfollowed",
  NEW_USER: "new_user",
  POST_COUNT_UPDATE: "post_count_update",
  NEW_MESSAGE: "new_message",
  PHOTO_UPDATE: "photo_update",
  PROFILE_UPDATE: "profile_update",
  POST_REACTION: "post_reaction",
  UNREAD_COUNT_UPDATE: "unread_count_update",
};

export function handleWebSocketMessage(data) {
  let payload = data.payload;

  // Decode base64 payload if it exists and is for a new post
  if (
    data.type === WebSocketMessageType.NEW_POST &&
    typeof data.payload === "string"
  ) {
    try {
      const decodedPayload = atob(data.payload);
      payload = JSON.parse(decodedPayload);

      // If post has images, update the photos section
      if (payload.images && payload.images.length > 0) {
        updatePhotosSection(payload.user.id);
      }
    } catch (e) {
      console.error("Error decoding payload:", e);
      return;
    }
  }

  switch (data.type) {
    case WebSocketMessageType.NEW_POST:
      handleWebsocketUpdatePost(payload);
      break;
    case WebSocketMessageType.NEW_MESSAGE:
      handleWebsocketNewMessage(payload);
      break;
    case WebSocketMessageType.POST_COUNT_UPDATE:
      updatePostCount(payload);
      break;
    case WebSocketMessageType.USER_ONLINE:
    case WebSocketMessageType.USER_OFFLINE:
      updateUserOnlineStatus(payload);
      break;
    case WebSocketMessageType.USER_FOLLOWED:
    case WebSocketMessageType.USER_UNFOLLOWED:
      updateFollowStats(payload);
      break;
    case WebSocketMessageType.NEW_USER:
      updateSuggestionsList(payload);
      break;
    case WebSocketMessageType.PROFILE_UPDATE:
      handleProfileUpdate(payload);
      break;
    case WebSocketMessageType.POST_REACTION:
      handlePostReactionUpdate(payload);
      break;
    case WebSocketMessageType.UNREAD_COUNT_UPDATE:
      handleUnreadCountUpdate(payload);
      break;
    default:
      console.log("Unknown message type:", data.type);
  }
}

function updateUserOnlineStatus(data) {
  const { userId, isOnline } = data;
  // Update status indicators across the app
  document
    .querySelectorAll(`[data-user-id="${userId}"] .status-indicator`)
    .forEach((indicator) => {
      indicator.className = `status-indicator ${
        isOnline ? "online" : "offline"
      }`;
    });

  // Update chat header status if present
  const chatHeader = document.querySelector(
    `.user-info[data-user-id="${userId}"] [data-status-indicator]`
  );
  if (chatHeader) {
    chatHeader.className = `status ${isOnline ? "online" : "offline"}`;
    chatHeader.textContent = isOnline ? "Online" : "Offline";
  }
}

function updateFollowStats(data) {
  const { followerId, followingId, followersCount, followingCount } = data;
  const currentUserId = JSON.parse(localStorage.getItem("userData")).id;

  // Update profile stats if they exist
  const profileStats = document.querySelector(".profile-stats");
  if (profileStats) {
    const statItems = profileStats.querySelectorAll(".stat-item");

    // If we're looking at the profile of the user being followed
    if (followingId === currentUserId) {
      // Update followers count in stats
      const followersItem = statItems[0];
      if (followersItem) {
        followersItem.querySelector(".stat-value").textContent =
          formatNumber(followersCount);
      }

      // Update header followers count
      const headerFollowers = document.getElementById(
        "profile-header-followers"
      );
      if (headerFollowers) {
        headerFollowers.textContent = formatNumber(followersCount);
      }
    }

    // If we're looking at the profile of the user who is following
    if (followerId === currentUserId) {
      // Update following count
      const followingItem = statItems[1];
      if (followingItem) {
        followingItem.querySelector(".stat-value").textContent =
          formatNumber(followingCount);
      }
    }
  } else {
    // If profile stats don't exist, still update header followers
    if (followingId === currentUserId) {
      const headerFollowers = document.getElementById(
        "profile-header-followers"
      );
      if (headerFollowers) {
        headerFollowers.textContent = formatNumber(followersCount);
      }
    }
  }
}

function updateSuggestionsList(newUser) {
  const suggestionsContainer = document.querySelector(".follow-suggestions");
  if (!suggestionsContainer) return;

  const suggestionHTML = `
        <div class="suggestion-item" data-user-id="${newUser.id}">
            <div class="user-suggestions">
                <div class="avatar-wrapper">
                    <img src="${newUser.avatar || "images/avatar1.png"}" alt="${
    newUser.nickname
  }" class="user-avatar">
                    <span class="status-indicator offline"></span>
                </div>
                <div class="suggestion-info">
                    <h4>${escapeHTML(newUser.nickname)}</h4>
                    <p>${escapeHTML(newUser.profession || "Member")}</p>
                </div>
            </div>
            <button class="story-add" title="Follow user">
                <i class="fas fa-plus"></i>
            </button>
        </div>
    `;

  suggestionsContainer.insertAdjacentHTML("afterbegin", suggestionHTML);
  setupFollowEventListeners();
}

function updatePostCount(payload) {
  const postCountElement = document.querySelector(
    ".profile-stats .stat-item:nth-child(3) .stat-value"
  );
  if (postCountElement) {
    postCountElement.textContent = formatNumber(payload.postCount);
  }
}

function handleWebsocketNewMessage(payload) {
  const { sender_id, content, timestamp } = payload;

  // Find the active chat window if it exists
  const chatMessages = document.getElementById("chat-messages");
  if (chatMessages && chatMessages.dataset.userId === sender_id.toString()) {
    // Add the new message to the chat
    const newMessageHTML = `
            <div class="chat-message received">
                <div class="message-avatar">
                    <img src="${
                      payload.user.avatar || "images/avatar.png"
                    }" alt="${payload.user.nickname}">
                </div>
                <div class="message-bubble">
                    <div class="message-content">
                        <p>${escapeHTML(content)}</p>
                        <span class="message-time">${formatTimeAgo(
                          timestamp || new Date()
                        )}</span>
                    </div>
                </div>
            </div>
        `;
    chatMessages.insertAdjacentHTML("beforeend", newMessageHTML);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // Update the messages list if it exists
  const messagesList = document.getElementById("messages-list");
  if (messagesList) {
    const existingThread = messagesList.querySelector(
      `[data-user-id="${sender_id}"]`
    );
    if (existingThread) {
      // Update existing thread with new message preview
      const previewElement = existingThread.querySelector(".message-preview");
      const timeElement = existingThread.querySelector(".message-time");
      if (previewElement && timeElement) {
        previewElement.textContent = content;
        timeElement.textContent = formatTimeAgo(timestamp || new Date());
      }
      // Move thread to top
      messagesList.insertBefore(existingThread, messagesList.firstChild);
    } else {
      // Create new thread
      const newThreadHTML = `
                <div class="message-item" data-user-id="${sender_id}">
                    <div class="user-avatar-wrapper">
                        <img src="${
                          payload.user.avatar || "images/avatar.png"
                        }" alt="${payload.user.nickname}" class="user-avatar">
                        <span class="status-indicator ${
                          payload.user.isOnline ? "online" : "offline"
                        }"></span>
                    </div>
                    <div class="message-content">
                        <div class="message-header">
                            <h4>${escapeHTML(payload.user.nickname)}</h4>
                            <span class="message-time">${formatTimeAgo(
                              timestamp || new Date()
                            )}</span>
                        </div>
                        <p class="message-preview">${escapeHTML(content)}</p>
                    </div>
                </div>
            `;
      messagesList.insertAdjacentHTML("afterbegin", newThreadHTML);
    }
  }
}

// Add new function to handle photos section update
async function updatePhotosSection(userId) {
  const photosSection = document.querySelector(".photos-section");
  if (!photosSection) return;

  try {
    // Just fetch the current photos which will include the new ones
    const photos = await fetchUserPhotos(userId);
    const photoCount = photos.length;

    const newPhotosSectionHTML = `
            <div class="section-header">
                <h3><i class="fa-solid fa-images"></i> Photos</h3>
                <span class="photo-count">${photoCount} ${
      photoCount === 1 ? "photo" : "photos"
    }</span>
            </div>
            <div class="photos-grid">
                ${photos
                  .slice(0, 3)
                  .map(
                    (photo) => `
                    <div class="photo-item">
                        <img src="${photo}" alt="User photo">
                    </div>
                `
                  )
                  .join("")}
                ${
                  photoCount > 3
                    ? `
                    <div class="photo-item more-photos">
                        <img src="${photos[3]}" alt="User photo">
                        <div class="more-overlay">
                            <i class="fa-solid fa-plus"></i>
                            <span>${photoCount - 3} more</span>
                        </div>
                    </div>
                `
                    : ""
                }
            </div>
        `;

    photosSection.innerHTML = newPhotosSectionHTML;
  } catch (error) {
    console.error("Error updating photos section:", error);
  }
}

function handleProfileUpdate(data) {
  // Update all avatar instances across the application
  document
    .querySelectorAll(`img[data-user-avatar="${data.user_id}"]`)
    .forEach((img) => {
      img.src = data.profile.avatar || "images/avatar.png";
    });

  // Update cover image
  const coverImage = document.querySelector(".profile-cover img");
  if (coverImage) {
    coverImage.src = data.profile.cover_image || "images/banner.png";
  }

  // Update profile details in header section
  const nickname = document.querySelector(".profile-username h1");
  if (nickname) {
    nickname.textContent = data.profile.nickname || "User Name";
  }

  // Update bio section details
  const profession = document.querySelector(".profile-title");
  if (profession) {
    profession.innerHTML = `<i class="fa-solid fa-briefcase"></i> ${escapeHTML(
      data.profile.profession || "Professional Title"
    )}`;
  }

  const location = document.querySelector(".location");
  if (location) {
    location.innerHTML = `<i class="fa-solid fa-location"></i> ${escapeHTML(
      data.about?.location || "Location"
    )}`;
  }

  const website = document.querySelector(".website");
  if (website) {
    website.innerHTML = `<i class="fa-solid fa-link"></i> ${escapeHTML(
      data.about?.website || "Website"
    )}`;
  }

  const email = document.querySelector(".email");
  if (email) {
    email.innerHTML = `<i class="fa-solid fa-envelope"></i> ${escapeHTML(
      data.profile.email || "Email"
    )}`;
  }

  // Update about me section if it exists
  const aboutMeText = document.querySelector(".about-me-text");
  if (aboutMeText) {
    aboutMeText.textContent = data.about?.bio || "No description available";
  }

  // Update all profile detail items
  document.querySelectorAll(".profile-detail-item").forEach((item) => {
    const span = item.querySelector("span");
    if (!span) return;

    const text = span.textContent;
    if (text.startsWith("Age:")) {
      span.textContent = `Age: ${data.profile.age || "Not set"}`;
    } else if (text.startsWith("Status:")) {
      span.textContent = `Status: ${
        data.about?.relationship_status || "Not set"
      }`;
    } else if (text.startsWith("Lives in:")) {
      span.textContent = `Lives in: ${data.about?.location || "Not set"}`;
    } else if (text.startsWith("Email:")) {
      span.textContent = `Email: ${data.profile.email || "Not set"}`;
    }
  });

  // Update header avatar if it exists
  const headerAvatar = document.querySelector(".profile-menu .avatar");
  if (headerAvatar) {
    headerAvatar.src = data.profile.avatar || "images/avatar.png";
  }

  // Update interests section if it exists
  const interestsList = document.querySelector(".interests-list");
  if (interestsList && data.about?.interests) {
    const interestIcons = {
      Photography: "fa-camera",
      "Web Development": "fa-code",
      Hiking: "fa-person-hiking",
      Reading: "fa-book",
      Travel: "fa-plane",
      Music: "fa-music",
      Cooking: "fa-utensils",
      Gaming: "fa-gamepad",
      Art: "fa-palette",
      Sports: "fa-basketball",
      Movies: "fa-film",
      Writing: "fa-pen-nib",
      Technology: "fa-microchip",
      Science: "fa-flask",
      Design: "fa-bezier-curve",
      Fashion: "fa-shirt",
    };

    const userInterests = data.about.interests.split(",");
    const interestsHTML =
      userInterests.length > 0
        ? userInterests
            .map(
              (interest) => `
                <div class="interest-tag-item" title="${interest}">
                    <i class="fa-solid ${
                      interestIcons[interest] || "fa-star"
                    }"></i>
                    <span>${interest}</span>
                </div>
            `
            )
            .join("")
        : `<div class="no-interests">
                <i class="fa-solid fa-lightbulb"></i>
                <p>No interests added yet</p>
               </div>`;

    interestsList.querySelector(".interest-tags").innerHTML = interestsHTML;
  }

  // Update localStorage with new data
  const currentUserData =
    JSON.parse(localStorage.getItem("userDataAbout")) || {};
  localStorage.setItem(
    "userDataAbout",
    JSON.stringify({
      ...currentUserData,
      profile: { ...currentUserData.profile, ...data.profile },
      about: { ...currentUserData.about, ...data.about },
    })
  );

  // Add this new section to update sidebar profile card
  const sidebarAvatar = document.querySelector(
    ".user-profile-card .profile-avatar img"
  );
  if (sidebarAvatar) {
    sidebarAvatar.src = data.profile.avatar || "images/avatar.png";
  }

  const sidebarBanner = document.querySelector(
    ".user-profile-card .profile-banner img"
  );
  if (sidebarBanner) {
    sidebarBanner.src = data.profile.cover_image || "images/banner.png";
  }

  const sidebarName = document.querySelector(".user-profile-card .user-name");
  if (sidebarName) {
    sidebarName.textContent = data.profile.nickname || "John Doe";
  }

  const sidebarProfession = document.querySelector(
    ".user-profile-card .user-profession"
  );
  if (sidebarProfession) {
    sidebarProfession.textContent =
      data.profile.profession || "Software Engineer";
  }

  const sidebarTagline = document.querySelector(
    ".user-profile-card .user-tagline"
  );
  if (sidebarTagline) {
    sidebarTagline.textContent =
      data.about?.bio || "Building the future, one line of code at a time";
  }
}

export function resetLogoutState() {
  isIntentionalLogout = false;
}
