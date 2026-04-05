const StorageService = (() => {
  'use strict';

  let seedInFlight = null;

  function _mergeById(existing, incoming) {
    const map = new Map();
    (Array.isArray(existing) ? existing : []).forEach((item) => {
      if (item && item.id !== undefined && item.id !== null) {
        map.set(String(item.id), item);
      }
    });
    (Array.isArray(incoming) ? incoming : []).forEach((item) => {
      if (item && item.id !== undefined && item.id !== null) {
        map.set(String(item.id), item);
      }
    });
    return Array.from(map.values());
  }

  function _read(key) {
    if (key === 'lawFirms') key = 'lexflow_law_firms';
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function _write(key, arr) {
    if (key === 'lawFirms') key = 'lexflow_law_firms';
    localStorage.setItem(key, JSON.stringify(arr));
    // Intentionally keep two keys:
    // - users: StorageService/Auth workflows
    // - lexflow_users: CasesStorage/case workflows
    // Always merge by id into lexflow_users to avoid clobbering users seeded elsewhere.
    if (key === 'users') {
      const existingMirror = _read('lexflow_users');
      const mergedMirror = _mergeById(existingMirror, arr);
      localStorage.setItem('lexflow_users', JSON.stringify(mergedMirror));
    }
  }

  return {
    getAll(key) {
      return _read(key);
    },

    getById(key, id) {
      if (key === 'lawFirms') key = 'lexflow_law_firms';
      return _read(key).find(item => String(item.id) === String(id));
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
      if (key === 'lawFirms') key = 'lexflow_law_firms';
      const collection = _read(key);
      const idx = collection.findIndex(item => String(item.id) === String(id));
      if (idx === -1) return null;

      collection[idx] = { ...collection[idx], ...newData };
      _write(key, collection);
      return collection[idx];
    },

    remove(key, id) {
      if (key === 'lawFirms') key = 'lexflow_law_firms';
      const collection = _read(key);
      const filtered = collection.filter(item => String(item.id) !== String(id));
      if (filtered.length === collection.length) return false;

      _write(key, filtered);
      return true;
    },

    async seed(jsonPath) {
      if (seedInFlight) return seedInFlight;

      seedInFlight = (async () => {
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
      })();

      try {
        await seedInFlight;
      } finally {
        seedInFlight = null;
      }
    }
  };
})();
