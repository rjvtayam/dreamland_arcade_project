function renderAdminReports() {
  var app = document.getElementById('app');
  var currentTab = 'attendance';
  var branches = [];
  var filterBranch = '';
  var dateFrom = '';
  var dateTo = '';
  var reportData = null;
  var user = Auth.getUser();
  var isOwner = user && user.role === 'owner';

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
      else if (currentTab === 'sales') { reportData = await apiGet('/reports/sales' + qs); }
    } catch (e) {
      reportData = null;
    }
    renderTabContent();
  }

  function render() {
    app.innerHTML = '<div class="layout">' + renderSidebar() +
      '<div class="main-content">' + renderNavbar('Reports') +
      '<div class="page-content" id="page-body">' +

      '<div style="display:flex;gap:0;margin-bottom:24px;background:#1a1f2e;border:1px solid #2a3040;border-radius:10px;overflow:hidden;width:fit-content;">' +
        '<button class="report-tab-btn' + (currentTab === 'attendance' ? ' active' : '') + '" data-tab="attendance" style="padding:10px 24px;border:none;background:transparent;color:' + (currentTab === 'attendance' ? '#6366f1' : '#94a3b8') + ';font-weight:600;font-size:0.85rem;cursor:pointer;border-bottom:2px solid ' + (currentTab === 'attendance' ? '#6366f1' : 'transparent') + ';transition:all 0.2s;">Attendance</button>' +
        '<button class="report-tab-btn' + (currentTab === 'inventory' ? ' active' : '') + '" data-tab="inventory" style="padding:10px 24px;border:none;background:transparent;color:' + (currentTab === 'inventory' ? '#6366f1' : '#94a3b8') + ';font-weight:600;font-size:0.85rem;cursor:pointer;border-bottom:2px solid ' + (currentTab === 'inventory' ? '#6366f1' : 'transparent') + ';transition:all 0.2s;">Inventory</button>' +
        '<button class="report-tab-btn' + (currentTab === 'sales' ? ' active' : '') + '" data-tab="sales" style="padding:10px 24px;border:none;background:transparent;color:' + (currentTab === 'sales' ? '#6366f1' : '#94a3b8') + ';font-weight:600;font-size:0.85rem;cursor:pointer;border-bottom:2px solid ' + (currentTab === 'sales' ? '#6366f1' : 'transparent') + ';transition:all 0.2s;">Sales</button>' +
      '</div>' +

      '<div style="background:#1a1f2e;border:1px solid #2a3040;border-radius:12px;padding:20px;margin-bottom:20px;">' +
        '<div style="display:flex;gap:12px;align-items:flex-end;flex-wrap:wrap;">' +
          (isOwner ?
            '<div><label style="color:#94a3b8;font-size:0.75rem;display:block;margin-bottom:4px;">Branch</label>' +
            '<select id="report-branch" style="background:#0d1117;border:1px solid #30363d;border-radius:8px;padding:8px 12px;color:#e2e8f0;font-size:0.85rem;">' +
            '<option value="">All Branches</option>' +
            branches.map(function(b) { return '<option value="' + b.id + '"' + (String(b.id) === String(filterBranch) ? ' selected' : '') + '>' + escR(b.name) + '</option>'; }).join('') +
            '</select></div>' : '') +
          (currentTab !== 'inventory' ?
            '<div><label style="color:#94a3b8;font-size:0.75rem;display:block;margin-bottom:4px;">From</label>' +
            '<input type="date" id="report-from" style="background:#0d1117;border:1px solid #30363d;border-radius:8px;padding:8px 12px;color:#e2e8f0;font-size:0.85rem;" value="' + dateFrom + '"></div>' +
            '<div><label style="color:#94a3b8;font-size:0.75rem;display:block;margin-bottom:4px;">To</label>' +
            '<input type="date" id="report-to" style="background:#0d1117;border:1px solid #30363d;border-radius:8px;padding:8px 12px;color:#e2e8f0;font-size:0.85rem;" value="' + dateTo + '"></div>' : '') +
          '<button id="generate-btn" style="padding:8px 24px;border:none;border-radius:8px;background:#6366f1;color:#fff;font-weight:600;font-size:0.85rem;cursor:pointer;">Generate</button>' +
        '</div>' +
      '</div>' +

      '<div id="report-content" style="min-height:200px;"></div>' +
      '</div></div></div>';

    attachEvents();
    fetchReport();
  }

  function attachEvents() {
    document.getElementById('logout-btn')?.addEventListener('click', function(e) { e.preventDefault(); Auth.logout(); });

    document.querySelectorAll('.report-tab-btn').forEach(function(btn) {
      btn.addEventListener('click', function() { currentTab = btn.dataset.tab; render(); });
    });

    var branchSel = document.getElementById('report-branch');
    if (branchSel) branchSel.addEventListener('change', function(e) { filterBranch = e.target.value; });

    var fromSel = document.getElementById('report-from');
    if (fromSel) fromSel.addEventListener('change', function(e) { dateFrom = e.target.value; });

    var toSel = document.getElementById('report-to');
    if (toSel) toSel.addEventListener('change', function(e) { dateTo = e.target.value; });

    document.getElementById('generate-btn')?.addEventListener('click', fetchReport);
  }

  function renderTabContent() {
    var container = document.getElementById('report-content');
    if (!container) return;
    if (currentTab === 'attendance') renderAttendanceReport(container);
    else if (currentTab === 'inventory') renderInventoryReport(container);
    else if (currentTab === 'sales') renderSalesReport(container);
  }

  function renderAttendanceReport(container) {
    var records = Array.isArray(reportData) ? reportData : (reportData && reportData.records ? reportData.records : []);
    var totalUsers = records.length;
    var avgHours = records.length > 0 ? (records.reduce(function(s, r) { return s + (r.total_hours || 0); }, 0) / records.length).toFixed(1) : '-';
    var totalLate = records.reduce(function(s, r) { return s + (r.late_days || r.late || 0); }, 0);
    var totalOT = records.reduce(function(s, r) { return s + (r.overtime_hours || r.overtime || 0); }, 0).toFixed(1);

    container.innerHTML =
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-bottom:20px;">' +
        summaryCard('Total Users', totalUsers, '#6366f1') +
        summaryCard('Avg Hours', avgHours, '#22c55e') +
        summaryCard('Total Late', totalLate, '#f59e0b') +
        summaryCard('Total OT', totalOT + 'h', '#a855f7') +
      '</div>' +
      '<div style="background:#1a1f2e;border:1px solid #2a3040;border-radius:12px;overflow:hidden;">' +
      '<table style="width:100%;border-collapse:collapse;">' +
      '<thead><tr style="border-bottom:2px solid #2a3040;">' +
        '<th style="padding:12px 16px;text-align:left;color:#94a3b8;font-size:0.8rem;">NAME</th>' +
        '<th style="padding:12px 16px;text-align:center;color:#94a3b8;font-size:0.8rem;">DAYS PRESENT</th>' +
        '<th style="padding:12px 16px;text-align:center;color:#94a3b8;font-size:0.8rem;">LATE</th>' +
        '<th style="padding:12px 16px;text-align:center;color:#94a3b8;font-size:0.8rem;">HOURS</th>' +
        '<th style="padding:12px 16px;text-align:center;color:#94a3b8;font-size:0.8rem;">OVERTIME</th>' +
      '</tr></thead><tbody>' +
      (records.length === 0 ? '<tr><td colspan="5" style="padding:30px;text-align:center;color:#666;">No data</td></tr>' :
        records.map(function(r) {
          return '<tr style="border-bottom:1px solid #1e2736;">' +
            '<td style="padding:10px 16px;color:#e2e8f0;font-size:0.85rem;">' + escR(r.user_name || r.name || '-') + '</td>' +
            '<td style="padding:10px 16px;text-align:center;color:#e2e8f0;">' + (r.present_days ?? r.days_present ?? r.days ?? '-') + '</td>' +
            '<td style="padding:10px 16px;text-align:center;color:' + ((r.late_days || r.late || 0) > 0 ? '#f59e0b' : '#94a3b8') + ';">' + (r.late_days ?? r.late ?? r.late_count ?? '-') + '</td>' +
            '<td style="padding:10px 16px;text-align:center;color:#60a5fa;">' + (r.total_hours ?? r.hours ?? '-') + 'h</td>' +
            '<td style="padding:10px 16px;text-align:center;color:' + ((r.overtime_hours || r.overtime || 0) > 0 ? '#a855f7' : '#94a3b8') + ';">' + (r.overtime_hours ?? r.overtime ?? '-') + 'h</td>' +
          '</tr>';
        }).join('')) +
      '</tbody></table></div>';
  }

  function renderInventoryReport(container) {
    var data = reportData || {};
    var byCat = data.by_category || {};
    var catEntries = Object.keys(byCat);

    container.innerHTML =
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-bottom:20px;">' +
        summaryCard('Total Items', data.total_items ?? '-', '#6366f1') +
        summaryCard('Total Value', formatCurrency(data.total_value || 0), '#22c55e') +
        summaryCard('Low Stock', data.low_stock_count ?? '-', '#f59e0b') +
      '</div>' +
      (catEntries.length > 0 ?
        '<div style="background:#1a1f2e;border:1px solid #2a3040;border-radius:12px;overflow:hidden;">' +
        '<div style="padding:12px 16px;border-bottom:1px solid #2a3040;color:#94a3b8;font-size:0.8rem;font-weight:600;">BY CATEGORY</div>' +
        '<table style="width:100%;border-collapse:collapse;"><thead><tr style="border-bottom:1px solid #2a3040;">' +
          '<th style="padding:10px 16px;text-align:left;color:#94a3b8;font-size:0.8rem;">CATEGORY</th>' +
          '<th style="padding:10px 16px;text-align:center;color:#94a3b8;font-size:0.8rem;">ITEMS</th>' +
          '<th style="padding:10px 16px;text-align:right;color:#94a3b8;font-size:0.8rem;">VALUE</th>' +
        '</tr></thead><tbody>' +
        catEntries.map(function(cat) {
          var c = byCat[cat];
          return '<tr style="border-bottom:1px solid #1e2736;">' +
            '<td style="padding:10px 16px;color:#e2e8f0;font-size:0.85rem;">' + escR(cat) + '</td>' +
            '<td style="padding:10px 16px;text-align:center;color:#e2e8f0;">' + (c.count || 0) + '</td>' +
            '<td style="padding:10px 16px;text-align:right;color:#22c55e;">' + formatCurrency(c.value || 0) + '</td>' +
          '</tr>';
        }).join('') +
        '</tbody></table></div>' : '<div style="color:#666;padding:20px;">No category data</div>');
  }

  function renderSalesReport(container) {
    var data = reportData || {};
    var topProducts = Array.isArray(data.top_products) ? data.top_products : [];

    container.innerHTML =
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-bottom:20px;">' +
        summaryCard('Total Sales', formatCurrency(data.total_revenue || data.total_sales || 0), '#22c55e') +
        summaryCard('Transactions', data.total_transactions ?? '-', '#6366f1') +
        summaryCard('Avg Sale', formatCurrency(data.average_sale || 0), '#60a5fa') +
      '</div>' +
      (topProducts.length > 0 ?
        '<div style="background:#1a1f2e;border:1px solid #2a3040;border-radius:12px;overflow:hidden;">' +
        '<div style="padding:12px 16px;border-bottom:1px solid #2a3040;color:#94a3b8;font-size:0.8rem;font-weight:600;">TOP PRODUCTS</div>' +
        '<table style="width:100%;border-collapse:collapse;"><thead><tr style="border-bottom:1px solid #2a3040;">' +
          '<th style="padding:10px 16px;text-align:left;color:#94a3b8;font-size:0.8rem;">#</th>' +
          '<th style="padding:10px 16px;text-align:left;color:#94a3b8;font-size:0.8rem;">PRODUCT</th>' +
          '<th style="padding:10px 16px;text-align:center;color:#94a3b8;font-size:0.8rem;">QTY</th>' +
          '<th style="padding:10px 16px;text-align:right;color:#94a3b8;font-size:0.8rem;">REVENUE</th>' +
        '</tr></thead><tbody>' +
        topProducts.map(function(p, i) {
          return '<tr style="border-bottom:1px solid #1e2736;">' +
            '<td style="padding:10px 16px;color:#94a3b8;font-size:0.85rem;">' + (i + 1) + '</td>' +
            '<td style="padding:10px 16px;color:#e2e8f0;font-size:0.85rem;">' + escR(p.name || p.product_name || '-') + '</td>' +
            '<td style="padding:10px 16px;text-align:center;color:#e2e8f0;">' + (p.quantity ?? p.total_quantity ?? '-') + '</td>' +
            '<td style="padding:10px 16px;text-align:right;color:#22c55e;">' + formatCurrency(p.revenue || p.total_revenue || 0) + '</td>' +
          '</tr>';
        }).join('') +
        '</tbody></table></div>' : '<div style="color:#666;padding:20px;">No sales data</div>');
  }

  function summaryCard(label, value, color) {
    return '<div style="background:#1a1f2e;border:1px solid #2a3040;border-radius:12px;padding:16px;">' +
      '<div style="color:#94a3b8;font-size:0.75rem;text-transform:uppercase;margin-bottom:6px;">' + label + '</div>' +
      '<div style="color:' + color + ';font-size:1.2rem;font-weight:700;">' + value + '</div>' +
    '</div>';
  }

  function escR(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  loadData();
}

Router.register('reports', renderAdminReports);
