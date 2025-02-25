import { escapeHTML, formatTimeAgo } from "../../utils.js";
import { getNotificationTypeIcon } from "../../utils.js";

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
            <span class="icon-wrapper"><i class="fas fa-envelope"></i></span>
            <span class="message-badge" style="display: none">0</span>
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
                <span class="notification-badge" style="display: none">0</span>
            </button>
            ${createNotificationDropdown()}
        </div>
    `;
}

function createNotificationDropdown() {
  return `
        <div class="dropdown-menu">
            <div class="notification-header">
                <p class="h3">Notifications <span class="new-notifications-count"></span></p>
                <button class="clear-all">Clear all</button>
            </div>
            <div class="notifications-list" id="notifications-list">
                <!-- Notifications will be loaded dynamically -->
            </div>
            <div class="notification-footer">
                <button class="load-more-notifications" style="display: none">Load more</button>
            </div>
        </div>
    `;
}

function createProfileMenu() {
  // Get user data from localStorage
  const userDataAbout = JSON.parse(localStorage.getItem("userDataAbout")) || {};
  const userData = userDataAbout.profile || {};
  
  // Get avatar with fallback to default
  const avatar = userData.avatar || "images/avatar.png";

  return `
        <div class="profile-menu">
            <img src="${avatar}" alt="Profile" class="avatar">
            <div class="dropdown-menu">
                <a href="/profilePage" data-route="/profilePage"><i class="fas fa-user"></i> Profile</a>
                <a href="/profilePage#settings" data-route="/profilePage" data-section="settings"><i class="fas fa-cog"></i> Settings</a>
                <button id="logout" class="dropdown-btn">
                    <i class="fas fa-sign-out-alt"></i> Logout
                </button>
            </div>
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

function createNotificationItem(notification) {
  return `
        <div class="notification-item ${notification.is_read ? "" : "unread"}" 
             data-notification-id="${notification.id}">
            <div class="notification-icon">
                ${getNotificationTypeIcon(notification.type)}
            </div>
            <div class="notification-content">
                <p><strong>${escapeHTML(
                  notification.actor.nickname
                )}</strong> ${escapeHTML(notification.message)}</p>
                <span class="notification-time">${formatTimeAgo(
                  notification.created_at
                )}</span>
            </div>
            <div class="notification-actions">
                <button class="mark-read-btn" title="Mark as read" ${
                  notification.is_read ? 'style="display: none;"' : ""
                }>
                    <i class="fas fa-check"></i>
                </button>
            </div>
        </div>
    `;
}

function createNotificationsList() {
  return `
        <div class="notifications-list">
            <!-- Notifications will be loaded dynamically -->
        </div>
    `;
}

export {
  createHomeButton,
  createMessageButton,
  createProfileButton,
  createNotificationMenu,
  createNotificationDropdown,
  createProfileMenu,
  createSearchBar,
  createNotificationItem,
  createNotificationsList,
};
