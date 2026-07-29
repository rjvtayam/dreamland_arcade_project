function renderEmployeeDayoffs() {
  var app = document.getElementById('app');
  var user = Auth.getUser();
  var dayoffs = [];
  var filterStatus = '';
  var currentPage = 1;
  var pageSize = 10;

  var DOFF_LOGO = '<svg width="40" height="40" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="dl-edf1" x1="6" y1="6" x2="42" y2="42"><stop stop-color="#f59e0b"/><stop offset="1" stop-color="#ef4444"/></linearGradient></defs><rect x="2" y="2" width="44" height="44" rx="12" fill="#0a0e1a" stroke="url(#dl-edf1)" stroke-width="1.5"/><path d="M10 18c0-1.2 1-2.2 2.2-2.4l5-.8c1.6-.3 2.8 1 2.8 2.6v12c0 1.6-1.2 2.9-2.8 2.6l-5-.8c-1.2-.2-2.2-1.2-2.2-2.4V18z" stroke="url(#dl-edf1)" stroke-width="1.8" fill="none"/><circle cx="15" cy="19" r="1.5" fill="#f59e0b"/><circle cx="19" cy="23" r="1.5" fill="#ef4444"/><path d="M28 18c0-1.2 1-2.2 2.2-2.4l5-.8c1.6-.3 2.8 1 2.8 2.6v12c0 1.6-1.2 2.9-2.8 2.6l-5-.8c-1.2-.2-2.2-1.2-2.2-2.4V18z" stroke="url(#dl-edf1)" stroke-width="1.8" fill="none"/><circle cx="33" cy="19" r="1.5" fill="#f59e0b"/><circle cx="37" cy="23" r="1.5" fill="#ef4444"/><path d="M14 15h20" stroke="url(#dl-edf1)" stroke-width="1.8" stroke-linecap="round"/></svg>';

  var FILTER_SELECT = 'background:#0d1117;border:1px solid #1e293b;border-radius:8px;padding:8px 12px;color:#e2e8f0;font-size:0.82rem;outline:none;cursor:pointer;transition:border 0.2s;';

  app.innerHTML = '<div class="layout">' + renderSidebar() +
    '<div class="main-content">' + renderNavbar('My Day-Offs') +
    '<div class="page-content" id="page-body">' +
      '<div style="text-align:center;padding:60px;color:#475569;">' +
        '<svg width="48" height="48" fill="none" stroke="#22c55e" viewBox="0 0 24 24" style="margin:0 auto 12px;display:block;opacity:0.3;animation:spin 1s linear infinite;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>' +
        '<div style="color:#64748b;font-size:0.9rem;">Loading...</div>' +
      '</div>' +
    '</div></div></div>';

  document.getElementById('logout-btn')?.addEventListener('click', function(e) {
    e.preventDefault();
    Auth.logout();
  });

  loadData();

  async function loadData() {
    try {
      dayoffs = await apiGet('/dayoffs/my');
      if (!Array.isArray(dayoffs)) dayoffs = [];
      currentPage = 1;
      render();
    } catch (e) {
      Toast.error('Failed to load day-off requests');
    }
  }

  function getFiltered() {
    return dayoffs.filter(function(d) {
      if (filterStatus && d.status !== filterStatus) return false;
      return true;
    });
  }

  function renderPagination(total, page, size) {
    var totalPages = Math.max(1, Math.ceil(total / size));
    if (page > totalPages) page = totalPages;
    var start = total === 0 ? 0 : (page - 1) * size + 1;
    var end = Math.min(page * size, total);

    var pages = [];
    if (totalPages <= 7) {
      for (var i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push('...');
      for (var j = Math.max(2, page - 1); j <= Math.min(totalPages - 1, page + 1); j++) pages.push(j);
      if (page < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }

    var btnBase = 'display:inline-flex;align-items:center;justify-content:center;min-width:34px;height:34px;border:1px solid #1e293b;border-radius:8px;background:#0d1117;color:#94a3b8;font-size:0.8rem;font-weight:500;cursor:pointer;transition:all 0.15s;padding:0 8px;';
    var btnActive = 'display:inline-flex;align-items:center;justify-content:center;min-width:34px;height:34px;border:1px solid #f59e0b;border-radius:8px;background:rgba(245,158,11,0.15);color:#fbbf24;font-size:0.8rem;font-weight:600;cursor:pointer;padding:0 8px;';
    var btnDisabled = 'display:inline-flex;align-items:center;justify-content:center;min-width:34px;height:34px;border:1px solid #1e293b;border-radius:8px;background:#0d1117;color:#334155;font-size:0.8rem;cursor:not-allowed;padding:0 8px;';

    var html = '<div style="display:flex;align-items:center;justify-content:space-between;margin-top:24px;flex-wrap:wrap;gap:12px;">';
    html += '<div style="color:#64748b;font-size:0.8rem;">Showing <span style="color:#94a3b8;font-weight:600;">' + start + '-' + end + '</span> of <span style="color:#94a3b8;font-weight:600;">' + total + '</span></div>';
    html += '<div style="display:flex;align-items:center;gap:4px;">';
    html += '<button class="edoff-page-btn" data-page="' + Math.max(1, page - 1) + '" style="' + (page <= 1 ? btnDisabled : btnBase) + '" ' + (page <= 1 ? 'disabled' : '') + '><svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg></button>';
    pages.forEach(function(p) {
      if (p === '...') {
        html += '<span style="display:inline-flex;align-items:center;justify-content:center;min-width:34px;height:34px;color:#475569;font-size:0.8rem;">...</span>';
      } else {
        html += '<button class="edoff-page-btn" data-page="' + p + '" style="' + (p === page ? btnActive : btnBase) + '">' + p + '</button>';
      }
    });
    html += '<button class="edoff-page-btn" data-page="' + Math.min(totalPages, page + 1) + '" style="' + (page >= totalPages ? btnDisabled : btnBase) + '" ' + (page >= totalPages ? 'disabled' : '') + '><svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg></button>';
    html += '</div></div>';
    return html;
  }

  function render() {
    var filtered = getFiltered();
    var totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    if (currentPage > totalPages) currentPage = totalPages;
    var startIdx = (currentPage - 1) * pageSize;
    var pageItems = filtered.slice(startIdx, startIdx + pageSize);

    var pending = dayoffs.filter(function(d) { return d.status === 'pending'; }).length;
    var approved = dayoffs.filter(function(d) { return d.status === 'approved'; }).length;
    var rejected = dayoffs.filter(function(d) { return d.status === 'rejected'; }).length;
    var total = dayoffs.length;

    var container = document.getElementById('page-body');
    container.innerHTML =
      '<div style="position:relative;margin-bottom:28px;">' +
        '<div style="position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,#f59e0b,#ef4444,#f59e0b);border-radius:1px;opacity:0.6;"></div>' +
        '<div style="padding-top:20px;display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;">' +
          '<div style="display:flex;align-items:center;gap:14px;">' +
            DOFF_LOGO +
            '<div>' +
              '<h2 style="color:#e2e8f0;margin:0;font-size:1.2rem;font-weight:800;letter-spacing:0.3px;">My Day-Off Requests</h2>' +
              '<div style="color:#f59e0b;font-size:0.6rem;text-transform:uppercase;letter-spacing:2px;margin-top:2px;">Manage Your Time-Off</div>' +
            '</div>' +
          '</div>' +
          '<button id="request-dayoff-btn" style="background:linear-gradient(135deg,#f59e0b,#f59e0bcc);color:#fff;border:none;border-radius:10px;padding:10px 22px;cursor:pointer;font-weight:600;font-size:0.85rem;box-shadow:0 4px 15px rgba(245,158,11,0.25);transition:all 0.2s;display:flex;align-items:center;gap:6px;" onmouseenter="this.style.transform=\'translateY(-1px)\';this.style.boxShadow=\'0 6px 20px rgba(245,158,11,0.35)\'" onmouseleave="this.style.transform=\'translateY(0)\';this.style.boxShadow=\'0 4px 15px rgba(245,158,11,0.25)\'">' +
            '<svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>' +
            'Request Day Off' +
          '</button>' +
        '</div>' +
      '</div>' +

      '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:24px;">' +
        '<div style="background:linear-gradient(135deg,#0f172a,#1e293b);border:1px solid #1e293b;border-radius:14px;padding:18px 16px;position:relative;overflow:hidden;transition:all 0.3s;" onmouseenter="this.style.borderColor=#475569;this.style.transform=\'translateY(-2px)\'" onmouseleave="this.style.borderColor=\'#1e293b\';this.style.transform=\'translateY(0)\'">' +
          '<div style="position:absolute;top:0;right:0;width:60px;height:60px;background:radial-gradient(circle,rgba(99,102,241,0.08),transparent);"></div>' +
          '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">' +
            '<div style="width:32px;height:32px;border-radius:8px;background:rgba(99,102,241,0.12);display:flex;align-items:center;justify-content:center;"><svg width="16" height="16" fill="none" stroke="#6366f1" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg></div>' +
            '<div style="color:#64748b;font-size:0.65rem;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Total</div>' +
          '</div>' +
          '<div style="color:#e2e8f0;font-size:1.6rem;font-weight:800;">' + total + '</div>' +
        '</div>' +
        '<div style="background:linear-gradient(135deg,#0f172a,#1e293b);border:1px solid #1e293b;border-radius:14px;padding:18px 16px;position:relative;overflow:hidden;transition:all 0.3s;" onmouseenter="this.style.borderColor=#f59e0b;this.style.transform=\'translateY(-2px)\'" onmouseleave="this.style.borderColor=\'#1e293b\';this.style.transform=\'translateY(0)\'">' +
          '<div style="position:absolute;top:0;right:0;width:60px;height:60px;background:radial-gradient(circle,rgba(245,158,11,0.08),transparent);"></div>' +
          '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">' +
            '<div style="width:32px;height:32px;border-radius:8px;background:rgba(245,158,11,0.12);display:flex;align-items:center;justify-content:center;"><svg width="16" height="16" fill="none" stroke="#f59e0b" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div>' +
            '<div style="color:#64748b;font-size:0.65rem;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Pending</div>' +
          '</div>' +
          '<div style="color:#fbbf24;font-size:1.6rem;font-weight:800;">' + pending + '</div>' +
        '</div>' +
        '<div style="background:linear-gradient(135deg,#0f172a,#1e293b);border:1px solid #1e293b;border-radius:14px;padding:18px 16px;position:relative;overflow:hidden;transition:all 0.3s;" onmouseenter="this.style.borderColor=#22c55e;this.style.transform=\'translateY(-2px)\'" onmouseleave="this.style.borderColor=\'#1e293b\';this.style.transform=\'translateY(0)\'">' +
          '<div style="position:absolute;top:0;right:0;width:60px;height:60px;background:radial-gradient(circle,rgba(34,197,94,0.08),transparent);"></div>' +
          '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">' +
            '<div style="width:32px;height:32px;border-radius:8px;background:rgba(34,197,94,0.12);display:flex;align-items:center;justify-content:center;"><svg width="16" height="16" fill="none" stroke="#22c55e" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div>' +
            '<div style="color:#64748b;font-size:0.65rem;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Approved</div>' +
          '</div>' +
          '<div style="color:#4ade80;font-size:1.6rem;font-weight:800;">' + approved + '</div>' +
        '</div>' +
        '<div style="background:linear-gradient(135deg,#0f172a,#1e293b);border:1px solid #1e293b;border-radius:14px;padding:18px 16px;position:relative;overflow:hidden;transition:all 0.3s;" onmouseenter="this.style.borderColor=#ef4444;this.style.transform=\'translateY(-2px)\'" onmouseleave="this.style.borderColor=\'#1e293b\';this.style.transform=\'translateY(0)\'">' +
          '<div style="position:absolute;top:0;right:0;width:60px;height:60px;background:radial-gradient(circle,rgba(239,68,68,0.08),transparent);"></div>' +
          '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">' +
            '<div style="width:32px;height:32px;border-radius:8px;background:rgba(239,68,68,0.12);display:flex;align-items:center;justify-content:center;"><svg width="16" height="16" fill="none" stroke="#ef4444" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div>' +
            '<div style="color:#64748b;font-size:0.65rem;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Rejected</div>' +
          '</div>' +
          '<div style="color:#f87171;font-size:1.6rem;font-weight:800;">' + rejected + '</div>' +
        '</div>' +
      '</div>' +

      '<div style="display:flex;gap:10px;margin-bottom:20px;flex-wrap:wrap;align-items:center;">' +
        '<div style="position:relative;">' +
          '<svg width="14" height="14" fill="none" stroke="#64748b" viewBox="0 0 24 24" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);pointer-events:none;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/></svg>' +
          '<select id="edoff-status-filter" style="' + FILTER_SELECT + 'padding-left:32px;">' +
            '<option value="">All Status</option>' +
            '<option value="pending"' + (filterStatus === 'pending' ? ' selected' : '') + '>Pending</option>' +
            '<option value="approved"' + (filterStatus === 'approved' ? ' selected' : '') + '>Approved</option>' +
            '<option value="rejected"' + (filterStatus === 'rejected' ? ' selected' : '') + '>Rejected</option>' +
          '</select>' +
        '</div>' +
        '<div style="flex:1;"></div>' +
        '<div style="display:flex;align-items:center;gap:6px;">' +
          '<span style="color:#64748b;font-size:0.8rem;">Show</span>' +
          '<select id="edoff-page-size" style="' + FILTER_SELECT + 'padding:5px 8px;">' +
            '<option value="5"' + (pageSize === 5 ? ' selected' : '') + '>5</option>' +
            '<option value="10"' + (pageSize === 10 ? ' selected' : '') + '>10</option>' +
            '<option value="25"' + (pageSize === 25 ? ' selected' : '') + '>25</option>' +
          '</select>' +
          '<span style="color:#64748b;font-size:0.8rem;">per page</span>' +
        '</div>' +
      '</div>' +

      '<div id="edoff-list" style="display:grid;gap:12px;">' +
        (pageItems.length === 0 ?
          '<div style="text-align:center;padding:60px 20px;color:#475569;background:#0f172a;border:1px solid #1e293b;border-radius:14px;">' +
            '<svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="margin:0 auto 12px;display:block;opacity:0.2;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>' +
            '<div style="font-size:0.9rem;color:#64748b;">No day-off requests found</div>' +
            '<div style="font-size:0.75rem;color:#475569;margin-top:4px;">Submit a request using the button above</div>' +
          '</div>' :
          pageItems.map(function(d) {
            var date = d.date || d.day_off_date || '\u2014';
            var reason = d.reason || 'No reason provided';
            var reviewedBy = d.reviewer_name || '';
            var status = d.status;

            var statusColor, statusBg, statusBorder, statusIcon;
            if (status === 'approved') {
              statusColor = '#4ade80'; statusBg = 'rgba(34,197,94,0.1)'; statusBorder = '#22c55e';
              statusIcon = '<svg width="12" height="12" fill="none" stroke="#4ade80" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>';
            } else if (status === 'rejected') {
              statusColor = '#f87171'; statusBg = 'rgba(239,68,68,0.1)'; statusBorder = '#ef4444';
              statusIcon = '<svg width="12" height="12" fill="none" stroke="#f87171" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>';
            } else {
              statusColor = '#fbbf24'; statusBg = 'rgba(245,158,11,0.1)'; statusBorder = '#f59e0b';
              statusIcon = '<svg width="12" height="12" fill="none" stroke="#fbbf24" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 8v4l3 3"/></svg>';
            }

            var dayName = '';
            try { dayName = new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' }); } catch(e) {}

            var submittedDate = '';
            if (d.created_at) {
              try { submittedDate = new Date(d.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); } catch(e) { submittedDate = d.created_at; }
            }

            return '<div style="background:linear-gradient(135deg,#0f172a,#1e293b);border:1px solid #1e293b;border-radius:14px;padding:0;display:flex;align-items:stretch;overflow:hidden;transition:all 0.25s;border-left:4px solid ' + statusBorder + ';" onmouseenter="this.style.borderColor=\'#334155\';this.style.boxShadow=\'0 4px 20px rgba(0,0,0,0.3)\'" onmouseleave="this.style.borderColor=\'#1e293b\';this.style.boxShadow=\'none\'">' +
              '<div style="flex:1;padding:18px 20px;display:flex;align-items:center;gap:16px;min-width:0;">' +
                '<div style="width:48px;height:48px;border-radius:12px;background:' + statusBg + ';border:1px solid ' + statusBorder + '33;display:flex;align-items:center;justify-content:center;flex-shrink:0;">' +
                  '<svg width="22" height="22" fill="none" stroke="' + statusColor + '" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>' +
                '</div>' +
                '<div style="flex:1;min-width:0;">' +
                  '<div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;flex-wrap:wrap;">' +
                    '<div style="color:#e2e8f0;font-weight:700;font-size:0.95rem;">' + esc(date) + '</div>' +
                    (dayName ? '<div style="color:#64748b;font-size:0.75rem;">' + esc(dayName) + '</div>' : '') +
                  '</div>' +
                  '<div style="color:#94a3b8;font-size:0.82rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:400px;" title="' + esc(reason) + '">' + esc(reason) + '</div>' +
                  (reviewedBy ? '<div style="color:#64748b;font-size:0.72rem;margin-top:4px;">Reviewed by: ' + esc(reviewedBy) + '</div>' : '') +
                  (submittedDate ? '<div style="color:#475569;font-size:0.7rem;margin-top:2px;">Submitted: ' + submittedDate + '</div>' : '') +
                '</div>' +
              '</div>' +
              '<div style="display:flex;align-items:center;padding:0 20px;flex-shrink:0;">' +
                '<div style="display:flex;align-items:center;gap:5px;padding:6px 14px;border-radius:20px;background:' + statusBg + ';border:1px solid ' + statusBorder + '33;">' +
                  statusIcon +
                  '<span style="color:' + statusColor + ';font-weight:600;font-size:0.8rem;text-transform:capitalize;">' + (status || 'N/A') + '</span>' +
                '</div>' +
              '</div>' +
            '</div>';
          }).join('')
        ) +
        '</div>' +
        renderPagination(filtered.length, currentPage, pageSize) +
      '</div>';

    document.getElementById('request-dayoff-btn').addEventListener('click', function() {
      showRequestDayoffModal(user);
    });

    document.getElementById('edoff-status-filter').addEventListener('change', function() {
      filterStatus = this.value;
      currentPage = 1;
      render();
    });

    document.getElementById('edoff-page-size').addEventListener('change', function() {
      pageSize = parseInt(this.value) || 10;
      currentPage = 1;
      render();
    });

    document.querySelectorAll('.edoff-page-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var page = parseInt(btn.getAttribute('data-page'));
        if (page && page !== currentPage) {
          currentPage = page;
          render();
        }
      });
    });
  }

  function showRequestDayoffModal(user) {
    var today = new Date().toISOString().slice(0, 10);

    var html =
      '<div style="padding:8px 0;">' +
        '<div style="margin-bottom:16px;">' +
          '<label style="display:block;color:#94a3b8;font-size:0.8rem;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;font-weight:600;">Date *</label>' +
          '<input type="date" id="edoff-date" min="' + today + '" value="" style="width:100%;background:#0d1117;border:1px solid #1e293b;border-radius:8px;padding:10px 12px;color:#e2e8f0;font-size:0.9rem;box-sizing:border-box;outline:none;transition:border 0.2s;" onfocus="this.style.borderColor=\'#f59e0b\'" onblur="this.style.borderColor=\'#1e293b\'">' +
        '</div>' +
        '<div style="margin-bottom:16px;">' +
          '<label style="display:block;color:#94a3b8;font-size:0.8rem;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;font-weight:600;">Reason *</label>' +
          '<textarea id="edoff-reason" rows="3" placeholder="Enter reason for day off..." style="width:100%;background:#0d1117;border:1px solid #1e293b;border-radius:8px;padding:10px 12px;color:#e2e8f0;font-size:0.9rem;resize:vertical;box-sizing:border-box;font-family:inherit;outline:none;transition:border 0.2s;" onfocus="this.style.borderColor=\'#f59e0b\'" onblur="this.style.borderColor=\'#1e293b\'"></textarea>' +
        '</div>' +
        '<div id="edoff-error" style="color:#f87171;font-size:0.85rem;min-height:18px;margin-bottom:8px;"></div>' +
        '<button id="edoff-submit-btn" style="width:100%;padding:11px;border:none;border-radius:10px;background:linear-gradient(135deg,#f59e0b,#f59e0bcc);color:#fff;font-size:0.95rem;font-weight:600;cursor:pointer;transition:all 0.2s;box-shadow:0 4px 15px rgba(245,158,11,0.25);" onmouseenter="this.style.transform=\'translateY(-1px)\';this.style.boxShadow=\'0 6px 20px rgba(245,158,11,0.35)\'" onmouseleave="this.style.transform=\'translateY(0)\';this.style.boxShadow=\'0 4px 15px rgba(245,158,11,0.25)\'">Submit Request</button>' +
      '</div>';

    Modal.show('Request Day Off', html, { width: '420px' });

    setTimeout(function() {
      var submitBtn = document.getElementById('edoff-submit-btn');
      var errEl = document.getElementById('edoff-error');
      var submitted = false;

      submitBtn.addEventListener('click', async function() {
        if (submitted) return;

        var date = document.getElementById('edoff-date').value;
        var reason = document.getElementById('edoff-reason').value.trim();

        if (!date) { errEl.textContent = 'Please select a date'; return; }
        if (!reason) { errEl.textContent = 'Please enter a reason'; return; }

        submitted = true;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';
        errEl.textContent = '';

        try {
          await apiPost('/dayoffs', {
            date: date,
            reason: reason,
            branch_id: user.branch_id
          });
          Toast.success('Day-off request submitted!');
          Modal.close();
          loadData();
        } catch (err) {
          errEl.textContent = err.message || 'Failed to submit request';
          submitted = false;
          submitBtn.disabled = false;
          submitBtn.textContent = 'Submit Request';
        }
      });
    }, 100);
  }
}

Router.register('my-dayoffs', renderEmployeeDayoffs);
