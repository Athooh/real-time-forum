
import { validatePassword } from '../../utils.js';
import { showNotification, NotificationType } from '../../utils/notifications.js';


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



