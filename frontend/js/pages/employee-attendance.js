function renderEmployeeAttendance() {
  const app = document.getElementById('app');
  const user = Auth.getUser();

  app.innerHTML = '<div class="layout">' + renderSidebar() +
    '<div class="main-content">' + renderNavbar('My Attendance') +
    '<div class="page-content" id="page-body">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:12px;">' +
        '<h2 style="color:#e2e8f0;margin:0;font-size:1.2rem;">Attendance History</h2>' +
        '<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">' +
          '<label style="color:#aaa;font-size:0.85rem;">From:</label>' +
          '<input type="date" id="att-start-date" style="background:#0d1117;border:1px solid #30363d;border-radius:6px;padding:6px 10px;color:#e2e8f0;font-size:0.85rem;">' +
          '<label style="color:#aaa;font-size:0.85rem;">To:</label>' +
          '<input type="date" id="att-end-date" style="background:#0d1117;border:1px solid #30363d;border-radius:6px;padding:6px 10px;color:#e2e8f0;font-size:0.85rem;">' +
          '<button id="att-filter-btn" style="background:#6366f1;color:#fff;border:none;border-radius:6px;padding:6px 16px;cursor:pointer;font-size:0.85rem;">Filter</button>' +
        '</div>' +
      '</div>' +
      '<div id="att-table-container" style="background:#1a1f2e;border:1px solid #2a3040;border-radius:12px;overflow:hidden;">' +
        '<div style="padding:40px;text-align:center;color:#666;">Loading...</div>' +
      '</div>' +
    '</div></div></div>';

  document.getElementById('logout-btn')?.addEventListener('click', (e) => {
    e.preventDefault();
    Auth.logout();
  });

  var today = new Date();
  var lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  document.getElementById('att-start-date').value = lastMonth.toISOString().slice(0, 10);
  document.getElementById('att-end-date').value = today.toISOString().slice(0, 10);

  document.getElementById('att-filter-btn').addEventListener('click', function() {
    loadAttendanceRecords();
  });

  document.getElementById('att-start-date').addEventListener('change', function() {
    loadAttendanceRecords();
  });
  document.getElementById('att-end-date').addEventListener('change', function() {
    loadAttendanceRecords();
  });

  loadAttendanceRecords();
}

async function loadAttendanceRecords() {
  var container = document.getElementById('att-table-container');
  var startDate = document.getElementById('att-start-date').value;
  var endDate = document.getElementById('att-end-date').value;

  try {
    var url = '/attendance/my';
    var params = [];
    if (startDate) params.push('start_date=' + startDate);
    if (endDate) params.push('end_date=' + endDate);
    if (params.length) url += '?' + params.join('&');

    var records = await apiGet(url);
    if (!Array.isArray(records)) records = [];

    if (records.length === 0) {
      container.innerHTML =
        '<div style="padding:40px;text-align:center;color:#666;">' +
          '<div style="font-size:2rem;margin-bottom:12px;">&#128197;</div>No attendance records found.' +
        '</div>';
      return;
    }

    var statusBadge = function(status) {
      var colors = { present: '#166534', late: '#713f12', overtime: '#581c87', absent: '#7f1d1d', 'day-off': '#1e3a5f' };
      var textColors = { present: '#4ade80', late: '#facc15', overtime: '#c084fc', absent: '#f87171', 'day-off': '#60a5fa' };
      var bg = colors[status] || '#1e293b';
      var tc = textColors[status] || '#888';
      return '<span style="background:' + bg + ';color:' + tc + ';padding:3px 10px;border-radius:20px;font-size:0.78rem;font-weight:600;text-transform:capitalize;">' + (status || 'N/A') + '</span>';
    };

    var formatDate = function(record) {
      if (record.clock_in) return new Date(record.clock_in).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      if (record.date) return new Date(record.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      return '';
    };

    var columns = [
      { key: 'date', label: 'Date', render: function(v, row) { return formatDate(row); } },
      { key: 'branch_name', label: 'Branch', render: function(v) { return v || '-'; } },
      { key: 'clock_in', label: 'Time In', render: function(v, row) { if (row.status === 'day-off') return '<span style="color:#60a5fa;">-</span>'; return v ? formatTime(v) : '<span style="color:#666;">-</span>'; } },
      { key: 'clock_out', label: 'Time Out', render: function(v, row) { if (row.status === 'day-off') return '<span style="color:#60a5fa;">-</span>'; return v ? formatTime(v) : '<span style="color:#666;">Timed In</span>'; } },
      { key: 'hours_worked', label: 'Hours', render: function(v, row) { if (row.status === 'day-off') return '<span style="color:#60a5fa;">0h</span>'; if (!row.clock_out) return '<span style="color:#666;">-</span>'; var diff = new Date(row.clock_out) - new Date(row.clock_in); var h = Math.floor(diff / 3600000); var m = Math.floor((diff % 3600000) / 60000); return h + 'h ' + m + 'm'; } },
      { key: 'status', label: 'Status', render: function(v) { return statusBadge(v); } }
    ];

    renderTable('att-table-container', columns, records);

  } catch (err) {
    container.innerHTML = '<div style="padding:40px;text-align:center;color:#f87171;">Failed to load attendance: ' + (err.message || 'Unknown error') + '</div>';
  }
}

Router.register('my-attendance', renderEmployeeAttendance);
