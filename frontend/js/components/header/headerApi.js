import {
  showNotification,
  NotificationType,
} from "../../utils/notifications.js";
import Router from "../../router/router.js";
import { authenticatedFetch } from "../../security.js";
import { updateNotificationBadge } from "./headerEvent.js";

async function handleLogout() {
  try {
    // Set the intentional logout flag before closing connection
    let { isIntentionalLogout, globalSocket } = await import(
      "../../websocket/websocket.js"
    );
    isIntentionalLogout = true;
    // Close WebSocket connection if it exists
    if (globalSocket && globalSocket.readyState === WebSocket.OPEN) {
      globalSocket.close();
    }

    // Try to notify the server, but don't wait for it
    try {
      await authenticatedFetch("/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch (serverError) {
      console.error("Failed to logout from server:", serverError);
      showNotification("Failed to logout from server", NotificationType.ERROR);
      return;
    }

    // Hide forum section
    const forumSection = document.getElementById("forum-section");
    if (forumSection) {
      forumSection.style.display = "none";
    }

    // Remove messenger container
    const messengerContainer = document.getElementById("messenger-container");
    if (messengerContainer) {
      messengerContainer.remove();
    }

    // Remove token and user data from local storage first
    localStorage.removeItem("token");
    localStorage.removeItem("userData");

    // Get router instance and navigate
    const router = new Router();
    router.navigate("/loginPage");

    showNotification("Logged out successfully", NotificationType.SUCCESS);
  } catch (error) {
    console.error("Error during logout:", error);
    showNotification(
      "An error occurred during logout. Please try again.",
      NotificationType.ERROR
    );
  }
}

async function fetchNotifications(page = 1, limit = 10) {
  try {
    const response = await authenticatedFetch(
      `/api/notifications?page=${page}&limit=${limit}`
    );
    if (!response.ok) throw new Error("Failed to fetch notifications");
    return await response.json();
  } catch (error) {
    console.error("Error fetching notifications:", error);
    showNotification("Failed to load notifications", NotificationType.ERROR);
    throw error;
  }
}

async function markNotificationAsRead(notificationId) {
  try {
    const response = await authenticatedFetch(
      `/api/notifications/read?notificationId=${notificationId}`,
      {
        method: "PUT",
      }
    );
    if (!response.ok) throw new Error("Failed to mark notification as read");
    return await response.json();
  } catch (error) {
    console.error("Error marking notification as read:", error);
    throw error;
  }
}

async function clearAllNotifications() {
  try {
    const response = await authenticatedFetch("/api/notifications/clear", {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to clear notifications");
    return await response.json();
  } catch (error) {
    console.error("Error clearing notifications:", error);
    throw error;
  }
}

async function createNotification(data) {
  try {
    const response = await authenticatedFetch("/api/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) throw new Error("Failed to create notification");
    return await response.json();
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
}

export {
  handleLogout,
  fetchNotifications,
  markNotificationAsRead,
  clearAllNotifications,
};
