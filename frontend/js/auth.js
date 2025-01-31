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

// Handle User Registration
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const userData = {
        nickname: document.getElementById('nickname').value,
        age: document.getElementById('age').value,
        gender: document.getElementById('gender').value,
        firstName: document.getElementById('first-name').value,
        lastName: document.getElementById('last-name').value,
        email: document.getElementById('email').value,
        password: document.getElementById('password').value,
    };

    try {
        const response = await fetch('/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
        });

        if (response.ok) {
            alert('Registration successful! Please log in.');
            registerForm.reset();
            registerForm.classList.remove('active');
            loginForm.classList.add('active');
        } else {
            const error = await response.json();
            alert(`Registration failed: ${error.message}`);
        }
    } catch (error) {
        console.error('Error during registration:', error);
        alert('An error occurred during registration.');
    }
});

// Handle User Login
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const loginData = {
        identifier: document.getElementById('login-identifier').value,
        password: document.getElementById('login-password').value,
    };

    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(loginData),
        });

        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('token', data.token); // Store the token for future requests
            authSection.style.display = 'none';
            forumSection.style.display = 'block';
        } else {
            const error = await response.json();
            alert(`Login failed: ${error.message}`);
        }
    } catch (error) {
        console.error('Error during login:', error);
        alert('An error occurred during login.');
    }
});

// Handle Logout
document.getElementById('logout').addEventListener('click', () => {
    localStorage.removeItem('token');
    authSection.style.display = 'block';
    forumSection.style.display = 'none';
    loginForm.classList.add('active'); // Show login form after logout
    registerForm.classList.remove('active');
});