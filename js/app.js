/* ═══════════════════════════════════════════════════════
   WealthWise — App Router & Core
   app.js
═══════════════════════════════════════════════════════ */

const App = (() => {
  const PAGES = {
    dashboard:    { label: 'Dashboard',        render: () => Dashboard.render()    },
    transactions: { label: 'Transactions',     render: () => Transactions.render() },
    goals:        { label: 'Savings Goals',    render: () => Goals.render()        },
    reports:      { label: 'Reports & AI',     render: () => Reports.render()      },
    settings:     { label: 'Settings',         render: () => Settings.render()     },
  };

  let currentPage = null;
  let chartInstances = [];

  /* ── Boot ── */
  const boot = () => {
    Settings.initTheme();
    updateUserUI();
    Notifications.init();

    // Hash routing
    window.addEventListener('hashchange', handleHashChange);
  };

  /* ── Navigate ── */
  const navigate = (page) => {
    if (!PAGES[page]) page = 'dashboard';
    if (currentPage === page) return;
    currentPage = page;

    // Update URL hash
    history.pushState(null, null, '#' + page);

    // Update nav active state
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.getAttribute('data-page') === page);
    });

    // Update breadcrumb
    const bc = document.getElementById('topbar-breadcrumb');
    if (bc) bc.textContent = PAGES[page].label;

    // Render page
    PAGES[page].render();

    // Close sidebar on mobile
    closeSidebar();

    // Scroll to top
    document.querySelector('.page-container')?.scrollTo(0, 0);
    window.scrollTo(0, 0);
  };

  const handleHashChange = () => {
    const hash = window.location.hash.replace('#', '') || 'dashboard';
    if (PAGES[hash] && hash !== currentPage) {
      navigate(hash);
    }
  };

  /* ── Sidebar ── */
  const openSidebar = () => {
    document.getElementById('sidebar')?.classList.add('open');
    document.getElementById('sidebar-overlay')?.classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  const closeSidebar = () => {
    document.getElementById('sidebar')?.classList.remove('open');
    document.getElementById('sidebar-overlay')?.classList.remove('open');
    document.body.style.overflow = '';
  };

  /* ── Modal ── */
  const openModal = (title, bodyHtml) => {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').innerHTML = bodyHtml;
    document.getElementById('modal-overlay').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    // Focus first input
    setTimeout(() => {
      const first = document.querySelector('#modal-body input:not([type=hidden]):not([disabled])');
      if (first) first.focus();
    }, 100);
  };

  const closeModal = (e) => {
    if (e && e.target !== document.getElementById('modal-overlay')) return;
    document.getElementById('modal-overlay').classList.add('hidden');
    document.getElementById('modal-body').innerHTML = '';
    document.body.style.overflow = '';
  };

  /* ── Add Transaction shortcut ── */
  const openAddTransaction = () => {
    openModal('Add Transaction', Transactions.renderAddForm());
  };

  /* ── Toast ── */
  const showToast = (type, message, duration = 3500) => {
    const icons = { success: '✅', error: '❌', info: 'ℹ️', warn: '⚠️' };
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${icons[type] || 'ℹ️'}</span>
      <span class="toast-message">${message}</span>
      <button class="toast-close" onclick="this.closest('.toast').remove()">✕</button>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      if (toast.parentElement) {
        toast.style.animation = 'toast-out 0.3s ease-out forwards';
        setTimeout(() => toast.remove(), 300);
      }
    }, duration);
  };

  /* ── Update User UI ── */
  const updateUserUI = () => {
    const user = Store.getCurrentUser();
    if (!user) return;
    const initial = (user.name || 'U').charAt(0).toUpperCase();

    const el = (id) => document.getElementById(id);
    if (el('sidebar-username')) el('sidebar-username').textContent = user.name;
    if (el('sidebar-email'))    el('sidebar-email').textContent    = user.email;
    if (el('sidebar-avatar'))   el('sidebar-avatar').textContent   = initial;
    if (el('topbar-avatar'))    el('topbar-avatar').textContent    = initial;
  };

  /* ── Destroy all charts ── */
  const destroyCharts = () => {
    Chart.helpers.each(Chart.instances, (instance) => {
      instance.destroy();
    });
  };

  /* ── Keyboard shortcuts ── */
  document.addEventListener('keydown', (e) => {
    // Escape closes modal
    if (e.key === 'Escape') {
      const overlay = document.getElementById('modal-overlay');
      if (overlay && !overlay.classList.contains('hidden')) {
        overlay.classList.add('hidden');
        document.getElementById('modal-body').innerHTML = '';
        document.body.style.overflow = '';
      }
    }
    // Ctrl+N = new transaction
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
      e.preventDefault();
      const user = Store.getCurrentUser();
      if (user) openAddTransaction();
    }
  });

  /* ── Init ── */
  const init = () => {
    // Show loading screen briefly
    const loading = document.getElementById('loading-screen');
    setTimeout(() => {
      loading?.classList.add('fade-out');
      setTimeout(() => loading?.classList.add('hidden'), 400);
      Auth.init();
    }, 1200);
  };

  // Start app
  window.addEventListener('DOMContentLoaded', init);

  return {
    boot, navigate, openSidebar, closeSidebar,
    openModal, closeModal, openAddTransaction,
    showToast, updateUserUI, destroyCharts,
  };
})();
