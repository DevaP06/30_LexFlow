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
      if (localStorage.getItem('lexflow_seeded')) return;

      try {
        const resp = await fetch(jsonPath);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();

        Object.keys(data).forEach(key => {
          if (_read(key).length === 0) {
            _write(key, data[key]);
          }
        });

        localStorage.setItem('lexflow_seeded', 'true');
        console.log('[StorageService] Seed complete.');
      } catch (err) {
        console.error('[StorageService] Seed failed:', err);
      }
    }
  };
})();
