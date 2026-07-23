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
        items: [
          { qty: 0, item: '10 Tokens', cost: 0, amount: 0, quantity: 0, share: 0, total_sales: 0 },
          { qty: 0, item: '20 Tokens', cost: 0, amount: 0, quantity: 0, share: 0, total_sales: 0 },
          { qty: 0, item: '50 Tokens', cost: 0, amount: 0, quantity: 0, share: 0, total_sales: 0 },
          { qty: 0, item: '100 Tokens', cost: 0, amount: 0, quantity: 0, share: 0, total_sales: 0 },
          { qty: 0, item: '150 Tokens', cost: 0, amount: 0, quantity: 0, share: 0, total_sales: 0 },
          { qty: 0, item: '250 Tokens', cost: 0, amount: 0, quantity: 0, share: 0, total_sales: 0 },
          { qty: 0, item: '', cost: 0, amount: 0, quantity: 0, share: 0, total_sales: 0 },
          { qty: 0, item: '', cost: 0, amount: 0, quantity: 0, share: 0, total_sales: 0 },
          { qty: 0, item: '', cost: 0, amount: 0, quantity: 0, share: 0, total_sales: 0 },
          { qty: 0, item: '', cost: 0, amount: 0, quantity: 0, share: 0, total_sales: 0 }
        ],
        token_decode: { 10: 0, 20: 0, 50: 0, 100: 0, 150: 0, 250: 0 },
        cash: { expenses: 0, recharge: 0, cash_in: 0 },
        cash_denoms: { 1000: 0, 500: 0, 200: 0, 100: 0, 50: 0, 20: 0, 10: 0, 5: 0, 1: 0, 0.25: 0 },
        expenses_list: [],
        token_explanation: ''
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
  }

  function recalcPlayhouse() {
    var d = editingSheet.data;
    if (!d) return;
    var attractionTotal = 0;
    if (d.attractions) {
      d.attractions.forEach(function(a) {
        var match = a.name.match(/(\d+)/);
        var price = match ? parseInt(match[1]) : 0;
        a.tracking = parseInt(a.tracking) || 0;
        a.e_cash = parseFloat(a.e_cash) || 0;
        a.amount = a.tracking * price;
        attractionTotal += a.amount;
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
    editingSheet.total_sales = attractionTotal + headcountTotal;
    editingSheet.data.e_cash = headcountEcash;
    var cashDenomTotal = 0;
    if (d.cash_denoms) {
      Object.keys(d.cash_denoms).forEach(function(k) {
        cashDenomTotal += (parseFloat(d.cash_denoms[k]) || 0) * parseFloat(k);
      });
    }
    editingSheet.data.cash_total = cashDenomTotal;
    editingSheet.cashflow = cashDenomTotal + headcountEcash - editingSheet.total_sales;
  }

  async function saveSheet(submit) {
    if (!editingSheet) return;
    syncFormToSheet();
    recalcPlayhouse();
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
    } catch (e) {
      Toast.error(e.message || 'Failed to save');
    }
  }

  async function submitSheet(sheet) {
    if (!await confirmAsync('Submit this tracking sheet? It will be locked from further edits.')) return;
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
      (sheets.length === 0 ? '<div style="text-align:center;padding:60px;color:#666;">No tracking sheets found.</div>' :
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
              '<div style="background:#0d1117;border:1px solid #30363d;border-radius:4px;padding:6px;color:#f59e0b;font-weight:700;font-size:0.9rem;">' + formatCurrency(sheet.cashflow||0) + '</div></div>' +
              '<div><label style="color:#888;font-size:0.7rem;display:block;margin-bottom:3px;">REMARKS</label>' +
              '<input type="text" id="ts-remarks-short" value="' + esc(sheet.remarks_short||'') + '"' + dis + ' style="width:100%;background:#0d1117;border:1px solid #30363d;border-radius:4px;padding:6px;color:#e2e8f0;font-size:0.8rem;"></div>' +
            '</div>' +
            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">' +
              '<div><label style="color:#888;font-size:0.7rem;display:block;margin-bottom:3px;">E-CASH</label>' +
              '<div style="background:#0d1117;border:1px solid #30363d;border-radius:4px;padding:6px;color:#22c55e;font-weight:700;font-size:0.9rem;">' + formatCurrency(d.e_cash||0) + '</div></div>' +
              '<div><label style="color:#888;font-size:0.7rem;display:block;margin-bottom:3px;">TOTAL SALES</label>' +
              '<div style="background:#0d1117;border:1px solid #30363d;border-radius:4px;padding:6px;color:#22c55e;font-weight:700;font-size:0.9rem;">' + formatCurrency(sheet.total_sales||0) + '</div></div>' +
              '<div><label style="color:#888;font-size:0.7rem;display:block;margin-bottom:3px;">TOTAL CASH OH</label>' +
              '<input type="number" min="0" step="0.01" id="ts-cash" value="' + (sheet.total_cash_on_hand||0) + '"' + dis + ' style="width:100%;background:#0d1117;border:1px solid #30363d;border-radius:4px;padding:6px;color:#e2e8f0;font-size:0.8rem;"></div>' +
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
            '<div style="display:flex;justify-content:space-between;"><span style="color:#888;font-size:0.8rem;">Cash Denoms</span><span style="color:#6366f1;font-weight:600;font-size:0.85rem;">' + formatCurrency(cashDenomTotal) + '</span></div>' +
            '<div style="display:flex;justify-content:space-between;"><span style="color:#888;font-size:0.8rem;">E-Cash</span><span style="color:#22c55e;font-weight:600;font-size:0.85rem;">' + formatCurrency(d.e_cash||0) + '</span></div>' +
            '<hr style="border:none;border-top:1px solid #2a3040;">' +
            '<div style="display:flex;justify-content:space-between;"><span style="color:#888;font-size:0.8rem;">Total Sales</span><span style="color:#22c55e;font-weight:700;font-size:1rem;">' + formatCurrency(sheet.total_sales||0) + '</span></div>' +
            '<div style="display:flex;justify-content:space-between;"><span style="color:#888;font-size:0.8rem;">Cashflow</span><span style="color:#f59e0b;font-weight:700;font-size:1rem;">' + formatCurrency(sheet.cashflow||0) + '</span></div>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '</div></div></div>';

    attachPlayhouseEvents();
  }

  function renderCafeEditor(isOwner) {
    var sheet = editingSheet;
    var isSubmitted = sheet.status === 'submitted';
    var dis = isSubmitted ? ' disabled' : '';
    var inp = 'width:100%;background:#0d1117;border:1px solid #30363d;border-radius:4px;padding:5px 6px;color:#e2e8f0;font-size:0.75rem;box-sizing:border-box;';
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

    recalcPlayhouse();

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
          '</tr></thead><tbody>' + rowsHtml + '</tbody></table></div></div></div>' +

        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:16px;">' +
          '<div><label style="color:#94a3b8;font-size:0.75rem;display:block;margin-bottom:4px;">Remarks (Short)</label>' +
          '<input type="text" id="ts-remarks-short" value="' + esc(sheet.remarks_short||'') + '"' + dis + ' style="width:100%;background:#0d1117;border:1px solid #30363d;border-radius:6px;padding:8px;color:#e2e8f0;font-size:0.85rem;"></div>' +
          '<div><label style="color:#94a3b8;font-size:0.75rem;display:block;margin-bottom:4px;">Remarks (Over)</label>' +
          '<input type="text" id="ts-remarks-over" value="' + esc(sheet.remarks_over||'') + '"' + dis + ' style="width:100%;background:#0d1117;border:1px solid #30363d;border-radius:6px;padding:8px;color:#e2e8f0;font-size:0.85rem;"></div>' +
        '</div>' +
      '</div>' +

      '<div style="display:flex;flex-direction:column;gap:12px;">' +
        '<div style="background:#1a1f2e;border:1px solid #2a3040;border-radius:12px;padding:16px;">' +
          '<div style="color:#94a3b8;font-size:0.75rem;font-weight:600;margin-bottom:12px;text-transform:uppercase;">Summary</div>' +
          '<div style="display:flex;flex-direction:column;gap:8px;">' +
            '<div style="display:flex;justify-content:space-between;"><span style="color:#888;font-size:0.8rem;">Cashier</span><span style="color:#e2e8f0;font-weight:600;">' + esc(sheet.cashier_name||'-') + '</span></div>' +
            '<div style="display:flex;justify-content:space-between;"><span style="color:#888;font-size:0.8rem;">Total Items</span><span style="color:#e2e8f0;font-weight:600;">' + totalItems + '</span></div>' +
            '<hr style="border:none;border-top:1px solid #2a3040;">' +
            '<div style="display:flex;justify-content:space-between;"><span style="color:#888;font-size:0.8rem;">Total Sales</span><span style="color:#22c55e;font-weight:700;font-size:0.95rem;">' + formatCurrency(sheet.total_sales||0) + '</span></div>' +
          '</div>' +
        '</div>' +
        '<div style="background:#1a1f2e;border:1px solid #2a3040;border-radius:12px;padding:16px;">' +
          '<div style="color:#94a3b8;font-size:0.75rem;font-weight:600;margin-bottom:12px;text-transform:uppercase;">Cashflow</div>' +
          '<div style="display:flex;flex-direction:column;gap:8px;">' +
            '<div><label style="color:#888;font-size:0.75rem;display:block;margin-bottom:4px;">Total Cash On Hand</label>' +
            '<input type="number" min="0" step="0.01" id="ts-cash" value="' + (sheet.total_cash_on_hand||0) + '"' + dis + ' style="width:100%;background:#0d1117;border:1px solid #30363d;border-radius:6px;padding:8px;color:#e2e8f0;font-size:0.85rem;"></div>' +
            '<div><label style="color:#888;font-size:0.75rem;display:block;margin-bottom:4px;">Expenses</label>' +
            '<input type="number" min="0" step="0.01" id="ts-expenses" value="' + (sheet.expenses||0) + '"' + dis + ' style="width:100%;background:#0d1117;border:1px solid #30363d;border-radius:6px;padding:8px;color:#e2e8f0;font-size:0.85rem;"></div>' +
            '<div><label style="color:#888;font-size:0.75rem;display:block;margin-bottom:4px;">Others</label>' +
            '<input type="number" min="0" step="0.01" id="ts-others" value="' + (sheet.others||0) + '"' + dis + ' style="width:100%;background:#0d1117;border:1px solid #30363d;border-radius:6px;padding:8px;color:#e2e8f0;font-size:0.85rem;"></div>' +
            '<hr style="border:none;border-top:1px solid #2a3040;">' +
            '<div style="display:flex;justify-content:space-between;"><span style="color:#888;font-size:0.8rem;">Cashflow</span><span style="color:#f59e0b;font-weight:700;font-size:0.95rem;">' + formatCurrency(sheet.cashflow||0) + '</span></div>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '</div></div></div>';

    attachCafeEvents();
  }

  function attachListEvents() {
    document.getElementById('logout-btn')?.addEventListener('click', function(e) { e.preventDefault(); Auth.logout(); });
    document.getElementById('ts-branch')?.addEventListener('change', async function(e) { selectedBranch = e.target.value; await loadProducts(); await loadSheets(); });
    document.getElementById('ts-filter-area')?.addEventListener('change', function(e) { filterArea = e.target.value; loadSheets(); });
    document.getElementById('ts-filter-status')?.addEventListener('change', function(e) { filterStatus = e.target.value; loadSheets(); });
    document.getElementById('ts-filter-date')?.addEventListener('change', function(e) { filterDate = e.target.value; loadSheets(); });
  }

  function attachPlayhouseEvents() {
    document.getElementById('logout-btn')?.addEventListener('click', function(e) { e.preventDefault(); Auth.logout(); });
    document.querySelectorAll('.ph-attr').forEach(function(el) {
      el.addEventListener('change', function() {
        var idx = parseInt(el.dataset.idx);
        var field = el.dataset.field;
        if (editingSheet.data && editingSheet.data.attractions && editingSheet.data.attractions[idx]) {
          editingSheet.data.attractions[idx][field] = parseFloat(el.value) || 0;
        }
      });
    });
    document.querySelectorAll('.ph-hc').forEach(function(el) {
      el.addEventListener('change', function() {
        var idx = parseInt(el.dataset.idx);
        var field = el.dataset.field;
        if (editingSheet.data && editingSheet.data.head_count && editingSheet.data.head_count[idx]) {
          editingSheet.data.head_count[idx][field] = parseFloat(el.value) || 0;
        }
      });
    });
    document.querySelectorAll('.ph-cash').forEach(function(el) {
      el.addEventListener('change', function() {
        var denom = parseFloat(el.dataset.denom);
        if (editingSheet.data && editingSheet.data.cash_denoms) {
          editingSheet.data.cash_denoms[denom] = parseFloat(el.value) || 0;
        }
      });
    });
    document.querySelectorAll('.ph-exp').forEach(function(el) {
      el.addEventListener('change', function() {
        var idx = parseInt(el.dataset.idx);
        var field = el.dataset.field;
        if (editingSheet.data && editingSheet.data.expenses_list && editingSheet.data.expenses_list[idx]) {
          editingSheet.data.expenses_list[idx][field] = field === 'desc' ? el.value : (parseFloat(el.value) || 0);
        }
      });
    });
  }

  function recalcArcade() {
    var d = editingSheet.data;
    if (!d) return;
    var itemTotal = 0;
    if (d.items) {
      d.items.forEach(function(item) {
        item.qty = parseInt(item.qty) || 0;
        item.cost = parseFloat(item.cost) || 0;
        item.quantity = parseInt(item.quantity) || 0;
        item.share = parseFloat(item.share) || 0;
        item.amount = item.qty * item.cost;
        item.total_sales = item.quantity * item.share;
        itemTotal += item.total_sales;
      });
    }
    var tokenTotal = 0;
    if (d.token_decode) {
      Object.keys(d.token_decode).forEach(function(k) {
        tokenTotal += parseInt(d.token_decode[k]) || 0;
      });
    }
    d.token_total = tokenTotal;
    if (d.cash) {
      d.cash.expenses = parseFloat(d.cash.expenses) || 0;
      d.cash.recharge = parseFloat(d.cash.recharge) || 0;
      d.cash.cash_in = parseFloat(d.cash.cash_in) || 0;
    }
    var cashDenomTotal = 0;
    if (d.cash_denoms) {
      Object.keys(d.cash_denoms).forEach(function(k) {
        cashDenomTotal += (parseFloat(d.cash_denoms[k]) || 0) * parseFloat(k);
      });
    }
    d.cash_denom_total = cashDenomTotal;
    editingSheet.total_sales = itemTotal + (d.cash ? d.cash.cash_in : 0);
    editingSheet.cashflow = cashDenomTotal - editingSheet.total_sales;
  }

  function renderArcadeEditor(isOwner) {
    var sheet = editingSheet;
    var d = sheet.data || getDefaultData('Arcade');
    var isSubmitted = sheet.status === 'submitted';
    var dis = isSubmitted ? ' disabled' : '';
    var inp = 'width:100%;background:#0d1117;border:1px solid #30363d;border-radius:4px;padding:5px 4px;color:#e2e8f0;font-size:0.75rem;box-sizing:border-box;text-align:center;';
    var inpL = inp.replace('text-align:center;', 'text-align:left;');

    recalcArcade();

    var itemRows = '';
    if (d.items) {
      d.items.forEach(function(item, i) {
        itemRows += '<tr style="border-bottom:1px solid #1e2736;' + (i%2===1 ? 'background:#151a28;' : '') + '">' +
          '<td style="padding:3px;"><input type="number" min="0" class="arc-item" data-idx="' + i + '" data-field="qty" value="' + (item.qty||0) + '"' + dis + ' style="' + inp + '"></td>' +
          '<td style="padding:3px;"><input type="text" class="arc-item" data-idx="' + i + '" data-field="item" value="' + esc(item.item||'') + '"' + dis + ' style="' + inpL + '"></td>' +
          '<td style="padding:3px;"><input type="number" min="0" step="0.01" class="arc-item" data-idx="' + i + '" data-field="cost" value="' + (item.cost||0) + '"' + dis + ' style="' + inp + '"></td>' +
          '<td style="padding:3px;color:#6366f1;font-weight:600;font-size:0.75rem;">' + formatCurrency(item.amount||0) + '</td>' +
          '<td style="padding:3px;"><input type="number" min="0" class="arc-item" data-idx="' + i + '" data-field="quantity" value="' + (item.quantity||0) + '"' + dis + ' style="' + inp + '"></td>' +
          '<td style="padding:3px;"><input type="number" min="0" step="0.01" class="arc-item" data-idx="' + i + '" data-field="share" value="' + (item.share||0) + '"' + dis + ' style="' + inp + '"></td>' +
          '<td style="padding:3px;color:#22c55e;font-weight:600;font-size:0.75rem;">' + formatCurrency(item.total_sales||0) + '</td>' +
        '</tr>';
      });
    }

    var tokenDenoms = [10, 20, 50, 100, 150, 250];
    var tokenRows = '';
    tokenDenoms.forEach(function(k) {
      var val = d.token_decode ? (d.token_decode[k] || 0) : 0;
      tokenRows += '<tr style="border-bottom:1px solid #1e2736;">' +
        '<td style="padding:4px;color:#e2e8f0;font-weight:600;">' + k + '</td>' +
        '<td style="padding:3px;"><input type="number" min="0" class="arc-token" data-denom="' + k + '" value="' + val + '"' + dis + ' style="' + inp + '"></td>' +
      '</tr>';
    });

    var cashDenomRows = '';
    var denoms = [1000, 500, 200, 100, 50, 20, 10, 5, 1, 0.25];
    denoms.forEach(function(k) {
      var val = d.cash_denoms ? (d.cash_denoms[k] || 0) : 0;
      cashDenomRows += '<tr style="border-bottom:1px solid #1e2736;">' +
        '<td style="padding:4px;color:#e2e8f0;font-weight:600;">' + (k >= 1 ? k : '0.25') + '</td>' +
        '<td style="padding:3px;"><input type="number" min="0" class="arc-cash" data-denom="' + k + '" value="' + val + '"' + dis + ' style="' + inp + '"></td>' +
        '<td style="padding:4px;color:#6366f1;font-weight:600;font-size:0.75rem;">' + formatCurrency(val * k) + '</td>' +
      '</tr>';
    });

    app.innerHTML = '<div class="layout">' + renderSidebar() +
      '<div class="main-content">' + renderNavbar('Arcade Tracking Sheet') +
      '<div class="page-content" id="page-body" style="overflow-y:auto;">' +
      renderHeaderButtons(isSubmitted) +

      '<div style="display:grid;grid-template-columns:1fr 260px;gap:20px;">' +
      '<div id="tracking-print-area">' +

        '<div style="background:#1a1f2e;border:1px solid #2a3040;border-radius:12px;overflow:hidden;margin-bottom:16px;">' +
          '<div style="background:#1a5276;padding:10px 16px;text-align:center;">' +
            '<div style="color:#fff;font-weight:700;font-size:0.9rem;">ARCADE TRACKING SHEET</div>' +
          '</div>' +

          '<div style="padding:12px;">' +
            '<table style="width:100%;border-collapse:collapse;font-size:0.75rem;">' +
            '<thead><tr style="border-bottom:2px solid #2a3040;">' +
              '<th style="padding:6px;color:#f59e0b;min-width:50px;">QTY</th>' +
              '<th style="padding:6px;color:#f59e0b;text-align:left;min-width:140px;">ITEM</th>' +
              '<th style="padding:6px;color:#f59e0b;min-width:60px;">COST</th>' +
              '<th style="padding:6px;color:#f59e0b;min-width:70px;">AMOUNT</th>' +
              '<th style="padding:6px;color:#60a5fa;min-width:60px;">QUANTITY</th>' +
              '<th style="padding:6px;color:#60a5fa;min-width:60px;">SHARE</th>' +
              '<th style="padding:6px;color:#f87171;min-width:80px;">TOTAL SALES</th>' +
            '</tr></thead><tbody>' + itemRows + '</tbody></table>' +
          '</div>' +

          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;padding:12px;border-top:1px solid #2a3040;">' +
            '<div>' +
              '<div style="color:#f59e0b;font-weight:700;font-size:0.8rem;margin-bottom:8px;">DECODE (DLA TOKEN)</div>' +
              '<table style="width:100%;border-collapse:collapse;font-size:0.8rem;">' +
              '<thead><tr style="border-bottom:2px solid #2a3040;">' +
                '<th style="padding:6px;color:#94a3b8;">DENOM</th>' +
                '<th style="padding:6px;color:#94a3b8;">COUNT</th>' +
              '</tr></thead><tbody>' + tokenRows +
              '<tr style="border-top:2px solid #f59e0b;background:#1a1510;"><td style="padding:6px;color:#f59e0b;font-weight:700;">TOTAL</td><td style="padding:6px;color:#f59e0b;font-weight:700;text-align:center;">' + (d.token_total||0) + '</td></tr>' +
              '</tbody></table>' +
            '</div>' +
            '<div>' +
              '<div style="color:#22c55e;font-weight:700;font-size:0.8rem;margin-bottom:8px;">CASH</div>' +
              '<table style="width:100%;border-collapse:collapse;font-size:0.8rem;">' +
              '<thead><tr style="border-bottom:2px solid #2a3040;">' +
                '<th style="padding:6px;color:#94a3b8;">TYPE</th>' +
                '<th style="padding:6px;color:#94a3b8;">AMOUNT</th>' +
              '</tr></thead><tbody>' +
              '<tr style="border-bottom:1px solid #1e2736;"><td style="padding:4px;color:#e2e8f0;">Expenses</td><td style="padding:3px;"><input type="number" min="0" step="0.01" id="arc-expenses" value="' + (d.cash ? d.cash.expenses : 0) + '"' + dis + ' style="' + inp + '"></td></tr>' +
              '<tr style="border-bottom:1px solid #1e2736;"><td style="padding:4px;color:#e2e8f0;">Recharge</td><td style="padding:3px;"><input type="number" min="0" step="0.01" id="arc-recharge" value="' + (d.cash ? d.cash.recharge : 0) + '"' + dis + ' style="' + inp + '"></td></tr>' +
              '<tr style="border-bottom:1px solid #1e2736;"><td style="padding:4px;color:#e2e8f0;">Cash In</td><td style="padding:3px;"><input type="number" min="0" step="0.01" id="arc-cash-in" value="' + (d.cash ? d.cash.cash_in : 0) + '"' + dis + ' style="' + inp + '"></td></tr>' +
              '</tbody></table>' +
            '</div>' +
          '</div>' +

          '<div style="padding:12px;border-top:1px solid #2a3040;">' +
            '<div style="color:#22c55e;font-weight:700;font-size:0.8rem;margin-bottom:8px;">CASH DENOM</div>' +
            '<table style="width:100%;border-collapse:collapse;font-size:0.8rem;">' +
            '<thead><tr style="border-bottom:2px solid #2a3040;">' +
              '<th style="padding:6px;color:#94a3b8;">DENOM</th>' +
              '<th style="padding:6px;color:#60a5fa;">QTY</th>' +
              '<th style="padding:6px;color:#94a3b8;">TOTAL</th>' +
            '</tr></thead><tbody>' + cashDenomRows +
            '<tr style="border-top:2px solid #22c55e;background:#0d1a14;"><td style="padding:6px;color:#22c55e;font-weight:700;">TOTAL</td><td></td><td style="padding:6px;color:#22c55e;font-weight:700;">' + formatCurrency(d.cash_denom_total||0) + '</td></tr>' +
            '</tbody></table>' +
          '</div>' +

          '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;padding:12px;border-top:1px solid #2a3040;">' +
            '<div><label style="color:#888;font-size:0.7rem;display:block;margin-bottom:3px;">CASHIER NAME</label>' +
            '<input type="text" id="ts-cashier" value="' + esc(sheet.cashier_name||'') + '"' + dis + ' style="width:100%;background:#0d1117;border:1px solid #30363d;border-radius:4px;padding:6px;color:#e2e8f0;font-size:0.8rem;"></div>' +
            '<div><label style="color:#888;font-size:0.7rem;display:block;margin-bottom:3px;">DATE</label>' +
            '<input type="date" id="ts-date" value="' + esc(sheet.sheet_date||'') + '"' + dis + ' style="width:100%;background:#0d1117;border:1px solid #30363d;border-radius:4px;padding:6px;color:#e2e8f0;font-size:0.8rem;"></div>' +
            '<div></div>' +
            '<div><label style="color:#888;font-size:0.7rem;display:block;margin-bottom:3px;">TOTAL SALES</label>' +
            '<div style="background:#0d1117;border:1px solid #30363d;border-radius:4px;padding:6px;color:#22c55e;font-weight:700;font-size:0.9rem;">' + formatCurrency(sheet.total_sales||0) + '</div></div>' +
            '<div><label style="color:#888;font-size:0.7rem;display:block;margin-bottom:3px;">TOTAL CASH OH</label>' +
            '<input type="number" min="0" step="0.01" id="ts-cash" value="' + (sheet.total_cash_on_hand||0) + '"' + dis + ' style="width:100%;background:#0d1117;border:1px solid #30363d;border-radius:4px;padding:6px;color:#e2e8f0;font-size:0.8rem;"></div>' +
            '<div><label style="color:#888;font-size:0.7rem;display:block;margin-bottom:3px;">CASHFLOW</label>' +
            '<div style="background:#0d1117;border:1px solid #30363d;border-radius:4px;padding:6px;color:#f59e0b;font-weight:700;font-size:0.9rem;">' + formatCurrency(sheet.cashflow||0) + '</div></div>' +
          '</div>' +

          '<div style="padding:12px;border-top:1px solid #2a3040;">' +
            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">' +
              '<div><label style="color:#888;font-size:0.7rem;display:block;margin-bottom:3px;">OTHERS</label>' +
              '<input type="text" id="ts-remarks-short" value="' + esc(sheet.remarks_short||'') + '"' + dis + ' style="width:100%;background:#0d1117;border:1px solid #30363d;border-radius:4px;padding:6px;color:#e2e8f0;font-size:0.8rem;"></div>' +
              '<div><label style="color:#888;font-size:0.7rem;display:block;margin-bottom:3px;">TOKEN INS/OUT EXPLANATION</label>' +
              '<input type="text" id="ts-remarks-over" value="' + esc(sheet.remarks_over||'') + '"' + dis + ' style="width:100%;background:#0d1117;border:1px solid #30363d;border-radius:4px;padding:6px;color:#e2e8f0;font-size:0.8rem;"></div>' +
            '</div>' +
          '</div>' +

        '</div>' +
      '</div>' +

      '<div style="display:flex;flex-direction:column;gap:12px;">' +
        '<div style="background:#1a1f2e;border:1px solid #2a3040;border-radius:12px;padding:16px;">' +
          '<div style="color:#94a3b8;font-size:0.75rem;font-weight:600;margin-bottom:12px;text-transform:uppercase;">Summary</div>' +
          '<div style="display:flex;flex-direction:column;gap:8px;">' +
            '<div style="display:flex;justify-content:space-between;"><span style="color:#888;font-size:0.8rem;">Cashier</span><span style="color:#e2e8f0;font-weight:600;">' + esc(sheet.cashier_name||'-') + '</span></div>' +
            '<div style="display:flex;justify-content:space-between;"><span style="color:#888;font-size:0.8rem;">Token Count</span><span style="color:#f59e0b;font-weight:600;">' + (d.token_total||0) + '</span></div>' +
            '<div style="display:flex;justify-content:space-between;"><span style="color:#888;font-size:0.8rem;">Cash Denoms</span><span style="color:#6366f1;font-weight:600;">' + formatCurrency(d.cash_denom_total||0) + '</span></div>' +
            '<hr style="border:none;border-top:1px solid #2a3040;">' +
            '<div style="display:flex;justify-content:space-between;"><span style="color:#888;font-size:0.8rem;">Total Sales</span><span style="color:#22c55e;font-weight:700;font-size:1rem;">' + formatCurrency(sheet.total_sales||0) + '</span></div>' +
            '<div style="display:flex;justify-content:space-between;"><span style="color:#888;font-size:0.8rem;">Cashflow</span><span style="color:#f59e0b;font-weight:700;font-size:1rem;">' + formatCurrency(sheet.cashflow||0) + '</span></div>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '</div></div></div>';

    attachArcadeEvents();
  }

  function attachArcadeEvents() {
    document.getElementById('logout-btn')?.addEventListener('click', function(e) { e.preventDefault(); Auth.logout(); });
    document.querySelectorAll('.arc-item').forEach(function(el) {
      el.addEventListener('change', function() {
        var idx = parseInt(el.dataset.idx);
        var field = el.dataset.field;
        if (editingSheet.data && editingSheet.data.items && editingSheet.data.items[idx]) {
          editingSheet.data.items[idx][field] = field === 'item' ? el.value : (parseFloat(el.value) || 0);
        }
      });
    });
    document.querySelectorAll('.arc-token').forEach(function(el) {
      el.addEventListener('change', function() {
        var denom = parseInt(el.dataset.denom);
        if (editingSheet.data && editingSheet.data.token_decode) {
          editingSheet.data.token_decode[denom] = parseInt(el.value) || 0;
        }
      });
    });
    document.querySelectorAll('.arc-cash').forEach(function(el) {
      el.addEventListener('change', function() {
        var denom = parseFloat(el.dataset.denom);
        if (editingSheet.data && editingSheet.data.cash_denoms) {
          editingSheet.data.cash_denoms[denom] = parseFloat(el.value) || 0;
        }
      });
    });
    var expEl = document.getElementById('arc-expenses');
    if (expEl) expEl.addEventListener('change', function() { if (editingSheet.data.cash) editingSheet.data.cash.expenses = parseFloat(expEl.value) || 0; });
    var rcEl = document.getElementById('arc-recharge');
    if (rcEl) rcEl.addEventListener('change', function() { if (editingSheet.data.cash) editingSheet.data.cash.recharge = parseFloat(rcEl.value) || 0; });
    var ciEl = document.getElementById('arc-cash-in');
    if (ciEl) ciEl.addEventListener('change', function() { if (editingSheet.data.cash) editingSheet.data.cash.cash_in = parseFloat(ciEl.value) || 0; });
  }

  function attachCafeEvents() {
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
  }

  function esc(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  window.__tsNew = function(area) { createNewSheet(area); };
  window.__tsBack = function() { editingSheet = null; view = 'list'; loadSheets(); };
  window.__tsEdit = function(id) { var s = sheets.find(function(s) { return s.id === id; }); if (s) editSheet(s); };
  window.__tsView = function(id) { var s = sheets.find(function(s) { return s.id === id; }); if (s) editSheet(s); };
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

  loadData();
}

Router.register('tracking', renderAdminTracking);
