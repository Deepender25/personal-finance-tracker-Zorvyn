/* =====================================================
   Finance Dashboard — Main JavaScript
   All API calls, UI rendering, modal management
   ===================================================== */

// ---------- UTILITIES ----------
const INR = v => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v || 0);
const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';
const esc = s => String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

let _debounceTimers = {};
function debounce(fn, ms, key = 'default') {
  clearTimeout(_debounceTimers[key]);
  _debounceTimers[key] = setTimeout(fn, ms);
}

// ---------- TOAST ----------
function toast(msg, type = 'success') {
  const c = document.getElementById('toast-container');
  if (!c) return;
  const t = document.createElement('div');
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  t.className = `toast toast-${type}`;
  t.innerHTML = `<span>${icons[type] || '✅'}</span><span>${esc(msg)}</span>`;
  c.appendChild(t);
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 3500);
}

// ---------- API ----------
async function api(url, method = 'GET', body = null) {
  const opts = { method, headers: { 'Content-Type': 'application/json' }, credentials: 'include' };
  if (body) opts.body = JSON.stringify(body);
  try {
    const res = await fetch(url, opts);
    const data = await res.json();
    if (res.status === 401 && !url.includes('/login')) { window.location.href = '/login'; return null; }
    return { ok: res.ok, status: res.status, data };
  } catch (e) {
    toast('Network error. Check your connection.', 'error');
    return null;
  }
}

// ---------- MODAL ----------
function openModal(title, bodyHTML, footerHTML = '') {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalBody').innerHTML = bodyHTML;
  document.getElementById('modalFooter').innerHTML = footerHTML;
  document.getElementById('modalBackdrop').classList.add('open');
}
function closeModalById() { document.getElementById('modalBackdrop').classList.remove('open'); }
function closeModal(e) { if (e.target === document.getElementById('modalBackdrop')) closeModalById(); }

// ---------- FORM ERROR ----------
function setError(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.classList.toggle('show', !!msg);
}
function clearErrors(...ids) { ids.forEach(id => setError(id, '')); }
function setLoading(btnId, loading, text = 'Save') {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.disabled = loading;
  btn.textContent = loading ? 'Please wait…' : text;
}

// ---------- PASSWORD STRENGTH ----------
function updateStrength(val) {
  const fill = document.getElementById('strengthFill');
  const text = document.getElementById('strengthText');
  if (!fill) return;
  let s = 0, label = '', cls = '';
  if (val.length >= 8) s += 25;
  if (/[A-Z]/.test(val)) s += 25;
  if (/[a-z]/.test(val)) s += 25;
  if (/[0-9]/.test(val)) s += 25;
  if (s <= 25) { label = 'Weak'; cls = 'background:#ef4444'; }
  else if (s <= 50) { label = 'Fair'; cls = 'background:#f59e0b'; }
  else if (s <= 75) { label = 'Good'; cls = 'background:#22c55e'; }
  else { label = 'Strong ✓'; cls = 'background:#16a34a'; }
  fill.style.cssText = `width:${s}%;${cls}`;
  if (text) text.textContent = label;
}

// ---------- OTP INPUTS ----------
function initOtpInputs(containerId) {
  const inputs = document.querySelectorAll(`#${containerId} input.otp-input`);
  inputs.forEach((inp, i) => {
    inp.addEventListener('input', e => {
      inp.value = inp.value.replace(/\D/g, '').slice(-1);
      inp.classList.toggle('filled', !!inp.value);
      if (inp.value && i < inputs.length - 1) inputs[i + 1].focus();
      // auto-submit if all filled
      const all = [...inputs].map(x => x.value).join('');
      if (all.length === 6 && containerId === 'otpInputs') document.getElementById('otpForm')?.requestSubmit();
    });
    inp.addEventListener('keydown', e => {
      if (e.key === 'Backspace' && !inp.value && i > 0) inputs[i - 1].focus();
      if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
        // handle paste
        e.preventDefault();
        navigator.clipboard.readText().then(text => {
          const digits = text.replace(/\D/g,'').slice(0,6);
          digits.split('').forEach((d, j) => { if (inputs[j]) { inputs[j].value = d; inputs[j].classList.add('filled'); }});
          if (inputs[digits.length - 1]) inputs[digits.length - 1].focus();
        }).catch(() => {});
      }
    });
  });
}

function getOtp(containerId) {
  return [...document.querySelectorAll(`#${containerId} input.otp-input`)].map(x => x.value).join('');
}

// ---------- AUTH ----------
async function handleLogin(e) {
  e.preventDefault();
  clearErrors('emailError', 'passwordError');
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  setLoading('loginBtn', true, 'Sign In');
  const res = await api('/api/auth/login', 'POST', { email, password });
  setLoading('loginBtn', false, 'Sign In');
  if (!res) return;
  if (res.ok) {
    window.location.href = `/dashboard/${res.data.data.user.role}`;
  } else {
    const msg = res.data.error || 'Login failed';
    if (msg.includes('email')) setError('emailError', msg);
    else setError('passwordError', msg);
  }
}

async function handleRegister(e) {
  e.preventDefault();
  clearErrors('nameError', 'emailError', 'passwordError', 'confirmError');
  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const confirm = document.getElementById('confirmPassword').value;
  if (password !== confirm) { setError('confirmError', 'Passwords do not match'); return; }
  setLoading('registerBtn', true, 'Create Account');
  const res = await api('/api/auth/register', 'POST', { name, email, password });
  setLoading('registerBtn', false, 'Create Account');
  if (!res) return;
  if (res.ok) {
    window.location.href = `/verify-otp?email=${encodeURIComponent(email)}`;
  } else {
    const msg = res.data.error || 'Registration failed';
    if (msg.toLowerCase().includes('email')) setError('emailError', msg);
    else if (msg.toLowerCase().includes('password')) setError('passwordError', msg);
    else toast(msg, 'error');
  }
}

// OTP Verify page
document.addEventListener('DOMContentLoaded', () => {
  const emailEl = document.getElementById('displayEmail');
  if (emailEl) {
    emailEl.textContent = new URLSearchParams(location.search).get('email') || '';
  }
  if (document.getElementById('otpInputs')) initOtpInputs('otpInputs');
  if (document.getElementById('resetOtpInputs')) initOtpInputs('resetOtpInputs');
});

async function handleVerifyOtp(e) {
  e.preventDefault();
  const email = new URLSearchParams(location.search).get('email');
  const otp = getOtp('otpInputs');
  if (otp.length < 6) { setError('otpError', 'Please enter all 6 digits'); return; }
  setLoading('verifyBtn', true, 'Verify Email');
  const res = await api('/api/auth/verify-email', 'POST', { email, otp });
  setLoading('verifyBtn', false, 'Verify Email');
  if (!res) return;
  if (res.ok) { toast('Email verified! You can now log in.'); setTimeout(() => window.location.href = '/login', 1500); }
  else setError('otpError', res.data.error || 'Invalid OTP');
}

let resendTimer = null;
async function resendOtp() {
  const email = new URLSearchParams(location.search).get('email');
  if (!email) return;
  const btn = document.getElementById('resendBtn');
  if (!btn) return;
  btn.disabled = true;
  let s = 60;
  const cd = document.getElementById('resendCountdown');
  resendTimer = setInterval(() => {
    if (cd) cd.textContent = `(${--s}s)`;
    if (s <= 0) { clearInterval(resendTimer); btn.disabled = false; if(cd) cd.textContent=''; }
  }, 1000);
  // Resend via forgot-password (sends a verify_email otp again is not standard —
  // For now just inform user to re-register if OTP lost)
  toast('If the OTP expired, please register again.', 'info');
}

async function handleForgotPassword(e) {
  e.preventDefault();
  const email = document.getElementById('resetEmail').value.trim();
  setLoading('step1Btn', true, 'Send Reset Code');
  const res = await api('/api/auth/forgot-password', 'POST', { email });
  setLoading('step1Btn', false, 'Send Reset Code');
  if (!res) return;
  if (res.ok) {
    sessionStorage.setItem('resetEmail', email);
    document.getElementById('step1Form').style.display = 'none';
    document.getElementById('step2Form').style.display = 'block';
    document.getElementById('stepDesc').textContent = `Enter the code sent to ${email}`;
    toast('Reset code sent! Check your email.', 'info');
  } else {
    setError('resetEmailError', res.data.error || 'Failed to send reset code');
  }
}

async function handleResetPassword(e) {
  e.preventDefault();
  const email = sessionStorage.getItem('resetEmail');
  const otp = getOtp('resetOtpInputs');
  const new_password = document.getElementById('newPass').value;
  const confirm = document.getElementById('confirmNewPass').value;
  if (new_password !== confirm) { setError('resetStep2Error', 'Passwords do not match'); return; }
  if (otp.length < 6) { setError('resetStep2Error', 'Enter all 6 digits'); return; }
  setLoading('step2Btn', true, 'Update Password');
  const res = await api('/api/auth/reset-password', 'POST', { email, otp, new_password });
  setLoading('step2Btn', false, 'Update Password');
  if (!res) return;
  if (res.ok) {
    sessionStorage.removeItem('resetEmail');
    toast('Password updated! Redirecting…');
    setTimeout(() => window.location.href = '/login', 1500);
  } else {
    setError('resetStep2Error', res.data.error || 'Failed to reset password');
  }
}

async function logout() {
  await api('/api/auth/logout', 'POST');
  window.location.href = '/login';
}

// ---------- SUMMARY CARDS ----------
async function loadSummaryCards(containerId = 'summaryCards') {
  const from = document.getElementById('dateFrom')?.value;
  const to = document.getElementById('dateTo')?.value;
  let url = '/api/dashboard/summary';
  const p = new URLSearchParams();
  if (from) p.append('date_from', from);
  if (to) p.append('date_to', to);
  if (p.toString()) url += '?' + p;
  const res = await api(url);
  const el = document.getElementById(containerId);
  if (!el) return;
  if (!res || !res.ok) { el.innerHTML = '<p style="color:var(--danger);">Failed to load summary.</p>'; return; }
  const d = res.data.data;
  const netColor = d.net_balance >= 0 ? 'var(--success)' : 'var(--danger)';
  el.innerHTML = `
    <div class="stat-card income">
      <div class="stat-label">Total Income</div>
      <div class="stat-value" style="color:var(--success);">${INR(d.total_income)}</div>
      <div class="stat-sub">${d.income_count} transactions</div>
    </div>
    <div class="stat-card expense">
      <div class="stat-label">Total Expenses</div>
      <div class="stat-value" style="color:var(--danger);">${INR(d.total_expense)}</div>
      <div class="stat-sub">${d.expense_count} transactions</div>
    </div>
    <div class="stat-card balance">
      <div class="stat-label">Net Balance</div>
      <div class="stat-value" style="color:${netColor};">${INR(d.net_balance)}</div>
      <div class="stat-sub">${d.net_balance >= 0 ? '🟢 Surplus' : '🔴 Deficit'}</div>
    </div>
    <div class="stat-card count">
      <div class="stat-label">Total Transactions</div>
      <div class="stat-value">${d.transaction_count}</div>
      <div class="stat-sub">All time records</div>
    </div>
  `;
}

// ---------- RECENT TRANSACTIONS ----------
async function loadRecentTransactions(tbodyId = 'recentTransactionsTable') {
  const res = await api('/api/dashboard/recent');
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;
  if (!res || !res.ok || !res.data.data.length) {
    tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state"><div class="empty-icon">📭</div><h3>No transactions yet</h3><p>Start by adding transactions from the Admin panel.</p></div></td></tr>`;
    return;
  }
  tbody.innerHTML = res.data.data.map(tx => `
    <tr>
      <td>${fmtDate(tx.date)}</td>
      <td>${esc(tx.category_name || 'Uncategorized')}</td>
      <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(tx.notes || '—')}</td>
      <td><span class="badge badge-${tx.type}">${tx.type}</span></td>
      <td style="text-align:right; font-weight:600; color:${tx.type==='income'?'var(--success)':'var(--danger)'};">${tx.type==='income'?'+':'−'}${INR(tx.amount)}</td>
    </tr>
  `).join('');
}

// ---------- VIEWER DASHBOARD ----------
async function loadViewerDashboard() {
  await Promise.all([loadSummaryCards(), loadRecentTransactions()]);
}

// ---------- CHARTS ----------
let _trendChart = null, _catChart = null;

async function loadCharts(prefix = '') {
  // Monthly trend
  const year = document.getElementById('trendYear')?.value || new Date().getFullYear();
  const trendRes = await api(`/api/dashboard/monthly-trend?year=${year}`);
  if (trendRes?.ok) {
    const d = trendRes.data.data;
    const ctx = document.getElementById('monthlyTrendChart');
    if (ctx) {
      if (_trendChart) _trendChart.destroy();
      _trendChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: d.map(r => r.month),
          datasets: [
            { label: 'Income', data: d.map(r => r.income), backgroundColor: '#22c55e', borderRadius: 6 },
            { label: 'Expense', data: d.map(r => r.expense), backgroundColor: '#ef4444', borderRadius: 6 }
          ]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { position: 'top' } },
          scales: { y: { beginAtZero: true, ticks: { callback: v => '₹' + (v/1000).toFixed(0) + 'k' } } }
        }
      });
    }
  }

  // Category chart
  const type = document.getElementById('catChartType')?.value || 'expense';
  const catRes = await api(`/api/dashboard/by-category?type=${type}`);
  if (catRes?.ok) {
    const d = catRes.data.data.slice(0, 8);
    const ctx2 = document.getElementById('categoryChart');
    if (ctx2) {
      if (_catChart) _catChart.destroy();
      _catChart = new Chart(ctx2, {
        type: 'doughnut',
        data: {
          labels: d.map(r => r.category || 'Uncategorized'),
          datasets: [{ data: d.map(r => r.total), backgroundColor: ['#6366f1','#22c55e','#ef4444','#f59e0b','#8b5cf6','#06b6d4','#ec4899','#14b8a6'], borderWidth: 2, borderColor: '#fff' }]
        },
        options: { responsive: true, maintainAspectRatio: false, cutout: '65%', plugins: { legend: { position: 'bottom', labels: { boxWidth: 12 } } } }
      });
    }
  }
}

// ---------- TRANSACTIONS TABLE ----------
let currentAnalystPage = 1;

async function loadTransactionsTable(page = currentAnalystPage) {
  currentAnalystPage = page;
  const s = document.getElementById('searchTx')?.value || '';
  const type = document.getElementById('filterType')?.value || '';
  const from = document.getElementById('txFrom')?.value || document.getElementById('dateFrom')?.value || '';
  const to = document.getElementById('txTo')?.value || document.getElementById('dateTo')?.value || '';
  const p = new URLSearchParams({ page, per_page: 15 });
  if (s) p.append('search', s);
  if (type) p.append('type', type);
  if (from) p.append('date_from', from);
  if (to) p.append('date_to', to);
  const res = await api('/api/transactions?' + p);
  const tbody = document.getElementById('transactionsTableBody');
  if (!tbody) return;
  if (!res?.ok) { tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:2rem;color:var(--danger);">Failed to load</td></tr>'; return; }
  renderTxTable(tbody, res.data.data, false);
  renderPagination('txPagination', res.data.meta, p2 => loadTransactionsTable(p2));
  const meta = res.data.meta;
  const metaEl = document.getElementById('txMetaInfo');
  if (metaEl) metaEl.textContent = `Page ${meta.page} of ${meta.total_pages} • ${meta.total} records`;
}

function renderTxTable(tbody, data, isAdmin = false) {
  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="${isAdmin?6:5}"><div class="empty-state"><div class="empty-icon">📭</div><h3>No transactions found</h3><p>Try changing your filters.</p></div></td></tr>`;
    return;
  }
  tbody.innerHTML = data.map(tx => `
    <tr>
      <td>${fmtDate(tx.date)}</td>
      <td>${esc(tx.category_name || 'Uncategorized')}</td>
      <td style="max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${esc(tx.notes || '')}">${esc(tx.notes || '—')}</td>
      <td><span class="badge badge-${tx.type}">${tx.type}</span></td>
      <td style="text-align:right;font-weight:600;color:${tx.type==='income'?'var(--success)':'var(--danger)'};">${tx.type==='income'?'+':'−'}${INR(tx.amount)}</td>
      ${isAdmin ? `<td style="text-align:center;white-space:nowrap;">
        <button class="btn btn-secondary btn-sm" onclick="openEditTxModal('${tx.id}')">✏️</button>
        <button class="btn btn-danger btn-sm" style="margin-left:.25rem;" onclick="deleteTx('${tx.id}')">🗑️</button>
      </td>` : ''}
    </tr>
  `).join('');
}

function renderPagination(elId, meta, onPage) {
  const el = document.getElementById(elId);
  if (!el) return;
  const { page, total_pages } = meta;
  let html = `<button class="page-btn" onclick="(${onPage.toString()})(${page-1})" ${page<=1?'disabled':''}>← Prev</button>`;
  const start = Math.max(1, page-2), end = Math.min(total_pages, page+2);
  for (let i = start; i <= end; i++) {
    html += `<button class="page-btn ${i===page?'active':''}" onclick="(${onPage.toString()})(${i})">${i}</button>`;
  }
  html += `<button class="page-btn" onclick="(${onPage.toString()})(${page+1})" ${page>=total_pages?'disabled':''}>Next →</button>`;
  el.innerHTML = html;
}

// ---------- ANALYST DASHBOARD ----------
async function loadAnalystDashboard() {
  await Promise.all([loadSummaryCards(), loadCharts(), loadTransactionsTable(1)]);
}

// ---------- ADMIN DASHBOARD ----------
let adminTxPage = 1;
let currentAdminTab = 'overview';
let _adminTrendChart = null, _adminCatChart = null;

function switchAdminTab(tab) {
  ['overview','transactions','categories','users'].forEach(t => {
    const s = document.getElementById(`section-${t}`);
    const b = document.getElementById(`tab-${t}`);
    if (s) s.style.display = t === tab ? 'block' : 'none';
    if (b) b.classList.toggle('active', t === tab);
  });
  currentAdminTab = tab;
  if (tab === 'overview') loadAdminOverview();
  else if (tab === 'transactions') loadAdminTransactionsTable(1);
  else if (tab === 'categories') loadCategoriesTable();
  else if (tab === 'users') loadUsersTable(1);
}

async function loadAdminOverview() {
  await Promise.all([loadSummaryCards(), loadAdminCharts(), loadRecentTransactions()]);
}

async function loadAdminCharts() {
  _trendChart = _adminTrendChart; _catChart = _adminCatChart;
  await loadCharts();
  _adminTrendChart = _trendChart; _adminCatChart = _catChart;
}

async function loadAdminDashboard() {
  await loadAdminOverview();
}

// Admin Transactions
async function loadAdminTransactionsTable(page = adminTxPage) {
  adminTxPage = page;
  const s = document.getElementById('searchTx')?.value || '';
  const type = document.getElementById('filterType')?.value || '';
  const from = document.getElementById('txFrom')?.value || '';
  const to = document.getElementById('txTo')?.value || '';
  const p = new URLSearchParams({ page, per_page: 15 });
  if (s) p.append('search', s);
  if (type) p.append('type', type);
  if (from) p.append('date_from', from);
  if (to) p.append('date_to', to);
  const res = await api('/api/transactions?' + p);
  const tbody = document.getElementById('adminTransactionsTableBody');
  if (!tbody) return;
  if (!res?.ok) { tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--danger);">Failed to load</td></tr>'; return; }
  renderTxTable(tbody, res.data.data, true);
  renderPagination('adminTxPagination', res.data.meta, p2 => loadAdminTransactionsTable(p2));
  const meta = res.data.meta;
  const metaEl = document.getElementById('adminTxMetaInfo');
  if (metaEl) metaEl.textContent = `Page ${meta.page} of ${meta.total_pages} • ${meta.total} records`;
}

// ---------- TRANSACTION MODALS ----------
let _categories = [];

async function getCategories() {
  if (_categories.length) return _categories;
  const res = await api('/api/categories');
  _categories = res?.ok ? res.data.data : [];
  return _categories;
}

async function openAddTxModal() {
  const cats = await getCategories();
  const catOptions = cats.map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join('');
  openModal('Add Transaction', `
    <form id="addTxForm" onsubmit="submitAddTx(event)">
      <div class="form-group">
        <label class="form-label">Type *</label>
        <select id="txType" class="form-control" required>
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Amount (₹) *</label>
        <input id="txAmount" class="form-control" type="number" min="0.01" step="0.01" placeholder="5000" required>
        <span class="form-error" id="txAmountErr"></span>
      </div>
      <div class="form-group">
        <label class="form-label">Category</label>
        <select id="txCategory" class="form-control"><option value="">— Select —</option>${catOptions}</select>
      </div>
      <div class="form-group">
        <label class="form-label">Date *</label>
        <input id="txDate" class="form-control" type="date" required value="${new Date().toISOString().split('T')[0]}">
      </div>
      <div class="form-group">
        <label class="form-label">Notes</label>
        <input id="txNotes" class="form-control" type="text" placeholder="Optional description">
      </div>
    </form>
  `, `
    <button class="btn btn-outline" onclick="closeModalById()">Cancel</button>
    <button class="btn btn-primary" id="saveTxBtn" onclick="document.getElementById('addTxForm').requestSubmit()">Save Transaction</button>
  `);
}

async function submitAddTx(e) {
  e.preventDefault();
  clearErrors('txAmountErr');
  const amount = parseFloat(document.getElementById('txAmount').value);
  if (isNaN(amount) || amount <= 0) { setError('txAmountErr', 'Enter a valid positive amount'); return; }
  setLoading('saveTxBtn', true);
  const body = {
    amount,
    type: document.getElementById('txType').value,
    category_id: document.getElementById('txCategory').value || null,
    date: document.getElementById('txDate').value,
    notes: document.getElementById('txNotes').value
  };
  const res = await api('/api/transactions', 'POST', body);
  setLoading('saveTxBtn', false);
  if (res?.ok) {
    closeModalById();
    toast('Transaction added!');
    _categories = []; // reset cache
    loadAdminTransactionsTable(1);
    loadSummaryCards();
  } else {
    toast(res?.data?.error || 'Failed to add', 'error');
  }
}

async function openEditTxModal(id) {
  const res = await api(`/api/transactions/${id}`);
  if (!res?.ok) { toast('Could not load transaction', 'error'); return; }
  const tx = res.data.data;
  const cats = await getCategories();
  const catOptions = cats.map(c => `<option value="${c.id}" ${c.id === tx.category_id ? 'selected' : ''}>${esc(c.name)}</option>`).join('');
  openModal('Edit Transaction', `
    <form id="editTxForm" onsubmit="submitEditTx(event,'${id}')">
      <div class="form-group">
        <label class="form-label">Type *</label>
        <select id="editTxType" class="form-control">
          <option value="expense" ${tx.type==='expense'?'selected':''}>Expense</option>
          <option value="income" ${tx.type==='income'?'selected':''}>Income</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Amount (₹) *</label>
        <input id="editTxAmount" class="form-control" type="number" min="0.01" step="0.01" value="${tx.amount}" required>
      </div>
      <div class="form-group">
        <label class="form-label">Category</label>
        <select id="editTxCategory" class="form-control"><option value="">— None —</option>${catOptions}</select>
      </div>
      <div class="form-group">
        <label class="form-label">Date *</label>
        <input id="editTxDate" class="form-control" type="date" value="${tx.date}" required>
      </div>
      <div class="form-group">
        <label class="form-label">Notes</label>
        <input id="editTxNotes" class="form-control" type="text" value="${esc(tx.notes || '')}">
      </div>
    </form>
  `, `
    <button class="btn btn-outline" onclick="closeModalById()">Cancel</button>
    <button class="btn btn-primary" id="saveEditTxBtn" onclick="document.getElementById('editTxForm').requestSubmit()">Update</button>
  `);
}

async function submitEditTx(e, id) {
  e.preventDefault();
  setLoading('saveEditTxBtn', true, 'Update');
  const body = {
    amount: parseFloat(document.getElementById('editTxAmount').value),
    type: document.getElementById('editTxType').value,
    category_id: document.getElementById('editTxCategory').value || null,
    date: document.getElementById('editTxDate').value,
    notes: document.getElementById('editTxNotes').value
  };
  const res = await api(`/api/transactions/${id}`, 'PUT', body);
  setLoading('saveEditTxBtn', false, 'Update');
  if (res?.ok) { closeModalById(); toast('Transaction updated!'); loadAdminTransactionsTable(adminTxPage); loadSummaryCards(); }
  else toast(res?.data?.error || 'Update failed', 'error');
}

async function deleteTx(id) {
  openModal('Confirm Delete', '<p style="color:var(--text-muted);">Are you sure you want to delete this transaction? This action cannot be undone.</p>', `
    <button class="btn btn-outline" onclick="closeModalById()">Cancel</button>
    <button class="btn btn-danger" onclick="confirmDeleteTx('${id}')">🗑️ Delete</button>
  `);
}
async function confirmDeleteTx(id) {
  const res = await api(`/api/transactions/${id}`, 'DELETE');
  closeModalById();
  if (res?.ok) { toast('Transaction deleted'); loadAdminTransactionsTable(adminTxPage); loadSummaryCards(); }
  else toast(res?.data?.error || 'Delete failed', 'error');
}

// ---------- CATEGORIES ----------
async function loadCategoriesTable() {
  const res = await api('/api/categories');
  const tbody = document.getElementById('categoriesTableBody');
  if (!tbody) return;
  if (!res?.ok || !res.data.data.length) {
    tbody.innerHTML = '<tr><td colspan="2"><div class="empty-state"><div class="empty-icon">🏷️</div><h3>No categories</h3></div></td></tr>';
    return;
  }
  tbody.innerHTML = res.data.data.map(c => `
    <tr>
      <td><strong>${esc(c.name)}</strong></td>
      <td style="text-align:right;"><button class="btn btn-danger btn-sm" onclick="deleteCategory('${c.id}','${esc(c.name)}')">🗑️ Delete</button></td>
    </tr>
  `).join('');
  _categories = []; // reset cache so next tx modal is fresh
}

async function openAddCategoryModal() {
  openModal('Add Category', `
    <form id="addCatForm" onsubmit="submitAddCategory(event)">
      <div class="form-group">
        <label class="form-label">Category Name *</label>
        <input id="catName" class="form-control" type="text" placeholder="e.g. Insurance" required>
        <span class="form-error" id="catNameErr"></span>
      </div>
    </form>
  `, `
    <button class="btn btn-outline" onclick="closeModalById()">Cancel</button>
    <button class="btn btn-primary" id="saveCatBtn" onclick="document.getElementById('addCatForm').requestSubmit()">Add Category</button>
  `);
}
async function submitAddCategory(e) {
  e.preventDefault();
  const name = document.getElementById('catName').value.trim();
  if (!name) { setError('catNameErr', 'Name is required'); return; }
  setLoading('saveCatBtn', true);
  const res = await api('/api/categories', 'POST', { name });
  setLoading('saveCatBtn', false);
  if (res?.ok) { closeModalById(); toast('Category added!'); loadCategoriesTable(); }
  else toast(res?.data?.error || 'Failed', 'error');
}

async function deleteCategory(id, name) {
  openModal('Confirm Delete', `<p style="color:var(--text-muted);">Delete category <strong>${esc(name)}</strong>? This will fail if any transactions use it.</p>`, `
    <button class="btn btn-outline" onclick="closeModalById()">Cancel</button>
    <button class="btn btn-danger" onclick="confirmDeleteCat('${id}')">🗑️ Delete</button>
  `);
}
async function confirmDeleteCat(id) {
  const res = await api(`/api/categories/${id}`, 'DELETE');
  closeModalById();
  if (res?.ok) { toast('Category deleted'); loadCategoriesTable(); }
  else toast(res?.data?.error || 'Cannot delete — transactions exist with this category', 'error');
}

// ---------- USERS ----------
let userPage = 1;

async function loadUsersTable(page = userPage) {
  userPage = page;
  const s = document.getElementById('searchUser')?.value || '';
  const role = document.getElementById('filterRole')?.value || '';
  const status = document.getElementById('filterStatus')?.value || '';
  const p = new URLSearchParams({ page, per_page: 15 });
  if (s) p.append('search', s);
  if (role) p.append('role', role);
  if (status) p.append('status', status);
  const res = await api('/api/users?' + p);
  const tbody = document.getElementById('usersTableBody');
  if (!tbody) return;
  if (!res?.ok) { tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--danger);">Failed to load users</td></tr>'; return; }
  const data = res.data.data;
  if (!data.length) { tbody.innerHTML = '<tr><td colspan="6"><div class="empty-state"><div class="empty-icon">👤</div><h3>No users found</h3></div></td></tr>'; return; }
  tbody.innerHTML = data.map(u => `
    <tr>
      <td><strong>${esc(u.name)}</strong></td>
      <td style="color:var(--text-muted);">${esc(u.email)}</td>
      <td><span class="badge badge-${u.role}">${u.role}</span></td>
      <td><span class="badge badge-${u.status}">${u.status}</span></td>
      <td style="color:var(--text-muted); font-size:.8rem;">${u.last_login ? fmtDate(u.last_login) : 'Never'}</td>
      <td style="text-align:right; white-space:nowrap;">
        <button class="btn btn-secondary btn-sm" onclick="openEditUserModal('${u.id}','${esc(u.role)}','${esc(u.status)}')">✏️ Edit</button>
        ${u.status==='active'?`<button class="btn btn-danger btn-sm" style="margin-left:.25rem;" onclick="deactivateUser('${u.id}','${esc(u.name)}')">🚫</button>`:''}
      </td>
    </tr>
  `).join('');
  renderPagination('userPagination', res.data.meta, p2 => loadUsersTable(p2));
  const metaEl = document.getElementById('userMetaInfo');
  if (metaEl) { const m = res.data.meta; metaEl.textContent = `Page ${m.page} of ${m.total_pages} • ${m.total} users`; }
}

async function openAddUserModal() {
  openModal('Add User', `
    <form id="addUserForm" onsubmit="submitAddUser(event)">
      <div class="form-group">
        <label class="form-label">Full Name *</label>
        <input id="uName" class="form-control" type="text" placeholder="John Doe" required>
      </div>
      <div class="form-group">
        <label class="form-label">Email *</label>
        <input id="uEmail" class="form-control" type="email" placeholder="user@example.com" required>
        <span class="form-error" id="uEmailErr"></span>
      </div>
      <div class="form-group">
        <label class="form-label">Password *</label>
        <input id="uPassword" class="form-control" type="password" placeholder="Min 8 chars, 1 uppercase, 1 number" required>
      </div>
      <div class="form-group">
        <label class="form-label">Role *</label>
        <select id="uRole" class="form-control">
          <option value="viewer">Viewer</option>
          <option value="analyst">Analyst</option>
          <option value="admin">Admin</option>
        </select>
      </div>
    </form>
    <p style="font-size:.8rem;color:var(--text-muted);margin-top:.5rem;">Admin-created users are verified immediately — no OTP required.</p>
  `, `
    <button class="btn btn-outline" onclick="closeModalById()">Cancel</button>
    <button class="btn btn-primary" id="saveUserBtn" onclick="document.getElementById('addUserForm').requestSubmit()">Create User</button>
  `);
}

async function submitAddUser(e) {
  e.preventDefault();
  clearErrors('uEmailErr');
  setLoading('saveUserBtn', true);
  const body = {
    name: document.getElementById('uName').value.trim(),
    email: document.getElementById('uEmail').value.trim(),
    password: document.getElementById('uPassword').value,
    role: document.getElementById('uRole').value
  };
  const res = await api('/api/users', 'POST', body);
  setLoading('saveUserBtn', false);
  if (res?.ok) { closeModalById(); toast('User created!'); loadUsersTable(1); }
  else { setError('uEmailErr', res?.data?.error || 'Failed to create user'); }
}

async function openEditUserModal(id, currentRole, currentStatus) {
  openModal('Edit User', `
    <div class="form-group">
      <label class="form-label">Role</label>
      <select id="editURole" class="form-control">
        <option value="viewer" ${currentRole==='viewer'?'selected':''}>Viewer</option>
        <option value="analyst" ${currentRole==='analyst'?'selected':''}>Analyst</option>
        <option value="admin" ${currentRole==='admin'?'selected':''}>Admin</option>
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">Status</label>
      <select id="editUStatus" class="form-control">
        <option value="active" ${currentStatus==='active'?'selected':''}>Active</option>
        <option value="inactive" ${currentStatus==='inactive'?'selected':''}>Inactive</option>
      </select>
    </div>
  `, `
    <button class="btn btn-outline" onclick="closeModalById()">Cancel</button>
    <button class="btn btn-primary" id="saveEditUserBtn" onclick="submitEditUser('${id}')">Save Changes</button>
  `);
}

async function submitEditUser(id) {
  setLoading('saveEditUserBtn', true, 'Save Changes');
  const body = { role: document.getElementById('editURole').value, status: document.getElementById('editUStatus').value };
  const res = await api(`/api/users/${id}`, 'PUT', body);
  setLoading('saveEditUserBtn', false, 'Save Changes');
  if (res?.ok) { closeModalById(); toast('User updated!'); loadUsersTable(userPage); }
  else toast(res?.data?.error || 'Update failed', 'error');
}

async function deactivateUser(id, name) {
  openModal('Confirm Deactivation', `<p style="color:var(--text-muted);">Deactivate <strong>${esc(name)}</strong>? They won't be able to log in until reactivated.</p>`, `
    <button class="btn btn-outline" onclick="closeModalById()">Cancel</button>
    <button class="btn btn-danger" onclick="confirmDeactivate('${id}')">🚫 Deactivate</button>
  `);
}
async function confirmDeactivate(id) {
  const res = await api(`/api/users/${id}`, 'DELETE');
  closeModalById();
  if (res?.ok) { toast('User deactivated'); loadUsersTable(userPage); }
  else toast(res?.data?.error || 'Failed', 'error');
}

// ---------- CSV EXPORT ----------
async function exportCSV() {
  const res = await api('/api/transactions?per_page=1000&page=1');
  if (!res?.ok) { toast('Failed to export', 'error'); return; }
  const headers = ['Date','Type','Category','Notes','Amount'];
  const rows = res.data.data.map(tx => [
    tx.date, tx.type, tx.category_name || '', (tx.notes || '').replace(/,/g,' '), tx.amount
  ]);
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  toast('CSV exported!');
}
