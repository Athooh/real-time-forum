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

export async function fetchMessages() {
    try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        return dummyMessages;
    } catch (error) {
        console.error('Error fetching messages:', error);
        throw error;
    }
}

export async function searchMessages(query) {
    try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Filter messages based on search query
        return dummyMessages.filter(msg => 
            msg.user.nickname.toLowerCase().includes(query.toLowerCase()) ||
            msg.content.toLowerCase().includes(query.toLowerCase())
        );
    } catch (error) {
        console.error('Error searching messages:', error);
        throw error;
    }
} 