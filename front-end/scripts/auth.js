const AuthService = (() => {
  'use strict';

  return {
    getCurrentUser() {
      try {
        const raw = localStorage.getItem('currentUser');
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    },

    login(email, password) {
      const users = StorageService.getAll('users');
      const user = users.find(
        u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
      );

      if (!user) {
        return { success: false, error: 'Invalid email or password.' };
      }

      const { password: _pw, ...safeUser } = user;
      localStorage.setItem('currentUser', JSON.stringify(safeUser));
      return { success: true, user: safeUser };
    },

    logout() {
      localStorage.removeItem('currentUser');
      window.location.href = 'SignIn.html';
    },

    requireAuth(allowedRoles) {
      const user = this.getCurrentUser();

      if (!user) {
        window.location.href = 'SignIn.html';
        return null;
      }

      if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        window.location.href = 'SignIn.html';
        return null;
      }

      return user;
    }
  };
})();
