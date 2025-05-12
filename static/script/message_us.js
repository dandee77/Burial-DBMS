document.addEventListener('DOMContentLoaded', function() {
    // Accordion functionality
    const accordionItems = document.querySelectorAll('.accordion-item');

    accordionItems.forEach(item => {
        const button = item.querySelector('button');
        const content = item.querySelector('.accordion-content');
        
        button.addEventListener('click', () => {
            const expanded = button.getAttribute('aria-expanded') === 'true';
            
            // Close all other accordions
            accordionItems.forEach(otherItem => {
                const otherButton = otherItem.querySelector('button');
                const otherContent = otherItem.querySelector('.accordion-content');
                
                if (otherButton !== button) {
                    otherButton.setAttribute('aria-expanded', 'false');
                }
            });
            
            // Toggle current accordion
            button.setAttribute('aria-expanded', !expanded);
        });
    });

    // Form submission handling
    const messageForm = document.getElementById('message-form');
    const feedbackMessage = document.getElementById('feedback-message');

    if (messageForm) {
        messageForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Simple form validation
            const nameInput = document.getElementById('name');
            const emailInput = document.getElementById('email');
            const messageInput = document.getElementById('message');
            
            if (!nameInput.value.trim() || !emailInput.value.trim() || !messageInput.value.trim()) {
                showFeedback('Please fill in all required fields.', false);
                return;
            }
            
            // Check email format
            const emailPattern = /^[^ ]+@[^ ]+\.[a-z]{2,}$/;
            if (!emailPattern.test(emailInput.value)) {
                showFeedback('Please enter a valid email address.', false);
                return;
            }
            
            // Mock form submission (in a real application, this would send data to a server)
            setTimeout(() => {
                showFeedback('Your message has been sent successfully! We will get back to you soon.', true);
                messageForm.reset();
            }, 1000);
        });
    }

    // Helper function to show feedback message
    function showFeedback(message, isSuccess) {
        feedbackMessage.textContent = message;
        feedbackMessage.className = 'feedback-message ' + (isSuccess ? 'message-success' : 'message-error');
        feedbackMessage.style.display = 'block';
        
        // Scroll to the feedback message
        feedbackMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        
        // Hide the message after 5 seconds if it's a success message
        if (isSuccess) {
            setTimeout(() => {
                feedbackMessage.style.display = 'none';
            }, 5000);
        }
    }
}); 