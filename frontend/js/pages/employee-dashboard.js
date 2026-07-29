function renderEmployeeDashboard() {
  var app = document.getElementById('app');
  var user = Auth.getUser();

  app.innerHTML = '<div class="layout">' + renderSidebar() +
    '<div class="main-content">' + renderNavbar('Dashboard') +
    '<div class="page-content" id="page-body">' +
      '<div id="dashboard-loading" style="text-align:center;padding:60px;color:#475569;">' +
        '<svg width="48" height="48" fill="none" stroke="#22c55e" viewBox="0 0 24 24" style="margin:0 auto 12px;display:block;opacity:0.3;animation:spin 1s linear infinite;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>' +
        '<div style="color:#64748b;font-size:0.9rem;">Loading dashboard...</div>' +
      '</div>' +
    '</div></div></div>';

  document.getElementById('logout-btn')?.addEventListener('click', function(e) {
    e.preventDefault();
    Auth.logout();
  });

  loadDashboardData(user);
}

async function loadDashboardData(user) {
  var container = document.getElementById('page-body');
  try {
    var [attendanceRes, scheduleRes] = await Promise.all([
      apiGet('/attendance/my'),
      apiGet('/schedules/my')
    ]);

    var records = Array.isArray(attendanceRes) ? attendanceRes : [];
    var schedules = Array.isArray(scheduleRes) ? scheduleRes : [];

    var today = new Date().toISOString().slice(0, 10);
    var todayRecord = records.find(function(r) { return r.clock_in && r.clock_in.slice(0, 10) === today; });
    var isClockedIn = todayRecord && !todayRecord.clock_out;

    var hoursWorked = '0h 0m';
    var hoursRunning = false;
    if (todayRecord && todayRecord.clock_out) {
      var diff = new Date(todayRecord.clock_out) - new Date(todayRecord.clock_in);
      var h = Math.floor(diff / 3600000);
      var m = Math.floor((diff % 3600000) / 60000);
      hoursWorked = h + 'h ' + m + 'm';
    } else if (todayRecord && todayRecord.clock_in) {
      var diff2 = new Date() - new Date(todayRecord.clock_in);
      var h2 = Math.floor(diff2 / 3600000);
      var m2 = Math.floor((diff2 % 3600000) / 60000);
      hoursWorked = h2 + 'h ' + m2 + 'm';
      hoursRunning = true;
    }

    var todayDay = new Date().getDay();
    var dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    var todaySchedule = schedules.find(function(s) {
      return s.day_name === dayNames[todayDay];
    });

    var recentRecords = records.slice(0, 7);

    var DASH_LOGO = '<svg width="40" height="40" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="dl-dh1" x1="6" y1="6" x2="42" y2="42"><stop stop-color="#22c55e"/><stop offset="1" stop-color="#06b6d4"/></linearGradient></defs><rect x="2" y="2" width="44" height="44" rx="12" fill="#0a0e1a" stroke="url(#dl-dh1)" stroke-width="1.5"/><path d="M10 18c0-1.2 1-2.2 2.2-2.4l5-.8c1.6-.3 2.8 1 2.8 2.6v12c0 1.6-1.2 2.9-2.8 2.6l-5-.8c-1.2-.2-2.2-1.2-2.2-2.4V18z" stroke="url(#dl-dh1)" stroke-width="1.8" fill="none"/><circle cx="15" cy="19" r="1.5" fill="#22c55e"/><circle cx="19" cy="23" r="1.5" fill="#06b6d4"/><path d="M28 18c0-1.2 1-2.2 2.2-2.4l5-.8c1.6-.3 2.8 1 2.8 2.6v12c0 1.6-1.2 2.9-2.8 2.6l-5-.8c-1.2-.2-2.2-1.2-2.2-2.4V18z" stroke="url(#dl-dh1)" stroke-width="1.8" fill="none"/><circle cx="33" cy="19" r="1.5" fill="#22c55e"/><circle cx="37" cy="23" r="1.5" fill="#06b6d4"/><path d="M14 15h20" stroke="url(#dl-dh1)" stroke-width="1.8" stroke-linecap="round"/></svg>';

    var statusColor, statusText, statusIcon;
    if (isClockedIn) {
      statusColor = '#22c55e'; statusText = 'Timed In';
      statusIcon = '<svg width="20" height="20" fill="none" stroke="#22c55e" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>';
    } else if (todayRecord) {
      statusColor = '#60a5fa'; statusText = 'Timed Out';
      statusIcon = '<svg width="20" height="20" fill="none" stroke="#60a5fa" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>';
    } else {
      statusColor = '#f87171'; statusText = 'Not Timed In';
      statusIcon = '<svg width="20" height="20" fill="none" stroke="#f87171" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>';
    }

    var clockInDisabled = isClockedIn ? 'pointer-events:none;opacity:0.4;' : '';
    var clockOutDisabled = (!todayRecord || isClockedIn) ? '' : 'pointer-events:none;opacity:0.4;';
    if (!todayRecord) clockOutDisabled = 'pointer-events:none;opacity:0.4;';

    container.innerHTML =
      '<div style="position:relative;margin-bottom:28px;">' +
        '<div style="position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,#22c55e,#06b6d4,#22c55e);border-radius:1px;opacity:0.6;"></div>' +
        '<div style="padding-top:20px;display:flex;align-items:center;gap:14px;">' +
          DASH_LOGO +
          '<div>' +
            '<h2 style="color:#e2e8f0;margin:0;font-size:1.2rem;font-weight:800;letter-spacing:0.3px;">Welcome back, ' + esc(user.first_name || user.username) + '!</h2>' +
            '<div style="color:#22c55e;font-size:0.6rem;text-transform:uppercase;letter-spacing:2px;margin-top:2px;">' + new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) + '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:24px;">' +
        '<div style="background:linear-gradient(135deg,#0f172a,#1e293b);border:1px solid #1e293b;border-radius:14px;padding:18px 16px;position:relative;overflow:hidden;transition:all 0.3s;" onmouseenter="this.style.borderColor=\'' + statusColor + '\';this.style.transform=\'translateY(-2px)\'" onmouseleave="this.style.borderColor=\'#1e293b\';this.style.transform=\'translateY(0)\'">' +
          '<div style="position:absolute;top:0;right:0;width:60px;height:60px;background:radial-gradient(circle,' + statusColor + '10,transparent);"></div>' +
          '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">' +
            '<div style="width:32px;height:32px;border-radius:8px;background:' + statusColor + '18;display:flex;align-items:center;justify-content:center;">' + statusIcon + '</div>' +
            '<div style="color:#64748b;font-size:0.65rem;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Today\'s Status</div>' +
          '</div>' +
          '<div style="color:' + statusColor + ';font-size:1.3rem;font-weight:800;">' + statusText + '</div>' +
        '</div>' +

        '<div style="background:linear-gradient(135deg,#0f172a,#1e293b);border:1px solid #1e293b;border-radius:14px;padding:18px 16px;position:relative;overflow:hidden;transition:all 0.3s;" onmouseenter="this.style.borderColor=#60a5fa;this.style.transform=\'translateY(-2px)\'" onmouseleave="this.style.borderColor=\'#1e293b\';this.style.transform=\'translateY(0)\'">' +
          '<div style="position:absolute;top:0;right:0;width:60px;height:60px;background:radial-gradient(circle,rgba(96,165,250,0.08),transparent);"></div>' +
          '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">' +
            '<div style="width:32px;height:32px;border-radius:8px;background:rgba(96,165,250,0.12);display:flex;align-items:center;justify-content:center;"><svg width="16" height="16" fill="none" stroke="#60a5fa" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div>' +
            '<div style="color:#64748b;font-size:0.65rem;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Hours Worked</div>' +
          '</div>' +
          '<div style="color:#93c5fd;font-size:1.3rem;font-weight:800;">' + hoursWorked + (hoursRunning ? ' <span style="font-size:0.6rem;color:#60a5fa;vertical-align:middle;animation:pulse 2s infinite;">RUNNING</span>' : '') + '</div>' +
        '</div>' +

        '<div style="background:linear-gradient(135deg,#0f172a,#1e293b);border:1px solid #1e293b;border-radius:14px;padding:18px 16px;position:relative;overflow:hidden;transition:all 0.3s;" onmouseenter="this.style.borderColor=#06b6d4;this.style.transform=\'translateY(-2px)\'" onmouseleave="this.style.borderColor=\'#1e293b\';this.style.transform=\'translateY(0)\'">' +
          '<div style="position:absolute;top:0;right:0;width:60px;height:60px;background:radial-gradient(circle,rgba(6,182,212,0.08),transparent);"></div>' +
          '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">' +
            '<div style="width:32px;height:32px;border-radius:8px;background:rgba(6,182,212,0.12);display:flex;align-items:center;justify-content:center;"><svg width="16" height="16" fill="none" stroke="#06b6d4" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg></div>' +
            '<div style="color:#64748b;font-size:0.65rem;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Branch</div>' +
          '</div>' +
          '<div style="color:#67e8f9;font-size:0.95rem;font-weight:700;">' + esc(user.branch_name || 'N/A') + '</div>' +
        '</div>' +
      '</div>' +

      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px;">' +
        '<button id="clock-in-btn" style="' + clockInDisabled + 'position:relative;background:linear-gradient(135deg,#0f172a,#1e293b);border:2px solid #22c55e;border-radius:14px;padding:16px 20px;color:#fff;cursor:pointer;transition:all 0.3s;overflow:hidden;text-align:center;" onmouseenter="if(!this.style.opacity||this.style.opacity!==\'0.4\'){this.style.transform=\'translateY(-2px)\';this.style.boxShadow=\'0 6px 24px rgba(34,197,94,0.2)\';this.style.borderColor=\'#4ade80\'}" onmouseleave="this.style.transform=\'translateY(0)\';this.style.boxShadow=\'none\';this.style.borderColor=\'#22c55e\'">' +
          '<div style="position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,#22c55e,#4ade80);border-radius:2px 2px 0 0;"></div>' +
          '<div style="position:absolute;top:0;left:0;right:0;bottom:0;background:radial-gradient(circle at center,rgba(34,197,94,0.06),transparent 70%);pointer-events:none;"></div>' +
          '<div style="position:relative;z-index:1;display:flex;align-items:center;justify-content:center;gap:12px;">' +
            '<div style="width:42px;height:42px;border-radius:50%;background:rgba(34,197,94,0.12);display:flex;align-items:center;justify-content:center;border:2px solid rgba(34,197,94,0.3);flex-shrink:0;">' +
              '<svg width="22" height="22" fill="none" stroke="#4ade80" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>' +
            '</div>' +
            '<div style="text-align:left;">' +
              '<div style="font-size:1.05rem;font-weight:800;color:#4ade80;">Time In</div>' +
              '<div style="font-size:0.65rem;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Start your shift</div>' +
            '</div>' +
          '</div>' +
        '</button>' +

        '<button id="clock-out-btn" style="' + clockOutDisabled + 'position:relative;background:linear-gradient(135deg,#0f172a,#1e293b);border:2px solid #ef4444;border-radius:14px;padding:16px 20px;color:#fff;cursor:pointer;transition:all 0.3s;overflow:hidden;text-align:center;" onmouseenter="if(!this.style.opacity||this.style.opacity!==\'0.4\'){this.style.transform=\'translateY(-2px)\';this.style.boxShadow=\'0 6px 24px rgba(239,68,68,0.2)\';this.style.borderColor=\'#f87171\'}" onmouseleave="this.style.transform=\'translateY(0)\';this.style.boxShadow=\'none\';this.style.borderColor=\'#ef4444\'">' +
          '<div style="position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,#ef4444,#f87171);border-radius:2px 2px 0 0;"></div>' +
          '<div style="position:absolute;top:0;left:0;right:0;bottom:0;background:radial-gradient(circle at center,rgba(239,68,68,0.06),transparent 70%);pointer-events:none;"></div>' +
          '<div style="position:relative;z-index:1;display:flex;align-items:center;justify-content:center;gap:12px;">' +
            '<div style="width:42px;height:42px;border-radius:50%;background:rgba(239,68,68,0.12);display:flex;align-items:center;justify-content:center;border:2px solid rgba(239,68,68,0.3);flex-shrink:0;">' +
              '<svg width="22" height="22" fill="none" stroke="#f87171" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>' +
            '</div>' +
            '<div style="text-align:left;">' +
              '<div style="font-size:1.05rem;font-weight:800;color:#f87171;">Time Out</div>' +
              '<div style="font-size:0.65rem;color:#64748b;text-transform:uppercase;letter-spacing:1px;">End your shift</div>' +
            '</div>' +
          '</div>' +
        '</button>' +
      '</div>' +

      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">' +
        '<div style="background:linear-gradient(135deg,#0f172a,#1e293b);border:1px solid #1e293b;border-radius:14px;overflow:hidden;">' +
          '<div style="padding:16px 18px;border-bottom:1px solid #1e293b;display:flex;align-items:center;gap:10px;">' +
            '<div style="width:28px;height:28px;border-radius:7px;background:rgba(99,102,241,0.12);display:flex;align-items:center;justify-content:center;"><svg width="14" height="14" fill="none" stroke="#6366f1" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg></div>' +
            '<div style="color:#e2e8f0;font-size:0.85rem;font-weight:700;">Today\'s Schedule</div>' +
          '</div>' +
          '<div style="padding:16px 18px;">' +
            (todaySchedule ?
              '<div style="display:flex;align-items:center;gap:12px;">' +
                '<div style="width:4px;height:40px;border-radius:2px;background:linear-gradient(180deg,#6366f1,#a78bfa);flex-shrink:0;"></div>' +
                '<div>' +
                  '<div style="color:#a5b4fc;font-weight:600;font-size:0.9rem;margin-bottom:2px;">' + esc(todaySchedule.branch_name || user.branch_name || 'Branch') + '</div>' +
                  '<div style="color:#94a3b8;font-size:0.82rem;">' +
                    formatTime(todaySchedule.start_time || todaySchedule.shift_start) + ' — ' + formatTime(todaySchedule.end_time || todaySchedule.shift_end) +
                  '</div>' +
                '</div>' +
              '</div>'
            :
              '<div style="text-align:center;padding:20px;color:#475569;">' +
                '<svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="margin:0 auto 8px;display:block;opacity:0.2;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>' +
                '<div style="font-size:0.82rem;">No schedule for today</div>' +
              '</div>'
            ) +
          '</div>' +
        '</div>' +

        '<div style="background:linear-gradient(135deg,#0f172a,#1e293b);border:1px solid #1e293b;border-radius:14px;overflow:hidden;">' +
          '<div style="padding:16px 18px;border-bottom:1px solid #1e293b;display:flex;align-items:center;gap:10px;">' +
            '<div style="width:28px;height:28px;border-radius:7px;background:rgba(34,197,94,0.12);display:flex;align-items:center;justify-content:center;"><svg width="14" height="14" fill="none" stroke="#22c55e" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div>' +
            '<div style="color:#e2e8f0;font-size:0.85rem;font-weight:700;">Recent Attendance</div>' +
          '</div>' +
          '<div style="padding:12px 18px;">' +
            (recentRecords.length > 0 ?
              '<div style="display:flex;flex-direction:column;gap:6px;">' +
                recentRecords.map(function(r) {
                  var sColor = r.status === 'present' ? '#22c55e' : r.status === 'late' ? '#f59e0b' : r.status === 'overtime' ? '#a78bfa' : '#64748b';
                  var sBg = r.status === 'present' ? 'rgba(34,197,94,0.1)' : r.status === 'late' ? 'rgba(245,158,11,0.1)' : r.status === 'overtime' ? 'rgba(167,139,250,0.1)' : 'rgba(100,116,139,0.1)';
                  var sIcon = '';
                  if (r.status === 'present') sIcon = '<svg width="12" height="12" fill="none" stroke="#22c55e" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>';
                  else if (r.status === 'late') sIcon = '<svg width="12" height="12" fill="none" stroke="#f59e0b" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 8v4l3 3"/></svg>';
                  else if (r.status === 'overtime') sIcon = '<svg width="12" height="12" fill="none" stroke="#a78bfa" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>';
                  else sIcon = '<svg width="12" height="12" fill="none" stroke="#64748b" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M20 12H4"/></svg>';
                  var dateStr = r.clock_in ? new Date(r.clock_in).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
                  return '<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:#0d1117;border-radius:8px;border:1px solid #1e293b;">' +
                    '<div style="display:flex;align-items:center;gap:8px;">' +
                      '<div style="width:6px;height:6px;border-radius:50%;background:' + sColor + ';"></div>' +
                      '<span style="color:#94a3b8;font-size:0.82rem;">' + dateStr + '</span>' +
                    '</div>' +
                    '<div style="display:flex;align-items:center;gap:5px;padding:3px 8px;border-radius:12px;background:' + sBg + ';">' +
                      sIcon +
                      '<span style="color:' + sColor + ';font-weight:600;font-size:0.75rem;text-transform:capitalize;">' + (r.status || '') + '</span>' +
                    '</div>' +
                  '</div>';
                }).join('') +
              '</div>'
            :
              '<div style="text-align:center;padding:20px;color:#475569;">' +
                '<svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="margin:0 auto 8px;display:block;opacity:0.2;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>' +
                '<div style="font-size:0.82rem;">No records yet</div>' +
              '</div>'
            ) +
          '</div>' +
        '</div>' +
      '</div>';

    document.getElementById('clock-in-btn').addEventListener('click', function() {
      if (!isClockedIn) showPinModal('Time In', user, true);
    });
    document.getElementById('clock-out-btn').addEventListener('click', function() {
      if (todayRecord && !isClockedIn) showPinModal('Time Out', user, false);
    });

  } catch (err) {
    container.innerHTML = '<div style="text-align:center;padding:60px;color:#f87171;">' +
      '<svg width="48" height="48" fill="none" stroke="#f87171" viewBox="0 0 24 24" style="margin:0 auto 12px;display:block;opacity:0.3;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>' +
      '<div style="font-size:0.9rem;">Failed to load dashboard</div>' +
      '<div style="font-size:0.75rem;color:#64748b;margin-top:4px;">' + (err.message || 'Unknown error') + '</div>' +
    '</div>';
  }
}

function showPinModal(action, user, isClockIn) {
  var pin = '';
  var pinVisible = false;

  var accentColor = isClockIn ? '#22c55e' : '#ef4444';
  var accentBg = isClockIn ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)';

  var html =
    '<div style="text-align:center;padding:10px 0;">' +
      '<div style="width:56px;height:56px;border-radius:50%;background:' + accentBg + ';display:flex;align-items:center;justify-content:center;margin:0 auto 16px;border:2px solid ' + accentColor + '33;">' +
        '<svg width="28" height="28" fill="none" stroke="' + accentColor + '" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="' + (isClockIn ? 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' : 'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1') + '"/></svg>' +
      '</div>' +
      '<div style="color:#e2e8f0;font-size:1rem;font-weight:700;margin-bottom:4px;">' + action + '</div>' +
      '<div style="color:#64748b;margin-bottom:24px;font-size:0.85rem;">Enter your PIN to ' + action.toLowerCase() + '</div>' +
      '<div id="pin-display" style="background:#0d1117;border:2px solid #1e293b;border-radius:12px;padding:16px;margin:0 auto 24px;max-width:240px;min-height:28px;display:flex;align-items:center;justify-content:center;gap:10px;transition:border-color 0.2s;">' +
        '<span id="pin-dots" style="font-size:1.6rem;letter-spacing:8px;color:' + accentColor + ';"></span>' +
      '</div>' +
      '<div id="pin-keypad" style="display:grid;grid-template-columns:repeat(3,72px);gap:8px;justify-content:center;margin:0 auto 20px;">' +
        [1,2,3,4,5,6,7,8,9,'\uD83D\uDC41',0,'\u232B'].map(function(key) {
          var display = key;
          var cls = 'pin-key';
          var dataKey = key;
          if (key === '\uD83D\uDC41') { display = '\uD83D\uDC41'; cls = 'pin-key pin-key-eye'; dataKey = 'eye'; }
          else if (key === '\u232B') { display = '\u232B'; cls = 'pin-key pin-key-del'; dataKey = 'del'; }
          return '<button class="' + cls + '" data-key="' + dataKey + '" style="width:72px;height:56px;border-radius:10px;border:1px solid #1e293b;background:#0f172a;color:#e2e8f0;font-size:1.2rem;font-weight:600;cursor:pointer;transition:all 0.15s;display:flex;align-items:center;justify-content:center;">' + display + '</button>';
        }).join('') +
      '</div>' +
      '<div id="pin-error" style="color:#f87171;font-size:0.85rem;min-height:18px;margin-top:8px;"></div>' +
      '<button id="pin-submit-btn" style="width:100%;max-width:280px;padding:12px;border:none;border-radius:10px;background:linear-gradient(135deg,' + accentColor + ',' + accentColor + 'cc);color:#fff;font-size:1rem;font-weight:600;cursor:pointer;margin-top:12px;transition:all 0.2s;box-shadow:0 4px 15px ' + accentColor + '30;" onmouseenter="this.style.transform=\'translateY(-1px)\';this.style.boxShadow=\'0 6px 20px ' + accentColor + '40\'" onmouseleave="this.style.transform=\'translateY(0)\';this.style.boxShadow=\'0 4px 15px ' + accentColor + '30\'">' + action + '</button>' +
    '</div>';

  Modal.show(action, html, { width: '380px' });

  setTimeout(function() {
    var dotsEl = document.getElementById('pin-dots');
    var errEl = document.getElementById('pin-error');
    var submitBtn = document.getElementById('pin-submit-btn');
    var displayEl = document.getElementById('pin-display');
    var eyeBtn = document.querySelector('.pin-key-eye');

    function updateDisplay() {
      if (!dotsEl) return;
      if (pinVisible) {
        dotsEl.textContent = pin;
        if (eyeBtn) eyeBtn.textContent = '\uD83D\uDC41';
      } else {
        dotsEl.textContent = pin.split('').map(function() { return '\u2022'; }).join('');
        if (eyeBtn) eyeBtn.textContent = '\uD83D\uDE48';
      }
    }

    if (eyeBtn) {
      eyeBtn.addEventListener('click', function() {
        pinVisible = !pinVisible;
        updateDisplay();
      });
    }

    document.querySelectorAll('.pin-key').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var key = btn.getAttribute('data-key');
        if (key === 'eye') return;
        if (key === 'del') {
          pin = pin.slice(0, -1);
        } else {
          if (pin.length < 6) pin += key;
        }
        updateDisplay();
        if (errEl) errEl.textContent = '';
        if (displayEl) {
          displayEl.style.borderColor = accentColor;
          setTimeout(function() { displayEl.style.borderColor = '#1e293b'; }, 200);
        }
      });
      btn.addEventListener('mouseenter', function() { btn.style.background = '#1a2332'; btn.style.borderColor = accentColor + '44'; });
      btn.addEventListener('mouseleave', function() { btn.style.background = '#0f172a'; btn.style.borderColor = '#1e293b'; });
    });

    if (submitBtn) {
      submitBtn.addEventListener('click', async function() {
        if (pin.length < 4) {
          if (errEl) errEl.textContent = 'PIN must be at least 4 digits';
          return;
        }
        submitBtn.disabled = true;
        submitBtn.textContent = 'Processing...';
        try {
          if (isClockIn) {
            await apiPost('/attendance/clock-in', { pin: pin, branch_id: user.branch_id });
            Toast.success('Timed in successfully!');
          } else {
            await apiPost('/attendance/clock-out', { pin: pin });
            Toast.success('Timed out successfully!');
          }
          Modal.close();
          loadDashboardData(user);
        } catch (err) {
          if (errEl) errEl.textContent = err.message || 'Invalid PIN or error occurred';
          submitBtn.disabled = false;
          submitBtn.textContent = action;
        }
      });
    }
  }, 50);
}

Router.register('employee-dashboard', renderEmployeeDashboard);
