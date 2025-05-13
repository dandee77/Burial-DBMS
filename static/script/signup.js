document.addEventListener('DOMContentLoaded', function() {
    const signupForm = document.getElementById('signupForm');
    const popupMessage = document.getElementById('popupMessage');

    signupForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Reset any previous error message
        popupMessage.textContent = '';
        popupMessage.className = 'popup-message';
        popupMessage.style.display = 'none';
        
        // Collect form data
        const formData = new FormData(signupForm);
        
        // Submit form via fetch API
        fetch('/submit-client', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            // Check if the response is JSON (indicating an error)
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return response.json().then(data => {
                    if (!response.ok) {
                        throw new Error(data.detail || 'An error occurred during signup');
                    }
                    return data;
                });
            } else {
                // If response is OK and not JSON, it's the HTML redirect
                if (response.ok) {
                    // Process the HTML response
                    return response.text().then(html => {
                        // Parse the HTML to extract access_token and client_id
                        const tokenMatch = html.match(/localStorage\.setItem\('access_token', '(.+?)'\)/);
                        const clientIdMatch = html.match(/localStorage\.setItem\('client_id', '(.+?)'\)/);
                        
                        if (tokenMatch && tokenMatch[1] && clientIdMatch && clientIdMatch[1]) {
                            // Store token and client ID
                            localStorage.setItem('access_token', tokenMatch[1]);
                            localStorage.setItem('client_id', clientIdMatch[1]);
                            
                            // Redirect to dashboard
                            window.location.href = '/dashboard';
                        } else {
                            // If can't extract token and client_id, just use the HTML as is
                            document.open();
                            document.write(html);
                            document.close();
                        }
                    });
                }
                return response.text().then(text => {
                    throw new Error('Server returned non-JSON response');
                });
            }
        })
        .catch(error => {
            console.error('Signup error:', error);
            
            // Show error message to user
            popupMessage.textContent = error.message === 'Email already registered' ? 
                'This email is already registered. Please use a different email or log in.' : 
                error.message;
            popupMessage.className = 'popup-message popup-error';
            popupMessage.style.display = 'block';
        });
    });
}); 