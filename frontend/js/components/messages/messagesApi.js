import { BASE_URL } from "../../state.js";
import { authenticatedFetch } from "../../security.js";
import { globalSocket } from "../../websocket/websocket.js";

export async function fetchMessages(page = 1, limit = 10) {
  try {
    const response = await authenticatedFetch(
      `${BASE_URL}/messages?page=${page}&limit=${limit}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch messages");
    }

    const messages = await response.json();
    return messages;
  } catch (error) {
    console.error("Error fetching messages:", error);
    throw error;
  }
}

export async function searchMessages(query) {
  try {
    const response = await authenticatedFetch(
      `${BASE_URL}/messages/search?query=${encodeURIComponent(query)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to search messages");
    }

    const messages = await response.json();
    return messages;
  } catch (error) {
    console.error("Error searching messages:", error);
    throw error;
  }
}

export async function sendMessage(recipientId, content) {
  try {
    const response = await authenticatedFetch(`${BASE_URL}/messages/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        recipient_id: recipientId,
        content: content,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to send message");
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
}

export async function markMessageAsRead(messageId) {
  try {
    const response = await authenticatedFetch(
      `${BASE_URL}/messages/mark-as-read?msgID=${messageId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to mark message as read");
    }

    const result = await response.json();

    // Send WebSocket update for unread count
    if (globalSocket && globalSocket.readyState === WebSocket.OPEN) {
      globalSocket.send(
        JSON.stringify({
          type: "unread_count_update",
          payload: {
            unreadCount: result.unreadCount,
          },
        })
      );
    }

    return result;
  } catch (error) {
    console.error("Error marking message as read:", error);
    throw error;
  }
}

export async function fetchConversation(userId, page = 1, limit = 10) {
  try {
    const response = await authenticatedFetch(
      `${BASE_URL}/messages/conversation?recipient_id=${userId}&page=${page}&limit=${limit}&order=desc`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch conversation");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching conversation:", error);
    throw error;
  }
}

export async function fetchUnreadCount() {
  try {
    const response = await authenticatedFetch(
      `${BASE_URL}/messages/unread-count`
    );
    if (!response.ok) {
      throw new Error("Failed to fetch unread count");
    }
    const data = await response.json();
    return data.unreadCount;
  } catch (error) {
    console.error("Error fetching unread count:", error);
    throw error;
  }
}
