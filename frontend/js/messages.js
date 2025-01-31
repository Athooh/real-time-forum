// DOM Elements
const usersList = document.getElementById('users-list');
const messagesContainer = document.getElementById('messages-container');
const sendMessageForm = document.getElementById('send-message');

// Fetch Online Users
async function fetchOnlineUsers() {
    try {
        const response = await fetch('/online-users');
        if (response.ok) {
            const users = await response.json();
            renderOnlineUsers(users);
        } else {
            console.error('Failed to fetch online users');
        }
    } catch (error) {
        console.error('Error fetching online users:', error);
    }
}

// Render Online Users
function renderOnlineUsers(users) {
    usersList.innerHTML = ''; // Clear existing users
    users.forEach((user) => {
        const userElement = document.createElement('li');
        userElement.textContent = user.nickname;
        userElement.addEventListener('click', () => openChat(user.id));
        usersList.appendChild(userElement);
    });
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