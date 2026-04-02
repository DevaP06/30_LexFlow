const billingStorage = window.LexFlowBillingStorage;
const normalizeInvoices = billingStorage.normalizeInvoices;
const normalizePayments = billingStorage.normalizePayments;
const ensureBillingStorage = billingStorage.ensureBillingStorage;
const saveBillingToAllStores = billingStorage.saveBillingToAllStores;
const BILLING_TODAY = new Date("2026-04-02T00:00:00");

function formatLongDate(dateValue) {
  return new Date(dateValue).toLocaleDateString("en-IN", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function generatePaymentId() {
  return `#PAY-${String(Date.now()).slice(-6)}`;
}

document.addEventListener("DOMContentLoaded", async () => {
  const invoiceId = new URLSearchParams(window.location.search).get("id");
  if (!invoiceId) {
    alert("No invoice ID provided. Redirecting to billing dashboard.");
    window.location.href = "client_billing.html";
    return;
  }

  let invoices = [];
  let payments = [];
  let currentInvoice = null;

  try {
    const data = await ensureBillingStorage();
    invoices = normalizeInvoices(data.invoices || []);
    payments = normalizePayments(data.payments || []);
    currentInvoice = invoices.find((invoice) => invoice.id === invoiceId) || null;

    if (!currentInvoice) {
      alert("Invoice not found.");
      window.location.href = "client_billing.html";
      return;
    }

    document.getElementById("summaryId").textContent = currentInvoice.id;
    document.getElementById("summaryCaseName").textContent = currentInvoice.caseName || "-";
    document.getElementById("summaryLawFirm").textContent = currentInvoice.lawyerName || "Awaiting Assignment";

    const daysLeft = Math.ceil((new Date(currentInvoice.dueDate) - BILLING_TODAY) / 86400000);
    let dueDateColor = "#1a1a2e";
    if (daysLeft < 0) {
      dueDateColor = "#ef4444";
    } else if (daysLeft <= 14) {
      dueDateColor = "#f59e0b";
    }

    const dueDateEl = document.getElementById("summaryDueDate");
    dueDateEl.textContent = formatLongDate(currentInvoice.dueDate);
    dueDateEl.style.color = dueDateColor;

    const formattedAmount = "₹" + currentInvoice.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 });
    document.getElementById("summaryAmount").textContent = formattedAmount;
    document.getElementById("btnPayAmount").textContent = formattedAmount;
  } catch (error) {
    console.error(error);
    window.location.href = "client_billing.html";
    return;
  }

  const cardNameInput = document.getElementById("cardName");
  const cardNumberInput = document.getElementById("cardNumber");
  const cardExpiryInput = document.getElementById("cardExpiry");
  const cardCvcInput = document.getElementById("cardCVC");
  const paymentForm = document.getElementById("paymentForm");
  const paymentSuccess = document.getElementById("paymentSuccess");

  LexValidation.formatNameInput(cardNameInput);
  LexValidation.attachBlurValidation(cardNameInput, (value) => LexValidation.validateName(value, "Cardholder name"));
  LexValidation.formatCardNumberInput(cardNumberInput);
  LexValidation.formatExpiryInput(cardExpiryInput);
  LexValidation.formatCVCInput(cardCvcInput);

  paymentForm.addEventListener("submit", (event) => {
    event.preventDefault();
    LexValidation.clearAllErrors(paymentForm);

    const fields = [
      {
        input: cardNameInput,
        validator: (value) => LexValidation.validateName(value, "Cardholder name"),
      },
      { input: cardNumberInput, validator: LexValidation.validateCardNumber },
      { input: cardExpiryInput, validator: LexValidation.validateExpiry },
      { input: cardCvcInput, validator: LexValidation.validateCVC },
    ];

    if (!LexValidation.validateForm(fields)) {
      const formCard = paymentForm.closest(".checkout-form");
      if (formCard) {
        formCard.classList.add("form-shake");
        setTimeout(() => formCard.classList.remove("form-shake"), 450);
      }
      return;
    }

    const submitButton = paymentForm.querySelector('button[type="submit"]');
    submitButton.textContent = "Processing...";
    submitButton.disabled = true;

    setTimeout(() => {
      const invoiceIndex = invoices.findIndex((invoice) => invoice.id === currentInvoice.id);
      if (invoiceIndex !== -1) {
        invoices[invoiceIndex].status = "Paid";
      }

      const paymentDate = "2026-04-02";

      const existingPaymentIndex = payments.findIndex((payment) => payment.invoiceId === currentInvoice.id);
      const paymentRecord = {
        id: existingPaymentIndex !== -1 ? payments[existingPaymentIndex].id : generatePaymentId(),
        invoiceId: currentInvoice.id,
        client: currentInvoice.client || "Client",
        amount: currentInvoice.amount,
        date: paymentDate,
        method: "Credit Card",
        status: "Completed",
      };

      if (existingPaymentIndex !== -1) {
        payments[existingPaymentIndex] = paymentRecord;
      } else {
        payments.unshift(paymentRecord);
      }

      saveBillingToAllStores(invoices, payments);

      paymentForm.style.display = "none";
      paymentSuccess.style.display = "block";

      setTimeout(() => {
        window.location.href = "client_billing.html";
      }, 3000);
    }, 1500);
  });
});
