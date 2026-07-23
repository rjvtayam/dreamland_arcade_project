function renderPOSReports() {
  var app = document.getElementById('app');
  var reports = [];
  var branches = [];
  var filterBranch = '';
  var dateFrom = '';
  var dateTo = '';
  var selectedReport = null;

  async function loadData() {
    try {
      branches = await apiGet('/branches');
      if (!Array.isArray(branches)) branches = [];
      var today = new Date();
      dateTo = today.toISOString().split('T')[0];
      var weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      dateFrom = weekAgo.toISOString().split('T')[0];
      await loadReports();
    } catch (e) {
      Toast.error('Failed to load data');
    }
  }

  async function loadReports() {
    try {
      var params = [];
      if (filterBranch) params.push('branch_id=' + filterBranch);
      if (dateFrom) params.push('start_date=' + dateFrom);
      if (dateTo) params.push('end_date=' + dateTo);
      var url = '/pos-reports' + (params.length ? '?' + params.join('&') : '');
      reports = await apiGet(url);
      if (!Array.isArray(reports)) reports = [];
      render();
    } catch (e) {
      Toast.error('Failed to load reports');
    }
  }

  function renderDetail(r) {
    var items = r.items_summary || [];
    app.innerHTML = '<div class="layout">' + renderSidebar() +
      '<div class="main-content">' + renderNavbar('POS Report - ' + r.report_date) +
      '<div class="page-content" id="page-body" style="overflow-y:auto;">' +

      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">' +
        '<div style="display:flex;gap:10px;align-items:center;">' +
          '<button onclick="window.__posReportsBack()" style="background:#374151;color:#e2e8f0;border:none;border-radius:6px;padding:8px 16px;cursor:pointer;font-size:0.85rem;">\u2190 Back</button>' +
          '<span style="color:#6366f1;font-weight:700;font-size:1rem;">Report for ' + esc(r.report_date) + '</span>' +
        '</div>' +
        '<span style="color:#888;font-size:0.8rem;">Submitted by ' + esc(r.admin_name) + '</span>' +
      '</div>' +

      '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px;">' +
        '<div style="background:#1a1f2e;border:1px solid #2a3040;border-radius:10px;padding:14px;text-align:center;">' +
          '<div style="color:#888;font-size:0.65rem;">TOTAL SALES</div>' +
          '<div style="color:#22c55e;font-weight:700;font-size:1.1rem;">' + formatCurrency(r.total_sales) + '</div></div>' +
        '<div style="background:#1a1f2e;border:1px solid #2a3040;border-radius:10px;padding:14px;text-align:center;">' +
          '<div style="color:#888;font-size:0.65rem;">TRANSACTIONS</div>' +
          '<div style="color:#e2e8f0;font-weight:700;font-size:1.1rem;">' + r.total_transactions + '</div></div>' +
        '<div style="background:#1a1f2e;border:1px solid #6366f130;border-radius:10px;padding:14px;text-align:center;">' +
          '<div style="color:#888;font-size:0.65rem;">ARCADE</div>' +
          '<div style="color:#6366f1;font-weight:700;font-size:1.1rem;">' + formatCurrency(r.arcade_sales) + '</div></div>' +
        '<div style="background:#1a1f2e;border:1px solid #22c55e30;border-radius:10px;padding:14px;text-align:center;">' +
          '<div style="color:#888;font-size:0.65rem;">PLAYHOUSE</div>' +
          '<div style="color:#22c55e;font-weight:700;font-size:1.1rem;">' + formatCurrency(r.playhouse_sales) + '</div></div>' +
      '</div>' +

      '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px;">' +
        '<div style="background:#1a1f2e;border:1px solid #f59e0b30;border-radius:10px;padding:14px;text-align:center;">' +
          '<div style="color:#888;font-size:0.65rem;">CAFE</div>' +
          '<div style="color:#f59e0b;font-weight:700;font-size:1.1rem;">' + formatCurrency(r.cafe_sales) + '</div></div>' +
        '<div style="background:#1a1f2e;border:1px solid #2a3040;border-radius:10px;padding:14px;text-align:center;">' +
          '<div style="color:#888;font-size:0.65rem;">CASH</div>' +
          '<div style="color:#e2e8f0;font-weight:700;font-size:1.1rem;">' + formatCurrency(r.cash_sales) + '</div></div>' +
        '<div style="background:#1a1f2e;border:1px solid #2a3040;border-radius:10px;padding:14px;text-align:center;">' +
          '<div style="color:#888;font-size:0.65rem;">GCASH</div>' +
          '<div style="color:#e2e8f0;font-weight:700;font-size:1.1rem;">' + formatCurrency(r.gcash_sales) + '</div></div>' +
        '<div style="background:#1a1f2e;border:1px solid #2a3040;border-radius:10px;padding:14px;text-align:center;">' +
          '<div style="color:#888;font-size:0.65rem;">CARD</div>' +
          '<div style="color:#e2e8f0;font-weight:700;font-size:1.1rem;">' + formatCurrency(r.card_sales) + '</div></div>' +
      '</div>' +

      (r.notes ? '<div style="background:#1a1f2e;border:1px solid #2a3040;border-radius:12px;padding:16px;margin-bottom:20px;"><div style="color:#94a3b8;font-size:0.75rem;font-weight:600;margin-bottom:6px;">NOTES</div><div style="color:#e2e8f0;font-size:0.9rem;">' + esc(r.notes) + '</div></div>' : '') +

      (items.length > 0 ?
        '<div style="background:#1a1f2e;border:1px solid #2a3040;border-radius:12px;overflow:hidden;">' +
          '<div style="padding:12px 16px;border-bottom:1px solid #2a3040;color:#94a3b8;font-size:0.8rem;font-weight:600;">ITEMS SOLD</div>' +
          '<table style="width:100%;border-collapse:collapse;"><thead><tr style="border-bottom:1px solid #2a3040;">' +
            '<th style="padding:10px 16px;text-align:left;color:#94a3b8;font-size:0.8rem;">PRODUCT</th>' +
            '<th style="padding:10px 16px;text-align:center;color:#94a3b8;font-size:0.8rem;">QTY</th>' +
            '<th style="padding:10px 16px;text-align:right;color:#94a3b8;font-size:0.8rem;">REVENUE</th>' +
          '</tr></thead><tbody>' +
          items.map(function(item) {
            return '<tr style="border-bottom:1px solid #1e2736;">' +
              '<td style="padding:10px 16px;color:#e2e8f0;font-size:0.85rem;">' + esc(item.name) + '</td>' +
              '<td style="padding:10px 16px;text-align:center;color:#e2e8f0;">' + item.quantity + '</td>' +
              '<td style="padding:10px 16px;text-align:right;color:#22c55e;">' + formatCurrency(item.revenue) + '</td>' +
            '</tr>';
          }).join('') +
          '</tbody></table></div>' : '<div style="color:#666;padding:20px;">No items data</div>') +

      '</div></div></div>';

    document.getElementById('logout-btn')?.addEventListener('click', function(e) { e.preventDefault(); Auth.logout(); });
  }

  function render() {
    if (selectedReport) { renderDetail(selectedReport); return; }

    app.innerHTML = '<div class="layout">' + renderSidebar() +
      '<div class="main-content">' + renderNavbar('POS Sales Reports') +
      '<div class="page-content" id="page-body">' +

      '<div style="display:flex;gap:12px;align-items:flex-end;flex-wrap:wrap;margin-bottom:20px;">' +
        '<div><label style="color:#94a3b8;font-size:0.75rem;display:block;margin-bottom:4px;">Branch</label>' +
        '<select id="posr-branch" style="background:#0d1117;border:1px solid #30363d;border-radius:8px;padding:8px 12px;color:#e2e8f0;font-size:0.85rem;">' +
        '<option value="">All Branches</option>' +
        branches.map(function(b) { return '<option value="' + b.id + '"' + (String(b.id) === String(filterBranch) ? ' selected' : '') + '>' + esc(b.name) + '</option>'; }).join('') +
        '</select></div>' +
        '<div><label style="color:#94a3b8;font-size:0.75rem;display:block;margin-bottom:4px;">From</label>' +
        '<input type="date" id="posr-from" style="background:#0d1117;border:1px solid #30363d;border-radius:8px;padding:8px 12px;color:#e2e8f0;font-size:0.85rem;" value="' + dateFrom + '"></div>' +
        '<div><label style="color:#94a3b8;font-size:0.75rem;display:block;margin-bottom:4px;">To</label>' +
        '<input type="date" id="posr-to" style="background:#0d1117;border:1px solid #30363d;border-radius:8px;padding:8px 12px;color:#e2e8f0;font-size:0.85rem;" value="' + dateTo + '"></div>' +
        '<button id="posr-filter" style="padding:8px 20px;border:none;border-radius:8px;background:#6366f1;color:#fff;font-weight:600;font-size:0.85rem;cursor:pointer;">Filter</button>' +
      '</div>' +

      '<div style="background:#1a1f2e;border:1px solid #2a3040;border-radius:12px;overflow:hidden;">' +
      '<table style="width:100%;border-collapse:collapse;">' +
      '<thead><tr style="border-bottom:2px solid #2a3040;">' +
        '<th style="padding:12px 16px;text-align:left;color:#94a3b8;font-size:0.8rem;">DATE</th>' +
        '<th style="padding:12px 16px;text-align:left;color:#94a3b8;font-size:0.8rem;">BRANCH</th>' +
        '<th style="padding:12px 16px;text-align:left;color:#94a3b8;font-size:0.8rem;">SUBMITTED BY</th>' +
        '<th style="padding:12px 16px;text-align:right;color:#94a3b8;font-size:0.8rem;">TOTAL SALES</th>' +
        '<th style="padding:12px 16px;text-align:center;color:#94a3b8;font-size:0.8rem;">TXNS</th>' +
        '<th style="padding:12px 16px;text-align:right;color:#94a3b8;font-size:0.8rem;">ARCADE</th>' +
        '<th style="padding:12px 16px;text-align:right;color:#94a3b8;font-size:0.8rem;">PLAYHOUSE</th>' +
        '<th style="padding:12px 16px;text-align:right;color:#94a3b8;font-size:0.8rem;">CAFE</th>' +
        '<th style="padding:12px 16px;text-align:center;color:#94a3b8;font-size:0.8rem;">ACTION</th>' +
      '</tr></thead><tbody>' +
      (reports.length === 0 ? '<tr><td colspan="9" style="padding:30px;text-align:center;color:#666;">No reports found</td></tr>' :
        reports.map(function(r) {
          return '<tr style="border-bottom:1px solid #1e2736;cursor:pointer;" onmouseenter="this.style.background=\'#1e2736\'" onmouseleave="this.style.background=\'transparent\'">' +
            '<td style="padding:10px 16px;color:#e2e8f0;font-size:0.85rem;font-weight:600;">' + esc(r.report_date) + '</td>' +
            '<td style="padding:10px 16px;color:#94a3b8;font-size:0.85rem;">' + esc(r.branch_name || '-') + '</td>' +
            '<td style="padding:10px 16px;color:#94a3b8;font-size:0.85rem;">' + esc(r.admin_name || '-') + '</td>' +
            '<td style="padding:10px 16px;text-align:right;color:#22c55e;font-weight:600;">' + formatCurrency(r.total_sales) + '</td>' +
            '<td style="padding:10px 16px;text-align:center;color:#e2e8f0;">' + r.total_transactions + '</td>' +
            '<td style="padding:10px 16px;text-align:right;color:#6366f1;">' + formatCurrency(r.arcade_sales) + '</td>' +
            '<td style="padding:10px 16px;text-align:right;color:#22c55e;">' + formatCurrency(r.playhouse_sales) + '</td>' +
            '<td style="padding:10px 16px;text-align:right;color:#f59e0b;">' + formatCurrency(r.cafe_sales) + '</td>' +
            '<td style="padding:10px 16px;text-align:center;"><button onclick="event.stopPropagation();window.__posReportView(' + r.id + ')" style="background:#6366f1;color:#fff;border:none;border-radius:4px;padding:4px 12px;cursor:pointer;font-size:0.75rem;">View</button></td>' +
          '</tr>';
        }).join('')) +
      '</tbody></table></div>' +
      '</div></div></div>';

    attachEvents();
  }

  function attachEvents() {
    document.getElementById('logout-btn')?.addEventListener('click', function(e) { e.preventDefault(); Auth.logout(); });
    document.getElementById('posr-branch')?.addEventListener('change', function(e) { filterBranch = e.target.value; });
    document.getElementById('posr-from')?.addEventListener('change', function(e) { dateFrom = e.target.value; });
    document.getElementById('posr-to')?.addEventListener('change', function(e) { dateTo = e.target.value; });
    document.getElementById('posr-filter')?.addEventListener('click', loadReports);
  }

  function esc(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  window.__posReportView = function(id) {
    selectedReport = reports.find(function(r) { return r.id === id; });
    if (selectedReport) render();
  };

  window.__posReportsBack = function() {
    selectedReport = null;
    render();
  };

  loadData();
}

Router.register('pos-reports', renderPOSReports);
