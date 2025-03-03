import { initializeMessages } from "./components/messages/messages.js";
import { initializeWebSocket } from "./websocket/websocket.js";
import { NotificationType, showNotification } from "./utils/notifications.js";

import {
  createAuthSection,
  setupAuthEventListeners,
} from "./components/auth.js";
import { createHeader } from "./components/header/header.js";
import {
  setupHeaderEventListeners,
  initializeMessageBadge,
  setupNotificationDropdown,
  initializeNotifications
} from "./components/header/headerEvent.js";
import {
  createLeftSidebar,
  createRightSidebar,
} from "./components/sideBar/sidebar.js";
import { createMainContent } from "./components/posts/posts.js";
import { fetchPosts } from "./components/posts/postsApi.js";
import Router from "./router/router.js";
import { createProfileContent } from "./components/profile/profile.js";
import { createProfilePage } from "./components/profile/profileTemplate.js";
import { setupProfileEventListeners } from "./components/profile/profileEvents.js";
import { ensureWebSocketConnection } from "./websocket/websocket.js";
import { fetchUserSettings } from "./components/profile/profileApi.js";

class App {
  constructor() {
    this.root = document.getElementById("root");
    this.state = window.forumState;

    // Initialize router with routes
    this.router = new Router({
      "/": () => this.requireAuth(() => this.renderHome()),
      "/loginPage": () => this.renderAuth(),
      "/messagesPage": () => this.requireAuth(() => this.renderMessages()),
      "/profilePage": () => this.requireAuth(() => this.renderProfile()),
      "*": () => this.render404(),
    });

    this.init();
  }

  init() {
    const token = localStorage.getItem("token");
    if (!token) {
      this.router.handleRoute(window.location.pathname);
      return;
    }

    this.router.handleRoute(window.location.pathname);
  }

  // Add new helper method for auth check
  async requireAuth(callback) {
    const token = localStorage.getItem("token");
    if (!token) {
      this.router.navigate("/loginPage");
      return;
    }

    try {
      const response = await fetch("/validate-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: token,
        }),
      });

      if (!response.ok) {
        localStorage.removeItem("token");
        this.router.navigate("/loginPage");
        return;
      }

      return callback();
    } catch (error) {
      console.error("Error validating token:", error);
      this.router.navigate("/loginPage");
      return;
    }
  }

  renderHome() {
    this.root.innerHTML = `
        <div id="app">
            ${this.renderForumSection()}
        </div>
    `;

    this.attachEventListeners();
    this.initializeForumFeatures();

    // Explicitly fetch posts when rendering home
    fetchPosts(1, false); // Reset to page 1 and don't append
  }

  renderAuth(type = "login") {
    
    const token = localStorage.getItem("token");
    if (token) {
      this.router.navigate("/");
      return;
    }
    this.root.innerHTML = `
            <div id="app">
                ${createAuthSection(type)}
            </div>
        `;
    // Show auth section explicitly
    const authSection = document.getElementById("auth-section");
    if (authSection) {
      authSection.style.display = "flex";
    }
    setupAuthEventListeners();
  }

  render404() {
    this.root.innerHTML = `
            <div class="error-page">
                <h1>Oops!</h1>
                <h2>404 - Page Not Found</h2>
                <a href="/" class="back-home">Back to Home</a>
            </div>
        `;
  }

  renderForumSection() {
    return `
            <div id="forum-section">
                ${createHeader()}
                <div class="dashboard-container">
                    ${createLeftSidebar()}
                    ${createMainContent()}
                    ${createRightSidebar()}
                </div>
            </div>
        `;
  }

  renderMessages() {
    ensureWebSocketConnection();

    this.root.innerHTML = `
            <div id="app">
                ${createHeader()}
                <div class="messages-container">
                    <div id="messages-content"></div>
                </div>
            </div>
        `;

    const messagesContent = document.getElementById("messages-content");
    if (messagesContent) {
      initializeMessages(messagesContent);
    }
    setupNotificationDropdown()
    setupHeaderEventListeners();
    this.initializeForumFeatures();
  }

  async renderProfile() {
    ensureWebSocketConnection();

    this.root.innerHTML = `
            <div id="app">
                ${createHeader()}
                <div class="main-container">
                    <div class="profile-container">
                        ${await createProfilePage()}
                        <div id="profile-content-container">Loading...</div>
                    </div>
                </div>
            </div>
        `;

    const profileContent = await createProfileContent();
    document.getElementById("profile-content-container").innerHTML =
      profileContent;

    setupNotificationDropdown()
    setupHeaderEventListeners();
    setupProfileEventListeners();
    this.initializeForumFeatures();
  }

  attachEventListeners() {
    // Attach all necessary event listeners
    setupNotificationDropdown()
    setupAuthEventListeners();
    setupHeaderEventListeners();
  }

  async initializeForumFeatures() {
    try {
      // Fetch user settings first
      await fetchUserSettings();

      // Initialize other features
      initializeWebSocket();
      initializeMessageBadge();
      await initializeNotifications();

      // Only fetch posts if we're on the home page
      if (
        window.location.pathname === "/" ||
        window.location.pathname === "/profilePage"
      ) {
        await fetchPosts(1, false);
      }
    } catch (error) {
      console.error("Error initializing forum:", error);
      showNotification("Error loading forum data", NotificationType.ERROR);
    }
  }
}

// Initialize the app when the DOM is loaded
let appInstance;

document.addEventListener("DOMContentLoaded", () => {
  appInstance = new App();
});

export { appInstance as app };
