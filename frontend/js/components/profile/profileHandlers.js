import { validatePassword } from '../../utils.js';

// Workplace form handlers
export function showWorkplaceForm() {
    document.querySelector('.workplace-form').style.display = 'block';
    document.querySelector('#add-workplace').style.display = 'none';
}

export function hideWorkplaceForm() {
    document.querySelector('.workplace-form').style.display = 'none';
    document.querySelector('#add-workplace').style.display = 'block';
}

export function addWorkplace() {
    const companyName = document.querySelector('#company-name').value;
    const jobTitle = document.querySelector('#job-title').value;
    const duration = document.querySelector('#work-duration').value;
    const location = document.querySelector('#work-location').value;

    if (!companyName || !jobTitle || !duration) {
        alert('Please fill in all required fields');
        return;
    }

    const workplaceHTML = `
        <div class="workplace-entry">
            <h6>${jobTitle} at ${companyName}</h6>
            <p class="duration">${duration}</p>
            ${location ? `<p class="location">${location}</p>` : ''}
        </div>
    `;

    document.querySelector('#workplace-list').insertAdjacentHTML('beforeend', workplaceHTML);
    hideWorkplaceForm();

    // Clear form
    document.querySelector('#company-name').value = '';
    document.querySelector('#job-title').value = '';
    document.querySelector('#work-duration').value = '';
    document.querySelector('#work-location').value = '';
}

// Education form handlers
export function showEducationForm() {
    document.querySelector('.education-form').style.display = 'block';
    document.querySelector('#add-education').style.display = 'none';
}

export function hideEducationForm() {
    document.querySelector('.education-form').style.display = 'none';
    document.querySelector('#add-education').style.display = 'block';
}

export function addEducation() {
    const schoolName = document.querySelector('#school-name').value;
    const degree = document.querySelector('#degree').value;
    const duration = document.querySelector('#education-duration').value;
    const location = document.querySelector('#education-location').value;

    if (!schoolName || !degree || !duration) {
        alert('Please fill in all required fields');
        return;
    }

    const educationHTML = `
        <div class="education-entry">
            <h6>${degree} from ${schoolName}</h6>
            <p class="duration">${duration}</p>
            ${location ? `<p class="location">${location}</p>` : ''}
        </div>
    `;

    document.querySelector('#education-list').insertAdjacentHTML('beforeend', educationHTML);
    hideEducationForm();

    // Clear form
    document.querySelector('#school-name').value = '';
    document.querySelector('#degree').value = '';
    document.querySelector('#education-duration').value = '';
    document.querySelector('#education-location').value = '';
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
    const strength = validatePassword(input.value);
    const strengthBar = document.querySelector('.strength-bar');
    
    strengthBar.classList.remove('strength-weak', 'strength-medium', 'strength-strong');
    
    if (input.value.length === 0) {
        strengthBar.style.width = '0';
    } else if (!strength.isValid && strength.errors.length > 2) {
        strengthBar.classList.add('strength-weak');
    } else if (!strength.isValid) {
        strengthBar.classList.add('strength-medium');
    } else {
        strengthBar.classList.add('strength-strong');
    }
}

export function handlePasswordSubmit(e) {
    e.preventDefault();
    // Add your password change logic here
} 