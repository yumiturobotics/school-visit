document.addEventListener('DOMContentLoaded', () => {
  if (!Auth.requireLogin()) return;

  UI.initTheme();
  UI.initSidebar();
  UI.renderUserInfo();
  UI.bindLogout();
  UI.bindTheme();
  UI.setActiveNav('profile');

  const user = Auth.getUser();
  renderProfile(user);
  setupPasswordForm(user);
});

function renderProfile(user) {
  document.getElementById('profileAvatar').textContent = Utils.initials(user.name);
  document.getElementById('profileName').textContent = user.name;
  document.getElementById('profileUsername').textContent = '@' + user.username;
  document.getElementById('profileRole').textContent = user.role;
  document.getElementById('displayName').value = user.name;
  document.getElementById('displayUsername').value = user.username;
  document.getElementById('displayRole').value = user.role;
}

function setupPasswordForm(user) {
  const form = document.getElementById('changePasswordForm');
  const saveBtn = document.getElementById('savePasswordBtn');

  const toggleIds = ['toggleCurrent', 'toggleNew', 'toggleConfirm'];
  const inputIds = ['currentPassword', 'newPassword', 'confirmPassword'];

  toggleIds.forEach((tid, i) => {
    const btn = document.getElementById(tid);
    const inp = document.getElementById(inputIds[i]);
    if (btn && inp) {
      btn.addEventListener('click', () => {
        const type = inp.type === 'password' ? 'text' : 'password';
        inp.type = type;
        btn.innerHTML = type === 'text' ? '<i class="bi bi-eye-slash"></i>' : '<i class="bi bi-eye"></i>';
      });
    }
  });

  saveBtn.addEventListener('click', async () => {
    const current = document.getElementById('currentPassword').value.trim();
    const newPass = document.getElementById('newPassword').value.trim();
    const confirm = document.getElementById('confirmPassword').value.trim();

    Utils.clearValidation(form);

    const fields = [
      { el: document.getElementById('currentPassword'), rule: v => v.length >= 1, msg: 'Enter your current password.' },
      { el: document.getElementById('newPassword'), rule: v => v.length >= 3, msg: 'New password must be at least 3 characters.' },
      { el: document.getElementById('confirmPassword'), rule: v => v === newPass, msg: 'Passwords do not match.' }
    ];

    if (!Utils.validateForm(fields)) return;

    UI.showSpinner('Changing password...');
    try {
      const result = await API.changePassword(user.username, current, newPass);
      if (result.status === 'success') {
        UI.toast('Password changed successfully.', 'success');
        form.reset();
      } else {
        UI.toast(result.message || 'Failed to change password.', 'error');
      }
    } catch (err) {
      UI.toast('Error: ' + err.message, 'error');
    } finally {
      UI.hideSpinner();
    }
  });
}
