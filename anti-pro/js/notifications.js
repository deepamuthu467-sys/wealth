/* ═══════════════════════════════════════════════════════
   WealthWise — Notifications Module
   notifications.js
═══════════════════════════════════════════════════════ */

const Notifications = (() => {
  let reminderInterval = null;

  /* ── Request browser notification permission ── */
  const requestPermission = async () => {
    if (!('Notification' in window)) {
      App.showToast('warn', 'Browser notifications are not supported.');
      return false;
    }
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') {
      App.showToast('warn', 'Notifications blocked. Please enable in browser settings.');
      return false;
    }
    const result = await Notification.requestPermission();
    return result === 'granted';
  };

  /* ── Send a notification ── */
  const send = (title, body, icon = '💰') => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const n = new Notification(title, {
      body,
      icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><circle cx="24" cy="24" r="24" fill="%231a56db"/><text y="32" x="50%" text-anchor="middle" font-size="24">💰</text></svg>',
      badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><circle cx="24" cy="24" r="24" fill="%231a56db"/></svg>',
      tag: 'wealthwise-reminder',
    });
    n.onclick = () => { window.focus(); n.close(); };
  };

  /* ── Enable / Disable reminders ── */
  const enable = async () => {
    const ok = await requestPermission();
    if (!ok) return false;

    Store.saveSettings({ notifications: true });

    // Send welcome notification
    send('WealthWise 🎉', 'Reminders enabled! You\'ll get monthly savings updates.');
    App.showToast('success', '🔔 Monthly reminders enabled!');

    setupSchedule();
    return true;
  };

  const disable = () => {
    Store.saveSettings({ notifications: false });
    if (reminderInterval) {
      clearInterval(reminderInterval);
      reminderInterval = null;
    }
    App.showToast('info', '🔕 Reminders disabled.');
  };

  /* ── Check and set up schedule ── */
  const setupSchedule = () => {
    if (reminderInterval) clearInterval(reminderInterval);

    // Check every hour if it's time for a monthly reminder
    reminderInterval = setInterval(() => {
      const settings = Store.getSettings();
      if (!settings.notifications) return;

      const now = new Date();
      // Send on 1st of each month at 9am
      if (now.getDate() === 1 && now.getHours() === 9) {
        sendMonthlyReminder();
      }
    }, 60 * 60 * 1000); // Every hour
  };

  const sendMonthlyReminder = () => {
    const user = Store.getCurrentUser();
    if (!user) return;

    const monthly = Store.getMonthlyData(user.id, 1);
    const last = monthly[monthly.length - 1];
    const currency = Store.getSettings().currency || '₹';

    if (last) {
      const savRate = last.income > 0 ? Math.round((last.savings / last.income) * 100) : 0;
      send(
        'WealthWise Monthly Report 📊',
        `Last month: Income ${currency}${last.income.toLocaleString('en-IN')}, Expenses ${currency}${last.expense.toLocaleString('en-IN')}, Savings rate ${savRate}%. Keep it up! 💪`
      );
    } else {
      send('WealthWise Reminder 💰', 'Don\'t forget to log this month\'s transactions and review your savings goals!');
    }
  };

  /* ── Send a test notification ── */
  const sendTest = () => {
    const user = Store.getCurrentUser();
    const summary = Store.getSummary(user.id);
    const currency = Store.getSettings().currency || '₹';
    send(
      'WealthWise Test Reminder 🧪',
      `Your current savings: ${currency}${summary.totalSavings.toLocaleString('en-IN')}. Keep growing!`
    );
    App.showToast('info', '🔔 Test notification sent!');
  };

  /* ── Init on boot (restore schedule if enabled) ── */
  const init = () => {
    const settings = Store.getSettings();
    if (settings.notifications && Notification.permission === 'granted') {
      setupSchedule();
      // Show notif dot
      const dot = document.getElementById('notif-dot');
      if (dot) dot.classList.remove('hidden');
    }
  };

  return { requestPermission, send, enable, disable, sendTest, init };
})();
