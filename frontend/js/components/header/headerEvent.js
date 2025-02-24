import Router from "../../router/router.js";
import { handleLogout } from "./headerApi.js";
import {
  showNotification,
  NotificationType,
} from "../../utils/notifications.js";

function setupHeaderEventListeners() {
  const router = new Router();

  // Add click handlers for navigation
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const route = e.target.dataset.route;
      router.navigate(route);
    });
  });

  // Home button click handler
  const homeBtn = document.getElementById("home-btn");
  if (homeBtn) {
    homeBtn.addEventListener("click", (e) => {
      e.preventDefault();
      router.navigate("/");
    });
  }

  // Profile button click handler
  const profileBtn = document.getElementById("profile-btn");
  if (profileBtn) {
    profileBtn.addEventListener("click", (e) => {
      e.preventDefault();
      router.navigate("/profilePage");
    });
  }

  // Add messages button click handler
  const messagesBtn = document.getElementById("messages-btn");
  if (messagesBtn) {
    messagesBtn.addEventListener("click", (e) => {
      e.preventDefault();
      router.navigate("/messagesPage");
    });
  }

  // Search functionality
  const searchBtn = document.querySelector(".search-btn");
  if (searchBtn) {
    searchBtn.addEventListener("click", handleSearch);
  }

  // Logout functionality - Use event delegation for dynamically added elements
  document.addEventListener("click", (e) => {
    if (e.target.closest("#logout")) {
      e.preventDefault();
      handleLogout();
    }
  });

  // Notification clear functionality
  const clearAllBtn = document.querySelector(".clear-all");
  if (clearAllBtn) {
    clearAllBtn.addEventListener("click", clearAllNotifications);
  }
}

async function handleSearch(e) {
  const searchInput = document.querySelector(".search-container input");
  const searchTerm = searchInput.value.trim();
  if (searchTerm) {
    // Implement search functionality
    try {
      const results = await performSearch(searchTerm);
      updateSearchResults(results);
    } catch (error) {
      showNotification("Search failed", NotificationType.ERROR);
    }
  }
}

function clearAllNotifications() {
  // Implement clear notifications functionality
  const notificationsList = document.querySelector(".notifications-list");
  if (notificationsList) {
    notificationsList.innerHTML = "";
    updateNotificationBadge(0);
  }
}

export { setupHeaderEventListeners, handleSearch, clearAllNotifications };
