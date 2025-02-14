import { forumState } from "./state.js";
import { fetchPosts } from "./components/posts/postsApi.js";

// Utility functions (e.g., throttling, debouncing)
function throttle(func, limit) {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
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
    errors.push("Password must contain at least one uppercase letter");
  }
  if (!hasLowerCase) {
    errors.push("Password must contain at least one lowercase letter");
  }
  if (!hasNumbers) {
    errors.push("Password must contain at least one number");
  }
  if (!hasSpecialChar) {
    errors.push("Password must contain at least one special character");
  }

  return {
    isValid: errors.length === 0,
    errors: errors,
  };
}

// Rate limiting
const rateLimiter = {
  attempts: {},
  maxAttempts: 5,
  timeWindow: 5 * 60 * 1000, // 5 minutes

  checkLimit: function (key) {
    const now = Date.now();
    if (!this.attempts[key]) {
      this.attempts[key] = {
        count: 1,
        firstAttempt: now,
      };
      return true;
    }

    const attempt = this.attempts[key];
    if (now - attempt.firstAttempt > this.timeWindow) {
      this.attempts[key] = {
        count: 1,
        firstAttempt: now,
      };
      return true;
    }

    if (attempt.count >= this.maxAttempts) {
      return false;
    }

    attempt.count++;
    return true;
  },
};

// XSS Prevention utilities
function escapeHTML(str) {
  if (!str) return "";
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function formatDateToMonthDayYear(dateString) {
  const date = new Date(dateString);
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const month = months[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();

  return `${month} ${day}, ${year}`;
}

// Format time ago utility

function formatTimeAgo(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);

  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return date.toLocaleDateString();
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

  window.addEventListener("scroll", handleScroll);
}

function formatNumber(num) {
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "k";
  }
  return num.toString();
}

export function getCurrentUserId() {
  const user = JSON.parse(localStorage.getItem("userData"));
  return user?.id || null;
}

// Export utilities to window object
export {
  throttle,
  debounce,
  validatePassword,
  rateLimiter,
  escapeHTML,
  formatTimeAgo,
  setupInfiniteScroll,
  formatNumber,
  formatDateToMonthDayYear,
};
