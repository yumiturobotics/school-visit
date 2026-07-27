const Auth = (() => {
  function saveSession(user, remember) {
    const session = {
      username: user.username,
      name: user.name,
      role: user.role,
      loginTime: Date.now()
    };
    sessionStorage.setItem(APP_CONFIG.SESSION_KEY, JSON.stringify(session));
    if (remember) {
      localStorage.setItem(APP_CONFIG.SESSION_KEY, JSON.stringify(session));
    }
  }

  function getSession() {
    const data = sessionStorage.getItem(APP_CONFIG.SESSION_KEY) || localStorage.getItem(APP_CONFIG.SESSION_KEY);
    if (!data) return null;
    try {
      const session = JSON.parse(data);
      if (Date.now() - session.loginTime > APP_CONFIG.SESSION_TIMEOUT) {
        clearSession();
        return null;
      }
      return session;
    } catch {
      return null;
    }
  }

  function clearSession() {
    sessionStorage.removeItem(APP_CONFIG.SESSION_KEY);
    localStorage.removeItem(APP_CONFIG.SESSION_KEY);
  }

  function isLoggedIn() {
    return getSession() !== null;
  }

  function getUser() {
    return getSession();
  }

  function isAdmin() {
    const user = getSession();
    return user && user.role === APP_CONFIG.ROLES.ADMIN;
  }

  function isIncharge() {
    const user = getSession();
    return user && user.role === APP_CONFIG.ROLES.INCHARGE;
  }

  function requireLogin() {
    if (!isLoggedIn()) {
      window.location.href = APP_CONFIG.ROUTES.LOGIN;
      return false;
    }
    return true;
  }

  function requireAdmin() {
    if (!isLoggedIn()) {
      window.location.href = APP_CONFIG.ROUTES.LOGIN;
      return false;
    }
    if (!isAdmin()) {
      window.location.href = APP_CONFIG.ROUTES.ADMIN_DASHBOARD;
      return false;
    }
    return true;
  }

  function logout() {
    clearSession();
    window.location.href = APP_CONFIG.ROUTES.LOGIN;
  }

  return { saveSession, getSession, clearSession, isLoggedIn, getUser, isAdmin, isIncharge, requireLogin, requireAdmin, logout };
})();
