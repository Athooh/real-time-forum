import { createMessagesSection, loadMessagesList } from './messagesTemplates.js';
import { setupMessageEventListeners } from './messagesEvents.js';
import { fetchMessages } from './messagesApi.js';


// Main initialization function
export async function initializeMessages(container) {
    try {
        // Fetch messages first
        const messages = await fetchMessages();
        
        // Create the section with the messages
        const messagesSection = await createMessagesSection(messages);
        
        // Update container content
        container.innerHTML = messagesSection;
        
        // Get the messages list element after DOM is updated
        const messagesList = document.querySelector('#messages-list');
        if (!messagesList) {
            throw new Error('Messages list element not found');
        }
        
        // Load the messages list
        loadMessagesList(messagesList, messages);
        
        // Setup event listeners
        setupMessageEventListeners();
        
    } catch (error) {
        console.error('Error initializing messages:', error);
        container.innerHTML = '<div class="error">Failed to load messages</div>';
    }
}



// Render messages to the DOM
export function renderMessages(messages) {
    const messagesList = document.querySelector('.messages-list');
    if (!messagesList) return;

    const messageArray = Array.isArray(messages) ? messages : [];
    
    messagesList.innerHTML = messageArray.length 
        ? messageArray.map(msg => createMessageItem(msg)).join('')
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