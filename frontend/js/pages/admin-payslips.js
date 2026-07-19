function renderAdminPayslips() {
  var app = document.getElementById('app');
  var payslips = [];
  var currentUser = Auth.getUser();

  async function loadData() {
    try {
      payslips = await apiGet('/payslips');
      if (!Array.isArray(payslips)) payslips = [];
      render();
    } catch (e) {
      Toast.error('Failed to load payslips');
    }
  }

  function render() {
    var totalApproved = payslips.filter(function(p) { return p.status === 'approved'; });
    var totalPending = payslips.filter(function(p) { return p.status === 'pending'; });
    var totalApprovedAmt = totalApproved.reduce(function(s, p) { return s + (p.total_pay || 0); }, 0);
    var totalPendingAmt = totalPending.reduce(function(s, p) { return s + (p.total_pay || 0); }, 0);

    app.innerHTML = '<div class="layout">' + renderSidebar() +
      '<div class="main-content">' + renderNavbar('Payslip Management') +
      '<div class="page-content" id="page-body">' +

      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:12px;">' +
        '<div style="display:flex;gap:10px;align-items:center;">' +
          '<select id="ps-status-filter" style="background:#0d1117;border:1px solid #30363d;border-radius:8px;padding:8px 12px;color:#e2e8f0;font-size:0.85rem;">' +
            '<option value="">All Status</option><option value="pending">Pending</option><option value="approved">Approved</option></select>' +
        '</div>' +
        (currentUser.role === 'owner' || currentUser.role === 'admin' ?
          '<button id="create-payslip-btn" style="background:#6366f1;color:#fff;border:none;border-radius:8px;padding:8px 20px;cursor:pointer;font-weight:600;font-size:0.85rem;">+ Create Payslip</button>' : '') +
      '</div>' +

      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-bottom:24px;">' +
        psCard('Total Payslips', payslips.length, '#6366f1') +
        psCard('Approved', totalApproved.length + ' (' + formatCurrency(totalApprovedAmt) + ')', '#22c55e') +
        psCard('Pending', totalPending.length + ' (' + formatCurrency(totalPendingAmt) + ')', '#f59e0b') +
      '</div>' +

      '<div id="payslips-grid"></div>' +

      '</div></div></div>';

    renderPayslips(payslips);

    document.getElementById('logout-btn')?.addEventListener('click', function(e) { e.preventDefault(); Auth.logout(); });
    document.getElementById('ps-status-filter')?.addEventListener('change', function() {
      var v = this.value;
      var f = v ? payslips.filter(function(p) { return p.status === v; }) : payslips;
      renderPayslips(f);
    });
    document.getElementById('create-payslip-btn')?.addEventListener('click', function() { showCreateModal(); });
  }

  function renderPayslips(list) {
    var container = document.getElementById('payslips-grid');
    if (!container) return;

    if (list.length === 0) {
      container.innerHTML = '<div style="text-align:center;padding:40px;color:#666;">No payslips found</div>';
      return;
    }

    var html = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:16px;">';
    list.forEach(function(p) {
      var isApproved = p.status === 'approved';
      var isOwnPayslip = p.user_id === currentUser.id;
      var statusColor = isApproved ? '#22c55e' : '#f59e0b';
      var statusBg = isApproved ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)';
      var border = isApproved ? '#22c55e44' : '#f59e0b44';

      var startDate = new Date(p.period_start);
      var endDate = new Date(p.period_end);
      var startStr = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      var endStr = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

      var canEdit = !isOwnPayslip && !isApproved;
      var canApprove = !isOwnPayslip && !isApproved;

      html += '<div style="background:#1a1f2e;border:1px solid ' + border + ';border-radius:12px;overflow:hidden;">' +
        '<div style="padding:16px 20px;border-bottom:1px solid #2a3040;display:flex;justify-content:space-between;align-items:center;">' +
          '<div>' +
            '<div style="color:#e2e8f0;font-weight:700;font-size:0.95rem;">' + escP(p.user_name || 'Unknown') + '</div>' +
            '<div style="color:#94a3b8;font-size:0.75rem;">' + escP(p.branch_name || '') + '</div>' +
          '</div>' +
          '<span style="background:' + statusBg + ';color:' + statusColor + ';padding:4px 12px;border-radius:20px;font-size:0.7rem;font-weight:600;text-transform:uppercase;">' + p.status + '</span>' +
        '</div>' +

        '<div style="padding:16px 20px;">' +
          '<div style="display:flex;justify-content:space-between;margin-bottom:12px;">' +
            '<div><div style="color:#94a3b8;font-size:0.7rem;text-transform:uppercase;">Period</div><div style="color:#e2e8f0;font-size:0.85rem;">' + startStr + ' - ' + endStr + '</div></div>' +
            '<div style="text-align:right;"><div style="color:#94a3b8;font-size:0.7rem;text-transform:uppercase;">Net Pay</div><div style="color:#22c55e;font-size:1.1rem;font-weight:700;">' + formatCurrency(p.total_pay) + '</div></div>' +
          '</div>' +

          '<div style="background:#0d1117;border-radius:8px;padding:12px;">' +
            '<div style="display:flex;justify-content:space-between;margin-bottom:4px;"><span style="color:#94a3b8;font-size:0.75rem;">Base Pay</span><span style="color:#e2e8f0;font-size:0.8rem;">' + formatCurrency(p.base_pay) + '</span></div>' +
            '<div style="display:flex;justify-content:space-between;margin-bottom:4px;"><span style="color:#94a3b8;font-size:0.75rem;">Overtime</span><span style="color:#60a5fa;font-size:0.8rem;">+' + formatCurrency(p.overtime_pay) + '</span></div>' +
            (p.bonuses > 0 ? '<div style="display:flex;justify-content:space-between;margin-bottom:4px;"><span style="color:#94a3b8;font-size:0.75rem;">Bonuses</span><span style="color:#22c55e;font-size:0.8rem;">+' + formatCurrency(p.bonuses) + '</span></div>' : '') +
            (p.deductions > 0 ? '<div style="display:flex;justify-content:space-between;margin-bottom:4px;"><span style="color:#94a3b8;font-size:0.75rem;">Deductions</span><span style="color:#ef4444;font-size:0.8rem;">-' + formatCurrency(p.deductions) + '</span></div>' : '') +
            '<div style="border-top:1px solid #2a3040;margin-top:6px;padding-top:6px;display:flex;justify-content:space-between;"><span style="color:#94a3b8;font-size:0.75rem;">Hours: ' + (p.hours_worked || 0) + 'h</span><span style="color:#94a3b8;font-size:0.75rem;">OT: ' + (p.overtime_hours || 0) + 'h</span></div>' +
          '</div>' +
        '</div>' +

        '<div style="padding:0 20px 16px;display:flex;gap:8px;">' +
          '<button onclick="window.__viewPayslip(' + p.id + ')" style="flex:1;padding:6px;border:1px solid #30363d;border-radius:6px;background:transparent;color:#94a3b8;font-size:0.75rem;cursor:pointer;">View</button>' +
          (canEdit ? '<button onclick="window.__editPayslip(' + p.id + ')" style="flex:1;padding:6px;border:1px solid #6366f1;border-radius:6px;background:transparent;color:#6366f1;font-size:0.75rem;cursor:pointer;">Edit</button>' : '') +
          (canApprove ? '<button onclick="window.__approvePayslip(' + p.id + ')" style="flex:1;padding:6px;border:1px solid #22c55e;border-radius:6px;background:transparent;color:#22c55e;font-size:0.75rem;cursor:pointer;">Approve</button>' : '') +
        '</div>' +
      '</div>';
    });
    html += '</div>';
    container.innerHTML = html;

    window.__viewPayslip = function(id) {
      var p = payslips.find(function(x) { return x.id === id; });
      if (p) showPayslipDetail(p);
    };
    window.__editPayslip = function(id) {
      var p = payslips.find(function(x) { return x.id === id; });
      if (p) showEditModal(p);
    };
    window.__approvePayslip = async function(id) {
      if (!confirm('Approve this payslip?')) return;
      try { await apiPut('/payslips/' + id + '/approve', {}); Toast.success('Payslip approved!'); loadData(); } catch (err) { Toast.error(err.message); }
    };
  }

  function showPayslipDetail(p) {
    var html =
      '<div style="text-align:center;margin-bottom:16px;padding-bottom:16px;border-bottom:1px solid #2a3040;">' +
        '<div style="color:#94a3b8;font-size:0.7rem;text-transform:uppercase;">Net Pay</div>' +
        '<div style="color:#22c55e;font-size:1.8rem;font-weight:800;">' + formatCurrency(p.total_pay) + '</div>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">' +
        '<div><div style="color:#94a3b8;font-size:0.7rem;">EMPLOYEE</div><div style="color:#e2e8f0;font-weight:600;">' + escP(p.user_name) + '</div></div>' +
        '<div><div style="color:#94a3b8;font-size:0.7rem;">BRANCH</div><div style="color:#e2e8f0;font-weight:600;">' + escP(p.branch_name) + '</div></div>' +
        '<div><div style="color:#94a3b8;font-size:0.7rem;">PERIOD</div><div style="color:#e2e8f0;">' + p.period_start + ' to ' + p.period_end + '</div></div>' +
        '<div><div style="color:#94a3b8;font-size:0.7rem;">STATUS</div><div style="color:' + (p.status === 'approved' ? '#22c55e' : '#f59e0b') + ';font-weight:600;">' + p.status.toUpperCase() + '</div></div>' +
      '</div>' +
      '<div style="background:#0d1117;border-radius:8px;padding:16px;">' +
        '<div style="display:flex;justify-content:space-between;margin-bottom:8px;"><span style="color:#94a3b8;">Base Pay</span><span style="color:#e2e8f0;">' + formatCurrency(p.base_pay) + '</span></div>' +
        '<div style="display:flex;justify-content:space-between;margin-bottom:8px;"><span style="color:#94a3b8;">Overtime Pay</span><span style="color:#60a5fa;">+' + formatCurrency(p.overtime_pay) + '</span></div>' +
        '<div style="display:flex;justify-content:space-between;margin-bottom:8px;"><span style="color:#94a3b8;">Bonuses</span><span style="color:#22c55e;">+' + formatCurrency(p.bonuses) + '</span></div>' +
        '<div style="display:flex;justify-content:space-between;margin-bottom:8px;"><span style="color:#94a3b8;">Deductions</span><span style="color:#ef4444;">-' + formatCurrency(p.deductions) + '</span></div>' +
        '<hr style="border:none;border-top:1px solid #2a3040;margin:8px 0;">' +
        '<div style="display:flex;justify-content:space-between;"><span style="color:#e2e8f0;font-weight:700;">NET PAY</span><span style="color:#22c55e;font-weight:700;font-size:1.1rem;">' + formatCurrency(p.total_pay) + '</span></div>' +
      '</div>';
    Modal.show('Payslip Details', html, { width: '480px' });
  }

  async function showCreateModal() {
    var users = await apiGet('/users');
    if (!Array.isArray(users)) users = [];
    var empOpts = users.filter(function(u) { return u.role !== 'owner' && u.is_active && u.id !== currentUser.id; }).map(function(u) {
      return '<option value="' + u.id + '" data-branch="' + (u.branch_id || '') + '" data-rate="' + (u.daily_rate || 0) + '">' + escP(u.first_name + ' ' + u.last_name) + ' (' + u.role + ')</option>';
    }).join('');

    var html = '<form id="create-ps-form" style="display:flex;flex-direction:column;gap:12px;">' +
      '<div><label style="color:#94a3b8;font-size:0.8rem;display:block;margin-bottom:4px;">Employee</label>' +
      '<select name="user_id" id="ps-emp-select" style="width:100%;background:#0d1117;border:1px solid #30363d;border-radius:6px;padding:8px;color:#e2e8f0;">' +
      '<option value="">Select Employee</option>' + empOpts + '</select></div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">' +
        '<div><label style="color:#94a3b8;font-size:0.8rem;display:block;margin-bottom:4px;">Period Start</label><input type="date" name="period_start" id="ps-period-start" style="width:100%;background:#0d1117;border:1px solid #30363d;border-radius:6px;padding:8px;color:#e2e8f0;" required></div>' +
        '<div><label style="color:#94a3b8;font-size:0.8rem;display:block;margin-bottom:4px;">Period End</label><input type="date" name="period_end" id="ps-period-end" style="width:100%;background:#0d1117;border:1px solid #30363d;border-radius:6px;padding:8px;color:#e2e8f0;" required></div>' +
      '</div>' +
      '<div style="background:#0d1117;border:1px dashed #30363d;border-radius:8px;padding:12px;text-align:center;">' +
        '<button type="button" id="calc-attend-btn" style="background:#22c55e;color:#fff;border:none;border-radius:6px;padding:8px 16px;cursor:pointer;font-weight:600;font-size:0.8rem;">📊 Calculate from Attendance</button>' +
        '<div style="color:#94a3b8;font-size:0.7rem;margin-top:6px;">Auto-fill pay from attendance records</div>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">' +
        '<div><label style="color:#94a3b8;font-size:0.8rem;display:block;margin-bottom:4px;">Base Pay</label><input type="number" step="0.01" name="base_pay" id="ps-base-pay" style="width:100%;background:#0d1117;border:1px solid #30363d;border-radius:6px;padding:8px;color:#e2e8f0;" value="6750"></div>' +
        '<div><label style="color:#94a3b8;font-size:0.8rem;display:block;margin-bottom:4px;">Overtime Pay</label><input type="number" step="0.01" name="overtime_pay" id="ps-ot-pay" style="width:100%;background:#0d1117;border:1px solid #30363d;border-radius:6px;padding:8px;color:#e2e8f0;" value="0"></div>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">' +
        '<div><label style="color:#94a3b8;font-size:0.8rem;display:block;margin-bottom:4px;">Bonuses</label><input type="number" step="0.01" name="bonuses" style="width:100%;background:#0d1117;border:1px solid #30363d;border-radius:6px;padding:8px;color:#e2e8f0;" value="0"></div>' +
        '<div><label style="color:#94a3b8;font-size:0.8rem;display:block;margin-bottom:4px;">Deductions</label><input type="number" step="0.01" name="deductions" style="width:100%;background:#0d1117;border:1px solid #30363d;border-radius:6px;padding:8px;color:#e2e8f0;" value="0"></div>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">' +
        '<div><label style="color:#94a3b8;font-size:0.8rem;display:block;margin-bottom:4px;">Hours Worked</label><input type="number" step="0.1" name="hours_worked" id="ps-hours" style="width:100%;background:#0d1117;border:1px solid #30363d;border-radius:6px;padding:8px;color:#e2e8f0;" value="120"></div>' +
        '<div><label style="color:#94a3b8;font-size:0.8rem;display:block;margin-bottom:4px;">OT Hours</label><input type="number" step="0.1" name="overtime_hours" id="ps-ot-hours" style="width:100%;background:#0d1117;border:1px solid #30363d;border-radius:6px;padding:8px;color:#e2e8f0;" value="0"></div>' +
      '</div>' +
      '<div><label style="color:#94a3b8;font-size:0.8rem;display:block;margin-bottom:4px;">Notes</label><textarea name="notes" rows="2" style="width:100%;background:#0d1117;border:1px solid #30363d;border-radius:6px;padding:8px;color:#e2e8f0;resize:vertical;"></textarea></div>' +
      '<div style="display:flex;gap:10px;justify-content:flex-end;">' +
        '<button type="button" onclick="Modal.close()" style="padding:8px 20px;border:1px solid #30363d;border-radius:6px;background:transparent;color:#94a3b8;cursor:pointer;">Cancel</button>' +
        '<button type="submit" style="padding:8px 20px;border:none;border-radius:6px;background:#6366f1;color:#fff;font-weight:600;cursor:pointer;">Create</button>' +
      '</div></form>';

    Modal.show('Create Payslip', html, { width: '520px' });

    document.getElementById('calc-attend-btn')?.addEventListener('click', async function() {
      var empSelect = document.getElementById('ps-emp-select');
      var periodStart = document.getElementById('ps-period-start').value;
      var periodEnd = document.getElementById('ps-period-end').value;

      if (!empSelect.value) { Toast.error('Select an employee first'); return; }
      if (!periodStart || !periodEnd) { Toast.error('Select period start and end dates'); return; }

      try {
        var result = await apiGet('/payslips/calculate?user_id=' + empSelect.value + '&period_start=' + periodStart + '&period_end=' + periodEnd);
        document.getElementById('ps-base-pay').value = result.base_pay || 0;
        document.getElementById('ps-ot-pay').value = result.overtime_pay || 0;
        document.getElementById('ps-hours').value = result.hours_worked || 0;
        document.getElementById('ps-ot-hours').value = result.overtime_hours || 0;
        Toast.success('Calculated: ' + result.days_present + ' days, ' + result.hours_worked + 'h worked');
      } catch (err) {
        Toast.error('Failed to calculate: ' + err.message);
      }
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
    var html = '<form id="edit-ps-form" style="display:flex;flex-direction:column;gap:12px;">' +
      '<div style="color:#94a3b8;font-size:0.8rem;">Editing payslip for <strong style="color:#e2e8f0;">' + escP(p.user_name) + '</strong></div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">' +
        '<div><label style="color:#94a3b8;font-size:0.8rem;display:block;margin-bottom:4px;">Base Pay</label><input type="number" step="0.01" name="base_pay" style="width:100%;background:#0d1117;border:1px solid #30363d;border-radius:6px;padding:8px;color:#e2e8f0;" value="' + p.base_pay + '"></div>' +
        '<div><label style="color:#94a3b8;font-size:0.8rem;display:block;margin-bottom:4px;">Overtime Pay</label><input type="number" step="0.01" name="overtime_pay" style="width:100%;background:#0d1117;border:1px solid #30363d;border-radius:6px;padding:8px;color:#e2e8f0;" value="' + p.overtime_pay + '"></div>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">' +
        '<div><label style="color:#94a3b8;font-size:0.8rem;display:block;margin-bottom:4px;">Bonuses</label><input type="number" step="0.01" name="bonuses" style="width:100%;background:#0d1117;border:1px solid #30363d;border-radius:6px;padding:8px;color:#e2e8f0;" value="' + p.bonuses + '"></div>' +
        '<div><label style="color:#94a3b8;font-size:0.8rem;display:block;margin-bottom:4px;">Deductions</label><input type="number" step="0.01" name="deductions" style="width:100%;background:#0d1117;border:1px solid #30363d;border-radius:6px;padding:8px;color:#e2e8f0;" value="' + p.deductions + '"></div>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">' +
        '<div><label style="color:#94a3b8;font-size:0.8rem;display:block;margin-bottom:4px;">Hours Worked</label><input type="number" step="0.1" name="hours_worked" style="width:100%;background:#0d1117;border:1px solid #30363d;border-radius:6px;padding:8px;color:#e2e8f0;" value="' + p.hours_worked + '"></div>' +
        '<div><label style="color:#94a3b8;font-size:0.8rem;display:block;margin-bottom:4px;">OT Hours</label><input type="number" step="0.1" name="overtime_hours" style="width:100%;background:#0d1117;border:1px solid #30363d;border-radius:6px;padding:8px;color:#e2e8f0;" value="' + p.overtime_hours + '"></div>' +
      '</div>' +
      '<div><label style="color:#94a3b8;font-size:0.8rem;display:block;margin-bottom:4px;">Notes</label><textarea name="notes" rows="2" style="width:100%;background:#0d1117;border:1px solid #30363d;border-radius:6px;padding:8px;color:#e2e8f0;resize:vertical;">' + escP(p.notes || '') + '</textarea></div>' +
      '<div style="display:flex;gap:10px;justify-content:flex-end;">' +
        '<button type="button" onclick="Modal.close()" style="padding:8px 20px;border:1px solid #30363d;border-radius:6px;background:transparent;color:#94a3b8;cursor:pointer;">Cancel</button>' +
        '<button type="submit" style="padding:8px 20px;border:none;border-radius:6px;background:#6366f1;color:#fff;font-weight:600;cursor:pointer;">Update</button>' +
      '</div></form>';

    Modal.show('Edit Payslip', html, { width: '480px' });

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
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  loadData();
}

function psCard(label, value, color) {
  return '<div style="background:#1a1f2e;border:1px solid #2a3040;border-radius:12px;padding:16px;">' +
    '<div style="color:#94a3b8;font-size:0.75rem;text-transform:uppercase;margin-bottom:6px;">' + label + '</div>' +
    '<div style="color:' + color + ';font-size:1.1rem;font-weight:700;">' + value + '</div></div>';
}

Router.register('payslips', renderAdminPayslips);
