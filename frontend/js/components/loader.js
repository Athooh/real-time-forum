function createLoader() {
    return `
        <div class="loader-container">
            <div class="loader"></div>
            <p class="loader-text">Loading...</p>
        </div>
    `;
}

function showLoader() {
    const loader = document.createElement('div');
    loader.id = 'global-loader';
    loader.innerHTML = createLoader();
    document.body.appendChild(loader);
}

function hideLoader() {
    const loader = document.getElementById('global-loader');
    if (loader) {
        loader.remove();
    }
}

// Export for use in other components
window.createLoader = createLoader;
window.showLoader = showLoader;
window.hideLoader = hideLoader; 