import { DUMMY_DATA } from '../utils/dummy-data.js';
import { NotificationType, showNotification } from '../utils/notifications.js';

// Add this dummy data
const dummyMessages = [
    {
        id: 1,
        user: {
            id: 101,
            nickname: "Sarah Wilson",
            avatar: "images/avatar1.png",
            isOnline: true
        },
        content: "Hey! Are we still meeting for coffee tomorrow morning?",
        timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 mins ago
        unread: true
    },
    {
        id: 2,
        user: {
            id: 102,
            nickname: "John Smith",
            avatar: "images/avatar1.png",
            isOnline: true
        },
        content: "I've just reviewed the project proposal. Let's discuss the changes...",
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
        unread: true
    },
    {
        id: 3,
        user: {
            id: 103,
            nickname: "Emma Davis",
            avatar: "images/avatar1.png",
            isOnline: false
        },
        content: "Thanks for your help with the presentation yesterday!",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
        unread: false
    },
    {
        id: 4,
        user: {
            id: 104,
            nickname: "Michael Chen",
            avatar: "images/avatar1.png",
            isOnline: true
        },
        content: "Did you see the new updates to the design system?",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
        unread: false
    },
    {
        id: 5,
        user: {
            id: 105,
            nickname: "Lisa Anderson",
            avatar: "images/avatar1.png",
            isOnline: false
        },
        content: "Great work on the latest feature implementation! The client is very happy...",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
        unread: false
    }
];

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

function createFloatingMessenger() {
    return `
        <!-- Floating Message Button -->
        <div class="floating-messenger-btn" id="floating-messenger-btn">
            <i class="fas fa-comment-dots"></i>
            <span class="message-badge">2</span>
        </div>

        <!-- Messages Slide Panel -->
        <div class="messages-slide-panel" id="messages-slide-panel">
            <div class="messages-panel-header">
                <h3>Messages</h3>
                <button class="close-messages-btn">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <div class="messages-search">
                <div class="search-wrapper">
                    <i class="fas fa-search"></i>
                    <input type="text" placeholder="Search messages...">
                </div>
            </div>

            <div class="messages-list">
                <!-- Messages will be dynamically inserted here -->
            </div>

            <button class="view-all-messages">
                View All Messages
            </button>
        </div>
    `;
}

function createMessageItem(message) {
    return `
        <div class="message-item" data-user-id="${message.user.id}">
            <div class="user-avatar-wrapper">
                <img src="${message.user.avatar || 'images/avatar.png'}" alt="User" class="user-avatar">
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

export function initializeMessenger() {
    // Remove any existing messenger elements
    const existingMessenger = document.getElementById('messenger-container');
    if (existingMessenger) {
        existingMessenger.remove();
    }

    // Create and append the messenger container
    const messengerContainer = document.createElement('div');
    messengerContainer.id = 'messenger-container';
    messengerContainer.innerHTML = createFloatingMessenger();
    document.body.appendChild(messengerContainer);

    // Initialize event listeners and load messages
    setupMessengerEventListeners();
    loadInitialMessages();
}

function setupMessengerEventListeners() {
    // Toggle messenger panel
    const messengerBtn = document.getElementById('floating-messenger-btn');
    const messengerPanel = document.getElementById('messages-slide-panel');
    const closeBtn = document.querySelector('.close-messages-btn');

    messengerBtn?.addEventListener('click', () => {
        messengerPanel.classList.add('active');
        loadInitialMessages(); // Refresh messages when opening
    });

    closeBtn?.addEventListener('click', () => {
        messengerPanel.classList.remove('active');
    });

    // Close panel when clicking outside
    document.addEventListener('click', (e) => {
        if (!messengerPanel.contains(e.target) && 
            !messengerBtn.contains(e.target) && 
            messengerPanel.classList.contains('active')) {
            messengerPanel.classList.remove('active');
        }
    });

    // Search functionality
    const searchInput = messengerPanel.querySelector('.search-wrapper input');
    searchInput?.addEventListener('input', debounce((e) => {
        handleMessageSearch(e.target.value);
    }, 300));

    // View all messages button
    const viewAllBtn = messengerPanel.querySelector('.view-all-messages');
    viewAllBtn?.addEventListener('click', () => {
        // Navigate to full messages page
        window.location.hash = '#messages';
        messengerPanel.classList.remove('active');
    });

    // Message item click
    const messagesList = messengerPanel.querySelector('.messages-list');
    messagesList?.addEventListener('click', (e) => {
        const messageItem = e.target.closest('.message-item');
        if (messageItem) {
            handleMessageItemClick(messageItem);
        }
    });
}

async function loadInitialMessages() {
    try {
        const messagesList = document.querySelector('.messages-list');
        if (!messagesList) return;

        // Show loading state
        messagesList.innerHTML = '<div class="loading">Loading messages...</div>';

        // Fetch messages from your API
        const messages = await fetchMessages();
        
        // Create HTML for each message
        const messagesHTML = messages.map(msg => `
            <div class="message-item" data-user-id="${msg.user.id}">
                <div class="user-avatar-wrapper">
                    <img src="${msg.user.avatar || 'images/avatar.png'}" alt="${msg.user.nickname}" class="user-avatar">
                    <span class="status-indicator ${msg.user.isOnline ? 'online' : 'offline'}"></span>
                </div>
                <div class="message-content">
                    <div class="message-header">
                        <h4>${msg.user.nickname}</h4>
                        <span class="message-time">${formatTimeAgo(msg.timestamp)}</span>
                    </div>
                    <p class="message-preview">${msg.content}</p>
                </div>
            </div>
        `).join('');

        // Render messages
        messagesList.innerHTML = messages.length ? messagesHTML : '<div class="no-messages">No messages yet</div>';

        // Update badge count
        updateMessageBadge(messages.filter(msg => msg.unread).length);

    } catch (error) {
        console.error('Error loading messages:', error);
        messagesList.innerHTML = '<div class="error">Failed to load messages</div>';
    }
}

async function handleMessageSearch(query) {
    const messagesList = document.querySelector('.messages-list');
    if (!messagesList) return;

    try {
        // Show loading state
        messagesList.innerHTML = '<div class="loading">Searching...</div>';

        // Fetch filtered messages from your API
        const messages = await searchMessages(query);
        
        // Render filtered messages
        messagesList.innerHTML = messages.length ?
            messages.map(msg => createMessageItem(msg)).join('') :
            '<div class="no-messages">No messages found</div>';

    } catch (error) {
        console.error('Error searching messages:', error);
        messagesList.innerHTML = '<div class="error">Search failed</div>';
    }
}

function handleMessageItemClick(messageItem) {
    const userId = messageItem.dataset.userId;
    // Open chat with this user
    openChat(userId);
    // Close messenger panel
    document.getElementById('messages-slide-panel').classList.remove('active');
}

function updateMessageBadge(count) {
    const badge = document.querySelector('.message-badge');
    if (badge) {
        if (count > 0) {
            badge.textContent = count > 99 ? '99+' : count;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }
}

// Helper function to debounce search input
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Modify the fetchMessages function to use dummy data
async function fetchMessages() {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return dummyMessages;
}

// Modify the searchMessages function to use dummy data
async function searchMessages(query) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Filter messages based on search query
    return dummyMessages.filter(msg => 
        msg.user.nickname.toLowerCase().includes(query.toLowerCase()) ||
        msg.content.toLowerCase().includes(query.toLowerCase())
    );
}

async function openChat(userId) {
    // Implement chat opening logic
    try {
        // Fetch chat history and open chat interface
        const response = await fetch(`/api/messages/chat/${userId}`);
        if (!response.ok) throw new Error('Failed to open chat');
        const chatData = await response.json();
        
        // You'll need to implement the chat interface opening logic
        console.log('Opening chat with user:', userId, chatData);
        
    } catch (error) {
        console.error('Error opening chat:', error);
        showNotification('Failed to open chat', NotificationType.ERROR);
    }
}

// Helper function to format time
function formatTimeAgo(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000); // difference in seconds

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString();
}