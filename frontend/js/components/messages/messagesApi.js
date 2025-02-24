import { BASE_URL } from '../../state.js';
import { authenticatedFetch } from '../../security.js';

// Export the dummy messages so they can be used in other files
export const dummyMessages = [
    {
        id: 1,
        user: {
            id: 101,
            nickname: "Sarah Wilson",
            avatar: "images/avatar1.png",
            isOnline: true
        },
        content: "Hey! Are we still meeting for coffee tomorrow morning?",
        timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        unread: true
    },
    {
        id: 2,
        user: {
            id: 102,
            nickname: "John Smith",
            avatar: "images/avatar2.png",
            isOnline: true
        },
        content: "I've just reviewed the project proposal. Let's discuss the changes...",
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        unread: true
    },
    {
        id: 3,
        user: {
            id: 103,
            nickname: "Emma Davis",
            avatar: "images/avatar3.png",
            isOnline: false
        },
        content: "Thanks for your help with the presentation yesterday!",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        unread: false
    }
];

export async function fetchMessages(page = 1, limit = 10) {
    try {
        const response = await authenticatedFetch(`${BASE_URL}/messages?page=${page}&limit=${limit}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch messages');
        }

        const messages = await response.json();
        return messages;

    } catch (error) {
        console.error('Error fetching messages:', error);
        throw error;
    }
}

export async function searchMessages(query) {
    try {
        const response = await authenticatedFetch(`${BASE_URL}/messages/search?query=${encodeURIComponent(query)}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to search messages');
        }

        const messages = await response.json();
        return messages;

    } catch (error) {
        console.error('Error searching messages:', error);
        throw error;
    }
}

export async function sendMessage(recipientId, content) {
    try {
        const response = await authenticatedFetch(`${BASE_URL}/messages/send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                recipient_id: recipientId,
                content: content
            })
        });

        if (!response.ok) {
            throw new Error('Failed to send message');
        }

        const result = await response.json();
        return result;

    } catch (error) {
        console.error('Error sending message:', error);
        throw error;
    }
}

export async function markMessageAsRead(messageId) {
    try {
        const response = await authenticatedFetch(`${BASE_URL}/messages/mark-as-read?msgID=${messageId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to mark message as read');
        }

        return await response.json();

    } catch (error) {
        console.error('Error marking message as read:', error);
        throw error;
    }
}

export async function fetchConversation(userId, page = 1, limit = 20) {
    try {
        const response = await authenticatedFetch(`${BASE_URL}/messages/conversation?recipient_id=${userId}&page=${page}&limit=${limit}&order=desc`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch conversation');
        }

        return await response.json();

    } catch (error) {
        console.error('Error fetching conversation:', error);
        throw error;
    }
} 