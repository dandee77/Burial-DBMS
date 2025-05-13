document.addEventListener('DOMContentLoaded', function() {
    let pendingOrderId = null;

    const modal = document.getElementById("paymentModal");
    const confirmBtn = document.getElementById("confirmPaymentBtn");
    const cancelBtn = document.getElementById("cancelPaymentBtn");
    const modalMsg = document.getElementById("modalMessage");

    function formatCurrency(value) {
        return value ? `₱${parseFloat(value).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '₱0.00';
    }

    // Helper function for API calls
    async function fetchWithAuth(url, options = {}) {
        const token = localStorage.getItem('access_token');
        if (!token) {
            throw new Error('No authentication token found');
        }

        const defaultOptions = {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        };

        // Merge options, ensuring headers are properly combined
        const mergedOptions = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...(options.headers || {})
            }
        };

        try {
            const response = await fetch(url, mergedOptions);
            
            // Handle authentication errors
            if (response.status === 401) {
                // Redirect to login page if unauthorized
                window.location.href = '/login';
                throw new Error('Please log in to continue');
            }
            
            return response;
        } catch (error) {
            console.error('Fetch error:', error);
            throw error;
        }
    }

    // Function to get client ID if missing
    async function getClientIdIfMissing() {
        // If client ID is already in localStorage, return it
        let clientId = localStorage.getItem('client_id');
        if (clientId) {
            return clientId;
        }

        // Otherwise, try to get it from the server
        try {
            // Make an authenticated request to a user info endpoint
            const response = await fetchWithAuth('/api/user/info');
            if (!response.ok) {
                throw new Error('Failed to get user info');
            }
            
            const userData = await response.json();
            if (userData && userData.client_id) {
                // Save client ID for future use
                localStorage.setItem('client_id', userData.client_id);
                return userData.client_id;
            } else {
                throw new Error('Client ID not found in user data');
            }
        } catch (error) {
            console.error('Error getting client ID:', error);
            // If we can't get the client ID, redirect to login
            window.location.href = '/login';
            throw error;
        }
    }

    // Show loading state
    function showLoading() {
        const container = document.getElementById('contracts-container');
        container.innerHTML = `
            <div class="loading-message">
                <i class="fas fa-spinner fa-spin"></i> Loading your contracts...
            </div>
        `;
    }

    // Show error message
    function showError(message) {
        const container = document.getElementById('contracts-container');
        container.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>${message}</p>
            </div>
        `;
    }

    // Fetch and display contracts
    async function fetchAndDisplayContracts() {
        // Define container first thing
        const container = document.getElementById('contracts-container');
        
        showLoading();
        
        try {
            // Get client ID from localStorage or API if missing
            let clientId;
            try {
                clientId = await getClientIdIfMissing();
            } catch (error) {
                // If we can't get the client ID, show an error
                showError('Unable to identify your account. Please log in again.');
                return;
            }

            // Use the explicit client ID endpoint
            const response = await fetchWithAuth(`/api/contracts/client/${clientId}`);
            
            // Special handling for 404 "No contracts found" case
            if (response.status === 404) {
                const errorData = await response.json();
                // Check if this is our specific "No contracts found" message
                if (errorData.message && errorData.message.includes("No contracts found")) {
                    // This is an expected case, not an error
                    container.innerHTML = `
                        <div class="no-contracts">
                            <i class="fas fa-info-circle"></i>
                            <p>You don't have any active contracts yet.</p>
                            <p>You can <a href="/dashboard/buyaplan" class="link-buy-plan">purchase a plan</a> to get started or 
                            <a href="/dashboard/message_us" class="link-contact">contact us</a> if you think this is an error.</p>
                            <div class="no-contracts-actions">
                                <a href="/dashboard/buyaplan" class="btn-buy-plan">Buy a Plan</a>
                                <a href="/dashboard/message_us" class="btn-contact-us">Contact Us</a>
                            </div>
                        </div>
                    `;
                    return;
                }
            }
            
            if (!response.ok) {
                const error = await response.json();
                console.error('API error response:', error);
                let errorMsg = 'Failed to fetch contracts';
                
                if (error.detail) {
                    if (Array.isArray(error.detail)) {
                        // If it's a validation error with multiple issues
                        errorMsg = error.detail.map(err => `${err.loc.join('.')}: ${err.msg}`).join('; ');
                    } else {
                        // If it's a simple string message
                        errorMsg = error.detail;
                    }
                } else {
                    // If no detail, stringify the entire error
                    errorMsg = JSON.stringify(error);
                }
                
                throw new Error(errorMsg);
            }

            const contracts = await response.json();
            
            if (!contracts || contracts.length === 0) {
                container.innerHTML = `
                    <div class="no-contracts">
                        <i class="fas fa-info-circle"></i>
                        <p>You don't have any active contracts yet.</p>
                        <p>You can <a href="/dashboard/buyaplan" class="link-buy-plan">purchase a plan</a> to get started or 
                        <a href="/dashboard/message_us" class="link-contact">contact us</a> if you think this is an error.</p>
                        <div class="no-contracts-actions">
                            <a href="/dashboard/buyaplan" class="btn-buy-plan">Buy a Plan</a>
                            <a href="/dashboard/message_us" class="btn-contact-us">Contact Us</a>
                        </div>
                    </div>
                `;
                return;
            }

            container.innerHTML = '';
            contracts.forEach(contract => {
                const orderDate = contract.order_date ? new Date(contract.order_date).toLocaleDateString() : 'N/A';
                const lastPaymentDate = contract.latest_payment_date ? new Date(contract.latest_payment_date).toLocaleDateString() : 'N/A';
                const statusBadge = contract.years_to_pay > 0 ? '<span class="status-badge unpaid">UNPAID</span>' : '<span class="status-badge paid">PAID</span>';

                const card = document.createElement('div');
                card.className = 'contract-card';
                card.dataset.expanded = 'false';
                card.dataset.slotid = contract.slot_id; // Add slot_id as data attribute for later use
                card.innerHTML = `
                    <div class="contract-summary">
                        <div class="summary-header">
                            <h3>Contract #${contract.order_id}</h3>
                            ${statusBadge}
                        </div>
                        <div class="summary-details">
                            <div class="detail-row"><span class="detail-label">Slot ID:</span><span class="detail-value">${contract.slot_id}</span></div>
                            <div class="detail-row"><span class="detail-label">Slot Type:</span><span class="detail-value">${contract.slot_type || 'Not Specified'}</span></div>
                            <div class="detail-row"><span class="detail-label">Total Amount:</span><span class="detail-value">${formatCurrency(contract.final_price)}</span></div>
                            ${contract.monthly_amortization > 0 ? `
                                <div class="detail-row"><span class="detail-label">Monthly Payment:</span><span class="detail-value">${formatCurrency(contract.monthly_amortization)}</span></div>
                                <div class="detail-row"><span class="detail-label">Remaining Term:</span><span class="detail-value">${contract.years_to_pay} months</span></div>
                            ` : ''}
                        </div>
                    </div>
                    <div class="contract-full-details" style="display: none;">
                        <div class="details-grid">
                            <div class="detail-group">
                                <h4>Contract Information</h4>
                                <div class="detail-row"><span class="detail-label">Order Date:</span><span class="detail-value">${orderDate}</span></div>
                                <div class="detail-row"><span class="detail-label">Contract Price:</span><span class="detail-value">${formatCurrency(contract.contract_price)}</span></div>
                                <div class="detail-row"><span class="detail-label">VAT (${contract.vat_percent.toFixed(1)}%):</span><span class="detail-value">${formatCurrency(contract.vat_amount)}</span></div>
                                <div class="detail-row"><span class="detail-label">Price with VAT:</span><span class="detail-value">${formatCurrency(contract.price_with_vat)}</span></div>
                            </div>
                            <div class="detail-group">
                                <h4>Payment Details</h4>
                                <div class="detail-row"><span class="detail-label">Payment Method:</span><span class="detail-value">${contract.payment_method || 'N/A'}</span></div>
                                <div class="detail-row"><span class="detail-label">Admin Fee:</span><span class="detail-value">${formatCurrency(contract.admin_fee)}</span></div>
                                <div class="detail-row"><span class="detail-label">Spot Cash Total:</span><span class="detail-value">${formatCurrency(contract.spot_cash_total)}</span></div>
                                ${contract.latest_payment_date ? `<div class="detail-row"><span class="detail-label">Last Payment:</span><span class="detail-value">${lastPaymentDate}</span></div>` : ''}
                            </div>
                            ${contract.monthly_amortization > 0 ? `
                            <div class="detail-group">
                                <h4>Installment Plan</h4>
                                <div class="detail-row"><span class="detail-label">Interest Rate:</span><span class="detail-value">${(contract.interest_rate * 100).toFixed(2)}%</span></div>
                                <div class="detail-row"><span class="detail-label">Down Payment:</span><span class="detail-value">${formatCurrency(contract.down_payment)}</span></div>
                            </div>
                            ` : ''}
                            
                            <!-- Deceased Information Section - Will be populated later -->
                            <div class="detail-group deceased-information" data-loaded="false">
                                <h4>Deceased Information</h4>
                                <div class="deceased-loading">
                                    <i class="fas fa-spinner fa-spin"></i> Loading deceased information...
                                </div>
                                <div class="deceased-content"></div>
                            </div>
                        </div>
                    </div>
                    <div class="contract-actions">
                        <button class="btn-pay-now" ${contract.years_to_pay < 1 ? 'disabled' : ''} data-id="${contract.order_id}" data-amount="${contract.monthly_amortization}">
                            <i class="fas fa-credit-card"></i> Pay Now
                        </button>
                        <button class="btn-view-details">
                            <i class="fas fa-chevron-down"></i> View Details
                        </button>
                    </div>
                `;
                container.appendChild(card);
            });

            // Set up event listeners for the newly created elements
            setupEventListeners();
        } catch (error) {
            console.error("Error fetching contracts:", error);
            showError(error.message || 'Failed to load contracts. Please refresh the page or contact support if the problem persists.');
        }
    }

    function setupEventListeners() {
        document.querySelectorAll('.btn-view-details').forEach(button => {
            button.addEventListener('click', function() {
                const card = this.closest('.contract-card');
                const detailsSection = card.querySelector('.contract-full-details');
                const icon = this.querySelector('i');
                const isExpanded = card.dataset.expanded === 'true';
                
                // Toggle visibility of details section
                detailsSection.style.display = isExpanded ? 'none' : 'block';
                
                // Update button icon and text
                icon.className = isExpanded ? 'fas fa-chevron-down' : 'fas fa-chevron-up';
                this.innerHTML = isExpanded ? '<i class="fas fa-chevron-down"></i> View Details' : '<i class="fas fa-chevron-up"></i> Hide Details';
                
                // Update expanded state
                card.dataset.expanded = (!isExpanded).toString();
                
                // If expanded and deceased info not loaded yet, fetch it
                if (!isExpanded) {
                    const deceasedSection = detailsSection.querySelector('.deceased-information');
                    const slotId = card.dataset.slotid;
                    
                    if (deceasedSection && deceasedSection.dataset.loaded === 'false' && slotId) {
                        fetchAndDisplayDeceasedInfo(slotId, deceasedSection);
                    }
                }
            });
        });

        document.querySelectorAll('.btn-pay-now').forEach(button => {
            button.addEventListener('click', function () {
                pendingOrderId = this.getAttribute('data-id');
                const amount = this.getAttribute('data-amount');
                modalMsg.textContent = `Confirm payment of ${formatCurrency(amount)} for Contract #${pendingOrderId}?`;
                modal.style.display = 'flex';
            });
        });
    }

    // New function to fetch and display deceased information
    async function fetchAndDisplayDeceasedInfo(slotId, deceasedSection) {
        const loadingElement = deceasedSection.querySelector('.deceased-loading');
        const contentElement = deceasedSection.querySelector('.deceased-content');
        
        try {
            // Mark as loading
            loadingElement.style.display = 'block';
            contentElement.innerHTML = '';
            
            // Fetch deceased information
            const response = await fetchWithAuth(`/api/slot/${slotId}`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch deceased information');
            }
            
            const data = await response.json();
            
            // Remove loading indicator
            loadingElement.style.display = 'none';
            
            if (!data || data.length === 0) {
                contentElement.innerHTML = '<div class="no-deceased-info">No deceased information available.</div>';
                return;
            }
            
            // Process and display deceased information
            let deceasedCount = 0;
            let html = '';
            
            data.forEach(item => {
                if (item.name) {
                    deceasedCount++;
                    
                    // Format dates if available
                    const birthDate = item.birth_date ? new Date(item.birth_date).toLocaleDateString() : 'Not specified';
                    const deathDate = item.death_date ? new Date(item.death_date).toLocaleDateString() : 'Not specified';
                    
                    html += `
                        <div class="deceased-item">
                            <h5>${deceasedCount}. ${item.name}</h5>
                            <div class="detail-row">
                                <span class="detail-label">Birth Date:</span>
                                <span class="detail-value">${birthDate}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Death Date:</span>
                                <span class="detail-value">${deathDate}</span>
                            </div>
                        </div>
                    `;
                }
            });
            
            if (deceasedCount === 0) {
                contentElement.innerHTML = '<div class="no-deceased-info">No deceased information available.</div>';
            } else {
                contentElement.innerHTML = html;
            }
            
            // Mark as loaded
            deceasedSection.dataset.loaded = 'true';
            
        } catch (error) {
            console.error('Error fetching deceased information:', error);
            loadingElement.style.display = 'none';
            contentElement.innerHTML = '<div class="error-message">Failed to load deceased information. Please try again later.</div>';
        }
    }

    confirmBtn.onclick = async function () {
        modal.style.display = 'none';
        try {
            const response = await fetchWithAuth(`/api/contracts/${pendingOrderId}/payment`, {
                method: 'POST'
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Payment failed');
            }
            
            // Show success message and reload
            alert('Payment successful!');
            window.location.reload();
        } catch (error) {
            alert(error.message);
        }
    };

    cancelBtn.onclick = function () {
        modal.style.display = 'none';
        pendingOrderId = null;
    };

    // Initialize the page
    fetchAndDisplayContracts();
});