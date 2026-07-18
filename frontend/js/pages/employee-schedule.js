function renderEmployeeSchedule() {
  const app = document.getElementById('app');
  const user = Auth.getUser();

  app.innerHTML = '<div class="layout">' + renderSidebar() +
    '<div class="main-content">' + renderNavbar('My Schedule') +
    '<div class="page-content" id="page-body">' +
      '<div style="margin-bottom:20px;">' +
        '<h2 style="color:#e2e8f0;margin:0 0 4px 0;font-size:1.2rem;">Weekly Schedule</h2>' +
        '<p id="schedule-week-label" style="color:#888;margin:0;font-size:0.85rem;">Loading...</p>' +
      '</div>' +
      '<div id="schedule-container" style="display:grid;grid-template-columns:repeat(7,1fr);gap:12px;">' +
      '</div>' +
    '</div></div></div>';

  document.getElementById('logout-btn')?.addEventListener('click', (e) => {
    e.preventDefault();
    Auth.logout();
  });

  loadScheduleData();
}

async function loadScheduleData() {
  var container = document.getElementById('schedule-container');
  var weekLabel = document.getElementById('schedule-week-label');

  try {
    var schedules = await apiGet('/schedules/my');
    if (!Array.isArray(schedules)) schedules = [];

    var today = new Date();
    var dayOfWeek = today.getDay();
    var startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek);
    var endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    var opts = { month: 'short', day: 'numeric' };
    var startStr = startOfWeek.toLocaleDateString('en-US', opts);
    var endStr = endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    weekLabel.textContent = 'Week of ' + startStr + ' - ' + endStr;

    var dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    var shortDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    var weekSchedule = [];
    for (var i = 0; i < 7; i++) {
      var dayDate = new Date(startOfWeek);
      dayDate.setDate(startOfWeek.getDate() + i);
      var dateStr = dayDate.toISOString().slice(0, 10);

      var match = schedules.find(function(s) {
        if (s.day_of_week !== undefined && s.day_of_week !== null) {
          return parseInt(s.day_of_week) === i;
        }
        if (s.date) return s.date === dateStr;
        if (s.day_name) return s.day_name.toLowerCase() === dayNames[i].toLowerCase();
        return false;
      });

      weekSchedule.push({
        dayIndex: i,
        dayName: dayNames[i],
        shortName: shortDays[i],
        date: dateStr,
        dateObj: dayDate,
        schedule: match || null
      });
    }

    var todayStr = today.toISOString().slice(0, 10);

    container.innerHTML = weekSchedule.map(function(day) {
      var isToday = day.date === todayStr;
      var borderColor = isToday ? '#6366f1' : '#2a3040';
      var bg = isToday ? '#1a1a2e' : '#1a1f2e';
      var dateDisplay = day.dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      if (day.schedule) {
        var startTime = formatTime(day.schedule.start_time || day.schedule.shift_start);
        var endTime = formatTime(day.schedule.end_time || day.schedule.shift_end);
        var branch = day.schedule.branch_name || '';

        return '<div style="background:' + bg + ';border:2px solid ' + borderColor + ';border-radius:12px;padding:16px;min-height:150px;display:flex;flex-direction:column;">' +
          '<div style="text-align:center;margin-bottom:12px;">' +
            '<div style="color:' + (isToday ? '#818cf8' : '#60a5fa') + ';font-weight:700;font-size:1rem;">' + day.shortName + '</div>' +
            '<div style="color:#888;font-size:0.75rem;">' + dateDisplay + '</div>' +
            (isToday ? '<div style="margin-top:4px;display:inline-block;background:#6366f1;color:#fff;padding:1px 8px;border-radius:10px;font-size:0.65rem;font-weight:600;">TODAY</div>' : '') +
          '</div>' +
          '<div style="flex:1;display:flex;flex-direction:column;justify-content:center;align-items:center;">' +
            '<div style="background:#166534;border-radius:8px;padding:10px 12px;width:100%;text-align:center;">' +
              '<div style="color:#4ade80;font-size:0.95rem;font-weight:600;">' + startTime + '</div>' +
              '<div style="color:#888;font-size:0.7rem;margin:2px 0;">to</div>' +
              '<div style="color:#4ade80;font-size:0.95rem;font-weight:600;">' + endTime + '</div>' +
            '</div>' +
            (branch ? '<div style="color:#aaa;font-size:0.78rem;margin-top:8px;text-align:center;">' + branch + '</div>' : '') +
          '</div>' +
        '</div>';
      } else {
        return '<div style="background:' + bg + ';border:2px solid ' + borderColor + ';border-radius:12px;padding:16px;min-height:150px;display:flex;flex-direction:column;">' +
          '<div style="text-align:center;margin-bottom:12px;">' +
            '<div style="color:' + (isToday ? '#818cf8' : '#60a5fa') + ';font-weight:700;font-size:1rem;">' + day.shortName + '</div>' +
            '<div style="color:#888;font-size:0.75rem;">' + dateDisplay + '</div>' +
            (isToday ? '<div style="margin-top:4px;display:inline-block;background:#6366f1;color:#fff;padding:1px 8px;border-radius:10px;font-size:0.65rem;font-weight:600;">TODAY</div>' : '') +
          '</div>' +
          '<div style="flex:1;display:flex;flex-direction:column;justify-content:center;align-items:center;">' +
            '<div style="color:#555;font-size:0.9rem;font-style:italic;">Day Off</div>' +
            '<div style="color:#444;font-size:1.5rem;margin-top:4px;">&#127769;</div>' +
          '</div>' +
        '</div>';
      }
    }).join('');

  } catch (err) {
    container.innerHTML = '<div style="padding:40px;text-align:center;color:#f87171;grid-column:1/-1;">Failed to load schedule: ' + (err.message || 'Unknown error') + '</div>';
  }
}

Router.register('my-schedule', renderEmployeeSchedule);
