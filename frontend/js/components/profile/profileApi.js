import { authenticatedFetch } from "../../security.js";
import { showNotification, NotificationType } from "../../utils/notifications.js";
import { validatePassword } from "../../utils.js";

async function fetchUserPhotos(userId) {
    try {
        const response = await authenticatedFetch(`/api/users/photos?userId=${userId}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch user photos');
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching user photos:', error);
        throw error;
    }
} 

 async function handlePasswordSubmit(e) {
    e.preventDefault();
    
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    // Validate password requirements
    const validation = validatePassword(newPassword);
    if (!validation.isValid) {
        showNotification(validation.errors[0],NotificationType.ERROR);
        return;
    }

     console.log("newPassword", newPassword);
     console.log("confirmPassword", confirmPassword);
    // Check if passwords match
    if (newPassword !== confirmPassword) {
        showNotification('New passwords do not match',NotificationType.ERROR);
        return;
    }

    try {
        const response = await fetch('/api/users/password', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                currentPassword,
                newPassword
            })
        });

        const data = await response.json();

        if (response.ok) {
            showNotification('Password updated successfully',NotificationType.SUCCESS);
            // Clear the form
            e.target.reset();
        } else {
            showNotification(data.error || 'Failed to update password',NotificationType.ERROR);
        }
    } catch (error) {
        console.error('Error updating password:', error);
        showNotification('An error occurred while updating password',NotificationType.ERROR);
    }
 }

 async function loadConnections(type = 'followers', page = 1) {
    try {
        const response = await authenticatedFetch(`/api/users/${type}?page=${page}&limit=10`);
        if (!response.ok) {
            throw new Error(`Failed to fetch ${type}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(`Error loading ${type}:`, error);
        return { connections: [], totalCount: 0 };
    }
 }

  async function fetchUserSettings() {
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

 async function updateUserSettings(settings) {
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

 async function createWorkExperience(experienceData) {
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

 async function fetchUserExperience() {
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

 async function fetchUserFriends(limit = 3, page = 1) {
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
export {
    fetchUserPhotos,
    handlePasswordSubmit,
    loadConnections,
    fetchUserSettings,
    updateUserSettings,
    createWorkExperience,
    fetchUserExperience,
    fetchUserFriends
};