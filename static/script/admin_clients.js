document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu toggle functionality
    const menuBtn = document.getElementById('menu-btn');
    const sidebar = document.querySelector('.sidebar');
    
    if (menuBtn && sidebar) {
        menuBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            sidebar.classList.toggle('active');
        });
        
        document.addEventListener('click', function(e) {
            if (sidebar.classList.contains('active') && window.innerWidth <= 768) {
                if (!sidebar.contains(e.target) && e.target !== menuBtn) {
                    sidebar.classList.remove('active');
                }
            }
        });
    }
    
    // Logout functionality
    const logoutBtn = document.getElementById('logout-btn');
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            localStorage.removeItem('admin_authenticated');
            
            fetch('/admin/logout', {
                method: 'POST',
                credentials: 'include'
            })
            .then(() => {
                window.location.href = '/admin';
            })
            .catch(error => {
                console.error('Logout error:', error);
                window.location.href = '/admin';
            });
        });
    }
    
    // Client data and pagination variables
    let allClients = [];
    let currentPage = 1;
    let itemsPerPage = 10;
    let totalPages = 1;
    let selectedClient = null;
    let searchTerm = '';
    let filterValue = 'all';
    
    // DOM elements
    const clientTableBody = document.getElementById('clientTableBody');
    const clientCount = document.getElementById('clientCount');
    const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');
    const currentPageSpan = document.getElementById('currentPage');
    const totalPagesSpan = document.getElementById('totalPages');
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const statusFilter = document.getElementById('statusFilter');
    
    // Modal elements
    const clientDetailsModal = document.getElementById('clientDetailsModal');
    const confirmationModal = document.getElementById('confirmationModal');
    const closeModalButtons = document.querySelectorAll('.close-modal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const deleteClientBtn = document.getElementById('deleteClientBtn');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    
    // Helper function for API calls
    async function fetchData(url, options = {}) {
        try {
            const defaultOptions = {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json'
                }
            };
            
            const response = await fetch(url, { ...defaultOptions, ...options });
            
            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Fetch error:', error);
            return null;
        }
    }
    
    // Format date function
    function formatDate(dateString) {
        if (!dateString) return 'N/A';
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    }
    
    // Load all clients
    async function loadClients() {
        const data = await fetchData('/api/admin/clients');
        
        if (data && Array.isArray(data)) {
            allClients = data;
            renderClients();
        } else {
            clientTableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center;">Error loading clients. Please try again.</td>
                </tr>
            `;
        }
    }
    
    // Filter clients based on search term and filter value
    function filterClients() {
        const term = searchTerm.toLowerCase();
        
        return allClients.filter(client => {
            // First, apply name search filter
            const nameMatch = !term || client.name.toLowerCase().includes(term);
            
            // Then apply status filter
            let statusMatch = true;
            if (filterValue === 'active') {
                statusMatch = client.contract_count > 0;
            } else if (filterValue === 'no-contract') {
                statusMatch = client.contract_count === 0;
            }
            
            return nameMatch && statusMatch;
        });
    }
    
    // Render clients table with pagination
    function renderClients() {
        const filteredClients = filterClients();
        totalPages = Math.ceil(filteredClients.length / itemsPerPage);
        
        // Adjust current page if it's beyond the total pages
        if (currentPage > totalPages) {
            currentPage = Math.max(1, totalPages);
        }
        
        // Calculate slice indexes for pagination
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedClients = filteredClients.slice(startIndex, endIndex);
        
        // Update UI elements
        clientCount.textContent = `${filteredClients.length} clients`;
        currentPageSpan.textContent = currentPage;
        totalPagesSpan.textContent = totalPages;
        prevPageBtn.disabled = currentPage === 1;
        nextPageBtn.disabled = currentPage === totalPages || totalPages === 0;
        
        // Clear existing table rows
        clientTableBody.innerHTML = '';
        
        if (paginatedClients.length === 0) {
            clientTableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center;">No clients found.</td>
                </tr>
            `;
            return;
        }
        
        // Add client rows
        paginatedClients.forEach(client => {
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${client.client_id}</td>
                <td>${client.name}</td>
                <td>${client.email || 'N/A'}</td>
                <td>${client.phone || 'N/A'}</td>
                <td>${client.contract_count || 0}</td>
                <td>${formatDate(client.registration_date)}</td>
                <td>
                    <button class="action-btn details" data-id="${client.client_id}">
                        <i class="fas fa-info-circle"></i> Details
                    </button>
                </td>
            `;
            
            clientTableBody.appendChild(row);
        });
        
        // Add event listeners to detail buttons
        document.querySelectorAll('.action-btn.details').forEach(btn => {
            btn.addEventListener('click', function() {
                const clientId = this.getAttribute('data-id');
                showClientDetails(clientId);
            });
        });
    }
    
    // Show client details in modal
    async function showClientDetails(clientId) {
        // Find client in current data
        selectedClient = allClients.find(client => client.client_id.toString() === clientId.toString());
        
        if (!selectedClient) {
            console.error('Client not found:', clientId);
            return;
        }
        
        // Set client details in modal
        document.getElementById('modal-client-id').textContent = selectedClient.client_id;
        document.getElementById('modal-name').textContent = selectedClient.name;
        document.getElementById('modal-email').textContent = selectedClient.email || 'N/A';
        document.getElementById('modal-phone').textContent = selectedClient.phone || 'N/A';
        document.getElementById('modal-address').textContent = selectedClient.address || 'N/A';
        document.getElementById('modal-registration').textContent = formatDate(selectedClient.registration_date);
        
        // Get client contracts for the table
        const contracts = await fetchData(`/api/admin/clients/${clientId}/contracts`);
        const contractsTableBody = document.getElementById('contractsTableBody');
        
        if (contracts && Array.isArray(contracts)) {
            if (contracts.length === 0) {
                contractsTableBody.innerHTML = `
                    <tr>
                        <td colspan="5" style="text-align: center;">No contracts found for this client.</td>
                    </tr>
                `;
            } else {
                contractsTableBody.innerHTML = '';
                
                contracts.forEach(contract => {
                    const row = document.createElement('tr');
                    
                    row.innerHTML = `
                        <td>${contract.contract_id}</td>
                        <td>${contract.slot_type} #${contract.slot_id}</td>
                        <td>${formatDate(contract.order_date)}</td>
                        <td>${formatCurrency(contract.amount)}</td>
                        <td>
                            <span class="badge ${contract.is_paid ? 'badge-success' : 'badge-pending'}">
                                ${contract.is_paid ? 'Paid' : 'Pending'}
                            </span>
                        </td>
                    `;
                    
                    contractsTableBody.appendChild(row);
                });
            }
        } else {
            contractsTableBody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center;">Error loading contracts data.</td>
                </tr>
            `;
        }
        
        // Show the modal
        clientDetailsModal.style.display = 'block';
    }
    
    // Delete client
    async function deleteClient(clientId) {
        const response = await fetchData(`/api/admin/clients/${clientId}/delete`, {
            method: 'DELETE'
        });
        
        if (response && response.success) {
            // Remove from the local array
            const index = allClients.findIndex(client => client.client_id.toString() === clientId.toString());
            if (index !== -1) {
                allClients.splice(index, 1);
            }
            
            // Close modals
            confirmationModal.style.display = 'none';
            clientDetailsModal.style.display = 'none';
            
            // Re-render client table
            renderClients();
            
            // Show success notification
            showNotification('Client successfully deleted', 'success');
        } else {
            // Show error notification
            showNotification('Error deleting client', 'error');
        }
    }
    
    // Format currency function
    function formatCurrency(amount) {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP'
        }).format(amount);
    }
    
    // Show notification function (can be implemented if needed)
    function showNotification(message, type) {
        alert(message); // Replace with a more sophisticated notification system if desired
    }
    
    // Pagination event listeners
    prevPageBtn.addEventListener('click', function() {
        if (currentPage > 1) {
            currentPage--;
            renderClients();
        }
    });
    
    nextPageBtn.addEventListener('click', function() {
        if (currentPage < totalPages) {
            currentPage++;
            renderClients();
        }
    });
    
    // Search functionality
    searchButton.addEventListener('click', function() {
        searchTerm = searchInput.value.trim();
        currentPage = 1; // Reset to first page when searching
        renderClients();
    });
    
    // Handle Enter key in search input
    searchInput.addEventListener('keyup', function(e) {
        if (e.key === 'Enter') {
            searchTerm = searchInput.value.trim();
            currentPage = 1;
            renderClients();
        }
    });
    
    // Filter change event
    statusFilter.addEventListener('change', function() {
        filterValue = this.value;
        currentPage = 1; // Reset to first page when filtering
        renderClients();
    });
    
    // Modal event listeners
    closeModalButtons.forEach(button => {
        button.addEventListener('click', function() {
            clientDetailsModal.style.display = 'none';
            confirmationModal.style.display = 'none';
        });
    });
    
    closeModalBtn.addEventListener('click', function() {
        clientDetailsModal.style.display = 'none';
    });
    
    deleteClientBtn.addEventListener('click', function() {
        if (selectedClient) {
            // Show confirmation modal
            document.getElementById('confirm-client-name').textContent = selectedClient.name;
            confirmationModal.style.display = 'block';
        }
    });
    
    confirmDeleteBtn.addEventListener('click', function() {
        if (selectedClient) {
            deleteClient(selectedClient.client_id);
        }
    });
    
    cancelDeleteBtn.addEventListener('click', function() {
        confirmationModal.style.display = 'none';
    });
    
    // Close modals when clicking outside of them
    window.addEventListener('click', function(e) {
        if (e.target === clientDetailsModal) {
            clientDetailsModal.style.display = 'none';
        }
        if (e.target === confirmationModal) {
            confirmationModal.style.display = 'none';
        }
    });
    
    // Initialize by loading clients
    loadClients();
}); 