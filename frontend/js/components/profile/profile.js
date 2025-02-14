import {
    createProfileImagesSettings,
    createBasicInfoSettings,
    createContactInfoSettings, 
    createPasswordSettings, 
    createSocialLinksSettings, 
    createInterestsSettings, 
    createPrivacySettings, 
    createSettingsActions,
    createAboutMeSection,
    createExperienceSection,
    createPhotosSection,
    createFriendsSection,
    createProfileDetailsList,
    createAdditionalInfo,
    createInterestsSection,
    createDeleteSection,
    createProfileNavigation,
    createConnectionsSection
} from './profileTemplate.js';
import { createPostCard, createPostsFeed } from '../posts/postsTemplates.js';
import { fetchUserSettings, } from './profileApi.js';
import { addEventListeners ,setupSettingsEventListeners} from './profileEvents.js';

function createPostsSection() {
    return `
        <div id="posts-section" class="profile-section active">
            ${createPostCard()}
            ${createPostsFeed()}
        </div>
    `;
}

function createAboutSection(userData) {
    // Add null checks and default values
    const about = userData?.about || {};
    const bio = about.bio || 'No bio available';
    
    return `
        <div id="about-section" class="profile-section">
            <div class="about-content">
                <p>${escapeHTML(bio)}</p>
                ${createProfileDetailsList(userData)}
                ${createAdditionalInfo()}
                ${createInterestsSection()}
            </div>
        </div>
    `;
}

async function createSettingsSection() {
    try {
        const { about, profile } = await fetchUserSettings();
        
        return `
            <div id="settings-section" class="profile-section">
                <div class="settings-container">
                    ${createProfileImagesSettings(profile)}
                    ${createBasicInfoSettings(profile, about)}
                    ${createContactInfoSettings(profile, about)}
                    ${createPasswordSettings()}
                    ${createSocialLinksSettings(about)}
                    ${createInterestsSettings(about)}
                    ${createPrivacySettings(about)}
                    ${createSettingsActions()}
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error fetching user settings:', error);
        return `
            <div id="settings-section" class="profile-section">
                <div class="error-message">
                    Failed to load settings. Please try again later.
                </div>
            </div>
        `;
    }
}
async function createSidebar(userData) {
    // Ensure userData and its properties exist with default values
    const userAbout = userData?.about || {};
    const userId = userAbout.user_id || JSON.parse(localStorage.getItem('userData')).id || '';
    
    const experienceSection = await createExperienceSection(userData);
    
    return `
        <div class="profile-page-right-column">
            <div class="profile-sidebar">
                ${createAboutMeSection(userData)}
                ${experienceSection}
                ${await createPhotosSection(userId)}
                ${await createFriendsSection()}
            </div>
        </div>
    `;
}

export async function createProfileContent() {
    const userData = JSON.parse(localStorage.getItem('userDataAbout')) || {};
    
    // Await the settings section creation
    const settingsSection = await createSettingsSection();
    
    const content = `
        <div class="profile-container-brief">
            <div class="profile-page-left-column">
                <div class="profile-content">
                    ${createProfileNavigation()}
                    <div class="profile-sections">
                        ${createPostsSection()}
                        ${createAboutSection(userData)}
                        ${createConnectionsSection()}
                        ${settingsSection}
                        ${createDeleteSection()}
                    </div>
                </div>
            </div>
            ${await createSidebar(userData)}
        </div>
    `;

    // Add event listeners after render
    setTimeout(() => {
        addEventListeners();
        setupSettingsEventListeners();
    }, 0);

    return content;
}

async function initializeProfile() {
    const container = document.querySelector('.profile-container');
    if (container) {
        const profileContent = await createProfileContent(); // Wait for the Promise to resolve
        container.innerHTML = profileContent;
    }
}
