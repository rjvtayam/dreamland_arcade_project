function renderAdminReports() {
  const app = document.getElementById('app');
  let currentTab = 'attendance';
  let branches = [];
  let filterBranch = '';
  let dateFrom = '';
  let dateTo = '';
  let reportData = null;

  async function loadData() {
    try {
      branches = await apiGet('/branches');
      if (!Array.isArray(branches)) branches = [];
      const today = new Date();
      dateTo = today.toISOString().split('T')[0];
      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      dateFrom = monthAgo.toISOString().split('T')[0];
      render();
    } catch (e) {
      console.error('Failed to load report data:', e);
      Toast.error('Failed to load reports');
    }
  }

  async function fetchReport() {
    const params = [];
    if (filterBranch) params.push('branch_id=' + filterBranch);
    if (dateFrom) params.push('date_from=' + dateFrom);
    if (dateTo) params.push('date_to=' + dateTo);
    const qs = params.length ? '?' + params.join('&') : '';

    try {
      if (currentTab === 'attendance') {
        reportData = await apiGet('/reports/attendance' + qs);
      } else if (currentTab === 'inventory') {
        reportData = await apiGet('/reports/inventory' + qs);
      } else if (currentTab === 'sales') {
        reportData = await apiGet('/reports/sales' + qs);
      }
    } catch (e) {
      console.error('Failed to fetch report:', e);
      reportData = null;
    }
    renderTabContent();
  }

  function render() {
    app.innerHTML = '<div class="layout">' + renderSidebar() +
      '<div class="main-content">' + renderNavbar('Reports') +
      '<div class="page-content" id="page-body">' +
      '<div class="report-tabs">' +
      '<button class="tab-btn' + (currentTab === 'attendance' ? ' active' : '') + '" data-tab="attendance">Attendance</button>' +
      '<button class="tab-btn' + (currentTab === 'inventory' ? ' active' : '') + '" data-tab="inventory">Inventory</button>' +
      '<button class="tab-btn' + (currentTab === 'sales' ? ' active' : '') + '" data-tab="sales">Sales</button>' +
      '</div>' +
      '<div class="report-filters">' +
      '<div class="filter-group">' +
      '<label>Branch:</label>' +
      '<select id="report-branch-filter" class="form-control">' +
      '<option value="">All Branches</option>' +
      branches.map(b => '<option value="' + b.id + '"' + (String(b.id) === String(filterBranch) ? ' selected' : '') + '>' + escapeHtml(b.name || '') + '</option>').join('') +
      '</select>' +
      '</div>' +
      (currentTab !== 'inventory' ?
        '<div class="filter-group">' +
        '<label>From:</label>' +
        '<input type="date" id="report-date-from" class="form-control" value="' + dateFrom + '">' +
        '</div>' +
        '<div class="filter-group">' +
        '<label>To:</label>' +
        '<input type="date" id="report-date-to" class="form-control" value="' + dateTo + '">' +
        '</div>' : '') +
      '<button class="btn btn-primary" id="generate-report-btn">Generate</button>' +
      '</div>' +
      '<div id="report-content"></div>' +
      '</div></div></div>';

    attachEvents();
    fetchReport();
  }

  function attachEvents() {
    document.getElementById('logout-btn')?.addEventListener('click', e => { e.preventDefault(); Auth.logout(); });

    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        currentTab = btn.dataset.tab;
        render();
      });
    });

    document.getElementById('report-branch-filter')?.addEventListener('change', e => { filterBranch = e.target.value; });
    document.getElementById('report-date-from')?.addEventListener('change', e => { dateFrom = e.target.value; });
    document.getElementById('report-date-to')?.addEventListener('change', e => { dateTo = e.target.value; });
    document.getElementById('generate-report-btn')?.addEventListener('click', fetchReport);
  }

  function renderTabContent() {
    const container = document.getElementById('report-content');
    if (!container) return;

    if (currentTab === 'attendance') {
      renderAttendanceReport(container);
    } else if (currentTab === 'inventory') {
      renderInventoryReport(container);
    } else if (currentTab === 'sales') {
      renderSalesReport(container);
    }
  }

  function renderAttendanceReport(container) {
    const data = reportData || {};
    const records = Array.isArray(data.records) ? data.records : (Array.isArray(data) ? data : []);

    const summaryHtml = '<div class="summary-cards">' +
      '<div class="summary-card">' +
      '<div class="summary-label">Total Users</div>' +
      '<div class="summary-value">' + (data.total_users ?? records.length) + '</div>' +
      '</div>' +
      '<div class="summary-card">' +
      '<div class="summary-label">Avg Hours</div>' +
      '<div class="summary-value">' + (data.avg_hours ?? '-') + '</div>' +
      '</div>' +
      '<div class="summary-card">' +
      '<div class="summary-label">Total Late</div>' +
      '<div class="summary-value">' + (data.total_late ?? '-') + '</div>' +
      '</div>' +
      '<div class="summary-card">' +
      '<div class="summary-label">Total OT</div>' +
      '<div class="summary-value">' + (data.total_overtime ?? '-') + '</div>' +
      '</div>' +
      '</div>';

    const tableHtml = '<div class="table-container">' +
      '<table class="data-table">' +
      '<thead><tr>' +
      '<th>Name</th><th>Branch</th><th>Days Present</th><th>Late</th><th>Hours</th><th>Overtime</th>' +
      '</tr></thead>' +
      '<tbody>' +
      (records.length === 0 ? '<tr><td colspan="6" class="no-data">No attendance data</td></tr>' :
        records.map(r => '<tr>' +
          '<td>' + escapeHtml(r.name || r.user_name || ((r.first_name || '') + ' ' + (r.last_name || '')).trim() || '-') + '</td>' +
          '<td>' + escapeHtml(r.branch_name || '-') + '</td>' +
          '<td>' + escapeHtml(String(r.days_present ?? r.days ?? '-')) + '</td>' +
          '<td>' + escapeHtml(String(r.late ?? r.late_count ?? '-')) + '</td>' +
          '<td>' + escapeHtml(String(r.hours ?? r.total_hours ?? '-')) + '</td>' +
          '<td>' + escapeHtml(String(r.overtime ?? r.overtime_hours ?? '-')) + '</td>' +
          '</tr>').join('')) +
      '</tbody></table></div>';

    container.innerHTML = summaryHtml + tableHtml;
  }

  function renderInventoryReport(container) {
    const data = reportData || {};
    const items = Array.isArray(data.items) ? data.items : (Array.isArray(data) ? data : []);
    const byCategory = Array.isArray(data.by_category) ? data.by_category : (data.categories || []);

    const summaryHtml = '<div class="summary-cards">' +
      '<div class="summary-card">' +
      '<div class="summary-label">Total Items</div>' +
      '<div class="summary-value">' + (data.total_items ?? items.length) + '</div>' +
      '</div>' +
      '<div class="summary-card">' +
      '<div class="summary-label">Total Value</div>' +
      '<div class="summary-value">' + (data.total_value != null ? formatCurrency(data.total_value) : '-') + '</div>' +
      '</div>' +
      '<div class="summary-card">' +
      '<div class="summary-label">Low Stock</div>' +
      '<div class="summary-value text-warning">' + (data.low_stock_count ?? '-') + '</div>' +
      '</div>' +
      '<div class="summary-card">' +
      '<div class="summary-label">Out of Stock</div>' +
      '<div class="summary-value text-danger">' + (data.out_of_stock_count ?? '-') + '</div>' +
      '</div>' +
      '</div>';

    let categoryHtml = '';
    if (byCategory.length > 0) {
      categoryHtml = '<h4>By Category</h4>' +
        '<div class="table-container"><table class="data-table">' +
        '<thead><tr><th>Category</th><th>Items</th><th>Total Qty</th><th>Total Value</th></tr></thead>' +
        '<tbody>' +
        byCategory.map(c => '<tr>' +
          '<td>' + escapeHtml(c.category || c.name || '-') + '</td>' +
          '<td>' + escapeHtml(String(c.count ?? c.items ?? '-')) + '</td>' +
          '<td>' + escapeHtml(String(c.total_quantity ?? c.quantity ?? '-')) + '</td>' +
          '<td>' + (c.total_value != null ? formatCurrency(c.total_value) : '-') + '</td>' +
          '</tr>').join('') +
        '</tbody></table></div>';
    }

    let itemsHtml = '';
    if (items.length > 0) {
      itemsHtml = '<h4>Items Detail</h4>' +
        '<div class="table-container"><table class="data-table">' +
        '<thead><tr><th>Name</th><th>Category</th><th>Branch</th><th>Qty</th><th>Unit</th><th>Value</th></tr></thead>' +
        '<tbody>' +
        items.map(i => '<tr>' +
          '<td>' + escapeHtml(i.name || '-') + '</td>' +
          '<td>' + escapeHtml(i.category_name || i.category || '-') + '</td>' +
          '<td>' + escapeHtml(i.branch_name || '-') + '</td>' +
          '<td>' + escapeHtml(String(i.quantity ?? '-')) + '</td>' +
          '<td>' + escapeHtml(i.unit || '-') + '</td>' +
          '<td>' + (i.cost_value != null ? formatCurrency(i.cost_value) : (i.value != null ? formatCurrency(i.value) : '-')) + '</td>' +
          '</tr>').join('') +
        '</tbody></table></div>';
    }

    container.innerHTML = summaryHtml + categoryHtml + itemsHtml;
  }

  function renderSalesReport(container) {
    const data = reportData || {};
    const topProducts = Array.isArray(data.top_products) ? data.top_products : [];
    const summary = data.summary || data;

    const summaryHtml = '<div class="summary-cards">' +
      '<div class="summary-card">' +
      '<div class="summary-label">Total Sales</div>' +
      '<div class="summary-value">' + formatCurrency(summary.total_sales ?? summary.total ?? 0) + '</div>' +
      '</div>' +
      '<div class="summary-card">' +
      '<div class="summary-label">Transactions</div>' +
      '<div class="summary-value">' + (summary.total_transactions ?? summary.transactions ?? '-') + '</div>' +
      '</div>' +
      '<div class="summary-card">' +
      '<div class="summary-label">Avg Sale</div>' +
      '<div class="summary-value">' + formatCurrency(summary.avg_sale ?? 0) + '</div>' +
      '</div>' +
      '<div class="summary-card">' +
      '<div class="summary-label">Items Sold</div>' +
      '<div class="summary-value">' + (summary.items_sold ?? '-') + '</div>' +
      '</div>' +
      '</div>';

    let topProductsHtml = '';
    if (topProducts.length > 0) {
      topProductsHtml = '<h4>Top Products</h4>' +
        '<div class="table-container"><table class="data-table">' +
        '<thead><tr><th>#</th><th>Product</th><th>Quantity</th><th>Revenue</th></tr></thead>' +
        '<tbody>' +
        topProducts.map((p, i) => '<tr>' +
          '<td>' + (i + 1) + '</td>' +
          '<td>' + escapeHtml(p.name || p.product_name || '-') + '</td>' +
          '<td>' + escapeHtml(String(p.quantity ?? p.total_quantity ?? '-')) + '</td>' +
          '<td>' + formatCurrency(p.revenue ?? p.total_revenue ?? 0) + '</td>' +
          '</tr>').join('') +
        '</tbody></table></div>';
    }

    container.innerHTML = summaryHtml + topProductsHtml;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  loadData();
}

Router.register('reports', renderAdminReports);
