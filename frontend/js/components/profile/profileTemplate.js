import { escapeHTML,formatNumber } from '../../utils.js';
import { 
    createPostCard,
    createPostsFeed
} from '../posts/postsTemplates.js';
import {
    showWorkplaceForm,
    hideWorkplaceForm,
    addWorkplace,
   
    handlePasswordToggle,
    handlePasswordStrength,
  
    fetchUserSettings,
    
    setupSettingsEventListeners,
    fetchUserExperience,
 
    fetchUserFriends,
} from './profileHandlers.js';
import { fetchUserPhotos, handlePasswordSubmit } from './profileApi.js';
export function createProfilePage() {
    // Get user data with default empty objects for profile and about
    const userDataAbout = JSON.parse(localStorage.getItem('userDataAbout')) || {
        profile: {},
        about: {}
    };

    return `
        <div class="profile-page">
            <div class="profile-header">
                <div class="profile-cover">
                    <img src="${userDataAbout?.profile?.cover_image || "images/banner.png"}" alt="Profile Cover" class="cover-image">
                </div>
                <div class="profile-info-section">
                    <div class="profile-details">
                        <div class="profile-avatar">
                            <img src="${userDataAbout?.profile?.avatar || "images/avatar.png"}" alt="Profile Picture">
                        </div>
                        <div class="profile-details-header">
                            <div class="profile-username">
                                <h1>${escapeHTML(userDataAbout?.profile?.nickname || 'User Name')}</h1>
                                <img src="images/verified.png" alt="verified" class="verified-image">
                            </div>
                            <p><span>230</span> Followers</p>
                        </div>
                    </div>
                    <div class="profile-actions">
                        <div class="edit-profile-btn"><i class="fa-solid fa-pen-to-square"></i> Edit Profile</div>
                    </div>
                </div>
            </div>
            <div class="profile-bio-section">
                <p class="profile-title"><i class="fa-solid fa-briefcase"></i> ${escapeHTML(userDataAbout?.profile?.profession || 'Professional Title')}</p>
                <p class="location"><i class="fa-solid fa-location"></i> ${escapeHTML(userDataAbout?.about?.location || 'Location')}</p>
                <p class="website"><i class="fa-solid fa-link"></i> ${escapeHTML(userDataAbout?.about?.website || 'Website')}</p>
                <p class="email"><i class="fa-solid fa-envelope"></i> ${escapeHTML(userDataAbout?.profile?.email || 'Email')}</p>
                <p class="joined"><i class="fa-solid fa-calendar-days"></i> Joined ${escapeHTML(userDataAbout?.profile?.joined || 'Date')}</p>
            </div>
        </div>
    `;
}

function createProfileNavigation() {
    return `
        <div class="profile-nav">
            <div class="profile-nav-link active" data-section="posts">
                <i class="fa-solid fa-newspaper"></i> Posts
            </div>
            <div class="profile-nav-link" data-section="about">
                <i class="fa-solid fa-user"></i> About
            </div>
            <div class="profile-nav-link" data-section="connections">
                <i class="fa-solid fa-users"></i> Connections
            </div>
            <div class="profile-nav-link" data-section="settings">
                <i class="fa-solid fa-gear"></i> Account Settings
            </div>
            <div class="profile-nav-link danger" data-section="delete">
                <i class="fa-solid fa-trash"></i> Delete Account
            </div>
        </div>
    `;
}

function createPostsSection() {
    return `
        <div id="posts-section" class="profile-section active">
            ${createPostCard()}
            ${createPostsFeed()}
        </div>
    `;
}

function createAboutSection(userData) {
    return `
        <div id="about-section" class="profile-section">
            <div class="about-content">
                <p>${escapeHTML(userData.bio || 'No bio available')}</p>
                ${createProfileDetailsList(userData)}
                ${createAdditionalInfo()}
                ${createInterestsSection()}
            </div>
        </div>
    `;
}

function createConnectionsSection() {
    return `
        <div id="connections-section" class="profile-section">
            <div class="connections-container">
                <div class="connections-tabs">
                    <div class="connection-tab active" data-type="followers">Followers</div>
                    <div class="connection-tab" data-type="following">Following</div>
                </div>
                <div class="connections-list" id="connections-list">
                    <div class="connection-loader">
                        <div class="loader"></div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

async function createSettingsSection() {
    try {
        const { about, profile } = await fetchUserSettings();

        console.log("about", about);
        console.log("profile", profile);
        
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

function createDeleteSection() {
    return `
        <div id="delete-section" class="profile-section">
            <div class="delete-account-container">
                <div class="delete-warning-card">
                    <div class="warning-icon">
                        <i class="fa-solid fa-triangle-exclamation"></i>
                    </div>
                    <h4>Delete Your Account</h4>
                    <p class="warning-text">
                        This action will permanently delete your account and all associated data. This includes:
                    </p>
                    <ul class="deletion-items">
                        <li><i class="fa-solid fa-circle-minus"></i> All your posts and comments</li>
                        <li><i class="fa-solid fa-circle-minus"></i> Your profile information</li>
                        <li><i class="fa-solid fa-circle-minus"></i> Your connections and followers</li>
                        <li><i class="fa-solid fa-circle-minus"></i> All saved content</li>
                    </ul>
                    <div class="confirmation-box">
                        <label class="confirm-checkbox">
                            <input type="checkbox" id="delete-confirm">
                            <span class="checkmark"></span>
                            I understand that this action cannot be undone
                        </label>
                    </div>
                    <div class="delete-actions">
                        <div class="cancel-delete-btn">
                            <i class="fa-solid fa-arrow-left"></i> Go Back
                        </div>
                        <div class="delete-account-btn" disabled>
                            <i class="fa-solid fa-trash"></i> Delete Account
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
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

function addEventListeners() {
    // Workplace form listeners
    document.getElementById('add-workplace')?.addEventListener('click', showWorkplaceForm);
    document.getElementById('save-workplace')?.addEventListener('click', addWorkplace);
    document.getElementById('cancel-workplace')?.addEventListener('click', hideWorkplaceForm);

   

    // Password toggle listeners
    document.querySelectorAll('.password-toggle').forEach(toggle => {
        toggle.addEventListener('click', () => handlePasswordToggle(toggle));
    });

    document.getElementById('new-password')?.addEventListener('input', (e) => 
        handlePasswordStrength(e.target)
    );

    document.getElementById('password-change-form')?.addEventListener('submit', handlePasswordSubmit);
}

function createProfileDetailsList(userData) {
    // Ensure userData and its properties exist with default values
    const userAbout = userData?.about || {};
    const userProfile = userData?.profile || {};
    
    return `
        <div class="profile-info">
            <div class="profile-details-list">
                <div class="profile-detail-item">
                    <div class="profile-detail-item1">
                        <i class="fa-solid fa-calendar-days"></i>
                        <span>Born: ${userAbout.date_of_birth ? new Date(userAbout.date_of_birth).toLocaleDateString('en-US', {
                            month: '2-digit',
                            day: '2-digit',
                            year: '2-digit'
                        }) : 'Not set'}</span>
                    </div>
                </div>
                <div class="profile-detail-item">
                    <div class="profile-detail-item1">
                        <i class="fa-solid fa-heart"></i>
                        <span>Status: ${escapeHTML(userAbout.relationship_status || 'Not set')}</span>
                    </div>
                </div>
                <div class="profile-detail-item">
                    <div class="profile-detail-item1">
                        <i class="fa-solid fa-briefcase"></i>
                        <span>${escapeHTML(userProfile.profession || 'Not set')}</span>
                    </div>
                </div>
                <div class="profile-detail-item">
                    <div class="profile-detail-item1">
                        <i class="fa-solid fa-location-dot"></i>
                        <span>Lives in: ${escapeHTML(userAbout.location || 'Not set')}</span>
                    </div>
                </div>
                <div class="profile-detail-item">
                    <div class="profile-detail-item1">
                        <i class="fa-solid fa-clock"></i>
                        <span>Joined on: ${escapeHTML(userProfile.joined || 'Not set')}</span>
                    </div>
                </div>
                <div class="profile-detail-item">
                    <div class="profile-detail-item1">
                        <i class="fa-solid fa-envelope"></i>
                        <span>Email: ${escapeHTML(userProfile.email || 'Not set')}</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}


function createAdditionalInfo() {
    // Define company categories
    const companyCategories = [
        'Technology',
        'Healthcare',
        'Finance',
        'Education',
        'Manufacturing',
        'Retail',
        'Media & Entertainment',
        'Consulting',
        'Non-Profit',
        'Government',
        'Other'
    ];

    return `
        <div class="additional-info">
            <div class="workplace-section">
                <h4><i class="fa-solid fa-briefcase"></i> Work Experience</h4>
                <div id="workplace-list">
                    <!-- Workplace entries will be added here dynamically -->
                </div>
                <a href="javascript:void(0)" class="add-info-link" id="add-workplace">
                    <i class="fa-solid fa-plus"></i> Add Work Experience
                </a>
                <div class="workplace-form" style="display: none;">
                    <div class="form-group">
                        <input type="text" id="company-name" placeholder="Company Name">
                    </div>
                    <div class="form-group">
                        <input type="text" id="job-title" placeholder="Job Title">
                    </div>
                    <div class="form-group">
                        <select id="company-category" class="form-select">
                            <option value="">Select Company Category</option>
                            ${companyCategories.map(category => `
                                <option value="${category}">${category}</option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="start-date">Start Date</label>
                            <input type="date" id="start-date">
                        </div>
                        <div class="form-group">
                            <label for="end-date">End Date</label>
                            <div class="end-date-group">
                                <input type="date" id="end-date" ${document.getElementById('currently-working')?.checked ? 'disabled' : ''}>
                                <div class="currently-working">
                                    <input type="checkbox" id="currently-working">
                                    <label for="currently-working">Currently working here</label>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="form-group">
                        <input type="text" id="work-location" placeholder="Location">
                    </div>
                    <div class="form-actions">
                        <button id="save-workplace" class="save-btn">
                            <i class="fa-solid fa-check"></i> Save
                        </button>
                        <button id="cancel-workplace" class="cancel-btn">
                            <i class="fa-solid fa-times"></i> Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function createInterestsSection() {
    // Define interest categories with their icons
    const interestIcons = {
        'Photography': 'fa-camera',
        'Web Development': 'fa-code',
        'Hiking': 'fa-person-hiking',
        'Reading': 'fa-book',
        'Travel': 'fa-plane',
        'Music': 'fa-music',
        'Cooking': 'fa-utensils',
        'Gaming': 'fa-gamepad',
        'Art': 'fa-palette',
        'Sports': 'fa-basketball',
        'Movies': 'fa-film',
        'Writing': 'fa-pen-nib',
        'Technology': 'fa-microchip',
        'Science': 'fa-flask',
        'Design': 'fa-bezier-curve',
        'Fashion': 'fa-shirt'
    };

    // Get user interests from localStorage
    const userData = JSON.parse(localStorage.getItem('userDataAbout')) || {};
    const userInterests = userData.about?.interests ? userData.about.interests.split(',') : [];

    return `
        <div class="interests-section">
            <h3>Interests</h3>
            <div class="interests-list">
                <div class="interest-tags">
                    ${userInterests.map(interest => `
                        <div class="interest-tag-item" title="${interest}">
                            <i class="fa-solid ${interestIcons[interest] || 'fa-star'}"></i>
                            <span>${interest}</span>
                        </div>
                    `).join('')}
                    ${userInterests.length === 0 ? `
                        <div class="no-interests">
                            <i class="fa-solid fa-lightbulb"></i>
                            <p>No interests added yet</p>
                        </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
}

function createProfileImagesSettings(profile) {
    return `
        <div class="settings-group">
            <h4>Profile Images</h4>
            <div class="profile-images-settings">
                <div class="cover-image-upload">
                    <h5>Cover Photo</h5>
                    <div class="image-preview">
                        <img src="${profile.cover_image || "images/banner.png"}" alt="Cover" id="cover-preview">
                        <div class="image-upload-overlay">
                            <label for="cover-upload" class="upload-btn">
                                <i class="fa-solid fa-camera"></i> Change Cover
                            </label>
                            <input type="file" id="cover-upload" accept="image/*" hidden>
                        </div>
                    </div>
                </div>
                <div class="avatar-upload">
                    <h5>Profile Picture</h5>
                    <div class="image-preview">
                        <img src="${profile.avatar || "images/avatar.png"}" alt="Avatar" id="avatar-preview">
                        <div class="image-upload-overlay">
                            <label for="avatar-upload" class="upload-btn">
                                <i class="fa-solid fa-camera"></i> Change Avatar
                            </label>
                            <input type="file" id="avatar-upload" accept="image/*" hidden>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function createBasicInfoSettings(profile, about) {
    return `
        <div class="settings-group">
            <h4>Basic Information</h4>
            <form id="basic-info-form" class="settings-form">
                <div class="form-row">
                    <div class="form-group">
                        <label for="nickname">Display Name</label>
                        <input type="text" id="nickname" name="nickname" 
                            value="${escapeHTML(profile.nickname || '')}" 
                            placeholder="Your display name">
                    </div>
                    <div class="form-group">
                        <label for="profession">Profession</label>
                        <input type="text" id="profession" name="profession" 
                            value="${escapeHTML(profile.profession || '')}" 
                            placeholder="Your profession">
                    </div>
                </div>
                <div class="form-group">
                    <label for="bio">Bio</label>
                    <textarea id="bio" name="bio" rows="3" 
                        placeholder="Tell us about yourself">${escapeHTML(about.bio || '')}</textarea>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="dateOfBirth">Date of Birth</label>
                        <input type="date" id="dateOfBirth" name="dateOfBirth" 
                            value="${about.date_of_birth ? new Date(about.date_of_birth).toISOString().split('T')[0] : ''}" 
                            placeholder="Your date of birth">
                    </div>
                    <div class="form-group">
                        <label for="relationshipStatus">Relationship Status</label>
                        <select id="relationshipStatus" name="relationshipStatus">
                            <option value="" ${!about.relationship_status ? 'selected' : ''}>Select status</option>
                            <option value="Single" ${about.relationship_status === 'Single' ? 'selected' : ''}>Single</option>
                            <option value="In a relationship" ${about.relationship_status === 'In a relationship' ? 'selected' : ''}>In a relationship</option>
                            <option value="Married" ${about.relationship_status === 'Married' ? 'selected' : ''}>Married</option>
                            <option value="Engaged" ${about.relationship_status === 'Engaged' ? 'selected' : ''}>Engaged</option>
                            <option value="It's complicated" ${about.relationship_status === "It's complicated" ? 'selected' : ''}>It's complicated</option>
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="location">Location</label>
                        <input type="text" id="location" name="location" 
                            value="${escapeHTML(about.location || '')}" 
                            placeholder="Your location">
                    </div>
                    <div class="form-group">
                        <label for="website">Website</label>
                        <input type="url" id="website" name="website" 
                            value="${escapeHTML(about.website || '')}" 
                            placeholder="Your website">
                    </div>
                </div>
            </form>
        </div>
    `;
}

function createContactInfoSettings(profile, about) {
    return `
        <div class="settings-group">
            <h4>Contact Information</h4>
            <form id="contact-info-form" class="settings-form">
                <div class="form-row">
                    <div class="form-group">
                        <label for="email">Email</label>
                        <input type="email" id="email" name="email" placeholder="Your email" value="${profile.email || 'Email'}">
                    </div>
                    <div class="form-group">
                        <label for="phone">Phone</label>
                        <input type="tel" id="phone" name="phone" placeholder="Your phone number" value="${about.phone_number || 'Phone'}">
                    </div>
                </div>
            </form>
        </div>
    `;
}

function createPasswordSettings() {
    return `
        <div class="settings-group">
            <h4>Change Password</h4>
            <form id="password-change-form" class="settings-form">
                <div class="form-group">
                    <label for="current-password">
                        <i class="fas fa-lock"></i> Current Password
                    </label>
                    <div class="password-input-group">
                        <input 
                            type="password" 
                            id="current-password" 
                            name="currentPassword" 
                            placeholder="Enter your current password"
                            required
                        >
                        <i class="password-toggle fas fa-eye"></i>
                    </div>
                </div>
                <div class="form-group">
                    <label for="new-password">
                        <i class="fas fa-key"></i> New Password
                    </label>
                    <div class="password-input-group">
                        <input 
                            type="password" 
                            id="new-password" 
                            name="newPassword" 
                            placeholder="Enter your new password"
                            required
                        >
                        <i class="password-toggle fas fa-eye"></i>
                    </div>
                    <div class="password-strength-meter">
                        <div class="strength-bar"></div>
                    </div>
                    <small class="password-requirements">
                        Password must contain at least 8 characters, including uppercase, lowercase, numbers, and special characters
                    </small>
                </div>
                <div class="form-group">
                    <label for="confirm-password">
                        <i class="fas fa-check-double"></i> Confirm Password
                    </label>
                    <div class="password-input-group">
                        <input 
                            type="password" 
                            id="confirm-password" 
                            name="confirmPassword" 
                            placeholder="Confirm your new password"
                            required
                        >
                        <i class="password-toggle fas fa-eye"></i>
                    </div>
                </div>
                <div class="password-form-actions">
                    <button type="submit" class="change-password-btn">
                        <i class="fas fa-save"></i> Update Password
                    </button>
                </div>
            </form>
        </div>
    `;
}

function createSocialLinksSettings(about) {
    return `
        <div class="settings-group">
            <h4>Social Links</h4>
            <form id="social-links-form" class="settings-form">
                <div class="form-group">
                    <label for="github"><i class="fab fa-github"></i> GitHub</label>
                    <input type="url" id="github" name="github" placeholder="GitHub profile URL" value="${about.github_url || 'GitHub profile URL'}">
                </div>
                <div class="form-group">
                    <label for="linkedin"><i class="fab fa-linkedin"></i> LinkedIn</label>
                    <input type="url" id="linkedin" name="linkedin" placeholder="LinkedIn profile URL" value="${about.linkedin_url || 'LinkedIn profile URL'}">
                </div>
                <div class="form-group">
                    <label for="twitter"><i class="fab fa-twitter"></i> Twitter</label>
                    <input type="url" id="twitter" name="twitter" placeholder="Twitter profile URL" value="${about.twitter_url || 'Twitter profile URL'}">
                </div>
            </form>
        </div>
    `;
}

function createInterestsSettings(about) {
    const predefinedInterests = [
        { name: 'Photography' },
        { name: 'Web Development' },
        { name: 'Hiking' },
        { name: 'Reading' },
        { name: 'Travel' },
        { name: 'Music' },
        { name: 'Cooking' },
        { name: 'Gaming' },
        { name: 'Art' },
        { name: 'Sports' },
        { name: 'Movies' },
        { name: 'Writing' },
        { name: 'Technology' },
        { name: 'Science' },
        { name: 'Design' },
        { name: 'Fashion' }
    ];

    const userInterests = about.interests ? about.interests.split(',').filter(Boolean) : [];

    return `
        <div class="settings-group">
            <h4>Interests & Skills</h4>
            <div class="interests-input-container">
                <div class="custom-dropdown">
                    <div class="dropdown-header" id="interests-dropdown-header">
                        <span>Select interests...</span>
                        <i class="fa-solid fa-chevron-down"></i>
                    </div>
                    <div class="dropdown-content" style="display: none;">
                        ${predefinedInterests.map(interest => `
                            <div class="dropdown-item ${userInterests.includes(interest.name) ? 'selected' : ''}" 
                                data-value="${interest.name}">
                                ${interest.name}
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
            <div class="interests-tags" id="interests-tags">
                ${userInterests.map(interest => `
                    <div class="interest-tag" data-interest="${escapeHTML(interest)}">
                        <div class="interest-content">
                            ${escapeHTML(interest)}
                        </div>
                        <button class="remove-interest" aria-label="Remove interest">
                            <i class="fa-solid fa-times"></i>
                        </button>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

export function setupInterestsDropdown() {
    const dropdownHeader = document.getElementById('interests-dropdown-header');
    const dropdownContent = dropdownHeader?.nextElementSibling;
    
    if (!dropdownHeader || !dropdownContent) return;

    // Toggle dropdown on header click
    dropdownHeader.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent event from bubbling up
        const isHidden = dropdownContent.style.display === 'none';
        dropdownContent.style.display = isHidden ? 'block' : 'none';
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
        dropdownContent.style.display = 'none';
    });

    // Handle dropdown item selection
    const dropdownItems = dropdownContent.querySelectorAll('.dropdown-item');
    dropdownItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent event from bubbling up
            const value = item.dataset.value;
            
            // Toggle selected state
            item.classList.toggle('selected');
            
            // Add or remove interest tag
            if (item.classList.contains('selected')) {
                addInterestTag(value);
            } else {
                removeInterestTag(value);
            }
        });
    });
}

function addInterestTag(interest) {
    const tagsContainer = document.getElementById('interests-tags');
    const existingTag = tagsContainer?.querySelector(`[data-interest="${interest}"]`);
    
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
        tagsContainer.insertAdjacentHTML('beforeend', tagHTML);
        
        // Add remove event listener to the new tag
        const newTag = tagsContainer.lastElementChild;
        newTag?.querySelector('.remove-interest')?.addEventListener('click', () => {
            removeInterestTag(interest);
            // Also update dropdown selection
            const dropdownItem = document.querySelector(`.dropdown-item[data-value="${interest}"]`);
            dropdownItem?.classList.remove('selected');
        });
    }
}

function removeInterestTag(interest) {
    const tag = document.querySelector(`.interest-tag[data-interest="${interest}"]`);
    tag?.remove();
}

function createPrivacySettings(about) {
    return `
        <div class="settings-group">
            <h4>Privacy Settings</h4>
            <div class="privacy-settings">
                <div class="privacy-option">
                    <label class="switch-label">
                        <span>Profile Visibility</span>
                        <select id="profile-visibility">
                            <option value="public" ${about.is_profile_public === 'public' ? 'selected' : ''}>Public</option>
                            <option value="private" ${about.is_profile_public === 'private' ? 'selected' : ''}>Private</option>
                            <option value="connections" ${about.is_profile_public === 'connections' ? 'selected' : ''}>Connections Only</option>
                        </select>
                    </label>
                </div>
                <div class="privacy-option">
                    <label class="toggle-switch">
                        <input type="checkbox" id="show-email" ${about.show_email ? 'checked' : ''}>
                        <span class="toggle-slider"></span>
                        <span>Show email on profile</span>
                    </label>
                </div>
                <div class="privacy-option">
                    <label class="toggle-switch">
                        <input type="checkbox" id="show-phone" ${about.show_phone
                            ? 'checked'
                            : ''}>
                        <span class="toggle-slider"></span>
                        <span>Show phone number on profile</span>
                    </label>
                </div>
            </div>
        </div>
    `;
}

function createSettingsActions() {
    return `
        <div class="settings-actions">
            <div type="div" class="cancel-btn">Cancel</div>
            <div type="div" class="save-settings-btn">Save Changes</div>
        </div>
    `;
}

function createAboutMeSection(userData) {
    // Ensure userData and its properties exist
    const about = userData?.about || {};
    const profile = userData?.profile || {};

    return `
        <div class="about-me-section">
            <h3>About Me</h3>
            <p class="about-me-text">${escapeHTML(about.bio || 'No description available')}</p>
            <div class="profile-details-list">
                <div class="profile-detail-item">
                    <i class="fa-solid fa-calendar-days"></i>
                    <span>Born: ${about.date_of_birth ? new Date(about.date_of_birth).toLocaleDateString('en-US', {
                        month: '2-digit',
                        day: '2-digit',
                        year: '2-digit'
                    }) : 'Not set'}</span>
                </div>
                <div class="profile-detail-item">
                    <i class="fa-solid fa-heart"></i>
                    <span>Status: ${escapeHTML(about.relationship_status || 'Not specified')}</span>
                </div>
                <div class="profile-detail-item">
                    <i class="fa-solid fa-envelope"></i>
                    <span>Email: ${escapeHTML(profile.email || 'Not specified')}</span>
                </div>
            </div>
        </div>
    `;
}

async function createExperienceSection(userData) {
    try {
        const experiences = await fetchUserExperience() || [];
        
        return `
            <div class="experience-section sidebar-section">
                <div class="section-header">
                    <h3><i class="fa-solid fa-briefcase"></i> Experience</h3>
                </div>
                <div class="experience-list">
                    ${experiences.length > 0 ? experiences.map(exp => `
                        <div class="experience-item">
                            <div class="company-logo">
                                <i class="fa-solid fa-building"></i>
                            </div>
                            <div class="experience-details">
                                <h4>${escapeHTML(exp.role || '')}</h4>
                                <p class="company">${escapeHTML(exp.company_name || '')}</p>
                                <p class="duration">
                                    <i class="fa-regular fa-calendar"></i> 
                                    ${exp.start_date ? new Date(exp.start_date).getFullYear() : ''} - 
                                    ${exp.is_current ? 'Present' : (exp.end_date ? new Date(exp.end_date).getFullYear() : '')}
                                </p>
                            </div>
                        </div>
                    `).join('') : `
                        <div class="no-experience">
                            <p>No work experience added yet</p>
                        </div>
                    `}
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error creating experience section:', error);
        return `
            <div class="experience-section sidebar-section">
                <div class="section-header">
                    <h3><i class="fa-solid fa-briefcase"></i> Experience</h3>
                </div>
                <div class="experience-list">
                    <div class="error-message">
                        <p>Failed to load experience data</p>
                    </div>
                </div>
            </div>
        `;
    }
}

async function createPhotosSection(userId) {
    try {
        const photos = await fetchUserPhotos(userId) || [];
        const photoCount = photos.length;
        
        return `
            <div class="photos-section sidebar-section">
                <div class="section-header">
                    <h3><i class="fa-solid fa-images"></i> Photos</h3>
                    <span class="photo-count">${photoCount} ${photoCount === 1 ? 'photo' : 'photos'}</span>
                </div>
                <div class="photos-grid">
                    ${photos.slice(0, 3).map(photo => `
                        <div class="photo-item">
                            <img src="${photo}" alt="User photo">
                        </div>
                    `).join('')}
                    ${photoCount > 3 ? `
                        <div class="photo-item more-photos">
                            <img src="${photos[3]}" alt="User photo">
                            <div class="more-overlay">
                                <i class="fa-solid fa-plus"></i>
                                <span>${photoCount - 3} more</span>
                            </div>
                        </div>
                    ` : ''}
                    ${photoCount === 0 ? `
                        <div class="no-photos">
                            <i class="fa-solid fa-camera"></i>
                            <p>No photos yet</p>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error creating photos section:', error);
        return `
            <div class="photos-section sidebar-section">
                <div class="section-header">
                    <h3><i class="fa-solid fa-images"></i> Photos</h3>
                </div>
                <div class="error-message">Failed to load photos</div>
            </div>
        `;
    }
}

// Add these variables at the top of the file
let currentFriendsPage = 1;
let isLoadingFriends = false;
let allFriendsLoaded = false;

async function createFriendsSection() {
    try {
        let { friends = [], totalCount = 0 } = await fetchUserFriends(3);

        if (!friends) {
           friends = [];
        }

        const friendsHTML = `
            <div class="friends-section sidebar-section">
                <div class="section-header">
                    <h3><i class="fa-solid fa-user-group"></i> Friends</h3>
                    <span class="friend-count">${formatNumber(totalCount || 0) == 1 ? "1 friend" : `${formatNumber(totalCount || 0)} friends`}</span>
                </div>
                <div class="friends-grid" id="friends-grid">
                    ${friends.length > 0 ? friends.map(friend => `
                        <div class="friend-item">
                            <img src="${friend.avatar || './images/avatar.png'}" alt="${escapeHTML(friend.nickname)}">
                            <div class="friend-info">
                                <h4>${escapeHTML(friend.nickname)}</h4>
                                <p>${friend.mutual_friends || 0} mutual friends</p>
                            </div>
                            <div class="friend-status ${friend.is_online ? 'online' : ''}"></div>
                        </div>
                    `).join('') : `
                        <div class="no-friends">
                            <p>No friends yet</p>
                        </div>
                    `}
                    ${friends.length > 0 ? `
                        <div class="view-all-friends">
                            <div class="view-all-btn" id="view-all-friends-btn">
                                View All Friends <i class="fa-solid fa-arrow-right"></i>
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;

        // After rendering, set up the event listener
        setTimeout(() => {
            setupViewAllFriendsListener();
        }, 0);

        return friendsHTML;
    } catch (error) {
        console.error('Error creating friends section:', error);
        return `
            <div class="friends-section sidebar-section">
                <div class="section-header">
                    <h3><i class="fa-solid fa-user-group"></i> Friends</h3>
                </div>
                <div class="error-message">
                    Failed to load friends
                </div>
            </div>
        `;
    }
}

function setupViewAllFriendsListener() {
    const viewAllBtn = document.getElementById('view-all-friends-btn');
    const friendsGrid = document.getElementById('friends-grid');

    if (!viewAllBtn || !friendsGrid) return;

    viewAllBtn.addEventListener('click', async () => {
        if (isLoadingFriends || allFriendsLoaded) return;

        try {
            isLoadingFriends = true;
            currentFriendsPage++;

            // Show loading state
            viewAllBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';

            const { friends } = await fetchUserFriends(10, currentFriendsPage);

            if (!friends || friends.length < 10) {
                allFriendsLoaded = true;
                viewAllBtn.closest('.view-all-friends').remove();
            }

            if (friends && friends.length > 0) {
                const newFriendsHTML = friends.map(friend => `
                    <div class="friend-item">
                        <img src="${friend.avatar || './images/avatar.png'}" alt="${escapeHTML(friend.nickname)}">
                        <div class="friend-info">
                            <h4>${escapeHTML(friend.nickname)}</h4>
                            <p>${friend.mutual_friends || 0} mutual friends</p>
                        </div>
                        <div class="friend-status ${friend.is_online ? 'online' : ''}"></div>
                    </div>
                `).join('');

                // Insert new friends before the "View All" button
                viewAllBtn.closest('.view-all-friends').insertAdjacentHTML('beforebegin', newFriendsHTML);
            }

            // Reset button text if not all friends are loaded
            if (!allFriendsLoaded) {
                viewAllBtn.innerHTML = 'View All Friends <i class="fa-solid fa-arrow-right"></i>';
            }

        } catch (error) {
            console.error('Error loading more friends:', error);
            viewAllBtn.innerHTML = 'Error loading friends';
        } finally {
            isLoadingFriends = false;
        }
    });
}