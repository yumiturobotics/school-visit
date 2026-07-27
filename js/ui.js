const UI = (() => {
  const spinner = document.getElementById('spinnerOverlay');
  const toastContainer = document.getElementById('toastContainer');

  function showSpinner(msg) {
    if (!spinner) return;
    const txt = spinner.querySelector('p');
    if (txt) txt.textContent = msg || 'Please wait...';
    spinner.classList.add('active');
  }

  function hideSpinner() {
    if (spinner) spinner.classList.remove('active');
  }

  function toast(message, type = 'info') {
    if (!toastContainer) return;
    const icons = { success: 'bi-check-circle-fill', error: 'bi-x-circle-fill', warning: 'bi-exclamation-triangle-fill', info: 'bi-info-circle-fill' };
    const t = document.createElement('div');
    t.className = 'toast-item ' + type;
    t.innerHTML = `<i class="bi ${icons[type] || icons.info}"></i><span class="toast-msg">${Utils.escapeHtml(message)}</span>`;
    toastContainer.appendChild(t);
    setTimeout(() => t.remove(), 4000);
  }

  function initTheme() {
    const saved = localStorage.getItem(APP_CONFIG.THEME_KEY) || 'light';
    document.documentElement.setAttribute('data-theme', saved);
    updateThemeIcon(saved);
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem(APP_CONFIG.THEME_KEY, next);
    updateThemeIcon(next);
  }

  function updateThemeIcon(theme) {
    const btn = document.getElementById('themeToggle');
    if (!btn) return;
    btn.innerHTML = theme === 'dark' ? '<i class="bi bi-sun-fill"></i>' : '<i class="bi bi-moon-fill"></i>';
    btn.title = theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode';
  }

  function initSidebar() {
    const toggle = document.getElementById('sidebarToggle');
    const overlay = document.getElementById('sidebar-overlay');
    const sidebar = document.getElementById('appSidebar');
    if (!toggle || !sidebar) return;

    toggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      if (overlay) overlay.classList.toggle('active');
    });

    if (overlay) {
      overlay.addEventListener('click', () => {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
      });
    }
  }

  function setActiveNav(page) {
    document.querySelectorAll('.sidebar-nav .nav-link, .bnav-item').forEach(link => {
      link.classList.remove('active');
      const href = link.getAttribute('href') || link.dataset.page;
      if (href && href.includes(page)) link.classList.add('active');
    });
  }

  function renderUserInfo() {
    const user = Auth.getUser();
    if (!user) return;
    document.querySelectorAll('.sidebar-username').forEach(el => el.textContent = user.name);
    document.querySelectorAll('.sidebar-role').forEach(el => el.textContent = user.role);
    document.querySelectorAll('.sidebar-avatar').forEach(el => el.textContent = Utils.initials(user.name));
    document.querySelectorAll('.user-display-name').forEach(el => el.textContent = user.name);
    const isAdmin = user.role === APP_CONFIG.ROLES.ADMIN;
    document.querySelectorAll('.admin-only').forEach(el => el.classList.toggle('d-none', !isAdmin));
    document.querySelectorAll('.incharge-only').forEach(el => el.classList.toggle('d-none', isAdmin));
  }

  function confirmDialog(message) {
    return new Promise(resolve => {
      const modal = document.getElementById('confirmModal');
      if (!modal) { resolve(window.confirm(message)); return; }
      document.getElementById('confirmMessage').textContent = message;
      const bsModal = new bootstrap.Modal(modal);
      bsModal.show();
      document.getElementById('confirmYesBtn').onclick = () => { bsModal.hide(); resolve(true); };
      document.getElementById('confirmNoBtn').onclick = () => { bsModal.hide(); resolve(false); };
    });
  }

  function bindLogout() {
    document.querySelectorAll('.logout-btn').forEach(btn => {
      btn.addEventListener('click', e => { e.preventDefault(); Auth.logout(); });
    });
  }

  function bindTheme() {
    const btn = document.getElementById('themeToggle');
    if (btn) btn.addEventListener('click', toggleTheme);
  }

  return { showSpinner, hideSpinner, toast, initTheme, toggleTheme, initSidebar, setActiveNav, renderUserInfo, confirmDialog, bindLogout, bindTheme };
})();
