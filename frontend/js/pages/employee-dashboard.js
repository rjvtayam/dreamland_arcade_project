function renderEmployeeDashboard() {
  const app = document.getElementById('app');
  const user = Auth.getUser();

  app.innerHTML = '<div class="layout">' + renderSidebar() +
    '<div class="main-content">' + renderNavbar('Dashboard') +
    '<div class="page-content" id="page-body">' +
      '<div id="dashboard-loading" style="text-align:center;padding:60px;color:#888;">Loading...</div>' +
    '</div></div></div>';

  document.getElementById('logout-btn')?.addEventListener('click', (e) => {
    e.preventDefault();
    Auth.logout();
  });

  loadDashboardData(user);
}

async function loadDashboardData(user) {
  const container = document.getElementById('page-body');
  try {
    const [attendanceRes, scheduleRes] = await Promise.all([
      apiGet('/attendance/my'),
      apiGet('/schedules/my')
    ]);

    const records = Array.isArray(attendanceRes) ? attendanceRes : [];
    const schedules = Array.isArray(scheduleRes) ? scheduleRes : [];

    const today = new Date().toISOString().slice(0, 10);
    const todayRecord = records.find(r => r.clock_in && r.clock_in.slice(0, 10) === today);
    const isClockedIn = todayRecord && !todayRecord.clock_out;

    let hoursWorked = '0h 0m';
    if (todayRecord && todayRecord.clock_out) {
      const diff = new Date(todayRecord.clock_out) - new Date(todayRecord.clock_in);
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      hoursWorked = h + 'h ' + m + 'm';
    } else if (todayRecord && todayRecord.clock_in) {
      const diff = new Date() - new Date(todayRecord.clock_in);
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      hoursWorked = h + 'h ' + m + 'm (running)';
    }

    const todayDay = new Date().getDay();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todaySchedule = schedules.find(s => {
      return s.day_name === dayNames[todayDay];
    });

    const recentRecords = records.slice(0, 5);

    container.innerHTML =
      '<div style="margin-bottom:24px;">' +
        '<h2 style="color:#fff;margin:0 0 4px 0;font-size:1.4rem;">Welcome back, ' + (user.first_name || user.username) + '!</h2>' +
        '<p style="color:#aaa;margin:0;font-size:0.9rem;">' + new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) + '</p>' +
      '</div>' +

      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;margin-bottom:24px;">' +
        '<div style="background:#1a1f2e;border:1px solid #2a3040;border-radius:12px;padding:20px;">' +
          '<div style="color:#888;font-size:0.8rem;text-transform:uppercase;margin-bottom:8px;">Today\'s Status</div>' +
          '<div style="font-size:1.3rem;font-weight:700;color:' + (isClockedIn ? '#4ade80' : (todayRecord ? '#60a5fa' : '#f87171')) + ';">' +
            (isClockedIn ? 'Timed In' : (todayRecord ? 'Timed Out' : 'Not Timed In')) +
          '</div>' +
        '</div>' +
        '<div style="background:#1a1f2e;border:1px solid #2a3040;border-radius:12px;padding:20px;">' +
          '<div style="color:#888;font-size:0.8rem;text-transform:uppercase;margin-bottom:8px;">Hours Worked Today</div>' +
          '<div style="font-size:1.3rem;font-weight:700;color:#60a5fa;">' + hoursWorked + '</div>' +
        '</div>' +
        '<div style="background:#1a1f2e;border:1px solid #2a3040;border-radius:12px;padding:20px;">' +
          '<div style="color:#888;font-size:0.8rem;text-transform:uppercase;margin-bottom:8px;">Branch</div>' +
          '<div style="font-size:1.1rem;font-weight:600;color:#e2e8f0;">' + (user.branch_name || 'N/A') + '</div>' +
        '</div>' +
      '</div>' +

      '<div style="display:flex;gap:16px;margin-bottom:24px;flex-wrap:wrap;">' +
        '<button id="clock-in-btn" style="flex:1;min-width:200px;padding:20px;background:#166534;border:2px solid #22c55e;border-radius:12px;color:#fff;font-size:1.2rem;font-weight:700;cursor:pointer;transition:all 0.2s;">' +
          '<div style="font-size:2rem;margin-bottom:8px;">&#9201;</div>Time In' +
        '</button>' +
        '<button id="clock-out-btn" style="flex:1;min-width:200px;padding:20px;background:#7f1d1d;border:2px solid #ef4444;border-radius:12px;color:#fff;font-size:1.2rem;font-weight:700;cursor:pointer;transition:all 0.2s;">' +
          '<div style="font-size:2rem;margin-bottom:8px;">&#9202;</div>Time Out' +
        '</button>' +
      '</div>' +

      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">' +
        '<div>' +
          '<h3 style="color:#e2e8f0;margin:0 0 12px 0;font-size:1rem;">Today\'s Schedule</h3>' +
          (todaySchedule ?
            '<div style="background:#1a1f2e;border:1px solid #2a3040;border-radius:12px;padding:16px;">' +
              '<div style="color:#60a5fa;font-weight:600;margin-bottom:4px;">' +
                (todaySchedule.branch_name || user.branch_name || 'Branch') +
              '</div>' +
              '<div style="color:#e2e8f0;font-size:0.95rem;">' +
                formatTime(todaySchedule.start_time || todaySchedule.shift_start) + ' - ' + formatTime(todaySchedule.end_time || todaySchedule.shift_end) +
              '</div>' +
            '</div>'
          :
            '<div style="background:#1a1f2e;border:1px solid #2a3040;border-radius:12px;padding:16px;color:#666;">No schedule for today</div>'
          ) +
        '</div>' +
        '<div>' +
          '<h3 style="color:#e2e8f0;margin:0 0 12px 0;font-size:1rem;">Recent Attendance</h3>' +
          (recentRecords.length > 0 ?
            '<div style="display:flex;flex-direction:column;gap:8px;">' +
              recentRecords.map(function(r) {
                var statusColor = r.status === 'present' ? '#4ade80' : r.status === 'late' ? '#facc15' : r.status === 'overtime' ? '#c084fc' : '#888';
                var dateStr = r.clock_in ? new Date(r.clock_in).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
                return '<div style="background:#1a1f2e;border:1px solid #2a3040;border-radius:8px;padding:10px 14px;display:flex;justify-content:space-between;align-items:center;">' +
                  '<span style="color:#ccc;font-size:0.85rem;">' + dateStr + '</span>' +
                  '<span style="color:' + statusColor + ';font-weight:600;font-size:0.85rem;text-transform:capitalize;">' + (r.status || '') + '</span>' +
                '</div>';
              }).join('') +
            '</div>'
          :
            '<div style="background:#1a1f2e;border:1px solid #2a3040;border-radius:12px;padding:16px;color:#666;">No records yet</div>'
          ) +
        '</div>' +
      '</div>';

    document.getElementById('clock-in-btn').addEventListener('click', function() {
      showPinModal('Time In', user, true);
    });
    document.getElementById('clock-out-btn').addEventListener('click', function() {
      showPinModal('Time Out', user, false);
    });

    document.querySelectorAll('#clock-in-btn, #clock-out-btn').forEach(function(btn) {
      btn.addEventListener('mouseenter', function() { btn.style.transform = 'translateY(-2px)'; });
      btn.addEventListener('mouseleave', function() { btn.style.transform = 'none'; });
    });

  } catch (err) {
    container.innerHTML = '<div style="color:#f87171;padding:40px;text-align:center;">Failed to load dashboard: ' + (err.message || 'Unknown error') + '</div>';
  }
}

function showPinModal(action, user, isClockIn) {
  var pin = '';
  var pinVisible = false;

  var html =
    '<div style="text-align:center;padding:10px 0;">' +
      '<div style="color:#aaa;margin-bottom:20px;font-size:0.95rem;">Enter your PIN to ' + action.toLowerCase() + '</div>' +
      '<div id="pin-display" style="background:#0d1117;border:2px solid #30363d;border-radius:10px;padding:14px;margin:0 auto 24px;max-width:240px;min-height:24px;display:flex;align-items:center;justify-content:center;gap:10px;">' +
        '<span id="pin-dots" style="font-size:1.6rem;letter-spacing:8px;color:#60a5fa;"></span>' +
      '</div>' +
      '<div id="pin-keypad" style="display:grid;grid-template-columns:repeat(3,70px);gap:8px;justify-content:center;margin:0 auto 20px;">' +
        [1,2,3,4,5,6,7,8,9,'\uD83D\uDC41',0,'\u232B'].map(function(key) {
          var display = key;
          var cls = 'pin-key';
          var dataKey = key;
          if (key === '\uD83D\uDC41') { display = '\uD83D\uDC41'; cls = 'pin-key pin-key-eye'; dataKey = 'eye'; }
          else if (key === '\u232B') { display = '\u232B'; cls = 'pin-key pin-key-del'; dataKey = 'del'; }
          return '<button class="' + cls + '" data-key="' + dataKey + '" style="width:70px;height:56px;border-radius:10px;border:1px solid #30363d;background:#161b22;color:#e2e8f0;font-size:1.2rem;font-weight:600;cursor:pointer;transition:all 0.15s;display:flex;align-items:center;justify-content:center;">' + display + '</button>';
        }).join('') +
      '</div>' +
      '<div id="pin-error" style="color:#f87171;font-size:0.85rem;min-height:18px;margin-top:8px;"></div>' +
      '<button id="pin-submit-btn" style="width:100%;max-width:280px;padding:12px;border:none;border-radius:8px;background:' + (isClockIn ? '#22c55e' : '#ef4444') + ';color:#fff;font-size:1rem;font-weight:600;cursor:pointer;margin-top:12px;">' + action + '</button>' +
    '</div>';

  Modal.show(action, html);

  setTimeout(function() {
    var dotsEl = document.getElementById('pin-dots');
    var errEl = document.getElementById('pin-error');
    var submitBtn = document.getElementById('pin-submit-btn');
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
      });
      btn.addEventListener('mouseenter', function() { btn.style.background = '#1f2937'; });
      btn.addEventListener('mouseleave', function() { btn.style.background = '#161b22'; });
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
