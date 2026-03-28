/**
 * LexFlow – shared client-side validation helpers.
 */
(function (global) {
  'use strict';
  function personName(name) {
    const t = (name == null ? '' : String(name)).trim().replace(/\s+/g, ' ');
    if (t.length < 2) return { ok: false, message: 'Name must be at least 2 characters.' };
    if (t.length > 120) return { ok: false, message: 'Name must be at most 120 characters.' };
    if (/[<>]/.test(t)) return { ok: false, message: 'Name cannot contain < or >.' };
    if (!/[a-zA-Z\u00C0-\u024F\u0900-\u097F]/.test(t)) return { ok: false, message: 'Name must contain at least one letter.' };
    return { ok: true, value: t };
  }
  function email(addr) {
    const t = (addr == null ? '' : String(addr)).trim();
    if (!t) return { ok: false, message: 'Email is required.' };
    if (t.length > 254) return { ok: false, message: 'Email is too long.' };
    const re = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
    if (!re.test(t)) return { ok: false, message: 'Enter a valid email (e.g. name@company.com).' };
    const domain = t.split('@')[1] || '';
    if (!domain.includes('.')) return { ok: false, message: 'Email domain must include a dot (e.g. .com).' };
    return { ok: true, value: t.toLowerCase() };
  }
  function phone(phoneStr, options) {
    const required = !!(options && options.required);
    const raw = (phoneStr == null ? '' : String(phoneStr)).trim();
    if (!raw) return required ? { ok: false, message: 'Phone number is required.' } : { ok: true, value: '' };
    const digits = raw.replace(/\D/g, '');
    if (digits.length < 10 || digits.length > 15) return { ok: false, message: 'Phone must contain between 10 and 15 digits.' };
    return { ok: true, value: raw };
  }
  function integerString(str, label, min, max) {
    const lab = label || 'Value';
    const s = str == null ? '' : String(str).trim();
    if (s === '') return { ok: false, message: lab + ' is required.' };
    if (!/^-?\d+$/.test(s)) return { ok: false, message: lab + ' must be a whole number (no decimals or letters).' };
    const n = parseInt(s, 10);
    if (min != null && n < min) return { ok: false, message: lab + ' must be at least ' + min + '.' };
    if (max != null && n > max) return { ok: false, message: lab + ' must be at most ' + max + '.' };
    return { ok: true, value: n };
  }
  function positiveIntegerString(str, label) { return integerString(str, label, 1); }
  function setFieldError(inputEl, errorEl, message) {
    if (errorEl) { errorEl.textContent = message || ''; errorEl.hidden = !message; }
    if (inputEl) {
      inputEl.setAttribute('aria-invalid', message ? 'true' : 'false');
      if (message) inputEl.classList.add('form-input--error'); else inputEl.classList.remove('form-input--error');
    }
  }
  function clearFieldError(inputEl, errorEl) { setFieldError(inputEl, errorEl, ''); }
  function clearAllFieldErrors(pairs) { pairs.forEach(function (p) { clearFieldError(p.input, p.error); }); }
  function bindClearOnInput(inputEl, errorEl) {
    if (!inputEl || !errorEl) return;
    inputEl.addEventListener('input', function () { clearFieldError(inputEl, errorEl); });
  }
  global.LexFlowValidation = {
    personName: personName, email: email, phone: phone, integerString: integerString, positiveIntegerString: positiveIntegerString,
    setFieldError: setFieldError, clearFieldError: clearFieldError, clearAllFieldErrors: clearAllFieldErrors, bindClearOnInput: bindClearOnInput
  };
})(typeof window !== 'undefined' ? window : globalThis);
