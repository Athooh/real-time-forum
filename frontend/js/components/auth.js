import { NotificationType, showNotification } from "../utils/notifications.js";
import Router from "../router/router.js";

export function createAuthSection() {
  return `
        <div id="auth-section">
            <div class="auth-container">
                <div class="auth-image">
                    <img id="auth-image" src="./images/register.jpeg" alt="Forum Image">
                </div>
                <div class="auth-forms">
                    ${createRegisterForm()}
                    ${createLoginForm()}
                </div>
            </div>
        </div>
    `;
}

function createRegisterForm() {
  return `
        <!-- Register Form -->
                    <div id="register-form" class="auth-form active">
                        <h2>Register</h2>
                        <form>
                            <div class="input-group">
                                <i class="fas fa-user"></i>
                                <input type="text" id="nickname" name="nickname" placeholder="Nickname" required>
                            </div>
                            <div class="input-group">
                                <i class="fas fa-birthday-cake"></i>
                                <input type="number" id="age" name="age" placeholder="Age" min="1" max="150" required>
                            </div>
                            <div class="input-group">
                                <i class="fas fa-venus-mars"></i>
                                <select id="gender" name="gender" required>
                                    <option value="" disabled selected>Select Gender</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                </select>
                            </div>
                            <div class="input-group">
                                <i class="fas fa-signature"></i>
                                <input type="text" id="first-name" name="firstName" placeholder="First Name" required>
                            </div>
                            <div class="input-group">
                                <i class="fas fa-signature"></i>
                                <input type="text" id="last-name" name="lastName" placeholder="Last Name" required>
                            </div>
                            <div class="input-group">
                                <i class="fas fa-envelope"></i>
                                <input type="email" id="email" name="email" placeholder="Email" required>
                            </div>
                            <div class="input-group">
                                <i class="fas fa-lock"></i>
                                <input type="password" id="password" name="password" placeholder="Password" required>
                                <i class="password-toggle">👁️</i>
                            </div>
                            <button type="submit">Register</button>
                        </form>
            <p>Already have an account? <a href="#" id="show-login">Login</a></p>
        </div>
    `;
}

function createLoginForm() {
  return `
         <!-- Login Form -->
                    <div id="login-form" class="auth-form">
                        <h2>Login</h2>
                        <form>
                            <div class="input-group">
                                <i class="fas fa-user"></i>
                                <input type="text" id="login-email" placeholder="Email or Nickname" required>
                            </div>
                            <div class="input-group">
                                <i class="fas fa-lock"></i>
                                <input type="password" id="login-password" placeholder="Password" required>
                                <i class="password-toggle">👁️</i>
                            </div>
                            <button type="submit">Login</button>
                        </form>
            <p>Don't have an account? <a href="#" id="show-register">Register</a></p>
        </div>
    `;
}

export function setupAuthEventListeners() {
  const showLoginLink = document.getElementById("show-login");
  const showRegisterLink = document.getElementById("show-register");
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");

  // Update these selectors to match the forms directly
  const loginFormElement = document.querySelector("#login-form form");
  const registerFormElement = document.querySelector("#register-form form");

  // Add password toggle event listeners
  const passwordToggles = document.querySelectorAll(".password-toggle");
  passwordToggles.forEach((toggle) => {
    toggle.addEventListener("click", function () {
      const passwordInput = this.previousElementSibling;
      if (passwordInput.type === "password") {
        passwordInput.type = "text";
        this.textContent = "🔒";
      } else {
        passwordInput.type = "password";
        this.textContent = "👁️";
      }
    });
  });

  if (showLoginLink) {
    showLoginLink.addEventListener("click", (e) => {
      e.preventDefault();
      registerForm.classList.remove("active");
      loginForm.classList.add("active");
    });
  }

  if (showRegisterLink) {
    showRegisterLink.addEventListener("click", (e) => {
      e.preventDefault();
      loginForm.classList.remove("active");
      registerForm.classList.add("active");
    });
  }

  // Add form submission handlers
  if (loginFormElement) {
    loginFormElement.addEventListener("submit", handleLogin);
  }

  if (registerFormElement) {
    registerFormElement.addEventListener("submit", handleRegister);
  }
}

export async function handleLogin(e) {
  e.preventDefault();
  try {
    const identifier = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;

    // Basic validation
    if (!identifier || !password) {
      showNotification(
        "Email/Nickname and password are required",
        NotificationType.ERROR
      );
      return;
    }

    const response = await fetch("/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        identifier: identifier,
        password: password,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("userData", JSON.stringify(data.userData));

      // Get router instance and navigate
      const router = new Router();
      router.navigate("/");

      showNotification("Login successful!", NotificationType.SUCCESS);
    } else {
      console.log("Attempt failed");
      const errorMessage = data.error || "Invalid credentials";
      showNotification(errorMessage, NotificationType.ERROR);
    }
  } catch (error) {
    console.error("Error during login:", error);
    showNotification(
      "An error occurred during login. Please try again.",
      NotificationType.ERROR
    );
  }
}

async function handleRegister(e) {
  e.preventDefault();

  try {
    const userData = {
      nickname: document.getElementById("nickname").value,
      age: parseInt(document.getElementById("age").value),
      gender: document.getElementById("gender").value,
      first_name: document.getElementById("first-name").value,
      last_name: document.getElementById("last-name").value,
      email: document.getElementById("email").value,
      password: document.getElementById("password").value,
    };

    // Basic validation
    for (const [key, value] of Object.entries(userData)) {
      if (!value && key !== "age") {
        showNotification(
          `${key.replace("_", " ")} is required`,
          NotificationType.ERROR
        );
        return;
      }
    }

    if (userData.age < 13) {
      showNotification(
        "You must be at least 13 years old to register",
        NotificationType.ERROR
      );
      return;
    }

    const response = await fetch("/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (response.ok) {
      // Reset form
      e.target.reset();

      // Switch to login form
      const registerForm = document.getElementById("register-form");
      const loginForm = document.getElementById("login-form");
      const authImage = document.getElementById("auth-image");

      registerForm.classList.remove("active");
      loginForm.classList.add("active");
      authImage.src = "./images/register.jpeg";

      showNotification(
        "Registration successful! Please log in.",
        NotificationType.SUCCESS
      );
    } else {
      const errorMessage =
        data.error || "Registration failed. Please try again.";
      showNotification(errorMessage, NotificationType.ERROR);
    }
  } catch (error) {
    console.error("Error during registration:", error);
    showNotification(
      "An error occurred during registration. Please try again.",
      NotificationType.ERROR
    );
  }
}
