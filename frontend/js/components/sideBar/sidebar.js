import {
  createUserProfileCard,
  createSidebarNav,
  createWhoToFollowSection,
  createLatestNewsSection,
  createProfileStats,
} from "./sideBareTemplate.js";

export function createLeftSidebar() {
  // Check for authentication

  const sidebarHTML = `
        <aside class="sidebar sidebar-left">
            ${createUserProfileCard()}
            ${createSidebarNav()}
        </aside>
    `;

  // After the sidebar is created, fetch the stats
  setTimeout(() => {
    createProfileStats();
  }, 0);

  return sidebarHTML;
}

export function createRightSidebar() {
  // Check for authentication

  return `
        <aside class="sidebar sidebar-right">
            ${createWhoToFollowSection()}
            ${createLatestNewsSection()}
        </aside>
    `;
}
