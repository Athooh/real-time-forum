import { authenticatedFetch } from "../../security.js";
import { escapeHTML, formatTimeAgo } from "../../utils.js";
import {
  showNotification,
  NotificationType,
} from "../../utils/notifications.js";
import { scrollToPost } from "./sideBarEvent.js";
import { registerTimeElement } from "../../utils/timeUpdater.js";

async function updateLatestNews() {
  try {
    const response = await authenticatedFetch("/api/posts?page=1&limit=5", {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      showNotification(
        errorData.error || "Failed to fetch latest posts",
        NotificationType.ERROR
      );
      throw new Error(errorData.error || "Failed to fetch latest posts");
    }

    const data = await response.json();
    const posts = data.posts || [];

    const newsContainer = document.getElementById("latest-news-container");
    if (!newsContainer) return;

    if (posts.length === 0) {
      newsContainer.innerHTML = '<div class="no-news">No posts available</div>';
      return;
    }

    const newsHTML = `
              <div class="news-item">
                  ${posts
                    .map(
                      (post) => `
                      <div class="news-content">
                          <div class="news">
                              <h4 class="news-title" data-post-id="${
                                post.id
                              }">${escapeHTML(
                        post.title || "Untitled Post"
                      )}</h4>
                          </div>
                          <span class="news-time" id="news-time-${
                            post.id
                          }">${formatTimeAgo(post.timestamp)}</span>
                      </div>
                  `
                    )
                    .join("")}
              </div>
          `;

    newsContainer.innerHTML = newsHTML;

    // Register time elements for updating
    posts.forEach((post) => {
      registerTimeElement(
        `news-time-${post.id}`,
        post.timestamp,
        formatTimeAgo
      );
      registerTimeElement(
        `post-time-${post.id}`,
        post.timestamp,
        formatTimeAgo
      );
    });

    const newsTitles = document.querySelectorAll(".news-title");
    newsTitles.forEach((title) => {
      title.addEventListener("click", () => {
        const postId = title.dataset.postId;
        scrollToPost(postId);
      });
      title.style.cursor = "pointer";
    });
  } catch (error) {
    console.error("Error fetching latest news:", error);
    const newsContainer = document.getElementById("latest-news-container");
    if (newsContainer) {
      newsContainer.innerHTML =
        '<div class="error">Failed to load latest news</div>';
    }
  }
}

async function followUser(userName) {
  try {
    // Find the suggestion item by iterating through all h4 elements
    const h4Elements = document.querySelectorAll(".suggestion-item h4");
    const suggestionItem = Array.from(h4Elements)
      .find((element) => element.textContent === userName)
      ?.closest(".suggestion-item");

    if (!suggestionItem) {
      throw new Error("User not found");
    }

    const userId = suggestionItem.dataset.userId;

    const response = await fetch("/api/followers/follow", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({
        following_id: parseInt(userId),
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to follow user");
    }

    // Update UI to reflect the new follow status
    const button = suggestionItem.querySelector(".story-add");
    button.innerHTML = '<i class="fas fa-check"></i>';
    button.title = "Following";
    button.disabled = true;

    return await response.json();
  } catch (error) {
    console.error("Error following user:", error);
    throw error;
  }
}

export { updateLatestNews, followUser };
