import { fetchPosts } from './components/posts.js';
import { fetchOnlineUsers, initializeMessages } from './components/messages.js';
import { initializeWebSocket } from './websocket.js';
import { NotificationType, showNotification } from './utils/notifications.js';
import { authenticatedFetch } from './utils/fetch.js';

import { createAuthSection, setupAuthEventListeners } from './components/auth.js';
import { setupNotificationEventListeners } from './components/notifications.js';
import { createHeader, setupHeaderEventListeners } from './components/header.js';
import { createLeftSidebar, createRightSidebar } from './components/sidebar.js';
import { createMainContent, setupPostEventListeners } from './components/posts.js';

class App {
    constructor() {
        this.root = document.getElementById('root');
        this.state = window.forumState;
        this.init();
    }

    init() {
        // Initialize the app
        this.render();
        this.checkAuthState();
    }

    render() {
        this.root.innerHTML = `
            <div id="app">
                ${this.renderAuthSection()}
                ${this.renderForumSection()}
            </div>
        `;
        this.attachEventListeners();
    }

    renderAuthSection() {
        return createAuthSection();
    }

    renderForumSection() {
        return `
            <div id="forum-section" style="display: none;">
                ${createHeader()}
                <div class="dashboard-container">
                    ${createLeftSidebar()}
                    ${createMainContent()}
                    ${createRightSidebar()}
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        // Attach all necessary event listeners
        setupAuthEventListeners();
        setupHeaderEventListeners();
        setupPostEventListeners();
        setupNotificationEventListeners();
    }

    checkAuthState() {
        const token = localStorage.getItem('token');
        if (token) {
            this.validateAndInitialize(token);
        }
    }

    async validateAndInitialize(token) {
        try {
            const response = await authenticatedFetch('/validate-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token }),
            });

            if (response.ok) {
                const data = await response.json();
                if (data.valid) {
                    this.showForumSection();
                    await this.initializeForumFeatures();
                }
            } else {
                this.showAuthSection();
            }
        } catch (error) {
            console.error('Token validation error:', error);
            this.showAuthSection();
        }
    }

    showForumSection() {
        document.getElementById('auth-section').style.display = 'none';
        document.getElementById('forum-section').style.display = 'block';
        
        // Initialize messages after the forum section is visible
        const messagesContainer = document.querySelector('.messages-container');
        if (messagesContainer) {
            initializeMessages(messagesContainer);
        }
    }

    showAuthSection() {
        document.getElementById('auth-section').style.display = 'flex';
        document.getElementById('forum-section').style.display = 'none';
    }

    async initializeForumFeatures() {
        try {
            await Promise.all([
                // fetchPosts(),
                // fetchOnlineUsers()
            ]);
            initializeWebSocket();
        } catch (error) {
            console.error('Error initializing forum:', error);
            showNotification('Error loading forum data', NotificationType.ERROR);
        }
    }
}

// Initialize the app when the DOM is loaded
let appInstance;

document.addEventListener('DOMContentLoaded', () => {
    appInstance = new App();
});

export { appInstance as app };

// Make sure fetchPosts is available globally
if (typeof window.fetchPosts === 'undefined') {
    window.fetchPosts = async function(page = 1, append = false) {
        try {
            const response = await authenticatedFetch(`/posts?page=${page}`);
            if (response.ok) {
                const data = await response.json();
                renderPosts(data.posts, append);
            } else {
                throw new Error('Failed to fetch posts');
            }
        } catch (error) {
            console.error('Error fetching posts:', error);
            showNotification('Failed to load posts', NotificationType.ERROR);
        }
    };
} 