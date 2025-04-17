document.addEventListener('DOMContentLoaded', function() {
    const accordionButtons = document.querySelectorAll('.accordion button');
    
    // Calculate and set max-height for smooth transitions
    function setAccordionHeights() {
        document.querySelectorAll('.accordion-item').forEach(item => {
            const content = item.querySelector('.accordion-content');
            
            if (content) {
                // Calculate total height of all content
                let totalHeight = 0;
                content.querySelectorAll('p').forEach(p => {
                    totalHeight += p.scrollHeight;
                });
                
                // Add padding (32px top and bottom)
                content.style.setProperty('--max-height', `${totalHeight + 32}px`);
            }
        });
    }

    // Initialize heights
    setAccordionHeights();
    
    // Update on window resize
    window.addEventListener('resize', setAccordionHeights);

    accordionButtons.forEach(button => {
        button.addEventListener('click', function() {
            const isExpanded = this.getAttribute('aria-expanded') === 'true';
            const content = this.nextElementSibling;
            
            // Close all others if opening this one
            if (!isExpanded) {
                accordionButtons.forEach(otherButton => {
                    if (otherButton !== button && otherButton.getAttribute('aria-expanded') === 'true') {
                        otherButton.setAttribute('aria-expanded', 'false');
                        otherButton.nextElementSibling.style.maxHeight = '0';
                    }
                });
            }
            
            this.setAttribute('aria-expanded', !isExpanded);
            content.style.maxHeight = isExpanded ? '0' : 'var(--max-height)';
        });
    });
});