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
    const modalContainer = document.createElement('div');
    modalContainer.className = 'modal-overlay';
    modalContainer.style.display = 'flex';
    modalContainer.innerHTML = modalHTML;

    // Add to document
    document.body.appendChild(modalContainer);

    // Setup event listeners
    const closeBtn = modalContainer.querySelector('.close-btn');
    const sendBtn = modalContainer.querySelector('.send-btn');

    closeBtn.addEventListener('click', () => {
        modalContainer.remove();
    });

    sendBtn.addEventListener('click', () => {
        const recipient = modalContainer.querySelector('.recipient-search input').value;
        const message = modalContainer.querySelector('.new-message-input').value;
        
        if (message.trim()) {
            // Handle message sending here
            console.log('Sending message to:', recipient);
            console.log('Message:', message);
            modalContainer.remove();
        }
    });

    // Close on outside click
    modalContainer.addEventListener('click', (e) => {
        if (e.target === modalContainer) {
            modalContainer.remove();
        }
    });
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