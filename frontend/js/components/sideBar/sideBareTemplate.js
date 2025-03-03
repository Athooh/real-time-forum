import { escapeHTML, formatNumber } from "../../utils.js";
import { authenticatedFetch } from "../../security.js";
import {
  showNotification,
  NotificationType,
} from "../../utils/notifications.js";
import { createLoader } from "../loader.js";
import { loadSuggestions } from "./sideBarEvent.js";
import { followUser, updateLatestNews } from "./sideBarApi.js";

function createUserProfileCard() {
  const userDataAbout = JSON.parse(localStorage.getItem("userDataAbout")) || {};
  const userData = userDataAbout.profile || {};
  const userAbout = userDataAbout.about || {};

  const avatar = userData.avatar || "images/avatar.png";
  const banner = userData.cover_image || "images/banner.png";

  return `
        <div class="user-profile-card">
            <div class="profile-banner">
                <img src="${banner}" alt="Profile Banner" data-user-banner="${
    userData.id
  }">
            </div>
            <div class="profile-info">
                <div class="profile-avatar">
                    <img src="${avatar}" alt="Profile Picture" data-user-avatar="${
    userData.id
  }">
                </div>
                <h3 class="user-name">${escapeHTML(
                  userData.nickname || "John Doe"
                )}</h3>
                <p class="user-profession">${escapeHTML(
                  userData.profession || "Software Engineer"
                )}</p>
                <p class="user-tagline">${escapeHTML(
                  userAbout.bio ||
                    "Building the future, one line of code at a time"
                )}</p>
                <div id="profile-stats-container">
                    ${createLoader()}
                </div>
            </div>
        </div>
    `;
}
async function createProfileStats() {
  if (!localStorage.getItem("token")) {
    return;
  }

  let stats = {
    followers: "0",
    following: "0",
    posts: "0",
  };

  try {
    const response = await authenticatedFetch(`/api/users/stats`);

    if (response.ok) {
      const rawText = await response.text();
      const apiStats = JSON.parse(rawText);

      stats = {
        followers: apiStats.followers_count,
        following: apiStats.following_count,
        posts: apiStats.posts_count,
      };
    }
  } catch (error) {
    if (error.message === "No authentication token found") {
      return;
    }
    console.error("Failed to fetch user stats", error);
    showNotification("Failed to fetch user stats", NotificationType.ERROR);
  }

  const statsHTML = `
          <div class="profile-stats">
              <div class="stat-item">
                  <span class="stat-value">${formatNumber(
                    stats.followers
                  )}</span>
                  <span class="stat-label">Followers</span>
              </div>
              <div class="stat-item">
                  <span class="stat-value">${formatNumber(
                    stats.following
                  )}</span>
                  <span class="stat-label">Following</span>
              </div>
              <div class="stat-item">
                  <span class="stat-value">${formatNumber(stats.posts)}</span>
                  <span class="stat-label">Posts</span>
              </div>
          </div>
      `;

  const container = document.getElementById("profile-stats-container");
  if (container) {
    container.innerHTML = statsHTML;
  }
}

function createSidebarNav() {
  return `
         <nav class="sidebar-nav">
                          <a href="#" class="nav-item active">
                              <img src="images/feeds.png" alt="" srcset="">
                              <span>Feed</span>
                          </a>
                          <a href="#" class="nav-item">
                              <img src="images/connections.png" alt="" srcset="">
                              <span>Connections</span>
                          </a>
                          <a href="#" class="nav-item">
                              <img src="images/news.png" alt="" srcset="">
                              <span>Latest News</span>
                          </a>
                          <a href="#" class="nav-item">
                              <img src="images/events.png" alt="" srcset="">
                              <span>Events</span>
                          </a>
                          <a href="#" class="nav-item">
                              <img src="images/group.png" alt="" srcset="">
                              <span>Groups</span>
                          </a>
                          <a href="#" class="nav-item">
                              <img src="images/notification.png" alt="" srcset="">
                              <span>Notifications</span>
                          </a>
                          <a href="#" class="nav-item">
                              <img src="images/settings.png" alt="" srcset="">
                              <span>Settings</span>
                          </a>
                          <a href="#" class="view-profile-link">
                              <img src="images/user.png" alt="" srcset="">
                  <span>View Profile</span>
              </a>
          </nav>
      `;
}

function createWhoToFollowSection() {
  // Initialize suggestions loading when the component is created
  setTimeout(async () => {
    await loadSuggestions();
  }, 0);

  return `
          <div class="sidebar-card who-to-follow">
              <div class="who-to-follow-header">
                  <img src="images/add-friend.png" alt="follow me">
                  <h3>Who to Follow</h3>
              </div>
              <div class="follow-suggestions" id="follow-suggestions">
                  ${createLoader()}
              </div>
          </div>
      `;
}

// Modify createSuggestionItems to accept page parameter
async function createSuggestionItems(page = 1) {
  const token = localStorage.getItem("token");
  if (!token) {
    return '<div class="no-suggestions">Please log in to see suggestions</div>';
  }

  try {
    const limit = 5; // Users per page
    const response = await authenticatedFetch(
      `/api/users?page=${page}&limit=${limit}`
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch user suggestions: ${response.status}`);
    }

    // Fetch current user's following list
    const followingResponse = await authenticatedFetch(
      "/api/followers/following"
    );
    if (!followingResponse.ok) {
      throw new Error("Failed to fetch following list");
    }

    const users = await response.json();
    const followingList = await followingResponse.json();

    if (!Array.isArray(users) || users.length === 0) {
      return '<div class="no-suggestions">No suggestions available</div>';
    }

    return users
      .map((user) => {
        const isFollowing = followingList.some(
          (followingId) => followingId === user.id
        );

        return `
                  <div class="suggestion-item" data-user-id="${user.id}">
                      <div class="user-suggestions">
                          <div class="avatar-wrapper">
                              <img src="${
                                user.avatar || "images/avatar1.png"
                              }" alt="${user.nickname}" class="user-avatar">
                              <span class="status-indicator ${
                                user.is_online ? "online" : "offline"
                              }"></span>
                          </div>
                          <div class="suggestion-info">
                              <h4>${escapeHTML(user.nickname)}</h4>
                              <p>${escapeHTML(user.profession || "Member")}</p>
                          </div>
                      </div>
                      <button class="story-add ${
                        isFollowing ? "following" : ""
                      }" 
                              title="${
                                isFollowing ? "Following" : "Follow user"
                              }"
                              ${isFollowing ? "disabled" : ""}>
                          <i class="fas ${
                            isFollowing ? "fa-check" : "fa-plus"
                          }"></i>
                      </button>
                  </div>
              `;
      })
      .join("");
  } catch (error) {
    console.error("Error fetching suggestions:", error);
    if (error.message === "No authentication token found") {
      return '<div class="no-suggestions">Please log in to see suggestions</div>';
    }
    showNotification("Failed to load user suggestions", NotificationType.ERROR);
    return '<div class="error">Failed to load suggestions</div>';
  }
}

function createLatestNewsSection() {
  const initialHTML = `
          <div class="sidebar-card latest-news">
              <div class="who-to-follow-header">
                  <img src="images/news.png" alt="Latest News">
                  <h3>Latest News</h3>
              </div>
              <div class="news-items" id="latest-news-container">
                  ${createLoader()}
              </div>
          </div>
      `;

  setTimeout(() => {
    updateLatestNews();
  }, 0);

  return initialHTML;
}
async function handleFollow(e) {
  const suggestionItem = e.currentTarget.closest(".suggestion-item");
  const userName = suggestionItem.querySelector("h4").textContent;
  try {
    await followUser(userName);
    showNotification(`Now following ${userName}`, NotificationType.SUCCESS);
  } catch (error) {
    showNotification("Failed to follow user", NotificationType.ERROR);
  }
}

export {
  createUserProfileCard,
  createSidebarNav,
  createWhoToFollowSection,
  handleFollow,
  createLatestNewsSection,
  createSuggestionItems,
  createProfileStats,
};
