// DOM Elements
const usersList = document.getElementById('users-list');
const messagesContainer = document.getElementById('messages-container');
const sendMessageForm = document.getElementById('send-message');

// Fetch Online Users
async function fetchOnlineUsers() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No authentication token found');
        }

        const response = await fetch('/online-users', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch online users');
        }

        const data = await response.json();
        renderOnlineUsers(data);
    } catch (error) {
        console.error('Error fetching online users:', error);
    }
}

// Render Online Users
function renderOnlineUsers(data) {
    const usersList = document.getElementById('users-list');
    if (!usersList) {
        console.error('Users list element not found');
        return;
    }

    // Ensure data is an array
    const users = Array.isArray(data) ? data : [];
    
    usersList.innerHTML = users.map(user => `
        <li class="user-item" data-user-id="${user.ID || user.id}">
            <span class="user-name">${user.Nickname || user.nickname}</span>
            <span class="user-status online"></span>
        </li>
    `).join('');
}

// Open Chat with a User
function openChat(userId) {
    // Fetch and display chat history
    fetchChatHistory(userId);
}

// Fetch Chat History
async function fetchChatHistory(userId) {
    try {
        const response = await fetch(`/messages/${userId}`);
        if (response.ok) {
            const messages = await response.json();
            renderMessages(messages);
        } else {
            console.error('Failed to fetch chat history');
        }
    } catch (error) {
        console.error('Error fetching chat history:', error);
    }
}

// Render Messages
function renderMessages(messages) {
    messagesContainer.innerHTML = ''; // Clear existing messages
    messages.forEach((message) => {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message');
        messageElement.innerHTML = `
            <strong>${message.sender.nickname}</strong>
            <p>${message.content}</p>
            <small>${new Date(message.timestamp).toLocaleString()}</small>
        `;
        messagesContainer.appendChild(messageElement);
    });
}

// Handle Sending Messages
sendMessageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const messageInput = document.getElementById('message-input');
    const message = messageInput.value.trim();
    if (message) {
        sendMessage(message);
        messageInput.value = '';
    }
});

function sendMessage(message) {
    // Send message via WebSocket (implemented in websocket.js)
}

// Initial Fetch of Online Users
fetchOnlineUsers();