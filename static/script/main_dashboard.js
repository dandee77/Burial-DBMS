document.addEventListener('DOMContentLoaded', function() {
    // Helper function to handle API requests with authentication
    async function fetchWithAuth(url, options = {}) {
        // Get token from localStorage
        const token = localStorage.getItem('access_token');
        
        // Set default headers with authentication
        const headers = {
            ...options.headers,
            'Authorization': `Bearer ${token}`
        };
        
        return fetch(url, {
            ...options,
            headers,
            credentials: 'include'
        });
    }

    // Function to get client ID if missing
    async function getClientIdIfMissing() {
        let clientId = localStorage.getItem('client_id');
        if (clientId) {
            return clientId;
        }

        try {
            const response = await fetchWithAuth('/api/user/info');
            if (!response.ok) {
                throw new Error('Failed to get user info');
            }
            
            const userData = await response.json();
            if (userData && userData.client_id) {
                localStorage.setItem('client_id', userData.client_id);
                return userData.client_id;
            } else {
                throw new Error('Client ID not found in user data');
            }
        } catch (error) {
            console.error('Error getting client ID:', error);
            window.location.href = '/login';
            throw error;
        }
    }

    // Setup and enable toggle functionality for dropdowns
    function setupDropdowns() {
        // Get profile and notification elements
        const notificationIcon = document.querySelector('.notification i.fa-bell');
        const profileIcon = document.querySelector('.profile i.fa-user-circle');
        const notificationDropdown = document.querySelector('.notification-dropdown');
        const profileDropdown = document.querySelector('.profile-dropdown');
        
        // Alternative toggle approach (for better mobile experience)
        if (notificationIcon && notificationDropdown) {
            let notificationOpen = false;
            
            notificationIcon.addEventListener('click', function(e) {
                e.stopPropagation();
                
                if (profileDropdown) {
                    profileDropdown.style.opacity = '0';
                    profileDropdown.style.visibility = 'hidden';
                    profileDropdown.style.transform = 'translateY(-10px)';
                }
                
                if (notificationOpen) {
                    notificationDropdown.style.opacity = '0';
                    notificationDropdown.style.visibility = 'hidden';
                    notificationDropdown.style.transform = 'translateY(-10px)';
                } else {
                    notificationDropdown.style.opacity = '1';
                    notificationDropdown.style.visibility = 'visible';
                    notificationDropdown.style.transform = 'translateY(0)';
                }
                
                notificationOpen = !notificationOpen;
            });
        }
        
        if (profileIcon && profileDropdown) {
            let profileOpen = false;
            
            profileIcon.addEventListener('click', function(e) {
                e.stopPropagation();
                
                if (notificationDropdown) {
                    notificationDropdown.style.opacity = '0';
                    notificationDropdown.style.visibility = 'hidden';
                    notificationDropdown.style.transform = 'translateY(-10px)';
                }
                
                if (profileOpen) {
                    profileDropdown.style.opacity = '0';
                    profileDropdown.style.visibility = 'hidden';
                    profileDropdown.style.transform = 'translateY(-10px)';
                } else {
                    profileDropdown.style.opacity = '1';
                    profileDropdown.style.visibility = 'visible';
                    profileDropdown.style.transform = 'translateY(0)';
                }
                
                profileOpen = !profileOpen;
            });
        }
        
        // Close dropdowns when clicking elsewhere on the page
        document.addEventListener('click', function() {
            if (notificationDropdown) {
                notificationDropdown.style.opacity = '0';
                notificationDropdown.style.visibility = 'hidden';
                notificationDropdown.style.transform = 'translateY(-10px)';
            }
            
            if (profileDropdown) {
                profileDropdown.style.opacity = '0';
                profileDropdown.style.visibility = 'hidden';
                profileDropdown.style.transform = 'translateY(-10px)';
            }
        });
        
        // Prevent dropdown close when clicking within the dropdown
        if (notificationDropdown) {
            notificationDropdown.addEventListener('click', function(e) {
                e.stopPropagation();
            });
        }
        
        if (profileDropdown) {
            profileDropdown.addEventListener('click', function(e) {
                e.stopPropagation();
            });
        }
        
        // Mark all notifications as read functionality
        const markReadBtn = document.querySelector('.mark-read');
        if (markReadBtn) {
            markReadBtn.addEventListener('click', function() {
                const unreadItems = document.querySelectorAll('.notification-item.unread');
                unreadItems.forEach(item => {
                    item.classList.remove('unread');
                });
                
                // Update notification count
                const notificationCount = document.querySelector('.notification-count');
                if (notificationCount) {
                    notificationCount.textContent = '0';
                    notificationCount.style.display = 'none';
                }
            });
        }
        
        // Profile logout button functionality
        const profileLogoutBtn = document.getElementById('profile-logout-btn');
        if (profileLogoutBtn) {
            profileLogoutBtn.addEventListener('click', function(e) {
                e.preventDefault();
                
                fetch('/logout', {
                    method: 'POST',
                    credentials: 'include'
                })
                .then(response => {
                    if (response.ok) {
                        // Clear local storage
                        localStorage.removeItem('access_token');
                        localStorage.removeItem('client_id');
                        
                        // Redirect to home page
                        window.location.href = '/';
                    }
                })
                .catch(error => console.error('Logout error:', error));
            });
        }
    }
    
    // Load user profile information
    async function loadUserProfile() {
        try {
            // Use the /api/user/info endpoint which already returns the user info
            const response = await fetchWithAuth('/api/user/info');
            
            if (!response.ok) {
                throw new Error('Failed to fetch user profile');
            }
            
            const userData = await response.json();
            
            // Update profile dropdown with user data
            const profileName = document.getElementById('profile-name');
            const profileEmail = document.getElementById('profile-email');
            
            if (profileName && userData.name) {
                profileName.textContent = userData.name;
            }
            
            if (profileEmail && userData.email) {
                profileEmail.textContent = userData.email;
            }
            
        } catch (error) {
            console.error('Error loading user profile:', error);
        }
    }

    // Function to format dates
    function formatDate(dateString) {
        if (!dateString) return 'N/A';
        
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        }).format(date);
    }

    // Function to calculate due date
    function calculateNextDueDate(latestPaymentDate, yearsToPay) {
        if (!latestPaymentDate || yearsToPay === 0) return null;
        
        const date = new Date(latestPaymentDate);
        date.setMonth(date.getMonth() + 1);
        return date;
    }

    // Function to format currency
    function formatCurrency(amount) {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP'
        }).format(amount);
    }

    // Function to check if a contract is overdue (more than 30 days since last payment)
    function isContractOverdue(contract) {
        if (contract.is_paid) return false;
        
        // If no payment has been made yet, use order_date
        const lastPaymentDate = contract.latest_payment_date ? new Date(contract.latest_payment_date) : new Date(contract.order_date);
        const today = new Date();
        
        // Calculate days since last payment
        const daysSinceLastPayment = Math.floor((today - lastPaymentDate) / (1000 * 60 * 60 * 24));
        
        // Overdue if more than 30 days
        return daysSinceLastPayment > 30;
    }

    // Fetch and display active plans
    async function loadActivePlans() {
        const container = document.getElementById('active-plans-content');
        
        try {
            const clientId = await getClientIdIfMissing();
            const response = await fetchWithAuth(`/api/contracts/client/${clientId}`);
            
            if (response.status === 404) {
                container.innerHTML = `
                    <div class="no-data">
                        <p>You don't have any active plans yet.</p>
                        <a href="/dashboard/buyaplan" class="btn-buy">Purchase a Plan</a>
                    </div>
                `;
                return;
            }
            
            if (!response.ok) {
                throw new Error('Failed to fetch contracts');
            }
            
            const contracts = await response.json();
            
            if (contracts.length === 0) {
                container.innerHTML = `
                    <div class="no-data">
                        <p>You don't have any active plans yet.</p>
                        <a href="/dashboard/buyaplan" class="btn-buy">Purchase a Plan</a>
                    </div>
                `;
                return;
            }
            
            let planHTML = '';
            contracts.slice(0, 3).forEach(contract => {
                const slotType = contract.slot_type === 'plot' ? 'Burial Plot' : 'Mausoleum';
                
                // Check if contract is overdue
                const isOverdue = isContractOverdue(contract);
                
                // Set status based on payment status and overdue check
                const statusClass = contract.is_paid ? 'status-active' : 
                                   isOverdue ? 'status-overdue' : 'status-pending';
                const statusText = contract.is_paid ? 'Paid' : 
                                  isOverdue ? 'Overdue' : 'Pending';
                
                planHTML += `
                    <div class="plan-item">
                        <div class="plan-info">
                            <div class="plan-title">${slotType} #${contract.slot_id}</div>
                            <div class="plan-detail">Purchased on ${formatDate(contract.order_date)}</div>
                        </div>
                        <span class="plan-status ${statusClass}">${statusText}</span>
                    </div>
                `;
            });
            
            container.innerHTML = planHTML;
            
        } catch (error) {
            console.error('Error loading plans:', error);
            container.innerHTML = `
                <div class="error">
                    <p>Unable to load plans. Please try again later.</p>
                </div>
            `;
        }
    }

    // Fetch and display outstanding payments
    async function loadOutstandingPayments() {
        const container = document.getElementById('outstanding-payments-content');
        
        try {
            const clientId = await getClientIdIfMissing();
            const response = await fetchWithAuth(`/api/contracts/client/${clientId}`);
            
            if (response.status === 404 || !response.ok) {
                container.innerHTML = `
                    <div class="no-data">
                        <p>No outstanding payments found.</p>
                    </div>
                `;
                return;
            }
            
            const contracts = await response.json();
            
            // Filter contracts that are not fully paid and have installment payments
            const outstandingContracts = contracts.filter(c => !c.is_paid && c.years_to_pay > 0);
            
            if (outstandingContracts.length === 0) {
                container.innerHTML = `
                    <div class="no-data">
                        <p>No outstanding payments found.</p>
                    </div>
                `;
                return;
            }
            
            let paymentsHTML = '';
            outstandingContracts.slice(0, 2).forEach(contract => {
                const nextDueDate = calculateNextDueDate(contract.latest_payment_date || contract.order_date, contract.years_to_pay);
                const isOverdue = isContractOverdue(contract);
                
                paymentsHTML += `
                    <div class="payment-item ${isOverdue ? 'overdue' : ''}">
                        <div class="payment-info">
                            <div class="payment-title">
                                Monthly Installment
                                ${isOverdue ? '<span class="payment-overdue-tag">OVERDUE</span>' : ''}
                            </div>
                            <div class="payment-detail">Due on ${formatDate(nextDueDate)}</div>
                        </div>
                        <div class="payment-amount">${formatCurrency(contract.monthly_amortization)}</div>
                        <a href="/dashboard/payment" class="btn-pay">Pay</a>
                    </div>
                `;
            });
            
            container.innerHTML = paymentsHTML;
            
        } catch (error) {
            console.error('Error loading payments:', error);
            container.innerHTML = `
                <div class="error">
                    <p>Unable to load payment information. Please try again later.</p>
                </div>
            `;
        }
    }

    // Fetch and display payment alerts
    async function loadPaymentAlerts() {
        const container = document.getElementById('payment-alerts-content');
        
        try {
            const clientId = await getClientIdIfMissing();
            const response = await fetchWithAuth(`/api/contracts/client/${clientId}`);
            
            if (response.status === 404 || !response.ok) {
                container.innerHTML = `
                    <div class="no-data">
                        <p>No payment alerts at this time.</p>
                    </div>
                `;
                return;
            }
            
            const contracts = await response.json();
            
            // Filter contracts that have upcoming or overdue payments
            const alertContracts = contracts.filter(c => !c.is_paid && c.years_to_pay > 0);
            
            if (alertContracts.length === 0) {
                container.innerHTML = `
                    <div class="no-data">
                        <p>No payment alerts at this time.</p>
                    </div>
                `;
                return;
            }
            
            let alertsHTML = '';
            alertContracts.forEach(contract => {
                const isOverdue = isContractOverdue(contract);
                
                // Calculate days since last payment for overdue contracts
                let alertType = '';
                let alertTitle = '';
                let alertDetail = '';
                let isUrgent = false;
                
                if (isOverdue) {
                    // If overdue (more than 30 days)
                    const lastPaymentDate = contract.latest_payment_date ? new Date(contract.latest_payment_date) : new Date(contract.order_date);
                    const today = new Date();
                    const daysSinceLastPayment = Math.floor((today - lastPaymentDate) / (1000 * 60 * 60 * 24));
                    
                    alertType = 'exclamation-triangle';
                    alertTitle = 'Payment Overdue';
                    alertDetail = `Your payment is overdue by ${daysSinceLastPayment - 30} days`;
                    isUrgent = true;
                } else {
                    // For upcoming payments based on next due date
                    const nextDueDate = calculateNextDueDate(contract.latest_payment_date || contract.order_date, contract.years_to_pay);
                    const today = new Date();
                    const daysUntilDue = Math.ceil((nextDueDate - today) / (1000 * 60 * 60 * 24));
                    
                    if (daysUntilDue < 0) {
                        alertType = 'exclamation-circle';
                        alertTitle = 'Payment Due Now';
                        alertDetail = `Your payment was due ${Math.abs(daysUntilDue)} days ago`;
                        isUrgent = true;
                    } else if (daysUntilDue <= 7) {
                        alertType = 'exclamation-circle';
                        alertTitle = 'Payment Due Soon';
                        alertDetail = `Your payment is due in ${daysUntilDue} days`;
                        isUrgent = daysUntilDue <= 3;
                    } else if (daysUntilDue <= 14) {
                        alertType = 'info-circle';
                        alertTitle = 'Upcoming Payment';
                        alertDetail = `Your payment is due in ${daysUntilDue} days`;
                    }
                }
                
                if (alertType) {
                    alertsHTML += `
                        <div class="alert-item">
                            <div class="alert-icon ${isUrgent ? 'urgent' : ''}">
                                <i class="fas fa-${alertType}"></i>
                            </div>
                            <div class="alert-info">
                                <div class="alert-title">${alertTitle}</div>
                                <div class="alert-detail">${alertDetail}</div>
                            </div>
                        </div>
                    `;
                }
            });
            
            if (alertsHTML === '') {
                container.innerHTML = `
                    <div class="no-data">
                        <p>No payment alerts at this time.</p>
                    </div>
                `;
            } else {
                container.innerHTML = alertsHTML;
            }
            
        } catch (error) {
            console.error('Error loading alerts:', error);
            container.innerHTML = `
                <div class="error">
                    <p>Unable to load alerts. Please try again later.</p>
                </div>
            `;
        }
    }

    // Fetch and display burial site info
    async function loadBurialSiteInfo() {
        const container = document.getElementById('burial-info-content');
        
        try {
            const clientId = await getClientIdIfMissing();
            const response = await fetchWithAuth(`/api/contracts/client/${clientId}`);
            
            if (response.status === 404 || !response.ok) {
                container.innerHTML = `
                    <div class="no-data">
                        <p>No burial site information available.</p>
                    </div>
                `;
                return;
            }
            
            const contracts = await response.json();
            
            if (contracts.length === 0) {
                container.innerHTML = `
                    <div class="no-data">
                        <p>No burial site information available.</p>
                    </div>
                `;
                return;
            }
            
            // Just show info for the first contract for simplicity
            const contract = contracts[0];
            const slotType = contract.slot_type === 'plot' ? 'Burial Plot' : 'Mausoleum';
            
            container.innerHTML = `
                <div class="site-info">
                    <div class="site-item">
                        <i class="fas fa-map-marker-alt site-icon"></i>
                        <span class="site-detail">Section A, ${slotType} #${contract.slot_id}</span>
                    </div>
                    <div class="site-item">
                        <i class="fas fa-ruler-combined site-icon"></i>
                        <span class="site-detail">${contract.slot_type === 'plot' ? '2.5m x 1.2m (Standard Plot)' : '2.0m x 1.0m x 0.8m (Standard Niche)'}</span>
                    </div>
                    <div class="site-item">
                        <i class="fas fa-leaf site-icon"></i>
                        <span class="site-detail">Landscaped Area, Morning Sunlight</span>
                    </div>
                    <div class="site-item">
                        <i class="fas fa-directions site-icon"></i>
                        <span class="site-detail">Near Main Entrance, Easy Access</span>
                    </div>
                </div>
            `;
            
        } catch (error) {
            console.error('Error loading burial site info:', error);
            container.innerHTML = `
                <div class="error">
                    <p>Unable to load burial site information. Please try again later.</p>
                </div>
            `;
        }
    }

    // Load all data for the dashboard
    function loadDashboardData() {
        loadActivePlans();
        loadOutstandingPayments();
        loadPaymentAlerts();
        loadBurialSiteInfo();
        loadUserProfile();
        setupDropdowns();
    }

    // Initialize the dashboard
    loadDashboardData();
}); 