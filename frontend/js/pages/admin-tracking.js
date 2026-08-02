function renderAdminTracking() {
  var app = document.getElementById('app');
  var sheets = [];
  var branches = [];
  var products = [];
  var todaySales = [];
  var selectedBranch = '';
  var view = 'list';
  var activeArea = 'Cafe';
  var editingSheet = null;
  var filterStatus = '';
  var filterArea = '';
  var filterDate = '';
  var refreshTimer = null;
  var AREAS = [
    { id: 'Arcade', icon: '🎮', color: '#6366f1' },
    { id: 'Playhouse', icon: '🏠', color: '#22c55e' },
    { id: 'Cafe', icon: '☕', color: '#f59e0b' }
  ];

  function getDefaultData(area) {
    if (area === 'Playhouse') {
      return {
        attractions: [
          { name: 'PHR 150', tracking: 0, e_cash: 0 },
          { name: 'PHR 250', tracking: 0, e_cash: 0 },
          { name: 'PHR 250', tracking: 0, e_cash: 0 },
          { name: 'PHR 350', tracking: 0, e_cash: 0 },
          { name: 'PHR 500', tracking: 0, e_cash: 0 }
        ],
        head_count: [
          { type: 'CHILD', child: 0, senior: 0, total_head: 0, amount: 0, e_cash: 0, total_sales: 0 },
          { type: 'PWD', child: 0, senior: 0, total_head: 0, amount: 0, e_cash: 0, total_sales: 0 },
          { type: 'ADULT', child: 0, senior: 0, total_head: 0, amount: 0, e_cash: 0, total_sales: 0 }
        ],
        cash_denoms: { 1000: 0, 500: 0, 200: 0, 100: 0, 50: 0, 20: 0, 10: 0, 5: 0, 1: 0, 0.25: 0 },
        expenses_list: [],
        recharge: 0,
        e_cash: 0
      };
    }
    if (area === 'Arcade') {
      return {
        stocks: [
          { token: '50', opening: 0, add: 0, total_count: 0, remaining: 0, sold: 0, amount: 0 },
          { token: '100', opening: 0, add: 0, total_count: 0, remaining: 0, sold: 0, amount: 0 },
          { token: '150', opening: 0, add: 0, total_count: 0, remaining: 0, sold: 0, amount: 0 },
          { token: '250', opening: 0, add: 0, total_count: 0, remaining: 0, sold: 0, amount: 0 },
          { token: 'SMASH', opening: 0, add: 0, total_count: 0, remaining: 0, sold: 0, amount: 0 },
          { token: 'EXTRA', opening: 0, add: 0, total_count: 0, remaining: 0, sold: 0, amount: 0 }
        ],
        cash_denoms: { '1000': 0, '500': 0, '200': 0, '100': 0, '50': 0, '20': 0, '10': 0, '5': 0 },
        expenses_list: [],
        remarks_list: [],
        _gcash: 0
      };
    }
    if (area === 'Cafe') {
      return {
        cash_denoms: { 1000: 0, 500: 0, 200: 0, 100: 0, 50: 0, 20: 0, 10: 0, 5: 0, 1: 0, 0.25: 0 },
        expenses_list: [],
        _gcash: 0
      };
    }
    return {};
  }

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
      await Promise.all([loadSheets(), loadTodaySales()]);
      render();
      if (!refreshTimer) {
        refreshTimer = setInterval(async function() {
          if (view !== 'list') return;
          await Promise.all([loadSheets(), loadTodaySales()]);
          render();
        }, 15000);
      }
    } catch (e) {
      Toast.error('Failed to load data');
    }
  }

  async function loadTodaySales() {
    try {
      var params = [];
      if (selectedBranch) params.push('branch_id=' + selectedBranch);
      var url = '/sales/tracking' + (params.length ? '?' + params.join('&') : '');
      todaySales = await apiGet(url);
      if (!Array.isArray(todaySales)) todaySales = [];
    } catch (e) {
      todaySales = [];
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
      data: getDefaultData(area),
      items: []
    };
    if (area === 'Cafe') {
      editingSheet.items = products.map(function(p) {
        return {
          item_description: p.name, opening: p.stock || 0, additional_pcs: 0,
          total_count: p.stock || 0, pcs_tracking: 0, srp: p.price || 0,
          total_sold: 0, amount: 0, closing: p.stock || 0
        };
      });
    }
    activeArea = area;
    view = 'edit';
    render();
  }

  function editSheet(sheet) {
    editingSheet = JSON.parse(JSON.stringify(sheet));
    if (!editingSheet.data) editingSheet.data = getDefaultData(sheet.area);
    activeArea = sheet.area;
    view = 'edit';
    render();
  }

  function syncFormToSheet() {
    if (!editingSheet) return;
    var fields = ['ts-cashier', 'ts-date', 'ts-cash', 'ts-expenses', 'ts-others', 'ts-remarks-short', 'ts-remarks-over'];
    var keys = ['cashier_name', 'sheet_date', 'total_cash_on_hand', 'expenses', 'others', 'remarks_short', 'remarks_over'];
    fields.forEach(function(id, i) {
      var el = document.getElementById(id);
      if (el) {
        if (keys[i] === 'total_cash_on_hand' || keys[i] === 'expenses' || keys[i] === 'others') {
          editingSheet[keys[i]] = parseFloat(el.value) || 0;
        } else {
          editingSheet[keys[i]] = el.value;
        }
      }
    });
    var gcashEl = document.getElementById('ts-gcash');
    if (gcashEl) {
      editingSheet.data._gcash = parseFloat(gcashEl.value) || 0;
    }
    var cashflowEl = document.getElementById('ts-cashflow');
    if (cashflowEl) {
      editingSheet.cashflow = parseFloat(cashflowEl.value) || 0;
    }
  }

  function recalcPlayhouse() {
    var d = editingSheet.data;
    if (!d) return;
    document.querySelectorAll('.ph-attr').forEach(function(inp) {
      var idx = parseInt(inp.dataset.idx);
      var field = inp.dataset.field;
      if (d.attractions && d.attractions[idx]) {
        d.attractions[idx][field] = parseFloat(inp.value) || 0;
      }
    });
    document.querySelectorAll('.ph-hc').forEach(function(inp) {
      var idx = parseInt(inp.dataset.idx);
      var field = inp.dataset.field;
      if (d.head_count && d.head_count[idx]) {
        d.head_count[idx][field] = parseFloat(inp.value) || 0;
      }
    });
    document.querySelectorAll('.ph-cash').forEach(function(inp) {
      var denom = inp.dataset.denom;
      if (d.cash_denoms) {
        d.cash_denoms[denom] = parseFloat(inp.value) || 0;
      }
    });
    document.querySelectorAll('.ph-exp').forEach(function(inp) {
      var idx = parseInt(inp.dataset.idx);
      var field = inp.dataset.field;
      if (d.expenses_list && d.expenses_list[idx]) {
        d.expenses_list[idx][field] = field === 'desc' ? inp.value : (parseFloat(inp.value) || 0);
      }
    });
    var attractionTotal = 0;
    var attractionEcash = 0;
    if (d.attractions) {
      d.attractions.forEach(function(a) {
        var match = a.name.match(/(\d+)/);
        var price = match ? parseInt(match[1]) : 0;
        a.tracking = parseInt(a.tracking) || 0;
        a.e_cash = parseFloat(a.e_cash) || 0;
        a.amount = a.tracking * price;
        attractionTotal += a.amount;
        attractionEcash += a.e_cash;
      });
    }
    var headcountTotal = 0;
    var headcountEcash = 0;
    if (d.head_count) {
      d.head_count.forEach(function(h) {
        h.child = parseInt(h.child) || 0;
        h.senior = parseInt(h.senior) || 0;
        h.total_head = h.child + h.senior;
        h.amount = parseFloat(h.amount) || 0;
        h.e_cash = parseFloat(h.e_cash) || 0;
        h.total_sales = h.amount + h.e_cash;
        headcountTotal += h.total_sales;
        headcountEcash += h.e_cash;
      });
    }
    var totalSales = attractionTotal + headcountTotal;
    var totalEcash = attractionEcash + headcountEcash;
    editingSheet.total_sales = totalSales;
    d.e_cash = totalEcash;
    var cashDenomTotal = 0;
    if (d.cash_denoms) {
      Object.keys(d.cash_denoms).forEach(function(k) {
        cashDenomTotal += (parseFloat(d.cash_denoms[k]) || 0) * parseFloat(k);
      });
    }
    var expensesTotal = 0;
    if (d.expenses_list) {
      d.expenses_list.forEach(function(ex) { expensesTotal += parseFloat(ex.amount) || 0; });
    }
    d._cash_denom_total = cashDenomTotal;
    d._expenses_total = expensesTotal;
    d._total_sales = totalSales;
    editingSheet.data.cash_total = cashDenomTotal;
    editingSheet.total_cash_on_hand = cashDenomTotal;
  }

  function recalcCafe() {
    var d = editingSheet.data;
    if (!d) return;
    document.querySelectorAll('.ts-item').forEach(function(inp) {
      var idx = parseInt(inp.dataset.idx);
      var field = inp.dataset.field;
      if (editingSheet.items && editingSheet.items[idx]) {
        editingSheet.items[idx][field] = parseFloat(inp.value) || 0;
      }
    });
    var totalSales = 0;
    if (editingSheet.items) {
      editingSheet.items.forEach(function(item) {
        item.total_count = (parseInt(item.opening) || 0) + (parseInt(item.additional_pcs) || 0);
        item.total_sold = Math.max(0, item.total_count - (parseInt(item.closing) || 0));
        item.amount = (item.total_sold || 0) * (parseFloat(item.srp) || 0);
        totalSales += item.amount;
      });
    }
    var cashDenomTotal = 0;
    if (d.cash_denoms) {
      Object.keys(d.cash_denoms).forEach(function(k) {
        cashDenomTotal += (parseFloat(d.cash_denoms[k]) || 0) * parseFloat(k);
      });
    }
    var expensesTotal = 0;
    if (d.expenses_list) {
      d.expenses_list.forEach(function(ex) { expensesTotal += parseFloat(ex.amount) || 0; });
    }
    editingSheet.total_sales = totalSales;
    d._total_sales = totalSales;
    d._cash_denom_total = cashDenomTotal;
    d._expenses_total = expensesTotal;
    editingSheet.total_cash_on_hand = cashDenomTotal;
  }

  async function saveSheet(submit) {
    if (!editingSheet) return;
    syncFormToSheet();
    if (editingSheet.area === 'Arcade') {
      recalcArcade();
    } else if (editingSheet.area === 'Cafe') {
      recalcCafe();
    } else {
      recalcPlayhouse();
    }
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
        data: editingSheet.data,
        items: editingSheet.items || []
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
      render();
    } catch (e) {
      Toast.error(e.message || 'Failed to save');
    }
  }

  async function submitSheet(sheet) {
    if (!await confirmAsync('Submit this tracking sheet? It will be locked from further edits.', 'Submit Sheet', 'success')) return;
    try {
      await apiPost('/tracking-sheets/' + sheet.id + '/submit', {});
      Toast.success('Sheet submitted!');
      await loadSheets();
      render();
    } catch (e) {
      Toast.error(e.message || 'Failed to submit');
    }
  }

  function printSheet() {
    var content = document.getElementById('tracking-print-area');
    if (!content) return;
    var w = window.open('', '_blank', 'width=900,height=700');
    w.document.write('<html><head><title>Tracking Sheet</title><style>');
    w.document.write('body{font-family:Arial,sans-serif;margin:15px;font-size:10px;}');
    w.document.write('h2{text-align:center;margin:0 0 4px;font-size:13px;text-transform:uppercase;}');
    w.document.write('.sub{text-align:center;font-size:9px;color:#555;margin-bottom:8px;}');
    w.document.write('table{width:100%;border-collapse:collapse;font-size:9px;}');
    w.document.write('th,td{border:1px solid #333;padding:3px 5px;text-align:center;}');
    w.document.write('th{background:#1a5276;color:#fff;font-size:8px;text-transform:uppercase;}');
    w.document.write('.section-title{background:#d4e6f1;font-weight:bold;color:#1a5276;text-align:center;font-size:10px;}');
    w.document.write('.footer-label{font-weight:bold;text-align:left;font-size:9px;}');
    w.document.write('.yellow{background:#f9e79f;}');
    w.document.write('.green{background:#abebc6;}');
    w.document.write('.blue{background:#d6eaf8;}');
    w.document.write('.orange{background:#f5cba7;}');
    w.document.write('.pink{background:#f5b7b1;}');
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
      if (editingSheet.area === 'Playhouse') renderPlayhouseEditor(isOwner);
      else if (editingSheet.area === 'Arcade') renderArcadeEditor(isOwner);
      else if (editingSheet.area === 'Cafe') renderCafeEditor(isOwner);
      else renderCafeEditor(isOwner);
      return;
    }

    var today = new Date().toISOString().split('T')[0];
    var todaySheets = sheets.filter(function(s) { return s.sheet_date === today; });
    var todayCount = todaySheets.length;
    var arcadeSales = 0, playhouseSales = 0, cafeSales = 0;
    todaySales.forEach(function(s) {
      if (s.area === 'Arcade') arcadeSales = s.total_sales || 0;
      else if (s.area === 'Playhouse') playhouseSales = s.total_sales || 0;
      else if (s.area === 'Cafe') cafeSales = s.total_sales || 0;
    });
    var totalSales = arcadeSales + playhouseSales + cafeSales;
    var totalTxns = todaySales.reduce(function(sum, s) { return sum + (s.total_transactions || 0); }, 0);
    var submittedCount = sheets.filter(function(s) { return s.status === 'submitted'; }).length;
    var draftCount = sheets.filter(function(s) { return s.status === 'draft'; }).length;

    var TRACK_LOGO = '<svg width="40" height="40" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="dl-tr1" x1="6" y1="6" x2="42" y2="42"><stop stop-color="#22c55e"/><stop offset="1" stop-color="#06b6d4"/></linearGradient></defs><rect x="2" y="2" width="44" height="44" rx="12" fill="#0a0e1a" stroke="url(#dl-tr1)" stroke-width="1.5"/><path d="M10 18c0-1.2 1-2.2 2.2-2.4l5-.8c1.6-.3 2.8 1 2.8 2.6v12c0 1.6-1.2 2.9-2.8 2.6l-5-.8c-1.2-.2-2.2-1.2-2.2-2.4V18z" stroke="url(#dl-tr1)" stroke-width="1.8" fill="none"/><circle cx="15" cy="19" r="1.5" fill="#22c55e"/><circle cx="19" cy="23" r="1.5" fill="#06b6d4"/><path d="M28 18c0-1.2 1-2.2 2.2-2.4l5-.8c1.6-.3 2.8 1 2.8 2.6v12c0 1.6-1.2 2.9-2.8 2.6l-5-.8c-1.2-.2-2.2-1.2-2.2-2.4V18z" stroke="url(#dl-tr1)" stroke-width="1.8" fill="none"/><circle cx="33" cy="19" r="1.5" fill="#22c55e"/><circle cx="37" cy="23" r="1.5" fill="#06b6d4"/><path d="M14 15h20" stroke="url(#dl-tr1)" stroke-width="1.8" stroke-linecap="round"/></svg>';

    var FILTER_SELECT = 'background:#0d1117;border:1px solid #1e293b;border-radius:8px;padding:8px 12px;color:#e2e8f0;font-size:0.82rem;outline:none;cursor:pointer;transition:border 0.2s;';

    app.innerHTML = '<div class="layout">' + renderSidebar() +
      '<div class="main-content">' + renderNavbar('Tracking') +
      '<div class="page-content" id="page-body">' +

      '<div style="position:relative;margin-bottom:28px;">' +
        '<div style="position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,#22c55e,#06b6d4,#22c55e);border-radius:1px;opacity:0.6;"></div>' +
        '<div style="padding-top:20px;display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;">' +
          '<div style="display:flex;align-items:center;gap:14px;">' +
            TRACK_LOGO +
            '<div>' +
              '<h2 style="color:#e2e8f0;margin:0;font-size:1.2rem;font-weight:800;letter-spacing:0.3px;">Tracking</h2>' +
              '<div style="color:#22c55e;font-size:0.6rem;text-transform:uppercase;letter-spacing:2px;margin-top:2px;">Arcade Tracking Receipts & Reports</div>' +
            '</div>' +
          '</div>' +
          '<div style="display:flex;gap:8px;">' +
            AREAS.map(function(a) {
              return '<button onclick="window.__tsNew(\'' + a.id + '\')" style="background:linear-gradient(135deg,' + a.color + ',' + a.color + 'cc);color:#fff;border:none;border-radius:8px;padding:8px 16px;cursor:pointer;font-weight:600;font-size:0.8rem;box-shadow:0 2px 8px ' + a.color + '30;display:flex;align-items:center;gap:5px;transition:all 0.2s;" onmouseenter="this.style.transform=\'translateY(-1px)\';this.style.boxShadow=\'0 4px 12px ' + a.color + '40\'" onmouseleave="this.style.transform=\'translateY(0)\';this.style.boxShadow=\'0 2px 8px ' + a.color + '30\'">+ ' + a.icon + ' ' + a.id + '</button>';
            }).join('') +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:10px;">' +
        '<div style="background:linear-gradient(135deg,#0f172a,#1e293b);border:1px solid #1e293b;border-radius:14px;padding:18px 16px;position:relative;overflow:hidden;transition:all 0.3s;" onmouseenter="this.style.borderColor=#475569;this.style.transform=\'translateY(-2px)\'" onmouseleave="this.style.borderColor=\'#1e293b\';this.style.transform=\'translateY(0)\'">' +
          '<div style="position:absolute;top:0;right:0;width:60px;height:60px;background:radial-gradient(circle,rgba(34,197,94,0.08),transparent);"></div>' +
          '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">' +
            '<div style="width:32px;height:32px;border-radius:8px;background:rgba(34,197,94,0.12);display:flex;align-items:center;justify-content:center;"><svg width="16" height="16" fill="none" stroke="#22c55e" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg></div>' +
            '<div style="color:#64748b;font-size:0.65rem;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Today\'s Reports</div>' +
          '</div>' +
          '<div style="color:#4ade80;font-size:1.6rem;font-weight:800;">' + todayCount + '</div>' +
        '</div>' +
        '<div style="background:linear-gradient(135deg,#0f172a,#1e293b);border:1px solid #1e293b;border-radius:14px;padding:18px 16px;position:relative;overflow:hidden;transition:all 0.3s;" onmouseenter="this.style.borderColor=#475569;this.style.transform=\'translateY(-2px)\'" onmouseleave="this.style.borderColor=\'#1e293b\';this.style.transform=\'translateY(0)\'">' +
          '<div style="position:absolute;top:0;right:0;width:60px;height:60px;background:radial-gradient(circle,rgba(6,182,212,0.08),transparent);"></div>' +
          '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">' +
            '<div style="width:32px;height:32px;border-radius:8px;background:rgba(6,182,212,0.12);display:flex;align-items:center;justify-content:center;"><svg width="16" height="16" fill="none" stroke="#06b6d4" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div>' +
            '<div style="color:#64748b;font-size:0.65rem;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Submitted</div>' +
          '</div>' +
          '<div style="color:#67e8f9;font-size:1.6rem;font-weight:800;">' + submittedCount + '<span style="font-size:0.7rem;color:#64748b;margin-left:4px;">/ ' + draftCount + ' drafts</span></div>' +
        '</div>' +
        '<div style="background:linear-gradient(135deg,#0f172a,#1e293b);border:1px solid #1e293b;border-radius:14px;padding:18px 16px;position:relative;overflow:hidden;transition:all 0.3s;" onmouseenter="this.style.borderColor=#475569;this.style.transform=\'translateY(-2px)\'" onmouseleave="this.style.borderColor=\'#1e293b\';this.style.transform=\'translateY(0)\'">' +
          '<div style="position:absolute;top:0;right:0;width:60px;height:60px;background:radial-gradient(circle,rgba(245,158,11,0.08),transparent);"></div>' +
          '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">' +
            '<div style="width:32px;height:32px;border-radius:8px;background:rgba(245,158,11,0.12);display:flex;align-items:center;justify-content:center;"><svg width="16" height="16" fill="none" stroke="#f59e0b" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg></div>' +
            '<div style="color:#64748b;font-size:0.65rem;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Transactions</div>' +
          '</div>' +
          '<div style="color:#fbbf24;font-size:1.6rem;font-weight:800;">' + totalTxns + '</div>' +
        '</div>' +
      '</div>' +

      '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:24px;">' +
        '<div style="background:linear-gradient(135deg,#0f172a,#1e293b);border:1px solid #6366f130;border-radius:14px;padding:18px 16px;position:relative;overflow:hidden;transition:all 0.3s;" onmouseenter="this.style.borderColor=#6366f1;this.style.transform=\'translateY(-2px)\'" onmouseleave="this.style.borderColor=\'#6366f130\';this.style.transform=\'translateY(0)\'">' +
          '<div style="position:absolute;top:0;right:0;width:60px;height:60px;background:radial-gradient(circle,rgba(99,102,241,0.08),transparent);"></div>' +
          '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">' +
            '<div style="width:32px;height:32px;border-radius:8px;background:rgba(99,102,241,0.12);display:flex;align-items:center;justify-content:center;font-size:1rem;">🎮</div>' +
            '<div style="color:#64748b;font-size:0.65rem;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Arcade</div>' +
          '</div>' +
          '<div style="color:#a5b4fc;font-size:1.4rem;font-weight:800;">' + formatCurrency(arcadeSales) + '</div>' +
        '</div>' +
        '<div style="background:linear-gradient(135deg,#0f172a,#1e293b);border:1px solid #22c55e30;border-radius:14px;padding:18px 16px;position:relative;overflow:hidden;transition:all 0.3s;" onmouseenter="this.style.borderColor=#22c55e;this.style.transform=\'translateY(-2px)\'" onmouseleave="this.style.borderColor=\'#22c55e30\';this.style.transform=\'translateY(0)\'">' +
          '<div style="position:absolute;top:0;right:0;width:60px;height:60px;background:radial-gradient(circle,rgba(34,197,94,0.08),transparent);"></div>' +
          '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">' +
            '<div style="width:32px;height:32px;border-radius:8px;background:rgba(34,197,94,0.12);display:flex;align-items:center;justify-content:center;font-size:1rem;">🏠</div>' +
            '<div style="color:#64748b;font-size:0.65rem;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Playhouse</div>' +
          '</div>' +
          '<div style="color:#4ade80;font-size:1.4rem;font-weight:800;">' + formatCurrency(playhouseSales) + '</div>' +
        '</div>' +
        '<div style="background:linear-gradient(135deg,#0f172a,#1e293b);border:1px solid #f59e0b30;border-radius:14px;padding:18px 16px;position:relative;overflow:hidden;transition:all 0.3s;" onmouseenter="this.style.borderColor=#f59e0b;this.style.transform=\'translateY(-2px)\'" onmouseleave="this.style.borderColor=\'#f59e0b30\';this.style.transform=\'translateY(0)\'">' +
          '<div style="position:absolute;top:0;right:0;width:60px;height:60px;background:radial-gradient(circle,rgba(245,158,11,0.08),transparent);"></div>' +
          '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">' +
            '<div style="width:32px;height:32px;border-radius:8px;background:rgba(245,158,11,0.12);display:flex;align-items:center;justify-content:center;font-size:1rem;">☕</div>' +
            '<div style="color:#64748b;font-size:0.65rem;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Cafe</div>' +
          '</div>' +
          '<div style="color:#fbbf24;font-size:1.4rem;font-weight:800;">' + formatCurrency(cafeSales) + '</div>' +
        '</div>' +
        '<div style="background:linear-gradient(135deg,#0f172a,#1e293b);border:1px solid #06b6d430;border-radius:14px;padding:18px 16px;position:relative;overflow:hidden;transition:all 0.3s;" onmouseenter="this.style.borderColor=#06b6d4;this.style.transform=\'translateY(-2px)\'" onmouseleave="this.style.borderColor=\'#06b6d430\';this.style.transform=\'translateY(0)\'">' +
          '<div style="position:absolute;top:0;right:0;width:60px;height:60px;background:radial-gradient(circle,rgba(6,182,212,0.08),transparent);"></div>' +
          '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">' +
            '<div style="width:32px;height:32px;border-radius:8px;background:rgba(6,182,212,0.12);display:flex;align-items:center;justify-content:center;"><svg width="16" height="16" fill="none" stroke="#06b6d4" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div>' +
            '<div style="color:#64748b;font-size:0.65rem;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Total Sales</div>' +
          '</div>' +
          '<div style="color:#67e8f9;font-size:1.4rem;font-weight:800;">' + formatCurrency(totalSales) + '</div>' +
        '</div>' +
      '</div>' +

      '<div style="display:flex;gap:10px;margin-bottom:20px;flex-wrap:wrap;align-items:center;">' +
        (isOwner ?
          '<div style="position:relative;">' +
            '<svg width="14" height="14" fill="none" stroke="#64748b" viewBox="0 0 24 24" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);pointer-events:none;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>' +
            '<select id="ts-branch" style="' + FILTER_SELECT + 'padding-left:32px;">' +
            branches.map(function(b) { return '<option value="' + b.id + '"' + (String(b.id) === String(selectedBranch) ? ' selected' : '') + '>' + esc(b.name) + '</option>'; }).join('') +
            '</select></div>' : '<div style="background:rgba(0,240,255,0.06);border:1px solid rgba(0,240,255,0.2);border-radius:8px;padding:8px 14px;color:#00f0ff;font-size:0.82rem;font-weight:600;">' + esc(user.branch_name || 'Branch') + '</div>') +
        '<div style="display:flex;gap:4px;background:#0d1117;border:1px solid #1e293b;border-radius:8px;padding:3px;">' +
          '<button class="ts-area-btn" data-area="" style="padding:6px 14px;border:none;border-radius:6px;font-size:0.78rem;font-weight:600;cursor:pointer;transition:all 0.2s;background:' + (!filterArea ? 'rgba(99,102,241,0.2);color:#a78bfa;' : 'transparent;color:#64748b;') + '">All</button>' +
          AREAS.map(function(a) { return '<button class="ts-area-btn" data-area="' + a.id + '" style="padding:6px 14px;border:none;border-radius:6px;font-size:0.78rem;font-weight:600;cursor:pointer;transition:all 0.2s;display:flex;align-items:center;gap:4px;background:' + (filterArea === a.id ? a.color + '22;color:' + a.color + ';' : 'transparent;color:#64748b;') + '">' + a.icon + ' ' + a.id + '</button>'; }).join('') +
        '</div>' +
        '<div style="position:relative;">' +
          '<svg width="14" height="14" fill="none" stroke="#64748b" viewBox="0 0 24 24" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);pointer-events:none;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>' +
          '<select id="ts-filter-status" style="' + FILTER_SELECT + 'padding-left:32px;">' +
            '<option value="">All Status</option>' +
            '<option value="draft"' + (filterStatus === 'draft' ? ' selected' : '') + '>Draft</option>' +
            '<option value="submitted"' + (filterStatus === 'submitted' ? ' selected' : '') + '>Submitted</option>' +
          '</select>' +
        '</div>' +
        '<input type="date" id="ts-filter-date" style="' + FILTER_SELECT + '" value="' + esc(filterDate) + '">' +
      '</div>' +

      '<div style="display:grid;gap:12px;">' +
      (sheets.length === 0 ?
        '<div style="text-align:center;padding:60px 20px;color:#475569;background:#0f172a;border:1px solid #1e293b;border-radius:14px;">' +
          '<svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="margin:0 auto 12px;display:block;opacity:0.2;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>' +
          '<div style="font-size:0.9rem;color:#64748b;">No tracking sheets found</div>' +
          '<div style="font-size:0.75rem;color:#475569;margin-top:4px;">Create a new tracking sheet using the buttons above</div>' +
        '</div>' :
        sheets.map(function(s) {
          var areaObj = AREAS.find(function(a) { return a.id === s.area; });
          var areaColor = areaObj ? areaObj.color : '#6366f1';
          var areaIcon = areaObj ? areaObj.icon : '';
          var isDraft = s.status === 'draft';
          var statusColor = isDraft ? '#f59e0b' : '#22c55e';
          var statusBg = isDraft ? 'rgba(245,158,11,0.1)' : 'rgba(34,197,94,0.1)';
          var itemCount = s.items ? s.items.length : 0;
          var dateStr = s.sheet_date || '';
          var displayDate = dateStr;
          if (dateStr) {
            try { displayDate = new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); } catch(e) {}
          }
          var isToday = dateStr === today;
          var cashDenomTotal = 0;
          if (s.data && s.data.cash_denoms) {
            Object.keys(s.data.cash_denoms).forEach(function(k) {
              cashDenomTotal += (parseFloat(s.data.cash_denoms[k]) || 0) * parseFloat(k);
            });
          }

          return '<div style="background:#0f172a;border:1px solid #1e293b;border-radius:14px;padding:0;display:flex;align-items:stretch;overflow:hidden;transition:all 0.25s;" onmouseenter="this.style.borderColor=#334155;this.style.boxShadow=\'0 4px 20px rgba(0,0,0,0.3)\'" onmouseleave="this.style.borderColor=\'#1e293b\';this.style.boxShadow=\'none\'">' +
            '<div style="width:4px;background:' + areaColor + ';flex-shrink:0;"></div>' +
            '<div style="flex:1;padding:18px 20px;display:flex;align-items:center;gap:16px;min-width:0;">' +
              '<div style="width:48px;height:48px;border-radius:12px;background:' + areaColor + '15;border:1px solid ' + areaColor + '33;display:flex;align-items:center;justify-content:center;font-size:1.4rem;flex-shrink:0;">' + areaIcon + '</div>' +
              '<div style="flex:1;min-width:0;">' +
                '<div style="display:flex;align-items:center;gap:10px;margin-bottom:3px;flex-wrap:wrap;">' +
                  '<div style="color:#e2e8f0;font-weight:600;font-size:0.95rem;">' + esc(s.area) + ' Tracking Sheet</div>' +
                  '<span style="display:inline-flex;align-items:center;gap:4px;background:' + statusBg + ';color:' + statusColor + ';padding:3px 10px;border-radius:20px;font-size:0.65rem;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;border:1px solid ' + statusColor + '22;">' +
                    (isDraft ? '<svg width="10" height="10" fill="none" stroke="' + statusColor + '" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>' : '<svg width="10" height="10" fill="none" stroke="' + statusColor + '" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>') +
                    ' ' + s.status + '</span>' +
                  (isToday ? '<span style="background:rgba(6,182,212,0.1);color:#67e8f9;padding:2px 8px;border-radius:12px;font-size:0.6rem;font-weight:600;border:1px solid rgba(6,182,212,0.2);">TODAY</span>' : '') +
                '</div>' +
                '<div style="display:flex;gap:16px;flex-wrap:wrap;align-items:center;">' +
                  '<div style="display:flex;align-items:center;gap:5px;color:#94a3b8;font-size:0.78rem;">' +
                    '<svg width="13" height="13" fill="none" stroke="#6366f1" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>' +
                    '<span style="color:#c4b5fd;font-weight:500;">' + displayDate + '</span>' +
                  '</div>' +
                  (s.cashier_name ? '<div style="display:flex;align-items:center;gap:5px;color:#94a3b8;font-size:0.78rem;">' +
                    '<svg width="13" height="13" fill="none" stroke="#f59e0b" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>' +
                    esc(s.cashier_name) +
                  '</div>' : '') +
                  (itemCount > 0 ? '<div style="display:flex;align-items:center;gap:5px;color:#94a3b8;font-size:0.78rem;">' +
                    '<svg width="13" height="13" fill="none" stroke="#64748b" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>' +
                    itemCount + ' items</div>' : '') +
                '</div>' +
              '</div>' +
              '<div style="display:flex;align-items:center;gap:20px;flex-shrink:0;">' +
                '<div style="text-align:right;">' +
                  '<div style="color:#64748b;font-size:0.65rem;text-transform:uppercase;letter-spacing:0.5px;">Cash Denoms</div>' +
                  '<div style="color:#a5b4fc;font-weight:700;font-size:0.85rem;">' + formatCurrency(cashDenomTotal) + '</div>' +
                '</div>' +
                '<div style="text-align:right;">' +
                  '<div style="color:#64748b;font-size:0.65rem;text-transform:uppercase;letter-spacing:0.5px;">Total Sales</div>' +
                  '<div style="color:#4ade80;font-weight:700;font-size:1rem;">' + formatCurrency(s.total_sales || 0) + '</div>' +
                '</div>' +
                '<div style="display:flex;gap:6px;">' +
                  (isDraft ?
                    '<button onclick="window.__tsEdit(' + s.id + ')" style="padding:7px 14px;border:1px solid #6366f1;border-radius:8px;background:rgba(99,102,241,0.1);color:#a5b4fc;font-size:0.75rem;font-weight:600;cursor:pointer;transition:all 0.2s;display:flex;align-items:center;gap:4px;" onmouseenter="this.style.background=\'rgba(99,102,241,0.2)\';this.style.boxShadow=\'0 0 12px rgba(99,102,241,0.2)\'" onmouseleave="this.style.background=\'rgba(99,102,241,0.1)\';this.style.boxShadow=\'none\'">' +
                      '<svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>Edit</button>' +
                    '<button onclick="window.__tsSubmit(' + s.id + ')" style="padding:7px 14px;border:1px solid #22c55e;border-radius:8px;background:rgba(34,197,94,0.1);color:#4ade80;font-size:0.75rem;font-weight:600;cursor:pointer;transition:all 0.2s;display:flex;align-items:center;gap:4px;" onmouseenter="this.style.background=\'rgba(34,197,94,0.2)\';this.style.boxShadow=\'0 0 12px rgba(34,197,94,0.2)\'" onmouseleave="this.style.background=\'rgba(34,197,94,0.1)\';this.style.boxShadow=\'none\'">' +
                      '<svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>Submit</button>'
                    :
                    '<button onclick="window.__tsView(' + s.id + ')" style="padding:7px 14px;border:1px solid #30363d;border-radius:8px;background:rgba(255,255,255,0.03);color:#94a3b8;font-size:0.75rem;font-weight:600;cursor:pointer;transition:all 0.2s;display:flex;align-items:center;gap:4px;" onmouseenter="this.style.borderColor=\'#475569\';this.style.color=\'#e2e8f0\'" onmouseleave="this.style.borderColor=\'#30363d\';this.style.color=\'#94a3b8\'">' +
                      '<svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>View</button>'
                  ) +
                  '<button onclick="window.__tsSoftDelete(' + s.id + ')" title="Delete" style="padding:7px 8px;border:1px solid #1e293b;border-radius:8px;background:transparent;color:#64748b;cursor:pointer;transition:all 0.2s;" onmouseenter="this.style.borderColor=\'#ef4444\';this.style.color=\'#f87171\';this.style.background=\'rgba(239,68,68,0.08)\'" onmouseleave="this.style.borderColor=\'#1e293b\';this.style.color=\'#64748b\';this.style.background=\'transparent\'">' +
                    '<svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>' +
                  '</button>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>';
        }).join('')) +
      '</div>' +

      '</div></div></div>';

    attachListEvents();
  }

  function renderHeaderButtons(isSubmitted) {
    return '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:12px;">' +
      '<div style="display:flex;gap:10px;align-items:center;">' +
        '<button onclick="window.__tsBack()" style="background:#374151;color:#e2e8f0;border:none;border-radius:6px;padding:8px 16px;cursor:pointer;font-size:0.85rem;">\u2190 Back</button>' +
        '<span style="color:' + (AREAS.find(function(a){return a.id===editingSheet.area;})||{}).color + ';font-weight:700;font-size:1.1rem;">' +
          ((AREAS.find(function(a){return a.id===editingSheet.area;})||{}).icon||'') + ' ' + esc(editingSheet.area) + '</span>' +
        '<span style="color:#888;font-size:0.85rem;">' + esc(editingSheet.sheet_date || '') + '</span>' +
        (editingSheet.status ? '<span style="background:' + (editingSheet.status==='submitted'?'#22c55e':'#f59e0b') + '22;color:' + (editingSheet.status==='submitted'?'#22c55e':'#f59e0b') + ';padding:2px 10px;border-radius:4px;font-size:0.75rem;font-weight:600;">' + editingSheet.status.toUpperCase() + '</span>' : '') +
      '</div>' +
      '<div style="display:flex;gap:8px;">' +
        (isSubmitted ? '' :
          '<button onclick="window.__tsSave()" style="background:#6366f1;color:#fff;border:none;border-radius:6px;padding:8px 20px;cursor:pointer;font-weight:600;font-size:0.85rem;">Save</button>' +
          '<button onclick="window.__tsSaveSubmit()" style="background:#22c55e;color:#fff;border:none;border-radius:6px;padding:8px 20px;cursor:pointer;font-weight:600;font-size:0.85rem;">Save & Submit</button>'
        ) +
        '<button onclick="window.__tsPrint()" style="background:#f59e0b;color:#fff;border:none;border-radius:6px;padding:8px 16px;cursor:pointer;font-weight:600;font-size:0.85rem;">\uD83D\uDDA8 Print</button>' +
      '</div>' +
    '</div>';
  }

  function renderPlayhouseEditor(isOwner) {
    var sheet = editingSheet;
    var d = sheet.data || getDefaultData('Playhouse');
    var isSubmitted = sheet.status === 'submitted';
    var dis = isSubmitted ? ' disabled' : '';
    var inp = 'width:100%;background:#0d1117;border:1px solid #30363d;border-radius:4px;padding:5px 6px;color:#e2e8f0;font-size:0.8rem;box-sizing:border-box;text-align:center;';
    var inpL = inp.replace('text-align:center;', 'text-align:left;');

    var attractRows = '';
    if (d.attractions) {
      d.attractions.forEach(function(a, i) {
        var amount = a.amount || (a.tracking || 0) * (parseInt(a.name.match(/(\d+)/)?.[1]) || 0);
        attractRows += '<tr style="border-bottom:1px solid #1e2736;' + (i%2===1 ? 'background:#151a28;' : '') + '">' +
          '<td style="padding:6px;color:#e2e8f0;font-weight:600;text-align:left;">' + esc(a.name) + '</td>' +
          '<td style="padding:4px;"><input type="number" min="0" class="ph-attr" data-idx="' + i + '" data-field="tracking" value="' + (a.tracking||0) + '"' + dis + ' style="' + inp + '"></td>' +
          '<td style="padding:4px;"><input type="number" min="0" class="ph-attr" data-idx="' + i + '" data-field="e_cash" value="' + (a.e_cash||0) + '"' + dis + ' style="' + inp + '"></td>' +
          '<td style="padding:6px;color:#6366f1;font-weight:600;">' + formatCurrency(amount) + '</td>' +
        '</tr>';
      });
    }

    var hcRows = '';
    if (d.head_count) {
      d.head_count.forEach(function(h, i) {
        hcRows += '<tr style="border-bottom:1px solid #1e2736;">' +
          '<td style="padding:6px;color:#e2e8f0;font-weight:600;">' + esc(h.type) + '</td>' +
          '<td style="padding:4px;"><input type="number" min="0" class="ph-hc" data-idx="' + i + '" data-field="child" value="' + (h.child||0) + '"' + dis + ' style="' + inp + '"></td>' +
          '<td style="padding:4px;"><input type="number" min="0" class="ph-hc" data-idx="' + i + '" data-field="senior" value="' + (h.senior||0) + '"' + dis + ' style="' + inp + '"></td>' +
          '<td style="padding:6px;color:#22c55e;font-weight:600;">' + (h.total_head||0) + '</td>' +
          '<td style="padding:4px;"><input type="number" min="0" step="0.01" class="ph-hc" data-idx="' + i + '" data-field="amount" value="' + (h.amount||0) + '"' + dis + ' style="' + inp + '"></td>' +
          '<td style="padding:4px;"><input type="number" min="0" step="0.01" class="ph-hc" data-idx="' + i + '" data-field="e_cash" value="' + (h.e_cash||0) + '"' + dis + ' style="' + inp + '"></td>' +
          '<td style="padding:6px;color:#f59e0b;font-weight:600;">' + formatCurrency(h.total_sales||0) + '</td>' +
        '</tr>';
      });
    }

    var cashDenomRows = '';
    var denoms = [1000, 500, 200, 100, 50, 20, 10, 5, 1, 0.25];
    denoms.forEach(function(k) {
      var val = d.cash_denoms ? (d.cash_denoms[k] || 0) : 0;
      var total = val * k;
      cashDenomRows += '<tr style="border-bottom:1px solid #1e2736;">' +
        '<td style="padding:4px;color:#e2e8f0;font-weight:600;">' + (k >= 100 ? k : (k === 0.25 ? '0.25' : k)) + '</td>' +
        '<td style="padding:4px;"><input type="number" min="0" class="ph-cash" data-denom="' + k + '" value="' + val + '"' + dis + ' style="' + inp + '"></td>' +
        '<td style="padding:4px;color:#6366f1;font-weight:600;">' + formatCurrency(total) + '</td>' +
      '</tr>';
    });

    var expenseRows = '';
    if (d.expenses_list && d.expenses_list.length > 0) {
      d.expenses_list.forEach(function(ex, i) {
        expenseRows += '<tr style="border-bottom:1px solid #1e2736;">' +
          '<td style="padding:4px;"><input type="text" class="ph-exp" data-idx="' + i + '" data-field="desc" value="' + esc(ex.desc||'') + '"' + dis + ' style="' + inpL + '"></td>' +
          '<td style="padding:4px;"><input type="number" min="0" step="0.01" class="ph-exp" data-idx="' + i + '" data-field="amount" value="' + (ex.amount||0) + '"' + dis + ' style="' + inp + '"></td>' +
        '</tr>';
      });
    }

    recalcPlayhouse();
    var cashDenomTotal = 0;
    if (d.cash_denoms) { denoms.forEach(function(k) { cashDenomTotal += (parseFloat(d.cash_denoms[k])||0)*k; }); }

    app.innerHTML = '<div class="layout">' + renderSidebar() +
      '<div class="main-content">' + renderNavbar('Playhouse Tracking Sheet') +
      '<div class="page-content" id="page-body" style="overflow-y:auto;">' +
      renderHeaderButtons(isSubmitted) +

      '<div style="display:grid;grid-template-columns:1fr 260px;gap:20px;">' +
      '<div id="tracking-print-area">' +

        '<div style="background:#1a1f2e;border:1px solid #2a3040;border-radius:12px;overflow:hidden;margin-bottom:16px;">' +
          '<div style="background:#1a5276;padding:10px 16px;text-align:center;">' +
            '<div style="color:#fff;font-weight:700;font-size:0.9rem;">DLA PLAYHOUSE TRACKING SHEET</div>' +
          '</div>' +

          '<div style="padding:12px;">' +
            '<div style="color:#f59e0b;font-weight:700;font-size:0.8rem;margin-bottom:8px;">ATTRACTIONS</div>' +
            '<table style="width:100%;border-collapse:collapse;font-size:0.8rem;">' +
            '<thead><tr style="border-bottom:2px solid #2a3040;">' +
              '<th style="padding:6px;color:#94a3b8;text-align:left;">ATTRACTIONS</th>' +
              '<th style="padding:6px;color:#94a3b8;">TRACKING PER AMOUNT</th>' +
              '<th style="padding:6px;color:#94a3b8;">E-CASH</th>' +
              '<th style="padding:6px;color:#94a3b8;">AMOUNT</th>' +
            '</tr></thead><tbody>' + attractRows + '</tbody></table>' +
          '</div>' +

          '<div style="padding:12px;border-top:1px solid #2a3040;">' +
            '<div style="color:#22c55e;font-weight:700;font-size:0.8rem;margin-bottom:8px;">SALES (HEAD COUNT)</div>' +
            '<table style="width:100%;border-collapse:collapse;font-size:0.8rem;">' +
            '<thead><tr style="border-bottom:2px solid #2a3040;">' +
              '<th style="padding:6px;color:#94a3b8;"></th>' +
              '<th style="padding:6px;color:#94a3b8;">CHILD</th>' +
              '<th style="padding:6px;color:#94a3b8;">SENIOR</th>' +
              '<th style="padding:6px;color:#94a3b8;">TOTAL HEAD</th>' +
              '<th style="padding:6px;color:#94a3b8;">AMOUNT</th>' +
              '<th style="padding:6px;color:#94a3b8;">E-CASH</th>' +
              '<th style="padding:6px;color:#94a3b8;">TOTAL SALES</th>' +
            '</tr></thead><tbody>' + hcRows + '</tbody></table>' +
          '</div>' +

          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;padding:12px;border-top:1px solid #2a3040;">' +
            '<div>' +
              '<div style="color:#ef4444;font-weight:700;font-size:0.8rem;margin-bottom:8px;">EXPENSES</div>' +
              '<table style="width:100%;border-collapse:collapse;font-size:0.8rem;">' +
              '<thead><tr style="border-bottom:2px solid #2a3040;">' +
                '<th style="padding:6px;color:#94a3b8;text-align:left;">DESC</th>' +
                '<th style="padding:6px;color:#94a3b8;">AMOUNT</th>' +
              '</tr></thead><tbody>' +
              (expenseRows || '<tr><td colspan="2" style="padding:6px;color:#666;">No expenses</td></tr>') +
              '</tbody></table>' +
              (isSubmitted ? '' : '<button onclick="window.__tsAddExpense()" style="margin-top:6px;background:#374151;color:#e2e8f0;border:none;border-radius:4px;padding:4px 10px;cursor:pointer;font-size:0.7rem;">+ Add</button>') +
            '</div>' +
            '<div>' +
              '<div style="color:#6366f1;font-weight:700;font-size:0.8rem;margin-bottom:8px;">CASH</div>' +
              '<table style="width:100%;border-collapse:collapse;font-size:0.8rem;">' +
              '<thead><tr style="border-bottom:2px solid #2a3040;">' +
                '<th style="padding:6px;color:#94a3b8;">BILL</th>' +
                '<th style="padding:6px;color:#94a3b8;">QTY</th>' +
                '<th style="padding:6px;color:#94a3b8;">TOTAL</th>' +
              '</tr></thead><tbody>' + cashDenomRows + '</tbody></table>' +
            '</div>' +
          '</div>' +

          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:12px;border-top:1px solid #2a3040;">' +
            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">' +
              '<div><label style="color:#888;font-size:0.7rem;display:block;margin-bottom:3px;">CASHIER NAME</label>' +
              '<input type="text" id="ts-cashier" value="' + esc(sheet.cashier_name||'') + '"' + dis + ' style="width:100%;background:#0d1117;border:1px solid #30363d;border-radius:4px;padding:6px;color:#e2e8f0;font-size:0.8rem;"></div>' +
              '<div><label style="color:#888;font-size:0.7rem;display:block;margin-bottom:3px;">DATE</label>' +
              '<input type="date" id="ts-date" value="' + esc(sheet.sheet_date||'') + '"' + dis + ' style="width:100%;background:#0d1117;border:1px solid #30363d;border-radius:4px;padding:6px;color:#e2e8f0;font-size:0.8rem;"></div>' +
              '<div><label style="color:#888;font-size:0.7rem;display:block;margin-bottom:3px;">CASHFLOW</label>' +
              '<input type="number" min="0" step="0.01" id="ts-cashflow" value="' + (sheet.cashflow||0) + '"' + dis + ' style="width:100%;background:#0d1117;border:1px solid #30363d;border-radius:4px;padding:6px;color:#f59e0b;font-weight:700;font-size:0.85rem;"></div>' +
              '<div><label style="color:#888;font-size:0.7rem;display:block;margin-bottom:3px;">REMARKS</label>' +
              '<input type="text" id="ts-remarks-short" value="' + esc(sheet.remarks_short||'') + '"' + dis + ' style="width:100%;background:#0d1117;border:1px solid #30363d;border-radius:4px;padding:6px;color:#e2e8f0;font-size:0.8rem;"></div>' +
            '</div>' +
            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">' +
              '<div><label style="color:#888;font-size:0.7rem;display:block;margin-bottom:3px;">E-CASH</label>' +
              '<div style="background:#0d1117;border:1px solid #30363d;border-radius:4px;padding:6px;color:#22c55e;font-weight:700;font-size:0.9rem;">' + formatCurrency(d.e_cash||0) + '</div></div>' +
              '<div><label style="color:#888;font-size:0.7rem;display:block;margin-bottom:3px;">TOTAL SALES</label>' +
              '<div style="background:#0d1117;border:1px solid #30363d;border-radius:4px;padding:6px;color:#22c55e;font-weight:700;font-size:0.9rem;">' + formatCurrency(sheet.total_sales||0) + '</div></div>' +
              '<div><label style="color:#888;font-size:0.7rem;display:block;margin-bottom:3px;">TOTAL CASH OH (Auto)</label>' +
              '<input type="number" readonly id="ts-cash" value="' + (sheet.total_cash_on_hand||0) + '"' + dis + ' style="width:100%;background:#0d1117;border:1px solid #30363d;border-radius:4px;padding:6px;color:#a78bfa;font-size:0.8rem;cursor:not-allowed;"></div>' +
              '<div><label style="color:#888;font-size:0.7rem;display:block;margin-bottom:3px;">OTHERS</label>' +
              '<input type="number" min="0" step="0.01" id="ts-others" value="' + (sheet.others||0) + '"' + dis + ' style="width:100%;background:#0d1117;border:1px solid #30363d;border-radius:4px;padding:6px;color:#e2e8f0;font-size:0.8rem;"></div>' +
            '</div>' +
          '</div>' +

          '<div style="padding:12px;border-top:1px solid #2a3040;">' +
            '<label style="color:#888;font-size:0.7rem;display:block;margin-bottom:3px;">OTHERS | NOTES</label>' +
            '<input type="text" id="ts-remarks-over" value="' + esc(sheet.remarks_over||'') + '"' + dis + ' style="width:100%;background:#0d1117;border:1px solid #30363d;border-radius:4px;padding:6px;color:#e2e8f0;font-size:0.8rem;">' +
          '</div>' +

        '</div>' +
      '</div>' +

      '<div style="display:flex;flex-direction:column;gap:12px;">' +
        '<div style="background:#1a1f2e;border:1px solid #2a3040;border-radius:12px;padding:16px;">' +
          '<div style="color:#94a3b8;font-size:0.75rem;font-weight:600;margin-bottom:12px;text-transform:uppercase;">Summary</div>' +
          '<div style="display:flex;flex-direction:column;gap:8px;">' +
            '<div style="display:flex;justify-content:space-between;"><span style="color:#888;font-size:0.8rem;">Cashier</span><span style="color:#e2e8f0;font-weight:600;font-size:0.85rem;">' + esc(sheet.cashier_name||'-') + '</span></div>' +
            '<div style="display:flex;justify-content:space-between;"><span style="color:#888;font-size:0.8rem;">Cash Denoms</span><span id="ts-summary-cash-denom" style="color:#6366f1;font-weight:600;font-size:0.85rem;">' + formatCurrency(d._cash_denom_total||0) + '</span></div>' +
            '<div style="display:flex;justify-content:space-between;"><span style="color:#888;font-size:0.8rem;">E-Cash</span><span id="ts-summary-ecash" style="color:#22c55e;font-weight:600;font-size:0.85rem;">' + formatCurrency(d.e_cash||0) + '</span></div>' +
            '<div style="display:flex;justify-content:space-between;"><span style="color:#888;font-size:0.8rem;">Expenses</span><span id="ts-summary-expenses" style="color:#ef4444;font-weight:600;font-size:0.85rem;">' + formatCurrency(d._expenses_total||0) + '</span></div>' +
            '<hr style="border:none;border-top:1px solid #2a3040;">' +
            '<div style="display:flex;justify-content:space-between;"><span style="color:#888;font-size:0.8rem;">Total Sales</span><span id="ts-summary-sales" style="color:#22c55e;font-weight:700;font-size:1rem;">' + formatCurrency(sheet.total_sales||0) + '</span></div>' +
            '<div style="display:flex;justify-content:space-between;"><span style="color:#888;font-size:0.8rem;">Cash OH</span><span id="ts-summary-cash-oh" style="color:#a78bfa;font-weight:700;font-size:0.85rem;">' + formatCurrency(sheet.total_cash_on_hand||0) + '</span></div>' +
            '<div style="display:flex;justify-content:space-between;"><span style="color:#888;font-size:0.8rem;">Cashflow</span><span id="ts-summary-cashflow" style="color:#f59e0b;font-weight:700;font-size:1rem;">' + formatCurrency(sheet.cashflow||0) + '</span></div>' +
          '</div>' +
        '</div>' +
        '<div style="background:#1a1f2e;border:1px solid #2a3040;border-radius:12px;padding:12px;">' +
          '<div id="ts-tally-badge" style="text-align:center;padding:8px;border-radius:8px;font-weight:700;font-size:0.9rem;margin-bottom:8px;"></div>' +
          '<div id="ts-tally-section"></div>' +
        '</div>' +
      '</div>' +

      '</div></div></div>';

    attachPlayhouseEvents();
    updatePlayhouseDisplay();
  }

  function renderCafeEditor(isOwner) {
    var sheet = editingSheet;
    var d = sheet.data || getDefaultData('Cafe');
    if (!d.cash_denoms) d.cash_denoms = getDefaultData('Cafe').cash_denoms;
    if (!d.expenses_list) d.expenses_list = [];
    var isSubmitted = sheet.status === 'submitted';
    var dis = isSubmitted ? ' disabled' : '';
    var inp = 'width:100%;background:#0d1117;border:1px solid #30363d;border-radius:4px;padding:5px 6px;color:#e2e8f0;font-size:0.75rem;box-sizing:border-box;';
    var inpL = inp.replace('text-align:center;', 'text-align:left;');
    var totalItems = sheet.items ? sheet.items.length : 0;

    var rowsHtml = '';
    if (sheet.items && sheet.items.length > 0) {
      sheet.items.forEach(function(item, idx) {
        rowsHtml += '<tr style="border-bottom:1px solid #1e2736;' + (idx%2===1 ? 'background:#151a28;' : '') + '">' +
          '<td style="padding:4px;"><input type="number" min="0" class="ts-item" data-idx="' + idx + '" data-field="opening" value="' + (item.opening||0) + '"' + dis + ' style="' + inp + '"></td>' +
          '<td style="padding:4px;"><input type="number" min="0" class="ts-item" data-idx="' + idx + '" data-field="additional_pcs" value="' + (item.additional_pcs||0) + '"' + dis + ' style="' + inp + '"></td>' +
          '<td style="padding:4px;color:#94a3b8;text-align:center;font-weight:600;">' + (item.total_count||0) + '</td>' +
          '<td style="padding:4px;text-align:left;color:#e2e8f0;font-weight:500;">' + esc(item.item_description) + '</td>' +
          '<td style="padding:4px;"><input type="number" min="0" step="0.01" class="ts-item" data-idx="' + idx + '" data-field="srp" value="' + (item.srp||0) + '"' + dis + ' style="' + inp + '"></td>' +
          '<td style="padding:4px;color:#22c55e;text-align:center;font-weight:600;">' + (item.total_sold||0) + '</td>' +
          '<td style="padding:4px;color:#6366f1;text-align:center;font-weight:600;">' + formatCurrency(item.amount||0) + '</td>' +
          '<td style="padding:4px;"><input type="number" min="0" class="ts-item" data-idx="' + idx + '" data-field="closing" value="' + (item.closing||0) + '"' + dis + ' style="' + inp + '"></td>' +
        '</tr>';
      });
    }

    var cafeDenomRows = '';
    var denoms = [1000, 500, 200, 100, 50, 20, 10, 5, 1, 0.25];
    denoms.forEach(function(k) {
      var val = d.cash_denoms ? (d.cash_denoms[k] || 0) : 0;
      var total = val * k;
      cafeDenomRows += '<tr style="border-bottom:1px solid #1e2736;">' +
        '<td style="padding:4px;color:#e2e8f0;font-weight:600;">' + (k >= 100 ? k : (k === 0.25 ? '0.25' : k)) + '</td>' +
        '<td style="padding:4px;"><input type="number" min="0" class="cafe-cash" data-denom="' + k + '" value="' + val + '"' + dis + ' style="' + inp + '"></td>' +
        '<td style="padding:4px;color:#6366f1;font-weight:600;">' + formatCurrency(total) + '</td>' +
      '</tr>';
    });

    var cafeExpenseRows = '';
    if (d.expenses_list && d.expenses_list.length > 0) {
      d.expenses_list.forEach(function(ex, i) {
        cafeExpenseRows += '<tr style="border-bottom:1px solid #1e2736;">' +
          '<td style="padding:4px;"><input type="text" class="cafe-exp" data-idx="' + i + '" data-field="desc" value="' + esc(ex.desc||'') + '"' + dis + ' style="' + inpL + '"></td>' +
          '<td style="padding:4px;"><input type="number" min="0" step="0.01" class="cafe-exp" data-idx="' + i + '" data-field="amount" value="' + (ex.amount||0) + '"' + dis + ' style="' + inp + '"></td>' +
        '</tr>';
      });
    }

    recalcCafe();

    app.innerHTML = '<div class="layout">' + renderSidebar() +
      '<div class="main-content">' + renderNavbar('Cafe Tracking Sheet') +
      '<div class="page-content" id="page-body" style="overflow-y:auto;">' +
      renderHeaderButtons(isSubmitted) +

      '<div style="display:grid;grid-template-columns:1fr 260px;gap:20px;">' +
      '<div id="tracking-print-area">' +
        '<div style="background:#1a1f2e;border:1px solid #2a3040;border-radius:12px;overflow:hidden;">' +
          '<div style="background:#1a5276;padding:10px 16px;text-align:center;">' +
            '<div style="color:#fff;font-weight:700;font-size:0.9rem;">DLA CAFE TRACKING SHEET</div>' +
            '<div style="color:#d6eaf8;font-size:0.7rem;">Items | Stocks | Count | Pcs</div>' +
          '</div>' +
          '<div style="overflow-x:auto;">' +
          '<table style="width:100%;border-collapse:collapse;font-size:0.75rem;">' +
          '<thead><tr style="border-bottom:2px solid #2a3040;">' +
            '<th style="padding:8px 6px;color:#94a3b8;min-width:60px;">OPENING</th>' +
            '<th style="padding:8px 6px;color:#94a3b8;min-width:70px;">ADD\'L PCS</th>' +
            '<th style="padding:8px 6px;color:#94a3b8;min-width:60px;">TOTAL COUNT</th>' +
            '<th style="padding:8px 6px;color:#94a3b8;min-width:160px;text-align:left;">ITEM DESCRIPTION</th>' +
            '<th style="padding:8px 6px;color:#94a3b8;min-width:70px;">SRP</th>' +
            '<th style="padding:8px 6px;color:#94a3b8;min-width:60px;">TOTAL SOLD</th>' +
            '<th style="padding:8px 6px;color:#94a3b8;min-width:80px;">AMOUNT</th>' +
            '<th style="padding:8px 6px;color:#94a3b8;min-width:60px;">CLOSING</th>' +
          '</tr></thead><tbody>' + rowsHtml + '</tbody></table></div></div>' +

          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;padding:12px;margin-top:16px;border:1px solid #2a3040;border-radius:12px;background:#1a1f2e;">' +
            '<div>' +
              '<div style="color:#ef4444;font-weight:700;font-size:0.8rem;margin-bottom:8px;">EXPENSES</div>' +
              '<table style="width:100%;border-collapse:collapse;font-size:0.8rem;">' +
              '<thead><tr style="border-bottom:2px solid #2a3040;">' +
                '<th style="padding:6px;color:#94a3b8;text-align:left;">DESC</th>' +
                '<th style="padding:6px;color:#94a3b8;">AMOUNT</th>' +
              '</tr></thead><tbody>' +
              (cafeExpenseRows || '<tr><td colspan="2" style="padding:6px;color:#666;">No expenses</td></tr>') +
              '</tbody></table>' +
              (isSubmitted ? '' : '<button onclick="window.__tsAddExpense()" style="margin-top:6px;background:#374151;color:#e2e8f0;border:none;border-radius:4px;padding:4px 10px;cursor:pointer;font-size:0.7rem;">+ Add</button>') +
            '</div>' +
            '<div>' +
              '<div style="color:#6366f1;font-weight:700;font-size:0.8rem;margin-bottom:8px;">CASH</div>' +
              '<table style="width:100%;border-collapse:collapse;font-size:0.8rem;">' +
              '<thead><tr style="border-bottom:2px solid #2a3040;">' +
                '<th style="padding:6px;color:#94a3b8;">BILL</th>' +
                '<th style="padding:6px;color:#94a3b8;">QTY</th>' +
                '<th style="padding:6px;color:#94a3b8;">TOTAL</th>' +
              '</tr></thead><tbody>' + cafeDenomRows + '</tbody></table>' +
            '</div>' +
          '</div>' +

          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:12px;margin-top:16px;border:1px solid #2a3040;border-radius:12px;background:#1a1f2e;">' +
            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">' +
              '<div><label style="color:#888;font-size:0.7rem;display:block;margin-bottom:3px;">CASHIER NAME</label>' +
              '<input type="text" id="ts-cashier" value="' + esc(sheet.cashier_name||'') + '"' + dis + ' style="width:100%;background:#0d1117;border:1px solid #30363d;border-radius:4px;padding:6px;color:#e2e8f0;font-size:0.8rem;"></div>' +
              '<div><label style="color:#888;font-size:0.7rem;display:block;margin-bottom:3px;">DATE</label>' +
              '<input type="date" id="ts-date" value="' + esc(sheet.sheet_date||'') + '"' + dis + ' style="width:100%;background:#0d1117;border:1px solid #30363d;border-radius:4px;padding:6px;color:#e2e8f0;font-size:0.8rem;"></div>' +
              '<div><label style="color:#888;font-size:0.7rem;display:block;margin-bottom:3px;">G-CASH</label>' +
              '<input type="number" min="0" step="0.01" id="ts-gcash" value="' + (d._gcash||0) + '"' + dis + ' style="width:100%;background:#0d1117;border:1px solid #30363d;border-radius:4px;padding:6px;color:#22c55e;font-weight:700;font-size:0.85rem;"></div>' +
              '<div><label style="color:#888;font-size:0.7rem;display:block;margin-bottom:3px;">CASHFLOW</label>' +
              '<input type="number" min="0" step="0.01" id="ts-cashflow" value="' + (sheet.cashflow||0) + '"' + dis + ' style="width:100%;background:#0d1117;border:1px solid #30363d;border-radius:4px;padding:6px;color:#f59e0b;font-weight:700;font-size:0.85rem;"></div>' +
            '</div>' +
            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">' +
              '<div><label style="color:#888;font-size:0.7rem;display:block;margin-bottom:3px;">TOTAL SALES</label>' +
              '<div style="background:#0d1117;border:1px solid #30363d;border-radius:4px;padding:6px;color:#22c55e;font-weight:700;font-size:0.9rem;">' + formatCurrency(sheet.total_sales||0) + '</div></div>' +
              '<div><label style="color:#888;font-size:0.7rem;display:block;margin-bottom:3px;">TOTAL CASH OH (Auto)</label>' +
              '<input type="number" readonly id="ts-cash" value="' + (sheet.total_cash_on_hand||0) + '"' + dis + ' style="width:100%;background:#0d1117;border:1px solid #30363d;border-radius:4px;padding:6px;color:#a78bfa;font-size:0.8rem;cursor:not-allowed;"></div>' +
              '<div><label style="color:#888;font-size:0.7rem;display:block;margin-bottom:3px;">EXPENSES</label>' +
              '<input type="number" min="0" step="0.01" id="ts-expenses" value="' + (sheet.expenses||0) + '"' + dis + ' style="width:100%;background:#0d1117;border:1px solid #30363d;border-radius:4px;padding:6px;color:#e2e8f0;font-size:0.8rem;"></div>' +
              '<div><label style="color:#888;font-size:0.7rem;display:block;margin-bottom:3px;">OTHERS</label>' +
              '<input type="number" min="0" step="0.01" id="ts-others" value="' + (sheet.others||0) + '"' + dis + ' style="width:100%;background:#0d1117;border:1px solid #30363d;border-radius:4px;padding:6px;color:#e2e8f0;font-size:0.8rem;"></div>' +
            '</div>' +
          '</div>' +

          '<div style="padding:12px;margin-top:12px;border:1px solid #2a3040;border-radius:12px;background:#1a1f2e;">' +
            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">' +
              '<div><label style="color:#888;font-size:0.7rem;display:block;margin-bottom:3px;">REMARKS (Short)</label>' +
              '<input type="text" id="ts-remarks-short" value="' + esc(sheet.remarks_short||'') + '"' + dis + ' style="width:100%;background:#0d1117;border:1px solid #30363d;border-radius:4px;padding:6px;color:#e2e8f0;font-size:0.8rem;"></div>' +
              '<div><label style="color:#888;font-size:0.7rem;display:block;margin-bottom:3px;">REMARKS (Over)</label>' +
              '<input type="text" id="ts-remarks-over" value="' + esc(sheet.remarks_over||'') + '"' + dis + ' style="width:100%;background:#0d1117;border:1px solid #30363d;border-radius:4px;padding:6px;color:#e2e8f0;font-size:0.8rem;"></div>' +
            '</div>' +
          '</div>' +
        '</div>' +

        '<div style="display:flex;flex-direction:column;gap:12px;">' +
          '<div style="background:#1a1f2e;border:1px solid #2a3040;border-radius:12px;padding:16px;">' +
            '<div style="color:#94a3b8;font-size:0.75rem;font-weight:600;margin-bottom:12px;text-transform:uppercase;">Summary</div>' +
            '<div style="display:flex;flex-direction:column;gap:8px;">' +
              '<div style="display:flex;justify-content:space-between;"><span style="color:#888;font-size:0.8rem;">Cashier</span><span style="color:#e2e8f0;font-weight:600;">' + esc(sheet.cashier_name||'-') + '</span></div>' +
              '<div style="display:flex;justify-content:space-between;"><span style="color:#888;font-size:0.8rem;">Total Items</span><span style="color:#e2e8f0;font-weight:600;">' + totalItems + '</span></div>' +
              '<div style="display:flex;justify-content:space-between;"><span style="color:#888;font-size:0.8rem;">Cash Denoms</span><span id="ts-summary-cash-denom" style="color:#6366f1;font-weight:600;">' + formatCurrency(d._cash_denom_total||0) + '</span></div>' +
              '<div style="display:flex;justify-content:space-between;"><span style="color:#888;font-size:0.8rem;">Expenses</span><span id="ts-summary-expenses" style="color:#ef4444;font-weight:600;">' + formatCurrency(d._expenses_total||0) + '</span></div>' +
              '<div style="display:flex;justify-content:space-between;"><span style="color:#888;font-size:0.8rem;">G-Cash</span><span id="ts-summary-gcash" style="color:#22c55e;font-weight:600;">' + formatCurrency(d._gcash||0) + '</span></div>' +
              '<hr style="border:none;border-top:1px solid #2a3040;">' +
              '<div style="display:flex;justify-content:space-between;"><span style="color:#888;font-size:0.8rem;">Total Sales</span><span id="ts-summary-sales" style="color:#22c55e;font-weight:700;font-size:0.95rem;">' + formatCurrency(sheet.total_sales||0) + '</span></div>' +
              '<div style="display:flex;justify-content:space-between;"><span style="color:#888;font-size:0.8rem;">Cash OH</span><span id="ts-summary-cash-oh" style="color:#a78bfa;font-weight:700;font-size:0.85rem;">' + formatCurrency(sheet.total_cash_on_hand||0) + '</span></div>' +
              '<div style="display:flex;justify-content:space-between;"><span style="color:#888;font-size:0.8rem;">Cashflow</span><span id="ts-summary-cashflow" style="color:#f59e0b;font-weight:700;font-size:0.95rem;">' + formatCurrency(sheet.cashflow||0) + '</span></div>' +
            '</div>' +
          '</div>' +
          '<div style="background:#1a1f2e;border:1px solid #2a3040;border-radius:12px;padding:12px;">' +
            '<div id="ts-tally-badge" style="text-align:center;padding:8px;border-radius:8px;font-weight:700;font-size:0.9rem;margin-bottom:8px;"></div>' +
            '<div id="ts-tally-section"></div>' +
          '</div>' +
        '</div>' +

        '</div></div></div>';

    attachCafeEvents();
    updateCafeDisplay();
  }

  function attachListEvents() {
    document.getElementById('logout-btn')?.addEventListener('click', function(e) { e.preventDefault(); Auth.logout(); });
    document.getElementById('ts-branch')?.addEventListener('change', async function(e) { selectedBranch = e.target.value; await loadProducts(); await Promise.all([loadSheets(), loadTodaySales()]); render(); });
    document.querySelectorAll('.ts-area-btn').forEach(function(btn) {
      btn.addEventListener('click', async function() { filterArea = this.dataset.area; await Promise.all([loadSheets(), loadTodaySales()]); render(); });
    });
    document.getElementById('ts-filter-status')?.addEventListener('change', async function(e) { filterStatus = e.target.value; await Promise.all([loadSheets(), loadTodaySales()]); render(); });
    document.getElementById('ts-filter-date')?.addEventListener('change', async function(e) { filterDate = e.target.value; await Promise.all([loadSheets(), loadTodaySales()]); render(); });
  }

  function updatePlayhouseDisplay() {
    if (!editingSheet || editingSheet.area !== 'Playhouse') return;
    recalcPlayhouse();
    var d = editingSheet.data;
    var cashDenomEl = document.getElementById('ts-summary-cash-denom');
    var ecashEl = document.getElementById('ts-summary-ecash');
    var expensesEl = document.getElementById('ts-summary-expenses');
    var salesEl = document.getElementById('ts-summary-sales');
    var cashOHEl = document.getElementById('ts-summary-cash-oh');
    var cashflowEl = document.getElementById('ts-summary-cashflow');
    var tallyBadge = document.getElementById('ts-tally-badge');
    var tallySection = document.getElementById('ts-tally-section');
    if (cashDenomEl) cashDenomEl.textContent = formatCurrency(d._cash_denom_total || 0);
    if (ecashEl) ecashEl.textContent = formatCurrency(d.e_cash || 0);
    if (expensesEl) expensesEl.textContent = formatCurrency(d._expenses_total || 0);
    if (salesEl) salesEl.textContent = formatCurrency(editingSheet.total_sales || 0);
    if (cashOHEl) cashOHEl.textContent = formatCurrency(editingSheet.total_cash_on_hand || 0);
    if (cashflowEl) cashflowEl.textContent = formatCurrency(editingSheet.cashflow || 0);
    var totalSales = parseFloat(d._total_sales) || 0;
    var cashDenomTotal = parseFloat(d._cash_denom_total) || 0;
    var ecash = parseFloat(d.e_cash) || 0;
    var expensesTotal = parseFloat(d._expenses_total) || 0;
    var totalCollected = cashDenomTotal + ecash + expensesTotal;
    var diff = totalCollected - totalSales;
    var status, color, bg, border;
    if (diff > 0) { status = 'OVER'; color = '#22c55e'; bg = '#22c55e22'; border = '#22c55e55'; }
    else if (diff < 0) { status = 'SHORT'; color = '#ef4444'; bg = '#ef444422'; border = '#ef444455'; }
    else { status = 'BALANCED'; color = '#3b82f6'; bg = '#3b82f622'; border = '#3b82f655'; }
    if (tallyBadge) {
      tallyBadge.style.background = bg;
      tallyBadge.style.color = color;
      tallyBadge.style.border = '1px solid ' + border;
      tallyBadge.textContent = status + (diff !== 0 ? ' (' + formatCurrency(Math.abs(diff)) + ')' : '');
    }
    if (tallySection) {
      tallySection.innerHTML =
        '<div style="background:' + bg + ';border:1px solid ' + border + ';border-radius:8px;padding:10px 12px;">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;">' +
            '<div>' +
              '<div style="color:' + color + ';font-size:0.7rem;font-weight:700;text-transform:uppercase;margin-bottom:2px;">Cashier Tally</div>' +
              '<div style="color:#94a3b8;font-size:0.7rem;">Cash Denoms (' + formatCurrency(cashDenomTotal) + ') + E-Cash (' + formatCurrency(ecash) + ') + Expenses (' + formatCurrency(expensesTotal) + ') = ' + formatCurrency(totalCollected) + ' vs Total Sales (' + formatCurrency(totalSales) + ')</div>' +
            '</div>' +
            '<div style="color:' + color + ';font-weight:700;font-size:1.1rem;">' + formatCurrency(Math.abs(diff)) + '</div>' +
          '</div>' +
        '</div>';
    }
  }

  function attachPlayhouseEvents() {
    document.getElementById('logout-btn')?.addEventListener('click', function(e) { e.preventDefault(); Auth.logout(); });
    document.querySelectorAll('.ph-attr').forEach(function(el) {
      el.addEventListener('input', function() {
        updatePlayhouseDisplay();
      });
    });
    document.querySelectorAll('.ph-hc').forEach(function(el) {
      el.addEventListener('input', function() {
        updatePlayhouseDisplay();
      });
    });
    document.querySelectorAll('.ph-cash').forEach(function(el) {
      el.addEventListener('input', function() {
        updatePlayhouseDisplay();
      });
    });
    document.querySelectorAll('.ph-exp').forEach(function(el) {
      el.addEventListener('input', function() {
        updatePlayhouseDisplay();
      });
    });
    var cashflowInput = document.getElementById('ts-cashflow');
    if (cashflowInput) {
      cashflowInput.addEventListener('input', function() {
        editingSheet.cashflow = parseFloat(this.value) || 0;
        updatePlayhouseDisplay();
      });
    }
  }

  function recalcArcade() {
    var d = editingSheet.data;
    if (!d) return;
    if (!d.stocks) d.stocks = getDefaultData('Arcade').stocks;
    document.querySelectorAll('.arc-stock').forEach(function(inp) {
      var idx = parseInt(inp.dataset.idx);
      var field = inp.dataset.field;
      if (d.stocks[idx]) {
        d.stocks[idx][field] = parseFloat(inp.value) || 0;
      }
    });
    var totalSales = 0;
    var totalSold = 0;
    var totalCount = 0;
    d.stocks.forEach(function(s) {
      s.opening = parseInt(s.opening) || 0;
      s.add = parseInt(s.add) || 0;
      s.remaining = parseInt(s.remaining) || 0;
      s.total_count = s.opening + s.add;
      s.sold = Math.max(0, s.total_count - s.remaining);
      var tokenVal = parseInt(s.token) || 0;
      if (s.token === 'SMASH') {
        s.amount = s.sold * 5;
      } else if (s.token === 'EXTRA') {
        s.amount = 0;
      } else {
        s.amount = s.sold * tokenVal;
      }
      totalSales += s.amount;
      totalSold += s.sold;
      totalCount += s.total_count;
    });
    var cashDenomTotal = 0;
    if (d.cash_denoms) {
      Object.keys(d.cash_denoms).forEach(function(k) {
        cashDenomTotal += (parseFloat(d.cash_denoms[k]) || 0) * parseFloat(k);
      });
    }
    var expensesTotal = 0;
    if (d.expenses_list) {
      d.expenses_list.forEach(function(ex) { expensesTotal += parseFloat(ex.amount) || 0; });
    }
    d._total_sales = totalSales;
    d._total_sold = totalSold;
    d._total_count = totalCount;
    d._cash_denom_total = cashDenomTotal;
    d._expenses_total = expensesTotal;
    editingSheet.total_sales = totalSales;
    editingSheet.total_cash_on_hand = cashDenomTotal;
  }

  function renderArcadeEditor(isOwner) {
    var sheet = editingSheet;
    var d = sheet.data || getDefaultData('Arcade');
    if (!d.stocks) d.stocks = getDefaultData('Arcade').stocks;
    if (!d.cash_denoms) d.cash_denoms = getDefaultData('Arcade').cash_denoms;
    if (!d.expenses_list) d.expenses_list = [];
    var isSubmitted = sheet.status === 'submitted';
    var dis = isSubmitted ? ' disabled' : '';
    var inp = 'width:100%;background:#0d1117;border:1px solid #30363d;border-radius:4px;padding:5px 4px;color:#e2e8f0;font-size:0.75rem;box-sizing:border-box;text-align:center;';
    var inpL = inp.replace('text-align:center;', 'text-align:left;');

    recalcArcade();

    var stockRows = '';
    if (d.stocks) {
      d.stocks.forEach(function(s, i) {
        stockRows += '<tr style="border-bottom:1px solid #1e2736;">' +
          '<td style="padding:4px;color:#e2e8f0;font-weight:600;font-size:0.8rem;text-align:left;width:10%;">' + esc(s.token) + '</td>' +
          '<td style="padding:3px;text-align:center;width:14%;"><input type="number" min="0" class="arc-stock" data-idx="' + i + '" data-field="opening" value="' + (s.opening||0) + '"' + dis + ' style="width:90%;background:#0d1117;border:1px solid #30363d;border-radius:4px;padding:5px 4px;color:#e2e8f0;font-size:0.75rem;box-sizing:border-box;text-align:center;"></td>' +
          '<td style="padding:3px;text-align:center;width:12%;"><input type="number" min="0" class="arc-stock" data-idx="' + i + '" data-field="add" value="' + (s.add||0) + '"' + dis + ' style="width:90%;background:#0d1117;border:1px solid #30363d;border-radius:4px;padding:5px 4px;color:#e2e8f0;font-size:0.75rem;box-sizing:border-box;text-align:center;"></td>' +
          '<td style="padding:4px;color:#94a3b8;font-weight:600;text-align:center;width:16%;">' + (s.total_count||0) + '</td>' +
          '<td style="padding:3px;text-align:center;width:16%;"><input type="number" min="0" class="arc-stock" data-idx="' + i + '" data-field="remaining" value="' + (s.remaining||0) + '"' + dis + ' style="width:90%;background:#0d1117;border:1px solid #30363d;border-radius:4px;padding:5px 4px;color:#e2e8f0;font-size:0.75rem;box-sizing:border-box;text-align:center;"></td>' +
          '<td style="padding:4px;color:#60a5fa;font-weight:600;text-align:center;width:14%;">' + (s.sold||0) + '</td>' +
          '<td style="padding:4px;color:#22c55e;font-weight:600;font-size:0.75rem;text-align:right;width:18%;">' + formatCurrency(s.amount||0) + '</td>' +
        '</tr>';
      });
    }

    var cashDenomRows = '';
    var denoms = [1000, 500, 200, 100, 50, 20, 10, 5];
    denoms.forEach(function(k) {
      var val = d.cash_denoms ? (d.cash_denoms[k] || 0) : 0;
      cashDenomRows += '<tr style="border-bottom:1px solid #1e2736;">' +
        '<td style="padding:4px;color:#e2e8f0;font-weight:600;font-size:0.8rem;text-align:left;width:25%;">' + k + '</td>' +
        '<td style="padding:3px;text-align:center;width:40%;"><input type="number" min="0" class="arc-cash" data-denom="' + k + '" value="' + val + '"' + dis + ' style="width:90%;background:#0d1117;border:1px solid #30363d;border-radius:4px;padding:5px 4px;color:#e2e8f0;font-size:0.75rem;box-sizing:border-box;text-align:center;"></td>' +
        '<td style="padding:4px;color:#6366f1;font-weight:600;font-size:0.75rem;text-align:right;width:35%;">' + formatCurrency(val * k) + '</td>' +
      '</tr>';
    });

    var expenseRows = '';
    if (d.expenses_list && d.expenses_list.length > 0) {
      d.expenses_list.forEach(function(ex, i) {
        expenseRows += '<tr style="border-bottom:1px solid #1e2736;">' +
          '<td style="padding:3px;"><input type="text" class="arc-exp" data-idx="' + i + '" data-field="desc" value="' + esc(ex.desc||'') + '"' + dis + ' style="' + inpL + '"></td>' +
          '<td style="padding:3px;"><input type="number" min="0" step="0.01" class="arc-exp" data-idx="' + i + '" data-field="amount" value="' + (ex.amount||0) + '"' + dis + ' style="' + inp + '"></td>' +
        '</tr>';
      });
    }

    var remarkRows = '';
    if (!d.remarks_list) d.remarks_list = [];
    d.remarks_list.forEach(function(rm, i) {
      remarkRows += '<tr style="border-bottom:1px solid #1e2736;">' +
        '<td style="padding:3px;"><input type="text" class="arc-rmk" data-idx="' + i + '" value="' + esc(rm.desc||'') + '"' + dis + ' style="' + inpL + '"></td>' +
      '</tr>';
    });

    app.innerHTML = '<div class="layout">' + renderSidebar() +
      '<div class="main-content">' + renderNavbar('Arcade Tracking Sheet') +
      '<div class="page-content" id="page-body" style="overflow-y:auto;">' +
      renderHeaderButtons(isSubmitted) +

      '<div id="tracking-print-area">' +

        '<div style="background:#1a1f2e;border:1px solid #2a3040;border-radius:12px;overflow:hidden;margin-bottom:16px;">' +
          '<div style="background:#1a5276;padding:10px 16px;text-align:center;">' +
            '<div style="color:#fff;font-weight:700;font-size:0.95rem;letter-spacing:1px;">ARCADE TRACKING SHEET</div>' +
          '</div>' +

          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;padding:12px;">' +
            '<div>' +
              '<div style="color:#f59e0b;font-weight:700;font-size:0.8rem;margin-bottom:8px;">DECODE (DLA TOKEN)</div>' +
              '<div style="display:flex;gap:6px;flex-wrap:wrap;">' +
                '<span style="background:#22c55e22;color:#22c55e;padding:4px 10px;border-radius:4px;font-size:0.7rem;font-weight:700;">50</span>' +
                '<span style="background:#3b82f622;color:#3b82f6;padding:4px 10px;border-radius:4px;font-size:0.7rem;font-weight:700;">100</span>' +
                '<span style="background:#8b5cf622;color:#8b5cf6;padding:4px 10px;border-radius:4px;font-size:0.7rem;font-weight:700;">150</span>' +
                '<span style="background:#ec489922;color:#ec4899;padding:4px 10px;border-radius:4px;font-size:0.7rem;font-weight:700;">250</span>' +
                '<span style="background:#06b6d422;color:#06b6d4;padding:4px 10px;border-radius:4px;font-size:0.7rem;font-weight:700;">G-CASH</span>' +
                '<span style="background:#f9731622;color:#f97316;padding:4px 10px;border-radius:4px;font-size:0.7rem;font-weight:700;">SMASH</span>' +
                '<span style="background:#ef444422;color:#ef4444;padding:4px 10px;border-radius:4px;font-size:0.7rem;font-weight:700;">EXTRA</span>' +
              '</div>' +
            '</div>' +
            '<div>' +
              '<div style="color:#22c55e;font-weight:700;font-size:0.8rem;margin-bottom:8px;">CASH</div>' +
              '<table style="width:100%;border-collapse:collapse;font-size:0.75rem;">' +
              '<thead><tr style="border-bottom:2px solid #2a3040;">' +
                '<th style="padding:4px;color:#94a3b8;text-align:left;width:25%;">BILLS</th>' +
                '<th style="padding:4px;color:#94a3b8;text-align:center;width:40%;">PCS</th>' +
                '<th style="padding:4px;color:#94a3b8;text-align:right;width:35%;">TOTAL AMOUNT</th>' +
              '</tr></thead><tbody>' + cashDenomRows +
              '<tr style="border-top:2px solid #22c55e;background:#0d1a14;"><td style="padding:4px;color:#22c55e;font-weight:700;width:25%;">TOTAL</td><td style="width:40%;"></td><td id="arc-cash-total" style="padding:4px;color:#22c55e;font-weight:700;text-align:right;width:35%;">' + formatCurrency(d._cash_denom_total||0) + '</td></tr>' +
              '</tbody></table>' +
            '</div>' +
          '</div>' +

          '<div style="padding:12px;border-top:1px solid #2a3040;">' +
            '<div style="color:#f59e0b;font-weight:700;font-size:0.8rem;margin-bottom:8px;">STOCKS (DLA TOKENS)</div>' +
            '<table style="width:100%;border-collapse:collapse;font-size:0.75rem;">' +
            '<thead><tr style="border-bottom:2px solid #2a3040;">' +
              '<th style="padding:6px;color:#f59e0b;text-align:left;width:10%;">TOKEN</th>' +
              '<th style="padding:6px;color:#94a3b8;text-align:center;width:14%;">OPENING</th>' +
              '<th style="padding:6px;color:#94a3b8;text-align:center;width:12%;">ADD</th>' +
              '<th style="padding:6px;color:#94a3b8;text-align:center;width:16%;">TOTAL COUNT</th>' +
              '<th style="padding:6px;color:#94a3b8;text-align:center;width:16%;">REMAINING</th>' +
              '<th style="padding:6px;color:#60a5fa;text-align:center;width:14%;">SOLD</th>' +
              '<th style="padding:6px;color:#22c55e;text-align:right;width:18%;">AMOUNT</th>' +
            '</tr></thead><tbody>' + stockRows +
            '<tr id="arc-stock-total" style="border-top:2px solid #f59e0b;background:#1a1510;">' +
              '<td style="padding:6px;color:#f59e0b;font-weight:700;text-align:left;width:10%;">TOTAL</td>' +
              '<td style="width:14%;"></td><td style="width:12%;"></td>' +
              '<td style="padding:6px;color:#f59e0b;font-weight:700;text-align:center;width:16%;">' + (d._total_count||0) + '</td>' +
              '<td style="width:16%;"></td>' +
              '<td style="padding:6px;color:#f59e0b;font-weight:700;text-align:center;width:14%;">' + (d._total_sold||0) + ' sold</td>' +
              '<td style="padding:6px;color:#22c55e;font-weight:700;text-align:right;width:18%;">' + formatCurrency(d._total_sales||0) + '</td>' +
            '</tr>' +
            '</tbody></table>' +
          '</div>' +

          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;padding:12px;border-top:1px solid #2a3040;">' +
            '<div>' +
              '<div style="color:#ef4444;font-weight:700;font-size:0.8rem;margin-bottom:8px;">EXPENSES</div>' +
              (expenseRows ? '<table style="width:100%;border-collapse:collapse;font-size:0.75rem;"><thead><tr style="border-bottom:1px solid #2a3040;"><th style="padding:4px;color:#94a3b8;text-align:left;">DESC</th><th style="padding:4px;color:#94a3b8;">AMOUNT</th></tr></thead><tbody>' + expenseRows + '</tbody></table>' : '<div style="color:#64748b;font-size:0.75rem;">No expenses</div>') +
              (isSubmitted ? '' : '<button onclick="window.__tsAddExpense()" style="margin-top:6px;background:#374151;color:#e2e8f0;border:none;border-radius:4px;padding:4px 10px;cursor:pointer;font-size:0.7rem;">+ Add</button>') +
            '</div>' +
            '<div>' +
              '<div style="color:#f59e0b;font-weight:700;font-size:0.8rem;margin-bottom:8px;">REMARKS</div>' +
              (remarkRows ? '<table style="width:100%;border-collapse:collapse;font-size:0.75rem;"><thead><tr style="border-bottom:1px solid #2a3040;"><th style="padding:4px;color:#94a3b8;text-align:left;">DESCRIPTION</th></tr></thead><tbody>' + remarkRows + '</tbody></table>' : '<div style="color:#64748b;font-size:0.75rem;">No remarks</div>') +
              (isSubmitted ? '' : '<button onclick="window.__tsAddRemark()" style="margin-top:6px;background:#374151;color:#e2e8f0;border:none;border-radius:4px;padding:4px 10px;cursor:pointer;font-size:0.7rem;">+ Add</button>') +
            '</div>' +
          '</div>' +

          '<div style="display:grid;grid-template-columns:repeat(6,1fr);gap:8px;padding:12px;border-top:1px solid #2a3040;">' +
            '<div><label style="color:#888;font-size:0.65rem;display:block;margin-bottom:2px;">CASHIER NAME</label>' +
            '<input type="text" id="ts-cashier" value="' + esc(sheet.cashier_name||'') + '"' + dis + ' style="width:100%;background:#0d1117;border:1px solid #30363d;border-radius:4px;padding:5px;color:#e2e8f0;font-size:0.8rem;"></div>' +
            '<div><label style="color:#888;font-size:0.65rem;display:block;margin-bottom:2px;">DATE</label>' +
            '<input type="date" id="ts-date" value="' + esc(sheet.sheet_date||'') + '"' + dis + ' style="width:100%;background:#0d1117;border:1px solid #30363d;border-radius:4px;padding:5px;color:#e2e8f0;font-size:0.8rem;"></div>' +
            '<div><label style="color:#888;font-size:0.65rem;display:block;margin-bottom:2px;">G-CASH</label>' +
            '<input type="number" min="0" step="0.01" id="ts-gcash" value="' + (sheet.data._gcash||0) + '"' + dis + ' style="width:100%;background:#0d1117;border:1px solid #30363d;border-radius:4px;padding:5px;color:#e2e8f0;font-size:0.8rem;"></div>' +
            '<div><label style="color:#888;font-size:0.65rem;display:block;margin-bottom:2px;">TOTAL SALES</label>' +
            '<div id="ts-total-sales" style="background:#0d1117;border:1px solid #30363d;border-radius:4px;padding:5px;color:#22c55e;font-weight:700;font-size:0.85rem;">' + formatCurrency(sheet.total_sales||0) + '</div></div>' +
            '<div><label style="color:#888;font-size:0.65rem;display:block;margin-bottom:2px;">TOTAL CASH OH (Auto)</label>' +
            '<input type="number" readonly id="ts-cash" value="' + (sheet.total_cash_on_hand||0) + '"' + dis + ' style="width:100%;background:#0d1117;border:1px solid #30363d;border-radius:4px;padding:5px;color:#a78bfa;font-size:0.8rem;cursor:not-allowed;"></div>' +
            '<div><label style="color:#888;font-size:0.65rem;display:block;margin-bottom:2px;">CASHFLOW / FUNDS</label>' +
            '<input type="number" step="0.01" id="ts-cashflow" value="' + (sheet.cashflow||0) + '"' + dis + ' style="width:100%;background:#0d1117;border:1px solid #30363d;border-radius:4px;padding:5px;color:#e2e8f0;font-size:0.8rem;"></div>' +
          '</div>' +

          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:12px;border-top:1px solid #2a3040;">' +
            '<div><label style="color:#888;font-size:0.65rem;display:block;margin-bottom:2px;">OTHERS</label>' +
            '<input type="text" id="ts-remarks-over" value="' + esc(sheet.remarks_over||'') + '"' + dis + ' style="width:100%;background:#0d1117;border:1px solid #30363d;border-radius:4px;padding:5px;color:#e2e8f0;font-size:0.8rem;"></div>' +
            '<div><label style="color:#888;font-size:0.65rem;display:block;margin-bottom:2px;">EXTRA (SALES BREAKDOWN)</label>' +
            '<input type="text" id="ts-expenses" value="' + (sheet.expenses||0) + '"' + dis + ' style="width:100%;background:#0d1117;border:1px solid #30363d;border-radius:4px;padding:5px;color:#e2e8f0;font-size:0.8rem;"></div>' +
          '</div>' +

        '</div>' +
      '</div>' +

      '<div style="display:flex;flex-direction:column;gap:12px;margin-top:16px;">' +
        '<div style="background:#1a1f2e;border:1px solid #2a3040;border-radius:12px;padding:16px;">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">' +
            '<div style="color:#94a3b8;font-size:0.75rem;font-weight:600;text-transform:uppercase;">Summary</div>' +
            '<div id="ts-tally-badge" style="padding:3px 10px;border-radius:4px;font-size:0.7rem;font-weight:700;"></div>' +
          '</div>' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">' +
            '<div style="background:#0d1117;border-radius:6px;padding:8px 10px;"><div style="color:#888;font-size:0.65rem;margin-bottom:2px;">Cashier</div><div style="color:#e2e8f0;font-weight:600;font-size:0.85rem;">' + esc(sheet.cashier_name||'-') + '</div></div>' +
            '<div style="background:#0d1117;border-radius:6px;padding:8px 10px;"><div style="color:#888;font-size:0.65rem;margin-bottom:2px;">Remarks</div><div id="ts-summary-remarks" style="color:#e2e8f0;font-weight:600;font-size:0.85rem;">' + (function(){ var rl = d.remarks_list || []; var texts = rl.map(function(r){return r.desc||'';}).filter(function(t){return t;}); return texts.length ? esc(texts.join(', ')) : '-'; })() + '</div></div>' +
          '</div>' +
          '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:8px;">' +
            '<div style="background:#0d1117;border-radius:6px;padding:8px 10px;"><div style="color:#888;font-size:0.65rem;margin-bottom:2px;">Cash Denoms</div><div id="ts-cash-denom" style="color:#6366f1;font-weight:700;font-size:0.9rem;">' + formatCurrency(d._cash_denom_total||0) + '</div></div>' +
            '<div style="background:#0d1117;border-radius:6px;padding:8px 10px;"><div style="color:#888;font-size:0.65rem;margin-bottom:2px;">Expenses</div><div id="ts-expenses-total" style="color:#ef4444;font-weight:700;font-size:0.9rem;">' + formatCurrency(d._expenses_total||0) + '</div></div>' +
            '<div style="background:#0d1117;border-radius:6px;padding:8px 10px;"><div style="color:#888;font-size:0.65rem;margin-bottom:2px;">G-Cash</div><div id="ts-summary-gcash" style="color:#06b6d4;font-weight:700;font-size:0.9rem;">' + formatCurrency(d._gcash||0) + '</div></div>' +
          '</div>' +
          '<div style="background:#0f1a14;border:1px solid #22c55e33;border-radius:8px;padding:10px 12px;margin-top:10px;">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;"><span style="color:#22c55e;font-size:0.75rem;font-weight:600;">TOTAL SALES</span><span id="ts-total-sales" style="color:#22c55e;font-weight:700;font-size:1.1rem;">' + formatCurrency(sheet.total_sales||0) + '</span></div>' +
          '</div>' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px;">' +
            '<div style="background:#0d1117;border-radius:6px;padding:8px 10px;"><div style="color:#888;font-size:0.65rem;margin-bottom:2px;">Total Cash OH</div><div id="ts-summary-cash-oh" style="color:#8b5cf6;font-weight:700;font-size:0.9rem;">' + formatCurrency(sheet.total_cash_on_hand||0) + '</div></div>' +
            '<div style="background:#0d1117;border-radius:6px;padding:8px 10px;"><div style="color:#888;font-size:0.65rem;margin-bottom:2px;">Cashflow / Funds</div><div id="ts-summary-cashflow" style="color:#f59e0b;font-weight:700;font-size:0.9rem;">' + formatCurrency(sheet.cashflow||0) + '</div></div>' +
          '</div>' +
          '<div id="ts-tally-section" style="margin-top:10px;"></div>' +
        '</div>' +
      '</div>' +

      '</div></div></div>';

    attachArcadeEvents();
    updateSalesDisplay();
  }

  function updateSalesDisplay() {
    if (!editingSheet) return;
    recalcArcade();
    var d = editingSheet.data;
    var salesEl = document.getElementById('ts-total-sales');
    var cashDenomEl = document.getElementById('ts-cash-denom');
    var expensesEl = document.getElementById('ts-expenses-total');
    var gcashSpan = document.getElementById('ts-summary-gcash');
    var cashOHSpan = document.getElementById('ts-summary-cash-oh');
    var cashflowSpan = document.getElementById('ts-summary-cashflow');
    var tallyBadge = document.getElementById('ts-tally-badge');
    var tallySection = document.getElementById('ts-tally-section');
    if (salesEl) salesEl.textContent = formatCurrency(d._total_sales || 0);
    if (cashDenomEl) cashDenomEl.textContent = formatCurrency(d._cash_denom_total || 0);
    if (expensesEl) expensesEl.textContent = formatCurrency(d._expenses_total || 0);
    if (gcashSpan) gcashSpan.textContent = formatCurrency(editingSheet.data._gcash || 0);
    if (cashOHSpan) cashOHSpan.textContent = formatCurrency(editingSheet.total_cash_on_hand || 0);
    if (cashflowSpan) cashflowSpan.textContent = formatCurrency(editingSheet.cashflow || 0);

    var totalSales = parseFloat(d._total_sales) || 0;
    var cashDenomTotal = parseFloat(d._cash_denom_total) || 0;
    var gcash = parseFloat(d._gcash) || 0;
    var expensesTotal = parseFloat(d._expenses_total) || 0;
    var totalCollected = cashDenomTotal + gcash + expensesTotal;
    var diff = totalCollected - totalSales;
    var status, color, bg, border;
    if (diff > 0) {
      status = 'OVER';
      color = '#22c55e';
      bg = '#22c55e22';
      border = '#22c55e55';
    } else if (diff < 0) {
      status = 'SHORT';
      color = '#ef4444';
      bg = '#ef444422';
      border = '#ef444455';
    } else {
      status = 'BALANCED';
      color = '#3b82f6';
      bg = '#3b82f622';
      border = '#3b82f655';
    }
    if (tallyBadge) {
      tallyBadge.style.background = bg;
      tallyBadge.style.color = color;
      tallyBadge.style.border = '1px solid ' + border;
      tallyBadge.textContent = status + (diff !== 0 ? ' (' + formatCurrency(Math.abs(diff)) + ')' : '');
    }
    if (tallySection) {
      tallySection.innerHTML =
        '<div style="background:' + bg + ';border:1px solid ' + border + ';border-radius:8px;padding:10px 12px;">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;">' +
            '<div>' +
              '<div style="color:' + color + ';font-size:0.7rem;font-weight:700;text-transform:uppercase;margin-bottom:2px;">Cashier Tally</div>' +
              '<div style="color:#94a3b8;font-size:0.7rem;">Cash Denoms (' + formatCurrency(cashDenomTotal) + ') + G-Cash (' + formatCurrency(gcash) + ') + Expenses (' + formatCurrency(expensesTotal) + ') = ' + formatCurrency(totalCollected) + ' vs Total Sales (' + formatCurrency(totalSales) + ')</div>' +
            '</div>' +
            '<div style="color:' + color + ';font-weight:700;font-size:1.1rem;">' + formatCurrency(Math.abs(diff)) + '</div>' +
          '</div>' +
        '</div>';
    }
  }

  function attachArcadeEvents() {
    document.getElementById('logout-btn')?.addEventListener('click', function(e) { e.preventDefault(); Auth.logout(); });
    document.querySelectorAll('.arc-stock').forEach(function(inp) {
      inp.addEventListener('input', function() {
        var idx = parseInt(this.dataset.idx);
        var field = this.dataset.field;
        var d = editingSheet.data;
        if (!d.stocks || !d.stocks[idx]) return;
        d.stocks[idx][field] = parseInt(this.value) || 0;
        recalcArcade();
        var row = this.closest('tr');
        var cells = row.querySelectorAll('td');
        if (cells[3]) cells[3].textContent = d.stocks[idx].total_count || 0;
        if (cells[5]) cells[5].textContent = d.stocks[idx].sold || 0;
        if (cells[6]) cells[6].textContent = formatCurrency(d.stocks[idx].amount || 0);
        var totalRow = document.querySelector('#arc-stock-total');
        if (totalRow) {
          var tcells = totalRow.querySelectorAll('td');
          if (tcells[3]) tcells[3].textContent = d._total_count || 0;
          if (tcells[5]) tcells[5].textContent = (d._total_sold || 0) + ' sold';
          if (tcells[6]) tcells[6].textContent = formatCurrency(d._total_sales || 0);
        }
        updateSalesDisplay();
      });
    });

    document.querySelectorAll('.arc-cash').forEach(function(inp) {
      inp.addEventListener('input', function() {
        var k = this.dataset.denom;
        var d = editingSheet.data;
        if (!d.cash_denoms) d.cash_denoms = {};
        d.cash_denoms[k] = parseFloat(this.value) || 0;
        recalcArcade();
        var row = this.closest('tr');
        if (row) {
          var amountCell = row.querySelector('td:last-child');
          if (amountCell) amountCell.textContent = formatCurrency((d.cash_denoms[k] || 0) * parseFloat(k));
        }
        var totalTd = document.getElementById('arc-cash-total');
        if (totalTd) totalTd.textContent = formatCurrency(d._cash_denom_total || 0);
        updateSalesDisplay();
      });
    });

    document.querySelectorAll('.arc-exp').forEach(function(inp) {
      inp.addEventListener('input', function() {
        var idx = parseInt(this.dataset.idx);
        var field = this.dataset.field;
        var d = editingSheet.data;
        if (!d.expenses_list || !d.expenses_list[idx]) return;
        d.expenses_list[idx][field] = field === 'desc' ? this.value : (parseFloat(this.value) || 0);
        recalcArcade();
        updateSalesDisplay();
      });
    });

    var cashflowInput = document.getElementById('ts-cashflow');
    if (cashflowInput) {
      cashflowInput.addEventListener('input', function() {
        editingSheet.cashflow = parseFloat(this.value) || 0;
        updateSalesDisplay();
      });
    }

    var gcashInput = document.getElementById('ts-gcash');
    if (gcashInput) {
      gcashInput.addEventListener('input', function() {
        editingSheet.data._gcash = parseFloat(this.value) || 0;
        recalcArcade();
        updateSalesDisplay();
      });
    }

    document.querySelectorAll('.arc-rmk').forEach(function(inp) {
      inp.addEventListener('input', function() {
        var idx = parseInt(this.dataset.idx);
        var d = editingSheet.data;
        if (!d.remarks_list || !d.remarks_list[idx]) return;
        d.remarks_list[idx].desc = this.value;
        updateRemarksSummary();
      });
    });
  }

  function updateRemarksSummary() {
    var remarksSpan = document.getElementById('ts-summary-remarks');
    if (!remarksSpan) return;
    var d = editingSheet.data;
    if (!d.remarks_list || d.remarks_list.length === 0) {
      remarksSpan.textContent = '-';
      return;
    }
    var texts = d.remarks_list.map(function(r) { return r.desc || ''; }).filter(function(t) { return t; });
    remarksSpan.textContent = texts.join(', ') || '-';
  }

  function updateCafeDisplay() {
    if (!editingSheet || editingSheet.area !== 'Cafe') return;
    recalcCafe();
    var d = editingSheet.data;
    var cashDenomEl = document.getElementById('ts-summary-cash-denom');
    var expensesEl = document.getElementById('ts-summary-expenses');
    var gcashEl = document.getElementById('ts-summary-gcash');
    var salesEl = document.getElementById('ts-summary-sales');
    var cashOHEl = document.getElementById('ts-summary-cash-oh');
    var cashflowEl = document.getElementById('ts-summary-cashflow');
    var tallyBadge = document.getElementById('ts-tally-badge');
    var tallySection = document.getElementById('ts-tally-section');
    if (cashDenomEl) cashDenomEl.textContent = formatCurrency(d._cash_denom_total || 0);
    if (expensesEl) expensesEl.textContent = formatCurrency(d._expenses_total || 0);
    if (gcashEl) gcashEl.textContent = formatCurrency(d._gcash || 0);
    if (salesEl) salesEl.textContent = formatCurrency(editingSheet.total_sales || 0);
    if (cashOHEl) cashOHEl.textContent = formatCurrency(editingSheet.total_cash_on_hand || 0);
    if (cashflowEl) cashflowEl.textContent = formatCurrency(editingSheet.cashflow || 0);
    var totalSales = parseFloat(d._total_sales) || 0;
    var cashDenomTotal = parseFloat(d._cash_denom_total) || 0;
    var gcash = parseFloat(d._gcash) || 0;
    var expensesTotal = parseFloat(d._expenses_total) || 0;
    var totalCollected = cashDenomTotal + gcash + expensesTotal;
    var diff = totalCollected - totalSales;
    var status, color, bg, border;
    if (diff > 0) { status = 'OVER'; color = '#22c55e'; bg = '#22c55e22'; border = '#22c55e55'; }
    else if (diff < 0) { status = 'SHORT'; color = '#ef4444'; bg = '#ef444422'; border = '#ef444455'; }
    else { status = 'BALANCED'; color = '#3b82f6'; bg = '#3b82f622'; border = '#3b82f655'; }
    if (tallyBadge) {
      tallyBadge.style.background = bg;
      tallyBadge.style.color = color;
      tallyBadge.style.border = '1px solid ' + border;
      tallyBadge.textContent = status + (diff !== 0 ? ' (' + formatCurrency(Math.abs(diff)) + ')' : '');
    }
    if (tallySection) {
      tallySection.innerHTML =
        '<div style="background:' + bg + ';border:1px solid ' + border + ';border-radius:8px;padding:10px 12px;">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;">' +
            '<div>' +
              '<div style="color:' + color + ';font-size:0.7rem;font-weight:700;text-transform:uppercase;margin-bottom:2px;">Cashier Tally</div>' +
              '<div style="color:#94a3b8;font-size:0.7rem;">Cash Denoms (' + formatCurrency(cashDenomTotal) + ') + G-Cash (' + formatCurrency(gcash) + ') + Expenses (' + formatCurrency(expensesTotal) + ') = ' + formatCurrency(totalCollected) + ' vs Total Sales (' + formatCurrency(totalSales) + ')</div>' +
            '</div>' +
            '<div style="color:' + color + ';font-weight:700;font-size:1.1rem;">' + formatCurrency(Math.abs(diff)) + '</div>' +
          '</div>' +
        '</div>';
    }
  }

  function attachCafeEvents() {
    document.getElementById('logout-btn')?.addEventListener('click', function(e) { e.preventDefault(); Auth.logout(); });
    document.querySelectorAll('.ts-item').forEach(function(input) {
      input.addEventListener('input', function() {
        updateCafeDisplay();
      });
    });
    document.querySelectorAll('.cafe-cash').forEach(function(el) {
      el.addEventListener('input', function() {
        updateCafeDisplay();
      });
    });
    document.querySelectorAll('.cafe-exp').forEach(function(el) {
      el.addEventListener('input', function() {
        updateCafeDisplay();
      });
    });
    var gcashInput = document.getElementById('ts-gcash');
    if (gcashInput) {
      gcashInput.addEventListener('input', function() {
        editingSheet.data._gcash = parseFloat(this.value) || 0;
        updateCafeDisplay();
      });
    }
    var cashflowInput = document.getElementById('ts-cashflow');
    if (cashflowInput) {
      cashflowInput.addEventListener('input', function() {
        editingSheet.cashflow = parseFloat(this.value) || 0;
        updateCafeDisplay();
      });
    }
  }



  window.__tsNew = function(area) { createNewSheet(area); };
  window.__tsBack = async function() { editingSheet = null; view = 'list'; await Promise.all([loadSheets(), loadTodaySales()]); render(); };
  window.__tsEdit = function(id) { var s = sheets.find(function(s) { return s.id === id; }); if (s) editSheet(s); };
  window.__tsView = function(id) { var s = sheets.find(function(s) { return s.id === id; }); if (s) editSheet(s); };
  window.__tsSoftDelete = async function(id) {
    if (!await confirmAsync('Delete this tracking sheet? It will be moved to trash.')) return;
    try {
      await apiPost('/tracking-sheets/' + id + '/soft-delete', {});
      Toast.success('Moved to trash');
      await Promise.all([loadSheets(), loadTodaySales()]);
      render();
    } catch (e) { Toast.error(e.message || 'Failed to delete'); }
  };
  window.__tsSubmit = function(id) { var s = sheets.find(function(s) { return s.id === id; }); if (s) submitSheet(s); };
  window.__tsSave = function() { saveSheet(false); };
  window.__tsSaveSubmit = function() { saveSheet(true); };
  window.__tsPrint = function() { printSheet(); };
  window.__tsAddExpense = function() {
    if (!editingSheet || !editingSheet.data) return;
    if (!editingSheet.data.expenses_list) editingSheet.data.expenses_list = [];
    editingSheet.data.expenses_list.push({ desc: '', amount: 0 });
    render();
  };

  window.__tsAddRemark = function() {
    if (!editingSheet || !editingSheet.data) return;
    if (!editingSheet.data.remarks_list) editingSheet.data.remarks_list = [];
    editingSheet.data.remarks_list.push({ desc: '' });
    render();
  };

  loadData();

  var cleanupInterval = setInterval(function() {
    if (!document.getElementById('page-body')) {
      clearInterval(cleanupInterval);
      if (refreshTimer) { clearInterval(refreshTimer); refreshTimer = null; }
    }
  }, 2000);
}

Router.register('tracking', renderAdminTracking);
