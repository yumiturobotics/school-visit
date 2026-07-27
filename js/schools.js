let allSchools = [];

document.addEventListener('DOMContentLoaded', async () => {
  if (!Auth.requireAdmin()) return;

  UI.initTheme();
  UI.initSidebar();
  UI.renderUserInfo();
  UI.bindLogout();
  UI.bindTheme();
  UI.setActiveNav('manage-schools');

  await loadSchools();
  setupSearch();
  setupModal();
});

async function loadSchools() {
  UI.showSpinner('Loading schools...');
  try {
    const result = await API.getSchools();
    if (result.status === 'success') {
      allSchools = result.data || [];
      renderSchools(allSchools);
    }
  } catch {
    UI.toast('Could not load schools.', 'error');
  } finally {
    UI.hideSpinner();
  }
}

function renderSchools(list) {
  const tbody = document.getElementById('schoolsTableBody');
  const countEl = document.getElementById('schoolCount');
  if (countEl) countEl.textContent = list.length + ' school(s)';

  if (list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="text-center py-5"><div class="empty-state"><i class="bi bi-building"></i><p>No schools found.</p></div></td></tr>';
    return;
  }

  tbody.innerHTML = list.map((s, i) => `
    <tr>
      <td>${i + 1}</td>
      <td><strong>${Utils.escapeHtml(s.name)}</strong></td>
      <td><span class="badge-role ${s.status === 'Active' ? 'badge-active' : 'badge-inactive'}">${Utils.escapeHtml(s.status)}</span></td>
      <td>
        <button class="btn btn-sm btn-outline-primary me-1" onclick="openEditSchool('${Utils.escapeHtml(s.id)}','${Utils.escapeHtml(s.name)}','${Utils.escapeHtml(s.status)}')" title="Edit"><i class="bi bi-pencil"></i></button>
        <button class="btn btn-sm btn-outline-${s.status === 'Active' ? 'warning' : 'success'} me-1" onclick="toggleSchoolStatus('${Utils.escapeHtml(s.id)}','${Utils.escapeHtml(s.name)}','${Utils.escapeHtml(s.status)}')" title="${s.status === 'Active' ? 'Disable' : 'Enable'}">
          <i class="bi bi-${s.status === 'Active' ? 'slash-circle' : 'check-circle'}"></i>
        </button>
        <button class="btn btn-sm btn-outline-danger" onclick="deleteSchool('${Utils.escapeHtml(s.id)}','${Utils.escapeHtml(s.name)}')" title="Delete"><i class="bi bi-trash"></i></button>
      </td>
    </tr>`).join('');
}

function setupSearch() {
  const input = document.getElementById('searchSchool');
  if (!input) return;
  input.addEventListener('input', Utils.debounce(() => {
    const q = input.value.toLowerCase();
    renderSchools(allSchools.filter(s => s.name.toLowerCase().includes(q)));
  }, 250));
}

function setupModal() {
  const form = document.getElementById('schoolForm');
  const saveBtn = document.getElementById('saveSchoolBtn');
  const addBtn = document.getElementById('addSchoolBtn');

  addBtn.addEventListener('click', () => {
    document.getElementById('schoolModalTitle').textContent = 'Add School';
    document.getElementById('schoolID').value = '';
    document.getElementById('schoolName').value = '';
    document.getElementById('schoolStatus').value = 'Active';
    Utils.clearValidation(form);
    new bootstrap.Modal(document.getElementById('schoolModal')).show();
  });

  saveBtn.addEventListener('click', async () => {
    const id = document.getElementById('schoolID').value;
    const name = document.getElementById('schoolName').value.trim();
    const status = document.getElementById('schoolStatus').value;

    const valid = Utils.validateForm([{ el: document.getElementById('schoolName'), rule: v => v.length >= 2, msg: 'School name must be at least 2 characters.' }]);
    if (!valid) return;

    UI.showSpinner('Saving school...');
    try {
      let result;
      if (id) {
        result = await API.updateSchool(id, name, status);
      } else {
        const duplicate = allSchools.find(s => s.name.toLowerCase() === name.toLowerCase());
        if (duplicate) { UI.toast('A school with this name already exists.', 'warning'); return; }
        result = await API.addSchool(name);
      }

      if (result.status === 'success') {
        UI.toast(id ? 'School updated.' : 'School added.', 'success');
        bootstrap.Modal.getInstance(document.getElementById('schoolModal')).hide();
        await loadSchools();
      } else {
        UI.toast(result.message || 'Failed to save school.', 'error');
      }
    } catch (err) {
      UI.toast('Error: ' + err.message, 'error');
    } finally {
      UI.hideSpinner();
    }
  });
}

function openEditSchool(id, name, status) {
  document.getElementById('schoolModalTitle').textContent = 'Edit School';
  document.getElementById('schoolID').value = id;
  document.getElementById('schoolName').value = name;
  document.getElementById('schoolStatus').value = status;
  new bootstrap.Modal(document.getElementById('schoolModal')).show();
}

async function toggleSchoolStatus(id, name, currentStatus) {
  const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
  const confirmed = await UI.confirmDialog(`${newStatus === 'Inactive' ? 'Disable' : 'Enable'} "${name}"?`);
  if (!confirmed) return;
  UI.showSpinner('Updating...');
  try {
    const result = await API.updateSchool(id, name, newStatus);
    if (result.status === 'success') {
      UI.toast('School status updated.', 'success');
      await loadSchools();
    } else {
      UI.toast(result.message || 'Failed to update.', 'error');
    }
  } catch (err) {
    UI.toast('Error: ' + err.message, 'error');
  } finally {
    UI.hideSpinner();
  }
}

async function deleteSchool(id, name) {
  const confirmed = await UI.confirmDialog(`Delete school "${name}"? This cannot be undone.`);
  if (!confirmed) return;
  UI.showSpinner('Deleting...');
  try {
    const result = await API.deleteSchool(id);
    if (result.status === 'success') {
      UI.toast('School deleted.', 'success');
      await loadSchools();
    } else {
      UI.toast(result.message || 'Failed to delete.', 'error');
    }
  } catch (err) {
    UI.toast('Error: ' + err.message, 'error');
  } finally {
    UI.hideSpinner();
  }
}
