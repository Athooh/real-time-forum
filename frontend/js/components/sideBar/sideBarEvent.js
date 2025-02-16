import { throttle } from "../../utils.js";
import { createSuggestionItems, handleFollow } from "./sideBareTemplate.js";
import { createLoader } from "../loader.js";

let currentPage = 1;
let isLoadingUsers = false;
let allUsersLoaded = false;

// New function to handle suggestions loading
async function loadSuggestions() {
  try {
    const suggestions = await createSuggestionItems(currentPage);
    const suggestionsContainer = document.querySelector(".follow-suggestions");
    if (suggestionsContainer) {
      suggestionsContainer.innerHTML = suggestions;

      // Add scroll event listener with throttling
      const handleScroll = throttle(async (e) => {
        const container = e.target;
        if (
          !isLoadingUsers &&
          !allUsersLoaded &&
          container.scrollHeight - container.scrollTop <=
            container.clientHeight + 50
        ) {
          isLoadingUsers = true;
          currentPage++;

          // Append loading indicator
          container.insertAdjacentHTML("beforeend", createLoader());

          // Fetch next batch of users
          const newSuggestions = await createSuggestionItems(currentPage);

          // Remove loading indicator
          const loader = container.querySelector(".loader-container");
          if (loader) loader.remove();

          // Append new suggestions
          if (
            newSuggestions !==
            '<div class="no-suggestions">No suggestions available</div>'
          ) {
            container.insertAdjacentHTML("beforeend", newSuggestions);
            setupFollowEventListeners();
          } else {
            allUsersLoaded = true;
          }

          isLoadingUsers = false;
        }
      }, 500);

      suggestionsContainer.addEventListener("scroll", handleScroll);
      setupFollowEventListeners();
    }
  } catch (error) {
    console.error("Error updating suggestions:", error);
    const suggestionsContainer = document.querySelector(".follow-suggestions");
    if (suggestionsContainer) {
      suggestionsContainer.innerHTML =
        '<div class="error">Failed to load suggestions</div>';
    }
  }
}
// Add helper function to setup follow event listeners
function setupFollowEventListeners() {
  document.querySelectorAll(".story-add").forEach((btn) => {
    btn.removeEventListener("click", handleFollow);
    btn.addEventListener("click", handleFollow);
  });
}

function scrollToPost(postId) {
  const postElement = document.getElementById(`post-${postId}`);
  if (!postElement) return;

  // Remove highlight from any previously highlighted post
  document.querySelectorAll(".post-card").forEach((post) => {
    post.classList.remove("highlighted-post");
  });

  // Add highlight to the target post
  postElement.classList.add("highlighted-post");

  // Scroll the post into view
  postElement.scrollIntoView({ behavior: "smooth", block: "center" });

  // Open comments section if it's closed
  const commentsContent = postElement.querySelector(".comments-content");
  if (commentsContent && commentsContent.style.display === "none") {
    commentsContent.style.display = "block";

    // Update the comments toggle button text
    const toggleBtn = postElement.querySelector(".toggle-comments-btn");
    if (toggleBtn) {
      const commentCount = postElement.querySelectorAll(".comment").length;
      toggleBtn.querySelector(
        "span"
      ).textContent = `Comments (${commentCount}) ▼`;
    }
  }
}

function setupSidebarEventListeners() {
  // Navigation item clicks
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.addEventListener("click", handleNavigation);
  });

  // Follow button clicks
  document.querySelectorAll(".story-add").forEach((btn) => {
    btn.addEventListener("click", handleFollow);
  });
}

function handleNavigation(e) {
  e.preventDefault();
  const navItems = document.querySelectorAll(".nav-item");
  navItems.forEach((item) => item.classList.remove("active"));
  e.currentTarget.classList.add("active");
  // Handle navigation logic
}

export {
  loadSuggestions,
  setupFollowEventListeners,
  handleNavigation,
  scrollToPost,
  setupSidebarEventListeners,
};
