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

export { fetchUserPhotos  , handlePasswordSubmit};