/* ═══════════════════════════════════════════════════════
   WealthWise — Reports & Analytics Page
   reports.js
═══════════════════════════════════════════════════════ */

const Reports = (() => {
  let barChart      = null;
  let pieChart      = null;
  let forecastChart = null;

  const CAT_COLORS = Dashboard.CAT_COLORS;

  const render = () => {
    const user     = Store.getCurrentUser();
    const currency = Store.getSettings().currency || '₹';

    // Destroy existing charts
    [barChart, pieChart, forecastChart].forEach(c => c && c.destroy());
    barChart = pieChart = forecastChart = null;

    document.getElementById('page-container').innerHTML = `
      <div class="page-enter">
        <div class="page-header">
          <div>
            <h1 class="page-title">Reports & Analytics</h1>
            <p class="page-subtitle">Deep dive into your spending patterns and AI-powered forecasts.</p>
          </div>
          <button class="btn btn-primary" onclick="PDFExport.exportReport()">
            📄 Export PDF
          </button>
        </div>

        <!-- Monthly Report Table -->
        <div class="card mb-4">
          <div class="card-header">
            <div>
              <div class="card-title">📅 Monthly Summary</div>
              <div class="card-subtitle">Last 6 months overview</div>
            </div>
          </div>
          <div class="card-body" style="padding:0;overflow-x:auto">
            ${renderMonthlyTable(user.id, currency)}
          </div>
        </div>

        <!-- Charts Row -->
        <div class="grid-2 mb-4">
          <!-- Bar Chart -->
          <div class="card">
            <div class="card-header">
              <div class="card-title">📊 Monthly Spending</div>
            </div>
            <div class="card-body">
              <div class="chart-wrapper" style="height:260px">
                <canvas id="reports-bar-chart"></canvas>
              </div>
            </div>
          </div>

          <!-- Pie Chart -->
          <div class="card">
            <div class="card-header">
              <div class="card-title">🥧 Category Breakdown</div>
              <select class="form-select" style="font-size:0.8125rem;padding:5px 28px 5px 10px" 
                onchange="Reports.updatePieChart(this.value)" id="pie-period-select">
                <option value="1">This Month</option>
                <option value="3">Last 3 Months</option>
                <option value="6">Last 6 Months</option>
              </select>
            </div>
            <div class="card-body">
              <div class="chart-wrapper" style="height:260px">
                <canvas id="reports-pie-chart"></canvas>
              </div>
            </div>
          </div>
        </div>

        <!-- Category Spending Analysis -->
        <div class="card mb-4">
          <div class="card-header">
            <div class="card-title">🔍 Spending Analysis — This Month</div>
          </div>
          <div class="card-body" id="cat-spending-analysis">
            ${renderCategoryAnalysis(user.id, currency, 1)}
          </div>
        </div>

        <!-- AI Budget Recommendations -->
        <div class="mb-4" id="ai-budget-section">
          ${renderBudgetRecommendations(user.id, currency)}
        </div>

        <!-- Savings Forecast -->
        <div class="card mb-4">
          <div class="card-header">
            <div>
              <div class="card-title">🔮 Savings Forecast</div>
              <div class="card-subtitle">AI-powered 12-month projection based on your savings rate</div>
            </div>
          </div>
          <div class="card-body">
            ${renderForecastSummary(user.id, currency)}
            <div class="chart-wrapper mt-4" style="height:220px">
              <canvas id="reports-forecast-chart"></canvas>
            </div>
          </div>
        </div>

        <!-- Expense Prediction -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">🤖 AI Expense Prediction</div>
          </div>
          <div class="card-body" id="ai-prediction-section">
            ${renderExpensePrediction(user.id, currency)}
          </div>
        </div>
      </div>
    `;

    // Init charts
    setTimeout(() => {
      initBarChart(user.id, currency);
      initPieChart(user.id, currency, 1);
      initForecastChart(user.id, currency);
    }, 50);
  };

  /* ── Monthly Table ── */
  const renderMonthlyTable = (userId, currency) => {
    const monthly = Store.getMonthlyData(userId, 6);
    let totalInc = 0, totalExp = 0, totalSav = 0;

    const rows = monthly.map(m => {
      totalInc += m.income;
      totalExp += m.expense;
      totalSav += m.savings;
      const savColor = m.savings >= 0 ? 'var(--success-500)' : 'var(--danger-500)';
      const savRate  = m.income > 0 ? Math.round((m.savings / m.income) * 100) : 0;
      return `
        <tr>
          <td style="font-weight:600">${m.label}</td>
          <td style="color:var(--success-500);font-weight:600">${currency}${m.income.toLocaleString('en-IN')}</td>
          <td style="color:var(--danger-500);font-weight:600">${currency}${m.expense.toLocaleString('en-IN')}</td>
          <td style="color:${savColor};font-weight:700">${m.savings >= 0 ? '+' : ''}${currency}${m.savings.toLocaleString('en-IN')}</td>
          <td>
            <div style="display:flex;align-items:center;gap:8px">
              <div class="progress-bar" style="height:6px;width:80px;flex-shrink:0">
                <div class="progress-fill" style="width:${Math.max(0, savRate)}%;background:${savColor}"></div>
              </div>
              <span style="font-size:0.8125rem;font-weight:600;color:${savColor}">${savRate}%</span>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    return `
      <table class="report-table">
        <thead>
          <tr>
            <th style="text-align:left">Month</th>
            <th>Income</th>
            <th>Expenses</th>
            <th>Savings</th>
            <th>Savings Rate</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
        <tfoot>
          <tr class="total-row">
            <td>Total</td>
            <td style="color:var(--success-500)">${currency}${totalInc.toLocaleString('en-IN')}</td>
            <td style="color:var(--danger-500)">${currency}${totalExp.toLocaleString('en-IN')}</td>
            <td style="color:${totalSav >= 0 ? 'var(--success-500)' : 'var(--danger-500)'}">${totalSav >= 0 ? '+' : ''}${currency}${totalSav.toLocaleString('en-IN')}</td>
            <td style="color:var(--text-muted)">${totalInc > 0 ? Math.round((totalSav / totalInc) * 100) : 0}% avg</td>
          </tr>
        </tfoot>
      </table>
    `;
  };

  /* ── Category Analysis ── */
  const renderCategoryAnalysis = (userId, currency, months) => {
    const breakdown = Store.getCategoryBreakdown(userId, 'expense', months);
    const total = Object.values(breakdown).reduce((s, v) => s + v, 0);
    if (total === 0) return `<p style="color:var(--text-muted);text-align:center;padding:var(--space-6)">No expense data available.</p>`;

    const sorted = Object.entries(breakdown).sort((a, b) => b[1] - a[1]);

    return sorted.map(([cat, amt]) => {
      const pct = Math.round((amt / total) * 100);
      const color = CAT_COLORS[cat] || '#94a3b8';
      const icon = Dashboard.CAT_ICONS[cat] || '📦';
      return `
        <div class="cat-spend-row">
          <div class="cat-spend-name">
            <span>${icon}</span>
            <span>${cat}</span>
          </div>
          <div class="cat-spend-bar-wrap">
            <div class="cat-spend-bar-fill" style="width:${pct}%;background:${color}"></div>
          </div>
          <div class="cat-spend-amt">${currency}${amt.toLocaleString('en-IN')}</div>
          <div style="font-size:0.8125rem;color:var(--text-muted);min-width:35px;text-align:right">${pct}%</div>
        </div>
      `;
    }).join('');
  };

  /* ── Budget Recommendations ── */
  const renderBudgetRecommendations = (userId, currency) => {
    const recs = AI.getBudgetRecommendations(userId);
    if (!recs) {
      return `<div class="ai-panel">
        <div class="ai-panel-header"><span class="ai-badge">🤖 Budget Advisor</span></div>
        <p style="color:var(--text-muted)">Add more income transactions to get budget recommendations.</p>
      </div>`;
    }

    const { recommended, actual, pct } = recs;
    const needsStatus  = pct.needs <= 50 ? 'success' : 'danger';
    const wantsStatus  = pct.wants <= 30 ? 'success' : 'danger';
    const savingStatus = pct.savings >= 20 ? 'success' : pct.savings >= 10 ? 'warn' : 'danger';

    const statusColor = (s) => s === 'success' ? 'var(--success-500)' : s === 'warn' ? 'var(--warn-500)' : 'var(--danger-500)';

    return `
      <div class="ai-panel">
        <div class="ai-panel-header">
          <span class="ai-badge">🤖 Budget Advisor</span>
          <span style="color:var(--text-secondary);font-size:0.875rem">Based on 50/30/20 Rule • Avg Income: ${currency}${recs.avgIncome.toLocaleString('en-IN')}/mo</span>
        </div>
        <div class="grid-3" style="gap:var(--space-3);margin-top:var(--space-3)">
          <div class="budget-rule-card">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <div class="budget-rule-title">🏠 Needs</div>
              <span style="font-size:0.75rem;font-weight:700;color:${statusColor(needsStatus)};background:${needsStatus === 'success' ? 'var(--success-50)' : 'var(--danger-50)'};padding:2px 8px;border-radius:999px">${pct.needs}%</span>
            </div>
            <div class="budget-rule-pct" style="color:var(--primary-600)">50%</div>
            <div class="budget-rule-desc">Recommended: ${currency}${recommended.needs.toLocaleString('en-IN')}</div>
            <div style="font-size:0.875rem;font-weight:600;color:${statusColor(needsStatus)}">Actual: ${currency}${actual.needs.toLocaleString('en-IN')}</div>
          </div>
          <div class="budget-rule-card">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <div class="budget-rule-title">🎯 Wants</div>
              <span style="font-size:0.75rem;font-weight:700;color:${statusColor(wantsStatus)};background:${wantsStatus === 'success' ? 'var(--success-50)' : 'var(--danger-50)'};padding:2px 8px;border-radius:999px">${pct.wants}%</span>
            </div>
            <div class="budget-rule-pct" style="color:var(--purple-500)">30%</div>
            <div class="budget-rule-desc">Recommended: ${currency}${recommended.wants.toLocaleString('en-IN')}</div>
            <div style="font-size:0.875rem;font-weight:600;color:${statusColor(wantsStatus)}">Actual: ${currency}${actual.wants.toLocaleString('en-IN')}</div>
          </div>
          <div class="budget-rule-card">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <div class="budget-rule-title">💰 Savings</div>
              <span style="font-size:0.75rem;font-weight:700;color:${statusColor(savingStatus)};background:${savingStatus === 'success' ? 'var(--success-50)' : savingStatus === 'warn' ? 'rgba(245,158,11,0.1)' : 'var(--danger-50)'};padding:2px 8px;border-radius:999px">${pct.savings}%</span>
            </div>
            <div class="budget-rule-pct" style="color:var(--success-500)">20%</div>
            <div class="budget-rule-desc">Recommended: ${currency}${recommended.savings.toLocaleString('en-IN')}</div>
            <div style="font-size:0.875rem;font-weight:600;color:${statusColor(savingStatus)}">Actual: ${currency}${actual.savings.toLocaleString('en-IN')}</div>
          </div>
        </div>
      </div>
    `;
  };

  /* ── Forecast Summary ── */
  const renderForecastSummary = (userId, currency) => {
    const { forecast, avgMonthlySavings } = AI.forecastSavings(userId, 12);
    if (!forecast.length) return '';

    const lastForecast = forecast[forecast.length - 1];
    const summary = Store.getSummary(userId);

    return `
      <div class="grid-3" style="gap:var(--space-3)">
        <div class="forecast-indicator">
          <div class="forecast-icon" style="background:rgba(59,130,246,0.12)">💰</div>
          <div>
            <div class="forecast-label">Current Savings</div>
            <div class="forecast-value">${currency}${summary.totalSavings.toLocaleString('en-IN')}</div>
          </div>
        </div>
        <div class="forecast-indicator">
          <div class="forecast-icon" style="background:rgba(16,185,129,0.12)">📈</div>
          <div>
            <div class="forecast-label">Avg Monthly Savings</div>
            <div class="forecast-value">${currency}${avgMonthlySavings.toLocaleString('en-IN')}</div>
          </div>
        </div>
        <div class="forecast-indicator">
          <div class="forecast-icon" style="background:rgba(139,92,246,0.12)">🔮</div>
          <div>
            <div class="forecast-label">Projected in 12 Months</div>
            <div class="forecast-value" style="color:var(--success-500)">${currency}${lastForecast.amount.toLocaleString('en-IN')}</div>
          </div>
        </div>
      </div>
    `;
  };

  /* ── Expense Prediction ── */
  const renderExpensePrediction = (userId, currency) => {
    const pred = AI.predictNextMonthExpense(userId);
    const trendIcon  = pred.trend >= 0 ? '📈' : '📉';
    const trendColor = pred.trend >= 0 ? 'var(--danger-500)' : 'var(--success-500)';
    const trendLabel = pred.trend >= 0 ? 'increase' : 'decrease';

    return `
      <div style="display:flex;gap:var(--space-6);align-items:flex-start;flex-wrap:wrap">
        <div style="flex:1;min-width:200px">
          <div style="font-size:0.875rem;color:var(--text-muted);font-weight:500;margin-bottom:4px">Next Month Predicted Expenses</div>
          <div style="font-size:2.5rem;font-weight:800;color:var(--text-primary);letter-spacing:-0.02em">${currency}${pred.predicted.toLocaleString('en-IN')}</div>
          <div style="display:flex;align-items:center;gap:8px;margin-top:8px">
            <span style="font-size:1.25rem">${trendIcon}</span>
            <span style="font-size:0.9375rem;color:${trendColor};font-weight:600">
              ${Math.abs(pred.trendPct)}% ${trendLabel} vs this month
            </span>
          </div>
        </div>
        <div style="flex:2;min-width:240px">
          <div class="info-box">
            <span class="info-box-icon">🧠</span>
            <div class="info-box-text">
              This prediction uses <strong>linear regression</strong> on your last 6 months of spending. 
              ${pred.trend > 0
                ? `Your expenses are trending upward — consider cutting back on discretionary spending to meet your savings goals.`
                : `Your expenses are trending downward — great work! Keep up the momentum.`
              }
            </div>
          </div>
        </div>
      </div>
    `;
  };

  /* ── Charts ── */
  const getChartDefaults = () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    return {
      isDark,
      gridColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
      textColor: isDark ? '#8b949e' : '#94a3b8',
      tooltipBg: isDark ? '#1f2937' : '#fff',
      tooltipTitle: isDark ? '#e6edf3' : '#0f172a',
      tooltipBody: isDark ? '#8b949e' : '#475569',
      tooltipBorder: isDark ? '#30363d' : '#e2e8f0',
    };
  };

  const initBarChart = (userId, currency) => {
    const canvas = document.getElementById('reports-bar-chart');
    if (!canvas) return;
    const monthly = Store.getMonthlyData(userId, 6);
    const { gridColor, textColor, tooltipBg, tooltipTitle, tooltipBody, tooltipBorder } = getChartDefaults();

    barChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: monthly.map(m => m.label),
        datasets: [
          {
            label: 'Income',
            data: monthly.map(m => m.income),
            backgroundColor: 'rgba(16,185,129,0.8)',
            borderRadius: 6,
            borderRadiusAll: 6,
          },
          {
            label: 'Expenses',
            data: monthly.map(m => m.expense),
            backgroundColor: 'rgba(59,130,246,0.8)',
            borderRadius: 6,
          },
          {
            label: 'Savings',
            data: monthly.map(m => m.savings),
            backgroundColor: monthly.map(m => m.savings >= 0 ? 'rgba(139,92,246,0.8)' : 'rgba(239,68,68,0.7)'),
            borderRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: textColor, font: { family: 'Inter', weight: '600', size: 12 }, boxWidth: 12 } },
          tooltip: {
            backgroundColor: tooltipBg, titleColor: tooltipTitle, bodyColor: tooltipBody,
            borderColor: tooltipBorder, borderWidth: 1, padding: 12,
            callbacks: { label: ctx => ` ${currency}${ctx.parsed.y.toLocaleString('en-IN')}` },
          },
        },
        scales: {
          x: { grid: { color: gridColor }, ticks: { color: textColor, font: { family: 'Inter', size: 11 } } },
          y: {
            grid: { color: gridColor }, ticks: {
              color: textColor, font: { family: 'Inter', size: 11 },
              callback: v => currency + (Math.abs(v) >= 1000 ? (v / 1000).toFixed(0) + 'K' : v),
            },
          },
        },
      },
    });
  };

  const initPieChart = (userId, currency, months) => {
    const canvas = document.getElementById('reports-pie-chart');
    if (!canvas) return;
    const breakdown = Store.getCategoryBreakdown(userId, 'expense', months);
    const labels = Object.keys(breakdown);
    const data   = Object.values(breakdown);
    const { textColor, tooltipBg, tooltipTitle, tooltipBody, tooltipBorder, isDark } = getChartDefaults();

    if (pieChart) { pieChart.destroy(); pieChart = null; }

    pieChart = new Chart(canvas, {
      type: 'pie',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: labels.map(l => CAT_COLORS[l] || '#94a3b8'),
          borderWidth: 2,
          borderColor: isDark ? '#161b22' : '#ffffff',
          hoverOffset: 6,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: { color: textColor, font: { family: 'Inter', size: 11 }, boxWidth: 10, padding: 8, usePointStyle: true },
          },
          tooltip: {
            backgroundColor: tooltipBg, titleColor: tooltipTitle, bodyColor: tooltipBody,
            borderColor: tooltipBorder, borderWidth: 1, padding: 12,
            callbacks: {
              label: ctx => {
                const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                const pct = Math.round((ctx.parsed / total) * 100);
                return ` ${currency}${ctx.parsed.toLocaleString('en-IN')} (${pct}%)`;
              },
            },
          },
        },
      },
    });
  };

  const updatePieChart = (months) => {
    const user = Store.getCurrentUser();
    const currency = Store.getSettings().currency || '₹';
    initPieChart(user.id, currency, parseInt(months));
  };

  const initForecastChart = (userId, currency) => {
    const canvas = document.getElementById('reports-forecast-chart');
    if (!canvas) return;
    const { forecast } = AI.forecastSavings(userId, 12);
    const { gridColor, textColor, tooltipBg, tooltipTitle, tooltipBody, tooltipBorder } = getChartDefaults();

    forecastChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: forecast.map(f => f.label),
        datasets: [{
          label: 'Projected Savings',
          data: forecast.map(f => f.amount),
          borderColor: '#8b5cf6',
          backgroundColor: 'rgba(139,92,246,0.1)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#8b5cf6',
          pointRadius: 4,
          pointHoverRadius: 6,
          borderWidth: 2.5,
          borderDash: [6, 3],
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: textColor, font: { family: 'Inter', weight: '600', size: 12 }, boxWidth: 12 } },
          tooltip: {
            backgroundColor: tooltipBg, titleColor: tooltipTitle, bodyColor: tooltipBody,
            borderColor: tooltipBorder, borderWidth: 1, padding: 12,
            callbacks: { label: ctx => ` ${currency}${ctx.parsed.y.toLocaleString('en-IN')} projected` },
          },
        },
        scales: {
          x: { grid: { color: gridColor }, ticks: { color: textColor, font: { family: 'Inter', size: 11 } } },
          y: {
            grid: { color: gridColor }, ticks: {
              color: textColor, font: { family: 'Inter', size: 11 },
              callback: v => currency + (v >= 1000 ? (v / 1000).toFixed(0) + 'K' : v),
            },
          },
        },
      },
    });
  };

  return { render, updatePieChart };
})();
