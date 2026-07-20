let reportData = {};
let monthlyChart = null;
let schoolChart = null;

document.addEventListener('DOMContentLoaded', async () => {
  if (!Auth.requireLogin()) return;

  UI.initTheme();
  UI.initSidebar();
  UI.renderUserInfo();
  UI.bindLogout();
  UI.bindTheme();
  UI.setActiveNav('reports');

  await populateFilters();
  await loadReports();
  setupFilterActions();
  setupExport();
});

async function populateFilters() {
  const selSchool = document.getElementById('filterSchool');
  const { month, year } = Utils.getMonthYear();

  document.getElementById('filterMonth').value = year + '-' + String(month).padStart(2, '0');

  try {
    const result = await API.getSchools();
    if (result.status === 'success') {
      selSchool.innerHTML = '<option value="">All Schools</option>' + result.data.map(s => `<option value="${Utils.escapeHtml(s.name)}">${Utils.escapeHtml(s.name)}</option>`).join('');
    }
  } catch {}

  if (Auth.isAdmin()) {
    try {
      const result = await API.getUsers();
      const selIncharge = document.getElementById('filterIncharge');
      if (result.status === 'success') {
        const incharges = result.data.filter(u => u.role === 'Incharge');
        selIncharge.innerHTML = '<option value="">All Incharges</option>' + incharges.map(u => `<option value="${Utils.escapeHtml(u.username)}">${Utils.escapeHtml(u.name)}</option>`).join('');
      }
    } catch {}
  } else {
    const inchargeRow = document.getElementById('inchargeFilterRow');
    if (inchargeRow) inchargeRow.classList.add('d-none');
  }
}

async function loadReports() {
  UI.showSpinner('Generating report...');
  const user = Auth.getUser();

  const monthVal = document.getElementById('filterMonth').value;
  const school = document.getElementById('filterSchool').value;
  const incharge = Auth.isAdmin() ? document.getElementById('filterIncharge').value : user.username;
  const dateFrom = document.getElementById('filterDateFrom').value;
  const dateTo = document.getElementById('filterDateTo').value;

  try {
    const result = await API.getReports({ role: user.role, username: user.username, month: monthVal, school, incharge, dateFrom, dateTo });
    if (result.status === 'success') {
      reportData = result.data;
      updateSummaryCards(reportData);
      renderReportTable(reportData.visits || []);
      renderCharts(reportData.monthlyData || [], reportData.schoolData || []);
    } else {
      UI.toast('Could not load report data.', 'error');
    }
  } catch (err) {
    UI.toast('Error: ' + err.message, 'error');
  } finally {
    UI.hideSpinner();
  }
}

function updateSummaryCards(data) {
  setEl('repTotalVisits', Utils.numberFormat(data.totalVisits));
  setEl('repTotalStudents', Utils.numberFormat(data.totalStudents));
  setEl('repSchoolCount', Utils.numberFormat(data.schoolCount));
  setEl('repInchargeCount', Utils.numberFormat(data.inchargeCount));
}

function renderReportTable(visits) {
  const tbody = document.getElementById('reportTableBody');
  if (!tbody) return;
  const isAdmin = Auth.isAdmin();

  if (visits.length === 0) {
    tbody.innerHTML = `<tr><td colspan="${isAdmin ? 7 : 6}" class="text-center py-5"><div class="empty-state"><i class="bi bi-bar-chart"></i><p>No data for selected filters.</p></div></td></tr>`;
    return;
  }

  tbody.innerHTML = visits.map((v, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${Utils.formatDate(v.visitDate)}</td>
      <td>${Utils.escapeHtml(v.school)}</td>
      ${isAdmin ? `<td>${Utils.escapeHtml(v.username)}</td>` : ''}
      <td>${Utils.escapeHtml(v.students)}</td>
      <td class="fs-xs" style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${Utils.escapeHtml(v.topicsCovered)}</td>
      <td>${Utils.escapeHtml(v.remarks || '-')}</td>
    </tr>`).join('');
}

function renderCharts(monthly, schools) {
  if (monthlyChart) monthlyChart.destroy();
  if (schoolChart) schoolChart.destroy();

  const mc = document.getElementById('repMonthlyChart');
  const sc = document.getElementById('repSchoolChart');
  if (!window.Chart) return;

  if (mc) {
    monthlyChart = new Chart(mc, {
      type: 'bar',
      data: {
        labels: monthly.map(d => Utils.monthName(d.month) + ' ' + d.year),
        datasets: [
          { label: 'Visits', data: monthly.map(d => d.count), backgroundColor: 'rgba(37,99,235,0.75)', borderRadius: 6 },
          { label: 'Students', data: monthly.map(d => d.students), backgroundColor: 'rgba(34,197,94,0.65)', borderRadius: 6 }
        ]
      },
      options: { responsive: true, plugins: { legend: { position: 'bottom' } }, scales: { y: { beginAtZero: true } } }
    });
  }

  if (sc) {
    schoolChart = new Chart(sc, {
      type: 'bar',
      data: {
        labels: schools.map(d => d.school),
        datasets: [{ label: 'Visits', data: schools.map(d => d.count), backgroundColor: '#2563EB', borderRadius: 6 }]
      },
      options: { indexAxis: 'y', responsive: true, plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true } } }
    });
  }
}

function setupFilterActions() {
  document.getElementById('applyFiltersBtn').addEventListener('click', loadReports);
  document.getElementById('clearFiltersBtn').addEventListener('click', async () => {
    const { month, year } = Utils.getMonthYear();
    document.getElementById('filterMonth').value = year + '-' + String(month).padStart(2, '0');
    document.getElementById('filterSchool').value = '';
    document.getElementById('filterDateFrom').value = '';
    document.getElementById('filterDateTo').value = '';
    const fi = document.getElementById('filterIncharge');
    if (fi) fi.value = '';
    await loadReports();
  });
}

function setupExport() {
  document.getElementById('exportPrintBtn').addEventListener('click', () => window.print());

  document.getElementById('exportExcelBtn').addEventListener('click', () => {
    const visits = reportData.visits || [];
    if (visits.length === 0) { UI.toast('No data to export.', 'warning'); return; }
    const isAdmin = Auth.isAdmin();
    const headers = ['S.No', 'Visit Date', 'School', ...(isAdmin ? ['Incharge'] : []), 'Students', 'Topics Covered', 'Remarks'];
    const rows = visits.map((v, i) => [i + 1, v.visitDate, v.school, ...(isAdmin ? [v.username] : []), v.students, v.topicsCovered, v.remarks || '']);
    const csvContent = [headers, ...rows].map(r => r.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'school_visits_report_' + Utils.todayISO() + '.csv';
    link.click();
    UI.toast('Report exported as CSV.', 'success');
  });

  document.getElementById('exportPdfBtn').addEventListener('click', () => {
    UI.toast('Use the Print option and select "Save as PDF".', 'info');
    window.print();
  });
}

function setEl(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}
