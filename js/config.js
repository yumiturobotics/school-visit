const APP_CONFIG = {
  SCRIPT_URL:
    "https://script.google.com/macros/s/AKfycbzgcjWoxIR24tfrlM-wwS9Q-qnpYKGjUvHC3-99XgYDybgwBXshrrvgMKvwvUI_WIAH/exec",
  APP_NAME: "School Visit Management System",
  ORG_NAME: "Village Technology School",
  VERSION: "1.0.0",
  SESSION_KEY: "svms_session",
  THEME_KEY: "svms_theme",
  SESSION_TIMEOUT: 8 * 60 * 60 * 1000,
  MAX_PHOTO_SIZE_MB: 2,
  MAX_PHOTOS: 10,
  ROLES: {
    ADMIN: "Admin",
    INCHARGE: "Incharge",
  },
  ROUTES: {
    LOGIN: "index.html",
    ADMIN_DASHBOARD: "dashboard.html",
    INCHARGE_DASHBOARD: "dashboard.html",
    NEW_VISIT: "new-visit.html",
    MY_VISITS: "my-visits.html",
    MANAGE_SCHOOLS: "manage-schools.html",
    MANAGE_USERS: "manage-users.html",
    REPORTS: "reports.html",
    PROFILE: "profile.html",
  },
};
