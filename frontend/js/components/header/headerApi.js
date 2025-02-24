import {
  showNotification,
  NotificationType,
} from "../../utils/notifications.js";
import Router from "../../router/router.js";
import { authenticatedFetch } from "../../security.js";

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

export { handleLogout };
