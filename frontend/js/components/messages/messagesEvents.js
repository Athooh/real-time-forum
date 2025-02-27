import {
  searchMessages,
  fetchMessages,
  sendMessage,
  fetchConversation,
} from "./messagesApi.js";
import {
  showNotification,
  NotificationType,
} from "../../utils/notifications.js";
import { throttle, getCurrentUserId, escapeHTML } from "../../utils.js";
import { showChatInColumn } from "./messagesTemplates.js";
import { authenticatedFetch } from "../../security.js";

export function setupMessageEventListeners() {
  // Search input handler
  const searchInput = document.querySelector(".messages-search input");
  if (searchInput) {
    searchInput.addEventListener("input", throttle(handleSearchInput, 500));
  }

  // New message button handler
  const newMessageBtn = document.querySelector(".new-message-btn");
  if (newMessageBtn) {
    newMessageBtn.addEventListener("click", handleNewMessage);
  }

  // Message item click handler
  const messagesList = document.querySelector(".messages-list");
  if (messagesList) {
    messagesList.addEventListener("click", handleMessageItemClick);
  }
}

async function handleSearchInput(event) {
  const query = event.target.value.trim();
  if (query.length === 0) {
    // Load all messages if search is empty
    const messages = await fetchMessages();
    updateMessagesList(messages);
    return;
  }

  const results = await searchMessages(query);
  updateMessagesList(results);
}

function handleNewMessage() {
  // Create modal HTML
  const modalHTML = `
        <div class="new-message-modal">
            <div class="new-message-header">
                <h3>New message</h3>
                <button class="close-btn">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="recipient-search">
                <label>To:</label>
                <input type="text" placeholder="Search users...">
            </div>
           
            <div class="new-message-content">
                <textarea class="new-message-input" placeholder="Type your message..."></textarea>
            </div>
            <div class="new-message-actions">
                <button class="attachment-btn">
                    <i class="fas fa-paperclip"></i>
                </button>
                <button class="send-btn">
                    <i class="fas fa-paper-plane"></i>
                </button>
            </div>
        </div>
    `;

  // Create modal container
  const modalContainer = document.createElement("div");
  modalContainer.className = "modal-overlay";
  modalContainer.style.display = "flex";
  modalContainer.innerHTML = modalHTML;

  // Add to document
  document.body.appendChild(modalContainer);

  // Setup event listeners
  const closeBtn = modalContainer.querySelector(".close-btn");
  const sendBtn = modalContainer.querySelector(".send-btn");
  const recipientSearch = modalContainer.querySelector(
    ".recipient-search input"
  );

  // Add search input handler with throttle
  recipientSearch.addEventListener(
    "input",
    throttle(handleRecipientSearch, 500)
  );

  closeBtn.addEventListener("click", () => {
    modalContainer.remove();
  });

  sendBtn.addEventListener("click", async () => {
    const recipientInput = modalContainer.querySelector(
      ".recipient-search input"
    );
    const messageInput = modalContainer.querySelector(".new-message-input");
    const message = messageInput.value.trim();
    const recipientId = recipientInput.dataset.userId; // We set this in handleRecipientSearch

    if (!recipientId) {
      showNotification(
        "Please select a valid recipient",
        NotificationType.ERROR
      );
      return;
    }

    if (!message) {
      showNotification("Please enter a message", NotificationType.ERROR);
      return;
    }

    try {
      await sendMessage(parseInt(recipientId), message);
      modalContainer.remove();

      // Refresh messages list to show the new conversation
      const messages = await fetchMessages();
      updateMessagesList(messages);

      // Open chat with the recipient
      await handleChatOpen(recipientId);
    } catch (error) {
      console.error("Error sending message:", error);
      showNotification("Failed to send message", NotificationType.ERROR);
    }
  });

  // Close on outside click
  modalContainer.addEventListener("click", (e) => {
    if (e.target === modalContainer) {
      modalContainer.remove();
    }
  });
}

async function handleRecipientSearch(event) {
  const query = event.target.value.trim();
  const searchInput = event.target;
  const recipientSearchContainer = searchInput.closest(".recipient-search");

  // Create results container
  const resultsContainer = document.createElement("div");
  resultsContainer.className = "recipient-search-results";

  // Remove any existing results container
  const existingResults = document.querySelector(".recipient-search-results");
  if (existingResults) {
    existingResults.remove();
  }

  if (query.length === 0) {
    return;
  }

  try {
    const page = 1;
    const limit = 5;
    const response = await authenticatedFetch(
      `/api/users/search?q=${encodeURIComponent(
        query
      )}&page=${page}&limit=${limit}`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch users");
    }

    const users = await response.json();

    if (!users || users.length === 0) {
      resultsContainer.innerHTML = `<div class="search-results-content">
                <div class="no-results">No users available with that name</div>
            </div>`;

      // Position the results container relative to the search container
      resultsContainer.style.position = "absolute";
      resultsContainer.style.top = "100%"; // Position right below the input
      resultsContainer.style.left = "0";
      resultsContainer.style.width = "100%";
      resultsContainer.style.maxHeight = "200px";
      resultsContainer.style.overflowY = "auto";
      resultsContainer.style.zIndex = "1000";

      // Add the results to the recipient search container
      recipientSearchContainer.style.position = "relative";
      recipientSearchContainer.appendChild(resultsContainer);
      return;
    }

    if (users.length > 0) {
      const resultsHTML = `
                <div class="search-results-content">
                    ${users
                      .map(
                        (user) => `
                        <div class="recipient-result" data-user-id="${user.id}">
                            <div class="user-avatar-wrapper">
                                <img src="${
                                  user.avatar || "images/avatar.png"
                                }" alt="${user.nickname}" class="user-avatar">
                                <span class="status-indicator ${
                                  user.is_online ? "online" : "offline"
                                }"></span>
                            </div>
                            <div class="user-info">
                                <span class="user-nickname">${
                                  user.nickname
                                }</span>
                                <span class="user-name">${user.first_name} ${
                          user.last_name
                        }</span>
                            </div>
                        </div>
                    `
                      )
                      .join("")}
                </div>
                ${
                  users.length === limit
                    ? `
                    <div class="load-more">
                        <button class="load-more-btn" data-page="2">Load more</button>
                    </div>
                `
                    : ""
                }
            `;

      resultsContainer.innerHTML = resultsHTML;

      // Add click handlers for results
      resultsContainer.addEventListener("click", (e) => {
        const resultItem = e.target.closest(".recipient-result");
        if (resultItem) {
          const userId = resultItem.dataset.userId;
          const nickname =
            resultItem.querySelector(".user-nickname").textContent;
          event.target.value = nickname;
          event.target.dataset.userId = userId;
          resultsContainer.remove();
        }

        // Handle load more button click
        const loadMoreBtn = e.target.closest(".load-more-btn");
        if (loadMoreBtn) {
          const nextPage = parseInt(loadMoreBtn.dataset.page);
          loadMoreResults(query, nextPage, limit, resultsContainer);
        }
      });
    } else {
      resultsContainer.innerHTML =
        '<div class="no-results">No users found</div>';
    }

    // Position the results container relative to the search container
    resultsContainer.style.position = "absolute";
    resultsContainer.style.top = "100%"; // Position right below the input
    resultsContainer.style.left = "0";
    resultsContainer.style.width = "100%";
    resultsContainer.style.maxHeight = "200px";
    resultsContainer.style.overflowY = "auto";
    resultsContainer.style.zIndex = "1000";

    // Add the results to the recipient search container
    recipientSearchContainer.style.position = "relative";
    recipientSearchContainer.appendChild(resultsContainer);
  } catch (error) {
    console.error("Error searching users:", error);
  }
}

async function loadMoreResults(query, page, limit, container) {
  try {
    const response = await authenticatedFetch(
      `/api/users?search=${encodeURIComponent(
        query
      )}&page=${page}&limit=${limit}`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch more users");
    }

    const users = await response.json();
    const resultsContent = container.querySelector(".search-results-content");
    const loadMoreDiv = container.querySelector(".load-more");

    // Append new results
    users.forEach((user) => {
      const userElement = document.createElement("div");
      userElement.className = "recipient-result";
      userElement.dataset.userId = user.id;
      userElement.innerHTML = `
                <div class="user-avatar-wrapper">
                    <img src="${user.avatar || "images/avatar.png"}" alt="${
        user.nickname
      }" class="user-avatar">
                    <span class="status-indicator ${
                      user.is_online ? "online" : "offline"
                    }"></span>
                </div>
                <div class="user-info">
                    <span class="user-nickname">${user.nickname}</span>
                    <span class="user-name">${user.first_name} ${
        user.last_name
      }</span>
                </div>
            `;
      resultsContent.appendChild(userElement);
    });

    // Update or remove load more button
    if (users.length === limit) {
      loadMoreDiv.innerHTML = `
                <button class="load-more-btn" data-page="${
                  page + 1
                }">Load more</button>
            `;
    } else {
      loadMoreDiv.remove();
    }
  } catch (error) {
    console.error("Error loading more results:", error);
  }
}

function handleMessageItemClick(event) {
  const messageItem = event.target.closest(".message-item");
  if (!messageItem) return;

  const userId = messageItem.dataset.userId;
  if (userId) {
    handleChatOpen(userId);
  }
}

// Export this function to make it available
export async function handleChatOpen(userId) {
  try {
    // Update active state of message items
    const messageItems = document.querySelectorAll(".message-item");
    messageItems.forEach((item) => {
      item.classList.toggle("active", item.dataset.userId === userId);
    });

    // Hide welcome message if it exists
    const welcomeMessage = document.querySelector(".welcome-message");
    if (welcomeMessage) {
      welcomeMessage.style.display = "none";
    }

    // Get user info from the active message item
    const activeItem = document.querySelector(
      `.message-item[data-user-id="${userId}"]`
    );

    const userInfo = {
      nickname: activeItem.querySelector("h4").firstChild.textContent.trim(),
      avatar: activeItem.querySelector(".user-avatar").src,
      isOnline: activeItem
        .querySelector(".status-indicator")
        .classList.contains("online"),
    };

    // Show chat in the main column
    await showChatInColumn(userId, userInfo);

    setupChatScrollListener(userId);
  } catch (error) {
    console.error("Error opening chat:", error);
  }
}

function updateMessagesList(messages) {
  const messagesList = document.querySelector(".messages-list");
  if (!messagesList) return;

  messagesList.innerHTML = messages.length
    ? messages.map((msg) => createMessageItem(msg)).join("")
    : '<div class="no-messages">No messages found</div>';
}

function createMessageItem(message) {
  return `
        <div class="message-item" data-user-id="${message.user.id}">
            <div class="user-avatar-wrapper">
                <img src="${message.user.avatar || "images/avatar.png"}" alt="${
    message.user.nickname
  }" class="user-avatar">
                <span class="status-indicator ${
                  message.user.isOnline ? "online" : "offline"
                }"></span>
            </div>
            <div class="message-content">
                <div class="message-header">
                    <h4>${message.user.nickname}</h4>
                    <span class="message-time">${formatTimeAgo(
                      message.timestamp
                    )}</span>
                </div>
                <p class="message-preview">${message.content}</p>
            </div>
        </div>
    `;
}

function formatTimeAgo(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);

  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return date.toLocaleDateString();
}

let isLoadingHistory = false;
let allMessagesLoaded = false;
let currentPage = 1;

function setupChatScrollListener(userId) {
  const chatMessages = document.querySelector(".chat-messages");
  if (!chatMessages) return;

  // Store initial scroll height
  let lastScrollHeight = chatMessages.scrollHeight;

  chatMessages.addEventListener("scroll", async function () {
    // Check if we're near the top (scrolling up)
    if (
      chatMessages.scrollTop <= 100 &&
      !isLoadingHistory &&
      !allMessagesLoaded
    ) {
      isLoadingHistory = true;

      // Add loading indicator at the top
      const loadingDiv = document.createElement("div");
      loadingDiv.className = "message-loading";
      loadingDiv.innerHTML = '<div class="loading-spinner"></div>';
      chatMessages.prepend(loadingDiv);

      // Remember scroll position
      const previousHeight = chatMessages.scrollHeight;

      try {
        currentPage++;
        const olderMessages = await fetchConversation(userId, currentPage);

        if (!olderMessages || olderMessages.length < 20) {
          allMessagesLoaded = true;
        }

        if (olderMessages && olderMessages.length > 0) {
          // Create and prepend messages
          const messagesHTML = olderMessages
            .reverse()
            .map((msg) => createMessageElement(msg))
            .join("");
          loadingDiv.insertAdjacentHTML("afterend", messagesHTML);

          // Maintain scroll position
          const newScrollTop = chatMessages.scrollHeight - previousHeight;
          chatMessages.scrollTop = newScrollTop;
        }
      } catch (error) {
        console.error("Error loading chat history:", error);
      } finally {
        // Remove loading indicator
        loadingDiv.remove();
        isLoadingHistory = false;
      }
    }
  });
}

function createMessageElement(message) {
  const isOwn = message.sender_id === getCurrentUserId();
  return `
        <div class="chat-message ${isOwn ? "sent" : "received"}">
            ${
              !isOwn
                ? `
                <div class="message-avatar">
                    <img src="${
                      message.user.avatar || "images/default-avatar.png"
                    }" alt="${message.user.nickname}">
                </div>
            `
                : ""
            }
            <div class="message-bubble">
                <div class="message-content">
                    <p>${escapeHTML(message.content)}</p>
                    <span class="message-time">${formatTimeAgo(
                      message.timestamp
                    )}</span>
                </div>
            </div>
        </div>
    `;
}
