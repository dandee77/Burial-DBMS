// DOM Elements
const slotInput = document.getElementById('slotSelect');
const slotList = document.getElementById('slots');
const paymentMethod = document.getElementById('paymentMethod');
const yearsToPay = document.getElementById('yearsToPay');
const confirmationModal = document.getElementById('confirmationModal');
const errorModal = document.getElementById('errorModal');
const closeModalButtons = document.querySelectorAll('.close-modal, .modal-btn.cancel');
const confirmPurchaseBtn = document.getElementById('confirmPurchase');
const closeErrorBtn = document.getElementById('closeError');

// Global Variables
const clientId = 3; // Replace with dynamic session value in production
let selectedSlot = null;
let slotData = [];

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
  fetchAvailableSlots();
  setupEventListeners();
});


// Fetch available slots from API
async function fetchAvailableSlots() {
  try {
    const response = await fetch('/api/available_slots');
    slotData = await response.json();
    populateSlotDropdown();
  } catch (error) {
    showError('Failed to load available slots. Please try again later.');
  }
}

// Populate the slot dropdown list
function populateSlotDropdown() {
  slotList.innerHTML = '';
  slotData.forEach(slot => {
    const option = document.createElement('option');
    option.value = `Slot ${slot.slot_id} (${slot.slot_type})`;
    option.dataset.id = slot.slot_id;
    slotList.appendChild(option);
  });
}

// Set up all event listeners
function setupEventListeners() {
  // Slot selection
  slotInput.addEventListener('input', handleSlotInput);
  slotInput.addEventListener('blur', validateSlotSelection);
  
  // Form elements
  yearsToPay.addEventListener('change', calculate);
  paymentMethod.addEventListener('change', calculate);
  
  // Form submission
  document.getElementById('planForm').addEventListener('submit', handleFormSubmit);
  
  // Modal buttons
  confirmPurchaseBtn.addEventListener('click', handlePurchaseConfirmation);
  closeModalButtons.forEach(button => {
    button.addEventListener('click', closeAllModals);
  });
  
  // Close modals when clicking outside
  window.addEventListener('click', (event) => {
    if (event.target === confirmationModal) confirmationModal.style.display = 'none';
    if (event.target === errorModal) errorModal.style.display = 'none';
  });
}

// Handle slot input changes
function handleSlotInput() {
  const match = slotInput.value.match(/Slot (\d+) \((.*)\)/);
  
  if (match) {
    const slotId = parseInt(match[1]);
    const slotType = match[2];
    selectedSlot = slotData.find(s => s.slot_id === slotId && s.slot_type === slotType);
  } else {
    selectedSlot = null;
  }
  
  calculate();
}

// Validate slot selection when field loses focus
function validateSlotSelection() {
  if (slotInput.value && !selectedSlot) {
    showError('Please select a valid slot from the dropdown list.');
    slotInput.value = '';
    calculate();
  }
}

// Calculate all financial values
function calculate() {
  if (!selectedSlot) {
    resetCalculations();
    return;
  }

  const slotType = selectedSlot.slot_type;
  const basePrice = slotType === 'plot' ? 300000 : 10000000;
  const vat = basePrice * 0.12;
  const priceWithVAT = basePrice + vat;
  const adminFee = slotType === 'plot' ? 5000 : 25000;
  const spotCashTotal = priceWithVAT + adminFee;
  const downPayment = priceWithVAT * 0.2;

  let interestRate = 0;
  let amortization = 0;
  let years = parseInt(yearsToPay.value);

  // Set interest rates based on payment term
  if (years === 60) interestRate = 0.00525;       // 5 years
  else if (years === 120) interestRate = 0.00623; // 10 years
  else if (years === 36) interestRate = 0.0034286;// 3 years

  // Calculate amortization if not full payment
  if (years > 0) {
    const principal = priceWithVAT - downPayment;
    amortization = principal * ((interestRate * Math.pow(1 + interestRate, years - 1)) / 
                   (Math.pow(1 + interestRate, years - 1) - 1));
  }

  const finalPrice = years > 0 ? downPayment + (amortization * (years - 1)) : spotCashTotal;

  // Update the UI
  document.getElementById('contractPrice').textContent = `₱${basePrice.toLocaleString()}`;
  document.getElementById('vatAmount').textContent = `₱${vat.toLocaleString()}`;
  document.getElementById('priceWithVAT').textContent = `₱${priceWithVAT.toLocaleString()}`;
  document.getElementById('adminFee').textContent = `₱${adminFee.toLocaleString()}`;
  document.getElementById('spotCashTotal').textContent = `₱${spotCashTotal.toLocaleString()}`;
  document.getElementById('downPayment').textContent = `₱${downPayment.toLocaleString()}`;
  document.getElementById('interestRate').textContent = interestRate > 0 ? `${(interestRate * 100).toFixed(2)}%` : '-';
  document.getElementById('monthlyAmortization').textContent = amortization > 0 ? `₱${amortization.toFixed(2)}` : '-';
  document.getElementById('finalPrice').textContent = `₱${finalPrice.toLocaleString()}`;
}

// Reset all calculation fields
function resetCalculations() {
  const fields = [
    'contractPrice', 'vatAmount', 'priceWithVAT', 'adminFee',
    'spotCashTotal', 'downPayment', 'interestRate', 'monthlyAmortization', 'finalPrice'
  ];
  
  fields.forEach(id => {
    document.getElementById(id).textContent = '-';
  });
}

function handleFormSubmit(e) {
    e.preventDefault();
    
    // Validate slot selection
    if (!slotInput.value.match(/Slot \d+ \(\w+\)/) || !selectedSlot) {
        showError('Please select a valid slot from the dropdown list.');
        return;
    }

    // Validate deceased details
    const deceasedName = document.getElementById('deceasedName').value.trim();
    const birthDate = document.getElementById('birthDate').value;
    const deathDate = document.getElementById('deathDate').value;
    
    if (!deceasedName || !birthDate || !deathDate) {
        showError('Please complete all deceased information fields.');
        return;
    }

    // Populate confirmation modal with deceased info
    document.getElementById('modalSlot').textContent = `Slot ${selectedSlot.slot_id} (${selectedSlot.slot_type})`;
    document.getElementById('modalPayment').textContent = paymentMethod.options[paymentMethod.selectedIndex].text;
    document.getElementById('modalTerm').textContent = yearsToPay.value === '0' ? 'Full Payment' : `${yearsToPay.value / 12} Years`;
    document.getElementById('modalPrice').textContent = document.getElementById('finalPrice').textContent;
    
    // Add deceased info to modal
    const modalBody = document.getElementById('modalBody');
    const deceasedInfo = document.createElement('div');
    deceasedInfo.className = 'modal-summary';
    deceasedInfo.innerHTML = `
        <h4>Deceased Information</h4>
        <p><strong>Name:</strong> <span>${deceasedName}</span></p>
        <p><strong>Date of Birth:</strong> <span>${formatDate(birthDate)}</span></p>
        <p><strong>Date of Death:</strong> <span>${formatDate(deathDate)}</span></p>
    `;
    modalBody.appendChild(deceasedInfo);

    confirmationModal.style.display = 'block';
}

// Add this helper function to format dates
function formatDate(dateString) {
    if (!dateString) return '-';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

// Update the purchase confirmation handler
async function handlePurchaseConfirmation() {
    const payload = {
        slot_id: selectedSlot.slot_id,
        client_id: clientId,
        years_to_pay: parseInt(yearsToPay.value),
        payment_method: paymentMethod.value,
        deceased_name: document.getElementById('deceasedName').value.trim(),
        birth_date: document.getElementById('birthDate').value,
        death_date: document.getElementById('deathDate').value
    };

    try {
        const res = await fetch('/api/contracts/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        
        if (res.ok) {
            confirmationModal.style.display = 'none';
            location.reload();
        
            document.getElementById('planForm').reset();
            fetchAvailableSlots();
        } else {
            showError('Failed to create contract: ' + (data.message || 'Unknown error'));
        }
    } catch (error) {
        showError('Network error: ' + error.message);
    }
}

// Show error modal
function showError(message) {
  document.getElementById('errorMessage').textContent = message;
  errorModal.style.display = 'block';
}

// Show success message (could be enhanced with a proper success modal)
function showSuccess(message) {
  alert(message); // Replace with a proper success modal if desired
}

// Close all modals
function closeAllModals() {
    confirmationModal.style.display = 'none';
    errorModal.style.display = 'none';
}