import { escapeHTML, getCurrentUserId } from "../../utils.js";
import {
  fetchConversation,
  sendMessage,
  markMessageAsRead,
} from "./messagesApi.js";
import { handleChatOpen } from "./messagesEvents.js";

export async function createMessagesSection(messages = []) {
  const unreadCount = messages?.filter((msg) => !msg.is_read)?.length || 0;
  const unreadCountDisplay =
    unreadCount > 0 ? `<span class="unread-count">${unreadCount}</span>` : "";

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

export function loadMessagesList(messagesList, messages) {
  if (!messagesList) {
    console.error("Messages list element not found");
    return;
  }

  const messageArray = Array.isArray(messages) ? messages : [];

  // Take only the first message from the array
  const firstMessage = messageArray[0];

  messagesList.innerHTML = firstMessage
    ? createMessageItem(firstMessage)
    : '<div class="no-messages">No messages yet</div>';

  // Add click event listeners to message items
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
}

function createMessageItem(msg) {
  return `
        <div class="message-item" data-user-id="${msg.user.id}">
            <div class="user-avatar-wrapper">
                <img src="${msg.user.avatar || "images/avatar.png"}" alt="${
    msg.user.nickname
  }" class="user-avatar">
                <span class="status-indicator ${
                  msg.user.isOnline ? "online" : "offline"
                }"></span>
            </div>
            <div class="message-content">
                <div class="message-header">
                    <h4>${msg.user.nickname}</h4>
                    <span class="message-time">${formatTimeAgo(
                      msg.timestamp
                    )}</span>
                </div>
                <p class="message-preview">${msg.content}</p>
            </div>
        </div>
    `;
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
                        }" data-status-indicator="true">
                            ${userInfo.isOnline ? "Online" : "Offline"}
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
      const newMessageHTML = `
                <div class="message-date-group">
                    <div class="chat-message sent">
                        <div class="message-bubble">
                            <div class="message-content">
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

    // Mark last unread message as read
    const currentUserId = getCurrentUserId();
    const lastReceivedMessage = [...conversation]
      .reverse()
      .find(
        (msg) =>
          parseInt(msg.sender_id) !== parseInt(currentUserId) && !msg.is_read
      );

    if (lastReceivedMessage) {
      try {
        await markMessageAsRead(lastReceivedMessage.id);
      } catch (error) {
        console.error("Error marking message as read:", error);
      }
    }

    const messagesByDate = conversation.reduce((acc, msg) => {
      const date = new Date(msg.timestamp).toLocaleDateString();

      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(msg);
      acc[date].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      return acc;
    }, {});

    const sortedDates = Object.keys(messagesByDate).sort(
      (a, b) => new Date(a) - new Date(b) // Sort dates in ascending order
    );

    const messagesHTML = sortedDates
      .map(
        (date) => `
            <div class="message-date-group">
                <div class="date-divider">
                    <span>${formatMessageDate(date)}</span>
                </div>
                ${messagesByDate[date]
                  .map((msg) => createMessageElement(msg))
                  .join("")}
            </div>
        `
      )
      .join("");

    chatMessages.innerHTML = messagesHTML;
    chatMessages.scrollTop = chatMessages.scrollHeight;

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
            // Group and render older messages
            const oldMessagesByDate = olderMessages.reduce((acc, msg) => {
              const date = new Date(msg.timestamp).toLocaleDateString();
              if (!acc[date]) acc[date] = [];
              acc[date].push(msg);
              acc[date].sort(
                (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
              );
              return acc;
            }, {});

            const oldSortedDates = Object.keys(oldMessagesByDate).sort(
              (a, b) => new Date(b) - new Date(a)
            );

            const oldMessagesHTML = oldSortedDates
              .map(
                (date) => `
                    <div class="message-date-group">
                        <div class="date-divider">
                            <span>${formatMessageDate(date)}</span>
                        </div>
                        ${oldMessagesByDate[date]
                          .map((msg) => createMessageElement(msg))
                          .join("")}
                    </div>
                `
              )
              .join("");

            // Preserve scroll position
            const scrollHeight = chatMessages.scrollHeight;
            chatMessages.insertAdjacentHTML("afterbegin", oldMessagesHTML);
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
  return `
    <div class="chat-message ${
      parseInt(msg.sender_id) === parseInt(currentUserId) ? "sent" : "received"
    }">
        ${
          parseInt(msg.sender_id) !== parseInt(currentUserId)
            ? `
            <div class="message-avatar">
                <img src="${msg.user.avatar || "images/avatar.png"}" alt="${
                msg.user.nickname
              }">
            </div>
        `
            : ""
        }
        <div class="message-bubble">
            <div class="message-content">
                <p>${escapeHTML(msg.content)}</p>
                <span class="message-time">${formatMessageTime(
                  msg.timestamp
                )}</span>
            </div>
        </div>
    </div>
  `;
}

function formatMessageDate(dateStr) {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return "";
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
export { formatTimeAgo, formatMessageDate, formatMessageTime };
