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
const deceasedContainer = document.getElementById('deceased-container');

// Global Variables
let selectedSlot = null;
let slotData = [];
let deceasedCount = 1; // Track number of deceased forms

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
  fetchAvailableSlots();
  setupEventListeners();
  setupDeceasedContainer();
});

// Helper function for API calls
async function fetchWithAuth(url, options = {}) {
  const token = localStorage.getItem('access_token');
  const defaultOptions = {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    },
    credentials: 'include'
  };
  return fetch(url, { ...defaultOptions, ...options });
}

// Setup the initial deceased container
function setupDeceasedContainer() {
  // The first deceased form is already in the HTML
  // We'll add a container div to hold all deceased forms
  const fieldset = document.querySelector('.deceased-details');
  
  if (!fieldset) return;
  
  // Create container for all deceased forms
  const container = document.createElement('div');
  container.id = 'deceased-container';
  
  // Move existing deceased form elements into the first deceased form div
  const existingInputs = Array.from(fieldset.querySelectorAll('label, input, .form-group, .date-fields'));
  const firstDeceasedForm = document.createElement('div');
  firstDeceasedForm.className = 'deceased-form';
  firstDeceasedForm.dataset.index = 0;
  
  // Add a header with remove button for the first form
  const formHeader = document.createElement('div');
  formHeader.className = 'form-header';
  formHeader.innerHTML = `
    <h4>Deceased #1</h4>
    <button type="button" class="remove-deceased-btn" data-index="0">
      <i class="fas fa-times"></i>
    </button>
  `;
  firstDeceasedForm.appendChild(formHeader);
  
  // Add the existing inputs to the first form
  existingInputs.forEach(input => firstDeceasedForm.appendChild(input));
  
  // Add the first form to the container
  container.appendChild(firstDeceasedForm);
  
  // Create capacity indicator
  const capacityIndicator = document.createElement('div');
  capacityIndicator.className = 'capacity-indicator';
  capacityIndicator.innerHTML = `
    <div class="capacity-bar">
      <div class="capacity-progress"></div>
    </div>
    <div class="capacity-text">
      <span class="current-count">1</span>
      <span>Maximum: 10</span>
    </div>
  `;
  
  // Create "Add More" button
  const addMoreBtn = document.createElement('button');
  addMoreBtn.type = 'button';
  addMoreBtn.id = 'add-deceased-btn';
  addMoreBtn.className = 'btn-add-deceased';
  addMoreBtn.innerHTML = '<i class="fas fa-plus"></i> Add More Deceased';
  addMoreBtn.addEventListener('click', addDeceasedForm);
  
  // Clear the fieldset and add our new container and button
  fieldset.innerHTML = '';
  fieldset.appendChild(container);
  fieldset.appendChild(capacityIndicator);
  fieldset.appendChild(addMoreBtn);
  
  // Initially hide the remove button for the first form if it's the only one
  toggleRemoveButtons();
  
  // Hide the "Add More" button initially if slot is not mausoleum
  addMoreBtn.style.display = 'none';
  
  // Update capacity indicator
  updateCapacityIndicator();
}

// Add a new deceased form
function addDeceasedForm() {
  // Check if we've hit the maximum (10)
  const container = document.getElementById('deceased-container');
  if (container.children.length >= 10) {
    showError('Maximum of 10 deceased records reached for this mausoleum.');
    return;
  }
  
  deceasedCount++;
  const newIndex = container.children.length;
  
  const newForm = document.createElement('div');
  newForm.className = 'deceased-form';
  newForm.dataset.index = newIndex;
  
  // Add mausoleum-mode class if the selected slot is a mausoleum
  if (selectedSlot && selectedSlot.slot_type.toLowerCase() === 'mausoleum') {
    newForm.classList.add('mausoleum-mode');
  }
  
  newForm.innerHTML = `
    <div class="form-header">
      <h4>Deceased #${newIndex + 1}</h4>
      <button type="button" class="remove-deceased-btn" data-index="${newIndex}">
        <i class="fas fa-times"></i>
      </button>
    </div>
    <label for="deceasedName${newIndex}">Full Name:</label>
    <input type="text" id="deceasedName${newIndex}" name="deceased_name_${newIndex}" required>
    
    <div class="date-fields">
      <div class="form-group">
        <label for="birthDate${newIndex}">Date of Birth:</label>
        <input type="date" id="birthDate${newIndex}" name="birth_date_${newIndex}" required>
      </div>
      
      <div class="form-group">
        <label for="deathDate${newIndex}">Date of Death:</label>
        <input type="date" id="deathDate${newIndex}" name="death_date_${newIndex}" required>
      </div>
    </div>
  `;
  
  container.appendChild(newForm);
  
  // Add event listener to the remove button
  const removeBtn = newForm.querySelector('.remove-deceased-btn');
  removeBtn.addEventListener('click', function() {
    removeDeceasedForm(newIndex);
  });
  
  // Update the remove buttons visibility
  toggleRemoveButtons();
  
  // Update capacity indicator
  updateCapacityIndicator();
  
  // Scroll to the new form
  newForm.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  
  // If we've reached the maximum, disable the add button
  const addMoreBtn = document.getElementById('add-deceased-btn');
  if (container.children.length >= 10) {
    addMoreBtn.disabled = true;
    addMoreBtn.innerHTML = '<i class="fas fa-exclamation-circle"></i> Maximum Limit Reached';
    addMoreBtn.style.opacity = '0.7';
  }
}

// Remove a deceased form
function removeDeceasedForm(index) {
  const container = document.getElementById('deceased-container');
  const formToRemove = container.querySelector(`.deceased-form[data-index="${index}"]`);
  
  if (formToRemove) {
    formToRemove.remove();
    deceasedCount--;
    
    // Update indices and headings for remaining forms
    const remainingForms = container.querySelectorAll('.deceased-form');
    remainingForms.forEach((form, i) => {
      form.dataset.index = i;
      form.querySelector('h4').textContent = `Deceased #${i + 1}`;
      form.querySelector('.remove-deceased-btn').dataset.index = i;
    });
    
    // Update the remove buttons visibility
    toggleRemoveButtons();
    
    // Update capacity indicator
    updateCapacityIndicator();
    
    // Re-enable the add button if it was disabled
    const addMoreBtn = document.getElementById('add-deceased-btn');
    if (addMoreBtn.disabled) {
      addMoreBtn.disabled = false;
      addMoreBtn.innerHTML = '<i class="fas fa-plus"></i> Add More Deceased';
      addMoreBtn.style.opacity = '1';
    }
  }
}

// Toggle visibility of remove buttons based on number of forms
function toggleRemoveButtons() {
  const container = document.getElementById('deceased-container');
  const forms = container.querySelectorAll('.deceased-form');
  
  // Only show remove buttons if there's more than one form
  forms.forEach(form => {
    const removeBtn = form.querySelector('.remove-deceased-btn');
    removeBtn.style.display = forms.length > 1 ? 'block' : 'none';
  });
}

// Update the capacity indicator
function updateCapacityIndicator() {
  const container = document.getElementById('deceased-container');
  const capacityIndicator = document.querySelector('.capacity-indicator');
  
  if (!container || !capacityIndicator) return;
  
  const formCount = container.children.length;
  const progressBar = capacityIndicator.querySelector('.capacity-progress');
  const countText = capacityIndicator.querySelector('.current-count');
  
  // Update the count text
  countText.textContent = formCount;
  
  // Update the progress bar width (10% per deceased, max 100%)
  const progressPercent = Math.min(formCount * 10, 100);
  progressBar.style.width = `${progressPercent}%`;
  
  // Change color based on capacity
  if (formCount <= 3) {
    progressBar.style.backgroundColor = '#4caf50'; // Green
  } else if (formCount <= 7) {
    progressBar.style.backgroundColor = '#ff9800'; // Orange
  } else {
    progressBar.style.backgroundColor = '#f44336'; // Red
  }
}

// Show/hide the "Add More" button based on slot type
function toggleAddMoreButton() {
  const addMoreBtn = document.getElementById('add-deceased-btn');
  const capacityIndicator = document.querySelector('.capacity-indicator');
  
  if (!addMoreBtn || !selectedSlot) return;
  
  console.log('Selected slot type:', selectedSlot.slot_type);
  
  // Make case-insensitive comparison for mausoleum
  if (selectedSlot.slot_type.toLowerCase() === 'mausoleum') {
    console.log('Mausoleum detected - showing Add More button');
    addMoreBtn.style.display = 'block';
    
    // Show capacity indicator
    if (capacityIndicator) {
      capacityIndicator.style.display = 'block';
    }
    
    // Add a note about capacity
    let capacityNote = document.getElementById('capacity-note');
    if (!capacityNote) {
      capacityNote = document.createElement('p');
      capacityNote.id = 'capacity-note';
      capacityNote.className = 'capacity-note';
      addMoreBtn.parentNode.insertBefore(capacityNote, addMoreBtn);
    }
    capacityNote.textContent = 'Note: Mausoleum can hold up to 10 deceased records.';
    
    // Enable multiple deceased forms
    const container = document.getElementById('deceased-container');
    const forms = container.querySelectorAll('.deceased-form');
    forms.forEach(form => {
      form.classList.add('mausoleum-mode');
    });
    
    // Update capacity indicator
    updateCapacityIndicator();
  } else {
    console.log('Not a mausoleum - hiding Add More button');
    addMoreBtn.style.display = 'none';
    
    // Hide capacity indicator
    if (capacityIndicator) {
      capacityIndicator.style.display = 'none';
    }
    
    // Remove capacity note if it exists
    const capacityNote = document.getElementById('capacity-note');
    if (capacityNote) capacityNote.remove();
    
    // Keep only the first form for plot slots
    const container = document.getElementById('deceased-container');
    const forms = container.querySelectorAll('.deceased-form');
    
    // If there are multiple forms, keep only the first one
    if (forms.length > 1) {
      Array.from(forms).slice(1).forEach(form => form.remove());
      deceasedCount = 1;
      
      // Update the first form's remove button visibility
      toggleRemoveButtons();
      
      // Update capacity indicator
      updateCapacityIndicator();
    }
    
    // Disable multiple deceased forms styling
    forms.forEach(form => {
      form.classList.remove('mausoleum-mode');
    });
  }
}

// Fetch available slots from API
async function fetchAvailableSlots() {
  try {
    const response = await fetchWithAuth('/api/available_slots');
    if (!response.ok) {
      throw new Error('Failed to fetch slots');
    }
    slotData = await response.json();
    populateSlotDropdown();
  } catch (error) {
    showError('Failed to load available slots. Please try again later.');
  }
}

// Populate the slot dropdown list
function populateSlotDropdown() {
  slotList.innerHTML = '';
  
  // Log available mausoleum slots for debugging
  const mausoleumSlots = slotData.filter(slot => 
    slot.slot_type.toLowerCase() === 'mausoleum' ||
    slot.slot_type.toLowerCase().includes('mausoleum')
  );
  console.log('Available mausoleum slots:', mausoleumSlots);
  
  slotData.forEach(slot => {
    const option = document.createElement('option');
    const displayType = slot.slot_type.charAt(0).toUpperCase() + slot.slot_type.slice(1).toLowerCase();
    option.value = `Slot ${slot.slot_id} (${displayType})`;
    option.dataset.id = slot.slot_id;
    option.dataset.type = slot.slot_type;
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
    console.log(`Slot selected: ID=${slotId}, Type=${slotType}`);
    
    // Find the selected slot in our data
    selectedSlot = slotData.find(s => s.slot_id === slotId);
    
    if (selectedSlot) {
      console.log('Found slot in data:', selectedSlot);
      // Toggle "Add More" button based on slot type
      toggleAddMoreButton();
    } else {
      console.log('Slot not found in data');
      selectedSlot = null;
    }
  } else {
    console.log('No slot match in input value:', slotInput.value);
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

// Gather all deceased information from the forms
function getDeceasedInfo() {
  const container = document.getElementById('deceased-container');
  const forms = container.querySelectorAll('.deceased-form');
  const deceasedInfo = [];
  
  forms.forEach((form, index) => {
    const nameId = index === 0 ? 'deceasedName' : `deceasedName${index}`;
    const birthDateId = index === 0 ? 'birthDate' : `birthDate${index}`;
    const deathDateId = index === 0 ? 'deathDate' : `deathDate${index}`;
    
    const name = form.querySelector(`#${nameId}`).value.trim();
    const birthDate = form.querySelector(`#${birthDateId}`).value;
    const deathDate = form.querySelector(`#${deathDateId}`).value;
    
    if (name && birthDate && deathDate) {
      deceasedInfo.push({
        name: name,
        birth_date: birthDate,
        death_date: deathDate
      });
    }
  });
  
  return deceasedInfo;
}

// Update handleFormSubmit to use authentication
async function handleFormSubmit(e) {
    e.preventDefault();
    
    // Validate slot selection
    if (!slotInput.value.match(/Slot \d+ \(\w+\)/) || !selectedSlot) {
        showError('Please select a valid slot from the dropdown list.');
        return;
    }

    // Gather deceased info from all forms
    const deceasedInfo = getDeceasedInfo();
    
    if (deceasedInfo.length === 0) {
        showError('Please complete at least one deceased information form.');
        return;
    }
    
    // Check if mausoleum has too many deceased records
    if (selectedSlot.slot_type.toLowerCase() === 'mausoleum' && deceasedInfo.length > 10) {
        showError('Mausoleum can hold a maximum of 10 deceased records.');
        return;
    }

    // Populate confirmation modal
    document.getElementById('modalSlot').textContent = `Slot ${selectedSlot.slot_id} (${selectedSlot.slot_type})`;
    document.getElementById('modalPayment').textContent = paymentMethod.options[paymentMethod.selectedIndex].text;
    document.getElementById('modalTerm').textContent = yearsToPay.value === '0' ? 'Full Payment' : `${yearsToPay.value / 12} Years`;
    document.getElementById('modalPrice').textContent = document.getElementById('finalPrice').textContent;
    
    // Add deceased info to modal
    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = '<p>Are you sure you want to purchase this plan?</p><div class="modal-summary"><p><strong>Slot:</strong> <span id="modalSlot"></span></p><p><strong>Payment Method:</strong> <span id="modalPayment"></span></p><p><strong>Term:</strong> <span id="modalTerm"></span></p><p><strong>Final Price:</strong> <span id="modalPrice"></span></p></div>';
    
    // Update slot, payment, term, and price
    document.getElementById('modalSlot').textContent = `Slot ${selectedSlot.slot_id} (${selectedSlot.slot_type})`;
    document.getElementById('modalPayment').textContent = paymentMethod.options[paymentMethod.selectedIndex].text;
    document.getElementById('modalTerm').textContent = yearsToPay.value === '0' ? 'Full Payment' : `${yearsToPay.value / 12} Years`;
    document.getElementById('modalPrice').textContent = document.getElementById('finalPrice').textContent;
    
    // Add deceased info section
    const deceasedInfoSection = document.createElement('div');
    deceasedInfoSection.className = 'deceased-info-section';
    deceasedInfoSection.innerHTML = `<h4>Deceased Information (${deceasedInfo.length})</h4>`;
    
    const deceasedList = document.createElement('div');
    deceasedList.className = 'deceased-list';
    
    deceasedInfo.forEach((info, i) => {
        // Use the provided name directly since this is coming from user input in the form
        const displayName = info.name;
        
        const deceasedItem = document.createElement('div');
        deceasedItem.className = 'deceased-item';
        deceasedItem.innerHTML = `
            <p><strong>${i+1}. ${displayName}</strong></p>
            <p>Born: ${formatDate(info.birth_date)}</p>
            <p>Died: ${formatDate(info.death_date)}</p>
        `;
        deceasedList.appendChild(deceasedItem);
    });
    
    deceasedInfoSection.appendChild(deceasedList);
    modalBody.appendChild(deceasedInfoSection);

    confirmationModal.style.display = 'block';
}

// Add this helper function to format dates
function formatDate(dateString) {
    if (!dateString) return '-';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

// Update handlePurchaseConfirmation
async function handlePurchaseConfirmation() {
    try {
        const deceasedInfo = getDeceasedInfo();

        const payload = {
            slot_id: selectedSlot.slot_id,
            payment_method: paymentMethod.value,
            years_to_pay: parseInt(yearsToPay.value),
            deceased_info: deceasedInfo
        };

        const response = await fetchWithAuth('/api/contracts/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to create contract');
        }

        const result = await response.json();
        showSuccess('Contract created successfully!');
        setTimeout(() => {
            window.location.href = '/dashboard/payment';
        }, 2000);
    } catch (error) {
        showError(error.message);
    } finally {
        closeAllModals();
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