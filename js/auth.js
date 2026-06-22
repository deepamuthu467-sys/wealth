/* ═══════════════════════════════════════════════════════
   WealthWise — Auth Module
   auth.js
═══════════════════════════════════════════════════════ */

const Auth = (() => {
  const switchTab = (tab) => {
    const loginForm    = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const tabLogin     = document.getElementById('tab-login');
    const tabReg       = document.getElementById('tab-register');

    if (tab === 'login') {
      loginForm.classList.remove('hidden');
      registerForm.classList.add('hidden');
      tabLogin.classList.add('active');
      tabReg.classList.remove('active');
    } else {
      loginForm.classList.add('hidden');
      registerForm.classList.remove('hidden');
      tabLogin.classList.remove('active');
      tabReg.classList.add('active');
    }
    clearErrors();
  };

  const clearErrors = () => {
    ['login-error', 'register-error'].forEach(id => {
      const el = document.getElementById(id);
      if (el) { el.classList.add('hidden'); el.textContent = ''; }
    });
  };

  const showError = (id, msg) => {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = msg;
      el.classList.remove('hidden');
    }
  };

  const togglePassword = (inputId, btn) => {
    const input = document.getElementById(inputId);
    if (input.type === 'password') {
      input.type = 'text';
      btn.textContent = '🙈';
    } else {
      input.type = 'password';
      btn.textContent = '👁️';
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    clearErrors();
    const email    = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    if (!email || !password) {
      showError('login-error', 'Please fill in all fields.');
      return;
    }

    const user = Store.findUserByEmail(email);
    if (!user) {
      showError('login-error', 'No account found with this email.');
      return;
    }

    if (atob(user.password) !== password) {
      showError('login-error', 'Incorrect password. Please try again.');
      return;
    }

    loginSuccess(user);
  };

  const handleRegister = (e) => {
    e.preventDefault();
    clearErrors();
    const name     = document.getElementById('reg-name').value.trim();
    const email    = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    const confirm  = document.getElementById('reg-confirm').value;

    if (!name || !email || !password || !confirm) {
      showError('register-error', 'Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      showError('register-error', 'Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      showError('register-error', 'Passwords do not match.');
      return;
    }
    if (Store.findUserByEmail(email)) {
      showError('register-error', 'An account with this email already exists.');
      return;
    }

    const user = Store.createUser({ name, email, password });
    loginSuccess(user);
  };

  const demoLogin = () => {
    let user = Store.findUserByEmail('demo@wealthwise.app');
    if (!user) {
      user = Store.createUser({
        name: 'Arjun Sharma',
        email: 'demo@wealthwise.app',
        password: 'demo1234',
      });
    }
    // Seed demo data
    Store.seedDemoData(user.id);
    loginSuccess(user);
  };

  const loginSuccess = (user) => {
    // Save session
    Store.setCurrentUser({ id: user.id, name: user.name, email: user.email });

    // Update settings name/email
    Store.saveSettings({ name: user.name, email: user.email });

    // Transition to app
    document.getElementById('auth-section').classList.add('hidden');
    document.getElementById('app-section').classList.remove('hidden');

    App.boot();
    App.navigate('dashboard');
    App.showToast('success', `Welcome back, ${user.name.split(' ')[0]}! 👋`);
  };

  const logout = () => {
    if (!confirm('Are you sure you want to sign out?')) return;
    Store.clearCurrentUser();
    document.getElementById('app-section').classList.add('hidden');
    document.getElementById('auth-section').classList.remove('hidden');
    switchTab('login');
    // Reset form
    document.getElementById('login-form').reset();
    document.getElementById('register-form').reset();
    clearErrors();
    // Destroy charts
    App.destroyCharts();
  };

  const init = () => {
    const user = Store.getCurrentUser();
    if (user) {
      document.getElementById('auth-section').classList.add('hidden');
      document.getElementById('app-section').classList.remove('hidden');
      App.boot();
      App.navigate('dashboard');
    } else {
      document.getElementById('auth-section').classList.remove('hidden');
    }
  };

  return { switchTab, togglePassword, handleLogin, handleRegister, demoLogin, logout, init };
})();
