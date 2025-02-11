import { createMessagesSection } from './messagesTemplates.js';
import { setupMessageEventListeners } from './messagesEvents.js';
import { fetchMessages } from './messagesApi.js';

// Main initialization function
export function initializeMessages(container) {
    // Render the initial messages structure
    container.innerHTML = createMessagesSection();
    
    // Setup event listeners
    setupMessageEventListeners();
    
    // Load initial messages data
    loadInitialMessages();
}

// Online users functionality
export function fetchOnlineUsers() {
    // Implementation for fetching online users
    console.log('Fetching online users...');
    return [];
}

// Initial messages load
async function loadInitialMessages() {
    try {
        const messages = await fetchMessages();
        renderMessages(messages);
    } catch (error) {
        console.error('Error loading messages:', error);
    }
}

// Render messages to the DOM
export function renderMessages(messages) {
    const messagesList = document.querySelector('.messages-list');
    if (!messagesList) return;

    messagesList.innerHTML = messages.length 
        ? messages.map(msg => createMessageItem(msg)).join('')
        : '<div class="no-messages">No messages yet</div>';
}

// Helper function to create message items
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

// Time formatting helper
function formatTimeAgo(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString();
} 