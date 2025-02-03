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

        const response = await fetch('/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
        });

        const data = await response.json();

        if (response.ok) {
            alert('Registration successful! Please log in.');
            e.target.reset();
            document.getElementById('register-form').classList.remove('active');
            document.getElementById('login-form').classList.add('active');
        } else {
            alert(`Registration failed: ${data.error || 'Unknown error'}`);
        }
    } catch (error) {
        console.error('Error during registration:', error);
        alert('An error occurred during registration. Please try again.');
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
            alert(data.error || 'Login failed');
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