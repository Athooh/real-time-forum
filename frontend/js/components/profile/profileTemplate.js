import { escapeHTML } from '../../utils.js';
import { 
    createPostCard,
    createPostsFeed
} from '../posts/postsTemplates.js';

export function createProfilePage() {
    const userData = JSON.parse(localStorage.getItem('userData')) || {};
    
    return `
        <div class="profile-page">
            <div class="profile-header">
                <div class="profile-cover">
                    <img src="images/banner.png" alt="Profile Cover" class="cover-image">
                </div>
                <div class="profile-info-section">
                    <div class="profile-details">
                        <div class="profile-avatar">
                            <img src="images/avatar.png" alt="Profile Picture">
                        </div>
                        <div class="profile-details-header">
                        <div class="profile-username">
                            <h1>${escapeHTML(userData.nickname || 'User Name')}</h1>
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
                <p class="profile-title"><i class="fa-solid fa-briefcase"></i> ${escapeHTML(userData.profession || 'Professional Title')}</p>
                <p class="location"><i class="fa-solid fa-location"></i> ${escapeHTML(userData.location || 'Location')}</p>
                <p class="website"><i class="fa-solid fa-link"></i> ${escapeHTML(userData.website || 'Website')}</p>
                <p class="email"><i class="fa-solid fa-envelope"></i> ${escapeHTML(userData.email || 'Email')}</p>
                <p class="joined"><i class="fa-solid fa-calendar-days"></i> Joined ${escapeHTML(userData.joined || 'Date')}</p>
            </div>
        </div>
    `;
}

export function createProfileContent() {
    const userData = JSON.parse(localStorage.getItem('userData')) || {};
    
    return `
        <div class="profile-container-brief">
            <div class="profile-page-left-column">
                <div class="profile-content">
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
                    <div class="profile-sections">
                        <div id="posts-section" class="profile-section active">
                            ${createPostCard()}
                            ${createPostsFeed()}
                        </div>
                        <div id="about-section" class="profile-section">
                            <div class="about-content">
                                <p>${escapeHTML(userData.bio || 'No bio available')}</p>
                                <div class="profile-info">
                                    <div class="profile-details-list">
                                        <div class="profile-detail-item">
                                            <div class="profile-detail-item1">
                                            <i class="fa-solid fa-calendar-days"></i>
                                            <span>Born: ${escapeHTML(userData.birthDate || 'October 20, 1990')}</span>
                                            </div>
                                            <div class="profile-detail-item-actions">
                                                <div class="action-dropdown-btn">
                                                    <i class="fa-solid fa-ellipsis"></i>
                                                </div>
                                                <div class="action-dropdown-content">
                                                    <a href="#" class="dropdown-item">
                                                        <i class="fa-solid fa-pen"></i> Edit
                                                    </a>
                                                    <a href="#" class="dropdown-item text-danger">
                                                        <i class="fa-solid fa-trash"></i> Delete
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="profile-detail-item">
                                            <div class="profile-detail-item1">
                                            <i class="fa-solid fa-heart"></i>
                                            <span>Status: ${escapeHTML(userData.relationshipStatus || 'Single')}</span>
                                            </div>
                                             <div class="profile-detail-item-actions">
                                                <div class="action-dropdown-btn">
                                                    <i class="fa-solid fa-ellipsis"></i>
                                                </div>
                                                <div class="action-dropdown-content">
                                                    <a href="#" class="dropdown-item">
                                                        <i class="fa-solid fa-pen"></i> Edit
                                                    </a>
                                                    <a href="#" class="dropdown-item text-danger">
                                                        <i class="fa-solid fa-trash"></i> Delete
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="profile-detail-item">
                                            <div class="profile-detail-item1">
                                            <i class="fa-solid fa-briefcase"></i>
                                            <span>${escapeHTML(userData.profession || 'Lead Developer')}</span>
                                            </div>
                                             <div class="profile-detail-item-actions">
                                                <div class="action-dropdown-btn">
                                                    <i class="fa-solid fa-ellipsis"></i>
                                                </div>
                                                <div class="action-dropdown-content">
                                                    <a href="#" class="dropdown-item">
                                                        <i class="fa-solid fa-pen"></i> Edit
                                                    </a>
                                                    <a href="#" class="dropdown-item text-danger">
                                                        <i class="fa-solid fa-trash"></i> Delete
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="profile-detail-item">
                                            <div class="profile-detail-item1">
                                            <i class="fa-solid fa-location-dot"></i>
                                            <span>Lives in: ${escapeHTML(userData.location || 'New Hampshire')}</span>
                                            </div>
                                             <div class="profile-detail-item-actions">
                                                <div class="action-dropdown-btn">
                                                    <i class="fa-solid fa-ellipsis"></i>
                                                </div>
                                                <div class="action-dropdown-content">
                                                    <a href="#" class="dropdown-item">
                                                        <i class="fa-solid fa-pen"></i> Edit
                                                    </a>
                                                    <a href="#" class="dropdown-item text-danger">
                                                        <i class="fa-solid fa-trash"></i> Delete
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="profile-detail-item">
                                            <div class="profile-detail-item1">
                                            <i class="fa-solid fa-clock"></i>
                                            <span>Joined on: ${escapeHTML(userData.joined || 'Nov 26, 2019')}</span>
                                            </div>
                                             <div class="profile-detail-item-actions">
                                                <div class="action-dropdown-btn">
                                                    <i class="fa-solid fa-ellipsis"></i>
                                                </div>
                                                <div class="action-dropdown-content">
                                                    <a href="#" class="dropdown-item">
                                                        <i class="fa-solid fa-pen"></i> Edit
                                                    </a>
                                                    <a href="#" class="dropdown-item text-danger">
                                                        <i class="fa-solid fa-trash"></i> Delete
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="profile-detail-item">
                                            <div class="profile-detail-item1">
                                            <i class="fa-solid fa-envelope"></i>
                                            <span>Email: ${escapeHTML(userData.email || 'example@abc.com')}</span>
                                            </div>
                                             <div class="profile-detail-item-actions">
                                                <div class="action-dropdown-btn">
                                                    <i class="fa-solid fa-ellipsis"></i>
                                                </div>
                                                <div class="action-dropdown-content">
                                                    <a href="#" class="dropdown-item">
                                                        <i class="fa-solid fa-pen"></i> Edit
                                                    </a>
                                                    <a href="#" class="dropdown-item text-danger">
                                                        <i class="fa-solid fa-trash"></i> Delete
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="additional-info">
                                        <div class="workplace-section">
                                            <h5>Work Experience</h5>
                                            <div id="workplace-list">
                                                <!-- Workplace entries will be added here dynamically -->
                                            </div>
                                            <a href="#" class="add-info-link" id="add-workplace">
                                                <i class="fa-solid fa-plus"></i> Add Workplace
                                            </a>
                                        </div>

                                        <div class="education-section">
                                            <h5>Education</h5>
                                            <div id="education-list">
                                                <!-- Education entries will be added here dynamically -->
                                            </div>
                                            <a href="#" class="add-info-link" id="add-education">
                                                <i class="fa-solid fa-plus"></i> Add Education
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="interests-section">
                                <h3>Interests</h3>
                                <div class="interests-list">
                                    <div class="interests">
                                        <!-- Interests will be loaded here -->
                                    </div>
                                    <div class="interest-tag">
                                        <div class="interest-tag-item"><i class="fa-solid fa-camera"></i> Photography</div>
                                        <div class="interest-tag-item"><i class="fa-solid fa-code"></i> Web Development</div>
                                        <div class="interest-tag-item"><i class="fa-solid fa-hiking"></i> Hiking</div>
                                        <div class="interest-tag-item"><i class="fa-solid fa-book"></i> Reading</div>
                                        <div class="interest-tag-item"><i class="fa-solid fa-plane"></i> Travel</div>
                                        <div class="interest-tag-item"><i class="fa-solid fa-music"></i> Music</div>
                                        <div class="interest-tag-item"><i class="fa-solid fa-utensils"></i> Cooking</div>
                                        <div class="interest-tag-item"><i class="fa-solid fa-gamepad"></i> Gaming</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div id="connections-section" class="profile-section">
                            <div class="connections-container">
                                <div class="connections-tabs">
                                    <div class="connection-tab active" data-type="followers">Followers</div>
                                    <div class="connection-tab" data-type="following">Following</div>
                                </div>
                                <div class="connections-list" id="connections-list">
                                    <!-- Connections will be loaded dynamically -->
                                    <div class="connection-loader">
                                        <div class="loader"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div id="settings-section" class="profile-section">
                            <div class="settings-container">
                                <!-- Profile Images Section -->
                                <div class="settings-group">
                                    <h4>Profile Images</h4>
                                    <div class="profile-images-settings">
                                        <div class="cover-image-upload">
                                            <h5>Cover Photo</h5>
                                            <div class="image-preview">
                                                <img src="images/banner.png" alt="Cover" id="cover-preview">
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
                                                <img src="images/avatar.png" alt="Avatar" id="avatar-preview">
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

                                <!-- Basic Information -->
                                <div class="settings-group">
                                    <h4>Basic Information</h4>
                                    <form id="basic-info-form" class="settings-form">
                                        <div class="form-row">
                                            <div class="form-group">
                                                <label for="nickname">Display Name</label>
                                                <input type="text" id="nickname" name="nickname" placeholder="Your display name">
                                            </div>
                                            <div class="form-group">
                                                <label for="profession">Profession</label>
                                                <input type="text" id="profession" name="profession" placeholder="Your profession">
                                            </div>
                                        </div>
                                        <div class="form-group">
                                            <label for="bio">Bio</label>
                                            <textarea id="bio" name="bio" rows="3" placeholder="Tell us about yourself"></textarea>
                                        </div>
                                        <div class="form-row">
                                            <div class="form-group">
                                                <label for="location">Location</label>
                                                <input type="text" id="location" name="location" placeholder="Your location">
                                            </div>
                                            <div class="form-group">
                                                <label for="website">Website</label>
                                                <input type="url" id="website" name="website" placeholder="Your website">
                                            </div>
                                        </div>
                                    </form>
                                </div>

                                <!-- Contact Information -->
                                <div class="settings-group">
                                    <h4>Contact Information</h4>
                                    <form id="contact-info-form" class="settings-form">
                                        <div class="form-row">
                                            <div class="form-group">
                                                <label for="email">Email</label>
                                                <input type="email" id="email" name="email" placeholder="Your email">
                                            </div>
                                            <div class="form-group">
                                                <label for="phone">Phone</label>
                                                <input type="tel" id="phone" name="phone" placeholder="Your phone number">
                                            </div>
                                        </div>
                                    </form>
                                </div>

                                <!-- Social Links -->
                                <div class="settings-group">
                                    <h4>Social Links</h4>
                                    <form id="social-links-form" class="settings-form">
                                        <div class="form-group">
                                            <label for="github"><i class="fab fa-github"></i> GitHub</label>
                                            <input type="url" id="github" name="github" placeholder="GitHub profile URL">
                                        </div>
                                        <div class="form-group">
                                            <label for="linkedin"><i class="fab fa-linkedin"></i> LinkedIn</label>
                                            <input type="url" id="linkedin" name="linkedin" placeholder="LinkedIn profile URL">
                                        </div>
                                        <div class="form-group">
                                            <label for="twitter"><i class="fab fa-twitter"></i> Twitter</label>
                                            <input type="url" id="twitter" name="twitter" placeholder="Twitter profile URL">
                                        </div>
                                    </form>
                                </div>

                                <!-- Interests/Skills -->
                                <div class="settings-group">
                                    <h4>Interests & Skills</h4>
                                    <div class="interests-input-container">
                                        <input type="text" id="interest-input" placeholder="Add an interest or skill">
                                        <div id="add-interest" class="add-interest-btn">
                                            <i class="fa-solid fa-plus"></i>
                                        </div>
                                    </div>
                                    <div class="interests-tags" id="interests-tags">
                                        <!-- Interests will be added here dynamically -->
                                    </div>
                                </div>

                                <!-- Privacy Settings -->
                                <div class="settings-group">
                                    <h4>Privacy Settings</h4>
                                    <div class="privacy-settings">
                                        <div class="privacy-option">
                                            <label class="switch-label">
                                                <span>Profile Visibility</span>
                                                <select id="profile-visibility">
                                                    <option value="public">Public</option>
                                                    <option value="private">Private</option>
                                                    <option value="connections">Connections Only</option>
                                                </select>
                                            </label>
                                        </div>
                                        <div class="privacy-option">
                                            <label class="toggle-switch">
                                                <input type="checkbox" id="show-email">
                                                <span class="toggle-slider"></span>
                                                <span>Show email on profile</span>
                                            </label>
                                        </div>
                                        <div class="privacy-option">
                                            <label class="toggle-switch">
                                                <input type="checkbox" id="show-phone">
                                                <span class="toggle-slider"></span>
                                                <span>Show phone number on profile</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <!-- Save Changes -->
                                <div class="settings-actions">
                                    <div type="div" class="cancel-btn">Cancel</div>
                                    <div type="div" class="save-settings-btn">Save Changes</div>
                                </div>
                            </div>
                        </div>
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
                    </div>
                </div>
            </div>
            <div class="profile-page-right-column">
                <div class="profile-sidebar">
                    <div class="about-me-section">
                        <h3>About Me</h3>
                        <p class="about-me-text">${escapeHTML(userData.about || 'No description available')}</p>
                        <div class="profile-details-list">
                            <div class="profile-detail-item">
                                <i class="fa-solid fa-calendar-days"></i>
                                <span>Born: ${escapeHTML(userData.birthDate || 'Not specified')}</span>
                            </div>
                            <div class="profile-detail-item">
                                <i class="fa-solid fa-heart"></i>
                                <span>Status: ${escapeHTML(userData.relationshipStatus || 'Not specified')}</span>
                            </div>
                            <div class="profile-detail-item">
                                <i class="fa-solid fa-envelope"></i>
                                <span>Email: ${escapeHTML(userData.email || 'Not specified')}</span>
                            </div>
                        </div>
                    </div>
                    <div class="experience-section sidebar-section">
                        <div class="section-header">
                            <h3><i class="fa-solid fa-briefcase"></i> Experience</h3>
                            <div class="add-experience-btn">
                                <i class="fa-solid fa-plus"></i>
                            </div>
                        </div>
                        <div class="experience-list">
                            <div class="experience-item">
                                <div class="company-logo">
                                    <i class="fa-solid fa-building"></i>
                                </div>
                                <div class="experience-details">
                                    <h4>${escapeHTML(userData.currentRole || 'Software Engineer')}</h4>
                                    <p class="company">${escapeHTML(userData.currentCompany || 'Tech Company')}</p>
                                    <p class="duration"><i class="fa-regular fa-calendar"></i> 2020 - Present</p>
                                    <p class="location"><i class="fa-solid fa-location-dot"></i> ${escapeHTML(userData.workLocation || 'San Francisco, CA')}</p>
                                </div>
                            </div>
                            <div class="experience-item">
                                <div class="company-logo">
                                    <i class="fa-solid fa-building"></i>
                                </div>
                                <div class="experience-details">
                                    <h4>${escapeHTML(userData.previousRole || 'Junior Developer')}</h4>
                                    <p class="company">${escapeHTML(userData.previousCompany || 'Startup Inc')}</p>
                                    <p class="duration"><i class="fa-regular fa-calendar"></i> 2018 - 2020</p>
                                    <p class="location"><i class="fa-solid fa-location-dot"></i> ${escapeHTML(userData.previousLocation || 'New York, NY')}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="photos-section sidebar-section">
                        <div class="section-header">
                            <h3><i class="fa-solid fa-images"></i> Photos</h3>
                            <span class="photo-count">24 photos</span>
                        </div>
                        <div class="photos-grid">
                            <div class="photo-item">
                                <img src="./images/gallary1.jpg" alt="User photo">
                                <div class="photo-overlay">
                                    <i class="fa-solid fa-heart"></i> 45
                                </div>
                            </div>
                            <div class="photo-item">
                                <img src="./images/gallary2.webp" alt="User photo">
                                <div class="photo-overlay">
                                    <i class="fa-solid fa-heart"></i> 32
                                </div>
                            </div>
                            <div class="photo-item">
                                <img src="./images/gallary3.jpg" alt="User photo">
                                <div class="photo-overlay">
                                    <i class="fa-solid fa-heart"></i> 67
                                </div>
                            </div>
                            <div class="photo-item more-photos">
                            <img src="./images/gallary4.jpg" alt="User photo">
                                <div class="more-overlay">
                                    <i class="fa-solid fa-plus"></i>
                                    <span>21 more</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="friends-section sidebar-section">
                        <div class="section-header">
                            <h3><i class="fa-solid fa-user-group"></i> Friends</h3>
                            <span class="friend-count">234 friends</span>
                        </div>
                        <div class="friends-grid">
                            <div class="friend-item">
                                <img src="./images/avatar2.png" alt="Friend">
                                <div class="friend-info">
                                    <h4>Sarah Connor</h4>
                                    <p>12 mutual friends</p>
                                </div>
                                <div class="friend-status online"></div>
                            </div>
                            <div class="friend-item">
                                <img src="./images/avatar1.png" alt="Friend">
                                <div class="friend-info">
                                    <h4>John Smith</h4>
                                    <p>8 mutual friends</p>
                                </div>
                                <div class="friend-status"></div>
                            </div>
                            <div class="friend-item">
                                <img src="./images/avatar3.png" alt="Friend">
                                <div class="friend-info">
                                    <h4>Emma Wilson</h4>
                                    <p>15 mutual friends</p>
                                </div>
                                <div class="friend-status online"></div>
                            </div>
                            <div class="view-all-friends">
                                <div class="view-all-btn">
                                    View All Friends <i class="fa-solid fa-arrow-right"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        
    `;
}