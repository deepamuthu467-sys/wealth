/* ═══════════════════════════════════════════════════════
   WealthWise — Dashboard Page
   dashboard.js
═══════════════════════════════════════════════════════ */

const Dashboard = (() => {
  let donutChart = null;
  let lineChart  = null;

  const CAT_COLORS = {
    Food:          '#ef4444',
    Transport:     '#f97316',
    Shopping:      '#8b5cf6',
    Bills:         '#3b82f6',
    Entertainment: '#ec4899',
    Health:        '#10b981',
    Education:     '#06b6d4',
    Others:        '#94a3b8',
    Salary:        '#10b981',
    Freelance:     '#3b82f6',
    Investment:    '#8b5cf6',
  };

  const CAT_ICONS = {
    Food: '🍔', Transport: '🚗', Shopping: '🛍️', Bills: '📋',
    Entertainment: '🎮', Health: '💊', Education: '📚', Others: '📦',
    Salary: '💼', Freelance: '💻', Investment: '📈',
  };

  const render = () => {
    const user     = Store.getCurrentUser();
    const summary  = Store.getSummary(user.id);
    const currency = Store.getSettings().currency || '₹';

    // Destroy existing charts
    if (donutChart) { donutChart.destroy(); donutChart = null; }
    if (lineChart)  { lineChart.destroy();  lineChart  = null; }

    const html = `
      <div class="page-enter">
        <!-- Header -->
        <div class="page-header">
          <div>
            <h1 class="page-title">Dashboard</h1>
            <p class="page-subtitle">Welcome back, ${user.name.split(' ')[0]}! Here's your financial overview.</p>
          </div>
          <button class="btn btn-primary" onclick="App.openAddTransaction()">
            <span>+</span> Add Transaction
          </button>
        </div>

        <!-- Stats Row -->
        <div class="grid-4 stagger" id="dashboard-stats">
          ${renderStatCard('💰', 'Total Balance', summary.balance, 'blue', summary.balance >= 0 ? 'up' : 'down')}
          ${renderStatCard('📈', 'Total Income', summary.totalIncome, 'green', 'up')}
          ${renderStatCard('📉', 'Total Expenses', summary.totalExpense, 'red', 'down')}
          ${renderStatCard('🎯', 'Total Savings', summary.totalSavings, 'purple', summary.totalSavings >= 0 ? 'up' : 'down')}
        </div>

        <!-- Charts Row -->
        <div class="grid-2-1 mt-6">
          <!-- Line Chart -->
          <div class="card">
            <div class="card-header">
              <div>
                <div class="card-title">Income vs Expenses</div>
                <div class="card-subtitle">Last 6 months trend</div>
              </div>
            </div>
            <div class="card-body">
              <div class="chart-wrapper" style="height:240px">
                <canvas id="dashboard-line-chart"></canvas>
              </div>
            </div>
          </div>

          <!-- Donut Chart -->
          <div class="card">
            <div class="card-header">
              <div>
                <div class="card-title">Spending Breakdown</div>
                <div class="card-subtitle">This month by category</div>
              </div>
            </div>
            <div class="card-body">
              <div class="chart-wrapper" style="height:240px">
                <canvas id="dashboard-donut-chart"></canvas>
              </div>
            </div>
          </div>
        </div>

        <!-- Goals + Transactions Row -->
        <div class="grid-1-2 mt-6">
          <!-- Savings Goals Progress -->
          <div class="card">
            <div class="card-header">
              <div class="card-title">Savings Goals</div>
              <a href="#goals" onclick="App.navigate('goals')" class="btn btn-ghost btn-sm" style="font-size:0.8125rem">View All →</a>
            </div>
            <div class="card-body" id="dashboard-goals">
              ${renderGoalProgress(user.id, currency)}
            </div>
          </div>

          <!-- Recent Transactions -->
          <div class="card">
            <div class="card-header">
              <div class="card-title">Recent Transactions</div>
              <a href="#transactions" onclick="App.navigate('transactions')" class="btn btn-ghost btn-sm" style="font-size:0.8125rem">View All →</a>
            </div>
            <div class="recent-txn-list" id="dashboard-recent-txns">
              ${renderRecentTransactions(user.id, currency)}
            </div>
          </div>
        </div>

        <!-- AI Insights -->
        <div class="mt-6" id="dashboard-ai">
          ${renderAIInsights(user.id)}
        </div>
      </div>
    `;

    document.getElementById('page-container').innerHTML = html;

    // Init Charts (after DOM rendered)
    setTimeout(() => {
      initLineChart(user.id);
      initDonutChart(user.id, currency);
      // Animate stat values
      animateStatValues(summary, currency);
    }, 50);
  };

  const renderStatCard = (icon, label, value, color, trend) => {
    const currency = Store.getSettings().currency || '₹';
    const fmt = (n) => currency + Math.abs(n).toLocaleString('en-IN');
    const trendLabel = trend === 'up' ? '▲' : '▼';
    return `
      <div class="stat-card ${color} animate-slide-up">
        <div class="stat-card-header">
          <div class="stat-icon ${color}">${icon}</div>
          <span class="stat-badge ${value >= 0 ? 'up' : 'down'}" style="font-size:0.75rem">${trendLabel}</span>
        </div>
        <div class="stat-value" data-raw="${value}">${fmt(value)}</div>
        <div class="stat-label">${label}</div>
      </div>
    `;
  };

  const renderGoalProgress = (userId, currency) => {
    const goals = Store.getGoals(userId).slice(0, 3);
    if (goals.length === 0) {
      return `<div class="empty-state" style="padding:var(--space-8) var(--space-4)">
        <div class="empty-state-icon">🎯</div>
        <div class="empty-state-title">No goals yet</div>
        <p class="empty-state-desc">Create your first savings goal!</p>
        <button class="btn btn-primary btn-sm" onclick="App.navigate('goals')">Add Goal</button>
      </div>`;
    }
    return goals.map(g => {
      const pct = Math.min(100, g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 0);
      const color = g.color || '#1a56db';
      return `
        <div style="margin-bottom:var(--space-4)">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
            <div style="display:flex;align-items:center;gap:8px">
              <span style="font-size:1.25rem">${g.icon}</span>
              <span style="font-weight:600;font-size:0.9375rem;color:var(--text-primary)">${g.name}</span>
            </div>
            <span style="font-size:0.8125rem;font-weight:700;color:${color}">${Math.round(pct)}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill progress-fill-animated" style="background:${color};width:0%" data-target="${pct}"></div>
          </div>
          <div style="display:flex;justify-content:space-between;margin-top:4px">
            <span style="font-size:0.75rem;color:var(--text-muted)">${currency}${g.currentAmount.toLocaleString('en-IN')}</span>
            <span style="font-size:0.75rem;color:var(--text-muted)">${currency}${g.targetAmount.toLocaleString('en-IN')}</span>
          </div>
        </div>
      `;
    }).join('');
  };

  const renderRecentTransactions = (userId, currency) => {
    const txns = Store.getTransactions(userId)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 6);

    if (txns.length === 0) {
      return `<div class="empty-state">
        <div class="empty-state-icon">💳</div>
        <div class="empty-state-title">No transactions yet</div>
        <p class="empty-state-desc">Add your first income or expense!</p>
        <button class="btn btn-primary btn-sm" onclick="App.openAddTransaction()">Add Transaction</button>
      </div>`;
    }

    return txns.map(t => {
      const icon = CAT_ICONS[t.category] || '📦';
      const iconBg = t.type === 'income' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)';
      const amtColor = t.type === 'income' ? 'income' : 'expense';
      const sign = t.type === 'income' ? '+' : '-';
      const dateStr = new Date(t.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      return `
        <div class="txn-row" onclick="App.navigate('transactions')">
          <div class="txn-icon-wrap" style="background:${iconBg}">${icon}</div>
          <div class="txn-info">
            <div class="txn-category">${t.category}</div>
            <div class="txn-notes">${t.notes || '—'}</div>
          </div>
          <div class="txn-date">${dateStr}</div>
          <div class="txn-amount ${amtColor}">${sign}${currency}${t.amount.toLocaleString('en-IN')}</div>
        </div>
      `;
    }).join('');
  };

  const renderAIInsights = (userId) => {
    const insights = AI.getSpendingInsights(userId);
    if (insights.length === 0) {
      return `<div class="ai-panel">
        <div class="ai-panel-header">
          <span class="ai-badge">🤖 AI Insights</span>
          <span style="color:var(--text-muted);font-size:0.875rem">Add more transactions for personalized insights</span>
        </div>
      </div>`;
    }
    return `
      <div class="ai-panel animate-fade-in">
        <div class="ai-panel-header">
          <span class="ai-badge">🤖 AI Insights</span>
          <span style="color:var(--text-secondary);font-size:0.875rem;font-weight:500">Powered by WealthWise AI</span>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:var(--space-1)">
          ${insights.map(ins => `
            <div class="ai-insight-item">
              <span class="ai-insight-icon">${ins.icon}</span>
              <span class="ai-insight-text">${ins.text}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  };

  const initLineChart = (userId) => {
    const canvas = document.getElementById('dashboard-line-chart');
    if (!canvas) return;
    const monthly = Store.getMonthlyData(userId, 6);
    const isDark  = document.documentElement.getAttribute('data-theme') === 'dark';
    const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
    const textColor = isDark ? '#8b949e' : '#94a3b8';

    lineChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: monthly.map(m => m.label),
        datasets: [
          {
            label: 'Income',
            data: monthly.map(m => m.income),
            borderColor: '#10b981',
            backgroundColor: 'rgba(16,185,129,0.08)',
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#10b981',
            pointRadius: 4,
            pointHoverRadius: 6,
            borderWidth: 2.5,
          },
          {
            label: 'Expenses',
            data: monthly.map(m => m.expense),
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59,130,246,0.08)',
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#3b82f6',
            pointRadius: 4,
            pointHoverRadius: 6,
            borderWidth: 2.5,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { color: textColor, font: { family: 'Inter', weight: '600', size: 12 }, boxWidth: 12, usePointStyle: true },
          },
          tooltip: {
            backgroundColor: isDark ? '#1f2937' : '#fff',
            titleColor: isDark ? '#e6edf3' : '#0f172a',
            bodyColor: isDark ? '#8b949e' : '#475569',
            borderColor: isDark ? '#30363d' : '#e2e8f0',
            borderWidth: 1,
            padding: 12,
            callbacks: {
              label: ctx => ` ${Store.getSettings().currency || '₹'}${ctx.parsed.y.toLocaleString('en-IN')}`,
            },
          },
        },
        scales: {
          x: {
            grid: { color: gridColor },
            ticks: { color: textColor, font: { family: 'Inter', size: 11 } },
          },
          y: {
            grid: { color: gridColor },
            ticks: {
              color: textColor,
              font: { family: 'Inter', size: 11 },
              callback: v => (Store.getSettings().currency || '₹') + (v >= 1000 ? (v / 1000) + 'K' : v),
            },
          },
        },
      },
    });
  };

  const initDonutChart = (userId, currency) => {
    const canvas = document.getElementById('dashboard-donut-chart');
    if (!canvas) return;
    const breakdown = Store.getCategoryBreakdown(userId, 'expense', 1);
    const labels = Object.keys(breakdown);
    const data   = Object.values(breakdown);

    if (data.length === 0) {
      canvas.parentElement.innerHTML = `<div class="empty-state" style="height:200px;display:flex;flex-direction:column;align-items:center;justify-content:center">
        <div class="empty-state-icon" style="font-size:2.5rem">📊</div>
        <p class="empty-state-desc">No expense data this month</p>
      </div>`;
      return;
    }

    const isDark  = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#8b949e' : '#94a3b8';

    donutChart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: labels.map(l => CAT_COLORS[l] || '#94a3b8'),
          borderWidth: 2,
          borderColor: isDark ? '#161b22' : '#ffffff',
          hoverOffset: 8,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: {
            position: 'right',
            labels: {
              color: textColor,
              font: { family: 'Inter', size: 11 },
              boxWidth: 10,
              padding: 8,
              usePointStyle: true,
            },
          },
          tooltip: {
            backgroundColor: isDark ? '#1f2937' : '#fff',
            titleColor: isDark ? '#e6edf3' : '#0f172a',
            bodyColor: isDark ? '#8b949e' : '#475569',
            borderColor: isDark ? '#30363d' : '#e2e8f0',
            borderWidth: 1,
            padding: 12,
            callbacks: {
              label: ctx => ` ${currency}${ctx.parsed.toLocaleString('en-IN')}`,
            },
          },
        },
      },
    });
  };

  const animateStatValues = (summary, currency) => {
    // Animate progress bars
    setTimeout(() => {
      document.querySelectorAll('.progress-fill-animated').forEach(bar => {
        const target = parseFloat(bar.getAttribute('data-target')) || 0;
        bar.style.width = Math.min(100, target) + '%';
      });
    }, 100);
  };

  return { render, CAT_COLORS, CAT_ICONS };
})();
