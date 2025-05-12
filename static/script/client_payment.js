document.addEventListener('DOMContentLoaded', function() {
  const clientId = 3;
  let pendingOrderId = null;

  const modal = document.getElementById("paymentModal");
  const confirmBtn = document.getElementById("confirmPaymentBtn");
  const cancelBtn = document.getElementById("cancelPaymentBtn");
  const modalMsg = document.getElementById("modalMessage");

  function formatCurrency(value) {
      return value ? `₱${parseFloat(value).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '₱0.00';
  }

  fetch(`/api/contracts/client/${clientId}`)
      .then(response => response.json())
      .then(contracts => {
          const container = document.getElementById('contracts-container');
          if (!contracts || contracts.length === 0) {
              container.innerHTML = `
                  <div class="no-contracts">
                      <i class="fas fa-info-circle"></i>
                      <p>You don't have any active contracts yet.</p>
                      <a href="/dashboard/buyaplan" class="btn-buy-plan">Buy a Plan</a>
                  </div>
              `;
              return;
          }
          container.innerHTML = '';
          contracts.forEach(contract => {
              const orderDate = contract.order_date ? new Date(contract.order_date).toLocaleDateString() : 'N/A';
              const lastPaymentDate = contract.latest_payment_date ? new Date(contract.latest_payment_date).toLocaleDateString() : 'N/A';
              const statusBadge = contract.is_paid ? '<span class="status-badge paid">PAID</span>' : '<span class="status-badge unpaid">UNPAID</span>';

              const card = document.createElement('div');
              card.className = 'contract-card';
              card.dataset.expanded = 'false';
              card.innerHTML = `
                  <div class="contract-summary">
                      <div class="summary-header">
                          <h3>Contract #${contract.order_id}</h3>
                          ${statusBadge}
                      </div>
                      <div class="summary-details">
                          <div class="detail-row"><span class="detail-label">Slot ID:</span><span class="detail-value">${contract.slot_id}</span></div>
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
                              <div class="detail-row"><span class="detail-label">VAT (${contract.vat_percent * 100}%):</span><span class="detail-value">${formatCurrency(contract.vat_amount)}</span></div>
                              <div class="detail-row"><span class="detail-label">Price with VAT:</span><span class="detail-value">${formatCurrency(contract.price_with_vat)}</span></div>
                          </div>
                          <div class="detail-group">
                              <h4>Payment Details</h4>
                              <div class="detail-row"><span class="detail-label">Payment Method:</span><span class="detail-value">${contract.payment_method.toUpperCase()}</span></div>
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
                      </div>
                  </div>
                  <div class="contract-actions">
                      <button class="btn-pay-now" ${contract.is_paid ? 'disabled' : ''} data-id="${contract.order_id}" data-amount="${contract.final_price}">
                          <i class="fas fa-credit-card"></i> Pay Now
                      </button>
                      <button class="btn-view-details">
                          <i class="fas fa-chevron-down"></i> View Details
                      </button>
                  </div>
              `;
              container.appendChild(card);
          });

          document.querySelectorAll('.btn-view-details').forEach(button => {
              button.addEventListener('click', function() {
                  const card = this.closest('.contract-card');
                  const detailsSection = card.querySelector('.contract-full-details');
                  const icon = this.querySelector('i');
                  const isExpanded = card.dataset.expanded === 'true';

                  detailsSection.style.display = isExpanded ? 'none' : 'block';
                  icon.className = isExpanded ? 'fas fa-chevron-down' : 'fas fa-chevron-up';
                  this.innerHTML = isExpanded ? '<i class="fas fa-chevron-down"></i> View Details' : '<i class="fas fa-chevron-up"></i> Hide Details';
                  card.dataset.expanded = (!isExpanded).toString();
              });
          });

          document.querySelectorAll('.btn-pay-now').forEach(button => {
              button.addEventListener('click', function () {
                  pendingOrderId = this.getAttribute('data-id');
                  const amount = this.getAttribute('data-amount');
                  modalMsg.textContent = `Confirm payment of ₱${parseFloat(amount).toLocaleString()} for Contract #${pendingOrderId}?`;
                  modal.style.display = 'flex';
              });
          });
      })
    .catch(error => {
        const container = document.getElementById('contracts-container');
        container.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>You don't have any contracts. Please go to <a href="/dashboard/buyaplan">Buy a Plan</a> to purchase or <a href="/dashboard/contact_us">Contact Us</a> if you think this is an error.</p>
            </div>
        `;
        console.error("Fetch error:", error);
    });

  confirmBtn.onclick = async function () {
      modal.style.display = 'none';
      try {
          const response = await fetch(`/api/contracts/${pendingOrderId}/payment?client_id=${clientId}`, {
              method: 'POST'
          });
          const result = await response.json();
          if (response.ok) {;
              location.reload();
          } else {
              alert(result.message || 'Payment failed');
          }
      } catch (error) {
          alert('Error: ' + error.message);
      }
  };

  cancelBtn.onclick = function () {
      modal.style.display = 'none';
      pendingOrderId = null;
  };
});