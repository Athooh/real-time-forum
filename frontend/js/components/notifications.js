function createNotificationsComponent() {
    return `
        <div class="notifications-component">
            ${createNotificationsHeader()}
            <div class="notifications-list" id="notifications-list">
                <!-- Notifications will be dynamically inserted here -->
            </div>
        </div>
    `;
}

function createNotificationsHeader() {
    return `
        <div class="notifications-header">
            <h3>Notifications</h3>
            <div class="notifications-actions">
                <button class="mark-all-read">Mark all as read</button>
                <button class="clear-all">Clear all</button>
            </div>
        </div>
    `;
}

function createNotificationItem(notification) {
    return `
        <div class="notification-item ${notification.read ? '' : 'unread'}" 
             data-notification-id="${notification.id}">
            <div class="notification-icon">
                ${getNotificationIcon(notification.type)}
            </div>
            <div class="notification-content">
                <p>${formatNotificationMessage(notification)}</p>
                <span class="notification-time">${formatTimeAgo(notification.timestamp)}</span>
            </div>
            <button class="notification-close" aria-label="Dismiss notification">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
}

function formatNotificationMessage(notification) {
    const message = escapeHTML(notification.message);
    const actor = escapeHTML(notification.actor.nickname);
    
    switch (notification.type) {
        case 'like':
            return `<strong>${actor}</strong> liked your post`;
        case 'comment':
            return `<strong>${actor}</strong> commented on your post`;
        case 'follow':
            return `<strong>${actor}</strong> started following you`;
        case 'mention':
            return `<strong>${actor}</strong> mentioned you in a post`;
        default:
            return message;
    }
}

function getNotificationIcon(type) {
    const icons = {
        like: '<i class="fas fa-heart"></i>',
        comment: '<i class="fas fa-comment"></i>',
        follow: '<i class="fas fa-user-plus"></i>',
        mention: '<i class="fas fa-at"></i>',
        default: '<i class="fas fa-bell"></i>'
    };
    return icons[type] || icons.default;
}

function setupNotificationEventListeners() {
    // Mark all as read
    const markAllReadBtn = document.querySelector('.mark-all-read');
    if (markAllReadBtn) {
        markAllReadBtn.addEventListener('click', handleMarkAllRead);
    }

    // Clear all notifications
    const clearAllBtn = document.querySelector('.clear-all');
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', handleClearAll);
    }

    // Individual notification actions
    document.querySelectorAll('.notification-item').forEach(notification => {
        // Close button
        const closeBtn = notification.querySelector('.notification-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                handleDismissNotification(notification.dataset.notificationId);
            });
        }

        // Notification click
        notification.addEventListener('click', () => {
            handleNotificationClick(notification.dataset.notificationId);
        });
    });
}

async function handleMarkAllRead() {
    try {
        await markAllNotificationsAsRead();
        document.querySelectorAll('.notification-item').forEach(item => {
            item.classList.remove('unread');
        });
        updateNotificationBadge(0);
        showNotification('All notifications marked as read', NotificationType.SUCCESS);
    } catch (error) {
        showNotification('Failed to mark notifications as read', NotificationType.ERROR);
    }
}

async function handleClearAll() {
    try {
        await clearAllNotifications();
        const notificationsList = document.getElementById('notifications-list');
        notificationsList.innerHTML = '<p class="no-notifications">No notifications</p>';
        updateNotificationBadge(0);
        showNotification('All notifications cleared', NotificationType.SUCCESS);
    } catch (error) {
        showNotification('Failed to clear notifications', NotificationType.ERROR);
    }
}

async function handleDismissNotification(notificationId) {
    try {
        await dismissNotification(notificationId);
        const notification = document.querySelector(`[data-notification-id="${notificationId}"]`);
        if (notification) {
            notification.remove();
            updateNotificationCount();
        }
    } catch (error) {
        showNotification('Failed to dismiss notification', NotificationType.ERROR);
    }
}

async function handleNotificationClick(notificationId) {
    try {
        const notification = await getNotification(notificationId);
        if (!notification.read) {
            await markNotificationAsRead(notificationId);
            document.querySelector(`[data-notification-id="${notificationId}"]`)
                .classList.remove('unread');
            updateNotificationCount();
        }
        navigateToNotificationTarget(notification);
    } catch (error) {
        showNotification('Failed to process notification', NotificationType.ERROR);
    }
}

function updateNotificationCount() {
    const unreadCount = document.querySelectorAll('.notification-item.unread').length;
    updateNotificationBadge(unreadCount);
}

function updateNotificationBadge(count) {
    const badge = document.querySelector('.notification-badge');
    if (badge) {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'block' : 'none';
    }
}


// Export for use in other components
export { createNotificationsComponent, setupNotificationEventListeners };
