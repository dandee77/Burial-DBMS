document.addEventListener('DOMContentLoaded', function() {
    const pinDigits = document.querySelectorAll('.pin-digit');
    const keypadBtns = document.querySelectorAll('.keypad-btn[data-value]');
    const clearBtn = document.getElementById('clearBtn');
    const submitBtn = document.getElementById('submitBtn');
    const errorMessage = document.getElementById('errorMessage');
    
    let currentIndex = 0;
    
    // Add click event to number buttons
    keypadBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            if (currentIndex < pinDigits.length) {
                const digit = this.getAttribute('data-value');
                pinDigits[currentIndex].value = digit;
                currentIndex++;
                
                // Auto-submit when all digits are filled
                if (currentIndex === pinDigits.length) {
                    setTimeout(() => {
                        verifyPin();
                    }, 300);
                }
            }
        });
    });
    
    // Clear button functionality
    clearBtn.addEventListener('click', function() {
        pinDigits.forEach(input => {
            input.value = '';
        });
        currentIndex = 0;
        errorMessage.style.display = 'none';
    });
    
    // Submit button functionality
    submitBtn.addEventListener('click', verifyPin);
    
    function verifyPin() {
        const pin = Array.from(pinDigits).map(input => input.value).join('');
        
        // Check if all digits are filled
        if (pin.length !== 4) {
            errorMessage.textContent = 'Please enter all 4 digits';
            errorMessage.style.display = 'block';
            return;
        }
        
        // Send PIN to server for verification
        fetch('/admin/verify-pin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ pin: pin }),
            credentials: 'include'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Store admin authentication status in localStorage
                localStorage.setItem('admin_authenticated', 'true');
                
                // Redirect to admin dashboard
                window.location.href = '/admin/dashboard';
            } else {
                // Show error
                errorMessage.textContent = data.message || 'Invalid PIN. Please try again.';
                errorMessage.style.display = 'block';
                
                // Clear the PIN inputs
                pinDigits.forEach(input => {
                    input.value = '';
                });
                currentIndex = 0;
            }
        })
        .catch(error => {
            console.error('Error:', error);
            errorMessage.textContent = 'An error occurred. Please try again.';
            errorMessage.style.display = 'block';
            
            // Clear the PIN inputs
            pinDigits.forEach(input => {
                input.value = '';
            });
            currentIndex = 0;
        });
    }
}); 