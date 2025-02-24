import { authenticatedFetch } from "../../security.js";
import { debounce } from "../../utils.js";
import {
  NotificationType,
  showNotification,
} from "../../utils/notifications.js";
import { submitComment, refreshComments, submitReply } from "./postsApi.js";

export function setupCommentEventListeners() {
  // Toggle comments
  document.querySelectorAll(".toggle-comments-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const postId = e.currentTarget.dataset.postId;
      const commentsContent = document.querySelector(
        `#comments-section-${postId} .comments-content`
      );
      if (commentsContent) {
        const isHidden = commentsContent.style.display === "none";
        commentsContent.style.display = isHidden ? "block" : "none";

        // Update the comment count text
        const commentCount = document.querySelectorAll(
          `#comments-${postId} .comment`
        ).length;
        e.currentTarget.querySelector(
          "span"
        ).textContent = `Comments (${commentCount}) ${isHidden ? "▼" : "▲"}`;
      }
    });
  });

  // Reply button
  document.querySelectorAll(".reply-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const commentId = e.currentTarget.dataset.commentId;
      const replyInput = document.querySelector(`#reply-input-${commentId}`);
      if (replyInput) {
        replyInput.style.display =
          replyInput.style.display === "none" ? "block" : "none";
      }
    });
  });

  // Load more comments
  document.querySelectorAll(".load-more-comments").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const postId = e.currentTarget.dataset.postId;
      try {
        e.currentTarget.textContent = "Loading...";
        e.currentTarget.disabled = true;

        // In a real implementation, this would fetch more comments from the server
        // For now, we'll just disable the button
        e.currentTarget.textContent = "No more comments to load";
      } catch (error) {
        showNotification(
          "Failed to load more comments",
          NotificationType.ERROR
        );
        e.currentTarget.textContent = "Load more comments";
        e.currentTarget.disabled = false;
      }
    });
  });

  document.querySelectorAll(".reply-submit-btn").forEach((button) => {
    button.addEventListener(
      "click",
      debounce(async (e) => {
        e.preventDefault(); // Prevent default behavior if necessary

        // Extract data attributes from the clicked button
        const commentId = button.dataset.commentId;
        const postId = button.dataset.postId;

        // Find the closest reply input container and get the input field
        const replyInputContainer = e.target.closest(".reply-input-container");
        if (!replyInputContainer) {
          console.error("Reply input container not found.");
          return;
        }

        const replyInput = replyInputContainer.querySelector(".reply-input");
        if (!replyInput) {
          console.error("Reply input field not found.");
          return;
        }

        const content = replyInput.value.trim();

        // Validate content
        if (!content) {
          console.error("No content to submit.");
          return;
        }

        try {
          // Submit the reply
          await submitReply(commentId, content, postId);

          // Clear the input field after successful submission
          replyInput.value = "";

          replyInputContainer.style.display = "none";
        } catch (error) {
          console.error("Error submitting reply:", error);
        }
      }),
      300
    );
  });
  // Submit buttons click handlers
  document.querySelectorAll(".comment-submit-btn").forEach((btn) => {
    btn.addEventListener(
      "click",
      debounce(async (e) => {
        const button = e.target.closest(".comment-submit-btn");
        const postId = button.dataset.postId;
        const input = button
          .closest(".comment-input-container")
          .querySelector(".comment-input");
        const content = input?.value?.trim();

        if (content && postId) {
          try {
            await handleCommentSubmit(e, postId);
          } catch (error) {
            console.error("Error submitting comment:", error);
          }
        }
      }),
      300
    );
  });
}

export function setupPostMenuHandlers() {
  // Remove existing event listeners from menu buttons
  document.querySelectorAll(".post-menu-btn").forEach((btn) => {
    btn.removeEventListener("click", handleMenuToggle);
    btn.addEventListener("click", handleMenuToggle);
  });

  // Remove existing event listeners from action buttons
  document
    .querySelectorAll(".delete-post-btn, .edit-post-btn")
    .forEach((btn) => {
      btn.removeEventListener("click", handlePostAction);
      btn.addEventListener("click", handlePostAction);
    });

  // Single document click handler for closing menus
  document.removeEventListener("click", handleOutsideClick);
  document.addEventListener("click", handleOutsideClick);
}

function handleMenuToggle(e) {
  e.stopPropagation();
  const menu = e.currentTarget.closest(".post-menu");

  // Close all other menus first
  document.querySelectorAll(".post-menu.active").forEach((otherMenu) => {
    if (otherMenu !== menu) {
      otherMenu.classList.remove("active");
    }
  });

  // Toggle current menu
  menu.classList.toggle("active");
}

function handleOutsideClick(e) {
  if (!e.target.closest(".post-menu")) {
    document.querySelectorAll(".post-menu.active").forEach((menu) => {
      menu.classList.remove("active");
    });
  }
}

async function handlePostAction(e) {
  e.stopPropagation();

  const deleteBtn = e.target.closest(".delete-post-btn");
  const editBtn = e.target.closest(".edit-post-btn");

  if (deleteBtn) {
    const postId = deleteBtn.dataset.postId;

    if (confirm("Are you sure you want to delete this post?")) {
      try {
        const response = await authenticatedFetch(
          `/api/posts?postID=${postId}`,
          { method: "DELETE" }
        );

        if (response.ok) {
          const postCard = deleteBtn.closest(".post-card");
          postCard.remove();
          showNotification(
            "Post deleted successfully",
            NotificationType.SUCCESS
          );
        } else {
          const errorMessage = await response.json();
          console.error("errorMessage", errorMessage.error);
          showNotification(errorMessage.error, NotificationType.ERROR);
        }
      } catch (error) {
        console.error("Error deleting post:", error);
        showNotification("Failed to delete post", NotificationType.ERROR);
      }
    }
  } else if (editBtn) {
    showNotification("Edit functionality coming soon", NotificationType.INFO);
  }
}

async function handleCommentSubmit(e, postId) {
  e.preventDefault();
  const button = e.target.closest(".comment-submit-btn");
  const input = button
    .closest(".comment-input-container")
    .querySelector(".comment-input");
  const content = input?.value?.trim();

  if (!content) {
    console.error("No content to submit.");
    return;
  }

  try {
    const response = await submitComment(postId, content);
    await refreshComments(postId);
    input.value = "";
    showNotification("Comment posted successfully!", NotificationType.SUCCESS);
  } catch (error) {
    showNotification("Failed to post comment", NotificationType.ERROR);
  }
}
