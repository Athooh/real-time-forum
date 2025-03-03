import { escapeHTML, getCurrentUserId } from "../../utils.js";
import {
  fetchConversation,
  sendMessage,
  markMessageAsRead,
  fetchUnreadCount,
  fetchUsers,
  sendTypingStatusToServer,
} from "./messagesApi.js";
import { handleChatOpen } from "./messagesEvents.js";
import { registerTimeElement } from "../../utils/timeUpdater.js";

export async function createMessagesSection(messages = []) {
  // Initial fetch of unread count
  let unreadCount = 0;
  try {
    const response = await fetchUnreadCount();
    unreadCount = response;
  } catch (error) {
    console.error("Error fetching unread count:", error);
  }

  // Create unread count element with a specific ID for dynamic updates
  const unreadCountDisplay =
    unreadCount > 0
      ? `<span class="unread-count" id="messages-unread-count">${unreadCount}</span>`
      : `<span class="unread-count" id="messages-unread-count" style="display: none"></span>`;

  return `
    <div class="messages-page">
        <!-- Messages List Column -->
        <div class="messages-list-column">
            <div class="messages-header">
                <h3>Messages ${unreadCountDisplay}</h3>
                <button class="new-message-btn">
                    <i class="fas fa-edit"></i>
                </button>
            </div>
            <div class="messages-search">
                <div class="search-wrapper">
                    <i class="fas fa-search"></i>
                    <input type="text" placeholder="Search messages...">
                </div>
            </div>
            <div class="messages-list" id="messages-list">
                <!-- Message threads will be inserted here -->
            </div>
        </div>

        <!-- Chat Window Column -->
        <div class="chat-column">
            <div class="chat-placeholder">
                <i class="fas fa-comments"></i>
                <h3>Select a conversation</h3>
                <p>Choose from your existing conversations or start a new one</p>
            </div>
        </div>
    </div>
`;
}

export async function loadMessagesList(messagesList, messages) {
  if (!messagesList) return;

  try {
    const users = await fetchUsers();

    if (!users || users.length === 0) {
      messagesList.innerHTML =
        '<div class="no-messages">No users available</div>';
      return;
    }

    // Sort users alphabetically by nickname
    const sortedUsers = users.sort((a, b) =>
      a.nickname.toLowerCase().localeCompare(b.nickname.toLowerCase())
    );

    const messagesHTML = sortedUsers
      .map((user) => {
        // Add unread class if there are unread messages
        const unreadClass = user.unread_messages > 0 ? "unread-message" : "";
        const unreadBadge =
          user.unread_messages > 0
            ? `<span class="unread-badge">${user.unread_messages}</span>`
            : "";

        return `
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
              <span class="user-info">${user.first_name} ${
          user.last_name
        }</span>
            </div>
            <p class="message-preview">Click to start a conversation</p>
          </div>
        </div>
      `;
      })
      .join("");

    messagesList.innerHTML = messagesHTML;

    // Add click event listeners for message items
    messagesList.addEventListener("click", (e) => {
      const messageItem = e.target.closest(".message-item");
      if (messageItem) {
        const userId = messageItem.dataset.userId;
        // Add chat-active class to enable sliding animation
        document.querySelector(".messages-page").classList.add("chat-active");
        // Handle chat opening
        handleChatOpen(userId);
      }
    });
  } catch (error) {
    console.error("Error loading users:", error);
    messagesList.innerHTML = '<div class="error">Failed to load users</div>';
  }
}

let typingTimer;
const TYPING_TIMEOUT = 2000; // 2 seconds

async function sendTypingStatus(recipientId, isTyping) {
  await sendTypingStatusToServer(recipientId, isTyping);
}

export async function showChatInColumn(userId, userInfo) {
  const chatColumn = document.querySelector(".chat-column");
  if (!chatColumn) return;

  chatColumn.innerHTML = `
        <div class="chat-header">
            <div class="chat-header-content">
                <div class="user-info" data-user-id="${userId}">
                    <img src="${
                      userInfo.avatar || "images/avatar.png"
                    }" alt="User" class="user-avatar">
                    <div>
                        <h4>${escapeHTML(userInfo.nickname)}</h4>
                        <span class="status ${
                          userInfo.isOnline ? "online" : "offline"
                        }" 
                              data-status-indicator="true" 
                              data-user-id="${userId}">
                            <span class="status-text">${
                              userInfo.isOnline ? "Online" : "Offline"
                            }</span>
                            <span class="typing-text" style="display: none">
                                typing<span class="typing-dots"></span>
                            </span>
                        </span>
                    </div>
                </div>
                <!-- Add back button for mobile -->
                <button class="back-button d-mobile-only">
                    <i class="fas fa-arrow-left"></i>
                </button>
            </div>
        </div>
        <div class="chat-messages" id="chat-messages" data-user-id="${userId}">
            <!-- Messages will be loaded here -->
        </div>
        <div class="chat-input-area">
            <input type="text" placeholder="Type a message..." id="chat-input">
            <button class="send-message-btn">
                <i class="fas fa-paper-plane"></i>
            </button>
        </div>
    `;

  // Load chat history
  const chatMessages = document.getElementById("chat-messages");
  if (chatMessages) {
    loadChatHistory(userId);
  }

  // Add event listeners for sending messages
  const sendButton = chatColumn.querySelector(".send-message-btn");
  const inputField = chatColumn.querySelector("#chat-input");

  const sendMessageInChat = async () => {
    const content = inputField.value.trim();
    if (!content) return;

    try {
      await sendMessage(parseInt(userId), content);
      inputField.value = ""; // Clear input after sending

      // Add the message to the chat immediately
      const chatMessages = document.getElementById("chat-messages");

      const emptyConversation = chatMessages.querySelector(
        ".empty-conversation"
      );
      if (emptyConversation) {
        emptyConversation.remove();
      }

      const newMessageHTML = `
                <div class="message-date-group">
                    <div class="chat-message sent">
                        <div class="message-bubble">
                            <div class="message-content">
                                <span class="message-sender">You</span>
                                <p>${escapeHTML(content)}</p>
                                <span class="message-time">${formatMessageTime(
                                  new Date()
                                )}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
      chatMessages.insertAdjacentHTML("beforeend", newMessageHTML);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  sendButton.addEventListener("click", sendMessageInChat);
  inputField.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      sendMessageInChat(); // Call the correct function
    }
  });

  // Add event listener for back button
  const backButton = chatColumn.querySelector(".back-button");
  if (backButton) {
    backButton.addEventListener("click", () => {
      document.querySelector(".messages-page").classList.remove("chat-active");
    });
  }

  // Add input event listener for typing status
  inputField.addEventListener("input", () => {
    // Send typing status when user starts typing
    sendTypingStatus(userId, true);

    // Clear existing timer
    clearTimeout(typingTimer);

    // Set new timer to stop typing status after user stops typing
    typingTimer = setTimeout(() => {
      sendTypingStatus(userId, false);
      updateTypingStatus(userId, false);
    }, TYPING_TIMEOUT);
  });

  // Add blur event to handle when user leaves the input
  inputField.addEventListener("blur", () => {
    clearTimeout(typingTimer);
    sendTypingStatus(userId, false);
    updateTypingStatus(userId, false);
  });
}

async function loadChatHistory(userId) {
  const chatMessages = document.getElementById("chat-messages");
  if (!chatMessages) return;

  try {
    // Initially fetch the latest 10 messages
    const conversation = await fetchConversation(userId, 1, 10);

    if (!conversation || conversation.length === 0) {
      chatMessages.innerHTML = `
        <div class="empty-conversation">
            <i class="fas fa-comments"></i>
            <h3>No messages yet</h3>
            <p>Start the conversation by sending a message below</p>
        </div>
      `;
      return;
    }

    console.log("conversation", conversation);
    // Mark all unread messages as read
    const currentUserId = getCurrentUserId();
    const unreadMessages = conversation.filter(
      (msg) =>
        parseInt(msg.sender_id) !== parseInt(currentUserId) && !msg.is_read
    );

    if (unreadMessages.length > 0) {
      try {
        // Create an array of promises to mark all messages as read
        const markReadPromises = unreadMessages.map((msg) =>
          markMessageAsRead(msg.id)
        );

        // Wait for all messages to be marked as read
        await Promise.all(markReadPromises);
      } catch (error) {
        console.error("Error marking messages as read:", error);
      }
    }

    // Initialize a map to store all message groups by date
    const allMessagesByDate = new Map();

    // Function to add messages to the date groups
    const addMessagesToGroups = (messages) => {
      messages.forEach((msg) => {
        const date = new Date(msg.timestamp).toLocaleDateString();
        if (!allMessagesByDate.has(date)) {
          allMessagesByDate.set(date, []);
        }
        allMessagesByDate.get(date).push(msg);
      });

      // Sort messages within each date group
      allMessagesByDate.forEach((messages) => {
        messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      });
    };

    // Add initial messages to groups
    addMessagesToGroups(conversation);

    // Render initial messages
    const renderMessageGroups = () => {
      const sortedDates = Array.from(allMessagesByDate.keys()).sort(
        (a, b) => new Date(a) - new Date(b)
      );

      const messagesHTML = sortedDates
        .map(
          (date) => `
            <div class="message-date-group" data-date="${date}">
                <div class="date-divider">
                    <span>${formatMessageDate(date)}</span>
                </div>
                ${allMessagesByDate
                  .get(date)
                  .map((msg) => createMessageElement(msg))
                  .join("")}
            </div>
          `
        )
        .join("");

      chatMessages.innerHTML = messagesHTML;
      chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    renderMessageGroups();

    // Add scroll event listener for infinite scroll
    let isLoading = false;
    let currentPage = 1;

    chatMessages.addEventListener("scroll", async () => {
      if (chatMessages.scrollTop <= 100 && !isLoading) {
        isLoading = true;
        currentPage++;

        // Add loading indicator
        const loadingIndicator = document.createElement("div");
        loadingIndicator.className = "loading-indicator";
        loadingIndicator.innerHTML = '<div class="spinner"></div>';
        chatMessages.prepend(loadingIndicator);

        try {
          const olderMessages = await fetchConversation(
            userId,
            currentPage,
            10
          );

          if (olderMessages && olderMessages.length > 0) {
            // Add new messages to existing groups
            addMessagesToGroups(olderMessages);

            // Store current scroll position
            const scrollHeight = chatMessages.scrollHeight;

            // Re-render all message groups
            renderMessageGroups();

            // Restore scroll position
            chatMessages.scrollTop = chatMessages.scrollHeight - scrollHeight;
          }
        } catch (error) {
          console.error("Error loading older messages:", error);
        } finally {
          loadingIndicator.remove();
          isLoading = false;
        }
      }
    });
  } catch (error) {
    console.error("Error loading chat history:", error);
    chatMessages.innerHTML = '<div class="error">Failed to load messages</div>';
  }
}

function createMessageElement(msg) {
  const currentUserId = getCurrentUserId();
  const timeId = `msg-time-${msg.id}`;

  const messageHTML = `
    <div class="chat-message ${
      parseInt(msg.sender_id) === parseInt(currentUserId) ? "sent" : "received"
    }">
        ${
          parseInt(msg.sender_id) !== parseInt(currentUserId)
            ? `<div class="message-avatar">
                <img src="${msg.user.avatar || "images/avatar.png"}" alt="${
                msg.user.nickname
              }">
               </div>`
            : ""
        }
        <div class="message-bubble">
            <div class="message-content">
                ${
                  parseInt(msg.sender_id) !== parseInt(currentUserId)
                    ? `<span class="message-sender">${escapeHTML(
                        msg.user.nickname
                      )}</span>`
                    : `<span class="message-sender">You</span>`
                }
                <p>${escapeHTML(msg.content)}</p>
                <span class="message-time" id="${timeId}">${formatMessageTime(
    msg.timestamp
  )}</span>
            </div>
        </div>
    </div>
  `;

  // Register the time element for updates
  setTimeout(() => {
    registerTimeElement(timeId, msg.timestamp, formatTimeAgo);
  }, 0);

  return messageHTML;
}

function formatMessageDate(dateStr) {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "long",
    year: "2-digit",
  });
}

function formatMessageTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
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

function updateTypingStatus(userId, isTyping) {
  const statusElement = document.querySelector(
    `[data-status-indicator="true"][data-user-id="${userId}"]`
  );

  if (statusElement) {
    const statusText = statusElement.querySelector(".status-text");
    const typingText = statusElement.querySelector(".typing-text");

    if (isTyping) {
      if (statusText) {
        statusText.style.display = "none";
      }
      if (typingText) {
        typingText.style.display = "inline-flex";
      }
      statusElement.classList.add("typing");
    } else {
      if (statusText) {
        statusText.style.display = "inline";
      }
      if (typingText) {
        typingText.style.display = "none";
      }
      statusElement.classList.remove("typing");
    }
  }
}

export {
  formatTimeAgo,
  formatMessageDate,
  formatMessageTime,
  updateTypingStatus,
};
