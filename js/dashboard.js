document.addEventListener('DOMContentLoaded', async () => {
  if (!Auth.requireLogin()) return;

  UI.initTheme();
  UI.initSidebar();
  UI.renderUserInfo();
  UI.bindLogout();
  UI.bindTheme();
  UI.setActiveNav('dashboard');

  const user = Auth.getUser();
  const isAdmin = Auth.isAdmin();

  setupRoleUI(user, isAdmin);

  await loadStats(user, isAdmin);
  await loadRecentVisits(user, isAdmin);

  if (isAdmin) {
    await loadCharts(user);
  }
});

function setupRoleUI(user, isAdmin) {
  document.querySelectorAll('.admin-only').forEach(el => el.classList.toggle('d-none', !isAdmin));
  document.querySelectorAll('.incharge-only').forEach(el => el.classList.toggle('d-none', isAdmin));

  const dateEl = document.getElementById('todayDate');
  if (dateEl) dateEl.textContent = Utils.todayDisplay();

  const welcomeEl = document.getElementById('welcomeName');
  if (welcomeEl) welcomeEl.textContent = user.name;
}

async function loadStats(user, isAdmin) {
  try {
    const result = await API.getDashboardStats(user.username, user.role);
    if (result.status === 'success') {
      const d = result.data;
      setElText('statTotalVisits', Utils.numberFormat(d.totalVisits));
      setElText('statTodayVisits', Utils.numberFormat(d.todayVisits));
      setElText('statTotalStudents', Utils.numberFormat(d.totalStudents));
      if (isAdmin) {
        setElText('statSchools', Utils.numberFormat(d.totalSchools));
        setElText('statUsers', Utils.numberFormat(d.totalUsers));
      }
      setElText('statMonthlyVisits', Utils.numberFormat(d.monthlyVisits));
      setElText('statMonthlyStudents', Utils.numberFormat(d.monthlyStudents));
    }
  } catch {
    UI.toast('Could not load dashboard stats.', 'warning');
  }
}

async function loadRecentVisits(user, isAdmin) {
  const container = document.getElementById('recentVisitsList');
  if (!container) return;
  try {
    const result = await API.getRecentVisits(user.username, user.role);
    if (result.status === 'success' && result.data.length > 0) {
      container.innerHTML = result.data.map(v => `
        <div class="visit-row">
          <div class="visit-avatar">${Utils.initials(v.school)}</div>
          <div class="visit-info">
            <div class="visit-school">${Utils.escapeHtml(v.school)}</div>
            <div class="visit-meta">
              <i class="bi bi-calendar3 me-1"></i>${Utils.formatDate(v.visitDate)}
              ${isAdmin ? `<span class="ms-2"><i class="bi bi-person me-1"></i>${Utils.escapeHtml(v.username)}</span>` : ''}
              <span class="ms-2"><i class="bi bi-people me-1"></i>${Utils.escapeHtml(v.students)} students</span>
            </div>
          </div>
          <span class="badge bg-primary-soft text-primary fs-xs">${Utils.escapeHtml(v.school)}</span>
        </div>`).join('');
    } else {
      container.innerHTML = '<div class="empty-state"><i class="bi bi-journal-x"></i><p>No visits recorded yet.</p></div>';
    }
  } catch {
    container.innerHTML = '<div class="empty-state"><i class="bi bi-wifi-off"></i><p>Could not load recent visits.</p></div>';
  }
}

async function loadCharts(user) {
  try {
    const result = await API.getReports({ role: user.role, username: user.username });
    if (result.status !== 'success') return;

    const d = result.data;

    renderMonthlyChart(d.monthlyData || []);
    renderSchoolChart(d.schoolData || []);
  } catch {
    console.warn('Charts could not load.');
  }
}

function renderMonthlyChart(data) {
  const canvas = document.getElementById('monthlyChart');
  if (!canvas || !window.Chart) return;
  const labels = data.map(d => Utils.monthName(d.month) + ' ' + d.year);
  const values = data.map(d => d.count);
  new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [{ label: 'Visits', data: values, backgroundColor: 'rgba(37,99,235,0.75)', borderRadius: 6 }]
    },
    options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
  });
}

function renderSchoolChart(data) {
  const canvas = document.getElementById('schoolChart');
  if (!canvas || !window.Chart) return;
  const labels = data.map(d => d.school);
  const values = data.map(d => d.count);
  const colors = ['#2563EB','#22C55E','#F59E0B','#EF4444','#8B5CF6','#06B6D4','#EC4899','#14B8A6'];
  new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{ data: values, backgroundColor: colors.slice(0, labels.length), borderWidth: 0 }]
    },
    options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
  });
}

function setElText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}
