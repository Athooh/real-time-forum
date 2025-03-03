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

let headerEventListenerAttached = false;

function setupHeaderEventListeners() {
  const router = new Router();

  // Add navigation callback
  router.addNavigationCallback(() => {
    // Reset and reload notifications
    currentPage = 1;
    hasMoreNotifications = true;
    loadNotifications(false, false);
    initializeMessageBadge();
  });

  if (headerEventListenerAttached) {
    cleanupHeaderEventListeners();
  }

  headerEventListenerAttached = true;

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

  const logoutBtn = document.getElementById("logout");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", handleLogout);
  }

  // Initialize profile menu events
  setupProfileMenuEvents();
}

function cleanupHeaderEventListeners() {
  // Remove event listeners from navigation links
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.replaceWith(link.cloneNode(true)); // Remove all event listeners
  });

  // Remove event listeners from buttons
  const homeBtn = document.getElementById("home-btn");
  if (homeBtn) {
    homeBtn.replaceWith(homeBtn.cloneNode(true));
  }

  const profileBtn = document.getElementById("profile-btn");
  if (profileBtn) {
    profileBtn.replaceWith(profileBtn.cloneNode(true));
  }

  const messagesBtn = document.getElementById("messages-btn");
  if (messagesBtn) {
    messagesBtn.replaceWith(messagesBtn.cloneNode(true));
  }

  const searchBtn = document.querySelector(".search-btn");
  if (searchBtn) {
    searchBtn.replaceWith(searchBtn.cloneNode(true));
  }

  const logoutBtn = document.getElementById("logout");
  if (logoutBtn) {
    logoutBtn.replaceWith(logoutBtn.cloneNode(true));
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

let currentPage = 1;
let isLoading = false;
let hasMoreNotifications = true;

export async function initializeNotifications() {
  // Reset state
  currentPage = 1;
  isLoading = false;
  hasMoreNotifications = true;

  // Setup UI and load initial notifications
  setupNotificationDropdown();
  await loadNotifications(false);

  // Setup event listeners
  setupNotificationEventListeners();
}

async function loadNotifications(append = false) {
  if (isLoading) return;

  // Reset state if not appending
  if (!append) {
    currentPage = 1;
    hasMoreNotifications = true;
  }

  isLoading = true;
  try {
    const { notifications, unread } = await fetchNotifications(currentPage);

    // Always update badge count
    updateNotificationBadge(unread);

    if (!notifications || notifications.length === 0) {
      if (!append) {
        updateNotificationsList([], false);
      }
      hasMoreNotifications = false;
      return;
    }

    // Update notifications list
    updateNotificationsList(notifications, append);

    // Check if there are more notifications
    hasMoreNotifications = notifications.length === 10;

    // Update load more button visibility
    const loadMoreBtn = document.querySelector(".load-more-notifications");
    if (loadMoreBtn) {
      loadMoreBtn.style.display = hasMoreNotifications ? "block" : "none";
    }

    // Increment page only after successful load
    if (hasMoreNotifications) {
      currentPage++;
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
  const clearAllBtn = document.querySelector(".clear-all");
  if (clearAllBtn) {
    const oldClearBtn = clearAllBtn.cloneNode(true);
    clearAllBtn.parentNode.replaceChild(oldClearBtn, clearAllBtn);

    oldClearBtn.addEventListener("click", async () => {
      try {
        await clearAllNotifications();
        currentPage = 1;
        hasMoreNotifications = true;
        updateNotificationsList([], false);
        updateNotificationBadge(0);
        showNotification("All notifications cleared", NotificationType.SUCCESS);
      } catch (error) {
        showNotification(
          "Failed to clear notifications",
          NotificationType.ERROR
        );
      }
    });
  }

  // Load more button
  const loadMoreBtn = document.querySelector(".load-more-notifications");
  if (loadMoreBtn) {
    const oldLoadMoreBtn = loadMoreBtn.cloneNode(true);
    loadMoreBtn.parentNode.replaceChild(oldLoadMoreBtn, loadMoreBtn);

    oldLoadMoreBtn.addEventListener("click", () => {
      if (hasMoreNotifications && !isLoading) {
        loadNotifications(true);
      }
    });
  }

  // Individual notification clicks
  const notificationsList = document.getElementById("notifications-list");
  if (notificationsList) {
    const oldList = notificationsList.cloneNode(true);
    notificationsList.parentNode.replaceChild(oldList, notificationsList);

    oldList.addEventListener("click", async (event) => {
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

          showNotification(
            "Notification marked as read",
            NotificationType.SUCCESS
          );
        } catch (error) {
          showNotification(
            "Failed to mark notification as read",
            NotificationType.ERROR
          );
        }
        return;
      }

      // Handle notification item click (if not clicking mark as read button)
      try {
        const response = await markNotificationAsRead(notificationId);
        notificationItem.classList.remove("unread");
        const markReadBtn = notificationItem.querySelector(".mark-read-btn");
        if (markReadBtn) {
          markReadBtn.style.display = "none";
        }

        updateNotificationBadge(response.unread_count);
      } catch (error) {
        console.error("Error handling notification click:", error);
      }
    });
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

export function setupNotificationDropdown() {
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

  // Remove existing event listeners if any
  const oldBtn = notificationBtn.cloneNode(true);
  notificationBtn.parentNode.replaceChild(oldBtn, notificationBtn);

  // Toggle dropdown on button click
  oldBtn.addEventListener("click", (e) => {
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
      loadNotifications(false);
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
    if (!dropdownMenu.contains(e.target) && !oldBtn.contains(e.target)) {
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
