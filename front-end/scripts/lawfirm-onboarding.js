document.addEventListener('DOMContentLoaded', async () => {
  'use strict';

  await StorageService.seed('../data/initialData.json');

  const DRAFT_KEY = 'firmDraft';

  const title = document.title.toLowerCase();
  const isStep1 = title.includes('step 1') || title.includes('registration step 1');
  const isStep2 = title.includes('step 2') || title.includes('contact info step 2');
  const isStep3 = title.includes('step 3') || title.includes('admin setup');

  if (isStep1) initStep1();
  else if (isStep2) initStep2();
  else if (isStep3) initStep3();

  function initStep1() {
    const form = document.querySelector('form');
    if (!form) return;

    const draft = _getDraft();
    if (draft.fullName) {
      _setVal('full-name', draft.fullName);
      _setVal('email', draft.email);
      _setVal('phone', draft.phone);
      _setVal('client-type', draft.clientType);
      _setVal('street', draft.street);
      _setVal('city', draft.city);
      _setVal('state', draft.state);
      _setVal('zip', draft.zip);
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const data = {
        fullName:   _val('full-name'),
        email:      _val('email'),
        phone:      _val('phone'),
        clientType: _val('client-type'),
        street:     _val('street'),
        city:       _val('city'),
        state:      _val('state'),
        zip:        _val('zip')
      };

      if (!data.fullName || !data.email) {
        _showToast('Please fill in all required fields.', 'error');
        return;
      }

      _saveDraft(data);
      _showToast('Firm info saved!');

      setTimeout(() => {
        window.location.href = 'Lawfirmonboardingstep2.html';
      }, 600);
    });
  }

  function initStep2() {
    const form = document.querySelector('form');
    if (!form) return;

    const draft = _getDraft();

    if (draft.primaryEmail) {
      _setVal('primary-email', draft.primaryEmail);
      _setVal('phone', draft.contactPhone);
      _setVal('website', draft.website);
      _setVal('secondary-email', draft.secondaryEmail);
      _setVal('alt-phone', draft.altPhone);
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const contactData = {
        primaryEmail:   _val('primary-email'),
        contactPhone:   _val('phone'),
        website:        _val('website'),
        secondaryEmail: _val('secondary-email'),
        altPhone:       _val('alt-phone')
      };

      if (!contactData.primaryEmail || !contactData.contactPhone) {
        _showToast('Please fill in the required contact fields.', 'error');
        return;
      }

      _saveDraft({ ...draft, ...contactData });
      _showToast('Contact info saved!');

      setTimeout(() => {
        window.location.href = 'lawfirmonboardingstep3.html';
      }, 600);
    });
  }

  function initStep3() {
    const form = document.querySelector('form');
    if (!form) return;

    const draft = _getDraft();

    if (draft.adminName) {
      _setVal('admin-name', draft.adminName);
      _setVal('admin-email', draft.adminEmail);
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const adminName     = _val('admin-name');
      const adminEmail    = _val('admin-email');
      const password      = _val('password');
      const confirmPw     = _val('confirm-password');
      const termsChecked  = document.getElementById('terms')?.checked;

      if (!adminName || !adminEmail || !password) {
        _showToast('Please fill in all required fields.', 'error');
        return;
      }

      if (password !== confirmPw) {
        _showToast('Passwords do not match.', 'error');
        return;
      }

      if (!termsChecked) {
        _showToast('Please accept the Terms of Service.', 'error');
        return;
      }

      const existingUsers = StorageService.getAll('users');
      if (existingUsers.some(u => u.email.toLowerCase() === adminEmail.toLowerCase())) {
        _showToast('This email is already registered.', 'error');
        return;
      }

      const user = StorageService.create('users', {
        fullName: adminName,
        email:    adminEmail,
        password: password,
        phone:    draft.phone || '',
        role:     'firmAdmin'
      });

      const firmData = {
        ...draft,
        firmName:   draft.fullName || draft.firmName || 'Unnamed Firm',
        adminName:  adminName,
        adminEmail: adminEmail,
        adminId:    user.id
      };

      StorageService.create('lawFirms', firmData);

      const { password: _pw, ...safeUser } = user;
      localStorage.setItem('currentUser', JSON.stringify(safeUser));

      sessionStorage.removeItem(DRAFT_KEY);

      _showToast('Firm account created!');

      setTimeout(() => {
        window.location.href = 'firm-consultation-dashboard.html';
      }, 800);
    });
  }

  function _val(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : '';
  }

  function _setVal(id, value) {
    const el = document.getElementById(id);
    if (el && value) el.value = value;
  }

  function _getDraft() {
    return JSON.parse(sessionStorage.getItem(DRAFT_KEY) || '{}');
  }

  function _saveDraft(data) {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(data));
  }

  function _showToast(msg, type = 'success') {
    const existing = document.querySelector('.lexflow-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'lexflow-toast' + (type === 'error' ? ' toast-error' : '');
    toast.textContent = msg;
    document.body.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
});
