const Utils = (() => {
  function formatDate(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function formatDateTime(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  function todayISO() {
    const d = new Date();
    return d.toISOString().split('T')[0];
  }

  function todayDisplay() {
    return new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }

  function monthName(num) {
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    return months[parseInt(num) - 1] || '';
  }

  function generateID() {
    return 'V' + Date.now() + Math.floor(Math.random() * 1000);
  }

  function initials(name) {
    if (!name) return '?';
    return name.trim().split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function debounce(fn, delay) {
    let timer;
    return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); };
  }

  function compressImage(file, maxMB) {
    return new Promise(resolve => {
      const maxBytes = maxMB * 1024 * 1024;
      if (file.size <= maxBytes) { resolve(file); return; }
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        const ratio = Math.sqrt(maxBytes / file.size);
        width = Math.floor(width * ratio);
        height = Math.floor(height * ratio);
        canvas.width = width; canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        canvas.toBlob(blob => {
          URL.revokeObjectURL(url);
          resolve(new File([blob], file.name, { type: file.type }));
        }, file.type, 0.85);
      };
      img.src = url;
    });
  }

  function getMonthYear() {
    const d = new Date();
    return { month: d.getMonth() + 1, year: d.getFullYear() };
  }

  function numberFormat(n) {
    return parseInt(n || 0).toLocaleString('en-IN');
  }

  function validateForm(fields) {
    let valid = true;
    fields.forEach(({ el, rule, msg }) => {
      const val = el.value.trim();
      const errId = el.id + '_err';
      let errEl = document.getElementById(errId);
      if (!errEl) {
        errEl = document.createElement('div');
        errEl.id = errId;
        errEl.className = 'invalid-feedback d-block';
        el.parentNode.appendChild(errEl);
      }
      if (!rule(val)) {
        el.classList.add('is-invalid');
        errEl.textContent = msg;
        valid = false;
      } else {
        el.classList.remove('is-invalid');
        errEl.textContent = '';
      }
    });
    return valid;
  }

  function clearValidation(formEl) {
    formEl.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
    formEl.querySelectorAll('.invalid-feedback').forEach(el => el.textContent = '');
  }

  return { formatDate, formatDateTime, todayISO, todayDisplay, monthName, generateID, initials, escapeHtml, debounce, compressImage, getMonthYear, numberFormat, validateForm, clearValidation };
})();
