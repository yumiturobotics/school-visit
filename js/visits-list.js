let allVisits = [];
let filteredVisits = [];
let currentPage = 1;
const PAGE_SIZE = 15;

document.addEventListener('DOMContentLoaded', async () => {
  if (!Auth.requireLogin()) return;

  UI.initTheme();
  UI.initSidebar();
  UI.renderUserInfo();
  UI.bindLogout();
  UI.bindTheme();
  UI.setActiveNav('my-visits');

  await loadSchoolFilter();
  await loadVisits();
  setupFilters();
});

async function loadSchoolFilter() {
  const sel = document.getElementById('filterSchool');
  if (!sel) return;
  try {
    const result = await API.getSchools();
    if (result.status === 'success') {
      const opts = result.data.map(s => `<option value="${Utils.escapeHtml(s.name)}">${Utils.escapeHtml(s.name)}</option>`).join('');
      sel.innerHTML = '<option value="">All Schools</option>' + opts;
    }
  } catch {}
}

async function loadVisits() {
  UI.showSpinner('Loading visits...');
  const user = Auth.getUser();
  try {
    const params = Auth.isAdmin() ? { role: user.role } : { username: user.username, role: user.role };
    const result = await API.getVisits(params);
    if (result.status === 'success') {
      allVisits = result.data || [];
      filteredVisits = [...allVisits];
      currentPage = 1;
      renderTable();
    } else {
      UI.toast('Could not load visits.', 'error');
    }
  } catch (err) {
    UI.toast('Error: ' + err.message, 'error');
  } finally {
    UI.hideSpinner();
  }
}

function setupFilters() {
  const search = document.getElementById('searchInput');
  const dateFrom = document.getElementById('filterDateFrom');
  const dateTo = document.getElementById('filterDateTo');
  const school = document.getElementById('filterSchool');
  const clearBtn = document.getElementById('clearFiltersBtn');

  const applyFilters = Utils.debounce(() => {
    const q = search ? search.value.toLowerCase() : '';
    const from = dateFrom ? dateFrom.value : '';
    const to = dateTo ? dateTo.value : '';
    const sc = school ? school.value : '';

    filteredVisits = allVisits.filter(v => {
      const matchQ = !q || v.school.toLowerCase().includes(q) || (v.username || '').toLowerCase().includes(q) || (v.topicsCovered || '').toLowerCase().includes(q);
      const matchFrom = !from || v.visitDate >= from;
      const matchTo = !to || v.visitDate <= to;
      const matchSc = !sc || v.school === sc;
      return matchQ && matchFrom && matchTo && matchSc;
    });

    currentPage = 1;
    renderTable();
  }, 300);

  if (search) search.addEventListener('input', applyFilters);
  if (dateFrom) dateFrom.addEventListener('change', applyFilters);
  if (dateTo) dateTo.addEventListener('change', applyFilters);
  if (school) school.addEventListener('change', applyFilters);

  if (clearBtn) clearBtn.addEventListener('click', () => {
    if (search) search.value = '';
    if (dateFrom) dateFrom.value = '';
    if (dateTo) dateTo.value = '';
    if (school) school.value = '';
    filteredVisits = [...allVisits];
    currentPage = 1;
    renderTable();
  });
}

function renderTable() {
  const tbody = document.getElementById('visitsTableBody');
  const countEl = document.getElementById('visitsCount');
  if (!tbody) return;

  const isAdmin = Auth.isAdmin();
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageData = filteredVisits.slice(start, start + PAGE_SIZE);

  if (countEl) countEl.textContent = filteredVisits.length + ' visit(s) found';

  if (pageData.length === 0) {
    tbody.innerHTML = `<tr><td colspan="${isAdmin ? 8 : 7}" class="text-center py-5">
      <div class="empty-state"><i class="bi bi-journal-x"></i><p>No visits found.</p></div></td></tr>`;
    renderPagination();
    return;
  }

  tbody.innerHTML = pageData.map((v, i) => `
    <tr>
      <td class="fs-xs text-muted">${start + i + 1}</td>
      <td>${Utils.formatDate(v.visitDate)}</td>
      <td><strong>${Utils.escapeHtml(v.school)}</strong></td>
      ${isAdmin ? `<td class="fs-xs">${Utils.escapeHtml(v.username)}</td>` : ''}
      <td>${Utils.escapeHtml(v.students)}</td>
      <td class="fs-xs" style="max-width:140px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${Utils.escapeHtml(v.topicsCovered)}</td>
      <td>${renderPhotoLinks(v.photoLinks)}</td>
      <td>
        <button class="btn btn-sm btn-outline-primary me-1" onclick="viewVisit('${Utils.escapeHtml(v.entryID)}')" title="View"><i class="bi bi-eye"></i></button>
        <button class="btn btn-sm btn-outline-secondary me-1" onclick="editVisit('${Utils.escapeHtml(v.entryID)}')" title="Edit"><i class="bi bi-pencil"></i></button>
        <button class="btn btn-sm btn-outline-danger" onclick="deleteVisit('${Utils.escapeHtml(v.entryID)}')" title="Delete"><i class="bi bi-trash"></i></button>
      </td>
    </tr>`).join('');

  renderPagination();
}

function renderPhotoLinks(links) {
  if (!links) return '<span class="text-muted fs-xs">None</span>';
  const parts = links.split(',').filter(l => l.trim());
  if (parts.length === 0) return '<span class="text-muted fs-xs">None</span>';
  return parts.map((l, i) => `<a href="${l.trim()}" target="_blank" class="btn btn-sm btn-outline-secondary me-1"><i class="bi bi-image"></i> ${i + 1}</a>`).join('');
}

function renderPagination() {
  const container = document.getElementById('pagination');
  if (!container) return;
  const total = Math.ceil(filteredVisits.length / PAGE_SIZE);
  if (total <= 1) { container.innerHTML = ''; return; }
  let html = '<nav><ul class="pagination pagination-sm mb-0 flex-wrap">';
  html += `<li class="page-item ${currentPage === 1 ? 'disabled' : ''}"><a class="page-link" href="#" onclick="goPage(${currentPage - 1})">Prev</a></li>`;
  for (let i = 1; i <= total; i++) {
    html += `<li class="page-item ${i === currentPage ? 'active' : ''}"><a class="page-link" href="#" onclick="goPage(${i})">${i}</a></li>`;
  }
  html += `<li class="page-item ${currentPage === total ? 'disabled' : ''}"><a class="page-link" href="#" onclick="goPage(${currentPage + 1})">Next</a></li>`;
  html += '</ul></nav>';
  container.innerHTML = html;
}

function goPage(page) {
  const total = Math.ceil(filteredVisits.length / PAGE_SIZE);
  if (page < 1 || page > total) return;
  currentPage = page;
  renderTable();
}

function editVisit(id) {
  window.location.href = 'new-visit.html?edit=' + id;
}

function viewVisit(id) {
  const visit = allVisits.find(v => v.entryID === id);
  if (!visit) return;
  const modal = document.getElementById('viewModal');
  document.getElementById('viewSchool').textContent = visit.school;
  document.getElementById('viewDate').textContent = Utils.formatDate(visit.visitDate);
  document.getElementById('viewStudents').textContent = visit.students;
  document.getElementById('viewTopics').textContent = visit.topicsCovered;
  document.getElementById('viewRemarks').textContent = visit.remarks || 'None';
  document.getElementById('viewUser').textContent = visit.username;
  document.getElementById('viewTimestamp').textContent = Utils.formatDateTime(visit.timestamp);
  const links = (visit.photoLinks || '').split(',').filter(l => l.trim());
  document.getElementById('viewPhotos').innerHTML = links.length > 0
    ? links.map((l, i) => `<a href="${l.trim()}" target="_blank" class="btn btn-sm btn-outline-primary me-1 mb-1"><i class="bi bi-image me-1"></i>Photo ${i + 1}</a>`).join('')
    : '<span class="text-muted">No photos</span>';
  new bootstrap.Modal(modal).show();
}

async function deleteVisit(id) {
  const confirmed = await UI.confirmDialog('Are you sure you want to delete this visit? This cannot be undone.');
  if (!confirmed) return;
  UI.showSpinner('Deleting visit...');
  try {
    const result = await API.deleteVisit(id);
    if (result.status === 'success') {
      allVisits = allVisits.filter(v => v.entryID !== id);
      filteredVisits = filteredVisits.filter(v => v.entryID !== id);
      renderTable();
      UI.toast('Visit deleted.', 'success');
    } else {
      UI.toast(result.message || 'Failed to delete.', 'error');
    }
  } catch (err) {
    UI.toast('Error: ' + err.message, 'error');
  } finally {
    UI.hideSpinner();
  }
}
