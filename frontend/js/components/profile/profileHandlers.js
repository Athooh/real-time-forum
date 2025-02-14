import { authenticatedFetch } from '../../security.js';
import { validatePassword } from '../../utils.js';
import { showNotification, NotificationType } from '../../utils/notifications.js';
import { setupInterestsDropdown } from './profileTemplate.js';

// Workplace form handlers
export function showWorkplaceForm() {
    document.querySelector('.workplace-form').style.display = 'block';
    document.querySelector('#add-workplace').style.display = 'none';
}

export function hideWorkplaceForm() {
    document.querySelector('.workplace-form').style.display = 'none';
    document.querySelector('#add-workplace').style.display = 'block';
}

export async function addWorkplace() {
    const companyName = document.querySelector('#company-name').value;
    const jobTitle = document.querySelector('#job-title').value;
    const category = document.querySelector('#company-category').value;
    const startDate = document.querySelector('#start-date').value;
    const endDate = document.querySelector('#end-date').value;
    const isCurrent = document.querySelector('#currently-working').checked;
    const location = document.querySelector('#work-location').value;

    if (!companyName || !jobTitle || !category || !startDate || (!endDate && !isCurrent)) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }

    try {
        const experienceData = {
            company_name: companyName,
            role: jobTitle,
            category: category,
            location: location,
            start_date: new Date(startDate).toISOString(),
            end_date: isCurrent ? null : new Date(endDate).toISOString(),
            is_current: isCurrent,
            description: '' // Optional field, can be added to the form if needed
        };

        const response = await createWorkExperience(experienceData);
        
        
        hideWorkplaceForm();

        // Clear form
        document.querySelector('#company-name').value = '';
        document.querySelector('#job-title').value = '';
        document.querySelector('#company-category').value = '';
        document.querySelector('#start-date').value = '';
        document.querySelector('#end-date').value = '';
        document.querySelector('#currently-working').checked = false;
        document.querySelector('#work-location').value = '';

        showNotification('Work experience added successfully', 'success');
    } catch (error) {
        console.error('Error adding work experience:', error);
        showNotification('Failed to add work experience', 'error');
    }
}



// Password form handlers
export function handlePasswordToggle(toggle) {
    const input = toggle.previousElementSibling;
    const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
    input.setAttribute('type', type);
    toggle.classList.toggle('fa-eye');
    toggle.classList.toggle('fa-eye-slash');
}

export function handlePasswordStrength(input) {
    const password = input.value;
    const validation = validatePassword(password);
    const strengthBar = document.querySelector('.strength-bar');
    
    // Calculate strength percentage based on validation criteria met
    const criteriaCount = validation.errors.length;
    const strengthPercentage = ((5 - criteriaCount) / 5) * 100;
    
    strengthBar.style.width = `${strengthPercentage}%`;
    
    // Update color based on strength
    if (strengthPercentage <= 20) {
        strengthBar.style.backgroundColor = '#ff4444';
    } else if (strengthPercentage <= 40) {
        strengthBar.style.backgroundColor = '#ffbb33';
    } else if (strengthPercentage <= 60) {
        strengthBar.style.backgroundColor = '#ffeb3b';
    } else if (strengthPercentage <= 80) {
        strengthBar.style.backgroundColor = '#00C851';
    } else {
        strengthBar.style.backgroundColor = '#007E33';
    }
}


export async function fetchUserSettings() {
    try {

        console.log("fetching user settings");
        const response = await authenticatedFetch('/api/users/about');

       
        if (!response.ok) {
            throw new Error('Failed to fetch user settings');
        }

        const data = await response.json();

        localStorage.setItem('userDataAbout', JSON.stringify(data));
        return {
            about: data.about || {},
            profile: data.profile || {}
        };
    } catch (error) {
        console.error('Error fetching user settings:', error);
        throw error;
    }
}

export async function updateUserSettings(settings) {
    try {
        // Create FormData to handle file uploads
        const formData = new FormData();

        // Add cover photo if changed
        const coverUpload = document.getElementById('cover-upload');
        if (coverUpload?.files[0]) {
            formData.append('cover_photo', coverUpload.files[0]);
        }

        // Add avatar if changed
        const avatarUpload = document.getElementById('avatar-upload');
        if (avatarUpload?.files[0]) {
            formData.append('avatar', avatarUpload.files[0]);
        }

        // Add other settings as JSON
        formData.append('settings', JSON.stringify(settings));

        const response = await authenticatedFetch('/api/users/about', {
            method: 'POST',
            body: formData
            // Note: Don't set Content-Type header, let the browser set it with the boundary
        });

        if (!response.ok) {
            throw new Error('Failed to update user settings');
        }

        return await response.json();
    } catch (error) {
        console.error('Error updating user settings:', error);
        throw error;
    }
}

export function setupImageUploadHandlers() {
    // Cover photo upload handler
    const coverUpload = document.getElementById('cover-upload');
    coverUpload?.addEventListener('change', (e) => handleImageUpload(e, 'cover-preview'));

    // Avatar upload handler
    const avatarUpload = document.getElementById('avatar-upload');
    avatarUpload?.addEventListener('change', (e) => handleImageUpload(e, 'avatar-preview'));
}

function handleImageUpload(event, previewId) {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
        showNotification('Please upload an image file', NotificationType.ERROR);
        return;
    }

    // Validate file size (e.g., max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
        showNotification('Image size should be less than 5MB', NotificationType.ERROR);
        return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
        const preview = document.getElementById(previewId);
        if (preview) {
            preview.src = e.target.result;
            // Store the file in a data attribute for later use
            preview.dataset.file = file.name;
        }
    };
    reader.readAsDataURL(file);
}

export function setupSettingsEventListeners() {
    // Add image upload handlers
    setupImageUploadHandlers();

    // Add interests dropdown setup
    setupInterestsDropdown();

    const saveButton = document.querySelector('.save-settings-btn');
    if (!saveButton) return;

    saveButton.addEventListener('click', async () => {
        try {
            // Get all selected interests from the interest tags
            const interestTags = document.querySelectorAll('.interest-tag');
            const interests = Array.from(interestTags)
                .map(tag => tag.dataset.interest)
                .join(',');

            // Get the date of birth value and convert it to ISO string
            const dateOfBirthInput = document.getElementById('dateOfBirth');
            const dateOfBirth = dateOfBirthInput?.value ? 
                new Date(dateOfBirthInput.value).toISOString() : null;
            

            const settings = {
                profile: {
                    nickname: document.getElementById('nickname')?.value || '',
                    email: document.getElementById('email')?.value || '',
                    profession: document.getElementById('profession')?.value || ''
                },
                about: {
                    bio: document.getElementById('bio')?.value || '',
                    date_of_birth: dateOfBirth,
                    relationship_status: document.getElementById('relationshipStatus')?.value || '',
                    location: document.getElementById('location')?.value || '',
                    website: document.getElementById('website')?.value || '',
                    github_url: document.getElementById('github')?.value || '',
                    linkedin_url: document.getElementById('linkedin')?.value || '',
                    twitter_url: document.getElementById('twitter')?.value || '',
                    phone_number: document.getElementById('phone')?.value || '',
                    interests: interests,
                    is_profile_public: document.getElementById('profile-visibility')?.value === 'public',
                    show_email: document.getElementById('show-email')?.checked || false,
                    show_phone: document.getElementById('show-phone')?.checked || false
                }
            };

            console.log("sending settings: ", settings);

            await updateUserSettings(settings);
            showNotification('Settings updated successfully', NotificationType.SUCCESS);
            
            // Refresh user data in localStorage
            const userData = await fetchUserSettings();
            localStorage.setItem('userDataAbout', JSON.stringify(userData));
            
        } catch (error) {
            console.error('Error updating user settings:', error);
            showNotification('Failed to update settings', NotificationType.ERROR);
        }
    });
}

export async function createWorkExperience(experienceData) {
    try {
        const response = await authenticatedFetch('/api/users/experience', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(experienceData)
        });

        if (!response.ok) {
            throw new Error('Failed to create work experience');
        }

        return await response.json();
    } catch (error) {
        console.error('Error creating work experience:', error);
        throw error;
    }
} 

export async function fetchUserExperience() {
    try {
        const response = await authenticatedFetch('/api/users/experience', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch user experience');
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching user experience:', error);
        throw error;
    }
}

export async function fetchUserFriends(limit = 3, page = 1) {
    try {
        const response = await authenticatedFetch(`/api/users/friends?limit=${limit}&page=${page}`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch friends');
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching friends:', error);
        throw error;
    }
}