import { forumState } from './state.js';
import { fetchPosts } from './components/posts/postsApi.js';

// Utility functions (e.g., throttling, debouncing)
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Password validation
function validatePassword(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*]/.test(password);
    
    const errors = [];
    
    if (password.length < minLength) {
        errors.push(`Password must be at least ${minLength} characters long`);
    }
    if (!hasUpperCase) {
        errors.push('Password must contain at least one uppercase letter');
    }
    if (!hasLowerCase) {
        errors.push('Password must contain at least one lowercase letter');
    }
    if (!hasNumbers) {
        errors.push('Password must contain at least one number');
    }
    if (!hasSpecialChar) {
        errors.push('Password must contain at least one special character');
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

// Rate limiting
const rateLimiter = {
    attempts: {},
    maxAttempts: 5,
    timeWindow: 5 * 60 * 1000, // 5 minutes
    
    checkLimit: function(key) {
        const now = Date.now();
        if (!this.attempts[key]) {
            this.attempts[key] = {
                count: 1,
                firstAttempt: now
            };
            return true;
        }
        
        const attempt = this.attempts[key];
        if (now - attempt.firstAttempt > this.timeWindow) {
            this.attempts[key] = {
                count: 1,
                firstAttempt: now
            };
            return true;
        }
        
        if (attempt.count >= this.maxAttempts) {
            return false;
        }
        
        attempt.count++;
        return true;
    }
};

// XSS Prevention utilities
function escapeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// Format time ago utility
function formatTimeAgo(timestamp) {
    const now = new Date();
    const date = new Date(timestamp);
    const seconds = Math.floor((now - date) / 1000);
    
    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1) return interval + ' year' + (interval === 1 ? '' : 's') + ' ago';
    
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) return interval + ' month' + (interval === 1 ? '' : 's') + ' ago';
    
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) return interval + ' day' + (interval === 1 ? '' : 's') + ' ago';
    
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) return interval + ' hour' + (interval === 1 ? '' : 's') + ' ago';
    
    interval = Math.floor(seconds / 60);
    if (interval >= 1) return interval + ' minute' + (interval === 1 ? '' : 's') + ' ago';
    
    return Math.floor(seconds) + ' second' + (seconds === 1 ? '' : 's') + ' ago';
}

function setupInfiniteScroll() {
    const handleScroll = throttle(() => {
        const scrollPosition = window.innerHeight + window.scrollY;
        const bodyHeight = document.documentElement.scrollHeight;
        
        // Load more when user reaches 80% of the page
        if (scrollPosition > bodyHeight * 0.8) {
            if (!forumState.isLoading && !forumState.allPostsLoaded) {
                forumState.currentPage = (forumState.currentPage || 1) + 1;
                fetchPosts(forumState.currentPage, true);
            }
        }
    }, 500); 

    window.addEventListener('scroll', handleScroll);
}

// Export utilities to window object
export {
    throttle,
    debounce,
    validatePassword,
    rateLimiter,
    escapeHTML,
    formatTimeAgo,
    setupInfiniteScroll
};