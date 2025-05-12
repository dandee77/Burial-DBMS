const form = document.getElementById("loginForm");
const popup = document.getElementById("popupMessage");

// Function to show popup message
function showPopup(message, isError = false) {
    popup.textContent = message;
    popup.className = `popup-message ${isError ? 'popup-error' : 'popup-success'}`;
    popup.style.display = "block";
    
    // Hide popup after 5 seconds if it's an error
    if (isError) {
        setTimeout(() => {
            popup.style.display = "none";
        }, 5000);
    }
}

form.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    try {
        const formData = new FormData(form);
        const response = await fetch("/login", {
            method: "POST",
            body: formData,
            headers: {
                'Accept': 'application/json'
            },
            credentials: 'include' // Important for cookies
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.detail || 'Login failed');
        }

        if (data.message === "Login successful" && data.access_token) {
            // Show success message
            showPopup("Login successful! Redirecting...", false);
            
            // Store the access token and client_id
            localStorage.setItem('access_token', data.access_token);
            
            // Store client_id if provided in the response
            if (data.client_id) {
                localStorage.setItem('client_id', data.client_id);
            }
            
            // Set the token in the default headers for future requests
            const token = data.access_token;
            if (token) {
                localStorage.setItem('access_token', token);
                // Set default Authorization header for future fetch requests
                window.fetch = new Proxy(window.fetch, {
                    apply: function(fetch, that, args) {
                        const [resource, config] = args;
                        const headers = {
                            ...config?.headers,
                            'Authorization': `Bearer ${token}`
                        };
                        const newConfig = {...config, headers, credentials: 'include'};
                        return fetch.apply(that, [resource, newConfig]);
                    }
                });
            }
            
            // Redirect after a short delay
            setTimeout(() => {
                window.location.href = "/dashboard";
            }, 1000);
        } else {
            throw new Error('Authentication failed');
        }
    } catch (error) {
        // Show error message
        showPopup(error.message || "Login failed. Please check your credentials.", true);
        form.reset();
    }
});