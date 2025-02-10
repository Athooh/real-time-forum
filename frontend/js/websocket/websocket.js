import { NotificationType, showNotification } from '../utils/notifications.js';
import { escapeHTML } from '../utils.js';
import { handleWebsocketUpdatePost } from './websocketUpdates.js';

export function initializeWebSocket() {
    const token = localStorage.getItem('token');
    const socket = new WebSocket(`ws://localhost:8080/ws?token=${token}`);

    socket.onopen = () => {
        console.log('WebSocket connection established');
    };

    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);

        console.log('WebSocket message received:', data);
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
            try {
                // Decode the base64 payload
                const decodedPayload = atob(data.payload);
                
         
                const post = JSON.parse(decodedPayload);
               
                // Handle the new post
                handleWebsocketUpdatePost(post);
                showNotification(`New Post Created by ${post.user.nickname}`);
            } catch (error) {
                console.error('Error processing new_post payload:', error);
            }
            break;
        case 'new_comment':
            // Handle new comment logic here
            break;
        case 'new_message':
            // Handle new message logic here
            break;
        default:
            console.log('Unknown message type:', data.type);
    }
}
