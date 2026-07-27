let selectedPhotos = [];
let editMode = false;
let editEntryID = null;

document.addEventListener('DOMContentLoaded', async () => {
  if (!Auth.requireLogin()) return;

  UI.initTheme();
  UI.initSidebar();
  UI.renderUserInfo();
  UI.bindLogout();
  UI.bindTheme();
  UI.setActiveNav('new-visit');

  const params = new URLSearchParams(window.location.search);
  editEntryID = params.get('edit');
  editMode = !!editEntryID;

  document.getElementById('visitDate').value = Utils.todayISO();

  await loadSchoolDropdown();

  if (editMode) {
    document.getElementById('formTitle').innerHTML = '<i class="bi bi-pencil-square me-2"></i>Edit Visit';
    document.getElementById('formTitle2').textContent = 'Edit Visit Record';
    document.getElementById('submitBtn').innerHTML = '<i class="bi bi-check-lg me-2"></i>Update Visit';
    document.getElementById('photoSection').innerHTML =
      '<div class="alert alert-info fs-sm py-2 mb-0"><i class="bi bi-info-circle me-2"></i>To add new photos to this visit, delete and re-submit the visit.</div>';
    await loadVisitForEdit(editEntryID);
  }

  if (!editMode) {
    setupPhotoUpload();
  }

  setupForm();
});

async function loadSchoolDropdown() {
  const select = document.getElementById('schoolSelect');
  try {
    const result = await API.getSchools();
    if (result.status === 'success') {
      const active = result.data.filter(s => s.status === 'Active');
      select.innerHTML = '<option value="">-- Select School --</option>' +
        active.map(s => `<option value="${Utils.escapeHtml(s.name)}">${Utils.escapeHtml(s.name)}</option>`).join('');
    } else {
      UI.toast('Could not load schools.', 'warning');
    }
  } catch {
    UI.toast('Could not load schools. Check your connection.', 'warning');
  }
}

async function loadVisitForEdit(id) {
  UI.showSpinner('Loading visit data...');
  try {
    const result = await API.getVisits({ entryID: id });
    if (result.status === 'success' && result.data.length > 0) {
      const v = result.data[0];
      document.getElementById('visitDate').value = v.visitDate;
      document.getElementById('schoolSelect').value = v.school;
      document.getElementById('topicsCovered').value = v.topicsCovered;
      document.getElementById('numStudents').value = v.students;
      document.getElementById('remarks').value = v.remarks || '';

      if (v.photoLinks) {
        const links = v.photoLinks.split(',').filter(l => l.trim());
        if (links.length > 0) {
          const existingEl = document.getElementById('existingPhotos');
          if (existingEl) {
            existingEl.innerHTML = '<p class="fs-xs text-muted mb-2"><i class="bi bi-images me-1"></i>Existing Photos (' + links.length + '):</p>' +
              links.map((l, i) => `<a href="${l.trim()}" target="_blank" class="btn btn-sm btn-outline-secondary me-1 mb-1"><i class="bi bi-image me-1"></i>Photo ${i + 1}</a>`).join('');
          }
        }
      }
    } else {
      UI.toast('Visit not found.', 'error');
    }
  } catch {
    UI.toast('Could not load visit data. Check your connection.', 'error');
  } finally {
    UI.hideSpinner();
  }
}

function setupPhotoUpload() {
  const dropArea = document.getElementById('photoDropArea');
  const input = document.getElementById('photoInput');
  const preview = document.getElementById('photoPreview');
  if (!dropArea || !input) return;

  dropArea.addEventListener('click', () => input.click());

  dropArea.addEventListener('dragover', e => {
    e.preventDefault();
    dropArea.classList.add('drag-over');
  });

  dropArea.addEventListener('dragleave', () => dropArea.classList.remove('drag-over'));

  dropArea.addEventListener('drop', e => {
    e.preventDefault();
    dropArea.classList.remove('drag-over');
    addPhotos(Array.from(e.dataTransfer.files));
  });

  input.addEventListener('change', () => {
    addPhotos(Array.from(input.files));
    input.value = '';
  });

  function addPhotos(files) {
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    const available = APP_CONFIG.MAX_PHOTOS - selectedPhotos.length;
    if (available <= 0) {
      UI.toast('Maximum ' + APP_CONFIG.MAX_PHOTOS + ' photos allowed.', 'warning');
      return;
    }
    selectedPhotos = [...selectedPhotos, ...imageFiles.slice(0, available)];
    renderPhotoPreview();
    updatePhotoCount();
  }

  function renderPhotoPreview() {
    preview.innerHTML = '';
    selectedPhotos.forEach((file, idx) => {
      const reader = new FileReader();
      reader.onload = e => {
        const item = document.createElement('div');
        item.className = 'photo-preview-item';
        item.innerHTML = `<img src="${e.target.result}" alt="Photo ${idx + 1}">
          <button class="remove-photo" data-idx="${idx}" title="Remove photo"><i class="bi bi-x"></i></button>`;
        item.querySelector('.remove-photo').addEventListener('click', ev => {
          ev.stopPropagation();
          selectedPhotos.splice(parseInt(ev.currentTarget.dataset.idx), 1);
          renderPhotoPreview();
          updatePhotoCount();
        });
        preview.appendChild(item);
      };
      reader.readAsDataURL(file);
    });
  }

  function updatePhotoCount() {
    const countEl = document.getElementById('photoCount');
    if (countEl) countEl.textContent = selectedPhotos.length > 0 ? selectedPhotos.length + ' photo(s) selected' : '';
  }
}

function setupForm() {
  const form = document.getElementById('visitForm');
  const clearBtn = document.getElementById('clearBtn');

  clearBtn.addEventListener('click', () => {
    form.reset();
    document.getElementById('visitDate').value = Utils.todayISO();
    if (!editMode) {
      selectedPhotos = [];
      document.getElementById('photoPreview').innerHTML = '';
      const countEl = document.getElementById('photoCount');
      if (countEl) countEl.textContent = '';
    }
    Utils.clearValidation(form);
    UI.toast('Form cleared.', 'info');
  });

  form.addEventListener('submit', async e => {
    e.preventDefault();

    const validationFields = [
      { el: document.getElementById('visitDate'), rule: v => !!v, msg: 'Visit date is required.' },
      { el: document.getElementById('schoolSelect'), rule: v => !!v, msg: 'Please select a school.' },
      { el: document.getElementById('topicsCovered'), rule: v => v.length >= 5, msg: 'Topics covered must be at least 5 characters.' },
      { el: document.getElementById('numStudents'), rule: v => v && parseInt(v) > 0, msg: 'Enter a valid number of students.' }
    ];

    if (!Utils.validateForm(validationFields)) return;

    const user = Auth.getUser();
    const entryID = editMode ? editEntryID : Utils.generateID();

    const visitData = {
      entryID,
      visitDate: document.getElementById('visitDate').value,
      school: document.getElementById('schoolSelect').value,
      topicsCovered: document.getElementById('topicsCovered').value.trim(),
      students: document.getElementById('numStudents').value,
      remarks: document.getElementById('remarks').value.trim(),
      username: user.username,
      timestamp: new Date().toISOString()
    };

    UI.showSpinner(editMode ? 'Updating visit...' : 'Saving visit...');

    try {
      const result = editMode
        ? await API.updateVisit(visitData)
        : await API.submitVisit(visitData, selectedPhotos);

      if (result.status === 'success') {
        UI.toast(editMode ? 'Visit updated successfully!' : 'Visit saved successfully!', 'success');
        setTimeout(() => { window.location.href = 'my-visits.html'; }, 1200);
      } else {
        UI.toast(result.message || 'Failed to save visit.', 'error');
      }
    } catch (err) {
      UI.toast('Error: ' + err.message, 'error');
    } finally {
      UI.hideSpinner();
    }
  });
}
