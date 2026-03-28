/**
 * LexFlow – Shared Form Validation Utility
 * Provides consistent input validation, formatting, and error display across all modules.
 *
 * Usage: include this script before module-specific JS files.
 *   <script src="../../shared/form-validation.js"></script>
 */

const LexValidation = (() => {
  /* ───────── Regex patterns ───────── */
  const PATTERNS = {
    email: /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/,
    phone: /^[\+]?[\d\s\-\(\)]{7,15}$/,
    phoneDigitsOnly: /\d/g,
    nameOnly: /^[a-zA-Z\s'.,-]{2,80}$/,
    cardNumber: /^\d{4}\s?\d{4}\s?\d{4}\s?\d{4}$/,
    expiryDate: /^(0[1-9]|1[0-2])\/\d{2}$/,
    cvc: /^\d{3,4}$/,
    cnr: /^[A-Za-z0-9\-\/]+$/,
  };

  /* ───────── Utility helpers ───────── */
  function showError(input, message) {
    clearError(input);
    input.classList.add('input-error');
    const errorEl = document.createElement('span');
    errorEl.className = 'validation-error-msg';
    errorEl.textContent = message;
    // Insert after the input (or after its parent if inside a wrapper)
    const parent = input.parentElement;
    if (parent) {
      const sibling = input.nextElementSibling;
      if (sibling && sibling.classList.contains('validation-error-msg')) return;
      parent.insertBefore(errorEl, input.nextSibling);
    }
  }

  function clearError(input) {
    input.classList.remove('input-error');
    const next = input.nextElementSibling;
    if (next && next.classList.contains('validation-error-msg')) {
      next.remove();
    }
  }

  function clearAllErrors(container) {
    if (!container) return;
    container.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
    container.querySelectorAll('.validation-error-msg').forEach(el => el.remove());
  }

  /* ───────── Validators (return error string or null) ───────── */
  function validateRequired(value, fieldLabel) {
    if (!value || !value.trim()) return `${fieldLabel} is required`;
    return null;
  }

  function validateEmail(value) {
    if (!value || !value.trim()) return 'Email address is required';
    if (!PATTERNS.email.test(value.trim())) return 'Please enter a valid email (e.g. user@domain.com)';
    return null;
  }

  function validatePhone(value) {
    if (!value || !value.trim()) return null; // phone is often optional
    const digits = value.replace(/\D/g, '');
    if (digits.length < 7 || digits.length > 15) return 'Phone number must be 7-15 digits';
    if (!PATTERNS.phone.test(value.trim())) return 'Invalid phone format (digits, +, -, spaces, parentheses only)';
    return null;
  }

  function validatePhoneRequired(value) {
    if (!value || !value.trim()) return 'Phone number is required';
    return validatePhone(value);
  }

  function validateName(value, fieldLabel = 'Name') {
    if (!value || !value.trim()) return `${fieldLabel} is required`;
    if (value.trim().length < 2) return `${fieldLabel} must be at least 2 characters`;
    if (!PATTERNS.nameOnly.test(value.trim())) return `${fieldLabel} should contain only letters, spaces, and common punctuation`;
    return null;
  }

  function validateCardNumber(value) {
    if (!value || !value.trim()) return 'Card number is required';
    const digits = value.replace(/\s/g, '');
    if (!/^\d+$/.test(digits)) return 'Card number must contain only digits';
    if (digits.length !== 16) return 'Card number must be 16 digits';
    return null;
  }

  function validateExpiry(value) {
    if (!value || !value.trim()) return 'Expiry date is required';
    if (!PATTERNS.expiryDate.test(value.trim())) return 'Use MM/YY format';
    const [mm, yy] = value.trim().split('/').map(Number);
    const now = new Date();
    const expiry = new Date(2000 + yy, mm); // 1st of month after
    if (expiry < now) return 'Card has expired';
    return null;
  }

  function validateCVC(value) {
    if (!value || !value.trim()) return 'CVC is required';
    if (!PATTERNS.cvc.test(value.trim())) return 'CVC must be 3-4 digits';
    return null;
  }

  function validateSelect(value, fieldLabel) {
    if (!value || value === '') return `Please select a ${fieldLabel}`;
    return null;
  }

  function validateDate(value, fieldLabel = 'Date') {
    if (!value || !value.trim()) return `${fieldLabel} is required`;
    const d = new Date(value);
    if (isNaN(d.getTime())) return `Please enter a valid ${fieldLabel.toLowerCase()}`;
    return null;
  }

  function validateProgress(value) {
    const n = parseInt(value, 10);
    if (isNaN(n)) return 'Progress must be a number';
    if (n < 0 || n > 100) return 'Progress must be between 0 and 100';
    return null;
  }

  /* ───────── Live input formatting ───────── */
  function formatPhoneInput(input) {
    input.addEventListener('input', (e) => {
      let val = e.target.value;
      // Allow only digits, +, -, (, ), and spaces
      val = val.replace(/[^\d\+\-\(\)\s]/g, '');
      e.target.value = val;
    });
    input.addEventListener('blur', () => clearError(input));
  }

  function formatCardNumberInput(input) {
    input.addEventListener('input', (e) => {
      let val = e.target.value.replace(/\D/g, '');
      if (val.length > 16) val = val.slice(0, 16);
      if (val.length > 0) {
        val = val.match(/.{1,4}/g).join(' ');
      }
      e.target.value = val;
    });
    input.addEventListener('blur', () => {
      const err = validateCardNumber(input.value);
      if (err) showError(input, err); else clearError(input);
    });
  }

  function formatExpiryInput(input) {
    input.addEventListener('input', (e) => {
      let val = e.target.value.replace(/[^\d\/]/g, '');
      // Auto-insert slash after 2 digits
      if (val.length === 2 && !val.includes('/')) {
        val = val + '/';
      }
      // Don't allow more than 5 chars
      if (val.length > 5) val = val.slice(0, 5);
      e.target.value = val;
    });
    input.addEventListener('blur', () => {
      const err = validateExpiry(input.value);
      if (err) showError(input, err); else clearError(input);
    });
  }

  function formatCVCInput(input) {
    input.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/\D/g, '').slice(0, 4);
    });
    input.addEventListener('blur', () => {
      const err = validateCVC(input.value);
      if (err) showError(input, err); else clearError(input);
    });
  }

  function formatNameInput(input) {
    input.addEventListener('input', (e) => {
      // Strip out numbers and unusual special characters
      e.target.value = e.target.value.replace(/[^a-zA-Z\s'.,\-]/g, '');
    });
  }

  /* ───────── Live blur validation ───────── */
  function attachBlurValidation(input, validatorFn) {
    input.addEventListener('blur', () => {
      const err = validatorFn(input.value);
      if (err) showError(input, err); else clearError(input);
    });
    // Clear error on focus so user gets a clean start
    input.addEventListener('focus', () => clearError(input));
  }

  /* ───────── Validate an entire form based on rules ───────── */
  /**
   * @param {Object[]} rules - Array of { input: HTMLElement, validator: fn(value) => errMsg|null }
   * @returns {boolean} true if all pass
   */
  function validateForm(rules) {
    let allValid = true;
    for (const rule of rules) {
      const err = rule.validator(rule.input.value);
      if (err) {
        showError(rule.input, err);
        if (allValid) rule.input.focus(); // focus the first invalid field
        allValid = false;
      } else {
        clearError(rule.input);
      }
    }
    return allValid;
  }

  /* ───────── Auto-initialise common fields on page load ───────── */
  function autoInit() {
    // Phone inputs
    document.querySelectorAll('input[type="tel"]').forEach(formatPhoneInput);
    // Email inputs – attach blur validation
    document.querySelectorAll('input[type="email"]').forEach(input => {
      attachBlurValidation(input, validateEmail);
    });
    // Number inputs with min/max (progress)
    document.querySelectorAll('input[type="number"][min][max]').forEach(input => {
      input.addEventListener('input', () => {
        const min = parseInt(input.min, 10);
        const max = parseInt(input.max, 10);
        let val = parseInt(input.value, 10);
        if (!isNaN(val)) {
          if (val < min) input.value = min;
          if (val > max) input.value = max;
        }
      });
    });
  }

  // Run auto-init when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    autoInit();
  }

  /* ───────── Public API ───────── */
  return {
    showError,
    clearError,
    clearAllErrors,
    validateRequired,
    validateEmail,
    validatePhone,
    validatePhoneRequired,
    validateName,
    validateCardNumber,
    validateExpiry,
    validateCVC,
    validateSelect,
    validateDate,
    validateProgress,
    validateForm,
    formatPhoneInput,
    formatCardNumberInput,
    formatExpiryInput,
    formatCVCInput,
    formatNameInput,
    attachBlurValidation,
    PATTERNS,
  };
})();
