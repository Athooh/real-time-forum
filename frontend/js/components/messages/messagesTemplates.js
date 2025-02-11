import { dummyMessages } from './messagesApi.js';
import { escapeHTML } from '../../utils.js';

export function createMessagesSection() {
    return `
    <div class="messages-page">
        <!-- Messages List Column -->
        <div class="messages-list-column">
            <div class="messages-header">
                <h3>Messages <span>3</sapn></h3>
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


export async function loadMessagesList() {
    const messagesList = document.getElementById('messages-list');
    if (!messagesList) return;

    try {
        // For now, using dummy messages
        const messagesHTML = dummyMessages.map(message => `
            <div class="message-item" data-user-id="${message.user.id}">
                <div class="user-avatar-wrapper">
                    <img src="${message.user.avatar || 'images/avatar.png'}" alt="User" class="user-avatar">
                    <span class="status-indicator ${message.user.isOnline ? 'online' : 'offline'}"></span>
                </div>
                <div class="message-content">
                    <div class="message-header">
                        <h4>${escapeHTML(message.user.nickname)}</h4>
                        <span class="message-time">${formatTimeAgo(message.timestamp)}</span>
                    </div>
                    <p class="message-preview">${escapeHTML(message.content)}</p>
                </div>
            </div>
        `).join('');

        messagesList.innerHTML = messagesHTML;
    } catch (error) {
        console.error('Error loading messages:', error);
        showNotification('Failed to load messages', NotificationType.ERROR);
    }
}


export async function showChatInColumn(userId) {
    const chatColumn = document.querySelector('.chat-column');
    if (!chatColumn) return;

    // Find user in dummy messages
    const message = dummyMessages.find(m => m.user.id === parseInt(userId));
    if (!message) {
        console.error('User not found:', userId);
        return;
    }

    chatColumn.innerHTML = `
        <div class="chat-header">
            <div class="user-info">
                <img src="${message.user.avatar || 'images/avatar.png'}" alt="User" class="user-avatar">
                <div>
                    <h4>${escapeHTML(message.user.nickname)}</h4>
                    <span class="status ${message.user.isOnline ? 'online' : 'offline'}">
                        ${message.user.isOnline ? 'Online' : 'Offline'}
                    </span>
                </div>
            </div>
        </div>
        <div class="chat-messages" id="chat-messages">
            <!-- Messages will be loaded here -->
        </div>
        <div class="chat-input-area">
            <input type="text" placeholder="Type a message...">
            <button class="send-message-btn">
                <i class="fas fa-paper-plane"></i>
            </button>
        </div>
    `;

    // Load chat history
    const chatMessages = document.getElementById('chat-messages');
    if (chatMessages) {
        await loadChatHistory(userId);
    }
}

async function loadChatHistory(userId) {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return;

    // Show loading state
    chatMessages.innerHTML = '<div class="loading">Loading messages...</div>';

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Dummy chat history
    const dummyChatHistory = [
        {
            sender: parseInt(userId),
            content: "Hey there! How are you?",
            timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString()
        },
        {
            sender: 'me',
            content: "I'm good, thanks! How about you?",
            timestamp: new Date(Date.now() - 1000 * 60 * 59).toISOString()
        },
        {
            sender: parseInt(userId),
            content: "Doing great! Just wanted to catch up.",
            timestamp: new Date(Date.now() - 1000 * 60 * 58).toISOString()
        }
    ];

    chatMessages.innerHTML = dummyChatHistory.map(msg => `
        <div class="chat-message ${msg.sender === 'me' ? 'sent' : 'received'}">
            <div class="message-content">
                <p>${escapeHTML(msg.content)}</p>
                <span class="message-time">${formatTimeAgo(msg.timestamp)}</span>
            </div>
        </div>
    `).join('');

    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
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