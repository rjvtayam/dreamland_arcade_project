function renderAdminSchedules() {
  const app = document.getElementById('app');
  let schedules = [];
  let users = [];
  let branches = [];
  let filterBranch = '';

  const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const DAY_FULL = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

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
    if (!filterBranch) return schedules;
    return schedules.filter(s => String(s.branch_id) === String(filterBranch));
  }

  function render() {
    const filtered = getFiltered();
    const user = Auth.getUser();
    const isOwner = user && user.role === 'owner';

    app.innerHTML = '<div class="layout">' + renderSidebar() +
      '<div class="main-content">' + renderNavbar('Schedule Management') +
      '<div class="page-content" id="page-body">' +

      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:12px;">' +
        '<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">' +
          (isOwner ?
            '<select id="branch-filter" style="background:#0d1117;border:1px solid #30363d;border-radius:6px;padding:8px 12px;color:#e2e8f0;font-size:0.85rem;">' +
            '<option value="">All Branches</option>' +
            branches.map(b => '<option value="' + b.id + '"' + (String(b.id) === String(filterBranch) ? ' selected' : '') + '>' + escapeHtml(b.name) + '</option>').join('') +
            '</select>' : '') +
          '<select id="week-offset" style="background:#0d1117;border:1px solid #30363d;border-radius:6px;padding:8px 12px;color:#e2e8f0;font-size:0.85rem;">' +
            '<option value="0">This Week</option>' +
            '<option value="1">Next Week</option>' +
            '<option value="2">2 Weeks Ahead</option>' +
            '<option value="3">3 Weeks Ahead</option>' +
          '</select>' +
        '</div>' +
        '<button id="add-schedule-btn" style="background:#6366f1;color:#fff;border:none;border-radius:8px;padding:8px 20px;cursor:pointer;font-weight:600;font-size:0.85rem;">+ Add Schedule</button>' +
      '</div>' +

      '<div id="schedule-grid" style="overflow-x:auto;"></div>' +
      '</div></div></div>';

    renderGrid(filtered);
    attachEvents();
  }

  function renderGrid(filtered) {
    const grid = document.getElementById('schedule-grid');
    if (!grid) return;

    var weekOffset = parseInt(document.getElementById('week-offset')?.value || '0');
    var today = new Date();
    var startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + (weekOffset * 7));

    var weekDates = [];
    for (var i = 0; i < 7; i++) {
      var d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      weekDates.push(d);
    }

    var weekStart = weekDates[0];
    var weekEnd = weekDates[6];
    var opts = { month: 'short', day: 'numeric', year: 'numeric' };
    var weekLabel = weekStart.toLocaleDateString('en-US', opts) + ' - ' + weekEnd.toLocaleDateString('en-US', opts);

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

    var isMobile = window.innerWidth < 768;

    var html = '<div style="background:#1a1f2e;border:1px solid #2a3040;border-radius:12px;overflow:hidden;">' +
      '<div style="padding:16px 20px;border-bottom:1px solid #2a3040;display:flex;justify-content:space-between;align-items:center;">' +
        '<h3 style="color:#e2e8f0;margin:0;font-size:1rem;">Week of ' + weekLabel + '</h3>' +
        '<div style="display:flex;gap:8px;align-items:center;">' +
          '<div style="display:flex;gap:6px;align-items:center;font-size:0.75rem;color:#888;">' +
            '<span style="display:inline-block;width:12px;height:12px;border-radius:3px;background:#166534;"></span> Cashier' +
            '<span style="display:inline-block;width:12px;height:12px;border-radius:3px;background:#1e3a5f;margin-left:8px;"></span> Assist' +
            '<span style="display:inline-block;width:12px;height:12px;border-radius:3px;background:#581c87;margin-left:8px;"></span> Cleaner' +
            '<span style="display:inline-block;width:12px;height:12px;border-radius:3px;background:#7f1d1d;margin-left:8px;"></span> Off' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div style="overflow-x:auto;">' +
      '<table style="width:100%;border-collapse:collapse;min-width:900px;">' +
      '<thead><tr style="border-bottom:2px solid #2a3040;">' +
      '<th style="padding:12px 16px;text-align:left;color:#94a3b8;font-size:0.8rem;font-weight:600;min-width:160px;position:sticky;left:0;background:#1a1f2e;z-index:1;">STAFF</th>';

    var todayIdx = today.getDay();
    weekDates.forEach(function(d, i) {
      var isToday = d.toDateString() === today.toDateString();
      var dayBg = isToday ? '#6366f1' : 'transparent';
      html += '<th style="padding:12px 10px;text-align:center;min-width:110px;">' +
        '<div style="color:' + (isToday ? '#818cf8' : '#94a3b8') + ';font-size:0.75rem;font-weight:600;">' + DAY_NAMES[i] + '</div>' +
        '<div style="color:' + (isToday ? '#c7d2fe' : '#64748b') + ';font-size:0.7rem;margin-top:2px;">' + d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + '</div>' +
        (isToday ? '<div style="width:6px;height:6px;border-radius:50%;background:#6366f1;margin:4px auto 0;"></div>' : '') +
      '</th>';
    });
    html += '</tr></thead><tbody>';

    if (staffList.length === 0) {
      html += '<tr><td colspan="8" style="padding:40px;text-align:center;color:#666;">No schedules found</td></tr>';
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
          var isCashier = station.includes('Cashier');
          var isAssist = station.includes('Assist');
          var isCleaner = station.includes('Cleaner');

          var cardBg, cardBorder, stationColor;
          if (isOff) {
            cardBg = '#7f1d1d'; cardBorder = '#ef4444'; stationColor = '#fca5a5';
          } else if (isCashier) {
            cardBg = '#166534'; cardBorder = '#22c55e'; stationColor = '#86efac';
          } else if (isAssist) {
            cardBg = '#1e3a5f'; cardBorder = '#3b82f6'; stationColor = '#93c5fd';
          } else {
            cardBg = '#581c87'; cardBorder = '#a855f7'; stationColor = '#d8b4fe';
          }

          var timeStr = '';
          if (!isOff && sched.start_time && sched.end_time) {
            var sh = parseInt(sched.start_time.split(':')[0]);
            var sm = sched.start_time.split(':')[1];
            var eh = parseInt(sched.end_time.split(':')[0]);
            var em = sched.end_time.split(':')[1];
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
    document.getElementById('branch-filter')?.addEventListener('change', e => { filterBranch = e.target.value; render(); });
    document.getElementById('week-offset')?.addEventListener('change', () => renderGrid(getFiltered()));
    document.getElementById('add-schedule-btn')?.addEventListener('click', () => openModal());
  }

  async function openModal(schedule) {
    const isEdit = !!schedule;
    const title = isEdit ? 'Edit Schedule' : 'Add Schedule';
    var dayOpts = DAY_FULL.map((d, i) => '<option value="' + i + '"' + (isEdit && schedule.day_of_week == i ? ' selected' : '') + '>' + d + '</option>').join('');

    var branchOpts = '<option value="">Select Branch</option>' +
      branches.map(b => '<option value="' + b.id + '"' + (isEdit && String(schedule.branch_id) === String(b.id) ? ' selected' : '') + '>' + escapeHtml(b.name) + '</option>').join('');

    var userOpts = '<option value="">Select Employee</option>' +
      users.filter(u => u.is_active).map(u => '<option value="' + u.id + '"' + (isEdit && String(schedule.user_id) === String(u.id) ? ' selected' : '') + '>' + escapeHtml(u.first_name + ' ' + u.last_name) + (u.branch_name ? ' (' + escapeHtml(u.branch_name) + ')' : '') + '</option>').join('');

    var html = '<form id="schedule-form" style="display:flex;flex-direction:column;gap:16px;">' +
      '<div><label style="color:#94a3b8;font-size:0.8rem;display:block;margin-bottom:4px;">Employee</label>' +
      '<select name="user_id" style="width:100%;background:#0d1117;border:1px solid #30363d;border-radius:6px;padding:8px;color:#e2e8f0;" required>' + userOpts + '</select></div>' +
      '<div><label style="color:#94a3b8;font-size:0.8rem;display:block;margin-bottom:4px;">Branch</label>' +
      '<select name="branch_id" style="width:100%;background:#0d1117;border:1px solid #30363d;border-radius:6px;padding:8px;color:#e2e8f0;" required>' + branchOpts + '</select></div>' +
      '<div><label style="color:#94a3b8;font-size:0.8rem;display:block;margin-bottom:4px;">Day</label>' +
      '<select name="day_of_week" style="width:100%;background:#0d1117;border:1px solid #30363d;border-radius:6px;padding:8px;color:#e2e8f0;" required>' +
      '<option value="">Select Day</option>' + dayOpts + '</select></div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">' +
      '<div><label style="color:#94a3b8;font-size:0.8rem;display:block;margin-bottom:4px;">Start Time</label>' +
      '<input type="time" name="start_time" style="width:100%;background:#0d1117;border:1px solid #30363d;border-radius:6px;padding:8px;color:#e2e8f0;" value="' + (isEdit && schedule.start_time ? schedule.start_time.substring(0,5) : '09:00') + '" required></div>' +
      '<div><label style="color:#94a3b8;font-size:0.8rem;display:block;margin-bottom:4px;">End Time</label>' +
      '<input type="time" name="end_time" style="width:100%;background:#0d1117;border:1px solid #30363d;border-radius:6px;padding:8px;color:#e2e8f0;" value="' + (isEdit && schedule.end_time ? schedule.end_time.substring(0,5) : '21:00') + '" required></div></div>' +
      '<div><label style="color:#94a3b8;font-size:0.8rem;display:block;margin-bottom:4px;">Station / Assignment</label>' +
      '<select name="station" style="width:100%;background:#0d1117;border:1px solid #30363d;border-radius:6px;padding:8px;color:#e2e8f0;">' +
      '<option value="">None</option>' +
      ['Arcade Cashier','Playhouse Cashier','Cafe Cashier','Assist/Troubleshoot','Cleaner','Assist/Troubleshoot & Cleaner','Day Off'].map(s =>
        '<option value="' + s + '"' + (isEdit && schedule.station === s ? ' selected' : '') + '>' + s + '</option>'
      ).join('') + '</select></div>' +
      '<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:8px;">' +
      '<button type="button" onclick="Modal.close()" style="background:#374151;color:#9ca3af;border:none;border-radius:6px;padding:8px 20px;cursor:pointer;">Cancel</button>' +
      (isEdit ? '<button type="button" id="delete-sched-btn" style="background:#7f1d1d;color:#fca5a5;border:1px solid #ef4444;border-radius:6px;padding:8px 16px;cursor:pointer;">Delete</button>' : '') +
      '<button type="submit" style="background:#6366f1;color:#fff;border:none;border-radius:6px;padding:8px 20px;cursor:pointer;font-weight:600;">' + (isEdit ? 'Update' : 'Add') + '</button>' +
      '</div></form>';

    Modal.show(title, html, { width: '500px' });

    document.getElementById('schedule-form')?.addEventListener('submit', async e => {
      e.preventDefault();
      var f = e.target;
      var data = {
        user_id: parseInt(f.user_id.value),
        branch_id: parseInt(f.branch_id.value),
        day_of_week: parseInt(f.day_of_week.value),
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
      if (!confirm('Delete this schedule?')) return;
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
