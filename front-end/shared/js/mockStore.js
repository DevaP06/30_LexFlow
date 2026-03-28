(function (global) {
  'use strict';
  var STORAGE_KEY = 'lexflow_mock_data';
  var cache = null;
  function load(fetchUrl) {
    return fetch(fetchUrl).then(function (res) {
      if (!res.ok) throw new Error('Failed to load mock data: ' + res.status);
      return res.json();
    }).then(function (data) {
      cache = data;
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cache)); } catch (e) { console.warn(e); }
      return cache;
    });
  }
  function loadOrHydrate(fetchUrl) {
    try {
      var stored = localStorage.getItem(STORAGE_KEY);
      if (stored) { cache = JSON.parse(stored); return Promise.resolve(cache); }
    } catch (e) { console.warn(e); }
    return load(fetchUrl);
  }
  function getData() { return cache; }
  function save() {
    if (!cache) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cache)); } catch (e) { console.error(e); }
  }
  global.LexFlowMockStore = { STORAGE_KEY: STORAGE_KEY, load: load, loadOrHydrate: loadOrHydrate, getData: getData, save: save };
})(typeof window !== 'undefined' ? window : globalThis);
