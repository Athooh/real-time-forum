// XSS Prevention utilities
window.escapeHTML = (str) => {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
};

// CSRF Token handling
let csrfToken = '';

async function fetchCSRFToken() {
    const response = await fetch('/csrf-token');
    if (response.ok) {
        csrfToken = response.headers.get('X-CSRF-Token');
    }
}

// Update authenticatedFetch to include CSRF token
function authenticatedFetch(url, options = {}) {
    const token = localStorage.getItem('token');
    if (!token) {
        throw new Error('No authentication token found');
    }

    return fetch(url, {
        ...options,
        headers: {
            ...options.headers,
            'Authorization': `Bearer ${token}`,
            'X-CSRF-Token': csrfToken,
            'Content-Security-Policy': "default-src 'self'",
        },
    });
}

// Content Security Policy
const cspHeader = {
    'default-src': ["'self'"],
    'script-src': ["'self'"],
    'style-src': ["'self'", 'https://cdnjs.cloudflare.com'],
    'img-src': ["'self'", 'data:', 'https:'],
    'connect-src': ["'self'", 'ws://localhost:8080'],
};

// Input sanitization
function sanitizeInput(input) {
    return input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
}

// Initialize security features
document.addEventListener('DOMContentLoaded', async () => {
    await fetchCSRFToken();
    
    // Set up periodic CSRF token refresh
    setInterval(fetchCSRFToken, 30 * 60 * 1000); // Refresh every 30 minutes
}); 