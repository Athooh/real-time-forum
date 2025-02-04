// DOM Elements
const authSection = document.getElementById('auth-section');
const registerForm = document.getElementById('register-form');
const loginForm = document.getElementById('login-form');
const showLoginLink = document.getElementById('show-login');
const showRegisterLink = document.getElementById('show-register');
const forumSection = document.getElementById('forum-section');
const authImage = document.getElementById('auth-image');

// Show Login Form and Hide Register Form
showLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    registerForm.classList.remove('active');
    loginForm.classList.add('active');
    authImage.src = "./images/register.jpeg";
});

// Show Register Form and Hide Login Form
showRegisterLink.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.classList.remove('active');
    registerForm.classList.add('active');
    authImage.src = "./images/register.png";
});

// Initially show the register form
registerForm.classList.add('active');
authImage.src = "./images/register.png";

// Update the form selector
const registerFormElement = document.querySelector('#register-form form');

// Update the event listener
registerFormElement.addEventListener('submit', async (e) => {
    e.preventDefault();

    try {
        const userData = {
            nickname: document.getElementById('nickname').value,
            age: parseInt(document.getElementById('age').value),
            gender: document.getElementById('gender').value,
            first_name: document.getElementById('first-name').value,
            last_name: document.getElementById('last-name').value,
            email: document.getElementById('email').value,
            password: document.getElementById('password').value,
        };

        const passwordValidation = validatePassword(userData.password);

        if (!passwordValidation.isValid) {
            showNotification(
                `Password requirements: ${passwordValidation.errors.join(', ')}`, 
                NotificationType.WARNING,
                8000 // Longer duration for reading requirements
            );
            return;
        }

        const response = await fetch('/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
        });

        const data = await response.json();

        if (response.ok) {
            showNotification('Registration successful! Please log in.', NotificationType.SUCCESS);
            e.target.reset();
            document.getElementById('register-form').classList.remove('active');
            document.getElementById('login-form').classList.add('active');
        } else {
            showNotification(data.error || 'Unknown error', NotificationType.ERROR);
        }
        
    } catch (error) {
        console.error('Error during registration:', error);
        showNotification(
            'An error occurred during registration. Please try again.',
            NotificationType.ERROR
        );
    }
});

// Login form handler
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    try {
        const identifier = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        if (!identifier || !password) {
            throw new Error('Identifier and password are required');
        }

        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                identifier: identifier,
                password: password,
            }),
        });

        const data = await response.json();

        if (response.ok) {
            showNotification('Login successful!', NotificationType.SUCCESS);
            // Store authentication data
            localStorage.setItem('token', data.token);
            localStorage.setItem('user_id', data.user_id);
            
            // Update UI
            authSection.style.display = 'none';
            forumSection.style.display = 'block';
            
            // Initialize forum features
            try {
                await fetchPosts();
                await fetchOnlineUsers();
                initializeWebSocket();
            } catch (error) {
                console.error('Error initializing forum:', error);
            }
        } else {
            showNotification(data.error || 'Login failed', NotificationType.ERROR);
        }
    } catch (error) {
        console.error('Error during login:', error);
        alert('An error occurred during login. Please try again.');
    }
});

// Update the logout handler
document.getElementById('logout').addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user_id');
    
    // Reset form states
    document.querySelectorAll('.auth-form').forEach(form => {
        form.classList.remove('active');
    });
    
    // Show login form
    loginForm.classList.add('active');
    
    // Reset UI visibility
    forumSection.style.display = 'none';
    authSection.style.display = 'flex';
    
    // Reset the auth image
    authImage.src = "./images/register.jpeg";
});

// Add authentication header to all fetch requests
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
        },
    });
}


function setupPasswordToggles() {
    const toggles = document.querySelectorAll('.password-toggle');
    
    toggles.forEach(toggle => {
        toggle.addEventListener('click', function() {
            const passwordInput = this.previousElementSibling;
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            this.textContent = type === 'password' ? '👁️' : '🔒';
        });
    });
}

document.addEventListener('DOMContentLoaded', setupPasswordToggles);

// Add this at the beginning of the file
function checkAuthState() {
    const token = localStorage.getItem('token');
    if (token) {
        // Hide auth section and show forum
        authSection.style.display = 'none';
        forumSection.style.display = 'block';
        
        // Initialize forum features
        try {
            fetchPosts();
            fetchOnlineUsers();
            initializeWebSocket();
        } catch (error) {
            console.error('Error initializing forum:', error);
            showNotification('Error loading forum data', NotificationType.ERROR);
        }
    } else {
        // Show auth section and hide forum
        authSection.style.display = 'flex';
        forumSection.style.display = 'none';
    }
}

// Call this when the page loads
document.addEventListener('DOMContentLoaded', checkAuthState);
