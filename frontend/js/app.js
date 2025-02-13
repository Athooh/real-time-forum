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
import { createProfilePage, createProfileContent } from './components/profile/profileTemplate.js';
import { 
    setupDropZone, 
    setupVideoDropZone 
} from './components/posts/postsEvent.js';

class App {
    constructor() {
        this.root = document.getElementById('root');
        this.state = window.forumState;
        
        // Initialize router with routes
        this.router = new Router({
            '/': () => this.renderHome(),
            '/loginPage': () => this.renderAuth(),
            '/messagesPage': () => this.renderMessages(),
            '/profilePage': () => this.renderProfile(),
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

    renderProfile() {
        const token = localStorage.getItem('token');
        if (!token) {
            this.router.navigate('/loginPage');
            return;
        }

        this.root.innerHTML = `
            <div id="app">
                ${createHeader()}
                <div class="main-container">
                    <div class="profile-container">
                        ${createProfilePage()}
                        ${createProfileContent()}
                    </div>
                </div>
            </div>
        `;

        // Add event listeners for profile navigation
        this.setupProfileEventListeners();
    }

    setupProfileEventListeners() {
        const navLinks = document.querySelectorAll('.profile-nav-link');
        const sections = document.querySelectorAll('.profile-section');
        
        // Get the initial active section and show it
        const initialActiveSection = document.querySelector('.profile-nav-link.active');
        if (initialActiveSection) {
            const sectionId = `${initialActiveSection.dataset.section}-section`;
            const targetSection = document.getElementById(sectionId);
            if (targetSection) {
                sections.forEach(s => s.style.display = 'none');
                targetSection.style.display = 'block';
                
                if (initialActiveSection.dataset.section === 'posts') {
                    this.loadUserPosts();
                    setupPostEventListeners();
                    setupDropZone();
                    setupVideoDropZone();
                }
            }
        }

        // Setup click handlers for nav links
        navLinks.forEach(link => {
            link.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation(); // Stop event bubbling
                
                const sectionId = `${link.dataset.section}-section`;
                const targetSection = document.getElementById(sectionId);
                
                if (targetSection) {
                    // Update active states
                    navLinks.forEach(l => l.classList.remove('active'));
                    sections.forEach(s => s.style.display = 'none');
                    
                    link.classList.add('active');
                    targetSection.style.display = 'block';

                    // Handle specific section actions
                    if (link.dataset.section === 'posts') {
                        await this.loadUserPosts();
                        setupPostEventListeners();
                        setupDropZone();
                        setupVideoDropZone();
                    } else if (link.dataset.section === 'connections') {
                        this.loadConnections('followers');
                    }
                }
            });
        });

        // Add delete account event listeners
        const deleteConfirmCheckbox = document.getElementById('delete-confirm');
        const deleteAccountBtn = document.querySelector('.delete-account-btn');
        const cancelDeleteBtn = document.querySelector('.cancel-delete-btn');

        if (deleteConfirmCheckbox && deleteAccountBtn) {
            deleteConfirmCheckbox.addEventListener('change', (e) => {
                deleteAccountBtn.disabled = !e.target.checked;
            });
        }

        if (cancelDeleteBtn) {
            cancelDeleteBtn.addEventListener('click', () => {
                // Navigate back to profile or previous section
                const profileNav = document.querySelector('[data-section="posts"]');
                if (profileNav) {
                    profileNav.click();
                }
            });
        }

        if (deleteAccountBtn) {
            deleteAccountBtn.addEventListener('click', async () => {
                if (confirm('Are you absolutely sure you want to delete your account? This cannot be undone.')) {
                    try {
                        const response = await fetch('/api/v1/users/delete', {
                            method: 'DELETE',
                            headers: {
                                'Authorization': `Bearer ${localStorage.getItem('token')}`
                            }
                        });

                        if (response.ok) {
                            localStorage.clear();
                            window.location.href = '/';
                        } else {
                            throw new Error('Failed to delete account');
                        }
                    } catch (error) {
                        console.error('Error deleting account:', error);
                        showNotification('Failed to delete account. Please try again.', 'error');
                    }
                }
            });
        }
    }

    async loadUserPosts() {
        try {
            const postsContainer = document.getElementById('posts-container');
            if (!postsContainer) return;

            const response = await fetch('/api/posts', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const posts = data.posts || [];

            if (posts.length > 0) {
                const { renderPosts } = await import('./components/posts/posts.js');
                await renderPosts(posts, postsContainer);
            } else {
                postsContainer.innerHTML = `
                    <div class="no-posts-message">
                        <div class="empty-state">
                            <i class="fas fa-newspaper fa-3x"></i>
                            <h3>No Posts Yet</h3>
                            <p>Be the first to share something with the community!</p>
                            <button class="create-post-btn primary-btn">
                                <i class="fas fa-plus"></i> Create Post
                            </button>
                        </div>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Failed to fetch posts:', error);
            const postsContainer = document.getElementById('posts-container');
            if (postsContainer) {
                postsContainer.innerHTML = `
                    <div class="error-message">
                        <div class="error-state">
                            <i class="fas fa-exclamation-circle fa-3x"></i>
                            <h3>Oops! Something went wrong</h3>
                            <p>We couldn't load the posts. Please try again later.</p>
                            <button class="retry-btn" onclick="window.location.reload()">
                                <i class="fas fa-redo"></i> Retry
                            </button>
                        </div>
                    </div>
                `;
            }
        }
    }

    async loadConnections(type = 'followers') {
        try {
            const userData = JSON.parse(localStorage.getItem('userData'));
            if (!userData || !userData.id) {
                console.error('User data not found');
                return;
            }

            const response = await fetch(`/api/v1/users/${userData.id}/connections/${type}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const connections = await response.json();
            const connectionsList = document.getElementById('connections-list');
            
            if (connections && connections.length > 0) {
                const connectionsHTML = connections.map(user => `
                    <div class="connection-item">
                        <div class="connection-user-info">
                            <img src="${user.avatar || 'images/avatar.png'}" alt="${escapeHTML(user.nickname)}" class="connection-avatar">
                            <div class="connection-details">
                                <h4>${escapeHTML(user.nickname)}</h4>
                                <p>${escapeHTML(user.profession || 'No profession listed')}</p>
                            </div>
                        </div>
                        <button class="connection-action-btn" data-user-id="${user.id}">
                            ${type === 'followers' ? 'Follow Back' : 'Unfollow'}
                        </button>
                    </div>
                `).join('');
                
                connectionsList.innerHTML = connectionsHTML;
            } else {
                connectionsList.innerHTML = `
                    <div class="no-connections">
                        <p>No ${type} yet</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error(`Failed to fetch ${type}:`, error);
            document.getElementById('connections-list').innerHTML = `
                <div class="error-message">
                    <p>Failed to load connections. Please try again later.</p>
                </div>
            `;
        }
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

