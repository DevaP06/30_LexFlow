const StorageService = (() => {
  'use strict';

  function _read(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function _write(key, arr) {
    localStorage.setItem(key, JSON.stringify(arr));
    // Mirror users to lexflow_users so CasesStorage (assign-lawyer) stays in sync
    if (key === 'users') {
      localStorage.setItem('lexflow_users', JSON.stringify(arr));
    }
  }

  return {
    getAll(key) {
      return _read(key);
    },

    getById(key, id) {
      return _read(key).find(item => item.id === id);
    },

    create(key, data) {
      const collection = _read(key);
      const record = {
        id: Date.now(),
        createdAt: new Date().toISOString(),
        ...data
      };
      collection.push(record);
      _write(key, collection);
      return record;
    },

    update(key, id, newData) {
      const collection = _read(key);
      const idx = collection.findIndex(item => item.id === id);
      if (idx === -1) return null;

      collection[idx] = { ...collection[idx], ...newData };
      _write(key, collection);
      return collection[idx];
    },

    remove(key, id) {
      const collection = _read(key);
      const filtered = collection.filter(item => item.id !== id);
      if (filtered.length === collection.length) return false;

      _write(key, filtered);
      return true;
    },

    async seed(jsonPath) {
      // Check if data needs updating (e.g., if superAdmin user is missing)
      const users = _read('users');
      const hasSuperAdmin = users.some(u => u.role === 'superAdmin');
      
      // If already seeded but superAdmin is missing, force reseed
      if (localStorage.getItem('lexflow_seeded') && hasSuperAdmin) {
        return;
      }

      try {
        const resp = await fetch(jsonPath);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();

        Object.keys(data).forEach(key => {
          const existingData = _read(key);
          
          // For users, merge instead of skip to include new roles like superAdmin
          if (key === 'users') {
            const newUsers = data[key];
            const mergedUsers = [...existingData];
            
            newUsers.forEach(newUser => {
              const exists = mergedUsers.find(u => u.id === newUser.id);
              if (!exists) {
                mergedUsers.push(newUser);
              }
            });
            
            _write(key, mergedUsers);
          } else if (existingData.length === 0) {
            _write(key, data[key]);
          }
        });

        localStorage.setItem('lexflow_seeded', 'true');
        localStorage.setItem('lexflow_seed_version', '2');
        console.log('[StorageService] Seed complete.');
      } catch (err) {
        console.error('[StorageService] Seed failed:', err);
      }
    }
  };
})();
