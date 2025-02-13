import { NotificationType, showNotification } from '../utils/notifications.js';
import { escapeHTML } from '../utils.js';
import { handleWebsocketUpdatePost } from './websocketUpdates.js';
import { formatNumber, formatTimeAgo } from '../utils.js';

import {formatMessageTime} from '../components/messages/messagesTemplates.js';

let globalSocket = null;

export function initializeWebSocket() {
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    const baseDelay = 1000; // Start with 1 second delay
    let reconnectTimeout;

    function connect() {
        const token = localStorage.getItem('token');
        console.log('Token websocket:', token);
        
        // If there's already an active connection, close it
        if (globalSocket && globalSocket.readyState === WebSocket.OPEN) {
            globalSocket.close();
        }

        const socket = new WebSocket(`ws://localhost:8080/ws?token=${token}`);
        globalSocket = socket; // Store socket in global variable
        
        // Keep connection alive with ping-pong
        const pingInterval = setInterval(() => {
            if (socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({ type: "ping" }));
            }
        }, 30000);

        socket.onopen = () => {
            console.log('WebSocket connection established');
            reconnectAttempts = 0; // Reset reconnect attempts on successful connection
        };

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log('WebSocket message received:', data);
            handleWebSocketMessage(data);
        };

        socket.onclose = (event) => {
            console.log('WebSocket connection closed');
            clearInterval(pingInterval);

            // Don't attempt to reconnect if the closure was clean and intended
            if (event.wasClean) {
                console.log('Clean websocket closure');
                return;
            }

            // Only attempt to reconnect if we haven't exceeded max attempts
            if (reconnectAttempts < maxReconnectAttempts) {
                // Exponential backoff
                const delay = Math.min(baseDelay * Math.pow(2, reconnectAttempts), 30000);
                console.log(`Attempting to reconnect in ${delay}ms... (Attempt ${reconnectAttempts + 1}/${maxReconnectAttempts})`);
                
                clearTimeout(reconnectTimeout);
                reconnectTimeout = setTimeout(() => {
                    reconnectAttempts++;
                    connect();
                }, delay);
            } else {
                console.log('Max reconnection attempts reached');
                // Optionally notify the user that the connection was lost
                showNotification('Connection lost. Please refresh the page.', NotificationType.ERROR);
            }
        };

        socket.onerror = (error) => {
            console.error('WebSocket error:', error);
            clearInterval(pingInterval);
        };

        return socket;
    }

    // Initial connection
    const socket = connect();

    // Add a cleanup function
    const cleanup = () => {
        clearTimeout(reconnectTimeout);
        if (socket.readyState === WebSocket.OPEN) {
            socket.close();
        }
        globalSocket = null;
    };

    // Return both the socket and cleanup function
    return { socket, cleanup };
}

// Add a function to check and reinitialize the connection if needed
export function ensureWebSocketConnection() {
    console.log("Ensuring WebSocket connection");
    if (!globalSocket || globalSocket.readyState !== WebSocket.OPEN) {
        console.log("WebSocket connection not open, initializing...");
        initializeWebSocket();
    }
}

// Send a message via WebSocket
function sendMessage(message) {
    if (globalSocket.readyState === WebSocket.OPEN) {
        globalSocket.send(JSON.stringify({ type: 'message', content: message }));
    } else {
        console.error('WebSocket is not open');
    }
}

export const WebSocketMessageType = {
    NEW_POST: 'new_post',
    USER_ONLINE: 'user_online',
    USER_OFFLINE: 'user_offline',
    USER_FOLLOWED: 'user_followed',
    USER_UNFOLLOWED: 'user_unfollowed',
    NEW_USER: 'new_user',
    POST_COUNT_UPDATE: 'post_count_update',
    NEW_MESSAGE: 'new_message'
};

export function handleWebSocketMessage(data) {
    let payload = data.payload;
    console.log("Payload from type: ", data.type, payload);
    
    // Decode base64 payload if it exists and is for a new post
    if (data.type === WebSocketMessageType.NEW_POST && typeof data.payload === 'string') {
        try {
            const decodedPayload = atob(data.payload);
            payload = JSON.parse(decodedPayload);
        } catch (e) {
            console.error('Error decoding payload:', e);
            return;
        }
    }

    switch (data.type) {
        case WebSocketMessageType.NEW_POST:
            handleWebsocketUpdatePost(payload);
            break;
        case WebSocketMessageType.NEW_MESSAGE:
            console.log("New message received");
            handleWebsocketNewMessage(payload);
            break;
        case WebSocketMessageType.POST_COUNT_UPDATE:
            updatePostCount(payload);
            break;
        case WebSocketMessageType.USER_ONLINE:
        case WebSocketMessageType.USER_OFFLINE:
            updateUserOnlineStatus(payload);
            break;
        case WebSocketMessageType.USER_FOLLOWED:
        case WebSocketMessageType.USER_UNFOLLOWED:
            updateFollowStats(payload);
            break;
        case WebSocketMessageType.NEW_USER:
            updateSuggestionsList(payload);
            break;
        default:
            console.log('Unknown message type:', data.type);
    }
}

function updateUserOnlineStatus(data) {
    const { userId, isOnline } = data;
    // Update status indicators across the app
    document.querySelectorAll(`[data-user-id="${userId}"] .status-indicator`).forEach(indicator => {
        indicator.className = `status-indicator ${isOnline ? 'online' : 'offline'}`;
    });

    // Update chat header status if present
    const chatHeader = document.querySelector(`.user-info[data-user-id="${userId}"] [data-status-indicator]`);
    if (chatHeader) {
        chatHeader.className = `status ${isOnline ? 'online' : 'offline'}`;
        chatHeader.textContent = isOnline ? 'Online' : 'Offline';
    }
}

function updateFollowStats(data) {
    const { followerId, followingId, followersCount, followingCount } = data;
    const currentUserId = JSON.parse(localStorage.getItem('userData')).id;

    console.log('Updating follow stats:', {
        followerId,
        followingId,
        followersCount,
        followingCount,
        currentUserId
    });

    const profileStats = document.querySelector('.profile-stats');
    if (!profileStats) return;

    const statItems = profileStats.querySelectorAll('.stat-item');
    
    // If we're looking at the profile of the user being followed
    if (followingId === currentUserId) {
        // Update only followers count
        const followersItem = statItems[0];
        if (followersItem) {
            followersItem.querySelector('.stat-value').textContent = formatNumber(followersCount);
        }
    }
    
    // If we're looking at the profile of the user who is following
    if (followerId === currentUserId) {
        // Update only following count
        const followingItem = statItems[1];
        if (followingItem) {
            followingItem.querySelector('.stat-value').textContent = formatNumber(followingCount);
        }
    }
}

function updateSuggestionsList(newUser) {
    const suggestionsContainer = document.querySelector('.follow-suggestions');
    if (!suggestionsContainer) return;

    const suggestionHTML = `
        <div class="suggestion-item" data-user-id="${newUser.id}">
            <div class="user-suggestions">
                <div class="avatar-wrapper">
                    <img src="${newUser.avatar || 'images/avatar1.png'}" alt="${newUser.nickname}" class="user-avatar">
                    <span class="status-indicator offline"></span>
                </div>
                <div class="suggestion-info">
                    <h4>${escapeHTML(newUser.nickname)}</h4>
                    <p>${escapeHTML(newUser.profession || 'Member')}</p>
                </div>
            </div>
            <button class="story-add" title="Follow user">
                <i class="fas fa-plus"></i>
            </button>
        </div>
    `;

    suggestionsContainer.insertAdjacentHTML('afterbegin', suggestionHTML);
    setupFollowEventListeners();
}

function updatePostCount(payload) {
    const postCountElement = document.querySelector('.profile-stats .stat-item:nth-child(3) .stat-value');
    if (postCountElement) {
        postCountElement.textContent = formatNumber(payload.postCount);
    }
}

function handleWebsocketNewMessage(payload) {
    const { sender_id, content, timestamp } = payload;

    console.log("New message: ", payload);
    
    // Find the active chat window if it exists
    const chatMessages = document.getElementById('chat-messages');
    if (chatMessages && chatMessages.dataset.userId === sender_id.toString()) {
        // Add the new message to the chat
        const newMessageHTML = `
            <div class="chat-message received">
                <div class="message-avatar">
                    <img src="${payload.user.avatar || 'images/avatar.png'}" alt="${payload.user.nickname}">
                </div>
                <div class="message-bubble">
                    <div class="message-content">
                        <p>${escapeHTML(content)}</p>
                        <span class="message-time">${formatTimeAgo(timestamp || new Date())}</span>
                    </div>
                </div>
            </div>
        `;
        chatMessages.insertAdjacentHTML('beforeend', newMessageHTML);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Update the messages list if it exists
    const messagesList = document.getElementById('messages-list');
    if (messagesList) {
        const existingThread = messagesList.querySelector(`[data-user-id="${sender_id}"]`);
        if (existingThread) {
            // Update existing thread with new message preview
            const previewElement = existingThread.querySelector('.message-preview');
            const timeElement = existingThread.querySelector('.message-time');
            if (previewElement && timeElement) {
                previewElement.textContent = content;
                timeElement.textContent = formatTimeAgo(timestamp || new Date());
            }
            // Move thread to top
            messagesList.insertBefore(existingThread, messagesList.firstChild);
        } else {
            // Create new thread
            const newThreadHTML = `
                <div class="message-item" data-user-id="${sender_id}">
                    <div class="user-avatar-wrapper">
                        <img src="${payload.user.avatar || 'images/avatar.png'}" alt="${payload.user.nickname}" class="user-avatar">
                        <span class="status-indicator ${payload.user.isOnline ? 'online' : 'offline'}"></span>
                    </div>
                    <div class="message-content">
                        <div class="message-header">
                            <h4>${escapeHTML(payload.user.nickname)}</h4>
                            <span class="message-time">${formatTimeAgo(timestamp || new Date())}</span>
                        </div>
                        <p class="message-preview">${escapeHTML(content)}</p>
                    </div>
                </div>
            `;
            messagesList.insertAdjacentHTML('afterbegin', newThreadHTML);
        }
    }
}
