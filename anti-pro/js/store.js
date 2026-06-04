/* ═══════════════════════════════════════════════════════
   WealthWise — LocalStorage Data Layer
   store.js
═══════════════════════════════════════════════════════ */

const Store = (() => {
  const KEYS = {
    USERS:        'ww_users',
    CURRENT_USER: 'ww_current_user',
    TRANSACTIONS: 'ww_transactions',
    GOALS:        'ww_goals',
    SETTINGS:     'ww_settings',
  };

  /* ── Generic helpers ── */
  const get = key => {
    try { return JSON.parse(localStorage.getItem(key)) || null; }
    catch { return null; }
  };

  const set = (key, val) => {
    localStorage.setItem(key, JSON.stringify(val));
  };

  /* ── Users ── */
  const getUsers = () => get(KEYS.USERS) || [];
  const saveUsers = users => set(KEYS.USERS, users);

  const findUserByEmail = email =>
    getUsers().find(u => u.email.toLowerCase() === email.toLowerCase());

  const createUser = ({ name, email, password }) => {
    const users = getUsers();
    const id = 'u_' + Date.now();
    const user = { id, name, email, password: btoa(password), createdAt: new Date().toISOString() };
    users.push(user);
    saveUsers(users);
    return user;
  };

  /* ── Current Session ── */
  const getCurrentUser = () => get(KEYS.CURRENT_USER);
  const setCurrentUser = user => set(KEYS.CURRENT_USER, user);
  const clearCurrentUser = () => localStorage.removeItem(KEYS.CURRENT_USER);

  /* ── Transactions ── */
  const getTransactions = (userId) => {
    const all = get(KEYS.TRANSACTIONS) || [];
    return all.filter(t => t.userId === userId);
  };

  const getAllTransactions = () => get(KEYS.TRANSACTIONS) || [];

  const addTransaction = (txn) => {
    const all = getAllTransactions();
    const newTxn = {
      id: 'txn_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      createdAt: new Date().toISOString(),
      ...txn
    };
    all.push(newTxn);
    set(KEYS.TRANSACTIONS, all);
    return newTxn;
  };

  const updateTransaction = (id, updates) => {
    const all = getAllTransactions();
    const idx = all.findIndex(t => t.id === id);
    if (idx === -1) return false;
    all[idx] = { ...all[idx], ...updates, updatedAt: new Date().toISOString() };
    set(KEYS.TRANSACTIONS, all);
    return all[idx];
  };

  const deleteTransaction = (id) => {
    const all = getAllTransactions().filter(t => t.id !== id);
    set(KEYS.TRANSACTIONS, all);
  };

  /* ── Goals ── */
  const getGoals = (userId) => {
    const all = get(KEYS.GOALS) || [];
    return all.filter(g => g.userId === userId);
  };

  const getAllGoals = () => get(KEYS.GOALS) || [];

  const addGoal = (goal) => {
    const all = getAllGoals();
    const newGoal = {
      id: 'goal_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      createdAt: new Date().toISOString(),
      currentAmount: 0,
      ...goal
    };
    all.push(newGoal);
    set(KEYS.GOALS, all);
    return newGoal;
  };

  const updateGoal = (id, updates) => {
    const all = getAllGoals();
    const idx = all.findIndex(g => g.id === id);
    if (idx === -1) return false;
    all[idx] = { ...all[idx], ...updates, updatedAt: new Date().toISOString() };
    set(KEYS.GOALS, all);
    return all[idx];
  };

  const deleteGoal = (id) => {
    const all = getAllGoals().filter(g => g.id !== id);
    set(KEYS.GOALS, all);
  };

  /* ── Settings ── */
  const getSettings = () => get(KEYS.SETTINGS) || {
    theme: 'light',
    currency: '₹',
    currencyCode: 'INR',
    notifications: false,
    name: '',
    email: '',
  };

  const saveSettings = (s) => set(KEYS.SETTINGS, { ...getSettings(), ...s });

  /* ── Summary helpers ── */
  const getSummary = (userId) => {
    const txns = getTransactions(userId);
    const income  = txns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = txns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return {
      totalIncome:  income,
      totalExpense: expense,
      totalSavings: income - expense,
      balance:      income - expense,
    };
  };

  const getMonthlyData = (userId, months = 6) => {
    const txns = getTransactions(userId);
    const result = [];
    const now = new Date();
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const yr = d.getFullYear();
      const mo = d.getMonth();
      const label = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      const monthTxns = txns.filter(t => {
        const td = new Date(t.date);
        return td.getFullYear() === yr && td.getMonth() === mo;
      });
      const income  = monthTxns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const expense = monthTxns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      result.push({ label, income, expense, savings: income - expense, month: mo, year: yr });
    }
    return result;
  };

  const getCategoryBreakdown = (userId, type = 'expense', monthsBack = 1) => {
    const txns = getTransactions(userId);
    const now = new Date();
    const cutoff = new Date(now.getFullYear(), now.getMonth() - (monthsBack - 1), 1);
    const filtered = txns.filter(t => t.type === type && new Date(t.date) >= cutoff);
    const map = {};
    filtered.forEach(t => {
      map[t.category] = (map[t.category] || 0) + t.amount;
    });
    return map;
  };

  /* ── Seed Demo Data ── */
  const seedDemoData = (userId) => {
    const existing = getTransactions(userId);
    if (existing.length > 0) return;

    const categories = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Education', 'Others'];
    const incomeCategories = ['Salary', 'Freelance', 'Investment', 'Others'];

    const now = new Date();
    const txns = [];

    // Generate 6 months of data
    for (let mo = 5; mo >= 0; mo--) {
      const year = now.getFullYear();
      const month = now.getMonth() - mo;
      const actualDate = new Date(year, month, 1);
      const yr = actualDate.getFullYear();
      const mn = actualDate.getMonth();

      // Income: salary
      txns.push({
        userId, type: 'income', amount: 55000,
        category: 'Salary',
        date: new Date(yr, mn, 1).toISOString().split('T')[0],
        notes: 'Monthly salary',
      });

      // Maybe freelance
      if (mo % 2 === 0) {
        txns.push({
          userId, type: 'income', amount: Math.floor(Math.random() * 8000) + 5000,
          category: 'Freelance',
          date: new Date(yr, mn, 10).toISOString().split('T')[0],
          notes: 'Freelance project payment',
        });
      }

      // Expenses
      const expenseData = [
        { category: 'Food',          amount: [3000, 5500],  notes: 'Groceries & dining' },
        { category: 'Transport',     amount: [1200, 2500],  notes: 'Fuel & Uber' },
        { category: 'Bills',         amount: [4000, 6000],  notes: 'Rent & utilities' },
        { category: 'Shopping',      amount: [2000, 6000],  notes: 'Clothes & essentials' },
        { category: 'Entertainment', amount: [800,  2500],  notes: 'OTT & outings' },
        { category: 'Health',        amount: [500,  2000],  notes: 'Medicines & gym' },
      ];

      expenseData.forEach(({ category, amount, notes }) => {
        const [min, max] = amount;
        const day = Math.floor(Math.random() * 25) + 1;
        txns.push({
          userId, type: 'expense',
          amount: Math.floor(Math.random() * (max - min)) + min,
          category,
          date: new Date(yr, mn, day).toISOString().split('T')[0],
          notes,
        });
      });
    }

    // Save all
    const all = getAllTransactions();
    const timestamped = txns.map((t, i) => ({
      ...t,
      id: 'txn_demo_' + i,
      createdAt: t.date + 'T00:00:00.000Z',
    }));
    set(KEYS.TRANSACTIONS, [...all, ...timestamped]);

    // Demo goals
    const goalData = [
      { userId, name: 'Emergency Fund', targetAmount: 100000, currentAmount: 45000, icon: '🛡️', color: '#1a56db', deadline: new Date(now.getFullYear(), now.getMonth() + 8, 1).toISOString().split('T')[0] },
      { userId, name: 'Travel – Bali',  targetAmount: 60000,  currentAmount: 22000, icon: '✈️', color: '#0e9f6e', deadline: new Date(now.getFullYear() + 1, 2, 1).toISOString().split('T')[0] },
      { userId, name: 'New Bike',       targetAmount: 85000,  currentAmount: 35000, icon: '🏍️', color: '#8b5cf6', deadline: new Date(now.getFullYear(), now.getMonth() + 10, 1).toISOString().split('T')[0] },
      { userId, name: 'Education Fund', targetAmount: 150000, currentAmount: 75000, icon: '📚', color: '#f97316', deadline: new Date(now.getFullYear() + 1, 5, 1).toISOString().split('T')[0] },
    ];

    const allGoals = getAllGoals();
    const newGoals = goalData.map((g, i) => ({
      ...g,
      id: 'goal_demo_' + i,
      createdAt: new Date().toISOString(),
    }));
    set(KEYS.GOALS, [...allGoals, ...newGoals]);
  };

  /* ── Clear user data ── */
  const clearUserData = (userId) => {
    const txns = getAllTransactions().filter(t => t.userId !== userId);
    const goals = getAllGoals().filter(g => g.userId !== userId);
    set(KEYS.TRANSACTIONS, txns);
    set(KEYS.GOALS, goals);
  };

  return {
    getUsers, findUserByEmail, createUser,
    getCurrentUser, setCurrentUser, clearCurrentUser,
    getTransactions, addTransaction, updateTransaction, deleteTransaction,
    getGoals, addGoal, updateGoal, deleteGoal,
    getSettings, saveSettings,
    getSummary, getMonthlyData, getCategoryBreakdown,
    seedDemoData, clearUserData,
  };
})();
