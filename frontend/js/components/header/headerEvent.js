import Router from "../../router/router.js";
import { handleLogout } from "./headerApi.js";
import {
  showNotification,
  NotificationType,
} from "../../utils/notifications.js";
import {
  fetchNotifications,
  markNotificationAsRead,
  clearAllNotifications,
} from "./headerApi.js";
import { createNotificationItem } from "../header/headerTemplate.js";
import { fetchUnreadCount } from "../messages/messagesApi.js";

function setupHeaderEventListeners() {
  const router = new Router();

  // Add navigation callback
  router.addNavigationCallback(() => {
    initializeNotifications();
    initializeMessageBadge();
  });

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

  // Initialize notifications
  initializeNotifications();

  // Initialize profile menu events
  setupProfileMenuEvents();
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

let currentPage = 1;
let isLoading = false;
let hasMoreNotifications = true;

export async function initializeNotifications() {
  // Reset state
  currentPage = 1;
  isLoading = false;
  hasMoreNotifications = true;

  // Setup UI
  setupNotificationDropdown();

  // Load initial notifications
  await loadNotifications();

  // Setup event listeners only if they haven't been set up
  if (
    !document
      .querySelector(".notification-menu")
      .hasAttribute("data-initialized")
  ) {
    setupNotificationEventListeners();
    document
      .querySelector(".notification-menu")
      .setAttribute("data-initialized", "true");
  }
}

async function loadNotifications(append = false) {
  if (isLoading || (!append && !hasMoreNotifications)) return;

  isLoading = true;
  try {
    const { notifications, total, unread } = await fetchNotifications(
      currentPage
    );

    // Always update badge count even if there are no notifications
    updateNotificationBadge(unread);

    if (!notifications || notifications.length === 0) {
      updateNotificationsList([], append);
      return;
    }

    updateNotificationsList(notifications, append);
    hasMoreNotifications = notifications.length === 10;
    if (hasMoreNotifications) currentPage++;

    const loadMoreBtn = document.querySelector(".load-more-notifications");
    if (loadMoreBtn) {
      loadMoreBtn.style.display = hasMoreNotifications ? "block" : "none";
    }
  } catch (error) {
    console.error("Error loading notifications:", error);
    showNotification("Failed to load notifications", NotificationType.ERROR);
  } finally {
    isLoading = false;
  }
}

function updateNotificationsList(notifications, append = false) {
  const container = document.getElementById("notifications-list");
  if (!container) return;

  if (!notifications) {
    container.innerHTML = "";
    updateNotificationBadge(0);
    return;
  }

  const notificationsHTML = notifications.map(createNotificationItem).join("");

  if (append) {
    container.insertAdjacentHTML("beforeend", notificationsHTML);
  } else {
    container.innerHTML = notificationsHTML;
  }
}

function setupNotificationEventListeners() {
  // Clear all button
  document.querySelector(".clear-all")?.addEventListener("click", async () => {
    try {
      await clearAllNotifications();
      document.getElementById("notifications-list").innerHTML = "";
      updateNotificationBadge(0);
      showNotification("All notifications cleared", NotificationType.SUCCESS);
    } catch (error) {
      showNotification("Failed to clear notifications", NotificationType.ERROR);
    }
  });

  // Load more button
  document
    .querySelector(".load-more-notifications")
    ?.addEventListener("click", () => {
      loadNotifications(true);
    });

  // Individual notification clicks
  document
    .getElementById("notifications-list")
    ?.addEventListener("click", handleNotificationClick);
}

async function handleNotificationClick(event) {
  const notificationItem = event.target.closest(".notification-item");
  if (!notificationItem) return;

  const notificationId = notificationItem.dataset.notificationId;

  // Handle mark as read button click
  if (event.target.closest(".mark-read-btn")) {
    try {
      await markNotificationAsRead(notificationId);
      notificationItem.classList.remove("unread");
      event.target.closest(".mark-read-btn").style.display = "none";

      // Update unread count
      const unreadCount = document.querySelectorAll(
        ".notification-item.unread"
      ).length;
      updateNotificationBadge(unreadCount);

      showNotification("Notification marked as read", NotificationType.SUCCESS);
    } catch (error) {
      showNotification(
        "Failed to mark notification as read",
        NotificationType.ERROR
      );
    }
    return;
  }
}

function updateNotificationBadge(count) {
  const badge = document.querySelector(".notification-badge");
  if (!badge) return;

  if (count > 0) {
    badge.textContent = count > 99 ? "99+" : count;
    badge.style.display = "block";
  } else {
    badge.textContent = "";
    badge.style.display = "none";
  }

  // Update the count in the header if it exists
  const newNotificationsCount = document.querySelector(
    ".new-notifications-count"
  );
  if (newNotificationsCount) {
    newNotificationsCount.textContent = count > 0 ? `(${count})` : "";
  }
}

function setupNotificationDropdown() {
  const notificationBtn = document.querySelector(
    ".notification-menu .icon-btn"
  );
  const dropdownMenu = document.querySelector(
    ".notification-menu .dropdown-menu"
  );
  let isHovering = false;

  if (!notificationBtn || !dropdownMenu) {
    console.error("Notification elements not found");
    return;
  }

  // Toggle dropdown on button click
  notificationBtn.addEventListener("click", (e) => {
    // Check if the click is coming from the button itself or its children
    if (e.currentTarget !== e.target && !e.target.closest(".icon-btn")) {
      return;
    }

    e.stopPropagation();
    const isVisible = dropdownMenu.classList.contains("show");

    // Close any other open dropdowns first
    document.querySelectorAll(".dropdown-menu.show").forEach((menu) => {
      if (menu !== dropdownMenu) {
        menu.classList.remove("show");
      }
    });

    dropdownMenu.classList.toggle("show");

    if (!isVisible) {
      loadNotifications();
    }
  });

  // Handle hover states
  dropdownMenu.addEventListener("mouseenter", () => {
    isHovering = true;
  });

  dropdownMenu.addEventListener("mouseleave", () => {
    isHovering = false;
    setTimeout(() => {
      if (!isHovering) {
        dropdownMenu.classList.remove("show");
      }
    }, 300);
  });

  // Close when clicking outside
  document.addEventListener("click", (e) => {
    if (
      !dropdownMenu.contains(e.target) &&
      !notificationBtn.contains(e.target)
    ) {
      dropdownMenu.classList.remove("show");
    }
  });
}

export {
  setupHeaderEventListeners,
  handleSearch,
  clearAllNotifications,
  updateNotificationBadge,
  loadNotifications,
};

export async function initializeMessageBadge() {
  try {
    const unreadCount = await fetchUnreadCount();
    updateMessageBadge(unreadCount);
  } catch (error) {
    console.error("Error initializing message badge:", error);
  }
}

export function updateMessageBadge(count) {
  const badge = document.querySelector(".message-badge");
  const iconWrapper = document.querySelector("#messages-btn .icon-wrapper");

  if (badge) {
    if (count > 0) {
      badge.textContent = count > 99 ? "99+" : count;
      badge.style.display = "flex";

      // Add animation
      if (iconWrapper) {
        iconWrapper.classList.add("shake-animation");
        setTimeout(() => {
          iconWrapper.classList.remove("shake-animation");
        }, 500);
      }
    } else {
      badge.style.display = "none";
    }
  }
}

export function setupProfileMenuEvents() {
  // Profile menu click handlers
  document.addEventListener("click", (e) => {
    const profileLink = e.target.closest('[data-route="/profilePage"]');
    if (profileLink) {
      e.preventDefault();

      // Create router instance directly
      const router = new Router();
      router.navigate("/profilePage");

      // If it's the settings link, switch to settings section after navigation
      if (profileLink.dataset.section === "settings") {
        setTimeout(() => {
          const settingsNav = document.querySelector(
            '.profile-nav [data-section="settings"]'
          );
          if (settingsNav) {
            settingsNav.click();
          }
        }, 300);
      }
    }
  });
}
