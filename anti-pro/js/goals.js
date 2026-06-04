/* ═══════════════════════════════════════════════════════
   WealthWise — Savings Goals Page
   goals.js
═══════════════════════════════════════════════════════ */

const Goals = (() => {
  const GOAL_ICONS = ['🎯', '✈️', '🏠', '🚗', '🏍️', '💻', '📚', '🎓', '💍', '🛡️',
                      '🏖️', '🎮', '🏋️', '🍕', '📱', '💰', '🏦', '🎁', '🌍', '⭐'];

  const GOAL_COLORS = [
    { label: 'Blue',   value: '#1a56db' },
    { label: 'Green',  value: '#0e9f6e' },
    { label: 'Purple', value: '#8b5cf6' },
    { label: 'Orange', value: '#f97316' },
    { label: 'Pink',   value: '#ec4899' },
    { label: 'Teal',   value: '#14b8a6' },
    { label: 'Red',    value: '#ef4444' },
    { label: 'Amber',  value: '#f59e0b' },
  ];

  /* ── Render page ── */
  const render = () => {
    const user     = Store.getCurrentUser();
    const goals    = Store.getGoals(user.id);
    const currency = Store.getSettings().currency || '₹';

    const totalTarget  = goals.reduce((s, g) => s + g.targetAmount, 0);
    const totalSaved   = goals.reduce((s, g) => s + g.currentAmount, 0);
    const totalGoals   = goals.length;
    const completed    = goals.filter(g => g.currentAmount >= g.targetAmount).length;

    document.getElementById('page-container').innerHTML = `
      <div class="page-enter">
        <div class="page-header">
          <div>
            <h1 class="page-title">Savings Goals</h1>
            <p class="page-subtitle">Set and track your financial targets.</p>
          </div>
          <button class="btn btn-primary" onclick="Goals.openAddGoal()">
            🎯 New Goal
          </button>
        </div>

        <!-- Goals Summary -->
        <div class="grid-4 mb-6" style="gap:var(--space-3)">
          <div class="mini-stat">
            <div class="mini-stat-icon" style="background:rgba(59,130,246,0.12)">🎯</div>
            <div>
              <div class="mini-stat-label">Total Goals</div>
              <div class="mini-stat-value">${totalGoals}</div>
            </div>
          </div>
          <div class="mini-stat">
            <div class="mini-stat-icon" style="background:rgba(16,185,129,0.12)">✅</div>
            <div>
              <div class="mini-stat-label">Completed</div>
              <div class="mini-stat-value" style="color:var(--success-500)">${completed}</div>
            </div>
          </div>
          <div class="mini-stat">
            <div class="mini-stat-icon" style="background:rgba(139,92,246,0.12)">💰</div>
            <div>
              <div class="mini-stat-label">Total Saved</div>
              <div class="mini-stat-value">${currency}${totalSaved.toLocaleString('en-IN')}</div>
            </div>
          </div>
          <div class="mini-stat">
            <div class="mini-stat-icon" style="background:rgba(249,115,22,0.12)">🏆</div>
            <div>
              <div class="mini-stat-label">Remaining</div>
              <div class="mini-stat-value">${currency}${Math.max(0, totalTarget - totalSaved).toLocaleString('en-IN')}</div>
            </div>
          </div>
        </div>

        <!-- Goals Grid -->
        <div id="goals-grid">
          ${goals.length === 0 ? renderEmpty() : renderGoals(goals, currency)}
        </div>
      </div>
    `;

    // Animate progress bars
    setTimeout(() => {
      document.querySelectorAll('.progress-fill-animated').forEach(bar => {
        const target = parseFloat(bar.getAttribute('data-target')) || 0;
        bar.style.width = Math.min(100, target) + '%';
      });
    }, 100);
  };

  const renderEmpty = () => `
    <div class="card">
      <div class="empty-state">
        <div class="empty-state-icon float">🎯</div>
        <div class="empty-state-title">No savings goals yet</div>
        <p class="empty-state-desc">Create a goal to start saving for something special — a trip, a gadget, or an emergency fund!</p>
        <button class="btn btn-primary" onclick="Goals.openAddGoal()">🎯 Create First Goal</button>
      </div>
    </div>
  `;

  const renderGoals = (goals, currency) => {
    // Sort: incomplete first, then by completion %
    const sorted = [...goals].sort((a, b) => {
      const pctA = a.targetAmount ? a.currentAmount / a.targetAmount : 0;
      const pctB = b.targetAmount ? b.currentAmount / b.targetAmount : 0;
      if (pctA >= 1 && pctB < 1) return 1;
      if (pctB >= 1 && pctA < 1) return -1;
      return pctB - pctA;
    });

    return `<div class="grid-3 stagger">${sorted.map(g => renderGoalCard(g, currency)).join('')}</div>`;
  };

  const renderGoalCard = (g, currency) => {
    const pct = g.targetAmount > 0 ? Math.min(100, (g.currentAmount / g.targetAmount) * 100) : 0;
    const remaining = Math.max(0, g.targetAmount - g.currentAmount);
    const isComplete = g.currentAmount >= g.targetAmount;
    const color = g.color || '#1a56db';

    // Days remaining
    let deadlineStr = '';
    if (g.deadline) {
      const dl = new Date(g.deadline);
      const today = new Date();
      const days = Math.ceil((dl - today) / (1000 * 60 * 60 * 24));
      if (days < 0) deadlineStr = `<span style="color:var(--danger-500);font-weight:600">Overdue!</span>`;
      else if (days === 0) deadlineStr = `<span style="color:var(--warn-500);font-weight:600">Due today!</span>`;
      else deadlineStr = `${days} days left`;
    }

    // Monthly needed
    let monthlyNeeded = '';
    if (!isComplete && g.deadline) {
      const dl = new Date(g.deadline);
      const today = new Date();
      const months = Math.max(1, Math.ceil((dl - today) / (1000 * 60 * 60 * 24 * 30)));
      const needed = Math.ceil(remaining / months);
      monthlyNeeded = `${currency}${needed.toLocaleString('en-IN')}/mo needed`;
    }

    return `
      <div class="goal-card animate-slide-up ${isComplete ? 'completed-goal' : ''}">
        ${isComplete ? `<div style="position:absolute;top:12px;right:12px;font-size:1.5rem">🏆</div>` : ''}
        <div class="goal-card-header">
          <div class="goal-icon-wrap" style="background:${color}22">
            <span style="font-size:1.5rem">${g.icon || '🎯'}</span>
          </div>
          <div class="goal-actions">
            <button class="goal-action-btn" onclick="Goals.addFunds('${g.id}')" title="Add Funds">💰</button>
            <button class="goal-action-btn" onclick="Goals.editGoal('${g.id}')" title="Edit">✏️</button>
            <button class="goal-action-btn" onclick="Goals.deleteGoal('${g.id}')" title="Delete">🗑️</button>
          </div>
        </div>

        <div class="goal-name">${g.name}</div>
        ${g.deadline ? `<div class="goal-deadline">🗓️ ${deadlineStr}</div>` : ''}

        <div class="goal-amounts">
          <div class="goal-current">${currency}${g.currentAmount.toLocaleString('en-IN')}</div>
          <div class="goal-target">of ${currency}${g.targetAmount.toLocaleString('en-IN')}</div>
        </div>

        <div class="progress-bar" style="height:12px">
          <div class="progress-fill progress-fill-animated" style="background:${isComplete ? '#10b981' : color};width:0%" data-target="${pct}"></div>
        </div>

        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px">
          <span class="goal-pct" style="color:${isComplete ? 'var(--success-500)' : color}">
            ${isComplete ? '✅ Goal Complete!' : Math.round(pct) + '% achieved'}
          </span>
          ${!isComplete ? `<span style="font-size:0.75rem;color:var(--text-muted)">${monthlyNeeded}</span>` : ''}
        </div>

        ${!isComplete ? `
          <button class="btn btn-sm btn-primary w-full mt-3" onclick="Goals.addFunds('${g.id}')">
            💰 Add Funds
          </button>
        ` : ''}
      </div>
    `;
  };

  /* ── Open Add Goal Modal ── */
  const openAddGoal = (editData = null) => {
    App.openModal(editData ? 'Edit Goal' : '🎯 New Savings Goal', renderGoalForm(editData));
    // Init icon selector
    setTimeout(() => {
      if (editData) {
        selectIcon(editData.icon || '🎯');
        selectColor(editData.color || '#1a56db');
      }
    }, 10);
  };

  const renderGoalForm = (editData = null) => {
    const today = new Date().toISOString().split('T')[0];
    const minDate = new Date();
    minDate.setDate(minDate.getDate() + 1);
    const minDateStr = minDate.toISOString().split('T')[0];

    return `
      <form id="goal-form" onsubmit="Goals.submitGoal(event, '${editData ? editData.id : ''}')">
        <!-- Name -->
        <div class="form-group">
          <label class="form-label">Goal Name <span class="req">*</span></label>
          <input type="text" id="goal-name" class="form-input" placeholder="e.g. Emergency Fund, Travel – Bali"
            value="${editData ? editData.name : ''}" required maxlength="50" />
        </div>

        <!-- Icon -->
        <div class="form-group">
          <label class="form-label">Icon</label>
          <div style="display:flex;flex-wrap:wrap;gap:8px;max-height:120px;overflow-y:auto" id="icon-grid">
            ${GOAL_ICONS.map(ic => `
              <button type="button" class="icon-btn ${(editData ? editData.icon : '🎯') === ic ? 'selected' : ''}"
                onclick="Goals.selectIcon('${ic}')" style="width:40px;height:40px;border-radius:10px;font-size:1.375rem;border:2px solid transparent;background:var(--bg-raised);transition:all 0.15s;cursor:pointer">
                ${ic}
              </button>
            `).join('')}
          </div>
          <input type="hidden" id="goal-icon" value="${editData ? editData.icon || '🎯' : '🎯'}" />
        </div>

        <!-- Color -->
        <div class="form-group">
          <label class="form-label">Color Theme</label>
          <div style="display:flex;gap:10px;flex-wrap:wrap" id="color-grid">
            ${GOAL_COLORS.map(c => `
              <button type="button" class="color-btn ${(editData ? editData.color : '#1a56db') === c.value ? 'selected' : ''}"
                onclick="Goals.selectColor('${c.value}')"
                style="width:32px;height:32px;border-radius:50%;background:${c.value};border:3px solid ${(editData ? editData.color : '#1a56db') === c.value ? 'var(--text-primary)' : 'transparent'};cursor:pointer;transition:all 0.15s"
                title="${c.label}">
              </button>
            `).join('')}
          </div>
          <input type="hidden" id="goal-color" value="${editData ? editData.color || '#1a56db' : '#1a56db'}" />
        </div>

        <!-- Target Amount -->
        <div class="form-group">
          <label class="form-label">Target Amount <span class="req">*</span></label>
          <div class="input-wrapper">
            <span class="input-icon" style="font-size:0.9rem;font-weight:700;color:var(--text-secondary)">${Store.getSettings().currency || '₹'}</span>
            <input type="number" id="goal-target" class="form-input" placeholder="50000" min="1" step="1" required
              value="${editData ? editData.targetAmount : ''}" />
          </div>
        </div>

        ${editData ? `
        <!-- Current Amount (edit only) -->
        <div class="form-group">
          <label class="form-label">Current Saved Amount</label>
          <div class="input-wrapper">
            <span class="input-icon" style="font-size:0.9rem;font-weight:700;color:var(--text-secondary)">${Store.getSettings().currency || '₹'}</span>
            <input type="number" id="goal-current" class="form-input" placeholder="0" min="0" step="1"
              value="${editData.currentAmount || 0}" />
          </div>
        </div>
        ` : ''}

        <!-- Deadline -->
        <div class="form-group">
          <label class="form-label">Target Date</label>
          <input type="date" id="goal-deadline" class="form-input" min="${minDateStr}"
            value="${editData && editData.deadline ? editData.deadline : ''}" />
        </div>

        <div id="goal-form-error" class="form-error hidden"></div>

        <div style="display:flex;gap:var(--space-3);margin-top:var(--space-2)">
          <button type="button" class="btn btn-secondary" style="flex:1" onclick="App.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary" style="flex:2">
            ${editData ? '✏️ Update Goal' : '🎯 Create Goal'}
          </button>
        </div>
      </form>
    `;
  };

  const selectIcon = (icon) => {
    document.querySelectorAll('.icon-btn').forEach(btn => {
      const isSelected = btn.textContent.trim() === icon;
      btn.style.borderColor = isSelected ? 'var(--primary-500)' : 'transparent';
      btn.style.background  = isSelected ? 'var(--primary-50)' : 'var(--bg-raised)';
    });
    const input = document.getElementById('goal-icon');
    if (input) input.value = icon;
  };

  const selectColor = (color) => {
    document.querySelectorAll('.color-btn').forEach(btn => {
      const isSelected = btn.style.background === color ||
        btn.style.backgroundColor.toLowerCase() === color.toLowerCase();
      btn.style.borderColor = isSelected ? 'var(--text-primary)' : 'transparent';
      btn.style.transform   = isSelected ? 'scale(1.2)' : 'scale(1)';
    });
    const input = document.getElementById('goal-color');
    if (input) input.value = color;
  };

  const submitGoal = (e, editId) => {
    e.preventDefault();
    const user    = Store.getCurrentUser();
    const name    = document.getElementById('goal-name').value.trim();
    const icon    = document.getElementById('goal-icon').value;
    const color   = document.getElementById('goal-color').value;
    const target  = parseFloat(document.getElementById('goal-target').value);
    const current = editId ? (parseFloat(document.getElementById('goal-current')?.value) || 0) : 0;
    const deadline = document.getElementById('goal-deadline').value;
    const errEl = document.getElementById('goal-form-error');

    if (!name) {
      errEl.textContent = 'Please enter a goal name.';
      errEl.classList.remove('hidden');
      return;
    }
    if (!target || target <= 0) {
      errEl.textContent = 'Please enter a valid target amount.';
      errEl.classList.remove('hidden');
      return;
    }

    errEl.classList.add('hidden');

    const data = { userId: user.id, name, icon, color, targetAmount: target, deadline };

    if (editId) {
      Store.updateGoal(editId, { ...data, currentAmount: current });
      App.showToast('success', `Goal "${name}" updated! ✏️`);
    } else {
      const newGoal = Store.addGoal(data);
      App.showToast('success', `Goal "${name}" created! 🎯`);
    }

    App.closeModal();
    render();
  };

  const editGoal = (id) => {
    const user = Store.getCurrentUser();
    const goal = Store.getGoals(user.id).find(g => g.id === id);
    if (!goal) return;
    openAddGoal(goal);
  };

  const deleteGoal = (id) => {
    if (!confirm('Delete this savings goal? This cannot be undone.')) return;
    Store.deleteGoal(id);
    App.showToast('success', 'Goal deleted.');
    render();
  };

  /* ── Add Funds Modal ── */
  const addFunds = (id) => {
    const user     = Store.getCurrentUser();
    const goal     = Store.getGoals(user.id).find(g => g.id === id);
    const currency = Store.getSettings().currency || '₹';
    if (!goal) return;

    const remaining = goal.targetAmount - goal.currentAmount;

    App.openModal(`💰 Add Funds — ${goal.name}`, `
      <div style="margin-bottom:var(--space-5)">
        <div style="display:flex;align-items:center;gap:12px;padding:var(--space-4);background:var(--bg-raised);border-radius:var(--radius-lg);margin-bottom:var(--space-4)">
          <span style="font-size:2rem">${goal.icon}</span>
          <div>
            <div style="font-weight:700;font-size:1rem;color:var(--text-primary)">${goal.name}</div>
            <div style="font-size:0.875rem;color:var(--text-muted)">
              ${currency}${goal.currentAmount.toLocaleString('en-IN')} saved of ${currency}${goal.targetAmount.toLocaleString('en-IN')}
            </div>
          </div>
        </div>
        <div class="progress-bar" style="height:8px;margin-bottom:var(--space-1)">
          <div class="progress-fill" style="background:${goal.color};width:${Math.min(100, (goal.currentAmount / goal.targetAmount) * 100)}%"></div>
        </div>
        <div style="font-size:0.8125rem;color:var(--text-muted)">${currency}${remaining.toLocaleString('en-IN')} remaining to goal</div>
      </div>

      <form onsubmit="Goals.submitAddFunds(event, '${id}')">
        <div class="form-group">
          <label class="form-label">Amount to Add <span class="req">*</span></label>
          <div class="input-wrapper">
            <span class="input-icon" style="font-size:0.9rem;font-weight:700;color:var(--text-secondary)">${currency}</span>
            <input type="number" id="funds-amount" class="form-input" placeholder="Enter amount" min="1" step="1" required autofocus />
          </div>
        </div>

        <div style="display:flex;gap:var(--space-2);margin-bottom:var(--space-4);flex-wrap:wrap">
          ${[1000, 2000, 5000, 10000].map(amt => `
            <button type="button" class="btn btn-secondary btn-sm" onclick="document.getElementById('funds-amount').value=${Math.min(amt, remaining)}">${currency}${amt.toLocaleString('en-IN')}</button>
          `).join('')}
          <button type="button" class="btn btn-secondary btn-sm" onclick="document.getElementById('funds-amount').value=${remaining}">Full (${currency}${remaining.toLocaleString('en-IN')})</button>
        </div>

        <div id="funds-error" class="form-error hidden"></div>

        <div style="display:flex;gap:var(--space-3)">
          <button type="button" class="btn btn-secondary" style="flex:1" onclick="App.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-success" style="flex:2">💰 Add Funds</button>
        </div>
      </form>
    `);
  };

  const submitAddFunds = (e, id) => {
    e.preventDefault();
    const amount = parseFloat(document.getElementById('funds-amount').value);
    const errEl  = document.getElementById('funds-error');
    const user   = Store.getCurrentUser();
    const goal   = Store.getGoals(user.id).find(g => g.id === id);

    if (!amount || amount <= 0) {
      errEl.textContent = 'Please enter a valid amount.';
      errEl.classList.remove('hidden');
      return;
    }

    const newAmount = goal.currentAmount + amount;
    Store.updateGoal(id, { currentAmount: newAmount });

    // Check if goal completed
    if (newAmount >= goal.targetAmount) {
      App.closeModal();
      showCelebration(goal.name);
    } else {
      App.closeModal();
      App.showToast('success', `Added ${Store.getSettings().currency || '₹'}${amount.toLocaleString('en-IN')} to "${goal.name}"! 💰`);
    }

    render();
  };

  const showCelebration = (goalName) => {
    const overlay = document.createElement('div');
    overlay.className = 'celebration-overlay';
    overlay.innerHTML = `
      <div class="celebration-card">
        <span class="celebration-emoji">🏆</span>
        <div class="celebration-title">Goal Achieved! 🎉</div>
        <div class="celebration-desc">Congratulations! You've completed <strong>${goalName}</strong>!</div>
        <button class="btn btn-success w-full" onclick="this.closest('.celebration-overlay').remove()">
          Awesome! 🚀
        </button>
      </div>
    `;
    document.body.appendChild(overlay);

    // Auto-close after 5s
    setTimeout(() => overlay.remove(), 5000);

    // Confetti
    launchConfetti();
  };

  const launchConfetti = () => {
    const colors = ['#1a56db', '#10b981', '#8b5cf6', '#f97316', '#ec4899', '#fbbf24'];
    const container = document.createElement('div');
    container.className = 'confetti-overlay';
    document.body.appendChild(container);

    for (let i = 0; i < 60; i++) {
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
      piece.style.cssText = `
        left: ${Math.random() * 100}%;
        background: ${colors[Math.floor(Math.random() * colors.length)]};
        width: ${Math.random() * 10 + 6}px;
        height: ${Math.random() * 10 + 6}px;
        animation-delay: ${Math.random() * 0.5}s;
        animation-duration: ${Math.random() * 1.5 + 1.5}s;
        border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
      `;
      container.appendChild(piece);
    }

    setTimeout(() => container.remove(), 3000);
  };

  return { render, openAddGoal, selectIcon, selectColor, submitGoal, editGoal, deleteGoal, addFunds, submitAddFunds };
})();
