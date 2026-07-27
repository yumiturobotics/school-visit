document.addEventListener('DOMContentLoaded', () => {
  if (Auth.isLoggedIn()) {
    const user = Auth.getUser();
    window.location.href = APP_CONFIG.ROUTES.ADMIN_DASHBOARD;
    return;
  }

  UI.initTheme();

  const form = document.getElementById('loginForm');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const rememberInput = document.getElementById('remember');
  const toggleEye = document.getElementById('togglePassword');
  const loginBtn = document.getElementById('loginBtn');
  const errorAlert = document.getElementById('loginError');

  const savedUser = localStorage.getItem('svms_remember_user');
  if (savedUser) {
    usernameInput.value = savedUser;
    rememberInput.checked = true;
  }

  toggleEye.addEventListener('click', () => {
    const type = passwordInput.type === 'password' ? 'text' : 'password';
    passwordInput.type = type;
    toggleEye.innerHTML = type === 'text' ? '<i class="bi bi-eye-slash"></i>' : '<i class="bi bi-eye"></i>';
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorAlert.classList.add('d-none');

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!username || !password) {
      showError('Please enter your username and password.');
      return;
    }

    loginBtn.disabled = true;
    loginBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Signing in...';

    try {
      const result = await API.login(username, password);
      if (result.status === 'success') {
        const user = result.data;
        Auth.saveSession(user, rememberInput.checked);
        if (rememberInput.checked) {
          localStorage.setItem('svms_remember_user', username);
        } else {
          localStorage.removeItem('svms_remember_user');
        }
        window.location.href = APP_CONFIG.ROUTES.ADMIN_DASHBOARD;
      } else {
        showError(result.message || 'Invalid username or password.');
      }
    } catch (err) {
      showError('Could not connect. Please check your internet or configuration.');
    } finally {
      loginBtn.disabled = false;
      loginBtn.innerHTML = '<i class="bi bi-box-arrow-in-right me-2"></i>Sign In';
    }
  });

  function showError(msg) {
    errorAlert.textContent = msg;
    errorAlert.classList.remove('d-none');
  }

  const themeBtn = document.getElementById('themeToggleLogin');
  if (themeBtn) themeBtn.addEventListener('click', () => UI.toggleTheme());
});
