import { escapeHTML, formatTimeAgo } from '../utils.js';
import { showNotification, NotificationType } from '../utils/notifications.js';
import Router from '../router/router.js';
import { authenticatedFetch } from '../security.js';

export function createHeader() {
    console.log("Creating header");
    return `
        <header class="header-container">
            <div class="main-header">
                ${createHeaderLeft()}
                ${createHeaderRight()}
            </div>
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
            ${createHeaderActions()}
        </div>
    `;
}


function createHeaderActions() {
    return `
        <div class="header-actions">
            ${createHomeButton()}
            ${createProfileButton()}
            ${createMessageButton()}
            ${createNotificationMenu()}
            ${createProfileMenu()}
        </div>
    `;
}

function createHomeButton() {
    return `
        <button class="icon-btn" title="Home" id="home-btn" data-route="/">
            <i class="fas fa-home"></i>
        </button>
    `;
}

function createMessageButton() {
    return `
        <button class="icon-btn" title="Messages" id="messages-btn" data-route="/messagesPage">
            <i class="fas fa-envelope"></i>
            <span class="badge">3</span>
        </button>
    `;
}

function createProfileButton() {
    return `
        <button class="icon-btn" title="Profile" id="profile-btn" data-route="/profilePage">
            <i class="fas fa-user"></i>
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


function createProfileMenu() {
    return `
        <div class="profile-menu">
            <img src="images/avatar.png" alt="Profile" class="avatar">
            <div class="dropdown-menu">
                <a href="#profile"><i class="fas fa-user"></i> Profile</a>
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
        // Set the intentional logout flag before closing connection
        let { isIntentionalLogout, globalSocket } = await import('../websocket/websocket.js');
        isIntentionalLogout = true;
        // Close WebSocket connection if it exists
        if (globalSocket && globalSocket.readyState === WebSocket.OPEN) {
            globalSocket.close();
        }


        // Try to notify the server, but don't wait for it
        try {
            await authenticatedFetch('/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
        } catch (serverError) {
            console.error('Failed to logout from server:', serverError);
            showNotification('Failed to logout from server', NotificationType.ERROR);
            return;
        }

        // Hide forum section
        const forumSection = document.getElementById('forum-section');
        if (forumSection) {
            forumSection.style.display = 'none';
        }

        // Remove messenger container
        const messengerContainer = document.getElementById('messenger-container');
        if (messengerContainer) {
            messengerContainer.remove();
        }

        // Remove token and user data from local storage first
        localStorage.removeItem('token');
        localStorage.removeItem('userData');

        // Get router instance and navigate
        const router = new Router();
        router.navigate('/loginPage');

        showNotification('Logged out successfully', NotificationType.SUCCESS);
    } catch (error) {
        console.error('Error during logout:', error);
        showNotification('An error occurred during logout. Please try again.', NotificationType.ERROR);
    }
}

export function setupHeaderEventListeners() {
    const router = new Router();

    // Add click handlers for navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const route = e.target.dataset.route;
            router.navigate(route);
        });
    });
    
    // Home button click handler
    const homeBtn = document.getElementById('home-btn');
    if (homeBtn) {
        homeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            router.navigate('/');
        });
    }

    // Profile button click handler
    const profileBtn = document.getElementById('profile-btn');
    if (profileBtn) {
        profileBtn.addEventListener('click', (e) => {
            e.preventDefault();
            router.navigate('/profilePage');
        });
    }

    // Add messages button click handler
    const messagesBtn = document.getElementById('messages-btn');
    if (messagesBtn) {
        messagesBtn.addEventListener('click', (e) => {
            e.preventDefault();
            router.navigate('/messagesPage');
        });
    }

    // Search functionality
    const searchBtn = document.querySelector('.search-btn');
    if (searchBtn) {
        searchBtn.addEventListener('click', handleSearch);
    }

 
    // Logout functionality - Use event delegation for dynamically added elements
    document.addEventListener('click', (e) => {
        if (e.target.closest('#logout')) {
            e.preventDefault();
            handleLogout();
        }
    });

    // Notification clear functionality
    const clearAllBtn = document.querySelector('.clear-all');
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', clearAllNotifications);
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



