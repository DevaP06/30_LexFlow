(function () {
  const MOCK_STORAGE_KEY = "lexflow_mock_data";
  const INVOICES_STORAGE_KEY = "lexflow_invoices";
  const PAYMENTS_STORAGE_KEY = "lexflow_payments";
  const BILLING_MOCK_PATH = "../scripts/client_casemanagement_mock-data.json";

  function loadJsonFromStorage(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      console.warn(`Failed to parse ${key}:`, error);
      return null;
    }
  }

  function saveJsonToStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function normalizeInvoices(invoices) {
    if (!Array.isArray(invoices)) {
      return [];
    }
    return invoices.map((invoice) => ({
      ...invoice,
      amount: Number(invoice.amount) || 0,
      status: invoice.status || "Pending",
    }));
  }

  function normalizePayments(payments) {
    if (!Array.isArray(payments)) {
      return [];
    }
    return payments.map((payment) => ({
      ...payment,
      amount: Number(payment.amount) || 0,
      status: payment.status || "Completed",
    }));
  }

  function syncLegacyBillingFromDedicated() {
    const mockData = loadJsonFromStorage(MOCK_STORAGE_KEY) || {};
    mockData.invoices = normalizeInvoices(loadJsonFromStorage(INVOICES_STORAGE_KEY) || mockData.invoices || []);
    mockData.payments = normalizePayments(loadJsonFromStorage(PAYMENTS_STORAGE_KEY) || mockData.payments || []);
    saveJsonToStorage(MOCK_STORAGE_KEY, mockData);
  }

  function saveBillingToAllStores(invoices, payments) {
    const normalizedInvoices = normalizeInvoices(invoices);
    const normalizedPayments = normalizePayments(payments);

    saveJsonToStorage(INVOICES_STORAGE_KEY, normalizedInvoices);
    saveJsonToStorage(PAYMENTS_STORAGE_KEY, normalizedPayments);

    const mockData = loadJsonFromStorage(MOCK_STORAGE_KEY) || {};
    mockData.invoices = normalizedInvoices;
    mockData.payments = normalizedPayments;
    saveJsonToStorage(MOCK_STORAGE_KEY, mockData);
  }

  function saveInvoicesToAllStores(invoices) {
    const normalizedInvoices = normalizeInvoices(invoices);
    const existingPayments = normalizePayments(loadJsonFromStorage(PAYMENTS_STORAGE_KEY) || []);
    saveBillingToAllStores(normalizedInvoices, existingPayments);
  }

  async function ensureBillingStorage() {
    const mockData = loadJsonFromStorage(MOCK_STORAGE_KEY) || {};
    const hasLegacyInvoices = Array.isArray(mockData.invoices);
    const hasDedicatedInvoices = Array.isArray(loadJsonFromStorage(INVOICES_STORAGE_KEY));

    if (hasLegacyInvoices) {
      if (!hasDedicatedInvoices) {
        saveJsonToStorage(INVOICES_STORAGE_KEY, normalizeInvoices(mockData.invoices || []));
      }
      if (!Array.isArray(loadJsonFromStorage(PAYMENTS_STORAGE_KEY))) {
        saveJsonToStorage(PAYMENTS_STORAGE_KEY, normalizePayments(mockData.payments || []));
      }
      syncLegacyBillingFromDedicated();
      return {
        invoices: normalizeInvoices(loadJsonFromStorage(INVOICES_STORAGE_KEY) || []),
        payments: normalizePayments(loadJsonFromStorage(PAYMENTS_STORAGE_KEY) || []),
      };
    }

    if (hasDedicatedInvoices) {
      syncLegacyBillingFromDedicated();
      return {
        invoices: normalizeInvoices(loadJsonFromStorage(INVOICES_STORAGE_KEY) || []),
        payments: normalizePayments(loadJsonFromStorage(PAYMENTS_STORAGE_KEY) || []),
      };
    }

    const response = await fetch(BILLING_MOCK_PATH);
    const data = await response.json();
    const invoices = normalizeInvoices(data.invoices || []);
    const payments = normalizePayments(data.payments || []);

    saveJsonToStorage(INVOICES_STORAGE_KEY, invoices);
    saveJsonToStorage(PAYMENTS_STORAGE_KEY, payments);
    syncLegacyBillingFromDedicated();

    return { invoices, payments };
  }

  window.LexFlowBillingStorage = {
    ensureBillingStorage,
    normalizeInvoices,
    normalizePayments,
    saveBillingToAllStores,
    saveInvoicesToAllStores,
  };
})();
