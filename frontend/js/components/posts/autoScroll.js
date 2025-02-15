document.addEventListener('DOMContentLoaded', () => {
    function setupStorySlider() {
        const slider = document.querySelector('.stories-slider');
        if (!slider) return;

        // Clone the stories for infinite loop
        const stories = slider.children;
        const storiesArray = [...stories];
        
        // Only clone if there are stories to clone
        if (storiesArray.length > 0) {
            storiesArray.forEach(story => {
                const clone = story.cloneNode(true);
                slider.appendChild(clone);
            });
        }

        let currentScroll = 0;
        const scrollWidth = slider.scrollWidth / 2; // Half because we cloned the items
        const scrollSpeed = 0.5; // Reduced speed for smoother scrolling
        let isHovered = false;
        let isScrolling = true;

        // Pause on hover
        slider.addEventListener('mouseenter', () => isHovered = true);
        slider.addEventListener('mouseleave', () => isHovered = false);

        function autoScroll() {
            if (isHovered || !isScrolling) return;

            currentScroll += scrollSpeed;
            
            // Smooth reset when reaching the end
            if (currentScroll >= scrollWidth) {
                currentScroll = 0;
                slider.style.scrollBehavior = 'auto';
                slider.scrollLeft = 0;
                slider.style.scrollBehavior = 'smooth';
            } else {
                slider.scrollLeft = currentScroll;
            }
        }

        // Smooth animation using requestAnimationFrame
        function animate() {
            autoScroll();
            requestAnimationFrame(animate);
        }

        // Start animation
        animate();

        // Re-initialize when content changes
        const observer = new MutationObserver(() => {
            currentScroll = 0;
            slider.scrollLeft = 0;
            isScrolling = false;
            setTimeout(() => {
                isScrolling = true;
            }, 100);
        });

        observer.observe(slider, { childList: true, subtree: true });
    }

    // Initialize slider
    setupStorySlider();
});
