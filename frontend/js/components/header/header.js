import {
  createHomeButton,
  createMessageButton,
  createProfileButton,
  createNotificationMenu,
  createProfileMenu,
  createSearchBar,
} from "./headerTemplate.js";

export function createHeader() {
  console.log("Creating header");
  return `
        <header class="header-container">
            <div class="main-header">
                ${createHeaderLeft()}
                ${createHeaderRight()}
            </div>
        </header>
    `;
}

function createHeaderLeft() {
  return `
        <div class="header-left">
            <div class="logo">
                <img src="images/forum.png" alt="Forum Logo">
                 <h1>Forum</h1>
            </div>
            ${createSearchBar()}
        </div>
    `;
}

function createHeaderRight() {
  return `
        <div class="header-right">
            ${createHeaderActions()}
        </div>
    `;
}

function createHeaderActions() {
  return `
        <div class="header-actions">
            ${createHomeButton()}
            ${createProfileButton()}
            ${createMessageButton()}
            ${createNotificationMenu()}
            ${createProfileMenu()}
        </div>
    `;
}
