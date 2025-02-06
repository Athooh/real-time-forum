import { DUMMY_DATA } from '../utils/dummy-data.js';
import { NotificationType, showNotification } from '../utils/notifications.js';

function createMessagesSection() {
    return `
        <div class="messages-section" id="messages-section">
            ${createMessagesSidebar()}
            ${createMessagesMain()}
        </div>
    `;
}

function createMessagesSidebar() {
    return `
        <div class="messages-sidebar">
            <div class="messages-header">
                <h3>Messages</h3>
                <button class="new-message-btn">
                    <i class="fas fa-edit"></i>
                </button>
            </div>
            <div class="messages-search">
                <input type="text" placeholder="Search messages...">
            </div>
            <div class="messages-list" id="messages-list">
                <!-- Message threads will be inserted here -->
            </div>
        </div>
    `;
}

function createMessagesMain() {
    return `
        <div class="messages-main">
            <div class="messages-chat-header">
                <!-- Chat header will be inserted here -->
            </div>
            <div class="messages-chat-body" id="chat-messages">
                <!-- Messages will be inserted here -->
            </div>
            <div class="messages-chat-footer">
                <form id="message-form">
                    <input type="text" placeholder="Type a message...">
                    <button type="submit">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </form>
            </div>
        </div>
    `;
}

function createMessageThread(thread) {
    return `
        <div class="message-thread ${thread.unread ? 'unread' : ''}" data-thread-id="${thread.id}">
            <img src="${thread.user.avatar || 'images/avatar.png'}" alt="User" class="user-avatar">
            <div class="thread-content">
                <div class="thread-header">
                    <h4>${escapeHTML(thread.user.nickname)}</h4>
                    <span class="thread-time">${formatTimeAgo(thread.lastMessage.timestamp)}</span>
                </div>
                <p class="thread-preview">${escapeHTML(thread.lastMessage.content)}</p>
            </div>
        </div>
    `;
}

function createMessage(message) {
    const isOwn = message.userId === getCurrentUserId();
    return `
        <div class="message ${isOwn ? 'own-message' : ''}">
            <div class="message-content">
                <p>${escapeHTML(message.content)}</p>
                <span class="message-time">${formatTimeAgo(message.timestamp)}</span>
            </div>
        </div>
    `;
}

function setupMessageEventListeners() {
    // Message thread selection
    const threadElements = document.querySelectorAll('.message-thread');
    threadElements?.forEach(thread => {
        thread.addEventListener('click', handleThreadSelect);
    });

    // Message form submission
    const messageForm = document.getElementById('message-form');
    messageForm?.addEventListener('submit', handleMessageSubmit);

    // New message button
    const newMessageBtn = document.querySelector('.new-message-btn');
    newMessageBtn?.addEventListener('click', showNewMessageModal);
}

async function handleThreadSelect(e) {
    const threadId = e.currentTarget.dataset.threadId;
    try {
        const messages = await fetchThreadMessages(threadId);
        renderMessages(messages);
        markThreadAsRead(threadId);
    } catch (error) {
        showNotification('Failed to load messages', NotificationType.ERROR);
    }
}

async function handleMessageSubmit(e) {
    e.preventDefault();
    const input = e.target.querySelector('input');
    const content = input.value.trim();
    const threadId = getCurrentThreadId();

    if (content && threadId) {
        try {
            await sendMessage(threadId, content);
            input.value = '';
            await refreshMessages(threadId);
        } catch (error) {
            showNotification('Failed to send message', NotificationType.ERROR);
        }
    }
}

// Add the fetchOnlineUsers function
async function fetchOnlineUsers() {
    try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Use dummy data
        const users = DUMMY_DATA.onlineUsers;
        
        // Sort users: first by last message timestamp, then alphabetically
        const sortedUsers = users.sort((a, b) => {
            // If both have messages, sort by timestamp
            if (a.lastMessage && b.lastMessage) {
                return new Date(b.lastMessage.timestamp) - new Date(a.lastMessage.timestamp);
            }
            // If only one has messages, put the one with messages first
            if (a.lastMessage) return -1;
            if (b.lastMessage) return 1;
            // If neither has messages, sort alphabetically
            return a.nickname.localeCompare(b.nickname);
        });

        return sortedUsers;

        /* TODO: Implement actual API call later
        const response = await fetch('/api/users/online', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch online users');
        }

        return await response.json();
        */
    } catch (error) {
        console.error('Error fetching online users:', error);
        showNotification('Failed to fetch online users', NotificationType.ERROR);
        return [];
    }
}

// Add this function to handle the initialization
 function initializeMessages(container) {
    // First render the messages section
    container.innerHTML = createMessagesSection();
    
    // Then set up the event listeners
    setupMessageEventListeners();
    
    // Initialize the online users list
    fetchOnlineUsers();
}

// Update exports to include all necessary functions
export { 
    createMessagesSection, 
    setupMessageEventListeners, 
    fetchOnlineUsers,
    initializeMessages 
};