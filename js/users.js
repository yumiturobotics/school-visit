let allUsers = [];

document.addEventListener('DOMContentLoaded', async () => {
  if (!Auth.requireAdmin()) return;

  UI.initTheme();
  UI.initSidebar();
  UI.renderUserInfo();
  UI.bindLogout();
  UI.bindTheme();
  UI.setActiveNav('manage-users');

  await loadUsers();
  setupSearch();
  setupModal();
  setupPasswordModal();
});

async function loadUsers() {
  UI.showSpinner('Loading users...');
  try {
    const result = await API.getUsers();
    if (result.status === 'success') {
      allUsers = result.data || [];
      renderUsers(allUsers);
    }
  } catch {
    UI.toast('Could not load users.', 'error');
  } finally {
    UI.hideSpinner();
  }
}

function renderUsers(list) {
  const tbody = document.getElementById('usersTableBody');
  const countEl = document.getElementById('userCount');
  if (countEl) countEl.textContent = list.length + ' user(s)';

  if (list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center py-5"><div class="empty-state"><i class="bi bi-people"></i><p>No users found.</p></div></td></tr>';
    return;
  }

  const loggedUser = Auth.getUser();

  tbody.innerHTML = list.map((u, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>
        <div class="d-flex align-items-center gap-2">
          <div class="user-avatar" style="width:32px;height:32px;font-size:0.8rem;">${Utils.initials(u.name)}</div>
          <div>
            <div class="fw-600 fs-sm">${Utils.escapeHtml(u.name)}</div>
            <div class="fs-xs text-muted">@${Utils.escapeHtml(u.username)}</div>
          </div>
        </div>
      </td>
      <td><span class="badge-role ${u.role === 'Admin' ? 'badge-admin' : 'badge-incharge'}">${Utils.escapeHtml(u.role)}</span></td>
      <td><span class="badge-role ${u.status === 'Active' ? 'badge-active' : 'badge-inactive'}">${Utils.escapeHtml(u.status)}</span></td>
      <td>
        <button class="btn btn-sm btn-outline-primary me-1" onclick="openEditUser('${Utils.escapeHtml(u.username)}')" title="Edit"><i class="bi bi-pencil"></i></button>
        <button class="btn btn-sm btn-outline-secondary me-1" onclick="openResetPassword('${Utils.escapeHtml(u.username)}','${Utils.escapeHtml(u.name)}')" title="Reset Password"><i class="bi bi-key"></i></button>
        ${u.username !== loggedUser.username ? `
          <button class="btn btn-sm btn-outline-${u.status === 'Active' ? 'warning' : 'success'} me-1" onclick="toggleUser('${Utils.escapeHtml(u.username)}','${Utils.escapeHtml(u.status)}')" title="${u.status === 'Active' ? 'Disable' : 'Enable'}">
            <i class="bi bi-${u.status === 'Active' ? 'slash-circle' : 'check-circle'}"></i>
          </button>
          <button class="btn btn-sm btn-outline-danger" onclick="deleteUser('${Utils.escapeHtml(u.username)}','${Utils.escapeHtml(u.name)}')" title="Delete"><i class="bi bi-trash"></i></button>
        ` : '<span class="fs-xs text-muted">(You)</span>'}
      </td>
    </tr>`).join('');
}

function setupSearch() {
  const input = document.getElementById('searchUser');
  if (!input) return;
  input.addEventListener('input', Utils.debounce(() => {
    const q = input.value.toLowerCase();
    renderUsers(allUsers.filter(u => u.name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q) || u.role.toLowerCase().includes(q)));
  }, 250));
}

function setupModal() {
  const addBtn = document.getElementById('addUserBtn');
  const saveBtn = document.getElementById('saveUserBtn');
  const form = document.getElementById('userForm');

  addBtn.addEventListener('click', () => {
    document.getElementById('userModalTitle').textContent = 'Add User';
    document.getElementById('editUsername').value = '';
    form.reset();
    document.getElementById('usernameField').disabled = false;
    document.getElementById('passwordGroup').classList.remove('d-none');
    Utils.clearValidation(form);
    new bootstrap.Modal(document.getElementById('userModal')).show();
  });

  saveBtn.addEventListener('click', async () => {
    const editUsername = document.getElementById('editUsername').value;
    const isEdit = !!editUsername;

    const fields = [
      { el: document.getElementById('userName'), rule: v => v.length >= 2, msg: 'Name must be at least 2 characters.' },
      { el: document.getElementById('userUsername'), rule: v => /^[a-zA-Z0-9_]{2,20}$/.test(v), msg: 'Username must be 2-20 alphanumeric characters.' },
      { el: document.getElementById('userRole'), rule: v => !!v, msg: 'Please select a role.' }
    ];
    if (!isEdit) {
      fields.push({ el: document.getElementById('userPassword'), rule: v => v.length >= 3, msg: 'Password must be at least 3 characters.' });
    }

    if (!Utils.validateForm(fields)) return;

    const payload = {
      name: document.getElementById('userName').value.trim(),
      username: document.getElementById('userUsername').value.trim(),
      role: document.getElementById('userRole').value,
      status: document.getElementById('userStatus').value,
      password: document.getElementById('userPassword').value.trim()
    };
    if (isEdit) payload.editUsername = editUsername;

    UI.showSpinner('Saving user...');
    try {
      const result = isEdit ? await API.updateUser(payload) : await API.addUser(payload);
      if (result.status === 'success') {
        UI.toast(isEdit ? 'User updated.' : 'User added.', 'success');
        bootstrap.Modal.getInstance(document.getElementById('userModal')).hide();
        await loadUsers();
      } else {
        UI.toast(result.message || 'Failed to save user.', 'error');
      }
    } catch (err) {
      UI.toast('Error: ' + err.message, 'error');
    } finally {
      UI.hideSpinner();
    }
  });
}

function openEditUser(username) {
  const user = allUsers.find(u => u.username === username);
  if (!user) return;
  document.getElementById('userModalTitle').textContent = 'Edit User';
  document.getElementById('editUsername').value = user.username;
  document.getElementById('userName').value = user.name;
  document.getElementById('userUsername').value = user.username;
  document.getElementById('userRole').value = user.role;
  document.getElementById('userStatus').value = user.status;
  document.getElementById('userPassword').value = '';
  document.getElementById('usernameField').disabled = true;
  document.getElementById('passwordGroup').classList.add('d-none');
  Utils.clearValidation(document.getElementById('userForm'));
  new bootstrap.Modal(document.getElementById('userModal')).show();
}

function setupPasswordModal() {
  const saveBtn = document.getElementById('savePasswordBtn');
  saveBtn.addEventListener('click', async () => {
    const username = document.getElementById('resetUsername').value;
    const newPass = document.getElementById('newPassword').value.trim();
    const confirmPass = document.getElementById('confirmPassword').value.trim();

    if (newPass.length < 3) { UI.toast('Password must be at least 3 characters.', 'warning'); return; }
    if (newPass !== confirmPass) { UI.toast('Passwords do not match.', 'warning'); return; }

    UI.showSpinner('Resetting password...');
    try {
      const result = await API.resetPassword(username, newPass);
      if (result.status === 'success') {
        UI.toast('Password reset successfully.', 'success');
        bootstrap.Modal.getInstance(document.getElementById('passwordModal')).hide();
      } else {
        UI.toast(result.message || 'Failed to reset password.', 'error');
      }
    } catch (err) {
      UI.toast('Error: ' + err.message, 'error');
    } finally {
      UI.hideSpinner();
    }
  });
}

function openResetPassword(username, name) {
  document.getElementById('resetUsername').value = username;
  document.getElementById('resetUserLabel').textContent = 'Reset password for: ' + name;
  document.getElementById('newPassword').value = '';
  document.getElementById('confirmPassword').value = '';
  new bootstrap.Modal(document.getElementById('passwordModal')).show();
}

async function toggleUser(username, currentStatus) {
  const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
  const confirmed = await UI.confirmDialog(`${newStatus === 'Inactive' ? 'Disable' : 'Enable'} user "${username}"?`);
  if (!confirmed) return;
  UI.showSpinner('Updating...');
  try {
    const result = await API.toggleUser(username, newStatus);
    if (result.status === 'success') {
      UI.toast('User status updated.', 'success');
      await loadUsers();
    } else {
      UI.toast(result.message || 'Failed to update.', 'error');
    }
  } catch (err) {
    UI.toast('Error: ' + err.message, 'error');
  } finally {
    UI.hideSpinner();
  }
}

async function deleteUser(username, name) {
  const confirmed = await UI.confirmDialog(`Delete user "${name}"? This cannot be undone.`);
  if (!confirmed) return;
  UI.showSpinner('Deleting...');
  try {
    const result = await API.deleteUser(username);
    if (result.status === 'success') {
      UI.toast('User deleted.', 'success');
      await loadUsers();
    } else {
      UI.toast(result.message || 'Failed to delete.', 'error');
    }
  } catch (err) {
    UI.toast('Error: ' + err.message, 'error');
  } finally {
    UI.hideSpinner();
  }
}
