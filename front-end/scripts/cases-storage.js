// LexFlow Cases Storage Module - Centralized case, task, and user data management
// Provides unified access to case-related resources across all workflows
// IIFE pattern: window.LexFlowCasesStorage

window.LexFlowCasesStorage = (function () {
  // Storage keys
  const MOCK_STORAGE_KEY = "lexflow_mock_data";
  const CASES_STORAGE_KEY = "lexflow_cases";
  const TASKS_STORAGE_KEY = "lexflow_tasks";
  // Intentionally read/write lexflow_users only; StorageService mirrors users -> lexflow_users.
  const USERS_STORAGE_KEY = "lexflow_users";
  const MOCK_PATH = "../scripts/client_casemanagement_mock-data.json";

  /**
   * Safely parse JSON from storage, with error handling
   * @param {string} value - Raw value from localStorage
   * @param {*} fallback - Value to return if parse fails
   * @returns {*} Parsed value or fallback
   */
  function safeParse(value, fallback) {
    try {
      return value ? JSON.parse(value) : fallback;
    } catch (error) {
      console.warn("Failed to parse storage value:", error);
      return fallback;
    }
  }

  /**
   * Load mock data object from storage
   * @returns {object|null} Mock data or null
   */
  function loadMockDataFromStorage() {
    try {
      return safeParse(localStorage.getItem(MOCK_STORAGE_KEY), null);
    } catch (e) {
      console.warn("Storage read failed for key:", MOCK_STORAGE_KEY, e);
      return null;
    }
  }

  /**
   * Load any JSON-keyed data from storage
   * @param {string} key - Storage key
   * @returns {*|null} Parsed data or null
   */
  function loadJsonFromStorage(key) {
    try {
      return safeParse(localStorage.getItem(key), null);
    } catch (e) {
      console.warn("Storage read failed for key:", key, e);
      return null;
    }
  }

  /**
   * Save JSON-keyed data to storage
   * @param {string} key - Storage key
   * @param {*} value - Value to save
   */
  function saveJsonToStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn("Storage write failed for key:", key, e);
    }
  }

  /**
   * Save mock data object to storage
   * @param {object} mockData - Mock data object
   */
  function saveMockDataToStorage(mockData) {
    try {
      localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(mockData));
    } catch (e) {
      console.warn("Storage write failed for key:", MOCK_STORAGE_KEY, e);
    }
  }

  /**
   * Sync legacy mock_data key with dedicated keys (backward compatibility)
   * Updates lexflow_mock_data to mirror dedicated storage keys
   */
  function syncLegacyFromDedicated() {
    const mock = loadMockDataFromStorage() || {};
    const cases = loadJsonFromStorage(CASES_STORAGE_KEY) || mock.cases || [];
    const tasks = loadJsonFromStorage(TASKS_STORAGE_KEY) || mock.tasks || [];
    const users = loadJsonFromStorage(USERS_STORAGE_KEY) || mock.users || [];

    mock.cases = cases;
    mock.tasks = tasks;
    mock.users = users;
    saveMockDataToStorage(mock);
  }

  /**
   * Save cases to all storage locations (dedicated + legacy mirror)
   * @param {array} cases - Cases array to save
   */
  function saveCasesToAllStores(cases) {
    const mock = loadMockDataFromStorage() || {};
    mock.cases = cases;
    if (!Array.isArray(mock.tasks)) {
      mock.tasks = loadJsonFromStorage(TASKS_STORAGE_KEY) || [];
    }
    if (!Array.isArray(mock.users)) {
      mock.users = loadJsonFromStorage(USERS_STORAGE_KEY) || [];
    }
    saveJsonToStorage(CASES_STORAGE_KEY, cases);
    saveMockDataToStorage(mock);
  }

  /**
   * Save tasks to all storage locations
   * @param {array} tasks - Tasks array to save
   */
  function saveTasksToAllStores(tasks) {
    const mock = loadMockDataFromStorage() || {};
    mock.tasks = tasks;
    if (!Array.isArray(mock.cases)) {
      mock.cases = loadJsonFromStorage(CASES_STORAGE_KEY) || [];
    }
    if (!Array.isArray(mock.users)) {
      mock.users = loadJsonFromStorage(USERS_STORAGE_KEY) || [];
    }
    saveJsonToStorage(TASKS_STORAGE_KEY, tasks);
    saveMockDataToStorage(mock);
  }

  /**
   * Save users to all storage locations
   * @param {array} users - Users array to save
   */
  function saveUsersToAllStores(users) {
    const mock = loadMockDataFromStorage() || {};
    mock.users = users;
    if (!Array.isArray(mock.cases)) {
      mock.cases = loadJsonFromStorage(CASES_STORAGE_KEY) || [];
    }
    if (!Array.isArray(mock.tasks)) {
      mock.tasks = loadJsonFromStorage(TASKS_STORAGE_KEY) || [];
    }
    saveJsonToStorage(USERS_STORAGE_KEY, users);
    saveMockDataToStorage(mock);
  }

  /**
   * Initialize and ensure cases storage is populated
   * Prioritizes: dedicated keys → mock_data → fetch from JSON
   * @returns {Promise<object>} Object with { cases, tasks, users }
   */
  async function ensureCasesStorage() {
    const mock = loadMockDataFromStorage();
    const cases = loadJsonFromStorage(CASES_STORAGE_KEY);
    const tasks = loadJsonFromStorage(TASKS_STORAGE_KEY);
    const users = loadJsonFromStorage(USERS_STORAGE_KEY);

    // Case 1: Have mock data, sync to dedicated keys if needed
    if (mock && Array.isArray(mock.cases)) {
      if (!Array.isArray(cases)) {
        saveJsonToStorage(CASES_STORAGE_KEY, mock.cases || []);
      }
      if (!Array.isArray(tasks)) {
        saveJsonToStorage(TASKS_STORAGE_KEY, mock.tasks || []);
      }
      if (!Array.isArray(users)) {
        saveJsonToStorage(USERS_STORAGE_KEY, mock.users || []);
      }
      syncLegacyFromDedicated();
      return {
        cases: loadJsonFromStorage(CASES_STORAGE_KEY) || mock.cases || [],
        tasks: loadJsonFromStorage(TASKS_STORAGE_KEY) || mock.tasks || [],
        users: loadJsonFromStorage(USERS_STORAGE_KEY) || mock.users || [],
      };
    }

    // Case 2: Have dedicated keys, sync legacy
    if (Array.isArray(cases)) {
      syncLegacyFromDedicated();
      return {
        cases: loadJsonFromStorage(CASES_STORAGE_KEY) || [],
        tasks: loadJsonFromStorage(TASKS_STORAGE_KEY) || [],
        users: loadJsonFromStorage(USERS_STORAGE_KEY) || [],
      };
    }

    // Case 3: Fetch from JSON and initialize all stores
    try {
      const response = await fetch(MOCK_PATH);
      const data = await response.json();
      saveMockDataToStorage(data);
      saveJsonToStorage(CASES_STORAGE_KEY, data.cases || []);
      saveJsonToStorage(TASKS_STORAGE_KEY, data.tasks || []);
      saveJsonToStorage(USERS_STORAGE_KEY, data.users || []);
      syncLegacyFromDedicated();
      return {
        cases: data.cases || [],
        tasks: data.tasks || [],
        users: data.users || [],
      };
    } catch (error) {
      console.error("Failed to load mock data:", error);
      return { cases: [], tasks: [], users: [] };
    }
  }

  /**
   * Get all cases from storage
   * @returns {Promise<array>} Cases array
   */
  async function getCases() {
    const data = await ensureCasesStorage();
    return Array.isArray(data.cases) ? data.cases : [];
  }

  /**
   * Get all tasks from storage
   * @returns {Promise<array>} Tasks array
   */
  async function getTasks() {
    const data = await ensureCasesStorage();
    return Array.isArray(data.tasks) ? data.tasks : [];
  }

  /**
   * Get all users from storage
   * @returns {Promise<array>} Users array
   */
  async function getUsers() {
    const data = await ensureCasesStorage();
    return Array.isArray(data.users) ? data.users : [];
  }

  /**
   * Get single case by CNR
   * @param {string} cnr - Case CNR number
   * @returns {Promise<object|null>} Case object or null
   */
  async function getCaseByCnr(cnr) {
    const cases = await getCases();
    return cases.find((c) => c.cnr === cnr) || null;
  }

  /**
   * Save updated cases (syncs to all stores)
   * @param {array} cases - Updated cases array
   * @returns {Promise<void>}
   */
  async function saveCases(cases) {
    saveCasesToAllStores(Array.isArray(cases) ? cases : []);
  }

  /**
   * Save updated tasks (syncs to all stores)
   * @param {array} tasks - Updated tasks array
   * @returns {Promise<void>}
   */
  async function saveTasks(tasks) {
    saveTasksToAllStores(Array.isArray(tasks) ? tasks : []);
  }

  /**
   * Save updated users (syncs to all stores)
   * @param {array} users - Updated users array
   * @returns {Promise<void>}
   */
  async function saveUsers(users) {
    saveUsersToAllStores(Array.isArray(users) ? users : []);
  }

  // Public API
  return {
    ensureCasesStorage,
    getCases,
    getTasks,
    getUsers,
    getCaseByCnr,
    saveCases,
    saveTasks,
    saveUsers,
    // Also expose sync for when needed
    syncLegacyFromDedicated,
  };
})();
