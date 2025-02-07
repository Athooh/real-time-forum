import { escapeHTML } from '../utils.js';

export function createLeftSidebar() {
    return `
        <aside class="sidebar left-sidebar">
            ${createUserProfileCard()}
            ${createSidebarNav()}
        </aside>
    `;
}

function createUserProfileCard() {
    const userData = JSON.parse(localStorage.getItem('userData')) || {};
    return `
        <div class="user-profile-card">
            <div class="profile-banner">
                <img src="images/banner.png" alt="Profile Banner">
            </div>
            <div class="profile-info">
                <div class="profile-avatar">
                    <img src="images/avatar.png" alt="Profile Picture">
                </div>
                <h3 class="user-name">${escapeHTML(userData.nickname || 'John Doe')}</h3>
                <p class="user-profession">${escapeHTML(userData.profession || 'Software Engineer')}</p>
                <p class="user-tagline">Building the future, one line of code at a time</p>
                ${createProfileStats()}
            </div>
        </div>
    `;
}

function createProfileStats() {
    return `
        <div class="profile-stats">
                                <div class="stat-item">
                                    <span class="stat-value">1.2k</span>
                                    <span class="stat-label">Followers</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-value">843</span>
                                    <span class="stat-label">Following</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-value">132</span>
                                    <span class="stat-label">Posts</span>
                                </div>
        </div>
    `;
}

function createSidebarNav() {
    return `
       <nav class="sidebar-nav">
                        <a href="#" class="nav-item active">
                            <img src="images/feeds.png" alt="" srcset="">
                            <span>Feed</span>
                        </a>
                        <a href="#" class="nav-item">
                            <img src="images/connections.png" alt="" srcset="">
                            <span>Connections</span>
                        </a>
                        <a href="#" class="nav-item">
                            <img src="images/news.png" alt="" srcset="">
                            <span>Latest News</span>
                        </a>
                        <a href="#" class="nav-item">
                            <img src="images/events.png" alt="" srcset="">
                            <span>Events</span>
                        </a>
                        <a href="#" class="nav-item">
                            <img src="images/group.png" alt="" srcset="">
                            <span>Groups</span>
                        </a>
                        <a href="#" class="nav-item">
                            <img src="images/notification.png" alt="" srcset="">
                            <span>Notifications</span>
                        </a>
                        <a href="#" class="nav-item">
                            <img src="images/settings.png" alt="" srcset="">
                            <span>Settings</span>
                        </a>
                        <a href="#" class="view-profile-link">
                            <img src="images/user.png" alt="" srcset="">
                <span>View Profile</span>
            </a>
        </nav>
    `;
}

export function createRightSidebar() {
    return `
        <aside class="sidebar right-sidebar">
            ${createWhoToFollowSection()}
            ${createOnlineUsersSection()}
            ${createLatestNewsSection()}
        </aside>
    `;
}

function createWhoToFollowSection() {
    return `
        <div class="sidebar-card who-to-follow">
        <div class="who-to-follow-header">
            <img src="images/add-friend.png" alt="follow me">
            <h3>Who to Follow</h3>
        </div>
            <div class="follow-suggestions">
                ${createSuggestionItems()}
            </div>
            <button class="load-more">View More...</button>
        </div>
    `;
}

function createSuggestionItems() {
    // This could be dynamically populated from the server
    return Array(3).fill(null).map(() => `
        <div class="suggestion-item">
            <div class="user-suggestions">
                <img src="images/avatar1.png" alt="User" class="user-avatar">
                <div class="suggestion-info">
                    <h4>Mike Wilson</h4>
                    <p>UI/UX Designer</p>
                </div>
            </div>
            <div class="story-add">
                <i class="fas fa-plus"></i>
            </div>
        </div>
    `).join('');
}

function createOnlineUsersSection() {
    return `
        <div class="sidebar-card online-users">
            <h3><i class="fas fa-circle-dot"></i> Online Users</h3>
            <div id="users-list">
                <!-- Dynamically populated by websocket -->
            </div>
        </div>
    `;
}

function createLatestNewsSection() {
    return `
        <div class="sidebar-card latest-news">
            <div class="who-to-follow-header">
                <img src="images/news.png" alt="Latest News">
                <h3>Latest News</h3>
            </div>
            <div class="news-items">
                <div class="news-item">
                    <div class="news-content">
                        <div class="news">
                            <h4>New Features Released</h4>
                        </div>
                        <span class="news-time">2hr</span>
                    </div>
                     <div class="news-content">
                        <div class="news">
                            <h4>Ten questions you should answer truthfully</h4>
                        </div>
                        <span class="news-time">2hr</span>
                    </div>
                    <div class="news-content">
                        <div class="news">
                            <h4>Five unbelievable facts about money</h4>
                        </div>
                        <span class="news-time">3hr</span>
                    </div>
                    <div class="news-content">
                        <div class="news">
                            <h4>Best Pinterest Boards for learning about business</h4>
                        </div>
                        <span class="news-time">4hr</span>
                    </div>
                    <div class="news-content">
                        <div class="news">
                            <h4>Skills that you can learn from business</h4>
                        </div>
                        <span class="news-time">6hr</span>
                    </div>                    
                </div>
            </div>
        </div>
    `;
}

function setupSidebarEventListeners() {
    // Navigation item clicks
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', handleNavigation);
    });

    // Follow button clicks
    document.querySelectorAll('.story-add').forEach(btn => {
        btn.addEventListener('click', handleFollow);
    });
}

function handleNavigation(e) {
    e.preventDefault();
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => item.classList.remove('active'));
    e.currentTarget.classList.add('active');
    // Handle navigation logic
}

async function handleFollow(e) {
    const suggestionItem = e.currentTarget.closest('.suggestion-item');
    const userName = suggestionItem.querySelector('h4').textContent;
    try {
        await followUser(userName);
        showNotification(`Now following ${userName}`, NotificationType.SUCCESS);
    } catch (error) {
        showNotification('Failed to follow user', NotificationType.ERROR);
    }
}

 