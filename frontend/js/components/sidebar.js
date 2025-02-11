import { authenticatedFetch } from '../security.js';
import { escapeHTML } from '../utils.js';
import { createLoader } from './loader.js';
import { showNotification , NotificationType} from '../utils/notifications.js';
import { throttle, formatNumber } from '../utils.js';


// Add these variables at the top of the file
let currentPage = 1;
let isLoadingUsers = false;
let allUsersLoaded = false;

export function createLeftSidebar() {
    // Check for authentication
    

    const sidebarHTML = `
        <aside class="sidebar sidebar-left">
            ${createUserProfileCard()}
            ${createSidebarNav()}
        </aside>
    `;
    
    // After the sidebar is created, fetch the stats
    setTimeout(() => {
        createProfileStats();
    }, 0);
    
    return sidebarHTML;
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
                <div id="profile-stats-container">
                    ${createLoader()}
                </div>
            </div>
        </div>
    `;
}

async function createProfileStats() {
    if (!localStorage.getItem('token')) {
        return;
    }

    let stats = {
        followers: '0',
        following: '0',
        posts: '0'
    };

    try {
        const response = await authenticatedFetch(`/api/users/stats`);
        
        if (response.ok) {
            const rawText = await response.text();
            const apiStats = JSON.parse(rawText);
            
            stats = {
                followers: apiStats.followers_count,
                following: apiStats.following_count,
                posts: apiStats.posts_count
            };
        }
    } catch (error) {
        if (error.message === 'No authentication token found') {
            return;
        }
        console.error('Failed to fetch user stats', error);
        showNotification('Failed to fetch user stats', NotificationType.ERROR);
    }

    const statsHTML = `
        <div class="profile-stats">
            <div class="stat-item">
                <span class="stat-value">${formatNumber(stats.followers)}</span>
                <span class="stat-label">Followers</span>
            </div>
            <div class="stat-item">
                <span class="stat-value">${formatNumber(stats.following)}</span>
                <span class="stat-label">Following</span>
            </div>
            <div class="stat-item">
                <span class="stat-value">${formatNumber(stats.posts)}</span>
                <span class="stat-label">Posts</span>
            </div>
        </div>
    `;

    const container = document.getElementById('profile-stats-container');
    if (container) {
        container.innerHTML = statsHTML;
    }
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
    // Check for authentication
    

    return `
        <aside class="sidebar sidebar-right">
            ${createWhoToFollowSection()}
            ${createOnlineUsersSection()}
            ${createLatestNewsSection()}
        </aside>
    `;
}

function createWhoToFollowSection() {
    // Initialize suggestions loading when the component is created
    setTimeout(async () => {
        await loadSuggestions();
    }, 0);

    return `
        <div class="sidebar-card who-to-follow">
            <div class="who-to-follow-header">
                <img src="images/add-friend.png" alt="follow me">
                <h3>Who to Follow</h3>
            </div>
            <div class="follow-suggestions" id="follow-suggestions">
                ${createLoader()}
            </div>
        </div>
    `;
}

// New function to handle suggestions loading
async function loadSuggestions() {
    try {
        const suggestions = await createSuggestionItems(currentPage);
        const suggestionsContainer = document.querySelector('.follow-suggestions');
        if (suggestionsContainer) {
            suggestionsContainer.innerHTML = suggestions;
            
            // Add scroll event listener with throttling
            const handleScroll = throttle(async (e) => {
                const container = e.target;
                if (
                    !isLoadingUsers && 
                    !allUsersLoaded && 
                    container.scrollHeight - container.scrollTop <= container.clientHeight + 50
                ) {
                    isLoadingUsers = true;
                    currentPage++;
                    
                    // Append loading indicator
                    container.insertAdjacentHTML('beforeend', createLoader());
                    
                    // Fetch next batch of users
                    const newSuggestions = await createSuggestionItems(currentPage);
                    
                    // Remove loading indicator
                    const loader = container.querySelector('.loader-container');
                    if (loader) loader.remove();
                    
                    // Append new suggestions
                    if (newSuggestions !== '<div class="no-suggestions">No suggestions available</div>') {
                        container.insertAdjacentHTML('beforeend', newSuggestions);
                        setupFollowEventListeners();
                    } else {
                        allUsersLoaded = true;
                    }
                    
                    isLoadingUsers = false;
                }
            }, 500);

            suggestionsContainer.addEventListener('scroll', handleScroll);
            setupFollowEventListeners();
        }
    } catch (error) {
        console.error('Error updating suggestions:', error);
        const suggestionsContainer = document.querySelector('.follow-suggestions');
        if (suggestionsContainer) {
            suggestionsContainer.innerHTML = '<div class="error">Failed to load suggestions</div>';
        }
    }
}

// Modify createSuggestionItems to accept page parameter
async function createSuggestionItems(page = 1) {
    const token = localStorage.getItem('token');
    if (!token) {
        return '<div class="no-suggestions">Please log in to see suggestions</div>';
    }

    try {
        const limit = 5; // Users per page
        const response = await authenticatedFetch(`/api/users?page=${page}&limit=${limit}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch user suggestions: ${response.status}`);
        }
        
        // Fetch current user's following list
        const followingResponse = await authenticatedFetch('/api/followers/following');
        if (!followingResponse.ok) {
            throw new Error('Failed to fetch following list');
        }
        
        const users = await response.json();
        const followingList = await followingResponse.json();
        
        if (!Array.isArray(users) || users.length === 0) {
            return '<div class="no-suggestions">No suggestions available</div>';
        }
        
        return users.map(user => {
            const isFollowing = followingList.some(followingId => followingId === user.id);
            
            return `
                <div class="suggestion-item" data-user-id="${user.id}">
                    <div class="user-suggestions">
                        <div class="avatar-wrapper">
                            <img src="${user.avatar || 'images/avatar1.png'}" alt="${user.nickname}" class="user-avatar">
                            <span class="status-indicator ${user.is_online ? 'online' : 'offline'}"></span>
                        </div>
                        <div class="suggestion-info">
                            <h4>${escapeHTML(user.nickname)}</h4>
                            <p>${escapeHTML(user.profession || 'Member')}</p>
                        </div>
                    </div>
                    <button class="story-add ${isFollowing ? 'following' : ''}" 
                            title="${isFollowing ? 'Following' : 'Follow user'}"
                            ${isFollowing ? 'disabled' : ''}>
                        <i class="fas ${isFollowing ? 'fa-check' : 'fa-plus'}"></i>
                    </button>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error fetching suggestions:', error);
        if (error.message === 'No authentication token found') {
            return '<div class="no-suggestions">Please log in to see suggestions</div>';
        }
        showNotification('Failed to load user suggestions', NotificationType.ERROR);
        return '<div class="error">Failed to load suggestions</div>';
    }
}

// Add helper function to setup follow event listeners
function setupFollowEventListeners() {
    document.querySelectorAll('.story-add').forEach(btn => {
        btn.removeEventListener('click', handleFollow);
        btn.addEventListener('click', handleFollow);
    });
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
                    <a href="#" class="load-news">... View all latest news</a>                    
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

async function followUser(userName) {
    try {
        // Find the suggestion item by iterating through all h4 elements
        const h4Elements = document.querySelectorAll('.suggestion-item h4');
        const suggestionItem = Array.from(h4Elements)
            .find(element => element.textContent === userName)
            ?.closest('.suggestion-item');

        if (!suggestionItem) {
            throw new Error('User not found');
        }
        
        const userId = suggestionItem.dataset.userId;
        
        const response = await fetch('/api/followers/follow', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                following_id: parseInt(userId)
            })
        });

        if (!response.ok) {
            throw new Error('Failed to follow user');
        }

        // Update UI to reflect the new follow status
        const button = suggestionItem.querySelector('.story-add');
        button.innerHTML = '<i class="fas fa-check"></i>';
        button.title = 'Following';
        button.disabled = true;

        return await response.json();
    } catch (error) {
        console.error('Error following user:', error);
        throw error;
    }
}

 