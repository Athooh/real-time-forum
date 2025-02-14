document.addEventListener('DOMContentLoaded', () => {
    const slider = document.querySelector('.stories-slider.auto-scroll');
    if (slider) {
        let scrollAmount = 0;
        const scrollStep = 1; // Adjust the scroll speed
        const scrollInterval = 20; // Adjust the scroll interval

        function autoScroll() {
            if (scrollAmount >= slider.scrollWidth - slider.clientWidth) {
                scrollAmount = 0;
                slider.scrollLeft = 0;
            } else {
                scrollAmount += scrollStep;
                slider.scrollLeft += scrollStep;
            }
        }

        setInterval(autoScroll, scrollInterval);
    }
});