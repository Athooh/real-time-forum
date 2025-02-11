import { escapeHTML, formatTimeAgo } from '../utils.js';
import { showNotification, NotificationType } from '../utils/notifications.js';
import Router from '../router/router.js';

export function createHeader() {
    console.log("Creating header");
    return `
        <header class="main-header">
            ${createHeaderLeft()}
            ${createHeaderRight()}
        </header>
    `;
}

function createHeaderLeft() {
    return `
        <div class="header-left">
            <div class="logo">
                <img src="images/forum.png" alt="Forum Logo">
            </div>
            <h1>Forum</h1>
            ${createSearchBar()}
        </div>
    `;
}

function createSearchBar() {
    return `
        <div class="search-container">
            <input type="text" placeholder="Search...">
            <button class="search-btn">
                <i class="fas fa-search"></i>
            </button>
        </div>
    `;
}

function createHeaderRight() {
    return `
        <div class="header-right">
            ${createHeaderNav()}
            ${createHeaderActions()}
        </div>
    `;
}

function createHeaderNav() {
    return `
        <nav class="header-nav">
            <ul class="nav-links">
                <li><a href="/" class="nav-link" data-route="/">Home</a></li>
                <li><a href="/profile" class="nav-link" data-route="/profile">Profile</a></li>
            </ul>
        </nav>
    `;
}

function createHeaderActions() {
    return `
        <div class="header-actions">
            ${createMessageButton()}
            ${createNotificationMenu()}
            ${createSettingsButton()}
            ${createProfileMenu()}
        </div>
    `;
}

function createMessageButton() {
    return `
        <button class="icon-btn" title="Messages" id="messages-btn" data-route="/messages">
            <i class="fas fa-envelope"></i>
            <span class="badge">3</span>
        </button>
    `;
}

function createNotificationMenu() {
    return `
        <div class="notification-menu">
            <button class="icon-btn" title="Notifications">
                <i class="fas fa-bell"></i>
                <span class="badge">5</span>
            </button>
            ${createNotificationDropdown()}
        </div>
    `;
}
function createNotificationDropdown() {
    return `
        <div class="dropdown-menu">
            <div class="notification-header">
                <p class="h3">Notifications <span>2 New</span></p>
                <p class="clear-all">Clear all</p>
            </div>
            <div class="notifications-list">
                <div class="notification">
                    <img src="images/avatar.png" alt="User Avatar">
                    <div class="notification-content">
                        <p><span><strong>John Doe</strong></span> liked your post</p>
                        <span class="time">2 mins</span>
                    </div>
                </div>
                <div class="notification unread">
                    <img src="images/avatar.png" alt="User Avatar">
                    <div class="notification-content">
                        <p><span><strong>Jane Smith</strong></span> commented on your post</p>
                        <span class="time">5 mins</span>
                    </div>
                </div>
                <!-- More notifications -->
            </div>
            <div class="notification-footer">
                <a href="#">View all notifications</a>
            </div>
        </div>
    `;
}

function createSettingsButton() {
    return `
        <button class="icon-btn" title="Settings">
            <i class="fas fa-cog"></i>
        </button>
    `;
}

function createProfileMenu() {
    return `
        <div class="profile-menu">
            <img src="images/avatar.png" alt="Profile" class="avatar">
            <div class="dropdown-menu">
                <a href="#"><i class="fas fa-user"></i> Profile</a>
                <a href="#"><i class="fas fa-cog"></i> Settings</a>
                <button id="logout" class="dropdown-btn">
                    <i class="fas fa-sign-out-alt"></i> Logout
                </button>
            </div>
        </div>
    `;
}

async function handleLogout() {
    try {
        // Prevent multiple logouts
        const logoutBtn = document.getElementById('logout');
        if (logoutBtn) {
            logoutBtn.disabled = true;
        }

        // Remove token and user data from local storage first
        localStorage.clear(); // Clear all storage

        // Clean up WebSocket connection
        if (window.webSocket) {
            window.webSocket.close();
        }

        // Clean up UI elements
        const forumSection = document.getElementById('forum-section');
        if (forumSection) {
            forumSection.style.display = 'none';
        }

        const messengerContainer = document.getElementById('messenger-container');
        if (messengerContainer) {
            messengerContainer.remove();
        }

        // Navigate only once
        const router = new Router();
        router.navigate('/loginPage');

        showNotification('Logged out successfully', NotificationType.SUCCESS);

        // Optional: Try to notify the server
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        } catch (serverError) {
            console.warn('Server logout notification failed:', serverError);
        }

    } catch (error) {
        console.error('Error during logout:', error);
        showNotification('An error occurred during logout', NotificationType.ERROR);
    }
}

export function setupHeaderEventListeners() {
    // Remove existing event listeners first
    const existingLogoutBtn = document.getElementById('logout');
    if (existingLogoutBtn) {
        existingLogoutBtn.removeEventListener('click', handleLogout);
    }

    // Add new event listener
    const logoutBtn = document.getElementById('logout');
    if (logoutBtn) {
        console.log('Logout button found');
        logoutBtn.addEventListener('click', handleLogout, { once: true }); // Use once: true
    }

    // Add click handlers for navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const route = e.target.dataset.route;
            const router = new Router();  // Create new router instance
            router.navigate(route);
        });
    });
    
    // Search functionality
    const searchBtn = document.querySelector('.search-btn');
    if (searchBtn) {
        searchBtn.addEventListener('click', handleSearch);
    }

    // Notification clear functionality
    const clearAllBtn = document.querySelector('.clear-all');
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', clearAllNotifications);
    }

    // Add messages button click handler
    const messagesBtn = document.getElementById('messages-btn');
    if (messagesBtn) {
        messagesBtn.addEventListener('click', () => {
            const router = new Router();
            router.navigate('/messages');
        });
    }
}

async function handleSearch(e) {
    const searchInput = document.querySelector('.search-container input');
    const searchTerm = searchInput.value.trim();
    if (searchTerm) {
        // Implement search functionality
        try {
            const results = await performSearch(searchTerm);
            updateSearchResults(results);
        } catch (error) {
            showNotification('Search failed', NotificationType.ERROR);
        }
    }
}

function clearAllNotifications() {
    // Implement clear notifications functionality
    const notificationsList = document.querySelector('.notifications-list');
    if (notificationsList) {
        notificationsList.innerHTML = '';
        updateNotificationBadge(0);
    }
}
function createNotificationsList() {
    return `
        <div class="notifications-list">
            ${createNotificationItem({
                id: 1,
                type: 'like',
                message: 'liked your post',
                actor: { nickname: 'John Doe' },
                timestamp: new Date(),
                read: false
            })}
            ${createNotificationItem({
                id: 2,
                type: 'comment',
                message: 'commented on your post',
                actor: { nickname: 'Jane Smith' },
                timestamp: new Date(),
                read: false
            })}
        </div>
    `;
}

function createNotificationItem(notification) {
    return `
        <div class="notification-item ${notification.read ? '' : 'unread'}" 
             data-notification-id="${notification.id}">
            <div class="notification-icon">
                ${getNotificationTypeIcon(notification.type)}
            </div>
            <div class="notification-content">
                <p><strong>${escapeHTML(notification.actor.nickname)}</strong> ${escapeHTML(notification.message)}</p>
                <span class="notification-time">${formatTimeAgo(notification.timestamp)}</span>
            </div>
            <button class="notification-close" aria-label="Dismiss notification">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
}

function getNotificationTypeIcon(type) {
    const icons = {
        like: '<i class="fas fa-heart"></i>',
        comment: '<i class="fas fa-comment"></i>',
        follow: '<i class="fas fa-user-plus"></i>',
        mention: '<i class="fas fa-at"></i>',
        default: '<i class="fas fa-bell"></i>'
    };
    return icons[type] || icons.default;
}



