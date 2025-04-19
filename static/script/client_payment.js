const form = document.getElementById('paymentForm');
const receipt = document.getElementById('receipt');
const rName = document.getElementById('rName');
const rAmount = document.getElementById('rAmount');
const rMode = document.getElementById('rMode');

form.addEventListener('submit', function (e) {
  e.preventDefault();

  const fullName = document.getElementById('fullName').value;
  const planValue = document.getElementById('plan').value; // e.g., "Standard - ₱50,000"
  const [planName, planAmount] = planValue.split(" - ");
  const paymentMode = document.getElementById('paymentMode').value;

  rName.textContent = fullName;
  rAmount.textContent = `${planName} (${planAmount})`;
  rMode.textContent = paymentMode;

  receipt.classList.remove('hidden');
  form.reset();
});