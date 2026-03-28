document.addEventListener('DOMContentLoaded', () => {
    // Current user setup
    const currentUser = JSON.parse(sessionStorage.getItem('lexflow_current_user'));
    if (currentUser) {
        document.getElementById('sidebarName').textContent = currentUser.name;
        document.getElementById('sidebarAvatar').textContent = currentUser.avatar || currentUser.name.charAt(0);
    } else {
        document.getElementById('sidebarName').textContent = 'John Doe';
        document.getElementById('sidebarAvatar').textContent = 'JD';
    }

    // Get invoice ID from URL
    const params = new URLSearchParams(window.location.search);
    const invoiceId = params.get('id');

    if (!invoiceId) {
        alert("No invoice ID provided. Redirecting to billing dashboard.");
        window.location.href = "billing.html";
        return;
    }

    fetch('../Case_Management/data/mock-data.json')
        .then(res => res.json())
        .then(data => {
            if (data.invoices) {
                const invoice = data.invoices.find(inv => inv.id === invoiceId);
                if (invoice) {
                    populateSummary(invoice);
                } else {
                    alert("Invoice not found.");
                    window.location.href = "billing.html";
                }
            }
        })
        .catch(err => console.error(err));

    function formatDate(dateStr) {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    }

    function populateSummary(inv) {
        document.getElementById('summaryId').textContent = inv.id;
        document.getElementById('summaryCaseName').textContent = inv.caseName;
        document.getElementById('summaryLawFirm').textContent = inv.lawFirm;
        
        const due = new Date(inv.dueDate);
        const diffMs = due - new Date();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        
        let dueColor = '#1a1a2e';
        if(diffDays < 0) dueColor = '#ef4444';
        else if (diffDays <= 14) dueColor = '#f59e0b';

        const dueEl = document.getElementById('summaryDueDate');
        dueEl.textContent = formatDate(inv.dueDate);
        dueEl.style.color = dueColor;
        
        const amountStr = '$' + inv.amount.toLocaleString('en-US', {minimumFractionDigits: 2});
        document.getElementById('summaryAmount').textContent = amountStr;
        document.getElementById('btnPayAmount').textContent = amountStr;
    }

    // ─── Input Elements ───
    const cardNameInput = document.getElementById('cardName');
    const cardNumberInput = document.getElementById('cardNumber');
    const cardExpiryInput = document.getElementById('cardExpiry');
    const cardCVCInput = document.getElementById('cardCVC');
    const form = document.getElementById('paymentForm');
    const successMsg = document.getElementById('paymentSuccess');

    // ─── Live Formatting ───
    // Card name: letters and spaces only
    LexValidation.formatNameInput(cardNameInput);
    LexValidation.attachBlurValidation(cardNameInput, (v) => LexValidation.validateName(v, 'Cardholder name'));

    // Card number: auto-space every 4 digits
    LexValidation.formatCardNumberInput(cardNumberInput);

    // Expiry: auto-insert slash, MM/YY format
    LexValidation.formatExpiryInput(cardExpiryInput);

    // CVC: digits only, 3-4 chars
    LexValidation.formatCVCInput(cardCVCInput);

    // ─── Form Submission with Validation ───
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        // Clear all previous errors
        LexValidation.clearAllErrors(form);

        // Validate all fields
        const rules = [
            { input: cardNameInput, validator: (v) => LexValidation.validateName(v, 'Cardholder name') },
            { input: cardNumberInput, validator: LexValidation.validateCardNumber },
            { input: cardExpiryInput, validator: LexValidation.validateExpiry },
            { input: cardCVCInput, validator: LexValidation.validateCVC },
        ];

        if (!LexValidation.validateForm(rules)) {
            // Shake the form container
            const formContainer = form.closest('.checkout-form');
            if (formContainer) {
                formContainer.classList.add('form-shake');
                setTimeout(() => formContainer.classList.remove('form-shake'), 450);
            }
            return;
        }
        
        // Disable button
        const btn = form.querySelector('button[type="submit"]');
        btn.textContent = "Processing...";
        btn.disabled = true;

        // Simulate network delay
        setTimeout(() => {
            form.style.display = 'none';
            successMsg.style.display = 'block';

            // Simulate redirect
            setTimeout(() => {
                window.location.href = "billing.html";
            }, 3000);

        }, 1500);
    });
});

