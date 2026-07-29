function renderAdminPayslips() {
  var app = document.getElementById('app');
  var currentUser = Auth.getUser();
  var activeTab = 'all';
  var allPayslips = [];
  var currentPage = 1;
  var pageSize = 10;
  var totalItems = 0;
  var searchQuery = '';
  var historyPage = 1;
  var historyTotal = 0;
  var historyItems = [];

  var INPUT = 'width:100%;background:#0d1117;border:1px solid #30363d;border-radius:8px;padding:10px 12px;color:#e2e8f0;font-size:0.85rem;outline:none;transition:border 0.2s;box-sizing:border-box;';
  var LABEL = 'color:#94a3b8;font-size:0.72rem;display:block;margin-bottom:5px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;';

  async function loadData() {
    try {
      var params = 'page=' + currentPage + '&page_size=' + pageSize;
      if (searchQuery) params += '&search=' + encodeURIComponent(searchQuery);
      if (activeTab !== 'all' && activeTab !== 'history') params += '&status=' + activeTab;
      var res = await apiGet('/payslips?' + params);
      allPayslips = res.items || [];
      totalItems = res.total || 0;
      render();
    } catch (e) {
      Toast.error('Failed to load payslips');
    }
  }

  async function loadHistory() {
    try {
      var res = await apiGet('/payslips/history?page=' + historyPage + '&page_size=' + pageSize);
      historyItems = res.items || [];
      historyTotal = res.total || 0;
      render();
    } catch (e) {
      Toast.error('Failed to load payslip history');
    }
  }

  function render() {
    var approved = allPayslips.filter(function(p) { return p.status === 'approved'; });
    var pending = allPayslips.filter(function(p) { return p.status === 'pending'; });
    var approvedAmt = approved.reduce(function(s, p) { return s + (p.total_pay || 0); }, 0);
    var pendingAmt = pending.reduce(function(s, p) { return s + (p.total_pay || 0); }, 0);
    var totalAll = approvedAmt + pendingAmt;

    app.innerHTML = '<div class="layout">' + renderSidebar() +
      '<div class="main-content">' + renderNavbar('Payslip Management') +
      '<div class="page-content" id="page-body">' +
      '<style>.ps-tab{padding:8px 18px;border-radius:8px;border:none;font-size:0.85rem;font-weight:600;cursor:pointer;transition:all 0.2s;background:#0d1117;color:#64748b;border:1px solid #1e2936;}.ps-tab.active{background:linear-gradient(135deg,#6366f1,#818cf8);color:#fff;box-shadow:0 2px 10px rgba(99,102,241,0.3);border:none;}</style>' +

      '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:24px;">' +
        '<div style="background:#1a1f2e;border:1px solid #2a3040;border-radius:12px;padding:16px;">' +
          '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">' +
            '<div style="width:36px;height:36px;border-radius:8px;background:rgba(99,102,241,0.12);display:flex;align-items:center;justify-content:center;"><svg width="18" height="18" fill="none" stroke="#6366f1" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg></div>' +
            '<div><div style="color:#888;font-size:0.65rem;text-transform:uppercase;">Total Payslips</div><div style="color:#e2e8f0;font-weight:700;font-size:1.2rem;">' + totalItems + '</div></div>' +
          '</div>' +
          '<div style="color:#64748b;font-size:0.7rem;">Current month</div></div>' +
        '<div style="background:#1a1f2e;border:1px solid #2a3040;border-radius:12px;padding:16px;">' +
          '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">' +
            '<div style="width:36px;height:36px;border-radius:8px;background:rgba(34,197,94,0.12);display:flex;align-items:center;justify-content:center;"><svg width="18" height="18" fill="none" stroke="#22c55e" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div>' +
            '<div><div style="color:#888;font-size:0.65rem;text-transform:uppercase;">Approved</div><div style="color:#22c55e;font-weight:700;font-size:1.2rem;">' + approved.length + '</div></div>' +
          '</div>' +
          '<div style="color:#22c55e;font-size:0.7rem;font-weight:600;">' + formatCurrency(approvedAmt) + '</div></div>' +
        '<div style="background:#1a1f2e;border:1px solid #2a3040;border-radius:12px;padding:16px;">' +
          '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">' +
            '<div style="width:36px;height:36px;border-radius:8px;background:rgba(245,158,11,0.12);display:flex;align-items:center;justify-content:center;"><svg width="18" height="18" fill="none" stroke="#f59e0b" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div>' +
            '<div><div style="color:#888;font-size:0.65rem;text-transform:uppercase;">Pending</div><div style="color:#f59e0b;font-weight:700;font-size:1.2rem;">' + pending.length + '</div></div>' +
          '</div>' +
          '<div style="color:#f59e0b;font-size:0.7rem;font-weight:600;">' + formatCurrency(pendingAmt) + '</div></div>' +
        '<div style="background:#1a1f2e;border:1px solid #2a3040;border-radius:12px;padding:16px;">' +
          '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">' +
            '<div style="width:36px;height:36px;border-radius:8px;background:rgba(168,162,255,0.12);display:flex;align-items:center;justify-content:center;"><svg width="18" height="18" fill="none" stroke="#a78bfa" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div>' +
            '<div><div style="color:#888;font-size:0.65rem;text-transform:uppercase;">Total Amount</div><div style="color:#a78bfa;font-weight:700;font-size:1.2rem;">' + formatCurrency(totalAll) + '</div></div>' +
          '</div>' +
          '<div style="color:#64748b;font-size:0.7rem;">Approved + Pending</div></div>' +
      '</div>' +

      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:12px;">' +
        '<div style="display:flex;gap:8px;align-items:center;">' +
          '<button class="ps-tab' + (activeTab === 'all' ? ' active' : '') + '" data-tab="all">All</button>' +
          '<button class="ps-tab' + (activeTab === 'pending' ? ' active' : '') + '" data-tab="pending">Pending</button>' +
          '<button class="ps-tab' + (activeTab === 'approved' ? ' active' : '') + '" data-tab="approved">Approved</button>' +
          '<button class="ps-tab' + (activeTab === 'history' ? ' active' : '') + '" data-tab="history">History</button>' +
        '</div>' +
        '<div style="display:flex;gap:10px;align-items:center;">' +
          (activeTab !== 'history' ? '<input type="text" id="ps-search" placeholder="Search employee..." value="' + escP(searchQuery) + '" style="background:#0d1117;border:1px solid #30363d;border-radius:8px;padding:8px 14px;color:#e2e8f0;font-size:0.85rem;width:200px;">' : '') +
          (currentUser.role === 'owner' && activeTab !== 'history' ? '<button id="archive-month-btn" style="background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff;border:none;border-radius:8px;padding:9px 18px;cursor:pointer;font-weight:600;font-size:0.85rem;display:flex;align-items:center;gap:6px;box-shadow:0 2px 10px rgba(239,68,68,0.3);" onmouseenter="this.style.boxShadow=\'0 4px 20px rgba(239,68,68,0.4)\'" onmouseleave="this.style.boxShadow=\'0 2px 10px rgba(239,68,68,0.3)\'"><svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8"/></svg> Archive Month</button>' : '') +
          (currentUser.role === 'owner' || currentUser.role === 'admin' ?
            '<button id="create-payslip-btn" style="background:linear-gradient(135deg,#6366f1,#818cf8);color:#fff;border:none;border-radius:8px;padding:9px 22px;cursor:pointer;font-weight:600;font-size:0.85rem;display:flex;align-items:center;gap:6px;box-shadow:0 2px 10px rgba(99,102,241,0.3);" onmouseenter="this.style.boxShadow=\'0 4px 20px rgba(99,102,241,0.4)\'" onmouseleave="this.style.boxShadow=\'0 2px 10px rgba(99,102,241,0.3)\'"><svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg> Create Payslip</button>' : '') +
        '</div>' +
      '</div>' +

      '<div id="payslips-grid"></div>' +
      '<div id="payslips-pagination"></div>' +

      '</div></div></div>';

    if (activeTab === 'history') {
      renderHistoryList(historyItems);
      renderPagination(historyTotal, historyPage, '#payslips-pagination', function(pg) { historyPage = pg; loadHistory(); });
    } else {
      renderPayslips(allPayslips);
      renderPagination(totalItems, currentPage, '#payslips-pagination', function(pg) { currentPage = pg; loadData(); });
    }

    document.getElementById('logout-btn')?.addEventListener('click', function(e) { e.preventDefault(); Auth.logout(); });
    document.getElementById('create-payslip-btn')?.addEventListener('click', function() { showCreateModal(); });
    document.getElementById('archive-month-btn')?.addEventListener('click', async function() {
      var ok = await confirmAsync('Archive all current payslips for the month? This will move them to History and clear the current list.', 'Archive Month', 'warning');
      if (!ok) return;
      try {
        var res = await apiPost('/payslips/archive-month', {});
        Toast.success(res.detail || 'Month archived!');
        loadData();
      } catch (err) { Toast.error(err.message); }
    });
    document.getElementById('ps-search')?.addEventListener('input', function(e) {
      searchQuery = e.target.value;
      currentPage = 1;
      loadData();
    });
    document.querySelectorAll('.ps-tab').forEach(function(btn) {
      btn.addEventListener('click', function() {
        document.querySelectorAll('.ps-tab').forEach(function(b) { b.classList.remove('active'); });
        this.classList.add('active');
        activeTab = this.dataset.tab;
        currentPage = 1;
        historyPage = 1;
        searchQuery = '';
        if (activeTab === 'history') {
          loadHistory();
        } else {
          loadData();
        }
      });
    });
  }

  function renderPagination(total, page, containerSel, onPageChange) {
    var container = document.querySelector(containerSel);
    if (!container) return;
    var totalPages = Math.ceil(total / pageSize);
    if (totalPages <= 1) { container.innerHTML = ''; return; }
    var html = '<div style="display:flex;justify-content:center;align-items:center;gap:8px;margin-top:20px;">';
    html += '<button data-pg="' + (page - 1) + '" style="padding:6px 12px;border-radius:6px;border:1px solid #30363d;background:#0d1117;color:' + (page > 1 ? '#e2e8f0' : '#334155') + ';cursor:' + (page > 1 ? 'pointer' : 'default') + ';font-size:0.8rem;">Prev</button>';
    var start = Math.max(1, page - 2);
    var end = Math.min(totalPages, page + 2);
    if (start > 1) {
      html += '<button data-pg="1" style="padding:6px 10px;border-radius:6px;border:1px solid #30363d;background:#0d1117;color:#e2e8f0;cursor:pointer;font-size:0.8rem;">1</button>';
      if (start > 2) html += '<span style="color:#475569;font-size:0.8rem;">...</span>';
    }
    for (var i = start; i <= end; i++) {
      html += '<button data-pg="' + i + '" style="padding:6px 10px;border-radius:6px;border:1px solid ' + (i === page ? '#6366f1' : '#30363d') + ';background:' + (i === page ? '#6366f1' : '#0d1117') + ';color:#fff;cursor:pointer;font-size:0.8rem;font-weight:600;">' + i + '</button>';
    }
    if (end < totalPages) {
      if (end < totalPages - 1) html += '<span style="color:#475569;font-size:0.8rem;">...</span>';
      html += '<button data-pg="' + totalPages + '" style="padding:6px 10px;border-radius:6px;border:1px solid #30363d;background:#0d1117;color:#e2e8f0;cursor:pointer;font-size:0.8rem;">' + totalPages + '</button>';
    }
    html += '<button data-pg="' + (page + 1) + '" style="padding:6px 12px;border-radius:6px;border:1px solid #30363d;background:#0d1117;color:' + (page < totalPages ? '#e2e8f0' : '#334155') + ';cursor:' + (page < totalPages ? 'pointer' : 'default') + ';font-size:0.8rem;">Next</button>';
    html += '</div>';
    container.innerHTML = html;
    container.querySelectorAll('button[data-pg]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var pg = parseInt(this.dataset.pg);
        if (pg >= 1 && pg <= totalPages) onPageChange(pg);
      });
    });
  }

  function renderHistoryList(list) {
    var container = document.getElementById('payslips-grid');
    if (!container) return;
    if (list.length === 0) {
      container.innerHTML = '<div style="text-align:center;padding:60px;color:#555;"><svg width="40" height="40" fill="none" stroke="#334155" viewBox="0 0 24 24" style="margin-bottom:12px;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg><div style="font-size:0.9rem;">No archived payslips</div></div>';
      return;
    }
    var html = '<div style="display:flex;flex-direction:column;gap:10px;">';
    list.forEach(function(p) {
      var isApproved = p.status === 'approved';
      var statusColor = isApproved ? '#22c55e' : '#f59e0b';
      var statusBg = isApproved ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)';
      var statusBorder = isApproved ? 'rgba(34,197,94,0.2)' : 'rgba(245,158,11,0.2)';
      var startStr = new Date(p.period_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      var endStr = new Date(p.period_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      var archivedStr = p.archived_at ? new Date(p.archived_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
      var initials = escP((p.user_name || '??').split(' ').map(function(w) { return w.charAt(0); }).join('').substring(0, 2));

      html += '<div style="background:#1a1f2e;border:1px solid #2a3040;border-radius:12px;padding:16px 20px;display:grid;grid-template-columns:auto 1fr auto auto;gap:20px;align-items:center;opacity:0.85;transition:border-color 0.2s;" onmouseenter="this.style.borderColor=\'#334155\'" onmouseleave="this.style.borderColor=\'#2a3040\'">' +
        '<div style="display:flex;align-items:center;gap:12px;">' +
          '<div style="width:42px;height:42px;border-radius:10px;background:linear-gradient(135deg,#1a1a2e,#16213e);display:flex;align-items:center;justify-content:center;color:#64748b;font-weight:700;font-size:0.8rem;border:1px solid #2a3040;">' + initials + '</div>' +
          '<div>' +
            '<div style="color:#e2e8f0;font-weight:600;font-size:0.9rem;">' + escP(p.user_name || 'Unknown') + '</div>' +
            '<div style="color:#64748b;font-size:0.72rem;">' + escP(p.branch_name || '') + ' &middot; ' + startStr + ' - ' + endStr + '</div>' +
          '</div>' +
        '</div>' +
        '<div style="text-align:right;">' +
          '<div style="color:#22c55e;font-weight:700;font-size:1.1rem;">' + formatCurrency(p.total_pay) + '</div>' +
          '<div style="color:#475569;font-size:0.65rem;">Archived ' + archivedStr + '</div>' +
        '</div>' +
        '<span style="display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:6px;font-size:0.65rem;font-weight:600;background:' + statusBg + ';color:' + statusColor + ';border:1px solid ' + statusBorder + ';text-transform:uppercase;white-space:nowrap;">' +
          p.status +
        '</span>' +
        '<button onclick="window.__viewHistoryPayslip(' + p.id + ')" title="View" style="padding:7px;border:1px solid #30363d;border-radius:6px;background:#0d1117;color:#94a3b8;cursor:pointer;display:flex;align-items:center;justify-content:center;" onmouseenter="this.style.borderColor=\'#6366f1\';this.style.color=\'#a78bfa\'" onmouseleave="this.style.borderColor=\'#30363d\';this.style.color=\'#94a3b8\'"><svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg></button>' +
      '</div>';
    });
    html += '</div>';
    container.innerHTML = html;

    window.__viewHistoryPayslip = function(id) {
      var p = historyItems.find(function(x) { return x.id === id; });
      if (p) showPayslipDetail(p, true);
    };
  }

  function renderPayslips(list) {
    var container = document.getElementById('payslips-grid');
    if (!container) return;

    if (list.length === 0) {
      container.innerHTML = '<div style="text-align:center;padding:60px;color:#555;"><svg width="40" height="40" fill="none" stroke="#334155" viewBox="0 0 24 24" style="margin-bottom:12px;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg><div style="font-size:0.9rem;">No payslips found</div></div>';
      return;
    }

    var html = '<div style="display:flex;flex-direction:column;gap:10px;">';
    list.forEach(function(p) {
      var isApproved = p.status === 'approved';
      var isOwnPayslip = p.user_id === currentUser.id;
      var canEdit = !isOwnPayslip && !isApproved;
      var canApprove = !isOwnPayslip && !isApproved;
      var statusColor = isApproved ? '#22c55e' : '#f59e0b';
      var statusBg = isApproved ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)';
      var statusBorder = isApproved ? 'rgba(34,197,94,0.2)' : 'rgba(245,158,11,0.2)';

      var startStr = new Date(p.period_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      var endStr = new Date(p.period_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      var initials = escP((p.user_name || '??').split(' ').map(function(w) { return w.charAt(0); }).join('').substring(0, 2));

      html += '<div style="background:#1a1f2e;border:1px solid #2a3040;border-radius:12px;padding:16px 20px;display:grid;grid-template-columns:auto 1fr auto auto auto;gap:20px;align-items:center;transition:border-color 0.2s;" onmouseenter="this.style.borderColor=\'#334155\'" onmouseleave="this.style.borderColor=\'#2a3040\'">' +
        '<div style="display:flex;align-items:center;gap:12px;">' +
          '<div style="width:42px;height:42px;border-radius:10px;background:linear-gradient(135deg,' + (isApproved ? '#0f2922,#1a3d30' : '#1a1525,#251e35') + ');display:flex;align-items:center;justify-content:center;color:' + statusColor + ';font-weight:700;font-size:0.8rem;border:1px solid ' + statusBorder + ';">' + initials + '</div>' +
          '<div>' +
            '<div style="color:#e2e8f0;font-weight:600;font-size:0.9rem;">' + escP(p.user_name || 'Unknown') + '</div>' +
            '<div style="color:#64748b;font-size:0.72rem;">' + escP(p.branch_name || '') + ' &middot; ' + startStr + ' - ' + endStr + '</div>' +
          '</div>' +
        '</div>' +

        '<div style="display:flex;gap:24px;">' +
          '<div><div style="color:#64748b;font-size:0.6rem;text-transform:uppercase;letter-spacing:0.5px;">Base</div><div style="color:#e2e8f0;font-weight:600;font-size:0.85rem;">' + formatCurrency(p.base_pay) + '</div></div>' +
          '<div><div style="color:#64748b;font-size:0.6rem;text-transform:uppercase;letter-spacing:0.5px;">OT Pay</div><div style="color:#60a5fa;font-weight:600;font-size:0.85rem;">' + formatCurrency(p.overtime_pay) + '</div></div>' +
          (p.bonuses > 0 ? '<div><div style="color:#64748b;font-size:0.6rem;text-transform:uppercase;letter-spacing:0.5px;">Bonuses</div><div style="color:#22c55e;font-weight:600;font-size:0.85rem;">+' + formatCurrency(p.bonuses) + '</div></div>' : '') +
          (p.deductions > 0 ? '<div><div style="color:#64748b;font-size:0.6rem;text-transform:uppercase;letter-spacing:0.5px;">Deductions</div><div style="color:#ef4444;font-weight:600;font-size:0.85rem;">-' + formatCurrency(p.deductions) + '</div></div>' : '') +
        '</div>' +

        '<div style="text-align:right;">' +
          '<div style="color:#64748b;font-size:0.6rem;text-transform:uppercase;letter-spacing:0.5px;">Net Pay</div>' +
          '<div style="color:#22c55e;font-weight:700;font-size:1.15rem;">' + formatCurrency(p.total_pay) + '</div>' +
          '<div style="color:#475569;font-size:0.65rem;">' + (p.hours_worked || 0) + 'h + ' + (p.overtime_hours || 0) + 'h OT</div>' +
        '</div>' +

        '<span style="display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:6px;font-size:0.65rem;font-weight:600;background:' + statusBg + ';color:' + statusColor + ';border:1px solid ' + statusBorder + ';text-transform:uppercase;white-space:nowrap;">' +
          (isApproved ? '<svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>' : '<svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>') +
          p.status +
        '</span>' +

        '<div style="display:flex;gap:6px;">' +
          '<button onclick="window.__viewPayslip(' + p.id + ')" title="View" style="padding:7px;border:1px solid #30363d;border-radius:6px;background:#0d1117;color:#94a3b8;cursor:pointer;display:flex;align-items:center;justify-content:center;" onmouseenter="this.style.borderColor=\'#6366f1\';this.style.color=\'#a78bfa\'" onmouseleave="this.style.borderColor=\'#30363d\';this.style.color=\'#94a3b8\'"><svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg></button>' +
          (canEdit ? '<button onclick="window.__editPayslip(' + p.id + ')" title="Edit" style="padding:7px;border:1px solid #30363d;border-radius:6px;background:#0d1117;color:#94a3b8;cursor:pointer;display:flex;align-items:center;justify-content:center;" onmouseenter="this.style.borderColor=\'#f59e0b\';this.style.color=\'#fbbf24\'" onmouseleave="this.style.borderColor=\'#30363d\';this.style.color=\'#94a3b8\'"><svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg></button>' : '') +
          (canApprove ? '<button onclick="window.__approvePayslip(' + p.id + ')" title="Approve" style="padding:7px;border:1px solid #30363d;border-radius:6px;background:#0d1117;color:#94a3b8;cursor:pointer;display:flex;align-items:center;justify-content:center;" onmouseenter="this.style.borderColor=\'#22c55e\';this.style.color=\'#4ade80\'" onmouseleave="this.style.borderColor=\'#30363d\';this.style.color=\'#94a3b8\'"><svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg></button>' : '') +
        '</div>' +
      '</div>';
    });
    html += '</div>';
    container.innerHTML = html;

    window.__viewPayslip = function(id) {
      var p = allPayslips.find(function(x) { return x.id === id; });
      if (p) showPayslipDetail(p);
    };
    window.__editPayslip = function(id) {
      var p = allPayslips.find(function(x) { return x.id === id; });
      if (p) showEditModal(p);
    };
    window.__approvePayslip = async function(id) {
      var ok = await confirmAsync('Approve this payslip? This action cannot be undone.', 'Approve Payslip', 'success');
      if (!ok) return;
      try { await apiPut('/payslips/' + id + '/approve', {}); Toast.success('Payslip approved!'); loadData(); } catch (err) { Toast.error(err.message); }
    };
  }

  var DREAMLAND_LOGO = '<svg width="200" height="48" viewBox="0 0 200 48" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="dl-grad1" x1="0" y1="0" x2="24" y2="24"><stop stop-color="#a855f7"/><stop offset="1" stop-color="#6366f1"/></linearGradient><linearGradient id="dl-grad2" x1="36" y1="8" x2="190" y2="40"><stop stop-color="#a855f7"/><stop offset="0.5" stop-color="#6366f1"/><stop offset="1" stop-color="#06b6d4"/></linearGradient></defs><path d="M4 14c0-1 .8-2 2-2.2l6-1c1.5-.2 2.5 1 2.5 2.5v12c0 1.5-1 2.7-2.5 2.5l-6-1c-1.2-.2-2-1.2-2-2.2V14z" stroke="url(#dl-grad1)" stroke-width="1.8" fill="none"/><circle cx="10" cy="15" r="1.5" fill="#a855f7"/><circle cx="14" cy="19" r="1.5" fill="#6366f1"/><path d="M30 16c0-1 .8-2 2-2.2l6-1c1.5-.2 2.5 1 2.5 2.5v12c0 1.5-1 2.7-2.5 2.5l-6-1c-1.2-.2-2-1.2-2-2.2V16z" stroke="url(#dl-grad1)" stroke-width="1.8" fill="none"/><circle cx="36" cy="17" r="1.5" fill="#a855f7"/><circle cx="40" cy="21" r="1.5" fill="#6366f1"/><path d="M12 12h20" stroke="url(#dl-grad1)" stroke-width="1.8" stroke-linecap="round"/><text x="48" y="22" fill="url(#dl-grad2)" font-family="Arial,Helvetica,sans-serif" font-weight="800" font-size="17" letter-spacing="0.5">DREAMLAND</text><text x="48" y="38" fill="#06b6d4" font-family="Arial,Helvetica,sans-serif" font-weight="600" font-size="10" letter-spacing="5">ARCADE</text></svg>';
  var DREAMLAND_LOGO_ICON = '<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="dl-icon1" x1="6" y1="6" x2="42" y2="42"><stop stop-color="#a855f7"/><stop offset="1" stop-color="#06b6d4"/></linearGradient></defs><rect x="2" y="2" width="44" height="44" rx="12" fill="#0a0e1a" stroke="url(#dl-icon1)" stroke-width="1.5"/><path d="M10 18c0-1.2 1-2.2 2.2-2.4l5-.8c1.6-.3 2.8 1 2.8 2.6v12c0 1.6-1.2 2.9-2.8 2.6l-5-.8c-1.2-.2-2.2-1.2-2.2-2.4V18z" stroke="url(#dl-icon1)" stroke-width="1.8" fill="none"/><circle cx="15" cy="19" r="1.5" fill="#a855f7"/><circle cx="19" cy="23" r="1.5" fill="#6366f1"/><path d="M28 18c0-1.2 1-2.2 2.2-2.4l5-.8c1.6-.3 2.8 1 2.8 2.6v12c0 1.6-1.2 2.9-2.8 2.6l-5-.8c-1.2-.2-2.2-1.2-2.2-2.4V18z" stroke="url(#dl-icon1)" stroke-width="1.8" fill="none"/><circle cx="33" cy="19" r="1.5" fill="#a855f7"/><circle cx="37" cy="23" r="1.5" fill="#6366f1"/><path d="M14 15h20" stroke="url(#dl-icon1)" stroke-width="1.8" stroke-linecap="round"/></svg>';

  function showPayslipDetail(p, isArchived) {
    var startStr = new Date(p.period_start).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    var endStr = new Date(p.period_end).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    var isApproved = p.status === 'approved';
    var statusColor = isApproved ? '#22c55e' : '#f59e0b';
    var statusBg = isApproved ? 'rgba(34,197,94,0.12)' : 'rgba(245,158,11,0.12)';
    var statusBorder = isApproved ? 'rgba(34,197,94,0.3)' : 'rgba(245,158,11,0.3)';

    var html = '' +
      '<div style="background:linear-gradient(135deg,#060a14,#0a0e1a,#0c1222);border:1px solid #1e293b;border-radius:16px;overflow:hidden;position:relative;">' +

        '<div style="position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,#6366f1,#22c55e,#6366f1);"></div>' +

        '<div style="padding:28px 32px 0;">' +
          '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;">' +
            '<div style="display:flex;align-items:center;gap:14px;">' +
              DREAMLAND_LOGO +
              '<div><div style="color:#e2e8f0;font-size:1.15rem;font-weight:800;letter-spacing:0.5px;">DREAMLAND ARCADE</div><div style="color:#6366f1;font-size:0.65rem;text-transform:uppercase;letter-spacing:2px;margin-top:2px;">Pay Slip</div></div>' +
            '</div>' +
            '<div style="text-align:right;">' +
              '<div style="display:inline-flex;align-items:center;gap:5px;padding:5px 14px;border-radius:20px;font-size:0.7rem;font-weight:600;background:' + statusBg + ';color:' + statusColor + ';border:1px solid ' + statusBorder + ';text-transform:uppercase;">' +
                (isApproved ? '<svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>' : '<svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>') +
                (isArchived ? 'Archived &middot; ' : '') + p.status +
              '</div>' +
              '<div style="color:#475569;font-size:0.65rem;margin-top:6px;">' + escP(p.branch_name || '') + '</div>' +
            '</div>' +
          '</div>' +

          '<div style="background:#0f172a;border:1px solid #1e293b;border-radius:12px;padding:20px;margin-bottom:20px;">' +
            '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px;">' +
              '<div><div style="color:#475569;font-size:0.6rem;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Employee</div><div style="color:#e2e8f0;font-weight:600;font-size:0.9rem;">' + escP(p.user_name) + '</div></div>' +
              '<div><div style="color:#475569;font-size:0.6rem;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Period</div><div style="color:#e2e8f0;font-size:0.85rem;">' + startStr + ' <span style="color:#475569;">to</span> ' + endStr + '</div></div>' +
              '<div><div style="color:#475569;font-size:0.6rem;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Hours</div><div style="color:#e2e8f0;font-size:0.85rem;">' + (p.hours_worked || 0) + 'h regular + ' + (p.overtime_hours || 0) + 'h OT</div></div>' +
            '</div>' +
          '</div>' +

          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px;">' +
            '<div style="background:linear-gradient(180deg,rgba(34,197,94,0.04),transparent);border:1px solid rgba(34,197,94,0.12);border-radius:12px;padding:20px;">' +
              '<div style="color:#22c55e;font-size:0.65rem;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:16px;display:flex;align-items:center;gap:6px;"><svg width="14" height="14" fill="none" stroke="#22c55e" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> Earnings</div>' +
              '<div style="display:flex;flex-direction:column;gap:12px;">' +
                '<div style="display:flex;justify-content:space-between;align-items:center;padding-bottom:10px;border-bottom:1px solid #1e293b;"><span style="color:#94a3b8;font-size:0.85rem;">Base Pay</span><span style="color:#e2e8f0;font-weight:600;font-size:0.9rem;">' + formatCurrency(p.base_pay) + '</span></div>' +
                '<div style="display:flex;justify-content:space-between;align-items:center;padding-bottom:10px;border-bottom:1px solid #1e293b;"><span style="color:#94a3b8;font-size:0.85rem;">Overtime Pay</span><span style="color:#60a5fa;font-weight:600;font-size:0.9rem;">' + formatCurrency(p.overtime_pay) + '</span></div>' +
                (p.bonuses > 0 ? '<div style="display:flex;justify-content:space-between;align-items:center;padding-bottom:10px;border-bottom:1px solid #1e293b;"><span style="color:#94a3b8;font-size:0.85rem;">Bonuses</span><span style="color:#22c55e;font-weight:600;font-size:0.9rem;">' + formatCurrency(p.bonuses) + '</span></div>' : '') +
                '<div style="display:flex;justify-content:space-between;align-items:center;padding-top:4px;"><span style="color:#94a3b8;font-size:0.8rem;font-weight:600;">Total Earnings</span><span style="color:#22c55e;font-weight:700;font-size:1rem;">' + formatCurrency((p.base_pay || 0) + (p.overtime_pay || 0) + (p.bonuses || 0)) + '</span></div>' +
              '</div>' +
            '</div>' +
            '<div style="background:linear-gradient(180deg,rgba(239,68,68,0.04),transparent);border:1px solid rgba(239,68,68,0.12);border-radius:12px;padding:20px;">' +
              '<div style="color:#ef4444;font-size:0.65rem;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:16px;display:flex;align-items:center;gap:6px;"><svg width="14" height="14" fill="none" stroke="#ef4444" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"/></svg> Deductions</div>' +
              '<div style="display:flex;flex-direction:column;gap:12px;">' +
                (p.deductions > 0 ? '<div style="display:flex;justify-content:space-between;align-items:center;padding-bottom:10px;border-bottom:1px solid #1e293b;"><span style="color:#94a3b8;font-size:0.85rem;">Deductions</span><span style="color:#ef4444;font-weight:600;font-size:0.9rem;">' + formatCurrency(p.deductions) + '</span></div>' : '<div style="color:#475569;font-size:0.8rem;font-style:italic;padding:4px 0;">No deductions</div>') +
                '<div style="display:flex;justify-content:space-between;align-items:center;padding-top:4px;"><span style="color:#94a3b8;font-size:0.8rem;font-weight:600;">Total Deductions</span><span style="color:#ef4444;font-weight:700;font-size:1rem;">' + formatCurrency(p.deductions || 0) + '</span></div>' +
              '</div>' +
            '</div>' +
          '</div>' +

          '<div style="background:linear-gradient(135deg,rgba(34,197,94,0.08),rgba(99,102,241,0.08));border:1px solid rgba(34,197,94,0.2);border-radius:12px;padding:20px;margin-bottom:20px;">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;">' +
              '<div><div style="color:#94a3b8;font-size:0.7rem;text-transform:uppercase;letter-spacing:1px;">Net Pay</div><div style="color:#64748b;font-size:0.65rem;margin-top:2px;">Total Earnings - Total Deductions</div></div>' +
              '<div style="color:#22c55e;font-size:2rem;font-weight:800;letter-spacing:-1px;text-shadow:0 0 20px rgba(34,197,94,0.3);">' + formatCurrency(p.total_pay) + '</div>' +
            '</div>' +
          '</div>' +

          (p.notes ? '<div style="background:#0f172a;border:1px solid #1e293b;border-radius:10px;padding:16px;margin-bottom:20px;"><div style="color:#475569;font-size:0.6rem;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Notes</div><div style="color:#94a3b8;font-size:0.85rem;line-height:1.5;">' + escP(p.notes) + '</div></div>' : '') +

          '<div style="border-top:1px solid #1e293b;padding:16px 0;display:flex;justify-content:space-between;align-items:center;">' +
            '<div style="color:#334155;font-size:0.65rem;">Generated by Dreamland Arcade Management System</div>' +
            '<div style="display:flex;gap:16px;">' +
              '<div style="text-align:center;"><div style="color:#475569;font-size:0.55rem;text-transform:uppercase;letter-spacing:1px;">Hours Worked</div><div style="color:#e2e8f0;font-weight:700;font-size:1.1rem;margin-top:2px;">' + (p.hours_worked || 0) + 'h</div></div>' +
              '<div style="width:1px;background:#1e293b;"></div>' +
              '<div style="text-align:center;"><div style="color:#475569;font-size:0.55rem;text-transform:uppercase;letter-spacing:1px;">OT Hours</div><div style="color:#60a5fa;font-weight:700;font-size:1.1rem;margin-top:2px;">' + (p.overtime_hours || 0) + 'h</div></div>' +
              '<div style="width:1px;background:#1e293b;"></div>' +
              '<div style="text-align:center;"><div style="color:#475569;font-size:0.55rem;text-transform:uppercase;letter-spacing:1px;">Net Pay</div><div style="color:#22c55e;font-weight:700;font-size:1.1rem;margin-top:2px;">' + formatCurrency(p.total_pay) + '</div></div>' +
            '</div>' +
          '</div>' +

        '</div>' +
      '</div>';

    Modal.show('Payslip', html, { width: '780px' });
  }

  async function showCreateModal() {
    var users = await apiGet('/users');
    if (!Array.isArray(users)) users = [];
    var empOpts = users.filter(function(u) { return u.role !== 'owner' && u.is_active && u.id !== currentUser.id; }).map(function(u) {
      return '<option value="' + u.id + '" data-branch="' + (u.branch_id || '') + '" data-rate="' + (u.daily_rate || 0) + '">' + escP(u.first_name + ' ' + u.last_name) + ' (' + u.role + ')</option>';
    }).join('');

    var html = '' +
      '<form id="create-ps-form" style="display:flex;flex-direction:column;gap:16px;">' +

      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">' +

      '<div style="background:#0f172a;border:1px solid #1e293b;border-radius:10px;padding:16px;">' +
        '<div style="color:#94a3b8;font-size:0.7rem;font-weight:600;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;">Employee & Period</div>' +
        '<div style="display:flex;flex-direction:column;gap:12px;">' +
          '<div><label style="' + LABEL + '">Employee</label><select name="user_id" id="ps-emp-select" style="' + INPUT + '"><option value="">Select Employee</option>' + empOpts + '</select></div>' +
          '<div><label style="' + LABEL + '">Period Start</label><input type="date" name="period_start" id="ps-period-start" style="' + INPUT + '" required></div>' +
          '<div><label style="' + LABEL + '">Period End</label><input type="date" name="period_end" id="ps-period-end" style="' + INPUT + '" required></div>' +
          '<button type="button" id="calc-attend-btn" style="width:100%;padding:10px;border:1px dashed #30363d;border-radius:8px;background:#0d1117;color:#22c55e;font-weight:600;font-size:0.8rem;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;transition:all 0.2s;" onmouseenter="this.style.borderColor=\'#22c55e\';this.style.background=\'rgba(34,197,94,0.05)\'" onmouseleave="this.style.borderColor=\'#30363d\';this.style.background=\'#0d1117\'"><svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg> Calculate from Attendance</button>' +
          '<div><label style="' + LABEL + '">Notes</label><textarea name="notes" rows="3" style="' + INPUT + 'resize:vertical;"></textarea></div>' +
        '</div>' +
      '</div>' +

      '<div style="background:#0f172a;border:1px solid #1e293b;border-radius:10px;padding:16px;display:flex;flex-direction:column;">' +
        '<div style="color:#94a3b8;font-size:0.7rem;font-weight:600;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;">Compensation & Hours</div>' +
        '<div style="display:flex;flex-direction:column;gap:12px;flex:1;">' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">' +
            '<div><label style="' + LABEL + '">Base Pay</label><input type="number" step="0.01" name="base_pay" id="ps-base-pay" style="' + INPUT + '" value="0"></div>' +
            '<div><label style="' + LABEL + '">Overtime Pay</label><input type="number" step="0.01" name="overtime_pay" id="ps-ot-pay" style="' + INPUT + '" value="0"></div>' +
          '</div>' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">' +
            '<div><label style="' + LABEL + '">Bonuses</label><input type="number" step="0.01" name="bonuses" id="ps-bonuses" style="' + INPUT + '" value="0"></div>' +
            '<div><label style="' + LABEL + '">Deductions</label><input type="number" step="0.01" name="deductions" id="ps-deductions" style="' + INPUT + '" value="0"></div>' +
          '</div>' +
          '<div style="border-top:1px solid #1e293b;padding-top:12px;">' +
            '<div style="color:#94a3b8;font-size:0.65rem;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Hours</div>' +
            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">' +
              '<div><label style="' + LABEL + '">Worked</label><input type="number" step="0.1" name="hours_worked" id="ps-hours" style="' + INPUT + '" value="0"></div>' +
              '<div><label style="' + LABEL + '">OT Hours</label><input type="number" step="0.1" name="overtime_hours" id="ps-ot-hours" style="' + INPUT + '" value="0"></div>' +
            '</div>' +
          '</div>' +
          '<div style="margin-top:auto;background:linear-gradient(135deg,#0a1a12,#0f2922);border:1px solid #22c55e30;border-radius:10px;padding:14px;text-align:center;">' +
            '<div style="color:#64748b;font-size:0.6rem;text-transform:uppercase;letter-spacing:1px;">Net Pay</div>' +
            '<div id="ps-live-net" style="color:#22c55e;font-weight:800;font-size:1.6rem;">' + formatCurrency(0) + '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '</div>' +

      '<div style="display:flex;gap:10px;">' +
        '<button type="button" onclick="Modal.close()" style="flex:1;padding:11px;border:1px solid #30363d;border-radius:8px;background:#0d1117;color:#94a3b8;font-weight:600;cursor:pointer;transition:all 0.2s;" onmouseenter="this.style.borderColor=\'#ef4444\';this.style.color=\'#fca5a5\'" onmouseleave="this.style.borderColor=\'#30363d\';this.style.color=\'#94a3b8\'">Cancel</button>' +
        '<button type="submit" style="flex:2;padding:11px;border:none;border-radius:8px;background:linear-gradient(135deg,#6366f1,#818cf8);color:#fff;font-weight:700;cursor:pointer;box-shadow:0 2px 10px rgba(99,102,241,0.3);">Create Payslip</button>' +
      '</div></form>';

    Modal.show('Create Payslip', html, { width: '780px' });

    function updateLivePreview() {
      var base = parseFloat(document.getElementById('ps-base-pay')?.value) || 0;
      var ot = parseFloat(document.getElementById('ps-ot-pay')?.value) || 0;
      var bonus = parseFloat(document.getElementById('ps-bonuses')?.value) || 0;
      var ded = parseFloat(document.getElementById('ps-deductions')?.value) || 0;
      var net = base + ot + bonus - ded;
      var el = document.getElementById('ps-live-net');
      if (el) el.textContent = formatCurrency(net);
    }

    ['ps-base-pay', 'ps-ot-pay', 'ps-bonuses', 'ps-deductions'].forEach(function(id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('input', updateLivePreview);
    });

    document.getElementById('calc-attend-btn')?.addEventListener('click', async function() {
      var empSelect = document.getElementById('ps-emp-select');
      var periodStart = document.getElementById('ps-period-start').value;
      var periodEnd = document.getElementById('ps-period-end').value;
      if (!empSelect.value) { Toast.error('Select an employee first'); return; }
      if (!periodStart || !periodEnd) { Toast.error('Select period dates first'); return; }
      try {
        var result = await apiGet('/payslips/calculate?user_id=' + empSelect.value + '&period_start=' + periodStart + '&period_end=' + periodEnd);
        document.getElementById('ps-base-pay').value = result.base_pay || 0;
        document.getElementById('ps-ot-pay').value = result.overtime_pay || 0;
        document.getElementById('ps-hours').value = result.hours_worked || 0;
        document.getElementById('ps-ot-hours').value = result.overtime_hours || 0;
        updateLivePreview();
        Toast.success('Calculated: ' + result.days_present + ' days, ' + result.hours_worked + 'h worked');
      } catch (err) { Toast.error('Failed: ' + err.message); }
    });

    document.getElementById('create-ps-form')?.addEventListener('submit', async function(e) {
      e.preventDefault();
      var f = e.target;
      var empSelect = document.getElementById('ps-emp-select');
      var selectedOpt = empSelect.options[empSelect.selectedIndex];
      var branchId = selectedOpt ? selectedOpt.getAttribute('data-branch') : '';
      var data = {
        user_id: parseInt(f.user_id.value),
        branch_id: parseInt(branchId) || 2,
        period_start: f.period_start.value,
        period_end: f.period_end.value,
        base_pay: parseFloat(f.base_pay.value) || 0,
        overtime_pay: parseFloat(f.overtime_pay.value) || 0,
        bonuses: parseFloat(f.bonuses.value) || 0,
        deductions: parseFloat(f.deductions.value) || 0,
        hours_worked: parseFloat(f.hours_worked.value) || 0,
        overtime_hours: parseFloat(f.overtime_hours.value) || 0,
        notes: f.notes.value
      };
      if (!data.user_id) { Toast.error('Select an employee'); return; }
      try { await apiPost('/payslips', data); Toast.success('Payslip created!'); Modal.close(); loadData(); }
      catch (err) { Toast.error(err.message); }
    });
  }

  function showEditModal(p) {
    var startStr = new Date(p.period_start).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    var endStr = new Date(p.period_end).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    var html = '' +
      '<form id="edit-ps-form" style="display:flex;flex-direction:column;">' +

      '<div style="background:linear-gradient(135deg,#060a14,#0a0e1a,#0c1222);border:1px solid #1e293b;border-radius:16px;overflow:hidden;position:relative;">' +

        '<div style="position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,#f59e0b,#d97706,#f59e0b);"></div>' +

        '<div style="padding:28px 32px 0;">' +
          '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;">' +
            '<div style="display:flex;align-items:center;gap:14px;">' +
              DREAMLAND_LOGO +
              '<div><div style="color:#e2e8f0;font-size:1.15rem;font-weight:800;letter-spacing:0.5px;">DREAMLAND ARCADE</div><div style="color:#f59e0b;font-size:0.65rem;text-transform:uppercase;letter-spacing:2px;margin-top:2px;">Edit Payslip</div></div>' +
            '</div>' +
            '<div style="display:flex;align-items:center;gap:10px;">' +
              '<div style="width:40px;height:40px;border-radius:10px;background:linear-gradient(135deg,#1a1525,#251e35);display:flex;align-items:center;justify-content:center;color:#a78bfa;font-weight:700;font-size:0.8rem;border:1px solid rgba(167,139,250,0.2);">' + escP((p.user_name || '??').split(' ').map(function(w) { return w.charAt(0); }).join('').substring(0, 2)) + '</div>' +
              '<div><div style="color:#e2e8f0;font-weight:600;font-size:0.9rem;">' + escP(p.user_name) + '</div><div style="color:#64748b;font-size:0.7rem;">' + escP(p.branch_name || '') + '</div></div>' +
            '</div>' +
          '</div>' +

          '<div style="background:#0f172a;border:1px solid #1e293b;border-radius:12px;padding:20px;margin-bottom:20px;">' +
            '<div style="color:#94a3b8;font-size:0.65rem;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:14px;">Pay Period</div>' +
            '<div style="display:grid;grid-template-columns:1fr auto 1fr;gap:16px;align-items:center;">' +
              '<div><label style="' + LABEL + '">Period Start</label><input type="date" name="period_start" value="' + p.period_start + '" style="' + INPUT + '" disabled></div>' +
              '<div style="color:#475569;font-size:0.75rem;padding-top:18px;">to</div>' +
              '<div><label style="' + LABEL + '">Period End</label><input type="date" name="period_end" value="' + p.period_end + '" style="' + INPUT + '" disabled></div>' +
            '</div>' +
          '</div>' +

          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px;">' +
            '<div style="background:linear-gradient(180deg,rgba(99,102,241,0.04),transparent);border:1px solid rgba(99,102,241,0.12);border-radius:12px;padding:20px;">' +
              '<div style="color:#6366f1;font-size:0.65rem;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:16px;display:flex;align-items:center;gap:6px;"><svg width="14" height="14" fill="none" stroke="#6366f1" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> Earnings</div>' +
              '<div style="display:flex;flex-direction:column;gap:14px;">' +
                '<div><label style="' + LABEL + '">Base Pay</label><div style="position:relative;"><span style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:#475569;font-size:0.85rem;">₱</span><input type="number" step="0.01" name="base_pay" id="edit-ps-base" style="' + INPUT + 'padding-left:24px;" value="' + p.base_pay + '"></div></div>' +
                '<div><label style="' + LABEL + '">Overtime Pay</label><div style="position:relative;"><span style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:#475569;font-size:0.85rem;">₱</span><input type="number" step="0.01" name="overtime_pay" id="edit-ps-ot" style="' + INPUT + 'padding-left:24px;" value="' + p.overtime_pay + '"></div></div>' +
                '<div><label style="' + LABEL + '">Bonuses</label><div style="position:relative;"><span style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:#475569;font-size:0.85rem;">₱</span><input type="number" step="0.01" name="bonuses" id="edit-ps-bonus" style="' + INPUT + 'padding-left:24px;" value="' + p.bonuses + '"></div></div>' +
              '</div>' +
            '</div>' +
            '<div style="background:linear-gradient(180deg,rgba(239,68,68,0.04),transparent);border:1px solid rgba(239,68,68,0.12);border-radius:12px;padding:20px;">' +
              '<div style="color:#ef4444;font-size:0.65rem;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:16px;display:flex;align-items:center;gap:6px;"><svg width="14" height="14" fill="none" stroke="#ef4444" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"/></svg> Deductions & Hours</div>' +
              '<div style="display:flex;flex-direction:column;gap:14px;">' +
                '<div><label style="' + LABEL + '">Deductions</label><div style="position:relative;"><span style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:#475569;font-size:0.85rem;">₱</span><input type="number" step="0.01" name="deductions" id="edit-ps-ded" style="' + INPUT + 'padding-left:24px;" value="' + p.deductions + '"></div></div>' +
                '<div style="border-top:1px solid #1e293b;padding-top:14px;">' +
                  '<div style="color:#475569;font-size:0.6rem;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;">Hours</div>' +
                  '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">' +
                    '<div><label style="' + LABEL + '">Worked</label><input type="number" step="0.1" name="hours_worked" style="' + INPUT + '" value="' + p.hours_worked + '"></div>' +
                    '<div><label style="' + LABEL + '">OT Hours</label><input type="number" step="0.1" name="overtime_hours" style="' + INPUT + '" value="' + p.overtime_hours + '"></div>' +
                  '</div>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>' +

          '<div style="background:linear-gradient(135deg,rgba(34,197,94,0.08),rgba(99,102,241,0.08));border:1px solid rgba(34,197,94,0.2);border-radius:12px;padding:20px;margin-bottom:20px;">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;">' +
              '<div><div style="color:#94a3b8;font-size:0.7rem;text-transform:uppercase;letter-spacing:1px;">Net Pay Preview</div><div style="color:#64748b;font-size:0.65rem;margin-top:2px;">Updates automatically</div></div>' +
              '<div id="edit-live-net" style="color:#22c55e;font-size:2rem;font-weight:800;letter-spacing:-1px;text-shadow:0 0 20px rgba(34,197,94,0.3);">' + formatCurrency(p.total_pay) + '</div>' +
            '</div>' +
          '</div>' +

          '<div style="background:#0f172a;border:1px solid #1e293b;border-radius:10px;padding:16px;margin-bottom:24px;">' +
            '<div style="color:#475569;font-size:0.6rem;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Notes</div>' +
            '<textarea name="notes" rows="3" style="' + INPUT + 'resize:vertical;">' + escP(p.notes || '') + '</textarea>' +
          '</div>' +

          '<div style="display:flex;gap:10px;padding-bottom:28px;">' +
            '<button type="button" onclick="Modal.close()" style="flex:1;padding:12px;border:1px solid #30363d;border-radius:10px;background:#0d1117;color:#94a3b8;font-weight:600;cursor:pointer;transition:all 0.2s;" onmouseenter="this.style.borderColor=\'#ef4444\';this.style.color=\'#fca5a5\'" onmouseleave="this.style.borderColor=\'#30363d\';this.style.color=\'#94a3b8\'">Cancel</button>' +
            '<button type="submit" style="flex:2;padding:12px;border:none;border-radius:10px;background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;font-weight:700;cursor:pointer;box-shadow:0 2px 10px rgba(245,158,11,0.3);">Update Payslip</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '</form>';

    Modal.show('Edit Payslip', html, { width: '780px' });

    function updateEditPreview() {
      var base = parseFloat(document.getElementById('edit-ps-base')?.value) || 0;
      var ot = parseFloat(document.getElementById('edit-ps-ot')?.value) || 0;
      var bonus = parseFloat(document.getElementById('edit-ps-bonus')?.value) || 0;
      var ded = parseFloat(document.getElementById('edit-ps-ded')?.value) || 0;
      var el = document.getElementById('edit-live-net');
      if (el) el.textContent = formatCurrency(base + ot + bonus - ded);
    }

    ['edit-ps-base', 'edit-ps-ot', 'edit-ps-bonus', 'edit-ps-ded'].forEach(function(id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('input', updateEditPreview);
    });

    document.getElementById('edit-ps-form')?.addEventListener('submit', async function(e) {
      e.preventDefault();
      var f = e.target;
      var data = {
        base_pay: parseFloat(f.base_pay.value) || 0,
        overtime_pay: parseFloat(f.overtime_pay.value) || 0,
        bonuses: parseFloat(f.bonuses.value) || 0,
        deductions: parseFloat(f.deductions.value) || 0,
        hours_worked: parseFloat(f.hours_worked.value) || 0,
        overtime_hours: parseFloat(f.overtime_hours.value) || 0,
        notes: f.notes.value
      };
      try { await apiPut('/payslips/' + p.id, data); Toast.success('Payslip updated!'); Modal.close(); loadData(); }
      catch (err) { Toast.error(err.message); }
    });
  }

  function escP(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  loadData();
}

Router.register('payslips', renderAdminPayslips);
