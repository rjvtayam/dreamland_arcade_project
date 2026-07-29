function renderAdminReports() {
  var app = document.getElementById('app');
  var currentTab = 'attendance';
  var branches = [];
  var filterBranch = '';
  var dateFrom = '';
  var dateTo = '';
  var reportData = null;
  var salesComparison = null;
  var user = Auth.getUser();
  var isOwner = user && user.role === 'owner';
  var refreshTimer = null;

  var INPUT = 'width:100%;background:#0d1117;border:1px solid #30363d;border-radius:8px;padding:10px 12px;color:#e2e8f0;font-size:0.85rem;outline:none;transition:border 0.2s;box-sizing:border-box;';
  var LABEL = 'color:#94a3b8;font-size:0.72rem;display:block;margin-bottom:5px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;';

  async function loadData() {
    try {
      if (isOwner) {
        branches = await apiGet('/branches');
        if (!Array.isArray(branches)) branches = [];
      }
      var today = new Date();
      dateTo = today.toISOString().split('T')[0];
      var monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      dateFrom = monthAgo.toISOString().split('T')[0];
      render();
    } catch (e) {
      Toast.error('Failed to load reports');
    }
  }

  async function fetchReport() {
    var params = [];
    if (isOwner && filterBranch) params.push('branch_id=' + filterBranch);
    if (dateFrom) params.push('start_date=' + dateFrom);
    if (dateTo) params.push('end_date=' + dateTo);
    var qs = params.length ? '?' + params.join('&') : '';
    try {
      if (currentTab === 'attendance') { reportData = await apiGet('/reports/attendance' + qs); }
      else if (currentTab === 'inventory') { reportData = await apiGet('/reports/inventory' + qs); }
      else if (currentTab === 'sales') {
        reportData = await apiGet('/reports/sales' + qs);
        try { salesComparison = await apiGet('/sales/comparison?period=monthly' + (isOwner && filterBranch ? '&branch_id=' + filterBranch : '')); } catch(e) { salesComparison = null; }
      }
    } catch (e) {
      reportData = null;
    }
    renderTabContent();
  }

  function startAutoRefresh() {
    stopAutoRefresh();
    refreshTimer = setInterval(function() { fetchReport(); }, 30000);
  }

  function stopAutoRefresh() {
    if (refreshTimer) { clearInterval(refreshTimer); refreshTimer = null; }
  }

  function render() {
    var now = new Date();
    var timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    app.innerHTML = '<div class="layout">' + renderSidebar() +
      '<div class="main-content">' + renderNavbar('Reports') +
      '<div class="page-content" id="page-body">' +
      '<style>' +
        '.rpt-tab{padding:10px 22px;border-radius:10px;border:none;font-size:0.85rem;font-weight:600;cursor:pointer;transition:all 0.2s;background:transparent;color:#64748b;border:1px solid transparent;}' +
        '.rpt-tab:hover{color:#94a3b8;background:rgba(99,102,241,0.05);}' +
        '.rpt-tab.active{background:linear-gradient(135deg,rgba(99,102,241,0.15),rgba(129,140,248,0.1));color:#818cf8;border:1px solid rgba(99,102,241,0.3);box-shadow:0 0 15px rgba(99,102,241,0.1);}' +
        '.rpt-card{background:linear-gradient(135deg,#0f1520,#131b2c);border:1px solid #1e293b;border-radius:14px;padding:20px;position:relative;overflow:hidden;transition:all 0.3s;}' +
        '.rpt-card:hover{border-color:#334155;transform:translateY(-1px);box-shadow:0 4px 20px rgba(0,0,0,0.3);}' +
        '.rpt-card::before{content:"";position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,var(--accent,#6366f1),transparent);opacity:0.6;}' +
        '.rpt-table{width:100%;border-collapse:separate;border-spacing:0;}' +
        '.rpt-table thead th{padding:12px 16px;text-align:left;color:#64748b;font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #1e293b;background:#0d1117;position:sticky;top:0;z-index:1;}' +
        '.rpt-table tbody tr{transition:background 0.15s;}' +
        '.rpt-table tbody tr:hover{background:rgba(99,102,241,0.04);}' +
        '.rpt-table tbody td{padding:12px 16px;border-bottom:1px solid rgba(30,41,59,0.5);font-size:0.85rem;}' +
        '.rpt-bar{height:6px;border-radius:3px;background:#1e293b;overflow:hidden;}' +
        '.rpt-bar-fill{height:100%;border-radius:3px;transition:width 0.6s ease;}' +
        '.rpt-badge{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:20px;font-size:0.65rem;font-weight:600;}' +
        '@keyframes rpt-pulse{0%,100%{opacity:1;}50%{opacity:0.5;}}' +
        '.rpt-live{animation:rpt-pulse 2s ease-in-out infinite;}' +
        '.rpt-section{background:linear-gradient(135deg,#0d1117,#111827);border:1px solid #1e293b;border-radius:14px;overflow:hidden;margin-bottom:16px;}' +
        '.rpt-section-head{padding:16px 20px;border-bottom:1px solid #1e293b;display:flex;justify-content:space-between;align-items:center;}' +
        '.rpt-section-title{color:#e2e8f0;font-weight:700;font-size:0.95rem;}' +
      '</style>' +

      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;flex-wrap:wrap;gap:12px;">' +
        '<div style="display:flex;gap:6px;background:#0d1117;border:1px solid #1e293b;border-radius:12px;padding:4px;">' +
          '<button class="rpt-tab' + (currentTab === 'attendance' ? ' active' : '') + '" data-tab="attendance"><svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="margin-right:4px;vertical-align:-2px;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>Attendance</button>' +
          '<button class="rpt-tab' + (currentTab === 'inventory' ? ' active' : '') + '" data-tab="inventory"><svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="margin-right:4px;vertical-align:-2px;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>Inventory</button>' +
          '<button class="rpt-tab' + (currentTab === 'sales' ? ' active' : '') + '" data-tab="sales"><svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="margin-right:4px;vertical-align:-2px;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>Sales</button>' +
        '</div>' +
        '<div style="display:flex;align-items:center;gap:12px;">' +
          '<div style="display:flex;align-items:center;gap:6px;color:#475569;font-size:0.75rem;"><span class="rpt-live" style="width:6px;height:6px;border-radius:50%;background:#22c55e;display:inline-block;"></span>Live &middot; ' + timeStr + '</div>' +
          '<button id="rpt-refresh" title="Refresh" style="padding:8px;border:1px solid #30363d;border-radius:8px;background:#0d1117;color:#94a3b8;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.2s;" onmouseenter="this.style.borderColor=\'#6366f1\';this.style.color=\'#a78bfa\'" onmouseleave="this.style.borderColor=\'#30363d\';this.style.color=\'#94a3b8\'"><svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg></button>' +
        '</div>' +
      '</div>' +

      '<div style="background:linear-gradient(135deg,#0d1117,#111827);border:1px solid #1e293b;border-radius:14px;padding:20px;margin-bottom:24px;">' +
        '<div style="display:flex;gap:12px;align-items:flex-end;flex-wrap:wrap;">' +
          (isOwner ?
            '<div style="flex:0 0 180px;"><label style="' + LABEL + '">Branch</label>' +
            '<select id="report-branch" style="' + INPUT + '">' +
            '<option value="">All Branches</option>' +
            branches.map(function(b) { return '<option value="' + b.id + '"' + (String(b.id) === String(filterBranch) ? ' selected' : '') + '>' + escR(b.name) + '</option>'; }).join('') +
            '</select></div>' : '') +
          (currentTab !== 'inventory' ?
            '<div style="flex:0 0 160px;"><label style="' + LABEL + '">From</label>' +
            '<input type="date" id="report-from" style="' + INPUT + '" value="' + dateFrom + '"></div>' +
            '<div style="flex:0 0 160px;"><label style="' + LABEL + '">To</label>' +
            '<input type="date" id="report-to" style="' + INPUT + '" value="' + dateTo + '"></div>' : '') +
          '<button id="generate-btn" style="padding:10px 28px;border:none;border-radius:10px;background:linear-gradient(135deg,#6366f1,#818cf8);color:#fff;font-weight:700;font-size:0.85rem;cursor:pointer;box-shadow:0 2px 10px rgba(99,102,241,0.3);transition:all 0.2s;" onmouseenter="this.style.boxShadow=\'0 4px 20px rgba(99,102,241,0.4)\'" onmouseleave="this.style.boxShadow=\'0 2px 10px rgba(99,102,241,0.3)\'"><svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="margin-right:4px;vertical-align:-2px;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>Generate Report</button>' +
        '</div>' +
      '</div>' +

      '<div id="report-content" style="min-height:300px;"></div>' +
      '</div></div></div>';

    attachEvents();
    fetchReport();
    startAutoRefresh();
  }

  function attachEvents() {
    document.getElementById('logout-btn')?.addEventListener('click', function(e) { e.preventDefault(); Auth.logout(); });
    document.querySelectorAll('.rpt-tab').forEach(function(btn) {
      btn.addEventListener('click', function() { currentTab = this.dataset.tab; render(); });
    });
    var branchSel = document.getElementById('report-branch');
    if (branchSel) branchSel.addEventListener('change', function(e) { filterBranch = e.target.value; });
    var fromSel = document.getElementById('report-from');
    if (fromSel) fromSel.addEventListener('change', function(e) { dateFrom = e.target.value; });
    var toSel = document.getElementById('report-to');
    if (toSel) toSel.addEventListener('change', function(e) { dateTo = e.target.value; });
    document.getElementById('generate-btn')?.addEventListener('click', fetchReport);
    document.getElementById('rpt-refresh')?.addEventListener('click', fetchReport);
  }

  function renderTabContent() {
    var container = document.getElementById('report-content');
    if (!container) return;
    if (currentTab === 'attendance') renderAttendanceReport(container);
    else if (currentTab === 'inventory') renderInventoryReport(container);
    else if (currentTab === 'sales') renderSalesReport(container);
  }

  function statCard(label, value, color, icon, sub) {
    return '<div class="rpt-card" style="--accent:' + color + ';">' +
      '<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">' +
        '<div style="width:38px;height:38px;border-radius:10px;background:' + color + '15;display:flex;align-items:center;justify-content:center;">' + icon + '</div>' +
        '<div style="color:#64748b;font-size:0.7rem;text-transform:uppercase;letter-spacing:1px;font-weight:600;">' + label + '</div>' +
      '</div>' +
      '<div style="color:' + color + ';font-size:1.6rem;font-weight:800;letter-spacing:-0.5px;">' + value + '</div>' +
      (sub ? '<div style="color:#475569;font-size:0.7rem;margin-top:4px;">' + sub + '</div>' : '') +
    '</div>';
  }

  function section(title, content, extra) {
    return '<div class="rpt-section"><div class="rpt-section-head"><div class="rpt-section-title">' + title + '</div>' + (extra || '') + '</div><div style="padding:20px;">' + content + '</div></div>';
  }

  function renderAttendanceReport(container) {
    var data = reportData || {};
    var records = Array.isArray(data) ? data : (data.records || []);
    var summary = data.summary || {};
    var totalUsers = summary.total_employees || records.length;
    var totalPresent = summary.total_present || 0;
    var totalLate = summary.total_late || 0;
    var totalOT = summary.total_overtime || 0;
    var totalAbsent = summary.total_absent || 0;
    var avgHours = summary.avg_hours || 0;
    var maxHours = Math.max.apply(null, records.map(function(r) { return r.total_hours || 0; }).concat([1]));

    var iconUser = '<svg width="18" height="18" fill="none" stroke="#6366f1" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>';
    var iconPresent = '<svg width="18" height="18" fill="none" stroke="#22c55e" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>';
    var iconLate = '<svg width="18" height="18" fill="none" stroke="#f59e0b" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>';
    var iconOT = '<svg width="18" height="18" fill="none" stroke="#a855f7" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>';
    var iconAbsent = '<svg width="18" height="18" fill="none" stroke="#ef4444" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/></svg>';
    var iconClock = '<svg width="18" height="18" fill="none" stroke="#60a5fa" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>';

    container.innerHTML =
      '<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:14px;margin-bottom:24px;">' +
        statCard('Employees', totalUsers, '#6366f1', iconUser, 'Active staff') +
        statCard('Present', totalPresent, '#22c55e', iconPresent, totalUsers > 0 ? ((totalPresent / totalUsers * 100).toFixed(0) + '% rate') : '') +
        statCard('Late', totalLate, '#f59e0b', iconLate, totalPresent > 0 ? ((totalLate / totalPresent * 100).toFixed(0) + '% of present') : '') +
        statCard('Overtime', totalOT, '#a855f7', iconOT, 'Employees with OT') +
        statCard('Avg Hours', avgHours + 'h', '#60a5fa', iconClock, 'Per employee per day') +
      '</div>' +

      (records.length > 0 ?
        section('Attendance Details', '', '<div style="color:#475569;font-size:0.75rem;">' + records.length + ' employees &middot; ' + (summary.period_start || '') + ' to ' + (summary.period_end || '') + '</div>') +
        '<div class="rpt-section" style="margin-top:-16px;"><div style="overflow-x:auto;">' +
          '<table class="rpt-table"><thead><tr>' +
            '<th style="min-width:200px;">Employee</th>' +
            '<th style="text-align:center;">Branch</th>' +
            '<th style="text-align:center;">Days</th>' +
            '<th style="text-align:center;">Present</th>' +
            '<th style="text-align:center;">Late</th>' +
            '<th style="text-align:center;">OT Days</th>' +
            '<th style="min-width:180px;">Hours</th>' +
            '<th style="text-align:center;">Overtime</th>' +
            '<th style="text-align:center;">Rate</th>' +
          '</tr></thead><tbody>' +
          records.map(function(r) {
            var present = r.present_days || 0;
            var late = r.late_days || 0;
            var otDays = r.overtime_days || 0;
            var hours = r.total_hours || 0;
            var ot = r.overtime_hours || 0;
            var rate = r.total_days > 0 ? Math.round(present / r.total_days * 100) : 0;
            var barW = maxHours > 0 ? (hours / maxHours * 100) : 0;
            var rateColor = rate >= 90 ? '#22c55e' : rate >= 70 ? '#f59e0b' : '#ef4444';
            var initials = escR((r.user_name || '??').split(' ').map(function(w) { return w.charAt(0); }).join('').substring(0, 2));

            return '<tr>' +
              '<td><div style="display:flex;align-items:center;gap:10px;">' +
                '<div style="width:32px;height:32px;border-radius:8px;background:linear-gradient(135deg,#1a1525,#251e35);display:flex;align-items:center;justify-content:center;color:#a78bfa;font-weight:700;font-size:0.7rem;border:1px solid rgba(167,139,250,0.15);">' + initials + '</div>' +
                '<div><div style="color:#e2e8f0;font-weight:600;">' + escR(r.user_name || '-') + '</div><div style="color:#475569;font-size:0.65rem;">' + escR(r.branch_name || '') + '</div></div>' +
              '</div></td>' +
              '<td style="text-align:center;"><span style="color:#64748b;font-size:0.75rem;">' + escR(r.branch_name || '-') + '</span></td>' +
              '<td style="text-align:center;color:#e2e8f0;">' + (r.total_days || 0) + '</td>' +
              '<td style="text-align:center;color:#22c55e;font-weight:600;">' + present + '</td>' +
              '<td style="text-align:center;">' +
                (late > 0 ? '<span class="rpt-badge" style="background:rgba(245,158,11,0.1);color:#f59e0b;border:1px solid rgba(245,158,11,0.2);">' + late + '</span>' : '<span style="color:#475569;">0</span>') +
              '</td>' +
              '<td style="text-align:center;">' +
                (otDays > 0 ? '<span class="rpt-badge" style="background:rgba(168,85,247,0.1);color:#a855f7;border:1px solid rgba(168,85,247,0.2);">' + otDays + '</span>' : '<span style="color:#475569;">0</span>') +
              '</td>' +
              '<td>' +
                '<div style="display:flex;align-items:center;gap:10px;">' +
                  '<div class="rpt-bar" style="flex:1;"><div class="rpt-bar-fill" style="width:' + barW + '%;background:linear-gradient(90deg,#6366f1,#818cf8);"></div></div>' +
                  '<span style="color:#60a5fa;font-weight:600;font-size:0.85rem;white-space:nowrap;">' + hours.toFixed(1) + 'h</span>' +
                '</div>' +
              '</td>' +
              '<td style="text-align:center;">' +
                (ot > 0 ? '<span class="rpt-badge" style="background:rgba(168,85,247,0.1);color:#a855f7;border:1px solid rgba(168,85,247,0.2);">' + ot.toFixed(1) + 'h</span>' : '<span style="color:#475569;">-</span>') +
              '</td>' +
              '<td style="text-align:center;">' +
                '<div style="display:flex;align-items:center;justify-content:center;gap:6px;">' +
                  '<div class="rpt-bar" style="width:60px;"><div class="rpt-bar-fill" style="width:' + rate + '%;background:' + rateColor + ';"></div></div>' +
                  '<span style="color:' + rateColor + ';font-weight:600;font-size:0.8rem;">' + rate + '%</span>' +
                '</div>' +
              '</td>' +
            '</tr>';
          }).join('') +
          '</tbody></table></div></div>'
        : '<div style="text-align:center;padding:60px;color:#475569;">No attendance data for this period</div>');
  }

  function renderInventoryReport(container) {
    var data = reportData || {};
    var byCat = data.by_category || {};
    var catEntries = Object.keys(byCat).sort(function(a, b) { return (byCat[b].value || 0) - (byCat[a].value || 0); });
    var totalValue = data.total_value || 0;
    var maxCatVal = Math.max.apply(null, catEntries.map(function(c) { return byCat[c].value || 0; }).concat([1]));
    var byBranch = data.by_branch || {};
    var branchEntries = Object.keys(byBranch);
    var recentLogs = data.recent_logs || [];
    var lowStockItems = data.low_stock_items || [];

    var iconBox = '<svg width="18" height="18" fill="none" stroke="#6366f1" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>';
    var iconValue = '<svg width="18" height="18" fill="none" stroke="#22c55e" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>';
    var iconInStock = '<svg width="18" height="18" fill="none" stroke="#22c55e" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>';
    var iconLow = '<svg width="18" height="18" fill="none" stroke="#f59e0b" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>';
    var iconOut = '<svg width="18" height="18" fill="none" stroke="#ef4444" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/></svg>';

    var catHtml = '';
    if (catEntries.length > 0) {
      catHtml = catEntries.map(function(cat) {
        var c = byCat[cat];
        var pct = totalValue > 0 ? ((c.value || 0) / totalValue * 100).toFixed(1) : 0;
        var barW = maxCatVal > 0 ? ((c.value || 0) / maxCatVal * 100) : 0;
        var colors = ['#6366f1', '#22c55e', '#f59e0b', '#06b6d4', '#a855f7', '#ec4899'];
        var color = colors[catEntries.indexOf(cat) % colors.length];
        return '<div style="margin-bottom:14px;">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;">' +
            '<div style="display:flex;align-items:center;gap:8px;"><div style="width:8px;height:8px;border-radius:2px;background:' + color + ';"></div><span style="color:#e2e8f0;font-weight:600;font-size:0.85rem;">' + escR(cat) + '</span></div>' +
            '<div style="display:flex;align-items:center;gap:12px;"><span style="color:#64748b;font-size:0.7rem;">' + (c.count || 0) + ' items</span><span style="color:' + color + ';font-weight:600;font-size:0.85rem;">' + formatCurrency(c.value || 0) + '</span></div>' +
          '</div>' +
          '<div class="rpt-bar" style="height:8px;"><div class="rpt-bar-fill" style="width:' + barW + '%;background:linear-gradient(90deg,' + color + ',' + color + '99);"></div></div>' +
          '<div style="display:flex;justify-content:space-between;margin-top:3px;"><span style="color:#475569;font-size:0.6rem;">' + pct + '% of total</span><span style="color:#475569;font-size:0.6rem;">In:' + (c.in_stock || 0) + ' Low:' + (c.low_stock || 0) + ' Out:' + (c.out_of_stock || 0) + '</span></div>' +
        '</div>';
      }).join('');
    } else if (branchEntries.length > 0) {
      catHtml = branchEntries.map(function(br) {
        var b = byBranch[br];
        var pct = totalValue > 0 ? ((b.value || 0) / totalValue * 100).toFixed(1) : 0;
        return '<div style="background:#0d1117;border:1px solid #1e293b;border-radius:10px;padding:14px;margin-bottom:10px;">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;">' +
            '<div><div style="color:#e2e8f0;font-weight:600;font-size:0.85rem;">' + escR(br) + '</div><div style="color:#64748b;font-size:0.7rem;">' + (b.count || 0) + ' items &middot; ' + (b.low_stock || 0) + ' low stock</div></div>' +
            '<div style="text-align:right;"><div style="color:#22c55e;font-weight:700;font-size:1rem;">' + formatCurrency(b.value || 0) + '</div><div style="color:#475569;font-size:0.65rem;">' + pct + '%</div></div>' +
          '</div>' +
        '</div>';
      }).join('');
    }

    var lowStockHtml = '';
    if (lowStockItems.length > 0) {
      lowStockHtml = '<div style="overflow-x:auto;"><table class="rpt-table"><thead><tr>' +
        '<th>Item</th><th>Category</th><th>Branch</th><th style="text-align:center;">Qty</th><th style="text-align:center;">Reorder</th><th style="text-align:center;">Status</th>' +
      '</tr></thead><tbody>' +
      lowStockItems.map(function(item) {
        var status = item.quantity <= 0 ? 'Out of Stock' : 'Low Stock';
        var statusColor = item.quantity <= 0 ? '#ef4444' : '#f59e0b';
        return '<tr>' +
          '<td style="color:#e2e8f0;font-weight:600;">' + escR(item.name) + '</td>' +
          '<td style="color:#64748b;">' + escR(item.category_name || '-') + '</td>' +
          '<td style="color:#64748b;">' + escR(item.branch_name || '-') + '</td>' +
          '<td style="text-align:center;color:' + statusColor + ';font-weight:600;">' + item.quantity + '</td>' +
          '<td style="text-align:center;color:#64748b;">' + (item.reorder_level || 0) + '</td>' +
          '<td style="text-align:center;"><span class="rpt-badge" style="background:' + statusColor + '15;color:' + statusColor + ';border:1px solid ' + statusColor + '30;">' + status + '</span></td>' +
        '</tr>';
      }).join('') +
      '</tbody></table></div>';
    }

    var logsHtml = '';
    if (recentLogs.length > 0) {
      logsHtml = '<div style="overflow-x:auto;"><table class="rpt-table"><thead><tr>' +
        '<th>Date</th><th>Item</th><th>Type</th><th style="text-align:center;">Qty</th><th>By</th><th>Notes</th>' +
      '</tr></thead><tbody>' +
      recentLogs.map(function(l) {
        var typeColor = l.type === 'in' || l.type === 'stock_in' ? '#22c55e' : '#ef4444';
        var typeLabel = l.type === 'in' || l.type === 'stock_in' ? 'Stock In' : 'Stock Out';
        var dateStr = l.created_at ? new Date(l.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '-';
        return '<tr>' +
          '<td style="color:#64748b;font-size:0.8rem;">' + dateStr + '</td>' +
          '<td style="color:#e2e8f0;font-weight:600;">' + escR(l.item_name || '-') + '</td>' +
          '<td><span class="rpt-badge" style="background:' + typeColor + '15;color:' + typeColor + ';border:1px solid ' + typeColor + '30;">' + typeLabel + '</span></td>' +
          '<td style="text-align:center;color:#e2e8f0;">' + (l.quantity || 0) + '</td>' +
          '<td style="color:#64748b;font-size:0.8rem;">' + escR(l.performer_name || '-') + '</td>' +
          '<td style="color:#475569;font-size:0.8rem;">' + escR(l.notes || '-') + '</td>' +
        '</tr>';
      }).join('') +
      '</tbody></table></div>';
    }

    var html = '' +
      '<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:14px;margin-bottom:24px;">' +
        statCard('Total Items', data.total_items ?? '-', '#6366f1', iconBox, 'Active products') +
        statCard('Total Value', formatCurrency(totalValue), '#22c55e', iconValue, 'Inventory worth') +
        statCard('In Stock', data.in_stock_count ?? '-', '#22c55e', iconInStock, 'Above reorder level') +
        statCard('Low Stock', data.low_stock_count ?? '-', '#f59e0b', iconLow, 'Needs reorder') +
        statCard('Out of Stock', data.out_of_stock_count ?? '-', '#ef4444', iconOut, 'Depleted items') +
      '</div>';

    if (catHtml) {
      html += '<div class="rpt-section"><div class="rpt-section-head"><div class="rpt-section-title">' + (catEntries.length > 0 ? 'Category Breakdown' : 'Branch Distribution') + '</div></div><div style="padding:20px;">' + catHtml + '</div></div>';
    }

    if (lowStockHtml) {
      html += section('Low Stock Items', lowStockHtml);
    }

    if (logsHtml) {
      html += section('Recent Stock Movements', logsHtml);
    }

    if (!catHtml && !lowStockHtml && !logsHtml) {
      html += '<div style="text-align:center;padding:60px;color:#475569;">No inventory data</div>';
    }

    container.innerHTML = html;
  }

  function renderSalesReport(container) {
    var data = reportData || {};
    var topProducts = Array.isArray(data.top_products) ? data.top_products : [];
    var comp = salesComparison || {};
    var compLabels = comp.labels || [];
    var compCurrent = comp.current_values || [];
    var compPrevious = comp.previous_values || [];
    var compTotal = comp.current_total || 0;
    var compPrevTotal = comp.previous_total || 0;
    var compChange = comp.change_pct || 0;
    var maxSale = Math.max.apply(null, compCurrent.concat(compPrevious).concat([1]));
    var productRevs = topProducts.map(function(p) { return p.revenue || 0; });
    var maxProduct = productRevs.length > 0 ? Math.max.apply(null, productRevs.concat([1])) : 1;
    var areaSales = data.area_sales || {};
    var paymentMethods = data.payment_methods || {};
    var tokenSales = data.token_sales || [];
    var dailyBreakdown = data.daily_breakdown || [];

    var iconRevenue = '<svg width="18" height="18" fill="none" stroke="#22c55e" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>';
    var iconTxn = '<svg width="18" height="18" fill="none" stroke="#6366f1" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>';
    var iconAvg = '<svg width="18" height="18" fill="none" stroke="#60a5fa" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>';
    var iconChange = compChange >= 0 ?
      '<svg width="18" height="18" fill="none" stroke="#22c55e" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>' :
      '<svg width="18" height="18" fill="none" stroke="#ef4444" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"/></svg>';
    var iconToken = '<svg width="18" height="18" fill="none" stroke="#f59e0b" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>';

    var areaHtml = '';
    if (Object.keys(areaSales).length > 0) {
      areaHtml = '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:16px;">' +
        ['Arcade', 'Playhouse', 'Cafe'].map(function(area) {
          var a = areaSales[area] || {};
          var rev = a.revenue || 0;
          var txn = a.transactions || 0;
          var areaPct = data.total_revenue > 0 ? (rev / data.total_revenue * 100).toFixed(1) : 0;
          var areaColors = { 'Arcade': '#6366f1', 'Playhouse': '#22c55e', 'Cafe': '#f59e0b' };
          var color = areaColors[area] || '#64748b';
          return '<div class="rpt-card" style="--accent:' + color + ';">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">' +
              '<div style="color:#e2e8f0;font-weight:700;font-size:0.9rem;">' + area + '</div>' +
              '<div style="color:' + color + ';font-size:0.7rem;font-weight:600;">' + areaPct + '%</div>' +
            '</div>' +
            '<div style="color:' + color + ';font-size:1.4rem;font-weight:800;">' + formatCurrency(rev) + '</div>' +
            '<div style="color:#475569;font-size:0.7rem;margin-top:4px;">' + txn + ' transactions</div>' +
          '</div>';
        }).join('') +
      '</div>';
    }

    var paymentHtml = '';
    if (Object.keys(paymentMethods).length > 0) {
      var pmKeys = Object.keys(paymentMethods);
      paymentHtml = section('Payment Methods', '<div style="display:grid;grid-template-columns:repeat(' + pmKeys.length + ',1fr);gap:12px;">' +
        pmKeys.map(function(method) {
          var m = paymentMethods[method];
          var mColors = { 'Cash': '#22c55e', 'GCash': '#6366f1', 'Card': '#f59e0b' };
          var mColor = mColors[method] || '#64748b';
          return '<div style="background:#0d1117;border:1px solid #1e293b;border-radius:10px;padding:14px;text-align:center;">' +
            '<div style="color:#64748b;font-size:0.65rem;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">' + escR(method) + '</div>' +
            '<div style="color:' + mColor + ';font-weight:700;font-size:1.1rem;">' + formatCurrency(m.revenue || 0) + '</div>' +
            '<div style="color:#475569;font-size:0.65rem;margin-top:2px;">' + (m.transactions || 0) + ' txns</div>' +
          '</div>';
        }).join('') +
      '</div>');
    }

    var tokenHtml = '';
    if (data.smash_token_count > 0 || data.extra_token_count > 0 || tokenSales.length > 0) {
      var tokenCount = tokenSales.length + (data.smash_token_count > 0 ? 1 : 0) + (data.extra_token_count > 0 ? 1 : 0);
      tokenHtml = section('Token Sales', '<div style="display:grid;grid-template-columns:repeat(' + tokenCount + ',1fr);gap:12px;">' +
        tokenSales.map(function(t) {
          return '<div style="background:#0d1117;border:1px solid #1e293b;border-radius:10px;padding:14px;text-align:center;">' +
            '<div style="color:#64748b;font-size:0.65rem;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">' + escR(t.name) + '</div>' +
            '<div style="color:#f59e0b;font-weight:700;font-size:1.1rem;">' + (t.tokens || 0) + ' tokens</div>' +
            '<div style="color:#475569;font-size:0.65rem;margin-top:2px;">' + (t.packs_sold || 0) + ' packs &middot; ' + formatCurrency(t.revenue || 0) + '</div>' +
          '</div>';
        }).join('') +
        (data.smash_token_count > 0 ? '<div style="background:#0d1117;border:1px solid #1e293b;border-radius:10px;padding:14px;text-align:center;"><div style="color:#64748b;font-size:0.65rem;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Smash Tokens</div><div style="color:#a855f7;font-weight:700;font-size:1.1rem;">' + data.smash_token_count + '</div></div>' : '') +
        (data.extra_token_count > 0 ? '<div style="background:#0d1117;border:1px solid #1e293b;border-radius:10px;padding:14px;text-align:center;"><div style="color:#64748b;font-size:0.65rem;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Extra Tokens</div><div style="color:#06b6d4;font-weight:700;font-size:1.1rem;">' + data.extra_token_count + '</div></div>' : '') +
      '</div>');
    }

    var trendHtml = '';
    if (compLabels.length > 0) {
      var trendLegend = '<div style="display:flex;gap:16px;font-size:0.7rem;"><div style="display:flex;align-items:center;gap:6px;"><div style="width:10px;height:3px;border-radius:2px;background:#6366f1;"></div><span style="color:#64748b;">Current</span></div><div style="display:flex;align-items:center;gap:6px;"><div style="width:10px;height:3px;border-radius:2px;background:#334155;"></div><span style="color:#475569;">Previous</span></div></div>';
      trendHtml = section('Sales Trend', '<div style="display:flex;align-items:flex-end;gap:6px;height:140px;">' +
        compLabels.map(function(label, i) {
          var curH = maxSale > 0 ? (compCurrent[i] || 0) / maxSale * 120 : 0;
          var prevH = maxSale > 0 ? (compPrevious[i] || 0) / maxSale * 120 : 0;
          return '<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;">' +
            '<div style="width:100%;display:flex;gap:3px;align-items:flex-end;justify-content:center;height:120px;">' +
              '<div style="width:40%;height:' + prevH + 'px;background:#1e293b;border-radius:3px 3px 0 0;min-height:2px;" title="Prev: ' + formatCurrency(compPrevious[i] || 0) + '"></div>' +
              '<div style="width:40%;height:' + curH + 'px;background:linear-gradient(180deg,#6366f1,#818cf8);border-radius:3px 3px 0 0;min-height:2px;box-shadow:0 0 8px rgba(99,102,241,0.3);" title="Current: ' + formatCurrency(compCurrent[i] || 0) + '"></div>' +
            '</div>' +
            '<div style="color:#475569;font-size:0.6rem;text-align:center;">' + label + '</div>' +
          '</div>';
        }).join('') +
      '</div>' +
      '<div style="margin-top:12px;padding-top:12px;border-top:1px solid #1e293b;display:flex;justify-content:space-between;">' +
        '<div style="color:#64748b;font-size:0.7rem;">This period: <span style="color:#e2e8f0;font-weight:600;">' + formatCurrency(compTotal) + '</span></div>' +
        '<div style="color:#64748b;font-size:0.7rem;">Previous: <span style="color:#94a3b8;font-weight:600;">' + formatCurrency(compPrevTotal) + '</span></div>' +
      '</div>', trendLegend);
    }

    var dailyHtml = '';
    if (dailyBreakdown.length > 0) {
      dailyHtml = section('Daily Breakdown', '<div style="overflow-x:auto;"><table class="rpt-table"><thead><tr>' +
        '<th>Date</th><th style="text-align:right;">Revenue</th><th style="text-align:center;">Transactions</th><th style="min-width:150px;">Revenue</th>' +
      '</tr></thead><tbody>' +
      dailyBreakdown.map(function(d) {
        var barW = data.total_revenue > 0 ? (d.revenue / data.total_revenue * 100) : 0;
        return '<tr>' +
          '<td style="color:#e2e8f0;">' + escR(d.date) + '</td>' +
          '<td style="text-align:right;color:#22c55e;font-weight:600;">' + formatCurrency(d.revenue) + '</td>' +
          '<td style="text-align:center;color:#64748b;">' + (d.transactions || 0) + '</td>' +
          '<td><div class="rpt-bar" style="height:8px;"><div class="rpt-bar-fill" style="width:' + barW + '%;background:linear-gradient(90deg,#22c55e,#4ade80);"></div></div></td>' +
        '</tr>';
      }).join('') +
      '</tbody></table></div>');
    }

    var productsHtml = '';
    if (topProducts.length > 0) {
      productsHtml = section('Top Products', '<div style="overflow-x:auto;"><table class="rpt-table"><thead><tr>' +
        '<th style="width:50px;">#</th><th>Product</th><th style="text-align:center;">Qty</th><th style="min-width:200px;">Revenue</th><th style="text-align:right;">Share</th>' +
      '</tr></thead><tbody>' +
      topProducts.map(function(p, i) {
        var rev = p.revenue || 0;
        var qty = p.quantity || 0;
        var share = data.total_revenue > 0 ? (rev / data.total_revenue * 100).toFixed(1) : 0;
        var barW = maxProduct > 0 ? (rev / maxProduct * 100) : 0;
        var rankColors = ['#f59e0b', '#94a3b8', '#cd7f32'];
        var rankColor = i < 3 ? rankColors[i] : '#475569';
        return '<tr>' +
          '<td><span style="display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:6px;background:' + rankColor + '15;color:' + rankColor + ';font-weight:700;font-size:0.75rem;">' + (i + 1) + '</span></td>' +
          '<td style="color:#e2e8f0;font-weight:600;">' + escR(p.name || '-') + '</td>' +
          '<td style="text-align:center;color:#e2e8f0;">' + qty + '</td>' +
          '<td><div style="display:flex;align-items:center;gap:10px;"><div class="rpt-bar" style="flex:1;"><div class="rpt-bar-fill" style="width:' + barW + '%;background:linear-gradient(90deg,#22c55e,#4ade80);"></div></div><span style="color:#22c55e;font-weight:600;font-size:0.85rem;white-space:nowrap;">' + formatCurrency(rev) + '</span></div></td>' +
          '<td style="text-align:right;color:#64748b;font-size:0.8rem;">' + share + '%</td>' +
        '</tr>';
      }).join('') +
      '</tbody></table></div>');
    }

    var html = '' +
      '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:24px;">' +
        statCard('Total Revenue', formatCurrency(data.total_revenue || 0), '#22c55e', iconRevenue, data.period_start ? (data.period_start + ' to ' + data.period_end) : '') +
        statCard('Transactions', data.total_transactions ?? '-', '#6366f1', iconTxn, 'Total sales') +
        statCard('Avg Sale', formatCurrency(data.average_sale || 0), '#60a5fa', iconAvg, 'Per transaction') +
        statCard('Trend', (compChange >= 0 ? '+' : '') + compChange + '%', compChange >= 0 ? '#22c55e' : '#ef4444', iconChange, 'vs previous period') +
      '</div>';

    if (areaHtml) { html += areaHtml; }
    if (paymentHtml) { html += paymentHtml; }
    if (tokenHtml) { html += tokenHtml; }
    if (trendHtml) { html += trendHtml; }
    if (dailyHtml) { html += dailyHtml; }
    if (productsHtml) { html += productsHtml; }

    if (!html.replace(/<[^>]*>/g, '').trim() || (!data.total_revenue && !compLabels.length)) {
      html += '<div style="text-align:center;padding:60px;color:#475569;">No sales data</div>';
    }

    container.innerHTML = html;
  }

  function escR(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  loadData();
}

Router.register('reports', renderAdminReports);
