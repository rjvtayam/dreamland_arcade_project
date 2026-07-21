function renderAdminTracking() {
  var app = document.getElementById('app');
  var sheets = [];
  var branches = [];
  var products = [];
  var selectedBranch = '';
  var view = 'list';
  var activeArea = 'Cafe';
  var editingSheet = null;
  var filterStatus = '';
  var filterArea = '';
  var filterDate = '';

  var AREAS = [
    { id: 'Arcade', icon: '🎮', color: '#6366f1' },
    { id: 'Playhouse', icon: '🏠', color: '#22c55e' },
    { id: 'Cafe', icon: '☕', color: '#f59e0b' }
  ];

  async function loadData() {
    try {
      branches = await apiGet('/branches');
      if (!Array.isArray(branches)) branches = [];
      var user = Auth.getUser();
      if (user && user.role !== 'owner' && user.branch_id) {
        selectedBranch = String(user.branch_id);
      } else if (branches.length > 0 && !selectedBranch) {
        selectedBranch = String(branches[0].id);
      }
      await loadProducts();
      await loadSheets();
    } catch (e) {
      Toast.error('Failed to load data');
    }
  }

  async function loadSheets() {
    try {
      var params = [];
      if (selectedBranch) params.push('branch_id=' + selectedBranch);
      if (filterArea) params.push('area=' + filterArea);
      if (filterDate) params.push('sheet_date=' + filterDate);
      if (filterStatus) params.push('status=' + filterStatus);
      var url = '/tracking-sheets' + (params.length ? '?' + params.join('&') : '');
      sheets = await apiGet(url);
      if (!Array.isArray(sheets)) sheets = [];
    } catch (e) {
      sheets = [];
    }
    render();
  }

  async function loadProducts() {
    try {
      if (!selectedBranch) return;
      products = await apiGet('/tracking-sheets/products/items?branch_id=' + selectedBranch);
      if (!Array.isArray(products)) products = [];
    } catch (e) {
      products = [];
    }
  }

  function createNewSheet(area) {
    var today = new Date().toISOString().split('T')[0];
    var items = products.map(function(p) {
      return {
        item_description: p.name,
        opening: p.stock || 0,
        additional_pcs: 0,
        total_count: p.stock || 0,
        pcs_tracking: 0,
        srp: p.price || 0,
        total_sold: 0,
        amount: 0,
        closing: p.stock || 0
      };
    });
    editingSheet = {
      branch_id: parseInt(selectedBranch),
      area: area,
      sheet_date: today,
      cashier_name: '',
      total_sales: 0,
      total_cash_on_hand: 0,
      expenses: 0,
      others: 0,
      cashflow: 0,
      remarks_short: '',
      remarks_over: '',
      items: items
    };
    activeArea = area;
    view = 'edit';
    render();
  }

  function editSheet(sheet) {
    editingSheet = JSON.parse(JSON.stringify(sheet));
    activeArea = sheet.area;
    view = 'edit';
    render();
  }

  function recalcItem(item) {
    item.total_count = (item.opening || 0) + (item.additional_pcs || 0);
    item.total_sold = (item.total_count || 0) - (item.closing || 0);
    if (item.total_sold < 0) item.total_sold = 0;
    item.amount = (item.total_sold || 0) * (item.srp || 0);
  }

  function recalcSheet() {
    if (!editingSheet || !editingSheet.items) return;
    var totalSales = 0;
    editingSheet.items.forEach(function(item) {
      recalcItem(item);
      totalSales += item.amount || 0;
    });
    editingSheet.total_sales = totalSales;
    editingSheet.cashflow = (editingSheet.total_cash_on_hand || 0) + (editingSheet.expenses || 0) + (editingSheet.others || 0) - totalSales;
  }

  async function saveSheet(submit) {
    if (!editingSheet) return;
    syncFormToSheet();
    recalcSheet();
    try {
      var data = {
        branch_id: editingSheet.branch_id,
        area: editingSheet.area,
        sheet_date: editingSheet.sheet_date,
        cashier_name: editingSheet.cashier_name,
        total_sales: editingSheet.total_sales,
        total_cash_on_hand: editingSheet.total_cash_on_hand,
        expenses: editingSheet.expenses,
        others: editingSheet.others,
        cashflow: editingSheet.cashflow,
        remarks_short: editingSheet.remarks_short,
        remarks_over: editingSheet.remarks_over,
        items: editingSheet.items
      };
      var result;
      if (editingSheet.id) {
        result = await apiPut('/tracking-sheets/' + editingSheet.id, data);
      } else {
        result = await apiPost('/tracking-sheets', data);
      }
      if (submit && result && result.id) {
        await apiPost('/tracking-sheets/' + result.id + '/submit', {});
        Toast.success('Tracking sheet submitted!');
      } else {
        Toast.success(editingSheet.id ? 'Sheet updated!' : 'Sheet created!');
      }
      editingSheet = null;
      view = 'list';
      await loadSheets();
    } catch (e) {
      Toast.error(e.message || 'Failed to save');
    }
  }

  function syncFormToSheet() {
    if (!editingSheet) return;
    var fields = ['ts-cashier', 'ts-date', 'ts-cash', 'ts-expenses', 'ts-others', 'ts-remarks-short', 'ts-remarks-over'];
    var keys = ['cashier_name', 'sheet_date', 'total_cash_on_hand', 'expenses', 'others', 'remarks_short', 'remarks_over'];
    fields.forEach(function(id, i) {
      var el = document.getElementById(id);
      if (el) {
        var val = el.value;
        if (keys[i] === 'total_cash_on_hand' || keys[i] === 'expenses' || keys[i] === 'others') {
          editingSheet[keys[i]] = parseFloat(val) || 0;
        } else {
          editingSheet[keys[i]] = val;
        }
      }
    });
    if (editingSheet.items) {
      editingSheet.items.forEach(function(item, idx) {
        ['opening', 'additional_pcs', 'srp', 'closing'].forEach(function(field) {
          var el = document.querySelector('.ts-item[data-idx="' + idx + '"][data-field="' + field + '"]');
          if (el) item[field] = parseFloat(el.value) || 0;
        });
      });
    }
  }

  async function submitSheet(sheet) {
    if (!confirm('Submit this tracking sheet? It will be locked from further edits.')) return;
    try {
      await apiPost('/tracking-sheets/' + sheet.id + '/submit', {});
      Toast.success('Sheet submitted!');
      await loadSheets();
    } catch (e) {
      Toast.error(e.message || 'Failed to submit');
    }
  }

  function printSheet() {
    var content = document.getElementById('tracking-print-area');
    if (!content) return;
    var w = window.open('', '_blank', 'width=900,height=700');
    w.document.write('<html><head><title>Tracking Sheet</title><style>');
    w.document.write('body{font-family:Arial,sans-serif;margin:20px;font-size:11px;}');
    w.document.write('h2{text-align:center;margin:0 0 4px;font-size:14px;text-transform:uppercase;}');
    w.document.write('.sub{text-align:center;font-size:10px;color:#555;margin-bottom:10px;}');
    w.document.write('table{width:100%;border-collapse:collapse;font-size:10px;}');
    w.document.write('th,td{border:1px solid #333;padding:4px 6px;text-align:center;}');
    w.document.write('th{background:#1a5276;color:#fff;font-size:9px;text-transform:uppercase;}');
    w.document.write('.footer-section{margin-top:12px;border:1px solid #333;padding:8px;}');
    w.document.write('.footer-row{display:flex;gap:8px;margin-bottom:6px;}');
    w.document.write('.footer-label{font-weight:bold;min-width:120px;font-size:10px;}');
    w.document.write('.yellow{background:#f9e79f;}');
    w.document.write('.green{background:#abebc6;}');
    w.document.write('.blue{background:#d6eaf8;}');
    w.document.write('.orange{background:#f5cba7;}');
    w.document.write('</style></head><body>');
    w.document.write(content.innerHTML);
    w.document.write('</body></html>');
    w.document.close();
    w.print();
  }

  function render() {
    var user = Auth.getUser();
    var isOwner = user && user.role === 'owner';

    if (view === 'edit' && editingSheet) {
      renderEditor(isOwner);
      return;
    }

    app.innerHTML = '<div class="layout">' + renderSidebar() +
      '<div class="main-content">' + renderNavbar('Tracking Sheets') +
      '<div class="page-content" id="page-body">' +

      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:12px;">' +
        '<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">' +
          (isOwner ?
            '<select id="ts-branch" style="background:#0d1117;border:1px solid #30363d;border-radius:6px;padding:8px 12px;color:#e2e8f0;font-size:0.85rem;">' +
            branches.map(function(b) { return '<option value="' + b.id + '"' + (String(b.id) === String(selectedBranch) ? ' selected' : '') + '>' + esc(b.name) + '</option>'; }).join('') +
            '</select>' : '<div style="background:#0d1117;border:1px solid #30363d;border-radius:6px;padding:8px 12px;color:#00f0ff;font-size:0.85rem;font-weight:600;">' + esc(user.branch_name || 'Branch') + '</div>') +
          '<select id="ts-filter-area" style="background:#0d1117;border:1px solid #30363d;border-radius:6px;padding:8px 12px;color:#e2e8f0;font-size:0.85rem;">' +
            '<option value="">All Areas</option>' +
            AREAS.map(function(a) { return '<option value="' + a.id + '"' + (filterArea === a.id ? ' selected' : '') + '>' + a.icon + ' ' + a.id + '</option>'; }).join('') +
          '</select>' +
          '<select id="ts-filter-status" style="background:#0d1117;border:1px solid #30363d;border-radius:6px;padding:8px 12px;color:#e2e8f0;font-size:0.85rem;">' +
            '<option value="">All Status</option>' +
            '<option value="draft"' + (filterStatus === 'draft' ? ' selected' : '') + '>Draft</option>' +
            '<option value="submitted"' + (filterStatus === 'submitted' ? ' selected' : '') + '>Submitted</option>' +
          '</select>' +
          '<input type="date" id="ts-filter-date" style="background:#0d1117;border:1px solid #30363d;border-radius:6px;padding:8px 12px;color:#e2e8f0;font-size:0.85rem;" value="' + esc(filterDate) + '">' +
        '</div>' +
        '<div style="display:flex;gap:8px;">' +
          AREAS.map(function(a) {
            return '<button onclick="window.__tsNew(\'' + a.id + '\')" style="background:' + a.color + ';color:#fff;border:none;border-radius:8px;padding:8px 16px;cursor:pointer;font-weight:600;font-size:0.85rem;">+ ' + a.icon + ' ' + a.id + '</button>';
          }).join('') +
        '</div>' +
      '</div>' +

      '<div style="display:grid;gap:12px;">' +
      (sheets.length === 0 ? '<div style="text-align:center;padding:60px;color:#666;">No tracking sheets found. Click a button above to create one.</div>' :
        sheets.map(function(s) {
          var areaObj = AREAS.find(function(a) { return a.id === s.area; });
          var areaColor = areaObj ? areaObj.color : '#6366f1';
          var statusColor = s.status === 'submitted' ? '#22c55e' : '#f59e0b';
          var itemCount = s.items ? s.items.length : 0;
          return '<div style="background:#1a1f2e;border:1px solid #2a3040;border-radius:12px;padding:16px 20px;display:flex;justify-content:space-between;align-items:center;gap:16px;">' +
            '<div style="display:flex;align-items:center;gap:16px;flex:1;">' +
              '<div style="width:48px;height:48px;border-radius:10px;background:' + areaColor + '20;border:1px solid ' + areaColor + ';display:flex;align-items:center;justify-content:center;font-size:1.3rem;">' + (areaObj ? areaObj.icon : '') + '</div>' +
              '<div style="flex:1;">' +
                '<div style="display:flex;align-items:center;gap:8px;">' +
                  '<span style="color:#e2e8f0;font-weight:600;font-size:0.95rem;">' + esc(s.area) + ' Tracking Sheet</span>' +
                  '<span style="background:' + statusColor + '22;color:' + statusColor + ';padding:2px 8px;border-radius:4px;font-size:0.7rem;font-weight:600;">' + s.status.toUpperCase() + '</span>' +
                '</div>' +
                '<div style="color:#888;font-size:0.8rem;margin-top:2px;">' + esc(s.sheet_date || '') + ' | ' + esc(s.cashier_name || 'No cashier') + ' | ' + itemCount + ' items</div>' +
              '</div>' +
            '</div>' +
            '<div style="display:flex;align-items:center;gap:20px;">' +
              '<div style="text-align:right;">' +
                '<div style="color:#888;font-size:0.7rem;">Total Sales</div>' +
                '<div style="color:#e2e8f0;font-weight:700;font-size:1rem;">' + formatCurrency(s.total_sales || 0) + '</div>' +
              '</div>' +
              '<div style="display:flex;gap:6px;">' +
                (s.status === 'draft' ?
                  '<button onclick="window.__tsEdit(' + s.id + ')" style="background:#374151;color:#e2e8f0;border:none;border-radius:6px;padding:6px 14px;cursor:pointer;font-size:0.8rem;">Edit</button>' +
                  '<button onclick="window.__tsSubmit(' + s.id + ')" style="background:#22c55e;color:#fff;border:none;border-radius:6px;padding:6px 14px;cursor:pointer;font-size:0.8rem;font-weight:600;">Submit</button>'
                  :
                  '<button onclick="window.__tsView(' + s.id + ')" style="background:#374151;color:#e2e8f0;border:none;border-radius:6px;padding:6px 14px;cursor:pointer;font-size:0.8rem;">View</button>'
                ) +
              '</div>' +
            '</div>' +
          '</div>';
        }).join('')) +
      '</div>' +

      '</div></div></div>';

    attachListEvents();
  }

  function renderEditor(isOwner) {
    var sheet = editingSheet;
    var areaObj = AREAS.find(function(a) { return a.id === sheet.area; });
    var areaColor = areaObj ? areaObj.color : '#6366f1';
    var isSubmitted = sheet.status === 'submitted';
    var totalItems = sheet.items ? sheet.items.length : 0;
    var inputBg = isSubmitted ? '#111520' : '#0d1117';
    var inputBorder = isSubmitted ? '#1e2736' : '#30363d';
    var inputStyle = 'width:100%;background:' + inputBg + ';border:1px solid ' + inputBorder + ';border-radius:4px;padding:5px 6px;color:#e2e8f0;font-size:0.75rem;box-sizing:border-box;';
    var disabled = isSubmitted ? ' disabled' : '';

    var rowsHtml = '';
    if (sheet.items && sheet.items.length > 0) {
      sheet.items.forEach(function(item, idx) {
        rowsHtml += '<tr style="border-bottom:1px solid #1e2736;' + (idx % 2 === 1 ? 'background:#151a28;' : '') + '">' +
          '<td style="padding:4px;"><input type="number" min="0" class="ts-item" data-idx="' + idx + '" data-field="opening" value="' + (item.opening || 0) + '"' + disabled + ' style="' + inputStyle + '"></td>' +
          '<td style="padding:4px;"><input type="number" min="0" class="ts-item" data-idx="' + idx + '" data-field="additional_pcs" value="' + (item.additional_pcs || 0) + '"' + disabled + ' style="' + inputStyle + '"></td>' +
          '<td style="padding:4px;color:#94a3b8;text-align:center;font-weight:600;">' + (item.total_count || 0) + '</td>' +
          '<td style="padding:4px;text-align:left;color:#e2e8f0;font-weight:500;">' + esc(item.item_description) + '</td>' +
          '<td style="padding:4px;color:#94a3b8;text-align:center;">' + (item.pcs_tracking || 0) + '</td>' +
          '<td style="padding:4px;"><input type="number" min="0" step="0.01" class="ts-item" data-idx="' + idx + '" data-field="srp" value="' + (item.srp || 0) + '"' + disabled + ' style="' + inputStyle + '"></td>' +
          '<td style="padding:4px;color:#22c55e;text-align:center;font-weight:600;">' + (item.total_sold || 0) + '</td>' +
          '<td style="padding:4px;color:#6366f1;text-align:center;font-weight:600;">' + formatCurrency(item.amount || 0) + '</td>' +
          '<td style="padding:4px;"><input type="number" min="0" class="ts-item" data-idx="' + idx + '" data-field="closing" value="' + (item.closing || 0) + '"' + disabled + ' style="' + inputStyle + '"></td>' +
        '</tr>';
      });
    }

    app.innerHTML = '<div class="layout">' + renderSidebar() +
      '<div class="main-content">' + renderNavbar((sheet.id ? 'Edit' : 'New') + ' ' + sheet.area + ' Tracking Sheet') +
      '<div class="page-content" id="page-body" style="overflow-y:auto;">' +

      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:12px;">' +
        '<div style="display:flex;gap:10px;align-items:center;">' +
          '<button onclick="window.__tsBack()" style="background:#374151;color:#e2e8f0;border:none;border-radius:6px;padding:8px 16px;cursor:pointer;font-size:0.85rem;">\u2190 Back</button>' +
          '<span style="color:' + areaColor + ';font-weight:700;font-size:1.1rem;">' + (areaObj ? areaObj.icon : '') + ' ' + esc(sheet.area) + '</span>' +
          '<span style="color:#888;font-size:0.85rem;">' + esc(sheet.sheet_date || '') + '</span>' +
          (sheet.status ? '<span style="background:' + (sheet.status === 'submitted' ? '#22c55e' : '#f59e0b') + '22;color:' + (sheet.status === 'submitted' ? '#22c55e' : '#f59e0b') + ';padding:2px 10px;border-radius:4px;font-size:0.75rem;font-weight:600;">' + sheet.status.toUpperCase() + '</span>' : '') +
        '</div>' +
        '<div style="display:flex;gap:8px;">' +
          (isSubmitted ? '' :
            '<button onclick="window.__tsSave()" style="background:#6366f1;color:#fff;border:none;border-radius:6px;padding:8px 20px;cursor:pointer;font-weight:600;font-size:0.85rem;">Save</button>' +
            '<button onclick="window.__tsSaveSubmit()" style="background:#22c55e;color:#fff;border:none;border-radius:6px;padding:8px 20px;cursor:pointer;font-weight:600;font-size:0.85rem;">Save & Submit</button>'
          ) +
          '<button onclick="window.__tsPrint()" style="background:#f59e0b;color:#fff;border:none;border-radius:6px;padding:8px 16px;cursor:pointer;font-weight:600;font-size:0.85rem;">\uD83D\uDDA8 Print</button>' +
        '</div>' +
      '</div>' +

      '<div style="display:grid;grid-template-columns:1fr 280px;gap:20px;">' +

      '<div style="display:flex;flex-direction:column;gap:16px;">' +

        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">' +
          '<div><label style="color:#94a3b8;font-size:0.75rem;display:block;margin-bottom:4px;">Cashier Name</label>' +
          '<input type="text" id="ts-cashier" value="' + esc(sheet.cashier_name || '') + '"' + disabled + ' style="width:100%;background:' + inputBg + ';border:1px solid ' + inputBorder + ';border-radius:6px;padding:8px;color:#e2e8f0;font-size:0.85rem;"></div>' +
          '<div><label style="color:#94a3b8;font-size:0.75rem;display:block;margin-bottom:4px;">Date</label>' +
          '<input type="date" id="ts-date" value="' + esc(sheet.sheet_date || '') + '"' + disabled + ' style="width:100%;background:' + inputBg + ';border:1px solid ' + inputBorder + ';border-radius:6px;padding:8px;color:#e2e8f0;font-size:0.85rem;"></div>' +
        '</div>' +

        '<div id="tracking-print-area">' +
        '<div style="background:#1a1f2e;border:1px solid #2a3040;border-radius:12px;overflow:hidden;">' +
          '<div style="background:#1a5276;padding:10px 16px;text-align:center;">' +
            '<div style="color:#fff;font-weight:700;font-size:0.9rem;text-transform:uppercase;">DLA ' + esc(sheet.area) + ' Tracking Sheet</div>' +
            '<div style="color:#d6eaf8;font-size:0.7rem;">Items | Stocks | Count | Pcs</div>' +
          '</div>' +
          '<div style="overflow-x:auto;">' +
          '<table style="width:100%;border-collapse:collapse;font-size:0.75rem;">' +
          '<thead><tr style="border-bottom:2px solid #2a3040;">' +
            '<th style="padding:8px 6px;color:#94a3b8;font-size:0.7rem;min-width:60px;">OPENING</th>' +
            '<th style="padding:8px 6px;color:#94a3b8;font-size:0.7rem;min-width:70px;">ADD\'L PCS</th>' +
            '<th style="padding:8px 6px;color:#94a3b8;font-size:0.7rem;min-width:60px;">TOTAL COUNT</th>' +
            '<th style="padding:8px 6px;color:#94a3b8;font-size:0.7rem;min-width:160px;text-align:left;">ITEM DESCRIPTION</th>' +
            '<th style="padding:8px 6px;color:#94a3b8;font-size:0.7rem;min-width:80px;">PCS TRACKING</th>' +
            '<th style="padding:8px 6px;color:#94a3b8;font-size:0.7rem;min-width:70px;">SRP</th>' +
            '<th style="padding:8px 6px;color:#94a3b8;font-size:0.7rem;min-width:60px;">TOTAL SOLD</th>' +
            '<th style="padding:8px 6px;color:#94a3b8;font-size:0.7rem;min-width:80px;">AMOUNT</th>' +
            '<th style="padding:8px 6px;color:#94a3b8;font-size:0.7rem;min-width:60px;">CLOSING</th>' +
          '</tr></thead><tbody>' +
          rowsHtml +
          '</tbody></table></div></div></div>' +

        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:16px;">' +
          '<div><label style="color:#94a3b8;font-size:0.75rem;display:block;margin-bottom:4px;">Remarks (Short)</label>' +
          '<input type="text" id="ts-remarks-short" value="' + esc(sheet.remarks_short || '') + '"' + disabled + ' style="width:100%;background:' + inputBg + ';border:1px solid ' + inputBorder + ';border-radius:6px;padding:8px;color:#e2e8f0;font-size:0.85rem;"></div>' +
          '<div><label style="color:#94a3b8;font-size:0.75rem;display:block;margin-bottom:4px;">Remarks (Over)</label>' +
          '<input type="text" id="ts-remarks-over" value="' + esc(sheet.remarks_over || '') + '"' + disabled + ' style="width:100%;background:' + inputBg + ';border:1px solid ' + inputBorder + ';border-radius:6px;padding:8px;color:#e2e8f0;font-size:0.85rem;"></div>' +
        '</div>' +
      '</div>' +

      '<div style="display:flex;flex-direction:column;gap:12px;">' +
        '<div style="background:#1a1f2e;border:1px solid #2a3040;border-radius:12px;padding:16px;">' +
          '<div style="color:#94a3b8;font-size:0.75rem;font-weight:600;margin-bottom:12px;text-transform:uppercase;">Summary</div>' +
          '<div style="display:flex;flex-direction:column;gap:10px;">' +
            '<div style="display:flex;justify-content:space-between;"><span style="color:#888;font-size:0.8rem;">Cashier</span><span style="color:#e2e8f0;font-weight:600;font-size:0.85rem;">' + esc(sheet.cashier_name || '-') + '</span></div>' +
            '<div style="display:flex;justify-content:space-between;"><span style="color:#888;font-size:0.8rem;">Total Items</span><span style="color:#e2e8f0;font-weight:600;font-size:0.85rem;">' + totalItems + '</span></div>' +
            '<hr style="border:none;border-top:1px solid #2a3040;">' +
            '<div style="display:flex;justify-content:space-between;"><span style="color:#888;font-size:0.8rem;">Total Sales</span><span style="color:#22c55e;font-weight:700;font-size:0.95rem;" data-display="total-sales">' + formatCurrency(sheet.total_sales || 0) + '</span></div>' +
          '</div>' +
        '</div>' +

        '<div style="background:#1a1f2e;border:1px solid #2a3040;border-radius:12px;padding:16px;">' +
          '<div style="color:#94a3b8;font-size:0.75rem;font-weight:600;margin-bottom:12px;text-transform:uppercase;">Cashflow</div>' +
          '<div style="display:flex;flex-direction:column;gap:10px;">' +
            '<div><label style="color:#888;font-size:0.75rem;display:block;margin-bottom:4px;">Total Cash On Hand</label>' +
            '<input type="number" min="0" step="0.01" id="ts-cash" value="' + (sheet.total_cash_on_hand || 0) + '"' + disabled + ' style="width:100%;background:' + inputBg + ';border:1px solid ' + inputBorder + ';border-radius:6px;padding:8px;color:#e2e8f0;font-size:0.85rem;"></div>' +
            '<div><label style="color:#888;font-size:0.75rem;display:block;margin-bottom:4px;">Expenses</label>' +
            '<input type="number" min="0" step="0.01" id="ts-expenses" value="' + (sheet.expenses || 0) + '"' + disabled + ' style="width:100%;background:' + inputBg + ';border:1px solid ' + inputBorder + ';border-radius:6px;padding:8px;color:#e2e8f0;font-size:0.85rem;"></div>' +
            '<div><label style="color:#888;font-size:0.75rem;display:block;margin-bottom:4px;">Others</label>' +
            '<input type="number" min="0" step="0.01" id="ts-others" value="' + (sheet.others || 0) + '"' + disabled + ' style="width:100%;background:' + inputBg + ';border:1px solid ' + inputBorder + ';border-radius:6px;padding:8px;color:#e2e8f0;font-size:0.85rem;"></div>' +
            '<hr style="border:none;border-top:1px solid #2a3040;">' +
            '<div style="display:flex;justify-content:space-between;"><span style="color:#888;font-size:0.8rem;">Cashflow</span><span style="color:#f59e0b;font-weight:700;font-size:0.95rem;" data-display="cashflow">' + formatCurrency(sheet.cashflow || 0) + '</span></div>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '</div>' +

      '</div></div></div>';

    attachEditorEvents();
  }

  function attachListEvents() {
    document.getElementById('logout-btn')?.addEventListener('click', function(e) { e.preventDefault(); Auth.logout(); });
    document.getElementById('ts-branch')?.addEventListener('change', async function(e) {
      selectedBranch = e.target.value;
      await loadProducts();
      await loadSheets();
    });
    document.getElementById('ts-filter-area')?.addEventListener('change', function(e) { filterArea = e.target.value; loadSheets(); });
    document.getElementById('ts-filter-status')?.addEventListener('change', function(e) { filterStatus = e.target.value; loadSheets(); });
    document.getElementById('ts-filter-date')?.addEventListener('change', function(e) { filterDate = e.target.value; loadSheets(); });
  }

  function attachEditorEvents() {
    document.getElementById('logout-btn')?.addEventListener('click', function(e) { e.preventDefault(); Auth.logout(); });

    document.querySelectorAll('.ts-item').forEach(function(input) {
      input.addEventListener('change', function() {
        var idx = parseInt(input.dataset.idx);
        var field = input.dataset.field;
        if (editingSheet && editingSheet.items && editingSheet.items[idx]) {
          editingSheet.items[idx][field] = parseFloat(input.value) || 0;
        }
      });
    });

    ['ts-cashier', 'ts-date', 'ts-cash', 'ts-expenses', 'ts-others', 'ts-remarks-short', 'ts-remarks-over'].forEach(function(id) {
      var el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', function() {});
      }
    });
  }

  function esc(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  window.__tsNew = function(area) { createNewSheet(area); };
  window.__tsBack = function() { editingSheet = null; view = 'list'; loadSheets(); };
  window.__tsEdit = function(id) {
    var s = sheets.find(function(s) { return s.id === id; });
    if (s) editSheet(s);
  };
  window.__tsView = function(id) {
    var s = sheets.find(function(s) { return s.id === id; });
    if (s) editSheet(s);
  };
  window.__tsSubmit = function(id) {
    var s = sheets.find(function(s) { return s.id === id; });
    if (s) submitSheet(s);
  };
  window.__tsSave = function() { saveSheet(false); };
  window.__tsSaveSubmit = function() { saveSheet(true); };
  window.__tsPrint = function() { printSheet(); };

  loadData();
}

Router.register('tracking', renderAdminTracking);
