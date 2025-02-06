import { NotificationType, showNotification } from './utils/notifications.js';

export function initializeWebSocket() {
    const token = localStorage.getItem('token');
    const socket = new WebSocket(`ws://localhost:8080/ws?token=${token}`);

    socket.onopen = () => {
        console.log('WebSocket connection established');
    };

    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
    };

    socket.onclose = () => {
        console.log('WebSocket connection closed');
    };

    socket.onerror = (error) => {
        console.error('WebSocket error:', error);
    };

    return socket;
}

// Send a message via WebSocket
function sendMessage(message) {
    if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'message', content: message }));
    } else {
        console.error('WebSocket is not open');
    }
}

export function handleWebSocketMessage(data) {
    switch (data.type) {
        case 'new_post':
            // Handle new post
            break;
        case 'new_comment':
            handleNewComment(data.payload);
            showNotification('New Comment', `${data.payload.user} commented on a post`);
            break;
        case 'new_message':
            // Handle new message
            break;
        default:
            console.log('Unknown message type:', data.type);
    }
}

// Handle new comment from WebSocket
function handleNewComment(comment) {
    const postElement = document.querySelector(`#post-${comment.post_id}`);
    if (postElement) {
        const commentsContainer = postElement.querySelector('.comments');
        const commentElement = document.createElement('div');
        commentElement.className = 'comment';
        commentElement.innerHTML = `
            <strong>${escapeHTML(comment.user)}</strong>
            <p>${escapeHTML(comment.content)}</p>
            <small>${new Date(comment.timestamp).toLocaleString()}</small>
        `;
        commentsContainer.insertBefore(commentElement, commentsContainer.firstChild);
    }
}