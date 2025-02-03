// Utility functions (e.g., throttling, debouncing)
function throttle(func, delay) {
    let lastCall = 0;
    return function (...args) {
        const now = new Date().getTime();
        if (now - lastCall >= delay) {
            lastCall = now;
            func.apply(this, args);
        }
    };
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