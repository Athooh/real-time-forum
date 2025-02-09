import { NotificationType, showNotification } from '../../utils/notifications.js';

const SelectedCategories = new Set();

function handleVideoUpload(e) {
    const file = e.target.files?.[0] || e.dataTransfer?.files?.[0];
    const previewArea = document.getElementById('videoPreviewArea');

    if (!file || !previewArea) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
        showNotification('Only video files are allowed', NotificationType.ERROR);
        return;
    }

    // Check file size
    const maxSize = 300 * 1024 * 1024;
    if (file.size > maxSize) {
        showNotification('Video file size must be less than 100MB', NotificationType.ERROR);
        return;
    }

    // Show loading spinner
    previewArea.innerHTML = `
        <div class="video-loading">
            <div class="spinner"></div>
            <p>Uploading video...</p>
        </div>
    `;

    const reader = new FileReader();
    reader.onload = function(e) {
        previewArea.innerHTML = `
            <div class="video-preview">
                <video controls class="modal-video-player">
                    <source src="${e.target.result}" type="${file.type}">
                    Your browser does not support the video tag.
                </video>
                <button type="button" class="remove-video" aria-label="Remove video">&times;</button>
            </div>
        `;

        // Add remove functionality
        previewArea.querySelector('.remove-video').addEventListener('click', function() {
            previewArea.innerHTML = '';
            const fileInput = document.getElementById('video-upload');
            if (fileInput) fileInput.value = '';
        });

        // Auto-adjust video height based on aspect ratio
        const video = previewArea.querySelector('video');
        video.addEventListener('loadedmetadata', function() {
            const aspectRatio = this.videoHeight / this.videoWidth;
            const width = this.offsetWidth;
            this.style.height = `${width * aspectRatio}px`;
        });
    };
    reader.readAsDataURL(file);
}

function setupVideoDropZone() {
    const dropZone = document.getElementById('videoDropZone');
    const fileInput = document.getElementById('video-upload');

    if (!dropZone || !fileInput) return;

    dropZone.addEventListener('click', () => fileInput.click());
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.add('dragover');
        });
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.remove('dragover');
        });
    });

    dropZone.addEventListener('drop', (e) => {
        handleVideoUpload({ dataTransfer: e.dataTransfer });
    });
}

// Add these new functions to handle category selection
function handleCategorySelection(e) {
    const dropdown = e.target;
    const selectedCategoriesContainer = dropdown.closest('.category-selection').querySelector('.selected-categories');
    
    const selectedValue = dropdown.value;
    const selectedText = dropdown.options[dropdown.selectedIndex].text;
    
    // Return if "Select category" is chosen
    if (!selectedValue || selectedValue === 'default') {
        return;
    }
    
    // Check if category is already selected
    const existingCategories = Array.from(selectedCategoriesContainer.querySelectorAll('.remove-category'))
        .map(el => el.dataset.value);
    if (existingCategories.includes(selectedValue)) {
        showNotification('This category is already selected', NotificationType.ERROR);
        dropdown.value = 'default'; // Reset to default option
        return;
    }
    
    // Check maximum categories limit
    const currentCategories = selectedCategoriesContainer.querySelectorAll('.category-tag').length;
    if (currentCategories >= 5) {
        showNotification('You can only select up to 5 categories at once', NotificationType.ERROR);
        dropdown.value = 'default'; // Reset to default option
        return;
    }
    SelectedCategories.add(selectedValue);

    // Create and append the category tag
    const categoryTag = document.createElement('div');
    categoryTag.className = 'category-tag selected';
    categoryTag.innerHTML = `
        ${selectedText}
        <span class="remove-category" data-value="${selectedValue}">×</span>
    `;
    selectedCategoriesContainer.appendChild(categoryTag);
    
    // Reset dropdown to default "Select category" option
    dropdown.value = 'default';

    // Handle category removal
    categoryTag.querySelector('.remove-category').addEventListener('click', function() {
        categoryTag.remove();
        SelectedCategories.delete(selectedValue);
    });
}
 function handleImageUpload(e) {
    const files = Array.from(e.target.files || e.dataTransfer?.files || []);
    const previewArea = document.getElementById('imagePreviewArea');
    const existingPreviews = previewArea?.querySelectorAll('.image-preview')?.length || 0;
    const maxImages = 5;

    if (!previewArea) return;

    // Check total number of images (existing + new)
    if (existingPreviews + files.length > maxImages) {
        showNotification(`Maximum ${maxImages} images allowed`, NotificationType.ERROR);
        return;
    }

    files.forEach(file => {
        // Validate file type
        if (!file.type.startsWith('image/')) {
            showNotification('Only image files are allowed', NotificationType.ERROR);
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.createElement('div');
            preview.className = 'image-preview';
            preview.innerHTML = `
                <img src="${e.target.result}" alt="Preview">
                <button type="button" class="remove-image" aria-label="Remove image">&times;</button>
            `;
            previewArea.appendChild(preview);

            // Add remove functionality
            preview.querySelector('.remove-image').addEventListener('click', function() {
                preview.remove();
                // Reset file input if all previews are removed
                if (previewArea.querySelectorAll('.image-preview').length === 0) {
                    const fileInput = document.getElementById('image-upload');
                    if (fileInput) fileInput.value = '';
                }
            });
        };
        reader.readAsDataURL(file);
    });
 }
 function setupDropZone() {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('image-upload');
    const previewArea = document.getElementById('imagePreviewArea');

    if (!dropZone || !fileInput || !previewArea) return;

    dropZone.addEventListener('click', () => fileInput.click());
    
    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults);
        document.body.addEventListener(eventName, preventDefaults);
    });

    // Handle drag states
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.add('dragover');
        });
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.remove('dragover');
        });
    });

    // Handle dropped files
    dropZone.addEventListener('drop', (e) => {
        handleImageUpload({ dataTransfer: e.dataTransfer });
    });
}

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}


export {
    handleCategorySelection,
    setupVideoDropZone,
    handleVideoUpload,
    handleImageUpload,
    setupDropZone,
    SelectedCategories
};