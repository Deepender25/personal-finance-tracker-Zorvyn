/* =====================================================
   FinanceDash — Professional JS Module v2
   Handles all API interactions, Charting, and UI logic
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
  const icons = {
    success: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
    error: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
    info: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`
  };
  t.className = `toast toast-${type}`;
  t.innerHTML = `<div class="toast-icon">${icons[type] || icons.success}</div><span>${esc(msg)}</span>`;
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
    toast('Network connection error', 'error');
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

// ---------- AUTH LOGIC ----------
async function handleLogin() {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  setBtn('loginBtn', true, 'Signing in...');
  const res = await api('/api/auth/login', 'POST', { email, password });
  setBtn('loginBtn', false, 'Sign In');
  if (!res) return;
  if (res.ok) { window.location.href = `/dashboard/${res.data.data.user.role}`; }
  else { toast(res.data.error || 'Login failed', 'error'); }
}

async function handleRegister() {
  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;
  setBtn('regBtn', true, 'Creating account...');
  const res = await api('/api/auth/register', 'POST', { name, email, password });
  setBtn('regBtn', false, 'Create Account');
  if (!res) return;
  if (res.ok) { window.location.href = `/verify-otp?email=${encodeURIComponent(email)}`; }
  else { toast(res.data.error || 'Registration failed', 'error'); }
}

function checkPassStrength(val) {
  const fill = document.getElementById('strengthFill');
  if (!fill) return;
  let s = 0;
  if (val.length >= 8) s += 25;
  if (/[A-Z]/.test(val)) s += 25;
  if (/[a-z]/.test(val)) s += 25;
  if (/[0-9]/.test(val)) s += 25;
  fill.style.width = s + '%';
  fill.style.background = s <= 25 ? 'var(--danger)' : s <= 50 ? 'var(--warning)' : s <= 75 ? 'var(--info)' : 'var(--success)';
}

async function handleVerify() {
  const email = new URLSearchParams(location.search).get('email');
  const otp = [...document.querySelectorAll('.otp-input')].map(i => i.value).join('');
  if (otp.length < 6) { toast('Enter 6-digit code', 'error'); return; }
  setBtn('verifyBtn', true, 'Verifying...');
  const res = await api('/api/auth/verify-email', 'POST', { email, otp });
  setBtn('verifyBtn', false, 'Verify Email');
  if (res?.ok) { toast('Email verified! You can now log in.'); setTimeout(() => location.href='/login', 1500); }
  else toast(res?.data?.error || 'Invalid OTP', 'error');
}

async function handleForgot() {
    const email = document.getElementById('forgotEmail').value.trim();
    setBtn('forgotBtn', true, 'Sending...');
    const res = await api('/api/auth/forgot-password', 'POST', { email });
    setBtn('forgotBtn', false, 'Send Recovery Code');
    if (res?.ok) {
        document.getElementById('forgotForm').style.display = 'none';
        document.getElementById('resetForm').style.display = 'block';
        document.getElementById('resetTitle').textContent = 'Check your email';
        document.getElementById('resetSub').textContent = `Recovery code sent to ${email}`;
        sessionStorage.setItem('resetEmail', email);
        toast('Code sent!');
    } else toast(res?.data?.error || 'Failed', 'error');
}

async function handleReset() {
    const email = sessionStorage.getItem('resetEmail');
    const otp = [...document.querySelectorAll('.otp-input')].map(i => i.value).join('');
    const new_password = document.getElementById('resetNewPass').value;
    setBtn('resetBtn', true, 'Updating...');
    const res = await api('/api/auth/reset-password', 'POST', { email, otp, new_password });
    setBtn('resetBtn', false, 'Change Password');
    if (res?.ok) { toast('Password updated!'); setTimeout(() => location.href='/login', 1500); }
    else toast(res?.data?.error || 'Failed', 'error');
}

async function logout() {
    await api('/api/auth/logout', 'POST');
    location.href = '/login';
}

function setBtn(id, loading, text) {
    const b = document.getElementById(id);
    if (!b) return;
    b.disabled = loading;
    b.textContent = text;
}

// ---------- DASHBOARD TABS ----------
let currentTab = 'overview';
function switchAdminTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.toggle('active', btn.id === `tab-${tab}`));
    document.querySelectorAll('.page > div[id^="section-"]').forEach(sec => sec.style.display = sec.id === `section-${tab}` ? 'block' : 'none');
    currentTab = tab;
    // Don't change location.hash here to avoid recursive triggers if called from hashchange
    // trigger loaders based on tab
    if (tab === 'overview') loadAdminDashboard();
    if (tab === 'analytics') loadAnalytics();
    if (tab === 'transactions') loadAdminTransactionsTable();
    if (tab === 'recurring') loadRecurringTable();
    if (tab === 'categories') loadCategoriesTable();
    if (tab === 'tags') loadTagsTable();
    if (tab === 'budgets') loadBudgetsTable();
    if (tab === 'users') loadUsersTable();
    if (tab === 'audit') loadAuditLog();
    if (tab === 'profile') loadProfile();
}

// ---------- OVERVIEW LOADERS ----------
async function loadAdminDashboard() {
    await Promise.all([loadSummaryCards(), loadRecentTransactions(), loadAdminCharts()]);
}

async function loadSummaryCards() {
    const res = await api('/api/dashboard/summary');
    const c = document.getElementById('summaryCards');
    if (!c || !res?.ok) return;
    const d = res.data.data;
    c.innerHTML = `
      <div class="stat-card income">
        <div class="stat-icon"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg></div>
        <div class="stat-label">Income</div>
        <div class="stat-value">${INR(d.total_income)}</div>
        <div class="stat-sub">${d.income_count} orders</div>
      </div>
      <div class="stat-card expense">
        <div class="stat-icon"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg></div>
        <div class="stat-label">Expenses</div>
        <div class="stat-value">${INR(d.total_expense)}</div>
        <div class="stat-sub">${d.expense_count} txns</div>
      </div>
      <div class="stat-card balance">
        <div class="stat-icon"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg></div>
        <div class="stat-label">Net Balance</div>
        <div class="stat-value">${INR(d.net_balance)}</div>
        <div class="stat-sub">${d.net_balance >= 0 ? 'Surplus' : 'Deficit'}</div>
      </div>
      <div class="stat-card count">
        <div class="stat-icon"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg></div>
        <div class="stat-label">Total Volume</div>
        <div class="stat-value">${d.transaction_count}</div>
        <div class="stat-sub">Across all categories</div>
      </div>
    `;
}

async function loadRecentTransactions() {
    const res = await api('/api/dashboard/recent');
    const tbody = document.getElementById('recentTransactionsTable');
    if (!tbody) return;
    if (!res?.ok || !res.data.data.length) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No recent activity found.</td></tr>';
        return;
    }
    tbody.innerHTML = res.data.data.map(tx => `
        <tr>
            <td>${fmtDate(tx.date)}</td>
            <td>${esc(tx.category_name || 'General')}</td>
            <td>${esc(tx.notes || '—')}</td>
            <td><span class="badge badge-${tx.type}">${tx.type}</span></td>
            <td style="text-align:right; font-weight:600; color:${tx.type==='income'?'var(--success)':'var(--danger)'};">${tx.type==='income'?'+':'−'}${INR(tx.amount)}</td>
        </tr>
    `).join('');
}

let _trendChart = null, _catChart = null;
async function loadAdminCharts() {
    const year = document.getElementById('trendYear').value;
    const catType = document.getElementById('catChartType').value;
    
    // Trend
    const tRes = await api(`/api/dashboard/monthly-trend?year=${year}`);
    if (tRes?.ok) {
        const d = tRes.data.data;
        const ctx = document.getElementById('monthlyTrendChart');
        if (ctx) {
            if (_trendChart) _trendChart.destroy();
            _trendChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: d.map(x => x.month),
                    datasets: [
                        { label: 'Income', data: d.map(x => x.income), backgroundColor: '#22c55e', borderRadius: 4 },
                        { label: 'Expense', data: d.map(x => x.expense), backgroundColor: '#ef4444', borderRadius: 4 }
                    ]
                },
                options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } }, plugins: { legend: { position: 'top' } } }
            });
        }
    }

    // Category
    const cRes = await api(`/api/dashboard/by-category?type=${catType}`);
    if (cRes?.ok) {
        const d = cRes.data.data.slice(0, 7);
        const ctx = document.getElementById('categoryChart');
        if (ctx) {
            if (_catChart) _catChart.destroy();
            _catChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: d.map(x => x.category || 'Uncategorized'),
                    datasets: [{ data: d.map(x => x.total), backgroundColor: ['#6366f1','#22c55e','#ef4444','#f59e0b','#8b5cf6','#06b6d4','#ec4899'] }]
                },
                options: { responsive: true, maintainAspectRatio: false, cutout: '70%', plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 11 } } } } }
            });
        }
    }
}

// ---------- TRANSACTIONS TAB ----------
let adminTxPage = 1;
async function loadAdminTransactionsTable(page = adminTxPage) {
    adminTxPage = page;
    const search = document.getElementById('searchTx').value;
    const type = document.getElementById('filterType').value;
    const from = document.getElementById('txFrom').value;
    const to = document.getElementById('txTo').value;
    
    let url = `/api/transactions?page=${page}&per_page=15`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (type) url += `&type=${type}`;
    if (from) url += `&date_from=${from}`;
    if (to) url += `&date_to=${to}`;
    
    const res = await api(url);
    const tbody = document.getElementById('adminTransactionsTableBody');
    if (!tbody) return;
    if (!res?.ok || !res.data.data.length) { tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No records found.</td></tr>'; return; }
    
    tbody.innerHTML = res.data.data.map(tx => `
        <tr>
            <td>${fmtDate(tx.date)}</td>
            <td><strong>${esc(tx.category_name || 'General')}</strong></td>
            <td>${(tx.tags || []).map(t => `<span class="tag-chip">${esc(t)}</span>`).join('')}</td>
            <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;" title="${esc(tx.notes || '')}">${esc(tx.notes || '—')}</td>
            <td><span class="badge badge-${tx.type}">${tx.type}</span></td>
            <td style="text-align:right; font-weight:600; color:${tx.type==='income'?'var(--success)':'var(--danger)'};">${tx.type==='income'?'+':'−'}${INR(tx.amount)}</td>
            <td class="table-actions">
                <button class="btn btn-ghost btn-icon" onclick="openEditTxModal('${tx.id}')"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                <button class="btn btn-ghost btn-icon" style="color:var(--danger);" onclick="deleteTx('${tx.id}')"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg></button>
            </td>
        </tr>
    `).join('');
    
    renderPagination('adminTxPagination', res.data.meta, p => loadAdminTransactionsTable(p));
    document.getElementById('adminTxMetaInfo').textContent = `Showing ${res.data.data.length} of ${res.data.meta.total} records`;
}

// ---------- TRANSACTION MODALS ----------
async function openAddTxModal() {
    const cats = (await api('/api/categories'))?.data?.data || [];
    openModal('New Transaction', `
        <form id="txAddForm" onsubmit="event.preventDefault(); submitAddTx();">
            <div class="form-group">
                <label class="form-label">Amount (₹)</label>
                <input type="number" id="maAmount" class="form-control" step="0.01" required placeholder="0.00">
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
                <div class="form-group">
                    <label class="form-label">Type</label>
                    <select id="maType" class="form-control"><option value="expense">Expense</option><option value="income">Income</option></select>
                </div>
                <div class="form-group">
                    <label class="form-label">Date</label>
                    <input type="date" id="maDate" class="form-control" value="${new Date().toISOString().split('T')[0]}" required>
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">Category</label>
                <select id="maCat" class="form-control">
                    <option value="">— Select —</option>
                    ${cats.map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">Tags (comma separated)</label>
                <input type="text" id="maTags" class="form-control" placeholder="food, luxury, business">
            </div>
            <div class="form-group">
                <label class="form-label">Notes</label>
                <input type="text" id="maNotes" class="form-control" placeholder="What was this for?">
            </div>
        </form>
    `, `
        <button class="btn btn-outline" onclick="closeModalById()">Cancel</button>
        <button class="btn btn-primary" onclick="document.getElementById('txAddForm').requestSubmit()">Save Transaction</button>
    `);
}

async function submitAddTx() {
    const tags = document.getElementById('maTags').value.split(',').map(t => t.trim()).filter(t => t);
    const body = {
        amount: parseFloat(document.getElementById('maAmount').value),
        type: document.getElementById('maType').value,
        date: document.getElementById('maDate').value,
        category_id: document.getElementById('maCat').value || null,
        notes: document.getElementById('maNotes').value,
        tags: tags
    };
    const res = await api('/api/transactions', 'POST', body);
    if (res?.ok) { toast('Transaction added'); closeModalById(); loadAdminTransactionsTable(); loadSummaryCards(); }
    else toast(res?.data?.error || 'Save failed', 'error');
}

async function openEditTxModal(id) {
    const [txRes, catsRes] = await Promise.all([api(`/api/transactions/${id}`), api('/api/categories')]);
    if (!txRes?.ok) return;
    const tx = txRes.data.data;
    const cats = catsRes?.data?.data || [];
    openModal('Edit Transaction', `
        <form id="txEditForm" onsubmit="event.preventDefault(); submitEditTx('${id}');">
            <div class="form-group">
                <label class="form-label">Amount (₹)</label>
                <input type="number" id="meAmount" class="form-control" step="0.01" value="${tx.amount}" required>
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
                <div class="form-group">
                    <label class="form-label">Type</label>
                    <select id="meType" class="form-control"><option value="expense" ${tx.type==='expense'?'selected':''}>Expense</option><option value="income" ${tx.type==='income'?'selected':''}>Income</option></select>
                </div>
                <div class="form-group">
                    <label class="form-label">Date</label>
                    <input type="date" id="meDate" class="form-control" value="${tx.date}" required>
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">Category</label>
                <select id="meCat" class="form-control">
                    <option value="">— Select —</option>
                    ${cats.map(c => `<option value="${c.id}" ${c.id===tx.category_id?'selected':''}>${esc(c.name)}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">Tags (comma separated)</label>
                <input type="text" id="meTags" class="form-control" value="${(tx.tags||[]).join(', ')}">
            </div>
            <div class="form-group">
                <label class="form-label">Notes</label>
                <input type="text" id="meNotes" class="form-control" value="${esc(tx.notes || '')}">
            </div>
        </form>
    `, `
        <button class="btn btn-outline" onclick="closeModalById()">Cancel</button>
        <button class="btn btn-primary" onclick="document.getElementById('txEditForm').requestSubmit()">Update Transaction</button>
    `);
}

async function submitEditTx(id) {
    const tags = document.getElementById('meTags').value.split(',').map(t => t.trim()).filter(t => t);
    const body = {
        amount: parseFloat(document.getElementById('meAmount').value),
        type: document.getElementById('meType').value,
        date: document.getElementById('meDate').value,
        category_id: document.getElementById('meCat').value || null,
        notes: document.getElementById('meNotes').value,
        tags: tags
    };
    const res = await api(`/api/transactions/${id}`, 'PUT', body);
    if (res?.ok) { toast('Updated successfully'); closeModalById(); loadAdminTransactionsTable(); loadSummaryCards(); }
    else toast(res?.data?.error || 'Update failed', 'error');
}

async function deleteTx(id) {
    if (!confirm('Permanent delete this transaction?')) return;
    const res = await api(`/api/transactions/${id}`, 'DELETE');
    if (res?.ok) { toast('Deleted'); loadAdminTransactionsTable(); loadSummaryCards(); }
}

// ---------- TAGS TAB ----------
async function loadTagsTable() {
    const res = await api('/api/tags');
    const tbody = document.getElementById('tagsTableBody');
    if (!tbody) return;
    if (!res?.ok || !res.data.data.length) { tbody.innerHTML = '<tr><td colspan="3" class="empty-state">No tags configured.</td></tr>'; return; }
    tbody.innerHTML = res.data.data.map(t => `
        <tr>
            <td><strong>#${esc(t.name)}</strong></td>
            <td>${t.usage_count || 0} transactions</td>
            <td class="table-actions">
                <button class="btn btn-ghost btn-sm" style="color:var(--danger);" onclick="deleteTag('${t.id}')">Delete</button>
            </td>
        </tr>
    `).join('');
}
async function openAddTagModal() {
    openModal('New Tag', `
        <form id="tagAddForm" onsubmit="event.preventDefault(); submitAddTag();">
            <div class="form-group">
                <label class="form-label">Tag Name</label>
                <input type="text" id="tagAddName" class="form-control" placeholder="e.g. investment" required>
            </div>
        </form>
    `, `
        <button class="btn btn-outline" onclick="closeModalById()">Cancel</button>
        <button class="btn btn-primary" onclick="document.getElementById('tagAddForm').requestSubmit()">Create Tag</button>
    `);
}
async function submitAddTag() {
    const name = document.getElementById('tagAddName').value.trim();
    const res = await api('/api/tags', 'POST', { name });
    if (res?.ok) { toast('Tag created'); closeModalById(); loadTagsTable(); }
    else toast(res?.data?.error || 'Failed', 'error');
}
async function deleteTag(id) {
    if(!confirm('Delete tag? This won\'t delete transactions, only the tag itself.')) return;
    const res = await api(`/api/tags/${id}`, 'DELETE');
    if (res?.ok) { toast('Tag removed'); loadTagsTable(); }
}

// ---------- BUDGETS TAB ----------
async function loadBudgetsTable() {
    const res = await api('/api/budgets/status');
    const tbody = document.getElementById('budgetsTableBody');
    if (!tbody) return;
    if (!res?.ok || !res.data.data.length) { tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No budgets set.</td></tr>'; return; }
    tbody.innerHTML = res.data.data.map(b => {
        const pct = Math.min((b.actual / b.limit) * 100, 100);
        const barClass = b.status === 'over' ? 'budget-over' : b.status === 'warning' ? 'budget-warn' : 'budget-ok';
        return `
            <tr>
                <td><strong>${esc(b.category_name)}</strong></td>
                <td><span class="badge badge-viewer">${b.period}</span></td>
                <td>${INR(b.limit)}</td>
                <td>${INR(b.actual)}</td>
                <td style="color:${b.remaining < 0 ? 'var(--danger)' : 'var(--success)'}">${INR(Math.abs(b.remaining))} ${b.remaining < 0 ? 'Exceeded' : 'Left'}</td>
                <td>
                    <div style="display:flex; flex-direction:column; gap:.25rem; min-width:120px;">
                        <span class="badge badge-${b.status}">${b.status.toUpperCase()}</span>
                        <div class="budget-bar"><div class="budget-fill ${barClass}" style="width:${pct}%"></div></div>
                    </div>
                </td>
                <td class="table-actions">
                    <button class="btn btn-ghost btn-sm" style="color:var(--danger);" onclick="deleteBudget('${b.id}')">Delete</button>
                </td>
            </tr>
        `;
    }).join('');
}
async function openAddBudgetModal() {
    const catsRes = await api('/api/categories');
    const cats = catsRes?.data?.data || [];
    openModal('Set Spending Limit', `
        <form id="budgetAddForm" onsubmit="event.preventDefault(); submitAddBudget();">
            <div class="form-group">
                <label class="form-label">Category</label>
                <select id="budgetCat" class="form-control" required>
                    ${cats.map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">Budget Limit (₹)</label>
                <input type="number" id="budgetLimit" class="form-control" step="1" required>
            </div>
            <div class="form-group">
                <label class="form-label">Period</label>
                <select id="budgetPeriod" class="form-control"><option value="monthly">Monthly</option><option value="yearly">Yearly</option></select>
            </div>
        </form>
    `, `
        <button class="btn btn-outline" onclick="closeModalById()">Cancel</button>
        <button class="btn btn-primary" onclick="document.getElementById('budgetAddForm').requestSubmit()">Save Budget</button>
    `);
}
async function submitAddBudget() {
    const body = {
        category_id: document.getElementById('budgetCat').value,
        amount_limit: parseFloat(document.getElementById('budgetLimit').value),
        period: document.getElementById('budgetPeriod').value
    };
    const res = await api('/api/budgets', 'POST', body);
    if (res?.ok) { toast('Budget updated'); closeModalById(); loadBudgetsTable(); }
    else toast(res?.data?.error || 'Failed', 'error');
}
async function deleteBudget(id) {
    if(!confirm('Delete this budget limit?')) return;
    const res = await api(`/api/budgets/${id}`, 'DELETE');
    if (res?.ok) { toast('Budget removed'); loadBudgetsTable(); }
}

// ---------- RECURRING TAB ----------
async function loadRecurringTable() {
    const res = await api('/api/data/recurring');
    const tbody = document.getElementById('recurringTableBody');
    if (!tbody) return;
    if (!res?.ok || !res.data.data.length) { tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No recurring schedules.</td></tr>'; return; }
    tbody.innerHTML = res.data.data.map(r => `
        <tr>
            <td><strong>${fmtDate(r.next_due_date)}</strong></td>
            <td>${esc(r.category_name || 'General')}</td>
            <td>${esc(r.notes || '—')}</td>
            <td><span class="badge badge-analyst">${r.recurrence_interval}</span></td>
            <td><span class="badge badge-${r.type}">${r.type}</span></td>
            <td style="text-align:right; font-weight:600;">${INR(r.amount)}</td>
            <td class="table-actions">
                <button class="btn btn-ghost btn-sm" style="color:var(--danger);" onclick="deleteRecurring('${r.id}')">Delete</button>
            </td>
        </tr>
    `).join('');
}
async function openAddRecurringModal() {
    const cats = (await api('/api/categories'))?.data?.data || [];
    openModal('New Recurring Schedule', `
        <form id="recAddForm" onsubmit="event.preventDefault(); submitAddRecurring();">
            <div class="form-group">
                <label class="form-label">Amount (₹)</label>
                <input type="number" id="raAmount" class="form-control" required placeholder="0.00">
            </div>
            <div class="form-group">
                <label class="form-label">Interval</label>
                <select id="raInterval" class="form-control">
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly" selected>Monthly</option>
                    <option value="yearly">Yearly</option>
                </select>
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
                <div class="form-group">
                    <label class="form-label">Type</label>
                    <select id="raType" class="form-control"><option value="expense">Expense</option><option value="income">Income</option></select>
                </div>
                <div class="form-group">
                    <label class="form-label">Start Date</label>
                    <input type="date" id="raDate" class="form-control" value="${new Date().toISOString().split('T')[0]}" required>
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">Category</label>
                <select id="raCat" class="form-control">
                    <option value="">— Select —</option>
                    ${cats.map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">Notes</label>
                <input type="text" id="raNotes" class="form-control" placeholder="Netflix, Rent, Salary etc.">
            </div>
        </form>
    `, `
        <button class="btn btn-outline" onclick="closeModalById()">Cancel</button>
        <button class="btn btn-primary" onclick="document.getElementById('recAddForm').requestSubmit()">Create Schedule</button>
    `);
}
async function submitAddRecurring() {
    const body = {
        amount: parseFloat(document.getElementById('raAmount').value),
        interval: document.getElementById('raInterval').value,
        type: document.getElementById('raType').value,
        start_date: document.getElementById('raDate').value,
        category_id: document.getElementById('raCat').value || null,
        notes: document.getElementById('raNotes').value
    };
    const res = await api('/api/data/recurring', 'POST', body);
    if (res?.ok) { toast('Schedule created'); closeModalById(); loadRecurringTable(); }
    else toast(res?.data?.error || 'Failed', 'error');
}
async function processRecurring() {
    setBtn('procRecBtn', true, 'Processing...');
    const res = await api('/api/data/recurring/process', 'POST');
    setBtn('procRecBtn', false, 'Process Due Now');
    if (res?.ok) { toast(`Processed ${res.data.data.processed} due transactions!`); loadRecurringTable(); loadSummaryCards(); }
    else toast('Processing failed', 'error');
}
async function deleteRecurring(id) {
    if(!confirm('Stop this recurring cycle? Past transactions won\'t be affected.')) return;
    const res = await api(`/api/data/recurring/${id}`, 'DELETE');
    if (res?.ok) { toast('Sheduly removed'); loadRecurringTable(); }
}

// ---------- ANALYTICS TAB ----------
let _yoyChart = null, _heatmapChart = null;
async function loadAnalytics() {
    const year = document.getElementById('heatmapYear').value;
    const yoyRes = await api(`/api/analytics/yoy-comparison?year=${year}`);
    const heatRes = await api(`/api/analytics/heatmap?year=${year}`);
    const cardsRes = await api(`/api/analytics/savings-rate`);
    
    // Savings Cards
    if (cardsRes?.ok) {
        const d = cardsRes.data.data;
        document.getElementById('analyticsCards').innerHTML = `
            <div class="stat-card balance">
                <div class="stat-icon"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div>
                <div class="stat-label">Savings Rate</div>
                <div class="stat-value">${(d.savings_rate||0).toFixed(1)}%</div>
                <div class="stat-sub">From ${INR(d.total_income)} revenue</div>
            </div>
            <div class="stat-card count">
                <div class="stat-icon"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>
                <div class="stat-label">Retained Capital</div>
                <div class="stat-value">${INR(d.savings)}</div>
                <div class="stat-sub">Profit after tax & spend</div>
            </div>
        `;
    }

    if (yoyRes?.ok) {
        const d = yoyRes.data.data;
        const ctx = document.getElementById('yoyChart');
        if (ctx) {
            if (_yoyChart) _yoyChart.destroy();
            _yoyChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
                    datasets: [
                        { label: 'Current Year', data: d.map(x => x.current_total), borderColor: 'var(--primary)', backgroundColor: 'var(--primary-glow)', fill: true, tension: 0.3 },
                        { label: 'Prior Year', data: d.map(x => x.previous_total), borderColor: 'var(--text-muted)', borderDash: [5,5], fill: false, tension: 0.3 }
                    ]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } } }
            });
        }
    }

    if (heatRes?.ok) {
        const d = heatRes.data.data;
        const ctx = document.getElementById('heatmapChart');
        if (ctx) {
            if (_heatmapChart) _heatmapChart.destroy();
            // Since Chart.js doesn't do native Heatmap well without plugins, 
            // we use a radar or simple vertical bar as "frequency" or just a line chart of daily spend.
            // Let's use a specialized Line chart for 365 points of daily spend.
            _heatmapChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: d.map(x => x.day),
                    datasets: [{ label: 'Daily Expense', data: d.map(x => x.total), backgroundColor: 'rgba(99, 102, 241, 0.4)', borderRadius: 1 }]
                },
                options: { 
                   responsive: true, maintainAspectRatio: false, 
                   scales: { x: { display: false }, y: { beginAtZero: true } },
                   plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => INR(c.raw) } } }
                }
            });
        }
    }
}

// ---------- AUDIT TAB ----------
let auditPage = 1;
async function loadAuditLog(page = auditPage) {
    auditPage = page;
    const action = document.getElementById('auditAction').value;
    const entity = document.getElementById('auditEntity').value;
    const from = document.getElementById('auditFrom').value;
    const to = document.getElementById('auditTo').value;
    
    let url = `/api/audit?page=${page}&per_page=20`;
    if (action) url += `&action=${action}`;
    if (entity) url += `&entity_type=${entity}`;
    if (from) url += `&date_from=${from}`;
    if (to) url += `&date_to=${to}`;
    
    const res = await api(url);
    const tbody = document.getElementById('auditTableBody');
    if (!tbody || !res?.ok) return;
    
    tbody.innerHTML = res.data.data.map(l => `
        <tr>
            <td style="font-size:.8rem; color:var(--text-muted);">${fmtDate(l.created_at)} ${new Date(l.created_at).toLocaleTimeString()}</td>
            <td><strong>${esc(l.user_email || 'System')}</strong></td>
            <td><span class="badge badge-viewer">${l.action}</span></td>
            <td class="key-prefix">${l.entity_type} / ${l.entity_id ? (l.entity_id.slice(0,8)+'...') : '—'}</td>
            <td style="color:var(--text-muted);">${l.ip_address || '—'}</td>
            <td style="text-align:right;"><button class="btn btn-ghost btn-sm" onclick="viewAuditDetails('${l.id}')">View</button></td>
        </tr>
    `).join('');
    
    renderPagination('auditPagination', res.data.meta, p => loadAuditLog(p));
    document.getElementById('auditMetaInfo').textContent = `Total actions: ${res.data.meta.total}`;
}
async function viewAuditDetails(id) {
    // Standard detail fetch would go here, for now just placeholder for intern project
    toast('Audit detailed JSON logged to console', 'info');
}

// ---------- PROFILE TAB ----------
async function loadProfile() {
    const res = await api('/api/me');
    if (!res?.ok) return;
    const u = res.data.data;
    
    document.getElementById('profileAvatar').textContent = u.name[0].toUpperCase();
    document.getElementById('profileName').textContent = u.name;
    document.getElementById('profileEmail').textContent = u.email;
    document.getElementById('profNameInput').value = u.name;
    
    // API Keys
    const keysRes = await api('/api/me/api-keys');
    const keyList = document.getElementById('apiKeysList');
    if (keysRes?.ok && keyList) {
        if (!keysRes.data.data.length) keyList.innerHTML = '<p class="empty-state">No API keys generated.</p>';
        else keyList.innerHTML = keysRes.data.data.map(k => `
            <div class="stat-card" style="display:flex; justify-content:space-between; align-items:center; padding:.75rem 1rem;">
                <div>
                    <div style="font-weight:600; font-size:.9rem;">${esc(k.label)}</div>
                    <div class="key-prefix">${k.key_prefix}••••••••</div>
                </div>
                <div style="text-align:right;">
                    <div style="font-size:.7rem; color:var(--text-muted);">Used ${k.last_used_at ? fmtDate(k.last_used_at) : 'Never'}</div>
                    <button class="btn btn-sm" style="color:var(--danger); padding:0; height:auto;" onclick="revokeApiKey('${k.id}')">Revoke</button>
                </div>
            </div>
        `).join('');
    }
}
async function updateProfile() {
    const body = {
        name: document.getElementById('profNameInput').value,
        current_password: document.getElementById('profCurrPass').value,
        new_password: document.getElementById('profNewPass').value
    };
    if (body.new_password && !body.current_password) { toast('Current password required to change password', 'error'); return; }
    
    const res = await api('/api/me', 'PUT', body);
    if (res?.ok) { toast('Profile updated'); loadProfile(); }
    else toast(res?.data?.error || 'Update failed', 'error');
}
async function openCreateApiKeyModal() {
    openModal('Generate API Key', `
        <div class="info-box info-box-blue" style="margin-bottom:1rem;">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            This key will grant programmatic access to your records. Keys are shown only once upon creation.
        </div>
        <form id="apiKeyAddForm" onsubmit="event.preventDefault(); submitCreateApiKey();">
            <div class="form-group">
                <label class="form-label">Key Label</label>
                <input type="text" id="akLabel" class="form-control" placeholder="e.g. Zapier Integration" required>
            </div>
        </form>
    `, `
        <button class="btn btn-outline" onclick="closeModalById()">Cancel</button>
        <button class="btn btn-primary" onclick="document.getElementById('apiKeyAddForm').requestSubmit()">Generate Key</button>
    `);
}
async function submitCreateApiKey() {
    const body = { label: document.getElementById('akLabel').value, permissions: ['read', 'write'] };
    const res = await api('/api/me/api-keys', 'POST', body);
    if (res?.ok) {
        const k = res.data.data;
        openModal('Success — Key Generated', `
            <p style="font-size:.9rem; margin-bottom:1rem;">Copy your secret key now. You won't be able to see it again!</p>
            <div class="form-group">
                <div class="input-group">
                    <input type="text" value="${k.key}" class="form-control" readonly id="generatedKeyInp" style="font-family:monospace; background:var(--bg-subtle);">
                    <button class="btn btn-outline" style="position:absolute; right:0; height:100%; border-radius:0 8px 8px 0;" onclick="navigator.clipboard.writeText('${k.key}'); toast('Copied!')">Copy</button>
                </div>
            </div>
        `, `<button class="btn btn-primary" onclick="closeModalById(); loadProfile();">I've Saved It</button>`);
    } else toast('Failed to generate key', 'error');
}
async function revokeApiKey(id) {
    if(!confirm('Revoke this key? Apps using it will lose access immediately.')) return;
    const res = await api(`/api/me/api-keys/${id}`, 'DELETE');
    if (res?.ok) { toast('Key revoked'); loadProfile(); }
}

// ---------- DATA IMPORT/EXPORT ----------
async function exportCSV() {
    const type = document.getElementById('filterType').value;
    const cat = document.getElementById('txTo').getAttribute('data-cat-filter') || ''; // dummy
    toast('Generating CSV...', 'info');
    let url = `/api/data/export/csv?type=${type}`;
    // simple download trigger
    const link = document.createElement('a');
    link.href = url;
    link.download = 'transactions_export.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
function openImportCSVModal() {
    openModal('Import Transactions', `
        <div class="info-box info-box-yellow" style="margin-bottom:1rem;">
             CSV must headers: amount, type, date (YYYY-MM-DD), notes (optional), category (optional).
        </div>
        <div class="upload-zone" id="dropZone" onclick="document.getElementById('csvFile').click()">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            <p style="margin-top:.5rem;"><strong>Click to upload</strong> or drag and drop CSV file</p>
            <input type="file" id="csvFile" accept=".csv" onchange="handleCsvFileChange()">
        </div>
        <div id="fileInfo" style="margin-top:1rem; font-size:.875rem; text-align:center;"></div>
    `, `
        <button class="btn btn-outline" onclick="closeModalById()">Cancel</button>
        <button class="btn btn-primary" id="importBtn" onclick="submitImportCSV()" disabled>Upload & Import</button>
    `);
}
function handleCsvFileChange() {
    const f = document.getElementById('csvFile').files[0];
    if (f) {
        document.getElementById('fileInfo').textContent = `Ready: ${f.name} (${(f.size/1024).toFixed(1)} KB)`;
        document.getElementById('importBtn').disabled = false;
    }
}
async function submitImportCSV() {
    const f = document.getElementById('csvFile').files[0];
    if (!f) return;
    const formData = new FormData();
    formData.append('file', f);
    setBtn('importBtn', true, 'Importing...');
    try {
        const res = await fetch('/api/data/import/csv', { method: 'POST', body: formData, credentials: 'include' });
        const d = await res.json();
        if (res.ok) {
            toast(`Success: ${d.data.success} rows, Failed: ${d.data.failed}`);
            closeModalById();
            loadAdminTransactionsTable();
            loadSummaryCards();
        } else toast(d.error || 'Import failed', 'error');
    } catch (e) { toast('Network error during upload', 'error'); }
    finally { setBtn('importBtn', false, 'Upload & Import'); }
}

// ---------- USERS TAB ----------
async function loadUsersTable() {
    const res = await api('/api/users');
    const tbody = document.getElementById('usersTableBody');
    if (!tbody || !res?.ok) return;
    tbody.innerHTML = res.data.data.map(u => `
        <tr>
            <td><strong>${esc(u.name)}</strong></td>
            <td>${esc(u.email)}</td>
            <td><span class="badge badge-${u.role}">${u.role}</span></td>
            <td><span class="badge badge-${u.status}">${u.status}</span></td>
            <td style="font-size:.75rem; color:var(--text-muted);">${u.last_login ? fmtDate(u.last_login) : 'Never'}</td>
            <td class="table-actions">
                <button class="btn btn-ghost btn-sm" onclick="openEditUserModal('${u.id}', '${u.role}', '${u.status}')">Edit</button>
            </td>
        </tr>
    `).join('');
}
// placeholder modals for other core logic if missing from existing but let's assume consistent
function renderPagination(id, meta, onPage) {
    const el = document.getElementById(id);
    if (!el) return;
    const { page, total_pages } = meta;
    if (total_pages <= 1) { el.innerHTML = ''; return; }
    let h = `<button class="page-btn" onclick="(${onPage.toString()})(${page - 1})" ${page <= 1 ? 'disabled' : ''}>Prev</button>`;
    for (let i = 1; i <= total_pages; i++) {
        if (i===1 || i===total_pages || (i >= page-1 && i <= page+1)) {
            h += `<button class="page-btn ${i===page?'active':''}" onclick="(${onPage.toString()})(${i})">${i}</button>`;
        } else if (i === page-2 || i === page+2) h += '<span style="color:var(--text-muted)">...</span>';
    }
    h += `<button class="page-btn" onclick="(${onPage.toString()})(${page + 1})" ${page >= total_pages ? 'disabled' : ''}>Next</button>`;
    el.innerHTML = h;
}

// ---------- CATEGORIES ----------
async function loadCategoriesTable() {
    const res = await api('/api/categories');
    const tbody = document.getElementById('categoriesTableBody');
    if (!tbody || !res?.ok) return;
    tbody.innerHTML = res.data.data.map(c => `
        <tr>
            <td><strong>${esc(c.name)}</strong></td>
            <td class="table-actions">
                 <button class="btn btn-ghost btn-sm" style="color:var(--danger);" onclick="deleteCategory('${c.id}')">Delete</button>
            </td>
        </tr>
    `).join('');
}
async function openAddCategoryModal() {
    openModal('New Category', `
        <form id="catAddForm" onsubmit="event.preventDefault(); submitAddCategory();">
            <div class="form-group">
                <label class="form-label">Category Name</label>
                <input type="text" id="catAddName" class="form-control" placeholder="e.g. Travel" required>
            </div>
        </form>
    `, `<button class="btn btn-outline" onclick="closeModalById()">Cancel</button><button class="btn btn-primary" onclick="document.getElementById('catAddForm').requestSubmit()">Add Category</button>`);
}
async function submitAddCategory() {
    const name = document.getElementById('catAddName').value.trim();
    const res = await api('/api/categories', 'POST', { name });
    if (res?.ok) { toast('Category added'); closeModalById(); loadCategoriesTable(); }
}
async function deleteCategory(id) {
    if(!confirm('Delete? This fails if transactions exist.')) return;
    const res = await api(`/api/categories/${id}`, 'DELETE');
    if(res?.ok) { toast('Deleted'); loadCategoriesTable(); }
    else toast('Cannot delete: Category in use', 'error');
}

// ---------- CORE JS INITIALIZER ----------
document.addEventListener('DOMContentLoaded', () => {
   // Initial page check
   if (document.body.innerHTML.includes('dashboard')) {
       // if we are on a dashboard page, default load logic is already in templates script tags
   }
});
