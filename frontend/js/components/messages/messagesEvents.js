import { searchMessages, fetchMessages } from './messagesApi.js';
import { renderMessages } from './messages.js';
import { throttle } from '../../utils.js';
import { showChatInColumn } from './messagesTemplates.js';

export function setupMessageEventListeners() {
    // Search input handler
    const searchInput = document.querySelector('.messages-search input');
    if (searchInput) {
        searchInput.addEventListener('input', throttle(handleSearchInput, 500));
    }

    // New message button handler
    const newMessageBtn = document.querySelector('.new-message-btn');
    if (newMessageBtn) {
        newMessageBtn.addEventListener('click', handleNewMessage);
    }

    // Message item click handler
    const messagesList = document.querySelector('.messages-list');
    if (messagesList) {
        messagesList.addEventListener('click', handleMessageItemClick);
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
    // Implement new message functionality
    console.log('New message button clicked');
}

function handleMessageItemClick(event) {
    const messageItem = event.target.closest('.message-item');
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
        const messageItems = document.querySelectorAll('.message-item');
        messageItems.forEach(item => {
            item.classList.toggle('active', item.dataset.userId === userId);
        });

        // Hide welcome message if it exists
        const welcomeMessage = document.querySelector('.welcome-message');
        if (welcomeMessage) {
            welcomeMessage.style.display = 'none';
        }

        // Show chat in the main column
        await showChatInColumn(userId);
        
    } catch (error) {
        console.error('Error opening chat:', error);
    }
}

function updateMessagesList(messages) {
    const messagesList = document.querySelector('.messages-list');
    if (!messagesList) return;

    messagesList.innerHTML = messages.length 
        ? messages.map(msg => createMessageItem(msg)).join('')
        : '<div class="no-messages">No messages found</div>';
}

function createMessageItem(message) {
    return `
        <div class="message-item" data-user-id="${message.user.id}">
            <div class="user-avatar-wrapper">
                <img src="${message.user.avatar}" alt="${message.user.nickname}" class="user-avatar">
                <span class="status-indicator ${message.user.isOnline ? 'online' : 'offline'}"></span>
            </div>
            <div class="message-content">
                <div class="message-header">
                    <h4>${message.user.nickname}</h4>
                    <span class="message-time">${formatTimeAgo(message.timestamp)}</span>
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

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString();
} 