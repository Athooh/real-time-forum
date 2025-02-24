import { escapeHTML } from "../../utils.js";
import {
  showNotification,
  NotificationType,
} from "../../utils/notifications.js";
import {
  loadConnections,
  fetchUserFriends,
  fetchUserSettings,
  updateUserSettings,
} from "./profileApi.js";
import { createConnectionItem } from "./profileTemplate.js";
import {
  setupImageUploadHandlers,
  handlePasswordToggle,
  handlePasswordStrength,
  showWorkplaceForm,
  addWorkplace,
  hideWorkplaceForm,
  setupConnectionActions,
} from "./profileHandlers.js";

import { handlePasswordSubmit } from "./profileApi.js";
import { authenticatedFetch } from "../../security.js";
import { initializePhotoSlideshow } from "./profileTemplate.js";
import { globalSocket } from "../../websocket/websocket.js";

let currentFriendsPage = 1;
let isLoadingFriends = false;
let allFriendsLoaded = false;

let currentConnectionsPage = 1;
let isLoadingConnections = false;
let allConnectionsLoaded = false;
export let currentTab = "followers";

function setupViewAllFriendsListener() {
  const viewAllBtn = document.getElementById("view-all-friends-btn");
  const friendsGrid = document.getElementById("friends-grid");

  if (!viewAllBtn || !friendsGrid) return;

  viewAllBtn.addEventListener("click", async () => {
    if (isLoadingFriends || allFriendsLoaded) return;

    try {
      isLoadingFriends = true;
      currentFriendsPage++;

      // Show loading state
      viewAllBtn.innerHTML =
        '<i class="fas fa-spinner fa-spin"></i> Loading...';

      const { friends } = await fetchUserFriends(10, currentFriendsPage);

      if (!friends || friends.length < 10) {
        allFriendsLoaded = true;
        viewAllBtn.closest(".view-all-friends").remove();
      }

      if (friends && friends.length > 0) {
        const newFriendsHTML = friends
          .map(
            (friend) => `
                    <div class="friend-item">
                        <img src="${
                          friend.avatar || "./images/avatar.png"
                        }" alt="${escapeHTML(friend.nickname)}">
                        <div class="friend-info">
                            <h4>${escapeHTML(friend.nickname)}</h4>
                            <p>${friend.mutual_friends || 0} mutual friends</p>
                        </div>
                        <div class="friend-status ${
                          friend.is_online ? "online" : ""
                        }"></div>
                    </div>
                `
          )
          .join("");

        // Insert new friends before the "View All" button
        viewAllBtn
          .closest(".view-all-friends")
          .insertAdjacentHTML("beforebegin", newFriendsHTML);
      }

      // Reset button text if not all friends are loaded
      if (!allFriendsLoaded) {
        viewAllBtn.innerHTML =
          'View All Friends <i class="fa-solid fa-arrow-right"></i>';
      }
    } catch (error) {
      console.error("Error loading more friends:", error);
      viewAllBtn.innerHTML = "Error loading friends";
    } finally {
      isLoadingFriends = false;
    }
  });
}

function setupInterestsDropdown() {
  const dropdownHeader = document.getElementById("interests-dropdown-header");
  const dropdownContent = dropdownHeader?.nextElementSibling;

  if (!dropdownHeader || !dropdownContent) return;

  // Add event listeners to existing interest tags
  const existingTags = document.querySelectorAll(
    ".interest-tag .remove-interest"
  );
  existingTags.forEach((removeBtn) => {
    removeBtn.addEventListener("click", () => {
      const tag = removeBtn.closest(".interest-tag");
      const interest = tag?.dataset.interest;
      if (interest) {
        removeInterestTag(interest);
        // Update dropdown selection
        const dropdownItem = dropdownContent.querySelector(
          `.dropdown-item[data-value="${interest}"]`
        );
        dropdownItem?.classList.remove("selected");
      }
    });
  });

  // Toggle dropdown on header click
  dropdownHeader.addEventListener("click", (e) => {
    e.stopPropagation(); // Prevent event from bubbling up
    const isHidden = dropdownContent.style.display === "none";
    dropdownContent.style.display = isHidden ? "block" : "none";
  });

  // Close dropdown when clicking outside
  document.addEventListener("click", () => {
    dropdownContent.style.display = "none";
  });

  // Handle dropdown item selection
  const dropdownItems = dropdownContent.querySelectorAll(".dropdown-item");
  dropdownItems.forEach((item) => {
    item.addEventListener("click", (e) => {
      e.stopPropagation(); // Prevent event from bubbling up
      const value = item.dataset.value;

      // Toggle selected state
      item.classList.toggle("selected");

      // Add or remove interest tag
      if (item.classList.contains("selected")) {
        addInterestTag(value);
      } else {
        removeInterestTag(value);
      }
    });
  });
}

function addInterestTag(interest) {
  const tagsContainer = document.getElementById("interests-tags");
  const existingTag = tagsContainer?.querySelector(
    `[data-interest="${interest}"]`
  );

  if (!existingTag && tagsContainer) {
    const tagHTML = `
            <div class="interest-tag" data-interest="${escapeHTML(interest)}">
                <div class="interest-content">
                    ${escapeHTML(interest)}
                </div>
                <button class="remove-interest" aria-label="Remove interest">
                    <i class="fa-solid fa-times"></i>
                </button>
            </div>
        `;
    tagsContainer.insertAdjacentHTML("beforeend", tagHTML);

    // Add remove event listener to the new tag
    const newTag = tagsContainer.lastElementChild;
    newTag?.querySelector(".remove-interest")?.addEventListener("click", () => {
      removeInterestTag(interest);
      // Also update dropdown selection
      const dropdownItem = document.querySelector(
        `.dropdown-item[data-value="${interest}"]`
      );
      dropdownItem?.classList.remove("selected");
    });
  }
}

function removeInterestTag(interest) {
  const tag = document.querySelector(
    `.interest-tag[data-interest="${interest}"]`
  );
  tag?.remove();
}

function addEventListeners() {
  // Workplace form listeners
  document
    .getElementById("add-workplace")
    ?.addEventListener("click", showWorkplaceForm);
  document
    .getElementById("save-workplace")
    ?.addEventListener("click", addWorkplace);
  document
    .getElementById("cancel-workplace")
    ?.addEventListener("click", hideWorkplaceForm);

  // Password toggle listeners
  document.querySelectorAll(".password-toggle").forEach((toggle) => {
    toggle.addEventListener("click", () => handlePasswordToggle(toggle));
  });

  document
    .getElementById("new-password")
    ?.addEventListener("input", (e) => handlePasswordStrength(e.target));

  document
    .getElementById("password-change-form")
    ?.addEventListener("submit", handlePasswordSubmit);

  // Add to existing event listeners
  const connectionsTab = document.querySelector(".connections-tabs");
  if (connectionsTab) {
    connectionsTab.addEventListener("click", handleConnectionTabClick);
    // Initialize connections data when the section is loaded
    initializeConnectionsSection();
  }

  // Initialize photo slideshow
  initializePhotoSlideshow();
}

async function handleConnectionTabClick(e) {
  const tab = e.target.closest(".connection-tab");
  if (!tab) return;

  // Update active tab
  document
    .querySelectorAll(".connection-tab")
    .forEach((t) => t.classList.remove("active"));
  tab.classList.add("active");

  // Reset pagination
  currentConnectionsPage = 1;
  allConnectionsLoaded = false;
  currentTab = tab.dataset.type;

  // Show loader
  const connectionsList = document.getElementById("connections-list");
  connectionsList.innerHTML =
    '<div class="connection-loader"><div class="loader"></div></div>';

  // Load new data
  await loadConnectionsData(currentTab);
}

async function loadConnectionsData(type) {
  const connectionsContainer = document.getElementById("connections-list");
  if (!connectionsContainer) return;

  try {
    const { connections = [], totalCount } = await loadConnections(type);

    // Get the current user's following list to check relationships
    const followingResponse = await authenticatedFetch(
      "/api/followers/following"
    );
    const followingList = await followingResponse.json();

    // Check if connections exists and is an array before mapping
    const connectionsHTML = connections && Array.isArray(connections) && connections.length > 0
      ? connections
          .map((connection) => {
            const isFollowing = followingList.includes(connection.id);
            return createConnectionItem(connection, isFollowing);
          })
          .join("")
      : '<div class="no-connections">No connections found</div>';

    connectionsContainer.innerHTML = connectionsHTML;

    // Setup connection action handlers
    setupConnectionActions();
  } catch (error) {
    console.error("Error loading connections:", error);
    connectionsContainer.innerHTML =
      '<div class="error-message">Failed to load connections</div>';
  }
}

function setupConnectionsInfiniteScroll() {
  const connectionsList = document.getElementById("connections-list");
  if (!connectionsList) return;

  connectionsList.addEventListener("scroll", async () => {
    if (isLoadingConnections || allConnectionsLoaded) return;

    const { scrollTop, scrollHeight, clientHeight } = connectionsList;
    if (scrollHeight - scrollTop <= clientHeight + 100) {
      isLoadingConnections = true;
      currentConnectionsPage++;

      const { connections } = await loadConnections(
        currentTab,
        currentConnectionsPage
      );

      if (connections.length === 0) {
        allConnectionsLoaded = true;
        return;
      }

      const newConnectionsHTML = connections.map(createConnectionItem).join("");
      connectionsList.insertAdjacentHTML("beforeend", newConnectionsHTML);
      isLoadingConnections = false;
    }
  });
}

function setupSettingsEventListeners() {
  // Add image upload handlers
  setupImageUploadHandlers();

  // Add interests dropdown setup
  setupInterestsDropdown();

  const saveButton = document.querySelector(".save-settings-btn");
  if (!saveButton) return;

  saveButton.addEventListener("click", async () => {
    try {
      // Get all selected interests from the interest tags
      const interestTags = document.querySelectorAll(".interest-tag");
      const interests = Array.from(interestTags)
        .map((tag) => tag.dataset.interest)
        .join(",");

      // Get the age value and convert it to integer
      const ageInput = document.getElementById("age");
      const age = ageInput?.value ? parseInt(ageInput.value) : null;

      const settings = {
        profile: {
          nickname: document.getElementById("nickname")?.value || "",
          email: document.getElementById("email")?.value || "",
          profession: document.getElementById("profession")?.value || "",
          age: age,
        },
        about: {
          bio: document.getElementById("bio")?.value || "",
          relationship_status:
            document.getElementById("relationshipStatus")?.value || "",
          location: document.getElementById("location")?.value || "",
          website: document.getElementById("website")?.value || "",
          github_url: document.getElementById("github")?.value || "",
          linkedin_url: document.getElementById("linkedin")?.value || "",
          twitter_url: document.getElementById("twitter")?.value || "",
          phone_number: document.getElementById("phone")?.value || "",
          interests: interests,
          is_profile_public:
            document.getElementById("profile-visibility")?.value === "public",
          show_email: document.getElementById("show-email")?.checked || false,
          show_phone: document.getElementById("show-phone")?.checked || false,
        },
      };

      // Update settings in the backend
      await updateUserSettings(settings);

      // Show success notification
      showNotification(
        "Settings updated successfully",
        NotificationType.SUCCESS
      );

      // Refresh user data in localStorage
      const userData = await fetchUserSettings();
      localStorage.setItem("userDataAbout", JSON.stringify(userData));

      // Broadcast the update via WebSocket
      if (globalSocket && globalSocket.readyState === WebSocket.OPEN) {
        const updateMessage = {
          type: "profile_update",
          payload: {
            user_id: JSON.parse(localStorage.getItem("userData")).id,
            profile: userData.profile,
            about: userData.about,
          },
        };
        globalSocket.send(JSON.stringify(updateMessage));
      }
    } catch (error) {
      console.error("Error updating user settings:", error);
      showNotification("Failed to update settings", NotificationType.ERROR);
    }
  });
}

// Add this new function to initialize connections data
export async function initializeConnectionsSection() {
  // Set initial tab and load data
  currentTab = "followers";
  await loadConnectionsData(currentTab);
}

export {
  setupViewAllFriendsListener,
  setupInterestsDropdown,
  addEventListeners,
  handleConnectionTabClick,
  loadConnectionsData,
  setupConnectionsInfiniteScroll,
  setupSettingsEventListeners,
};
