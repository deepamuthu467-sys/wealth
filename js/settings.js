/* ═══════════════════════════════════════════════════════
   WealthWise — Settings Page
   settings.js
═══════════════════════════════════════════════════════ */

const Settings = (() => {
  const CURRENCIES = [
    { symbol: '₹', code: 'INR', name: 'Indian Rupee' },
    { symbol: '$', code: 'USD', name: 'US Dollar' },
    { symbol: '€', code: 'EUR', name: 'Euro' },
    { symbol: '£', code: 'GBP', name: 'British Pound' },
    { symbol: '¥', code: 'JPY', name: 'Japanese Yen' },
    { symbol: '₩', code: 'KRW', name: 'Korean Won' },
    { symbol: 'A$', code: 'AUD', name: 'Australian Dollar' },
    { symbol: 'CA$', code: 'CAD', name: 'Canadian Dollar' },
  ];

  const render = () => {
    const user     = Store.getCurrentUser();
    const settings = Store.getSettings();
    const currency = settings.currency || '₹';
    const isDark   = document.documentElement.getAttribute('data-theme') === 'dark';
    const notifEnabled = settings.notifications && Notification.permission === 'granted';

    document.getElementById('page-container').innerHTML = `
      <div class="page-enter">
        <div class="page-header">
          <div>
            <h1 class="page-title">Settings</h1>
            <p class="page-subtitle">Manage your profile, preferences, and app settings.</p>
          </div>
        </div>

        <div class="grid-2" style="gap:var(--space-5);align-items:start">
          <!-- Left Column -->
          <div style="display:flex;flex-direction:column;gap:var(--space-5)">

            <!-- Profile Card -->
            <div class="card">
              <div class="card-header">
                <div class="card-title">👤 Profile</div>
              </div>
              <div class="card-body">
                <div style="display:flex;align-items:center;gap:var(--space-4);margin-bottom:var(--space-6)">
                  <div class="avatar avatar-xl" id="settings-avatar">${(user.name || 'U').charAt(0).toUpperCase()}</div>
                  <div>
                    <div style="font-weight:700;font-size:1.125rem;color:var(--text-primary)">${user.name}</div>
                    <div style="color:var(--text-muted);font-size:0.9375rem">${user.email}</div>
                    <div style="color:var(--text-muted);font-size:0.8125rem;margin-top:3px">Member since ${new Date(Store.getUsers().find(u => u.id === user.id)?.createdAt || Date.now()).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</div>
                  </div>
                </div>
                <form id="profile-form" onsubmit="Settings.saveProfile(event)">
                  <div class="form-group">
                    <label class="form-label">Full Name</label>
                    <input type="text" id="profile-name" class="form-input" value="${user.name}" required />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Email Address</label>
                    <input type="email" id="profile-email" class="form-input" value="${user.email}" required />
                  </div>
                  <button type="submit" class="btn btn-primary btn-sm">Save Profile</button>
                </form>
              </div>
            </div>

            <!-- Appearance -->
            <div class="card">
              <div class="card-header"><div class="card-title">🎨 Appearance</div></div>
              <div>
                <div class="settings-row">
                  <div class="settings-row-info">
                    <div class="settings-row-label">Dark Mode</div>
                    <div class="settings-row-desc">Switch between light and dark theme</div>
                  </div>
                  <label class="toggle-switch">
                    <input type="checkbox" id="theme-toggle" ${isDark ? 'checked' : ''} onchange="Settings.toggleTheme()">
                    <span class="toggle-slider"></span>
                  </label>
                </div>
                <div class="settings-row">
                  <div class="settings-row-info">
                    <div class="settings-row-label">Currency</div>
                    <div class="settings-row-desc">Set your preferred currency symbol</div>
                  </div>
                  <select class="form-select" id="currency-select" onchange="Settings.saveCurrency(this.value)">
                    ${CURRENCIES.map(c => `<option value="${c.symbol}" data-code="${c.code}" ${currency === c.symbol ? 'selected' : ''}>${c.symbol} — ${c.name}</option>`).join('')}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Column -->
          <div style="display:flex;flex-direction:column;gap:var(--space-5)">

            <!-- Notifications -->
            <div class="card">
              <div class="card-header"><div class="card-title">🔔 Notifications</div></div>
              <div>
                <div class="settings-row">
                  <div class="settings-row-info">
                    <div class="settings-row-label">Monthly Reminders</div>
                    <div class="settings-row-desc">Get a notification on the 1st of each month</div>
                  </div>
                  <label class="toggle-switch">
                    <input type="checkbox" id="notif-toggle" ${notifEnabled ? 'checked' : ''} onchange="Settings.toggleNotifications(this.checked)">
                    <span class="toggle-slider"></span>
                  </label>
                </div>
                ${notifEnabled ? `
                <div class="settings-row">
                  <div class="settings-row-info">
                    <div class="settings-row-label">Test Notification</div>
                    <div class="settings-row-desc">Send a test notification now</div>
                  </div>
                  <button class="btn btn-secondary btn-sm" onclick="Notifications.sendTest()">Send Test</button>
                </div>
                ` : ''}
              </div>
            </div>

            <!-- Data Management -->
            <div class="card">
              <div class="card-header"><div class="card-title">🗄️ Data Management</div></div>
              <div>
                <div class="settings-row">
                  <div class="settings-row-info">
                    <div class="settings-row-label">Export Data</div>
                    <div class="settings-row-desc">Download all your data as JSON</div>
                  </div>
                  <button class="btn btn-secondary btn-sm" onclick="Settings.exportData()">📥 Export</button>
                </div>
                <div class="settings-row">
                  <div class="settings-row-info">
                    <div class="settings-row-label">Export PDF Report</div>
                    <div class="settings-row-desc">Generate a comprehensive PDF report</div>
                  </div>
                  <button class="btn btn-secondary btn-sm" onclick="PDFExport.exportReport()">📄 PDF</button>
                </div>
                <div class="settings-row">
                  <div class="settings-row-info">
                    <div class="settings-row-label">Load Sample Data</div>
                    <div class="settings-row-desc">Add sample transactions and goals for demo</div>
                  </div>
                  <button class="btn btn-secondary btn-sm" onclick="Settings.loadSampleData()">🧪 Load</button>
                </div>
                <div class="settings-row">
                  <div class="settings-row-info">
                    <div class="settings-row-label" style="color:var(--danger-500)">Clear My Data</div>
                    <div class="settings-row-desc">Delete all transactions and goals (cannot undo)</div>
                  </div>
                  <button class="btn btn-danger btn-sm" onclick="Settings.clearData()">🗑️ Clear</button>
                </div>
              </div>
            </div>

            <!-- App Stats -->
            <div class="card">
              <div class="card-header"><div class="card-title">📊 App Statistics</div></div>
              <div class="card-body">
                ${renderAppStats(user.id, currency)}
              </div>
            </div>

            <!-- About -->
            <div class="card">
              <div class="card-header"><div class="card-title">ℹ️ About WealthWise</div></div>
              <div class="card-body">
                <div style="display:flex;flex-direction:column;gap:var(--space-2)">
                  <div style="display:flex;justify-content:space-between;font-size:0.9375rem">
                    <span style="color:var(--text-secondary)">Version</span>
                    <span style="font-weight:600">1.0.0</span>
                  </div>
                  <div style="display:flex;justify-content:space-between;font-size:0.9375rem">
                    <span style="color:var(--text-secondary)">Storage</span>
                    <span style="font-weight:600">LocalStorage</span>
                  </div>
                  <div style="display:flex;justify-content:space-between;font-size:0.9375rem">
                    <span style="color:var(--text-secondary)">Charts</span>
                    <span style="font-weight:600">Chart.js v4</span>
                  </div>
                  <div style="display:flex;justify-content:space-between;font-size:0.9375rem">
                    <span style="color:var(--text-secondary)">AI Engine</span>
                    <span style="font-weight:600">Linear Regression</span>
                  </div>
                </div>
                <div class="section-divider"></div>
                <p style="font-size:0.875rem;color:var(--text-muted);text-align:center">
                  Made with ❤️ for smart savers.<br>
                  All data stored locally — your privacy is protected.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  };

  const renderAppStats = (userId, currency) => {
    const txns = Store.getTransactions(userId);
    const goals = Store.getGoals(userId);
    const summary = Store.getSummary(userId);
    const incomeCount  = txns.filter(t => t.type === 'income').length;
    const expenseCount = txns.filter(t => t.type === 'expense').length;

    const stats = [
      { label: 'Total Transactions', value: txns.length },
      { label: 'Income Entries', value: incomeCount },
      { label: 'Expense Entries', value: expenseCount },
      { label: 'Active Goals', value: goals.length },
      { label: 'Goals Completed', value: goals.filter(g => g.currentAmount >= g.targetAmount).length },
    ];

    return stats.map(s => `
      <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border-subtle)">
        <span style="color:var(--text-secondary);font-size:0.9375rem">${s.label}</span>
        <span style="font-weight:700;font-size:0.9375rem">${s.value}</span>
      </div>
    `).join('') + `
      <div style="display:flex;justify-content:space-between;padding:6px 0">
        <span style="color:var(--text-secondary);font-size:0.9375rem">Net Worth Tracked</span>
        <span style="font-weight:700;font-size:0.9375rem;color:var(--success-500)">${currency}${summary.totalSavings.toLocaleString('en-IN')}</span>
      </div>
    `;
  };

  /* ── Theme Toggle ── */
  const toggleTheme = () => {
    const html = document.documentElement;
    const isDark = html.getAttribute('data-theme') === 'dark';
    const newTheme = isDark ? 'light' : 'dark';
    html.setAttribute('data-theme', newTheme);
    Store.saveSettings({ theme: newTheme });

    // Update toggle button icon
    const icon = document.getElementById('theme-icon');
    if (icon) icon.textContent = newTheme === 'dark' ? '☀️' : '🌙';

    // Sync toggle checkbox if visible
    const toggle = document.getElementById('theme-toggle');
    if (toggle) toggle.checked = newTheme === 'dark';
  };

  /* ── Currency ── */
  const saveCurrency = (symbol) => {
    const sel = document.getElementById('currency-select');
    const code = sel?.options[sel.selectedIndex]?.getAttribute('data-code') || 'INR';
    Store.saveSettings({ currency: symbol, currencyCode: code });
    App.showToast('success', `Currency set to ${symbol}`);
  };

  /* ── Profile ── */
  const saveProfile = (e) => {
    e.preventDefault();
    const name  = document.getElementById('profile-name').value.trim();
    const email = document.getElementById('profile-email').value.trim();
    const user  = Store.getCurrentUser();

    if (!name || !email) { App.showToast('error', 'Please fill all fields.'); return; }

    // Update user in users list
    const users = Store.getUsers();
    const idx = users.findIndex(u => u.id === user.id);
    if (idx !== -1) {
      users[idx].name  = name;
      users[idx].email = email;
      // Save back to localStorage
      localStorage.setItem('ww_users', JSON.stringify(users));
    }

    // Update session
    Store.setCurrentUser({ ...user, name, email });
    Store.saveSettings({ name, email });

    // Update UI
    App.updateUserUI();
    App.showToast('success', 'Profile updated! 👤');

    // Update avatar initial
    const avatar = document.getElementById('settings-avatar');
    if (avatar) avatar.textContent = name.charAt(0).toUpperCase();
  };

  /* ── Notifications ── */
  const toggleNotifications = async (checked) => {
    if (checked) {
      const ok = await Notifications.enable();
      if (!ok) {
        const toggle = document.getElementById('notif-toggle');
        if (toggle) toggle.checked = false;
      } else {
        render(); // Re-render to show test button
      }
    } else {
      Notifications.disable();
    }
  };

  /* ── Export Data ── */
  const exportData = () => {
    const user = Store.getCurrentUser();
    const data = {
      exportDate: new Date().toISOString(),
      user: { name: user.name, email: user.email },
      transactions: Store.getTransactions(user.id),
      goals: Store.getGoals(user.id),
      settings: Store.getSettings(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `WealthWise_Export_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    App.showToast('success', '📥 Data exported successfully!');
  };

  /* ── Sample Data ── */
  const loadSampleData = () => {
    if (!confirm('This will add sample transactions and goals. Continue?')) return;
    const user = Store.getCurrentUser();
    Store.seedDemoData(user.id);
    App.showToast('success', '🧪 Sample data loaded!');
    App.navigate('dashboard');
  };

  /* ── Clear Data ── */
  const clearData = () => {
    if (!confirm('This will permanently delete all your transactions and savings goals. Are you sure?')) return;
    if (!confirm('⚠️ This cannot be undone! Are you absolutely sure?')) return;
    const user = Store.getCurrentUser();
    Store.clearUserData(user.id);
    App.showToast('success', '🗑️ All data cleared.');
    App.navigate('dashboard');
  };

  /* ── Init theme from stored settings ── */
  const initTheme = () => {
    const settings = Store.getSettings();
    const theme = settings.theme || 'light';
    document.documentElement.setAttribute('data-theme', theme);
    const icon = document.getElementById('theme-icon');
    if (icon) icon.textContent = theme === 'dark' ? '☀️' : '🌙';
  };

  return { render, toggleTheme, saveCurrency, saveProfile, toggleNotifications, exportData, loadSampleData, clearData, initTheme };
})();
