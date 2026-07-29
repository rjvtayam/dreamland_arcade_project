function renderEmployeePayslips() {
  var app = document.getElementById('app');
  var user = Auth.getUser();

  var PAY_LOGO = '<svg width="40" height="40" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="dl-eps1" x1="6" y1="6" x2="42" y2="42"><stop stop-color="#06b6d4"/><stop offset="1" stop-color="#8b5cf6"/></linearGradient></defs><rect x="2" y="2" width="44" height="44" rx="12" fill="#0a0e1a" stroke="url(#dl-eps1)" stroke-width="1.5"/><path d="M10 18c0-1.2 1-2.2 2.2-2.4l5-.8c1.6-.3 2.8 1 2.8 2.6v12c0 1.6-1.2 2.9-2.8 2.6l-5-.8c-1.2-.2-2.2-1.2-2.2-2.4V18z" stroke="url(#dl-eps1)" stroke-width="1.8" fill="none"/><circle cx="15" cy="19" r="1.5" fill="#06b6d4"/><circle cx="19" cy="23" r="1.5" fill="#8b5cf6"/><path d="M28 18c0-1.2 1-2.2 2.2-2.4l5-.8c1.6-.3 2.8 1 2.8 2.6v12c0 1.6-1.2 2.9-2.8 2.6l-5-.8c-1.2-.2-2.2-1.2-2.2-2.4V18z" stroke="url(#dl-eps1)" stroke-width="1.8" fill="none"/><circle cx="33" cy="19" r="1.5" fill="#06b6d4"/><circle cx="37" cy="23" r="1.5" fill="#8b5cf6"/><path d="M14 15h20" stroke="url(#dl-eps1)" stroke-width="1.8" stroke-linecap="round"/></svg>';

  app.innerHTML = '<div class="layout">' + renderSidebar() +
    '<div class="main-content">' + renderNavbar('My Payslips') +
    '<div class="page-content" id="page-body">' +
      '<div style="text-align:center;padding:60px;color:#475569;">' +
        '<svg width="48" height="48" fill="none" stroke="#22c55e" viewBox="0 0 24 24" style="margin:0 auto 12px;display:block;opacity:0.3;animation:spin 1s linear infinite;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>' +
        '<div style="color:#64748b;font-size:0.9rem;">Loading payslips...</div>' +
      '</div>' +
    '</div></div></div>';

  document.getElementById('logout-btn')?.addEventListener('click', function(e) { e.preventDefault(); Auth.logout(); });

  loadPayslips();

  async function loadPayslips() {
    var container = document.getElementById('page-body');
    try {
      var payslips = await apiGet('/payslips/my');

      if (!payslips || payslips.length === 0) {
        container.innerHTML =
          '<div style="position:relative;margin-bottom:28px;">' +
            '<div style="position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,#06b6d4,#8b5cf6,#06b6d4);border-radius:1px;opacity:0.6;"></div>' +
            '<div style="padding-top:20px;display:flex;align-items:center;gap:14px;">' +
              PAY_LOGO +
              '<div>' +
                '<h2 style="color:#e2e8f0;margin:0;font-size:1.2rem;font-weight:800;letter-spacing:0.3px;">My Payslips</h2>' +
                '<div style="color:#06b6d4;font-size:0.6rem;text-transform:uppercase;letter-spacing:2px;margin-top:2px;">Earnings & Payment History</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div style="text-align:center;padding:60px 20px;color:#475569;background:#0f172a;border:1px solid #1e293b;border-radius:14px;">' +
            '<svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="margin:0 auto 12px;display:block;opacity:0.2;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>' +
            '<div style="font-size:0.9rem;color:#64748b;">No payslips found yet</div>' +
            '<div style="font-size:0.75rem;color:#475569;margin-top:4px;">Your payslips will appear here once created by admin</div>' +
          '</div>';
        return;
      }

      var totalEarnings = 0;
      var totalDeductions = 0;
      var approvedCount = 0;
      var pendingCount = 0;
      payslips.forEach(function(p) {
        totalEarnings += (p.base_pay || 0) + (p.overtime_pay || 0) + (p.bonuses || 0);
        totalDeductions += p.deductions || 0;
        if (p.status === 'approved') approvedCount++;
        else if (p.status === 'pending') pendingCount++;
      });
      var netTotal = totalEarnings - totalDeductions;

      container.innerHTML =
        '<div style="position:relative;margin-bottom:28px;">' +
          '<div style="position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,#06b6d4,#8b5cf6,#06b6d4);border-radius:1px;opacity:0.6;"></div>' +
          '<div style="padding-top:20px;display:flex;align-items:center;gap:14px;">' +
            PAY_LOGO +
            '<div>' +
              '<h2 style="color:#e2e8f0;margin:0;font-size:1.2rem;font-weight:800;letter-spacing:0.3px;">My Payslips</h2>' +
              '<div style="color:#06b6d4;font-size:0.6rem;text-transform:uppercase;letter-spacing:2px;margin-top:2px;">Earnings & Payment History</div>' +
            '</div>' +
          '</div>' +
        '</div>' +

        '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:24px;">' +
          '<div style="background:linear-gradient(135deg,#0f172a,#1e293b);border:1px solid #1e293b;border-radius:14px;padding:18px 16px;position:relative;overflow:hidden;transition:all 0.3s;" onmouseenter="this.style.borderColor=#22c55e;this.style.transform=\'translateY(-2px)\'" onmouseleave="this.style.borderColor=\'#1e293b\';this.style.transform=\'translateY(0)\'">' +
            '<div style="position:absolute;top:0;right:0;width:60px;height:60px;background:radial-gradient(circle,rgba(34,197,94,0.08),transparent);"></div>' +
            '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">' +
              '<div style="width:32px;height:32px;border-radius:8px;background:rgba(34,197,94,0.12);display:flex;align-items:center;justify-content:center;"><svg width="16" height="16" fill="none" stroke="#22c55e" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div>' +
              '<div style="color:#64748b;font-size:0.65rem;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Total Earnings</div>' +
            '</div>' +
            '<div style="color:#4ade80;font-size:1.3rem;font-weight:800;">' + formatCurrency(totalEarnings) + '</div>' +
          '</div>' +
          '<div style="background:linear-gradient(135deg,#0f172a,#1e293b);border:1px solid #1e293b;border-radius:14px;padding:18px 16px;position:relative;overflow:hidden;transition:all 0.3s;" onmouseenter="this.style.borderColor=#ef4444;this.style.transform=\'translateY(-2px)\'" onmouseleave="this.style.borderColor=\'#1e293b\';this.style.transform=\'translateY(0)\'">' +
            '<div style="position:absolute;top:0;right:0;width:60px;height:60px;background:radial-gradient(circle,rgba(239,68,68,0.08),transparent);"></div>' +
            '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">' +
              '<div style="width:32px;height:32px;border-radius:8px;background:rgba(239,68,68,0.12);display:flex;align-items:center;justify-content:center;"><svg width="16" height="16" fill="none" stroke="#ef4444" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"/></svg></div>' +
              '<div style="color:#64748b;font-size:0.65rem;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Deductions</div>' +
            '</div>' +
            '<div style="color:#f87171;font-size:1.3rem;font-weight:800;">' + formatCurrency(totalDeductions) + '</div>' +
          '</div>' +
          '<div style="background:linear-gradient(135deg,#0f172a,#1e293b);border:1px solid #1e293b;border-radius:14px;padding:18px 16px;position:relative;overflow:hidden;transition:all 0.3s;" onmouseenter="this.style.borderColor=#06b6d4;this.style.transform=\'translateY(-2px)\'" onmouseleave="this.style.borderColor=\'#1e293b\';this.style.transform=\'translateY(0)\'">' +
            '<div style="position:absolute;top:0;right:0;width:60px;height:60px;background:radial-gradient(circle,rgba(6,182,212,0.08),transparent);"></div>' +
            '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">' +
              '<div style="width:32px;height:32px;border-radius:8px;background:rgba(6,182,212,0.12);display:flex;align-items:center;justify-content:center;"><svg width="16" height="16" fill="none" stroke="#06b6d4" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div>' +
              '<div style="color:#64748b;font-size:0.65rem;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Approved</div>' +
            '</div>' +
            '<div style="color:#67e8f9;font-size:1.6rem;font-weight:800;">' + approvedCount + '</div>' +
          '</div>' +
          '<div style="background:linear-gradient(135deg,#0f172a,#1e293b);border:1px solid #1e293b;border-radius:14px;padding:18px 16px;position:relative;overflow:hidden;transition:all 0.3s;" onmouseenter="this.style.borderColor=#f59e0b;this.style.transform=\'translateY(-2px)\'" onmouseleave="this.style.borderColor=\'#1e293b\';this.style.transform=\'translateY(0)\'">' +
            '<div style="position:absolute;top:0;right:0;width:60px;height:60px;background:radial-gradient(circle,rgba(245,158,11,0.08),transparent);"></div>' +
            '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">' +
              '<div style="width:32px;height:32px;border-radius:8px;background:rgba(245,158,11,0.12);display:flex;align-items:center;justify-content:center;"><svg width="16" height="16" fill="none" stroke="#f59e0b" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div>' +
              '<div style="color:#64748b;font-size:0.65rem;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Pending</div>' +
            '</div>' +
            '<div style="color:#fbbf24;font-size:1.6rem;font-weight:800;">' + pendingCount + '</div>' +
          '</div>' +
        '</div>' +

        '<div id="payslip-list" style="display:grid;gap:12px;">' +
          payslips.map(function(p) {
            var status = p.status || 'pending';
            var statusColor, statusBg, statusBorder, statusIcon;
            if (status === 'approved') {
              statusColor = '#4ade80'; statusBg = 'rgba(34,197,94,0.1)'; statusBorder = '#22c55e';
              statusIcon = '<svg width="12" height="12" fill="none" stroke="#4ade80" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>';
            } else if (status === 'pending') {
              statusColor = '#fbbf24'; statusBg = 'rgba(245,158,11,0.1)'; statusBorder = '#f59e0b';
              statusIcon = '<svg width="12" height="12" fill="none" stroke="#fbbf24" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 8v4l3 3"/></svg>';
            } else {
              statusColor = '#f87171'; statusBg = 'rgba(239,68,68,0.1)'; statusBorder = '#ef4444';
              statusIcon = '<svg width="12" height="12" fill="none" stroke="#f87171" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>';
            }

            var periodStr = '';
            if (p.period_start && p.period_end) {
              try {
                periodStr = new Date(p.period_start + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' \u2014 ' + new Date(p.period_end + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
              } catch(e) { periodStr = p.period_start + ' \u2014 ' + p.period_end; }
            }

            var earnings = (p.base_pay || 0) + (p.overtime_pay || 0) + (p.bonuses || 0);

            return '<div class="payslip-row" data-id="' + p.id + '" style="background:linear-gradient(135deg,#0f172a,#1e293b);border:1px solid #1e293b;border-radius:14px;padding:0;display:flex;align-items:stretch;overflow:hidden;transition:all 0.25s;cursor:pointer;border-left:4px solid ' + statusBorder + ';" onmouseenter="this.style.borderColor=\'#334155\';this.style.boxShadow=\'0 4px 20px rgba(0,0,0,0.3)\'" onmouseleave="this.style.borderColor=\'#1e293b\';this.style.boxShadow=\'none\'">' +
              '<div style="flex:1;padding:18px 20px;display:flex;align-items:center;gap:16px;min-width:0;">' +
                '<div style="width:48px;height:48px;border-radius:12px;background:' + statusBg + ';border:1px solid ' + statusBorder + '33;display:flex;align-items:center;justify-content:center;flex-shrink:0;">' +
                  '<svg width="22" height="22" fill="none" stroke="' + statusColor + '" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z"/></svg>' +
                '</div>' +
                '<div style="flex:1;min-width:0;">' +
                  '<div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;flex-wrap:wrap;">' +
                    '<div style="color:#e2e8f0;font-weight:700;font-size:0.95rem;">' + esc(periodStr) + '</div>' +
                  '</div>' +
                  '<div style="display:flex;gap:16px;flex-wrap:wrap;">' +
                    '<div style="font-size:0.78rem;"><span style="color:#64748b;">Hours:</span> <span style="color:#94a3b8;font-weight:600;">' + (p.hours_worked || 0) + 'h</span></div>' +
                    '<div style="font-size:0.78rem;"><span style="color:#64748b;">Base:</span> <span style="color:#94a3b8;font-weight:600;">' + formatCurrency(p.base_pay || 0) + '</span></div>' +
                    '<div style="font-size:0.78rem;"><span style="color:#64748b;">OT:</span> <span style="color:#94a3b8;font-weight:600;">' + formatCurrency(p.overtime_pay || 0) + '</span></div>' +
                    (p.bonuses ? '<div style="font-size:0.78rem;"><span style="color:#64748b;">Bonus:</span> <span style="color:#4ade80;font-weight:600;">+' + formatCurrency(p.bonuses) + '</span></div>' : '') +
                    (p.deductions ? '<div style="font-size:0.78rem;"><span style="color:#64748b;">Deductions:</span> <span style="color:#f87171;font-weight:600;">-' + formatCurrency(p.deductions) + '</span></div>' : '') +
                  '</div>' +
                '</div>' +
              '</div>' +
              '<div style="display:flex;align-items:center;gap:16px;padding:0 20px;flex-shrink:0;">' +
                '<div style="text-align:right;">' +
                  '<div style="color:#64748b;font-size:0.65rem;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:2px;">Net Pay</div>' +
                  '<div style="color:#4ade80;font-weight:800;font-size:1.05rem;">' + formatCurrency(p.total_pay || 0) + '</div>' +
                '</div>' +
                '<div style="display:flex;align-items:center;gap:5px;padding:6px 14px;border-radius:20px;background:' + statusBg + ';border:1px solid ' + statusBorder + '33;">' +
                  statusIcon +
                  '<span style="color:' + statusColor + ';font-weight:600;font-size:0.8rem;text-transform:capitalize;">' + status + '</span>' +
                '</div>' +
              '</div>' +
            '</div>';
          }).join('') +
        '</div>';

      document.querySelectorAll('.payslip-row').forEach(function(row) {
        row.addEventListener('click', function() {
          var id = parseInt(row.getAttribute('data-id'));
          var payslip = payslips.find(function(p) { return p.id === id; });
          if (payslip) showPayslipDetail(payslip);
        });
      });

    } catch (err) {
      container.innerHTML = '<div style="text-align:center;padding:60px;color:#f87171;">' +
        '<svg width="48" height="48" fill="none" stroke="#f87171" viewBox="0 0 24 24" style="margin:0 auto 12px;display:block;opacity:0.3;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>' +
        '<div style="font-size:0.9rem;">Failed to load payslips</div>' +
        '<div style="font-size:0.75rem;color:#64748b;margin-top:4px;">' + (err.message || 'Unknown error') + '</div>' +
      '</div>';
    }
  }

  function showPayslipDetail(payslip) {
    var status = payslip.status || 'pending';
    var statusColor = status === 'approved' ? '#22c55e' : status === 'pending' ? '#f59e0b' : '#ef4444';
    var statusBg = status === 'approved' ? 'rgba(34,197,94,0.1)' : status === 'pending' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)';

    var periodStr = '';
    if (payslip.period_start && payslip.period_end) {
      try {
        periodStr = new Date(payslip.period_start + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' \u2014 ' + new Date(payslip.period_end + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      } catch(e) { periodStr = payslip.period_start + ' \u2014 ' + payslip.period_end; }
    }

    var html =
      '<div style="position:relative;margin-bottom:20px;">' +
        '<div style="position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,#06b6d4,#8b5cf6);border-radius:1px;opacity:0.6;"></div>' +
        '<div style="padding-top:16px;display:flex;align-items:center;justify-content:space-between;">' +
          '<div style="display:flex;align-items:center;gap:10px;">' +
            '<div style="width:40px;height:40px;border-radius:10px;background:' + statusBg + ';border:1px solid ' + statusColor + '33;display:flex;align-items:center;justify-content:center;">' +
              '<svg width="20" height="20" fill="none" stroke="' + statusColor + '" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z"/></svg>' +
            '</div>' +
            '<div>' +
              '<div style="color:#e2e8f0;font-weight:700;font-size:0.95rem;">' + esc(periodStr) + '</div>' +
              '<div style="color:#64748b;font-size:0.72rem;">Payslip Details</div>' +
            '</div>' +
          '</div>' +
          '<div style="display:flex;align-items:center;gap:5px;padding:5px 12px;border-radius:16px;background:' + statusBg + ';border:1px solid ' + statusColor + '33;">' +
            '<span style="color:' + statusColor + ';font-weight:600;font-size:0.78rem;text-transform:capitalize;">' + status + '</span>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">' +
        '<div style="background:#0d1117;border:1px solid #1e293b;border-radius:10px;padding:14px;">' +
          '<div style="color:#64748b;font-size:0.7rem;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">Hours Worked</div>' +
          '<div style="color:#e2e8f0;font-weight:700;font-size:1.1rem;">' + (payslip.hours_worked || 0) + 'h</div>' +
        '</div>' +
        '<div style="background:#0d1117;border:1px solid #1e293b;border-radius:10px;padding:14px;">' +
          '<div style="color:#64748b;font-size:0.7rem;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">Overtime Hours</div>' +
          '<div style="color:#e2e8f0;font-weight:700;font-size:1.1rem;">' + (payslip.overtime_hours || 0) + 'h</div>' +
        '</div>' +
      '</div>' +

      '<div style="background:linear-gradient(135deg,#0f172a,#1e293b);border:1px solid #1e293b;border-radius:12px;padding:16px;margin-bottom:16px;">' +
        '<div style="color:#94a3b8;font-size:0.75rem;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:12px;font-weight:600;">Earnings</div>' +
        '<div style="display:flex;justify-content:space-between;margin-bottom:8px;"><span style="color:#94a3b8;font-size:0.85rem;">Base Pay</span><span style="color:#e2e8f0;font-weight:600;">' + formatCurrency(payslip.base_pay || 0) + '</span></div>' +
        '<div style="display:flex;justify-content:space-between;margin-bottom:8px;"><span style="color:#94a3b8;font-size:0.85rem;">Overtime Pay</span><span style="color:#e2e8f0;font-weight:600;">' + formatCurrency(payslip.overtime_pay || 0) + '</span></div>' +
        '<div style="display:flex;justify-content:space-between;"><span style="color:#94a3b8;font-size:0.85rem;">Bonuses</span><span style="color:#4ade80;font-weight:600;">+' + formatCurrency(payslip.bonuses || 0) + '</span></div>' +
      '</div>' +

      '<div style="background:linear-gradient(135deg,#0f172a,#1e293b);border:1px solid #1e293b;border-radius:12px;padding:16px;margin-bottom:16px;">' +
        '<div style="color:#94a3b8;font-size:0.75rem;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:12px;font-weight:600;">Deductions</div>' +
        '<div style="display:flex;justify-content:space-between;"><span style="color:#94a3b8;font-size:0.85rem;">Total Deductions</span><span style="color:#f87171;font-weight:600;">-' + formatCurrency(payslip.deductions || 0) + '</span></div>' +
      '</div>' +

      '<div style="background:linear-gradient(135deg,rgba(34,197,94,0.08),rgba(6,182,212,0.08));border:1px solid rgba(34,197,94,0.2);border-radius:12px;padding:16px;text-align:center;">' +
        '<div style="color:#64748b;font-size:0.7rem;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Net Pay</div>' +
        '<div style="color:#4ade80;font-weight:800;font-size:1.4rem;">' + formatCurrency(payslip.total_pay || 0) + '</div>' +
      '</div>' +

      (payslip.notes ? '<div style="margin-top:16px;"><div style="color:#64748b;font-size:0.7rem;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">Notes</div><div style="color:#94a3b8;font-size:0.85rem;">' + esc(payslip.notes) + '</div></div>' : '');

    Modal.show('Payslip Details', html, { width: '520px' });
  }
}

Router.register('my-payslips', renderEmployeePayslips);
