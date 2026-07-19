function renderEmployeePayslips() {
  const app = document.getElementById('app');
  const user = Auth.getUser();

  app.innerHTML = '<div class="layout">' + renderSidebar() +
    '<div class="main-content">' + renderNavbar('My Payslips') +
    '<div class="page-content" id="page-body">' +
      '<div style="text-align:center;padding:60px;color:#888;"><div class="spinner"></div></div>' +
    '</div></div></div>';

  document.getElementById('logout-btn')?.addEventListener('click', (e) => { e.preventDefault(); Auth.logout(); });
  loadPayslips();
}

async function loadPayslips() {
  const container = document.getElementById('page-body');
  try {
    var payslips = await apiGet('/payslips/my');

    if (!payslips || payslips.length === 0) {
      container.innerHTML =
        '<div class="page-header"><h1 class="page-title">My Payslips</h1></div>' +
        '<div class="empty-state">' +
          '<div class="empty-state-icon">💰</div>' +
          '<p>No payslips found yet.</p>' +
          '<p class="text-muted text-sm mt-1">Your payslips will appear here once created by admin.</p>' +
        '</div>';
      return;
    }

    var totalEarnings = 0;
    var totalDeductions = 0;
    payslips.forEach(function(p) {
      totalEarnings += p.base_pay + p.overtime_pay + p.bonuses;
      totalDeductions += p.deductions;
    });

    container.innerHTML =
      '<div class="page-header"><h1 class="page-title">My Payslips</h1></div>' +
      '<div class="stats-grid">' +
        '<div class="stat-card green">' +
          '<div class="stat-icon green">💰</div>' +
          '<div class="stat-value">' + formatCurrency(totalEarnings) + '</div>' +
          '<div class="stat-label">Total Earnings</div>' +
        '</div>' +
        '<div class="stat-card red">' +
          '<div class="stat-icon red">📉</div>' +
          '<div class="stat-value">' + formatCurrency(totalDeductions) + '</div>' +
          '<div class="stat-label">Total Deductions</div>' +
        '</div>' +
        '<div class="stat-card cyan">' +
          '<div class="stat-icon cyan">📋</div>' +
          '<div class="stat-value">' + payslips.length + '</div>' +
          '<div class="stat-label">Total Payslips</div>' +
        '</div>' +
      '</div>' +
      '<div class="card">' +
        '<div class="card-header"><span class="card-title">Payslip History</span></div>' +
        '<div id="payslips-table"></div>' +
      '</div>';

    renderTable('payslips-table', [
      { key: 'period_start', label: 'Period', render: function(v, row) {
        return formatDate(row.period_start) + ' - ' + formatDate(row.period_end);
      }},
      { key: 'hours_worked', label: 'Hours', render: function(v) { return v + 'h'; }},
      { key: 'base_pay', label: 'Base Pay', render: function(v) { return formatCurrency(v); }},
      { key: 'overtime_pay', label: 'OT Pay', render: function(v) { return formatCurrency(v); }},
      { key: 'bonuses', label: 'Bonuses', render: function(v) { return formatCurrency(v); }},
      { key: 'deductions', label: 'Deductions', render: function(v) { return '<span style="color:var(--neon-red);">-' + formatCurrency(v) + '</span>'; }},
      { key: 'total_pay', label: 'Net Pay', render: function(v) {
        return '<strong style="color:var(--neon-green);font-family:var(--font-display);">' + formatCurrency(v) + '</strong>';
      }},
      { key: 'status', label: 'Status', render: function(v) {
        var cls = v === 'approved' ? 'badge-green' : v === 'pending' ? 'badge-yellow' : 'badge-red';
        return '<span class="badge ' + cls + '">' + v + '</span>';
      }}
    ], payslips);

    // Add detail view on row click
    document.querySelectorAll('#payslips-table tr[data-row-index]').forEach(function(tr) {
      tr.style.cursor = 'pointer';
      tr.addEventListener('click', function() {
        var idx = parseInt(tr.dataset.rowIndex);
        showPayslipDetail(payslips[idx]);
      });
    });

  } catch (err) {
    container.innerHTML = '<div class="empty-state"><p>Failed to load payslips: ' + (err.message || 'Unknown error') + '</p></div>';
  }
}

function showPayslipDetail(payslip) {
  var html =
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">' +
      '<div>' +
        '<div style="color:var(--text-secondary);font-size:0.8rem;text-transform:uppercase;margin-bottom:4px;">Period</div>' +
        '<div style="color:var(--text-bright);font-weight:600;">' + formatDate(payslip.period_start) + ' - ' + formatDate(payslip.period_end) + '</div>' +
      '</div>' +
      '<div>' +
        '<div style="color:var(--text-secondary);font-size:0.8rem;text-transform:uppercase;margin-bottom:4px;">Status</div>' +
        '<div><span class="badge ' + (payslip.status === 'approved' ? 'badge-green' : 'badge-yellow') + '">' + payslip.status + '</span></div>' +
      '</div>' +
    '</div>' +
    '<div style="margin-top:20px;padding:16px;background:var(--bg-input);border-radius:8px;">' +
      '<div style="display:flex;justify-content:space-between;margin-bottom:8px;"><span style="color:var(--text-secondary);">Hours Worked</span><span style="color:var(--text-bright);">' + payslip.hours_worked + 'h</span></div>' +
      '<div style="display:flex;justify-content:space-between;margin-bottom:8px;"><span style="color:var(--text-secondary);">Overtime Hours</span><span style="color:var(--text-bright);">' + payslip.overtime_hours + 'h</span></div>' +
      '<hr style="border:none;border-top:1px solid var(--border-color);margin:12px 0;">' +
      '<div style="display:flex;justify-content:space-between;margin-bottom:8px;"><span style="color:var(--text-secondary);">Base Pay</span><span style="color:var(--text-bright);">' + formatCurrency(payslip.base_pay) + '</span></div>' +
      '<div style="display:flex;justify-content:space-between;margin-bottom:8px;"><span style="color:var(--text-secondary);">Overtime Pay</span><span style="color:var(--text-bright);">' + formatCurrency(payslip.overtime_pay) + '</span></div>' +
      '<div style="display:flex;justify-content:space-between;margin-bottom:8px;"><span style="color:var(--text-secondary);">Bonuses</span><span style="color:var(--neon-green);">+' + formatCurrency(payslip.bonuses) + '</span></div>' +
      '<div style="display:flex;justify-content:space-between;margin-bottom:8px;"><span style="color:var(--text-secondary);">Deductions</span><span style="color:var(--neon-red);">-' + formatCurrency(payslip.deductions) + '</span></div>' +
      '<hr style="border:none;border-top:1px solid var(--border-color);margin:12px 0;">' +
      '<div style="display:flex;justify-content:space-between;"><span style="color:var(--text-bright);font-weight:700;font-size:1.1rem;">NET PAY</span><span style="color:var(--neon-green);font-weight:700;font-family:var(--font-display);font-size:1.2rem;">' + formatCurrency(payslip.total_pay) + '</span></div>' +
    '</div>' +
    (payslip.notes ? '<div style="margin-top:16px;"><div style="color:var(--text-secondary);font-size:0.8rem;text-transform:uppercase;margin-bottom:4px;">Notes</div><div style="color:var(--text-primary);">' + payslip.notes + '</div></div>' : '');

  Modal.show('Payslip Details', html);
}

Router.register('my-payslips', renderEmployeePayslips);
