import { initializeMessages, fetchOnlineUsers } from './components/messages/messages.js';
import { initializeWebSocket } from './websocket/websocket.js';
import { NotificationType, showNotification } from './utils/notifications.js';
import { authenticatedFetch } from './security.js';

import { createAuthSection, setupAuthEventListeners } from './components/auth.js';
import { setupNotificationEventListeners } from './components/notifications.js';
import { createHeader, setupHeaderEventListeners } from './components/header.js';
import { createLeftSidebar, createRightSidebar } from './components/sidebar.js';
import { createMainContent, setupPostEventListeners } from './components/posts/posts.js';
import { fetchPosts } from './components/posts/postsApi.js';
import Router from './router/router.js';

class App {
    constructor() {
        this.root = document.getElementById('root');
        this.state = window.forumState;
        
        // Initialize router with routes
        this.router = new Router({
            '/': () => this.renderHome(),
            '/loginPage': () => this.renderAuth(),
            '/messages': () => this.renderMessages(),
            '*': () => this.render404()
        });

        this.init();
    }

    init() {
        const token = localStorage.getItem('token');
        if (!token) {
            this.router.navigate('/loginPage');
            return;
        }
        
        this.router.handleRoute(window.location.pathname);
    }

    renderHome() {
        console.log('Rendering home section');
        const token = localStorage.getItem('token');
        if (!token) {
            console.log('No token found, navigating to login');
            this.router.navigate('/loginPage');
            return;
        }

        console.log("Token found, rendering forum section");
        this.root.innerHTML = `
            <div id="app">
                ${this.renderForumSection()}
            </div>
        `;
        this.attachEventListeners();
        this.initializeForumFeatures();
    }

    renderAuth(type = 'login') {
        console.log('Rendering auth section');
        this.root.innerHTML = `
            <div id="app">
                ${createAuthSection(type)}
            </div>
        `;
        // Show auth section explicitly
        const authSection = document.getElementById('auth-section');
        if (authSection) {
            authSection.style.display = 'flex';
        }
        console.log('Auth section rendered');
        setupAuthEventListeners();
    }

    render404() {
        this.root.innerHTML = `
            <div class="error-page">
                <h1>404 - Page Not Found</h1>
                <a href="/" class="back-home">Back to Home</a>
            </div>
        `;
    }

    renderForumSection() {
        console.log("Rendering forum section");
        return `
            <div id="forum-section">
                ${createHeader()}
                <div class="dashboard-container">
                    ${createLeftSidebar()}
                    ${createMainContent()}
                    ${createRightSidebar()}
                </div>
            </div>
        `;
    }

    renderMessages() {
        const token = localStorage.getItem('token');
        if (!token) {
            console.log('No token found, navigating to login');
            this.router.navigate('/loginPage');
            return;
        }

        // Create container with header and messages section
        this.root.innerHTML = `
            <div id="app">
                ${createHeader()}
                <div class="messages-container">
                    <div id="messages-content"></div>
                </div>
            </div>
        `;

        // Initialize messages component
        const messagesContent = document.getElementById('messages-content');
        if (messagesContent) {
            initializeMessages(messagesContent);
        }

        // Setup header event listeners
        setupHeaderEventListeners();
    }

    attachEventListeners() {
        // Attach all necessary event listeners
        setupAuthEventListeners();
        setupHeaderEventListeners();
        setupPostEventListeners();
        setupNotificationEventListeners();
    }

    async initializeForumFeatures() {
        try {
            await Promise.all([
                fetchPosts(),
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

