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

  setupRoleUI();
  await populateFilters();
  await loadReports();
  setupFilterActions();
  setupExport();
});

function setupRoleUI() {
  const isAdmin = Auth.isAdmin();
  document.querySelectorAll('.admin-only').forEach(el => el.classList.toggle('d-none', !isAdmin));
  document.querySelectorAll('.incharge-only').forEach(el => el.classList.toggle('d-none', isAdmin));
}

async function populateFilters() {
  const selSchool = document.getElementById('filterSchool');

  try {
    const result = await API.getSchools();
    if (result && result.status === 'success' && Array.isArray(result.data)) {
      selSchool.innerHTML = '<option value="">All Schools</option>' + result.data.map(s => `<option value="${Utils.escapeHtml(s.name)}">${Utils.escapeHtml(s.name)}</option>`).join('');
    }
  } catch {}

  if (Auth.isAdmin()) {
    try {
      const result = await API.getUsers();
      const selIncharge = document.getElementById('filterIncharge');
      if (result && result.status === 'success' && Array.isArray(result.data)) {
        const incharges = result.data.filter(u => u.role === 'Incharge');
        selIncharge.innerHTML = '<option value="">All Incharges</option>' + incharges.map(u => `<option value="${Utils.escapeHtml(u.username)}">${Utils.escapeHtml(u.name || u.username)}</option>`).join('');
      }
    } catch {}
  } else {
    const inchargeRow = document.getElementById('inchargeFilterRow');
    if (inchargeRow) inchargeRow.classList.add('d-none');
  }
}

function getISOYearMonthDay(dateStr) {
  if (!dateStr) return '';
  const str = String(dateStr).trim();
  if (!str) return '';

  const isoMatch = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2].padStart(2, '0')}-${isoMatch[3].padStart(2, '0')}`;
  }

  const slashMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (slashMatch) {
    let p1 = parseInt(slashMatch[1], 10);
    let p2 = parseInt(slashMatch[2], 10);
    let year = slashMatch[3];
    let month, day;
    if (p1 > 12) {
      day = p1;
      month = p2;
    } else if (p2 > 12) {
      month = p1;
      day = p2;
    } else {
      day = p1;
      month = p2;
    }
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  return str;
}

function aggregateReportData(visits) {
  const totalVisits = visits.length;
  let totalStudents = 0;
  const schoolsSet = new Set();
  const inchargesSet = new Set();
  const monthlyMap = {};
  const schoolMap = {};

  visits.forEach(v => {
    const st = parseInt(v.students) || 0;
    totalStudents += st;

    const sc = v.school ? String(v.school).trim() : '';
    if (sc) schoolsSet.add(sc);

    const inch = (v.username || v.incharge) ? String(v.username || v.incharge).trim() : '';
    if (inch) inchargesSet.add(inch);

    const normDate = getISOYearMonthDay(v.visitDate || v.date || v.timestamp);
    if (normDate && normDate.length >= 7) {
      const ym = normDate.substring(0, 7);
      const [yearStr, monthStr] = ym.split('-');
      const monthNum = parseInt(monthStr, 10);
      const key = ym;
      if (!monthlyMap[key]) {
        monthlyMap[key] = { month: monthNum, year: parseInt(yearStr, 10), count: 0, students: 0, ym: key };
      }
      monthlyMap[key].count += 1;
      monthlyMap[key].students += st;
    }

    if (sc) {
      schoolMap[sc] = (schoolMap[sc] || 0) + 1;
    }
  });

  const monthlyData = Object.values(monthlyMap).sort((a, b) => a.ym.localeCompare(b.ym));
  const schoolData = Object.entries(schoolMap)
    .map(([school, count]) => ({ school, count }))
    .sort((a, b) => b.count - a.count);

  return {
    totalVisits,
    totalStudents,
    schoolCount: schoolsSet.size,
    inchargeCount: inchargesSet.size,
    visits,
    monthlyData,
    schoolData
  };
}

async function loadReports() {
  UI.showSpinner('Generating report...');
  const user = Auth.getUser();
  const isAdmin = Auth.isAdmin();

  const monthVal = document.getElementById('filterMonth')?.value || '';
  const school = document.getElementById('filterSchool')?.value || '';
  const incharge = isAdmin ? (document.getElementById('filterIncharge')?.value || '') : user.username;
  const dateFrom = document.getElementById('filterDateFrom')?.value || '';
  const dateTo = document.getElementById('filterDateTo')?.value || '';

  try {
    let rawVisits = [];

    const params = isAdmin ? { role: user.role } : { username: user.username, role: user.role };
    try {
      const visitsResult = await API.getVisits(params);
      if (visitsResult && visitsResult.status === 'success' && Array.isArray(visitsResult.data)) {
        rawVisits = visitsResult.data;
      }
    } catch (e) {
      console.warn('API.getVisits fallback warning:', e);
    }

    if (!rawVisits || rawVisits.length === 0) {
      try {
        const reportsResult = await API.getReports({ role: user.role, username: user.username });
        if (reportsResult && reportsResult.status === 'success') {
          if (Array.isArray(reportsResult.data)) {
            rawVisits = reportsResult.data;
          } else if (reportsResult.data && Array.isArray(reportsResult.data.visits)) {
            rawVisits = reportsResult.data.visits;
          }
        }
      } catch (e) {
        console.warn('API.getReports backup warning:', e);
      }
    }

    let filteredVisits = (rawVisits || []).filter(v => {
      const normDate = getISOYearMonthDay(v.visitDate || v.date || v.timestamp);
      const matchMonth = !monthVal || normDate.startsWith(monthVal);
      const matchFrom = !dateFrom || (normDate && normDate >= dateFrom);
      const matchTo = !dateTo || (normDate && normDate <= dateTo);
      const matchSchool = !school || (v.school && String(v.school).trim().toLowerCase() === school.trim().toLowerCase());
      const matchIncharge = !incharge || ((v.username || v.incharge) && String(v.username || v.incharge).trim().toLowerCase() === incharge.trim().toLowerCase());
      return matchMonth && matchFrom && matchTo && matchSchool && matchIncharge;
    });

    filteredVisits.sort((a, b) => {
      const dA = getISOYearMonthDay(a.visitDate || a.date || a.timestamp);
      const dB = getISOYearMonthDay(b.visitDate || b.date || b.timestamp);
      return dB.localeCompare(dA);
    });

    const aggregated = aggregateReportData(filteredVisits);

    reportData = {
      totalVisits: aggregated.totalVisits,
      totalStudents: aggregated.totalStudents,
      schoolCount: aggregated.schoolCount,
      inchargeCount: aggregated.inchargeCount,
      visits: filteredVisits,
      monthlyData: aggregated.monthlyData,
      schoolData: aggregated.schoolData
    };

    updateSummaryCards(reportData);
    renderReportTable(reportData.visits);
    renderCharts(reportData.monthlyData, reportData.schoolData);
  } catch (err) {
    UI.toast('Error loading reports: ' + err.message, 'error');
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

  setupRoleUI();

  if (!visits || visits.length === 0) {
    tbody.innerHTML = `<tr><td colspan="${isAdmin ? 7 : 6}" class="text-center py-5"><div class="empty-state"><i class="bi bi-journal-x"></i><p>No visits found matching selected filters.</p></div></td></tr>`;
    return;
  }

  tbody.innerHTML = visits.map((v, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${Utils.formatDate(v.visitDate || v.date)}</td>
      <td><strong>${Utils.escapeHtml(v.school || 'N/A')}</strong></td>
      ${isAdmin ? `<td>${Utils.escapeHtml(v.username || v.incharge || '-')}</td>` : ''}
      <td>${Utils.numberFormat(v.students || 0)}</td>
      <td class="fs-xs" style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${Utils.escapeHtml(v.topicsCovered || v.topics || '-')}">${Utils.escapeHtml(v.topicsCovered || v.topics || '-')}</td>
      <td>${Utils.escapeHtml(v.remarks || '-')}</td>
    </tr>`).join('');
}

function renderCharts(monthly, schools) {
  const mc = document.getElementById('repMonthlyChart');
  const sc = document.getElementById('repSchoolChart');
  if (!window.Chart) return;

  if (monthlyChart) {
    monthlyChart.destroy();
    monthlyChart = null;
  }
  if (mc && Chart.getChart(mc)) {
    Chart.getChart(mc).destroy();
  }

  if (schoolChart) {
    schoolChart.destroy();
    schoolChart = null;
  }
  if (sc && Chart.getChart(sc)) {
    Chart.getChart(sc).destroy();
  }

  if (mc) {
    const hasData = monthly && monthly.length > 0;
    const labels = hasData ? monthly.map(d => Utils.monthName(d.month) + ' ' + d.year) : ['No Data'];
    const visitData = hasData ? monthly.map(d => d.count) : [0];
    const studentData = hasData ? monthly.map(d => d.students) : [0];

    monthlyChart = new Chart(mc, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          { label: 'Visits', data: visitData, backgroundColor: 'rgba(37,99,235,0.75)', borderRadius: 6 },
          { label: 'Students', data: studentData, backgroundColor: 'rgba(34,197,94,0.65)', borderRadius: 6 }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } },
        scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
      }
    });
  }

  if (sc) {
    const hasData = schools && schools.length > 0;
    const labels = hasData ? schools.map(d => d.school) : ['No Data'];
    const visitData = hasData ? schools.map(d => d.count) : [0];

    schoolChart = new Chart(sc, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{ label: 'Visits', data: visitData, backgroundColor: '#2563EB', borderRadius: 6 }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { x: { beginAtZero: true, ticks: { stepSize: 1 } } }
      }
    });
  }
}

function setupFilterActions() {
  document.getElementById('applyFiltersBtn')?.addEventListener('click', loadReports);
  document.getElementById('clearFiltersBtn')?.addEventListener('click', async () => {
    const monthEl = document.getElementById('filterMonth');
    const schoolEl = document.getElementById('filterSchool');
    const dateFromEl = document.getElementById('filterDateFrom');
    const dateToEl = document.getElementById('filterDateTo');
    const inchargeEl = document.getElementById('filterIncharge');

    if (monthEl) monthEl.value = '';
    if (schoolEl) schoolEl.value = '';
    if (dateFromEl) dateFromEl.value = '';
    if (dateToEl) dateToEl.value = '';
    if (inchargeEl) inchargeEl.value = '';

    await loadReports();
  });

  const monthInput = document.getElementById('filterMonth');
  const dateFromInput = document.getElementById('filterDateFrom');
  const dateToInput = document.getElementById('filterDateTo');
  const schoolInput = document.getElementById('filterSchool');
  const inchargeInput = document.getElementById('filterIncharge');

  if (monthInput) {
    monthInput.addEventListener('change', () => {
      if (monthInput.value) {
        if (dateFromInput) dateFromInput.value = '';
        if (dateToInput) dateToInput.value = '';
      }
      loadReports();
    });
  }
  if (dateFromInput) {
    dateFromInput.addEventListener('change', () => {
      if (dateFromInput.value && monthInput) monthInput.value = '';
      loadReports();
    });
  }
  if (dateToInput) {
    dateToInput.addEventListener('change', () => {
      if (dateToInput.value && monthInput) monthInput.value = '';
      loadReports();
    });
  }
  if (schoolInput) {
    schoolInput.addEventListener('change', loadReports);
  }
  if (inchargeInput) {
    inchargeInput.addEventListener('change', loadReports);
  }
}

function setupExport() {
  document.getElementById('exportPrintBtn')?.addEventListener('click', () => window.print());

  document.getElementById('exportExcelBtn')?.addEventListener('click', () => {
    const visits = reportData.visits || [];
    if (visits.length === 0) { UI.toast('No data to export.', 'warning'); return; }
    const isAdmin = Auth.isAdmin();
    const headers = ['S.No', 'Visit Date', 'School', ...(isAdmin ? ['Incharge'] : []), 'Students', 'Topics Covered', 'Remarks'];
    const rows = visits.map((v, i) => [
      i + 1,
      Utils.formatDate(v.visitDate || v.date),
      v.school || '',
      ...(isAdmin ? [v.username || v.incharge || ''] : []),
      v.students || 0,
      v.topicsCovered || v.topics || '',
      v.remarks || ''
    ]);
    const csvContent = [headers, ...rows].map(r => r.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'school_visits_report_' + Utils.todayISO() + '.csv';
    link.click();
    UI.toast('Report exported as CSV.', 'success');
  });

  document.getElementById('exportPdfBtn')?.addEventListener('click', () => {
    UI.toast('Use the Print option and select "Save as PDF".', 'info');
    window.print();
  });
}

function setEl(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}
