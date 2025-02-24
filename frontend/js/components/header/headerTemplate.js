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
        <div class="notification-item ${notification.read ? "" : "unread"}" 
             data-notification-id="${notification.id}">
            <div class="notification-icon">
                ${getNotificationTypeIcon(notification.type)}
            </div>
            <div class="notification-content">
                <p><strong>${escapeHTML(
                  notification.actor.nickname
                )}</strong> ${escapeHTML(notification.message)}</p>
                <span class="notification-time">${formatTimeAgo(
                  notification.timestamp
                )}</span>
            </div>
            <button class="notification-close" aria-label="Dismiss notification">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
}

function createNotificationsList() {
  return `
        <div class="notifications-list">
            ${createNotificationItem({
              id: 1,
              type: "like",
              message: "liked your post",
              actor: { nickname: "John Doe" },
              timestamp: new Date(),
              read: false,
            })}
            ${createNotificationItem({
              id: 2,
              type: "comment",
              message: "commented on your post",
              actor: { nickname: "Jane Smith" },
              timestamp: new Date(),
              read: false,
            })}
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
