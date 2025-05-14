document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu toggle
    const menuBtn = document.getElementById('menu-btn');
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main--content');
    
    // Make sure the menu button works
    if (menuBtn) {
        menuBtn.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent click from bubbling to main content
            sidebar.classList.toggle('active');
        });
    }
    
    // Auto-hide sidebar when clicking outside on mobile
    document.addEventListener('click', function(e) {
        // Only proceed if sidebar is active and we're on mobile
        if (sidebar && sidebar.classList.contains('active') && window.innerWidth <= 768) {
            // Check that the click is not on or inside the sidebar and not on the menu button
            if (!sidebar.contains(e.target) && e.target !== menuBtn) {
                sidebar.classList.remove('active');
            }
        }
    });
    
    // Logout functionality
    const logoutBtn = document.getElementById('logout-btn');
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Clear any admin session
            localStorage.removeItem('admin_authenticated');
            
            // Redirect to admin login
            window.location.href = '/admin';
        });
    }
    
    // Helper function for API calls
    async function fetchData(url) {
        try {
            const response = await fetch(url, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Fetch error:', error);
            return null;
        }
    }
    
    // Format currency
    function formatCurrency(amount) {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP'
        }).format(amount);
    }
    
    // Load summary statistics
    async function loadSummaryStats() {
        const data = await fetchData('/api/admin/analytics/summary');
        
        if (data) {
            document.getElementById('total-clients').textContent = data.total_clients;
            document.getElementById('available-plots').textContent = data.available_slots;
            document.getElementById('total-contracts').textContent = data.total_contracts;
            document.getElementById('total-revenue').textContent = formatCurrency(data.total_revenue).split('.')[0];
            
            // Create payment status chart
            createPaymentChart(data);
        }
    }
    
    // Create payment status chart
    function createPaymentChart(data) {
        const ctx = document.getElementById('payment-chart').getContext('2d');
        document.getElementById('payment-loader').style.display = 'none';
        
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['On Time', 'Overdue'],
                datasets: [{
                    data: [data.on_time_payments, data.overdue_contracts],
                    backgroundColor: ['#27ae60', '#c0392b'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    title: {
                        display: true,
                        text: 'Payment Status Distribution',
                        font: {
                            size: 16
                        }
                    }
                },
                cutout: '70%'
            }
        });
    }
    
    // Load revenue chart data
    async function loadRevenueChart() {
        const data = await fetchData('/api/admin/analytics/revenue-by-month');
        
        if (data) {
            document.getElementById('revenue-loader').style.display = 'none';
            
            const ctx = document.getElementById('revenue-chart').getContext('2d');
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: data.map(item => item.month),
                    datasets: [{
                        label: 'Revenue',
                        data: data.map(item => item.revenue),
                        backgroundColor: 'rgba(41, 128, 185, 0.6)',
                        borderColor: '#2980b9',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
                                    return '₱' + value.toLocaleString();
                                }
                            }
                        }
                    },
                    plugins: {
                        title: {
                            display: true,
                            text: 'Monthly Revenue (Current Year)',
                            font: {
                                size: 16
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return formatCurrency(context.raw);
                                }
                            }
                        }
                    }
                }
            });
        }
    }
    
    // Load plot distribution chart
    async function loadPlotChart() {
        const data = await fetchData('/api/admin/analytics/plot-distribution');
        
        if (data) {
            document.getElementById('plot-loader').style.display = 'none';
            
            const ctx = document.getElementById('plot-chart').getContext('2d');
            const plotData = data.plot_distribution;
            
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: plotData.map(item => item.type),
                    datasets: [
                        {
                            label: 'Total',
                            data: plotData.map(item => item.total),
                            backgroundColor: 'rgba(41, 128, 185, 0.6)',
                            borderColor: '#2980b9',
                            borderWidth: 1
                        },
                        {
                            label: 'Available',
                            data: plotData.map(item => item.available),
                            backgroundColor: 'rgba(39, 174, 96, 0.6)',
                            borderColor: '#27ae60',
                            borderWidth: 1
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: {
                            stacked: true
                        },
                        y: {
                            stacked: true,
                            beginAtZero: true
                        }
                    },
                    plugins: {
                        title: {
                            display: true,
                            text: 'Plot Distribution by Type',
                            font: {
                                size: 16
                            }
                        }
                    }
                }
            });
        }
    }
    
    // Load recent contracts table
    async function loadRecentContractsTable() {
        const data = await fetchData('/api/admin/analytics/recent-contracts');
        
        if (data) {
            const tableBody = document.querySelector('#contracts-table tbody');
            tableBody.innerHTML = '';
            
            if (data.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No contracts found</td></tr>';
                return;
            }
            
            data.forEach(contract => {
                const row = document.createElement('tr');
                
                // Format the contract data into table cells
                row.innerHTML = `
                    <td>${contract.order_id}</td>
                    <td>${contract.client_name}</td>
                    <td>${contract.slot_type.charAt(0).toUpperCase() + contract.slot_type.slice(1)} #${contract.slot_id}</td>
                    <td>${contract.order_date}</td>
                    <td>${formatCurrency(contract.amount)}</td>
                    <td>
                        <span class="badge ${contract.is_paid ? 'badge-success' : 'badge-pending'}">
                            ${contract.is_paid ? 'Paid' : 'Pending'}
                        </span>
                    </td>
                `;
                
                tableBody.appendChild(row);
            });
        }
    }
    
    // Load all data
    loadSummaryStats();
    loadRevenueChart();
    loadPlotChart();
    loadRecentContractsTable();
}); 