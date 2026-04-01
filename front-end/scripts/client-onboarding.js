document.addEventListener('DOMContentLoaded', async () => {
  'use strict';

  await StorageService.seed('../data/initialData.json');

  const DRAFT_KEY = 'clientDraft';

  const profileForm = document.getElementById('profile-form');

  if (profileForm) {
    const draft = JSON.parse(sessionStorage.getItem(DRAFT_KEY) || '{}');
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

    profileForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const formData = {
        fullName:   _val('full-name'),
        email:      _val('email'),
        phone:      _val('phone'),
        clientType: _val('client-type'),
        street:     _val('street'),
        city:       _val('city'),
        state:      _val('state'),
        zip:        _val('zip')
      };

      if (!formData.fullName || !formData.email || !formData.phone) {
        _showAlert('profile-alert', 'Please fill in all required fields.');
        return;
      }

      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
      _showToast('Profile saved! Moving to case details…');

      setTimeout(() => {
        window.location.href = 'Client Onboarding step2.html';
      }, 600);
    });
  }

  const caseForm = document.getElementById('case-form');

  if (caseForm) {
    document.querySelectorAll('.chip').forEach(chip => {
      chip.addEventListener('click', () => {
        chip.classList.toggle('selected');
      });
    });

    caseForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const draft = JSON.parse(sessionStorage.getItem(DRAFT_KEY) || '{}');

      if (!draft.fullName) {
        _showAlert('case-alert', 'Profile data is missing. Please go back to Step 1.');
        return;
      }

      const caseData = {
        caseType:        _val('case-type'),
        courtName:       _val('court-name'),
        cnrNumber:       _val('cnr'),
        caseDescription: _val('description'),
        preferences:     _getSelectedChips()
      };

      const merged = { ...draft, ...caseData };

      StorageService.create('clients', merged);

      const existingUsers = StorageService.getAll('users');
      const alreadyExists = existingUsers.some(
        u => u.email.toLowerCase() === merged.email.toLowerCase()
      );

      let user;
      if (!alreadyExists) {
        user = StorageService.create('users', {
          fullName: merged.fullName,
          email:    merged.email,
          phone:    merged.phone,
          password: 'client123',
          role:     'client'
        });
      } else {
        user = existingUsers.find(
          u => u.email.toLowerCase() === merged.email.toLowerCase()
        );
      }

      const { password: _pw, ...safeUser } = user;
      localStorage.setItem('currentUser', JSON.stringify(safeUser));

      sessionStorage.removeItem(DRAFT_KEY);

      _showToast('Account created successfully! Redirecting…');

      setTimeout(() => {
        window.location.href = 'client-consultation-dashboard.html';
      }, 800);
    });
  }

  function _val(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : '';
  }

  function _setVal(id, value) {
    const el = document.getElementById(id);
    if (el) el.value = value;
  }

  function _showAlert(id, msg) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = msg;
    el.style.display = 'block';
    setTimeout(() => { el.style.display = 'none'; }, 4000);
  }

  function _getSelectedChips() {
    return Array.from(document.querySelectorAll('.chip.selected'))
      .map(c => c.textContent.trim());
  }

  function _showToast(msg) {
    const existing = document.querySelector('.lexflow-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'lexflow-toast';
    toast.textContent = msg;
    document.body.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
});
