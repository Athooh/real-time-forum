document.addEventListener('DOMContentLoaded', () => {
    function setupStorySlider() {
        const slider = document.querySelector('.stories-slider');
        if (!slider) return;

        // Clone the stories for infinite loop
        const stories = slider.children;
        [...stories].forEach(story => {
            const clone = story.cloneNode(true);
            slider.appendChild(clone);
        });

        let currentScroll = 0;
        const scrollWidth = slider.scrollWidth / 2; // Half because we cloned the items
        const scrollSpeed = 2; // Adjust speed as needed
        let isHovered = false;

        // Pause on hover
        slider.addEventListener('mouseenter', () => isHovered = true);
        slider.addEventListener('mouseleave', () => isHovered = false);

        function autoScroll() {
            if (isHovered) return;

            currentScroll += scrollSpeed;
            
            // Reset scroll position when reaching the cloned set
            if (currentScroll >= scrollWidth) {
                currentScroll = 0;
                slider.scrollLeft = 0;
            } else {
                slider.scrollLeft = currentScroll;
            }
        }

        // Smooth animation using requestAnimationFrame
        function animate() {
            autoScroll();
            requestAnimationFrame(animate);
        }

        animate();
    }

    // Initialize slider
    setupStorySlider();

    // Re-initialize slider when content changes
    const observer = new MutationObserver(setupStorySlider);
    const storiesSection = document.querySelector('.stories-section');
    if (storiesSection) {
        observer.observe(storiesSection, { childList: true, subtree: true });
    }
});
