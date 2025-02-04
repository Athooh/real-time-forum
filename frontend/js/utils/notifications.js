// Notification types
const NotificationType = {
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info'
};

// Create and show notification
function showNotification(message, type = NotificationType.INFO, duration = 5000) {
    // Create notification container if it doesn't exist
    let container = document.getElementById('notification-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notification-container';
        document.body.appendChild(container);
    }

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    // Add icon based on type
    const icon = getNotificationIcon(type);
    
    notification.innerHTML = `
        <div class="notification-content">
            <i class="${icon}"></i>
            <p>${message}</p>
        </div>
        <button class="notification-close">×</button>
    `;

    // Add to container
    container.appendChild(notification);

    // Add click handler to close button
    const closeButton = notification.querySelector('.notification-close');
    closeButton.addEventListener('click', () => {
        notification.remove();
    });

    // Animate in
    requestAnimationFrame(() => {
        notification.classList.add('show');
    });

    // Auto remove after duration
    if (duration > 0) {
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, duration);
    }
}

// Helper function to get appropriate icon
function getNotificationIcon(type) {
    switch (type) {
        case NotificationType.SUCCESS:
            return 'fas fa-check-circle';
        case NotificationType.ERROR:
            return 'fas fa-exclamation-circle';
        case NotificationType.WARNING:
            return 'fas fa-exclamation-triangle';
        default:
            return 'fas fa-info-circle';
    }
}

// Export functions
window.showNotification = showNotification;
window.NotificationType = NotificationType; 
