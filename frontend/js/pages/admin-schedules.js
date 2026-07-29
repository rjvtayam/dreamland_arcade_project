function renderAdminSchedules() {
  const app = document.getElementById('app');
  let schedules = [];
  let users = [];
  let branches = [];
  let filterBranch = '';
  let weekOffset = 0;


  var DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  var DAY_FULL = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  var STATIONS = ['Arcade Cashier','Playhouse Cashier','Cafe Cashier','Assist/Troubleshoot','Cleaners/Maintenance'];

  async function loadData() {
    try {
      [schedules, users, branches] = await Promise.all([
        apiGet('/schedules'),
        apiGet('/users'),
        apiGet('/branches')
      ]);
      if (!Array.isArray(schedules)) schedules = [];
      if (!Array.isArray(users)) users = [];
      if (!Array.isArray(branches)) branches = [];
      render();
    } catch (e) {
      Toast.error('Failed to load schedules');
    }
  }

  function getFiltered() {
    var weekNum = weekOffset % 4;
    return schedules.filter(function(s) {
      if (filterBranch && String(s.branch_id) !== String(filterBranch)) return false;
      var swn = s.week_number !== undefined ? s.week_number : 0;
      return swn === weekNum;
    });
  }

  function getWeekDates(offset) {
    var today = new Date();
    var start = new Date(today);
    start.setDate(today.getDate() - today.getDay() + (offset * 7));
    var dates = [];
    for (var i = 0; i < 7; i++) {
      var d = new Date(start);
      d.setDate(start.getDate() + i);
      dates.push(d);
    }
    return dates;
  }

  function formatWeekLabel(dates) {
    var opts = { month: 'short', day: 'numeric' };
    return dates[0].toLocaleDateString('en-US', opts) + ' - ' + dates[6].toLocaleDateString('en-US', opts) + ', ' + dates[6].getFullYear();
  }

  function getWeekOptionLabel(offset) {
    if (offset === 0) return 'This Week';
    if (offset === 1) return 'Next Week';
    return offset + ' Weeks Ahead';
  }

  function render() {
    var filtered = getFiltered();
    var user = Auth.getUser();
    var isOwner = user && user.role === 'owner';

    var weekOptsHtml = '';
    for (var w = 0; w <= 3; w++) {
      var wDates = getWeekDates(w);
      var wLabel = getWeekOptionLabel(w) + ' (' + formatWeekLabel(wDates) + ')';
      weekOptsHtml += '<option value="' + w + '"' + (w === weekOffset ? ' selected' : '') + '>' + wLabel + '</option>';
    }

    app.innerHTML = '<div class="layout">' + renderSidebar() +
      '<div class="main-content">' + renderNavbar('Schedule Management') +
      '<div class="page-content" id="page-body">' +

      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;gap:12px;">' +
        '<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;min-width:0;">' +
          (isOwner ?
            '<select id="branch-filter" style="background:#0d1117;border:1px solid #30363d;border-radius:6px;padding:8px 12px;color:#e2e8f0;font-size:0.85rem;">' +
            '<option value="">All Branches</option>' +
            branches.map(function(b) { return '<option value="' + b.id + '"' + (String(b.id) === String(filterBranch) ? ' selected' : '') + '>' + escapeHtml(b.name) + '</option>'; }).join('') +
            '</select>' : '') +
          '<select id="week-offset" style="background:#0d1117;border:1px solid #30363d;border-radius:6px;padding:8px 12px;color:#e2e8f0;font-size:0.85rem;">' +
            weekOptsHtml +
          '</select>' +
        '</div>' +
        '<div style="display:flex;gap:8px;flex-shrink:0;">' +
          '<button id="reshuffle-btn" style="background:#f59e0b;color:#fff;border:none;border-radius:8px;padding:8px 20px;cursor:pointer;font-weight:600;font-size:0.85rem;">🔀 Reshuffle</button>' +
          '<button id="add-schedule-btn" style="background:#6366f1;color:#fff;border:none;border-radius:8px;padding:8px 20px;cursor:pointer;font-weight:600;font-size:0.85rem;">+ Add Schedule</button>' +
        '</div>' +
      '</div>' +

      '<div id="schedule-grid" style="overflow-x:auto;"></div>' +
      '</div></div></div>';

    renderGrid(filtered);
    attachEvents();
  }

  function renderGrid(filtered) {
    const grid = document.getElementById('schedule-grid');
    if (!grid) return;

    var today = new Date();
    var weekDates = getWeekDates(weekOffset);
    var weekLabel = formatWeekLabel(weekDates);

    var staffMap = {};
    filtered.forEach(function(s) {
      var key = s.user_id;
      if (!staffMap[key]) {
        staffMap[key] = {
          user_id: s.user_id,
          user_name: s.user_name,
          branch_name: s.branch_name,
          days: {}
        };
      }
      staffMap[key].days[s.day_of_week] = s;
    });

    var staffList = Object.values(staffMap).sort(function(a, b) {
      return (a.user_name || '').localeCompare(b.user_name || '');
    });

    var html = '<div style="background:#1a1f2e;border:1px solid #2a3040;border-radius:12px;">' +
      '<div style="padding:16px 20px;border-bottom:1px solid #2a3040;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">' +
        '<h3 style="color:#e2e8f0;margin:0;font-size:1rem;">Week of ' + weekLabel + '</h3>' +
        '<div style="display:flex;gap:6px;align-items:center;font-size:0.75rem;color:#888;flex-wrap:wrap;">' +
          '<span style="display:inline-flex;align-items:center;gap:4px;"><span style="display:inline-block;width:12px;height:12px;border-radius:3px;background:#0e7490;"></span>Arcade</span>' +
          '<span style="display:inline-flex;align-items:center;gap:4px;"><span style="display:inline-block;width:12px;height:12px;border-radius:3px;background:#854d0e;"></span>Playhouse</span>' +
          '<span style="display:inline-flex;align-items:center;gap:4px;"><span style="display:inline-block;width:12px;height:12px;border-radius:3px;background:#166534;"></span>Cafe</span>' +
          '<span style="display:inline-flex;align-items:center;gap:4px;"><span style="display:inline-block;width:12px;height:12px;border-radius:3px;background:#1e3a5f;"></span>Assist</span>' +
          '<span style="display:inline-flex;align-items:center;gap:4px;"><span style="display:inline-block;width:12px;height:12px;border-radius:3px;background:#581c87;"></span>Maintenance</span>' +
          '<span style="display:inline-flex;align-items:center;gap:4px;"><span style="display:inline-block;width:12px;height:12px;border-radius:3px;background:#7f1d1d;"></span>Off</span>' +
        '</div>' +
      '</div>' +
      '<div style="overflow-x:auto;">' +
      '<table style="width:100%;border-collapse:collapse;">' +
      '<thead><tr style="border-bottom:2px solid #2a3040;">' +
      '<th style="padding:12px 12px;text-align:left;color:#94a3b8;font-size:0.8rem;font-weight:600;min-width:140px;position:sticky;left:0;background:#1a1f2e;z-index:1;">STAFF</th>';

    weekDates.forEach(function(d, i) {
      var isToday = d.toDateString() === today.toDateString();
      html += '<th style="padding:12px 8px;text-align:center;min-width:90px;">' +
        '<div style="color:' + (isToday ? '#818cf8' : '#94a3b8') + ';font-size:0.75rem;font-weight:600;">' + DAY_NAMES[i] + '</div>' +
        '<div style="color:' + (isToday ? '#c7d2fe' : '#64748b') + ';font-size:0.7rem;margin-top:2px;">' + d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + '</div>' +
        (isToday ? '<div style="width:6px;height:6px;border-radius:50%;background:#6366f1;margin:4px auto 0;"></div>' : '') +
      '</th>';
    });
    html += '</tr></thead><tbody>';

    if (staffList.length === 0) {
      html += '<tr><td colspan="8" style="padding:40px;text-align:center;color:#666;">No schedules found. Click <strong>Reshuffle</strong> to generate.</td></tr>';
    }

    staffList.forEach(function(staff) {
      var branchColor = staff.branch_name && staff.branch_name.includes('Infanta') ? '#60a5fa' : '#a78bfa';
      html += '<tr style="border-bottom:1px solid #1e2736;">' +
        '<td style="padding:10px 16px;position:sticky;left:0;background:#1a1f2e;z-index:1;">' +
          '<div style="color:#e2e8f0;font-weight:600;font-size:0.85rem;">' + escapeHtml(staff.user_name || '-') + '</div>' +
          '<div style="color:' + branchColor + ';font-size:0.7rem;">' + escapeHtml(staff.branch_name || '') + '</div>' +
        '</td>';

      for (var i = 0; i < 7; i++) {
        var sched = staff.days[i];
        var isToday = weekDates[i].toDateString() === today.toDateString();
        var cellBg = isToday ? 'rgba(99,102,241,0.08)' : 'transparent';

        if (sched) {
          var station = sched.station || '';
          var isOff = station === 'Day Off';
          var isAssist = station.includes('Assist');
          var isCleaner = station.includes('Cleaner') || station.includes('Maintenance');

          var cardBg, cardBorder, stationColor;
          if (isOff) {
            cardBg = '#7f1d1d'; cardBorder = '#ef4444'; stationColor = '#fca5a5';
          } else if (station === 'Arcade Cashier') {
            cardBg = '#0e7490'; cardBorder = '#06b6d4'; stationColor = '#67e8f9';
          } else if (station === 'Playhouse Cashier') {
            cardBg = '#854d0e'; cardBorder = '#eab308'; stationColor = '#fde047';
          } else if (station === 'Cafe Cashier') {
            cardBg = '#166534'; cardBorder = '#22c55e'; stationColor = '#86efac';
          } else if (isAssist) {
            cardBg = '#1e3a5f'; cardBorder = '#3b82f6'; stationColor = '#93c5fd';
          } else {
            cardBg = '#581c87'; cardBorder = '#a855f7'; stationColor = '#d8b4fe';
          }

          var timeStr = '';
          if (!isOff && sched.start_time && sched.end_time) {
            var sh = parseInt(sched.start_time.split(':')[0]);
            var sm = sched.start_time.split(':')[1] || '00';
            var eh = parseInt(sched.end_time.split(':')[0]);
            var em = sched.end_time.split(':')[1] || '00';
            var ampm_s = sh >= 12 ? 'p' : 'a';
            var ampm_e = eh >= 12 ? 'p' : 'a';
            var h12_s = sh > 12 ? sh - 12 : (sh === 0 ? 12 : sh);
            var h12_e = eh > 12 ? eh - 12 : (eh === 0 ? 12 : eh);
            timeStr = h12_s + ':' + sm + ampm_s + '-' + h12_e + ':' + em + ampm_e;
          }

          html += '<td style="padding:4px;background:' + cellBg + ';">' +
            '<div style="background:' + cardBg + ';border:1px solid ' + cardBorder + ';border-radius:8px;padding:8px 6px;text-align:center;min-height:60px;display:flex;flex-direction:column;justify-content:center;cursor:pointer;" class="sched-cell" data-id="' + sched.id + '">' +
              '<div style="color:' + stationColor + ';font-size:0.7rem;font-weight:600;line-height:1.2;">' + escapeHtml(station || '-') + '</div>' +
              (timeStr ? '<div style="color:#94a3b8;font-size:0.65rem;margin-top:4px;">' + timeStr + '</div>' : '') +
            '</div>' +
          '</td>';
        } else {
          html += '<td style="padding:4px;background:' + cellBg + ';">' +
            '<div style="background:#1e293b;border:1px solid #2a3040;border-radius:8px;padding:8px 6px;text-align:center;min-height:60px;display:flex;align-items:center;justify-content:center;">' +
              '<span style="color:#475569;font-size:0.7rem;">-</span>' +
            '</div>' +
          '</td>';
        }
      }
      html += '</tr>';
    });

    html += '</tbody></table></div></div>';
    grid.innerHTML = html;

    grid.querySelectorAll('.sched-cell').forEach(function(cell) {
      cell.addEventListener('click', function() {
        var id = cell.dataset.id;
        var sched = schedules.find(function(s) { return String(s.id) === String(id); });
        if (sched) openModal(sched);
      });
      cell.addEventListener('mouseenter', function() { cell.style.transform = 'scale(1.02)'; cell.style.transition = 'transform 0.15s'; });
      cell.addEventListener('mouseleave', function() { cell.style.transform = 'scale(1)'; });
    });
  }

  function attachEvents() {
    document.getElementById('logout-btn')?.addEventListener('click', e => { e.preventDefault(); Auth.logout(); });
    document.getElementById('branch-filter')?.addEventListener('change', function(e) { filterBranch = e.target.value; render(); });
    document.getElementById('week-offset')?.addEventListener('change', function(e) { weekOffset = parseInt(e.target.value); renderGrid(getFiltered()); });
    document.getElementById('add-schedule-btn')?.addEventListener('click', function() { openModal(); });
    document.getElementById('reshuffle-btn')?.addEventListener('click', doReshuffle);
  }

  async function doReshuffle() {
    if (!await confirmAsync('Reshuffle all 4 weeks of schedules? This will replace all current schedules.', 'Reshuffle', 'warning')) return;
    var btn = document.getElementById('reshuffle-btn');
    if (btn) {
      btn.disabled = true;
      btn.textContent = '⏳ Reshuffling...';
      btn.style.opacity = '0.6';
    }
    try {
      var user = Auth.getUser();
      var branchId = user.branch_id || 2;
      var result = await apiPost('/schedules/reshuffle?branch_id=' + branchId, {});
      Toast.success(result.detail || 'Schedules reshuffled!');
      await loadData();
    } catch (err) {
      Toast.error(err.message || 'Failed to reshuffle');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = '🔀 Reshuffle';
        btn.style.opacity = '1';
      }
    }
  }

  var SCH_LOGO_ICON = '<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="dl-sc1" x1="6" y1="6" x2="42" y2="42"><stop stop-color="#6366f1"/><stop offset="1" stop-color="#06b6d4"/></linearGradient></defs><rect x="2" y="2" width="44" height="44" rx="12" fill="#0a0e1a" stroke="url(#dl-sc1)" stroke-width="1.5"/><path d="M10 18c0-1.2 1-2.2 2.2-2.4l5-.8c1.6-.3 2.8 1 2.8 2.6v12c0 1.6-1.2 2.9-2.8 2.6l-5-.8c-1.2-.2-2.2-1.2-2.2-2.4V18z" stroke="url(#dl-sc1)" stroke-width="1.8" fill="none"/><circle cx="15" cy="19" r="1.5" fill="#6366f1"/><circle cx="19" cy="23" r="1.5" fill="#818cf8"/><path d="M28 18c0-1.2 1-2.2 2.2-2.4l5-.8c1.6-.3 2.8 1 2.8 2.6v12c0 1.6-1.2 2.9-2.8 2.6l-5-.8c-1.2-.2-2.2-1.2-2.2-2.4V18z" stroke="url(#dl-sc1)" stroke-width="1.8" fill="none"/><circle cx="33" cy="19" r="1.5" fill="#6366f1"/><circle cx="37" cy="23" r="1.5" fill="#818cf8"/><path d="M14 15h20" stroke="url(#dl-sc1)" stroke-width="1.8" stroke-linecap="round"/></svg>';
  var SCH_LABEL = 'color:#94a3b8;font-size:0.72rem;display:block;margin-bottom:5px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;';
  var SCH_INPUT = 'width:100%;background:#0d1117;border:1px solid #30363d;border-radius:8px;padding:10px 12px;color:#e2e8f0;font-size:0.85rem;outline:none;transition:border 0.2s;box-sizing:border-box;';
  var SCH_FOCUS = 'this.style.borderColor=\'';
  var SCH_BLUR = 'this.style.borderColor=\'#30363d\'';

  function buildSchedModalHeader(titleText, accentColor) {
    return '<div style="position:relative;">' +
      '<div style="position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,' + accentColor + ',' + accentColor + '88,' + accentColor + ');"></div>' +
      '<div style="padding:24px 28px 20px;display:flex;align-items:center;gap:14px;">' +
        SCH_LOGO_ICON +
        '<div><div style="color:#e2e8f0;font-size:1.05rem;font-weight:800;letter-spacing:0.3px;">DREAMLAND ARCADE</div>' +
        '<div style="color:' + accentColor + ';font-size:0.62rem;text-transform:uppercase;letter-spacing:2px;margin-top:2px;">' + titleText + '</div></div>' +
      '</div>' +
      '<div style="height:1px;background:linear-gradient(90deg,transparent,#1e293b,#1e293b,transparent);"></div>' +
    '</div>';
  }

  async function openModal(schedule) {
    const isEdit = !!schedule;
    var accentColor = isEdit ? '#f59e0b' : '#6366f1';
    var accentGradient = isEdit ? 'linear-gradient(135deg,#f59e0b,#f97316)' : 'linear-gradient(135deg,#6366f1,#818cf8)';
    var dayOpts = DAY_FULL.map(function(d, i) { return '<option value="' + i + '"' + (isEdit && schedule.day_of_week == i ? ' selected' : '') + '>' + d + '</option>'; }).join('');

    var branchOpts = '<option value="">Select Branch</option>' +
      branches.map(function(b) { return '<option value="' + b.id + '"' + (isEdit && String(schedule.branch_id) === String(b.id) ? ' selected' : '') + '>' + escapeHtml(b.name) + '</option>'; }).join('');

    var userOpts = '<option value="">Select Employee</option>' +
      users.filter(function(u) { return u.is_active; }).map(function(u) { return '<option value="' + u.id + '"' + (isEdit && String(schedule.user_id) === String(u.id) ? ' selected' : '') + '>' + escapeHtml(u.first_name + ' ' + u.last_name) + (u.branch_name ? ' (' + escapeHtml(u.branch_name) + ')' : '') + '</option>'; }).join('');

    var stationOpts = '<option value="">None</option>' +
      STATIONS.map(function(s) { return '<option value="' + s + '"' + (isEdit && schedule.station === s ? ' selected' : '') + '>' + s + '</option>'; }).join('') +
      '<option value="Day Off"' + (isEdit && schedule.station === 'Day Off' ? ' selected' : '') + '>Day Off</option>';

    var html = '<div style="background:linear-gradient(135deg,#060a14,#0a0e1a,#0c1222);border:1px solid #1e293b;border-radius:16px;overflow:hidden;">' +
      buildSchedModalHeader(isEdit ? 'Edit Schedule' : 'New Schedule', accentColor) +

      '<form id="schedule-form" style="padding:20px 28px 24px;">' +

        '<div style="background:#0f172a;border:1px solid #1e293b;border-radius:10px;padding:18px;margin-bottom:16px;">' +
          '<div style="color:' + accentColor + ';font-size:0.65rem;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:14px;display:flex;align-items:center;gap:6px;">' +
            '<svg width="14" height="14" fill="none" stroke="' + accentColor + '" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>' +
            ' Staff & Branch</div>' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">' +
            '<div><label style="' + SCH_LABEL + '">Employee</label>' +
            '<select name="user_id" style="' + SCH_INPUT + '" required onfocus="' + SCH_FOCUS + accentColor + '\'" onblur="' + SCH_BLUR + '">' + userOpts + '</select></div>' +
            '<div><label style="' + SCH_LABEL + '">Branch</label>' +
            '<select name="branch_id" style="' + SCH_INPUT + '" required onfocus="' + SCH_FOCUS + accentColor + '\'" onblur="' + SCH_BLUR + '">' + branchOpts + '</select></div>' +
          '</div>' +
        '</div>' +

        '<div style="background:#0f172a;border:1px solid #1e293b;border-radius:10px;padding:18px;margin-bottom:16px;">' +
          '<div style="color:' + accentColor + ';font-size:0.65rem;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:14px;display:flex;align-items:center;gap:6px;">' +
            '<svg width="14" height="14" fill="none" stroke="' + accentColor + '" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>' +
            ' Schedule Details</div>' +
          '<div style="display:flex;flex-direction:column;gap:14px;">' +
            '<div><label style="' + SCH_LABEL + '">Day</label>' +
            '<select name="day_of_week" style="' + SCH_INPUT + '" required onfocus="' + SCH_FOCUS + accentColor + '\'" onblur="' + SCH_BLUR + '">' +
            '<option value="">Select Day</option>' + dayOpts + '</select></div>' +
            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">' +
              '<div><label style="' + SCH_LABEL + '">Start Time</label>' +
              '<input type="time" name="start_time" style="' + SCH_INPUT + '" value="' + (isEdit && schedule.start_time ? schedule.start_time.substring(0,5) : '09:00') + '" required onfocus="' + SCH_FOCUS + accentColor + '\'" onblur="' + SCH_BLUR + '"></div>' +
              '<div><label style="' + SCH_LABEL + '">End Time</label>' +
              '<input type="time" name="end_time" style="' + SCH_INPUT + '" value="' + (isEdit && schedule.end_time ? schedule.end_time.substring(0,5) : '21:00') + '" required onfocus="' + SCH_FOCUS + accentColor + '\'" onblur="' + SCH_BLUR + '"></div>' +
            '</div>' +
          '</div>' +
        '</div>' +

        '<div style="background:#0f172a;border:1px solid #1e293b;border-radius:10px;padding:18px;margin-bottom:20px;">' +
          '<div style="color:' + accentColor + ';font-size:0.65rem;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:14px;display:flex;align-items:center;gap:6px;">' +
            '<svg width="14" height="14" fill="none" stroke="' + accentColor + '" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>' +
            ' Assignment</div>' +
          '<div><label style="' + SCH_LABEL + '">Station</label>' +
          '<select name="station" style="' + SCH_INPUT + '" onfocus="' + SCH_FOCUS + accentColor + '\'" onblur="' + SCH_BLUR + '">' +
          stationOpts + '</select></div>' +
        '</div>' +

        '<div style="display:flex;gap:10px;">' +
          '<button type="button" onclick="Modal.close()" style="flex:1;padding:11px;border:1px solid #30363d;border-radius:8px;background:#0d1117;color:#94a3b8;font-weight:600;cursor:pointer;transition:all 0.2s;" onmouseenter="this.style.borderColor=\'#ef4444\';this.style.color=\'#fca5a5\'" onmouseleave="this.style.borderColor=\'#30363d\';this.style.color=\'#94a3b8\'">Cancel</button>' +
          (isEdit ? '<button type="button" id="delete-sched-btn" style="flex:1;padding:11px;border:1px solid #ef4444;border-radius:8px;background:#7f1d1d;color:#fca5a5;font-weight:600;cursor:pointer;transition:all 0.2s;" onmouseenter="this.style.background=#991b1b" onmouseleave="this.style.background=\'#7f1d1d\'">Delete</button>' : '') +
          '<button type="submit" style="flex:2;padding:11px;border:none;border-radius:8px;background:' + accentGradient + ';color:#fff;font-weight:700;cursor:pointer;box-shadow:0 2px 10px ' + accentColor + '30;">' +
            (isEdit ? 'Update Schedule' : 'Add Schedule') +
          '</button>' +
        '</div>' +
      '</form>' +
    '</div>';

    Modal.show('', html, { width: '560px' });

    document.getElementById('schedule-form')?.addEventListener('submit', async e => {
      e.preventDefault();
      var f = e.target;
      var data = {
        user_id: parseInt(f.user_id.value),
        branch_id: parseInt(f.branch_id.value),
        day_of_week: parseInt(f.day_of_week.value),
        week_number: isEdit ? (schedule.week_number || 0) : (weekOffset % 4),
        start_time: f.start_time.value,
        end_time: f.end_time.value,
        station: f.station.value || null
      };
      try {
        if (isEdit) {
          await apiPut('/schedules/' + schedule.id, data);
          Toast.success('Schedule updated');
        } else {
          await apiPost('/schedules', data);
          Toast.success('Schedule added');
        }
        Modal.close();
        loadData();
      } catch (err) {
        Toast.error(err.message || 'Failed to save');
      }
    });

    document.getElementById('delete-sched-btn')?.addEventListener('click', async () => {
      if (!await confirmAsync('Delete this schedule?')) return;
      try {
        await apiDelete('/schedules/' + schedule.id);
        Toast.success('Schedule deleted');
        Modal.close();
        loadData();
      } catch (err) {
        Toast.error(err.message || 'Failed to delete');
      }
    });
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  loadData();
}

Router.register('schedules', renderAdminSchedules);
