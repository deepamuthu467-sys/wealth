/* ═══════════════════════════════════════════════════════
   WealthWise — Transactions Page
   transactions.js
═══════════════════════════════════════════════════════ */

const Transactions = (() => {
  let currentFilter = { type: 'all', category: 'all', search: '', sort: 'date-desc', page: 1 };
  const PAGE_SIZE = 15;

  const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Education', 'Others',
                      'Salary', 'Freelance', 'Investment'];

  const CAT_ICONS = Dashboard.CAT_ICONS;
  const CAT_COLORS = Dashboard.CAT_COLORS;

  /* ── Render page ── */
  const render = () => {
    currentFilter = { type: 'all', category: 'all', search: '', sort: 'date-desc', page: 1 };
    const user = Store.getCurrentUser();
    const currency = Store.getSettings().currency || '₹';
    const summary = Store.getSummary(user.id);

    document.getElementById('page-container').innerHTML = `
      <div class="page-enter">
        <div class="page-header">
          <div>
            <h1 class="page-title">Transactions</h1>
            <p class="page-subtitle">Track all your income and expenses in one place.</p>
          </div>
          <button class="btn btn-primary" onclick="App.openAddTransaction()">
            <span>+</span> Add Transaction
          </button>
        </div>

        <!-- Mini Summary -->
        <div class="grid-3 mb-4" style="gap:var(--space-3)">
          <div class="mini-stat">
            <div class="mini-stat-icon" style="background:rgba(16,185,129,0.12)">📈</div>
            <div>
              <div class="mini-stat-label">Income</div>
              <div class="mini-stat-value" style="color:var(--success-500)">${currency}${summary.totalIncome.toLocaleString('en-IN')}</div>
            </div>
          </div>
          <div class="mini-stat">
            <div class="mini-stat-icon" style="background:rgba(239,68,68,0.12)">📉</div>
            <div>
              <div class="mini-stat-label">Expenses</div>
              <div class="mini-stat-value" style="color:var(--danger-500)">${currency}${summary.totalExpense.toLocaleString('en-IN')}</div>
            </div>
          </div>
          <div class="mini-stat">
            <div class="mini-stat-icon" style="background:rgba(59,130,246,0.12)">💰</div>
            <div>
              <div class="mini-stat-label">Net Savings</div>
              <div class="mini-stat-value" style="color:var(--primary-600)">${currency}${summary.totalSavings.toLocaleString('en-IN')}</div>
            </div>
          </div>
        </div>

        <!-- Filter Bar -->
        <div class="filter-bar">
          <div class="search-bar" style="flex:1;min-width:200px">
            <span style="font-size:1rem;color:var(--text-muted)">🔍</span>
            <input type="text" id="txn-search" placeholder="Search transactions..." oninput="Transactions.onSearch(this.value)" />
          </div>
          <select class="form-select" id="txn-type-filter" onchange="Transactions.onFilter('type', this.value)">
            <option value="all">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
          <select class="form-select" id="txn-cat-filter" onchange="Transactions.onFilter('category', this.value)">
            <option value="all">All Categories</option>
            ${CATEGORIES.map(c => `<option value="${c}">${CAT_ICONS[c] || '📦'} ${c}</option>`).join('')}
          </select>
          <select class="form-select" id="txn-sort" onchange="Transactions.onFilter('sort', this.value)">
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="amount-desc">Highest Amount</option>
            <option value="amount-asc">Lowest Amount</option>
          </select>
        </div>

        <!-- Transaction List -->
        <div class="card" id="txn-list-card">
          <div id="txn-list-body"></div>
        </div>
      </div>
    `;

    renderList();
  };

  const getFilteredTransactions = () => {
    const user = Store.getCurrentUser();
    let txns = Store.getTransactions(user.id);

    // Filter
    if (currentFilter.type !== 'all')
      txns = txns.filter(t => t.type === currentFilter.type);

    if (currentFilter.category !== 'all')
      txns = txns.filter(t => t.category === currentFilter.category);

    if (currentFilter.search) {
      const q = currentFilter.search.toLowerCase();
      txns = txns.filter(t =>
        t.category.toLowerCase().includes(q) ||
        (t.notes && t.notes.toLowerCase().includes(q)) ||
        t.amount.toString().includes(q)
      );
    }

    // Sort
    txns.sort((a, b) => {
      if (currentFilter.sort === 'date-desc')   return new Date(b.date) - new Date(a.date);
      if (currentFilter.sort === 'date-asc')    return new Date(a.date) - new Date(b.date);
      if (currentFilter.sort === 'amount-desc') return b.amount - a.amount;
      if (currentFilter.sort === 'amount-asc')  return a.amount - b.amount;
      return 0;
    });

    return txns;
  };

  const renderList = () => {
    const currency = Store.getSettings().currency || '₹';
    const txns = getFilteredTransactions();
    const total = txns.length;
    const start = (currentFilter.page - 1) * PAGE_SIZE;
    const end   = start + PAGE_SIZE;
    const page  = txns.slice(start, end);

    const container = document.getElementById('txn-list-body');
    if (!container) return;

    if (page.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="padding:var(--space-12) var(--space-6)">
          <div class="empty-state-icon">💳</div>
          <div class="empty-state-title">No transactions found</div>
          <p class="empty-state-desc">Try changing your filters or add a new transaction.</p>
          <button class="btn btn-primary btn-sm" onclick="App.openAddTransaction()">Add Transaction</button>
        </div>
      `;
      return;
    }

    // Group by date
    const grouped = {};
    page.forEach(t => {
      const key = t.date;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(t);
    });

    let html = '';
    Object.entries(grouped)
      .sort(([a], [b]) => {
        if (currentFilter.sort === 'date-asc') return new Date(a) - new Date(b);
        return new Date(b) - new Date(a);
      })
      .forEach(([date, dayTxns]) => {
        const d = new Date(date);
        const dateLabel = d.toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
        const dayTotal = dayTxns.reduce((s, t) => t.type === 'income' ? s + t.amount : s - t.amount, 0);
        html += `
          <div style="padding:var(--space-3) var(--space-5);border-bottom:1px solid var(--border-subtle);display:flex;justify-content:space-between;align-items:center">
            <span style="font-size:0.8125rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.05em">${dateLabel}</span>
            <span style="font-size:0.875rem;font-weight:700;color:${dayTotal >= 0 ? 'var(--success-500)' : 'var(--danger-500)'}">
              ${dayTotal >= 0 ? '+' : ''}${currency}${Math.abs(dayTotal).toLocaleString('en-IN')}
            </span>
          </div>
        `;
        dayTxns.forEach(t => {
          html += renderTxnRow(t, currency);
        });
      });

    // Pagination
    const totalPages = Math.ceil(total / PAGE_SIZE);
    html += renderPagination(currentFilter.page, totalPages, total);

    container.innerHTML = html;

    // Animate rows
    container.querySelectorAll('.txn-row').forEach((row, i) => {
      row.style.animationDelay = `${i * 30}ms`;
      row.classList.add('animate-slide-up');
    });
  };

  const renderTxnRow = (t, currency) => {
    const icon = CAT_ICONS[t.category] || '📦';
    const iconBg = t.type === 'income' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)';
    const amtColor = t.type === 'income' ? 'income' : 'expense';
    const sign = t.type === 'income' ? '+' : '-';
    return `
      <div class="txn-row" id="txn-${t.id}">
        <div class="txn-icon-wrap" style="background:${iconBg}">${icon}</div>
        <div class="txn-info">
          <div class="txn-category">${t.category}</div>
          <div class="txn-notes">${t.notes || '—'}</div>
        </div>
        <div class="txn-date">${new Date(t.date).toLocaleDateString('en-IN', { day:'2-digit', month:'short' })}</div>
        <div class="txn-amount ${amtColor}">${sign}${currency}${t.amount.toLocaleString('en-IN')}</div>
        <div style="display:flex;gap:4px;flex-shrink:0">
          <button class="goal-action-btn" onclick="Transactions.editTxn('${t.id}')" title="Edit">✏️</button>
          <button class="goal-action-btn" onclick="Transactions.deleteTxn('${t.id}')" title="Delete">🗑️</button>
        </div>
      </div>
    `;
  };

  const renderPagination = (page, total, count) => {
    if (total <= 1) return `<div style="padding:var(--space-3) var(--space-5);color:var(--text-muted);font-size:0.8125rem">${count} transaction${count !== 1 ? 's' : ''}</div>`;
    let pages = '';
    for (let i = 1; i <= total; i++) {
      pages += `<button class="pagination-btn ${i === page ? 'active' : ''}" onclick="Transactions.goPage(${i})">${i}</button>`;
    }
    return `
      <div style="padding:var(--space-4) var(--space-5);display:flex;align-items:center;justify-content:space-between">
        <span style="font-size:0.8125rem;color:var(--text-muted)">${count} transaction${count !== 1 ? 's' : ''}</span>
        <div class="pagination">${pages}</div>
      </div>
    `;
  };

  /* ── Event handlers ── */
  const onSearch = (val) => {
    currentFilter.search = val;
    currentFilter.page = 1;
    renderList();
  };

  const onFilter = (key, val) => {
    currentFilter[key] = val;
    currentFilter.page = 1;
    renderList();
  };

  const goPage = (page) => {
    currentFilter.page = page;
    renderList();
    document.getElementById('txn-list-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  /* ── Add Transaction Form ── */
  const renderAddForm = (editData = null) => {
    const currency = Store.getSettings().currency || '₹';
    const cats = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Education', 'Others'];
    const incCats = ['Salary', 'Freelance', 'Investment', 'Others'];

    const today = new Date().toISOString().split('T')[0];
    const selType = editData ? editData.type : 'expense';
    const selCat  = editData ? editData.category : 'Food';

    return `
      <form id="add-txn-form" onsubmit="Transactions.submitTxn(event, '${editData ? editData.id : ''}')">
        <!-- Type Toggle -->
        <div class="form-group">
          <label class="form-label">Transaction Type</label>
          <div class="type-toggle">
            <button type="button" class="type-btn expense ${selType === 'expense' ? 'active' : ''}" 
              id="type-expense" onclick="Transactions.selectType('expense')">
              📉 Expense
            </button>
            <button type="button" class="type-btn income ${selType === 'income' ? 'active' : ''}" 
              id="type-income" onclick="Transactions.selectType('income')">
              📈 Income
            </button>
          </div>
          <input type="hidden" id="txn-type" value="${selType}" />
        </div>

        <!-- Amount -->
        <div class="form-group">
          <label class="form-label">Amount <span class="req">*</span></label>
          <div class="input-wrapper">
            <span class="input-icon" style="font-size:0.9rem;font-weight:700;color:var(--text-secondary)">${currency}</span>
            <input type="number" id="txn-amount" class="form-input" placeholder="0.00" min="0.01" step="0.01" required
              value="${editData ? editData.amount : ''}" />
          </div>
        </div>

        <!-- Category -->
        <div class="form-group">
          <label class="form-label">Category <span class="req">*</span></label>
          <div class="category-grid" id="cat-grid">
            ${cats.map(c => `
              <div class="cat-pill ${selType === 'expense' && c === selCat ? 'selected' : ''} ${selType === 'income' ? 'hidden' : ''}"
                data-cat="${c}" data-type="expense" onclick="Transactions.selectCat('${c}')">
                <span class="cat-pill-icon">${CAT_ICONS[c] || '📦'}</span>
                <span class="cat-pill-label">${c}</span>
              </div>
            `).join('')}
            ${incCats.map(c => `
              <div class="cat-pill ${selType === 'income' && c === selCat ? 'selected' : ''} ${selType === 'expense' ? 'hidden' : ''}"
                data-cat="${c}" data-type="income" onclick="Transactions.selectCat('${c}')">
                <span class="cat-pill-icon">${CAT_ICONS[c] || '📦'}</span>
                <span class="cat-pill-label">${c}</span>
              </div>
            `).join('')}
          </div>
          <input type="hidden" id="txn-category" value="${selCat}" />
        </div>

        <!-- Date -->
        <div class="form-group">
          <label class="form-label">Date <span class="req">*</span></label>
          <input type="date" id="txn-date" class="form-input" required
            max="${today}" value="${editData ? editData.date : today}" />
        </div>

        <!-- Notes -->
        <div class="form-group">
          <label class="form-label">Notes</label>
          <textarea id="txn-notes" class="form-input" placeholder="Add a note (optional)..." rows="2">${editData ? editData.notes || '' : ''}</textarea>
        </div>

        <div id="txn-form-error" class="form-error hidden"></div>

        <div style="display:flex;gap:var(--space-3);margin-top:var(--space-2)">
          <button type="button" class="btn btn-secondary" style="flex:1" onclick="App.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary" style="flex:2" id="txn-submit-btn">
            ${editData ? '✏️ Update' : '+ Add'} Transaction
          </button>
        </div>
      </form>
    `;
  };

  const selectType = (type) => {
    document.getElementById('txn-type').value = type;
    ['expense', 'income'].forEach(t => {
      document.getElementById('type-' + t).classList.toggle('active', t === type);
    });
    // Show/hide category pills
    document.querySelectorAll('.cat-pill').forEach(pill => {
      const pillType = pill.getAttribute('data-type');
      pill.classList.toggle('hidden', pillType !== type);
      pill.classList.remove('selected');
    });
    // Auto-select first visible category
    const first = document.querySelector(`.cat-pill[data-type="${type}"]`);
    if (first) {
      first.classList.add('selected');
      document.getElementById('txn-category').value = first.getAttribute('data-cat');
    }
  };

  const selectCat = (cat) => {
    document.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('selected'));
    const target = document.querySelector(`.cat-pill[data-cat="${cat}"]`);
    if (target && !target.classList.contains('hidden')) target.classList.add('selected');
    document.getElementById('txn-category').value = cat;
  };

  const submitTxn = (e, editId) => {
    e.preventDefault();
    const user     = Store.getCurrentUser();
    const type     = document.getElementById('txn-type').value;
    const amount   = parseFloat(document.getElementById('txn-amount').value);
    const category = document.getElementById('txn-category').value;
    const date     = document.getElementById('txn-date').value;
    const notes    = document.getElementById('txn-notes').value.trim();
    const errEl    = document.getElementById('txn-form-error');

    if (!amount || amount <= 0) {
      errEl.textContent = 'Please enter a valid amount.';
      errEl.classList.remove('hidden');
      return;
    }
    if (!category) {
      errEl.textContent = 'Please select a category.';
      errEl.classList.remove('hidden');
      return;
    }
    if (!date) {
      errEl.textContent = 'Please select a date.';
      errEl.classList.remove('hidden');
      return;
    }

    errEl.classList.add('hidden');

    const data = { userId: user.id, type, amount, category, date, notes };

    if (editId) {
      Store.updateTransaction(editId, data);
      App.showToast('success', 'Transaction updated! ✏️');
    } else {
      Store.addTransaction(data);
      App.showToast('success', `${type === 'income' ? '📈 Income' : '📉 Expense'} added!`);
    }

    App.closeModal();
    render();
    // Also re-render dashboard if visible
  };

  const editTxn = (id) => {
    const user = Store.getCurrentUser();
    const txn = Store.getTransactions(user.id).find(t => t.id === id);
    if (!txn) return;
    App.openModal(`Edit Transaction`, renderAddForm(txn));
    // Re-init category selection
    setTimeout(() => selectType(txn.type), 10);
  };

  const deleteTxn = (id) => {
    if (!confirm('Delete this transaction? This cannot be undone.')) return;
    Store.deleteTransaction(id);
    App.showToast('success', 'Transaction deleted.');
    renderList();
  };

  return { render, renderAddForm, selectType, selectCat, submitTxn, editTxn, deleteTxn, onSearch, onFilter, goPage };
})();
