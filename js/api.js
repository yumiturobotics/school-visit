const API = (() => {
  const BASE = APP_CONFIG.SCRIPT_URL;

  async function request(action, params = {}) {
    const url = new URL(BASE);
    url.searchParams.set('action', action);
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) url.searchParams.set(k, v);
    });
    const response = await fetch(url.toString());
    if (!response.ok) throw new Error('Network error: ' + response.status);
    const data = await response.json();
    if (data.status === 'error') throw new Error(data.message || 'Server error');
    return data;
  }

  async function post(action, payload = {}) {
    const body = new FormData();
    body.append('action', action);
    Object.entries(payload).forEach(([k, v]) => {
      if (v !== undefined && v !== null) body.append(k, v);
    });
    const response = await fetch(BASE, { method: 'POST', body });
    if (!response.ok) throw new Error('Network error: ' + response.status);
    const data = await response.json();
    if (data.status === 'error') throw new Error(data.message || 'Server error');
    return data;
  }

  async function postWithFiles(action, payload = {}, photos = []) {
    const body = new FormData();
    body.append('action', action);
    Object.entries(payload).forEach(([k, v]) => {
      if (v !== undefined && v !== null) body.append(k, typeof v === 'object' ? JSON.stringify(v) : v);
    });
    for (let i = 0; i < photos.length; i++) {
      const compressed = await Utils.compressImage(photos[i], APP_CONFIG.MAX_PHOTO_SIZE_MB);
      const reader = new FileReader();
      const base64 = await new Promise(resolve => {
        reader.onload = e => resolve(e.target.result.split(',')[1]);
        reader.readAsDataURL(compressed);
      });
      body.append('photo_' + i, base64);
      body.append('photo_name_' + i, photos[i].name);
      body.append('photo_type_' + i, photos[i].type);
    }
    body.append('photo_count', photos.length);
    const response = await fetch(BASE, { method: 'POST', body });
    if (!response.ok) throw new Error('Network error: ' + response.status);
    const data = await response.json();
    if (data.status === 'error') throw new Error(data.message || 'Server error');
    return data;
  }

  return {
    login: (username, password) => request('login', { username, password }),
    getDashboardStats: (username, role) => request('getDashboardStats', { username, role }),
    getRecentVisits: (username, role) => request('getRecentVisits', { username, role }),
    getSchools: () => request('getSchools'),
    addSchool: (name) => post('addSchool', { name }),
    updateSchool: (id, name, status) => post('updateSchool', { id, name, status }),
    deleteSchool: (id) => post('deleteSchool', { id }),
    getUsers: () => request('getUsers'),
    addUser: (data) => post('addUser', data),
    updateUser: (data) => post('updateUser', data),
    resetPassword: (username, password) => post('resetPassword', { username, password }),
    toggleUser: (username, status) => post('toggleUser', { username, status }),
    deleteUser: (username) => post('deleteUser', { username }),
    submitVisit: (data, photos) => postWithFiles('submitVisit', data, photos),
    updateVisit: (data) => post('updateVisit', data),
    deleteVisit: (id) => post('deleteVisit', { id }),
    getVisits: (params) => request('getVisits', params),
    getReports: (params) => request('getReports', params),
    changePassword: (username, current, newPass) => post('changePassword', { username, current, newPass })
  };
})();
