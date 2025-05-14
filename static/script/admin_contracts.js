document.addEventListener('DOMContentLoaded', function() {
    // Initialize
    const menuBtn = document.getElementById('menu-btn');
    const sidebar = document.querySelector('.sidebar');
    const logoutBtn = document.getElementById('logout-btn');
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const statusFilter = document.getElementById('statusFilter');
    const contractTableBody = document.getElementById('contractTableBody');
    const contractCount = document.getElementById('contractCount');
    const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');
    const currentPageSpan = document.getElementById('currentPage');
    const totalPagesSpan = document.getElementById('totalPages');
    const contractModal = document.getElementById('contractDocumentModal');
    const closeModal = document.querySelector('.close-modal');
    const printBtn = document.getElementById('printContractBtn');
    
    // Pagination state
    let currentPage = 1;
    let totalPages = 1;
    const itemsPerPage = 10;
    
    // Contracts data
    let contractsData = [];
    let filteredContracts = [];
    
    // Toggle sidebar
    if (menuBtn) {
        menuBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            sidebar.classList.toggle('active');
        });
        
        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', function(e) {
            if (sidebar.classList.contains('active') && window.innerWidth <= 768) {
                if (!sidebar.contains(e.target) && e.target !== menuBtn) {
                    sidebar.classList.remove('active');
                }
            }
        });
    }
    
    // Handle logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Clear admin authentication
            localStorage.removeItem('admin_authenticated');
            
            // Redirect to admin login
            window.location.href = '/admin';
        });
    }
    
    // Fetch contracts data
    async function fetchContracts() {
        try {
            const isAuthenticated = localStorage.getItem('admin_authenticated') === 'true';
            if (!isAuthenticated) {
                // For demo purposes, still load contracts even if not authenticated
                contractsData = generateMockContracts();
                filteredContracts = [...contractsData];
                updateContractCount();
                updatePagination();
                renderContracts();
                return;
            }
            
            const response = await fetch('/api/admin/contracts', {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch contracts');
            }
            
            const data = await response.json();
            
            // Use mock data if API returns empty results
            if (!data || !data.contracts || data.contracts.length === 0) {
                contractsData = generateMockContracts();
            } else {
                contractsData = data.contracts;
            }
            
            // Initialize filtered data with all contracts
            filteredContracts = [...contractsData];
            
            // Update UI
            updateContractCount();
            updatePagination();
            renderContracts();
            
        } catch (error) {
            console.error('Error fetching contracts:', error);
            // Use mock data in case of error
            contractsData = generateMockContracts();
            filteredContracts = [...contractsData];
            
            // Update UI
            updateContractCount();
            updatePagination();
            renderContracts();
        }
    }
    
    // Generate mock contracts for testing
    function generateMockContracts() {
        const plotTypes = ['Standard Plot', 'Premium Plot', 'Family Plot', 'Memorial Garden', 'Crypt Space'];
        const names = [
            'John Smith', 'Mary Johnson', 'Robert Williams', 'Linda Jones', 
            'Michael Brown', 'Patricia Davis', 'James Miller', 'Elizabeth Wilson',
            'David Moore', 'Jennifer Taylor', 'Charles Anderson', 'Barbara Thomas',
            'Joseph Jackson', 'Margaret White', 'Richard Harris', 'Susan Martin'
        ];
        
        const mockContracts = [];
        
        for (let i = 1; i <= 45; i++) {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - Math.floor(Math.random() * 365 * 2)); // Random date in the last 2 years
            
            const totalAmount = Math.floor(Math.random() * 5000) + 2000; // Random amount between $2000 and $7000
            const paidAmount = Math.random() > 0.3 ? totalAmount : Math.floor(Math.random() * totalAmount);
            const isActive = paidAmount < totalAmount;
            
            // Determine if payment is overdue
            const paymentDueDate = new Date(startDate);
            paymentDueDate.setMonth(paymentDueDate.getMonth() + 1);
            const isOverdue = isActive && paymentDueDate < new Date() && Math.random() > 0.6;
            
            mockContracts.push({
                id: `CNT-${1000 + i}`,
                clientId: `CL-${2000 + i}`,
                clientName: names[Math.floor(Math.random() * names.length)],
                plotType: plotTypes[Math.floor(Math.random() * plotTypes.length)],
                plotId: `PLT-${3000 + i}`,
                startDate: startDate.toISOString().split('T')[0],
                totalAmount: totalAmount,
                paidAmount: paidAmount,
                isActive: isActive,
                isOverdue: isOverdue,
                lastPaymentDate: isActive ? 
                    new Date(startDate.getTime() + Math.random() * (new Date() - startDate)).toISOString().split('T')[0] 
                    : startDate.toISOString().split('T')[0]
            });
        }
        
        return mockContracts;
    }
    
    // Format currency
    function formatCurrency(amount) {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP'
        }).format(amount);
    }
    
    // Update contract count display
    function updateContractCount() {
        contractCount.textContent = `${filteredContracts.length} contracts`;
    }
    
    // Update pagination controls
    function updatePagination() {
        totalPages = Math.ceil(filteredContracts.length / itemsPerPage);
        if (currentPage > totalPages && totalPages > 0) {
            currentPage = totalPages;
        }
        
        currentPageSpan.textContent = currentPage;
        totalPagesSpan.textContent = totalPages;
        
        prevPageBtn.disabled = currentPage <= 1;
        nextPageBtn.disabled = currentPage >= totalPages;
    }
    
    // Render contracts table
    function renderContracts() {
        contractTableBody.innerHTML = '';
        
        if (filteredContracts.length === 0) {
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = `<td colspan="8" class="empty-table">No contracts found matching your criteria</td>`;
            contractTableBody.appendChild(emptyRow);
            return;
        }
        
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, filteredContracts.length);
        
        for (let i = startIndex; i < endIndex; i++) {
            const contract = filteredContracts[i];
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${contract.id}</td>
                <td>${contract.clientName}</td>
                <td>${contract.plotType}</td>
                <td>${contract.startDate}</td>
                <td>${formatCurrency(contract.totalAmount)}</td>
                <td>
                    <span class="status-badge ${contract.isActive ? 'status-active' : 'status-paid'}">
                        ${contract.isActive ? 'Active' : 'Fully Paid'}
                    </span>
                </td>
                <td>
                    ${contract.isActive ? 
                        `<span class="status-badge ${contract.isOverdue ? 'payment-overdue' : 'payment-ontime'}">
                            ${contract.isOverdue ? 'Overdue' : 'On Time'}
                         </span>` : 
                        `<span class="status-badge payment-ontime">Completed</span>`
                    }
                </td>
                <td>
                    <button class="action-btn view-document" data-contract-id="${contract.id}">
                        <i class="fas fa-file-pdf"></i> View Document
                    </button>
                </td>
            `;
            
            contractTableBody.appendChild(row);
        }
        
        // Add event listeners to view document buttons
        const viewDocumentButtons = document.querySelectorAll('.view-document');
        viewDocumentButtons.forEach(button => {
            button.addEventListener('click', function() {
                const contractId = this.getAttribute('data-contract-id');
                showContractDocument(contractId);
            });
        });
    }
    
    // Show contract document modal
    function showContractDocument(contractId) {
        const contract = contractsData.find(c => c.id === contractId);
        
        if (!contract) {
            console.error('Contract not found:', contractId);
            return;
        }
        
        const documentContainer = document.getElementById('contractDocument');
        
        // Calculate payment details
        const outstandingAmount = contract.totalAmount - contract.paidAmount;
        const completionPercentage = Math.round((contract.paidAmount / contract.totalAmount) * 100);
        
        // Generate a PDF-like document
        documentContainer.innerHTML = `
            <div class="document-heading">
                <h2>BURIAL PLOT PURCHASE AGREEMENT</h2>
                <p>Contract ID: ${contract.id}</p>
            </div>
            
            <div class="document-section contract-parties">
                <div class="party-info">
                    <h3>SERVICE PROVIDER</h3>
                    <p><strong>Eternal Rest Cemetery</strong><br>
                    123 Memorial Lane<br>
                    Serenity Hills, CA 90210<br>
                    Phone: (555) 123-4567<br>
                    Email: info@eternalrest.com</p>
                </div>
                <div class="party-info">
                    <h3>CLIENT</h3>
                    <p><strong>${contract.clientName}</strong><br>
                    Client ID: ${contract.clientId}<br>
                    Last Payment: ${contract.lastPaymentDate}</p>
                </div>
            </div>
            
            <div class="document-section">
                <h3>PLOT DETAILS</h3>
                <table class="document-table">
                    <tr>
                        <td>Plot Type:</td>
                        <td>${contract.plotType}</td>
                    </tr>
                    <tr>
                        <td>Plot ID:</td>
                        <td>${contract.plotId}</td>
                    </tr>
                    <tr>
                        <td>Agreement Date:</td>
                        <td>${contract.startDate}</td>
                    </tr>
                </table>
            </div>
            
            <div class="document-section">
                <h3>PAYMENT DETAILS</h3>
                <table class="document-table">
                    <tr>
                        <td>Total Amount:</td>
                        <td>${formatCurrency(contract.totalAmount)}</td>
                    </tr>
                    <tr>
                        <td>Amount Paid:</td>
                        <td>${formatCurrency(contract.paidAmount)}</td>
                    </tr>
                    <tr>
                        <td>Outstanding Amount:</td>
                        <td>${formatCurrency(outstandingAmount)}</td>
                    </tr>
                    <tr>
                        <td>Payment Status:</td>
                        <td>${contract.isActive ? (contract.isOverdue ? 'Overdue' : 'On Time') : 'Fully Paid'}</td>
                    </tr>
                    <tr>
                        <td>Completion:</td>
                        <td>${completionPercentage}%</td>
                    </tr>
                </table>
            </div>
            
            <div class="document-section">
                <h3>TERMS AND CONDITIONS</h3>
                <p>1. The Client agrees to purchase the burial plot described above from the Service Provider.</p>
                <p>2. The Client agrees to make payment in accordance with the payment plan selected.</p>
                <p>3. The Service Provider shall maintain the cemetery grounds in accordance with industry standards.</p>
                <p>4. This agreement shall be binding upon the heirs, executors, administrators, and assigns of the parties.</p>
                <p>5. This agreement constitutes the entire understanding between the parties and supersedes all prior negotiations.</p>
            </div>
            
            <div class="document-section signatures">
                <div class="signature-block">
                    <div class="signature">${generateRandomSignature('client')}</div>
                    <p>${contract.clientName}</p>
                    <p>Client</p>
                </div>
                <div class="signature-block">
                    <div class="signature">${generateRandomSignature('provider')}</div>
                    <p>Jonathan Reynolds</p>
                    <p>Service Provider</p>
                </div>
            </div>
        `;
        
        // Show modal
        contractModal.style.display = 'block';
    }
    
    // Generate a random signature SVG
    function generateRandomSignature(type) {
        const signatures = {
            client: [
                '<svg viewBox="0 0 200 60"><path d="M20,40 C30,10 40,50 60,30 C70,20 80,40 90,30 C100,20 110,40 120,30" stroke="black" fill="transparent" stroke-width="1.5"></path></svg>',
                '<svg viewBox="0 0 200 60"><path d="M30,30 C40,20 50,40 60,30 C70,25 80,35 90,30 C100,25 140,20 170,30" stroke="black" fill="transparent" stroke-width="1.5"></path></svg>',
                '<svg viewBox="0 0 200 60"><path d="M20,30 C50,10 60,50 90,30 C120,10 150,40 180,30" stroke="black" fill="transparent" stroke-width="1.5"></path></svg>'
            ],
            provider: [
                '<svg viewBox="0 0 200 60"><path d="M20,40 C35,20 50,40 65,30 S80,20 95,30 S110,40 125,30 S140,20 155,30 S170,40 185,30" stroke="black" fill="transparent" stroke-width="1.5"></path></svg>',
                '<svg viewBox="0 0 200 60"><path d="M20,30 C35,10 50,40 65,20 S80,30 95,20 S120,30 145,20" stroke="black" fill="transparent" stroke-width="1.5"></path></svg>',
                '<svg viewBox="0 0 200 60"><path d="M20,40 Q40,20 60,40 T100,40 T140,40 T180,40" stroke="black" fill="transparent" stroke-width="1.5"></path></svg>'
            ]
        };
        
        // Choose a random signature from the appropriate category
        const options = signatures[type] || signatures.client;
        return options[Math.floor(Math.random() * options.length)];
    }
    
    // Filter contracts based on search and status
    function filterContracts() {
        const searchTerm = searchInput.value.toLowerCase();
        const statusValue = statusFilter.value;
        
        filteredContracts = contractsData.filter(contract => {
            // Search term filter
            const matchesSearch = contract.id.toLowerCase().includes(searchTerm) || 
                                 contract.clientName.toLowerCase().includes(searchTerm) ||
                                 contract.clientId.toLowerCase().includes(searchTerm);
            
            // Status filter
            let matchesStatus = true;
            if (statusValue === 'active') {
                matchesStatus = contract.isActive;
            } else if (statusValue === 'paid') {
                matchesStatus = !contract.isActive;
            } else if (statusValue === 'overdue') {
                matchesStatus = contract.isActive && contract.isOverdue;
            }
            
            return matchesSearch && matchesStatus;
        });
        
        // Reset to first page when filter changes
        currentPage = 1;
        
        // Update UI
        updateContractCount();
        updatePagination();
        renderContracts();
    }
    
    // Handle modal close
    if (closeModal) {
        closeModal.addEventListener('click', function() {
            contractModal.style.display = 'none';
        });
    }
    
    // Handle click outside modal to close
    window.addEventListener('click', function(event) {
        if (event.target === contractModal) {
            contractModal.style.display = 'none';
        }
    });
    
    // Handle print button
    if (printBtn) {
        printBtn.addEventListener('click', function() {
            const documentContent = document.getElementById('contractDocument');
            const printWindow = window.open('', '_blank');
            
            printWindow.document.write(`
                <html>
                <head>
                    <title>Contract Document</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        .document-heading { text-align: center; margin-bottom: 30px; }
                        .document-heading h2 { margin-bottom: 5px; }
                        .contract-parties { display: flex; justify-content: space-between; margin-bottom: 20px; }
                        .party-info { width: 45%; }
                        .document-section { margin-bottom: 20px; }
                        .document-section h3 { margin-bottom: 10px; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
                        .document-table { width: 100%; border-collapse: collapse; }
                        .document-table td { padding: 5px; }
                        .document-table tr td:first-child { font-weight: bold; width: 40%; }
                        .signatures { display: flex; justify-content: space-between; margin-top: 40px; }
                        .signature-block { width: 45%; text-align: center; }
                        .signature { height: 60px; margin-bottom: 10px; }
                        p { margin: 5px 0; }
                    </style>
                </head>
                <body>
                    ${documentContent.innerHTML}
                </body>
                </html>
            `);
            
            printWindow.document.close();
            printWindow.focus();
            
            // Print after a short delay to allow resources to load
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 500);
        });
    }
    
    // Pagination controls
    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', function() {
            if (currentPage > 1) {
                currentPage--;
                updatePagination();
                renderContracts();
            }
        });
    }
    
    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', function() {
            if (currentPage < totalPages) {
                currentPage++;
                updatePagination();
                renderContracts();
            }
        });
    }
    
    // Search and filter event listeners
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            filterContracts();
        });
    }
    
    if (searchButton) {
        searchButton.addEventListener('click', function() {
            filterContracts();
        });
    }
    
    if (statusFilter) {
        statusFilter.addEventListener('change', function() {
            filterContracts();
        });
    }
    
    // Initialize the page
    fetchContracts();
}); 