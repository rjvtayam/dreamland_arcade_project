function renderAdminEvents() {
  var app = document.getElementById('app');
  var holidays = [];
  var customEvents = [];
  var activeTab = 'holidays';

  var staticEvents = {
    0: [
      { name: 'New Year\'s Day', date: 'January 1', icon: '🎆', desc: 'Celebration of the new year. Regular holiday.' },
      { name: 'Black Nazarene Feast', date: 'January 9', icon: '✝️', desc: 'Annual procession of the Black Nazarene.' }
    ],
    1: [
      { name: 'Chinese New Year', date: 'January 29 (2025)', icon: '🧧', desc: 'Lunar New Year celebration.' },
      { name: 'Valentine\'s Day', date: 'February 14', icon: '💝', desc: 'Day of love. Promotional event for couples.' },
      { name: 'People Power Anniversary', date: 'February 25', icon: '✊', desc: 'EDSA People Power Revolution anniversary.' }
    ],
    2: [
      { name: 'Women\'s Month', date: 'March 1-31', icon: '👩', desc: 'National Women\'s Month celebration.' },
      { name: 'Holy Week', date: 'March 28 - April 3', icon: '⛪', desc: 'Maundy Thursday to Easter Sunday.' }
    ],
    3: [
      { name: 'Araw ng Kagitingan', date: 'April 9', icon: '🎖️', desc: 'Day of Valor.' },
      { name: 'Easter Sunday', date: 'April 5 (2025)', icon: '🐣', desc: 'Resurrection of Jesus Christ.' },
      { name: 'Earth Day', date: 'April 22', icon: '🌍', desc: 'Environmental awareness.' }
    ],
    4: [
      { name: 'Labor Day', date: 'May 1', icon: '👷', desc: 'Regular holiday honoring workers.' },
      { name: 'Mother\'s Day', date: 'Second Sunday of May', icon: '👩‍👧', desc: 'Special day for mothers.' },
      { name: 'Flores de Mayo', date: 'May 1-31', icon: '🌸', desc: 'Flower festival.' }
    ],
    5: [
      { name: 'Independence Day', date: 'June 12', icon: '🇵🇭', desc: 'Philippine Independence Day.' },
      { name: 'Father\'s Day', date: 'Third Sunday of June', icon: '👨‍👦', desc: 'Special day for fathers.' }
    ],
    6: [
      { name: 'PH-Spanish Friendship Day', date: 'June 30', icon: '🤝', desc: 'PH-Spain historical ties.' },
      { name: 'Ninoy Aquino Day', date: 'August 21', icon: '🕊️', desc: 'Commemoration of Benigno Aquino Jr.' }
    ],
    7: [
      { name: 'National Heroes Day', date: 'Last Monday of August', icon: '🦸', desc: 'Honors national heroes.' },
      { name: 'Buwan ng Wika', date: 'August 1-31', icon: '🇵🇭', desc: 'Language Month.' }
    ],
    8: [
      { name: 'World Tourism Day', date: 'September 27', icon: '✈️', desc: 'Promotes tourism.' },
      { name: 'Mid-Autumn Festival', date: 'Sept/Oct', icon: '🥮', desc: 'Chinese harvest moon festival.' }
    ],
    9: [
      { name: 'World Teachers\' Day', date: 'October 5', icon: '📚', desc: 'Honors educators.' },
      { name: 'Halloween', date: 'October 31', icon: '🎃', desc: 'Costume party & trick-or-treat.' }
    ],
    10: [
      { name: 'All Saints\' Day', date: 'November 1', icon: '🕯️', desc: 'Remembrance for departed saints.' },
      { name: 'All Souls\' Day', date: 'November 2', icon: '🙏', desc: 'Day of prayer for the departed.' },
      { name: 'Bonifacio Day', date: 'November 30', icon: '⚔️', desc: 'Birthday of Andres Bonifacio.' }
    ],
    11: [
      { name: 'Christmas Season', date: 'December 1-25', icon: '🎄', desc: 'Simbang Gabi, Noche Buena.' },
      { name: 'Christmas Day', date: 'December 25', icon: '🎁', desc: 'Regular holiday.' },
      { name: 'Rizal Day', date: 'December 30', icon: '📖', desc: 'Jose Rizal execution anniversary.' },
      { name: 'New Year\'s Eve', date: 'December 31', icon: '🎆', desc: 'Grand finale celebration.' }
    ]
  };

  var emojiOptions = ['🎉','🎊','🎵','🎤','🎮','🕹️','🏆','🎯','🎪','🎭','🎨','🎸','🎹','🎺','🎻','🎬','🎶','💎','🔥','⚡','💫','🌟','⭐','🎈','🎁','🎂','🍰','🍕','🍔','🥤','☕','🧋','🍬','🍭','🍩','🎡','🎢','🎠','🏟️','🎲','♟️','🎰','🎳','⚽','🏀','🏈','🎾','🏐','🎱','🏓','🏸','🥊','🥋','⛳','🏅','🥇','🥈','🥉','🎖️','🏵️','🎗️','🎫','🎟️'];

  async function loadData() {
    try {
      var results = await Promise.all([apiGet('/holidays'), apiGet('/special-events')]);
      holidays = Array.isArray(results[0]) ? results[0] : [];
      customEvents = Array.isArray(results[1]) ? results[1] : [];
      render();
    } catch (e) {
      Toast.error('Failed to load events');
    }
  }

  function render() {
    var months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    var monthColors = ['#6366f1','#22c55e','#f59e0b','#ef4444','#a855f7','#3b82f6','#ec4899','#14b8a6','#f97316','#8b5cf6','#06b6d4','#6366f1'];

    var tabBtns = '<div style="display:flex;gap:0;background:#1a1f2e;border:1px solid #2a3040;border-radius:10px;overflow:hidden;width:fit-content;">' +
      '<button class="event-tab-btn" data-tab="holidays" style="padding:10px 28px;border:none;background:' + (activeTab === 'holidays' ? '#6366f1' : 'transparent') + ';color:' + (activeTab === 'holidays' ? '#fff' : '#94a3b8') + ';font-weight:600;font-size:0.85rem;cursor:pointer;">📅 Holidays</button>' +
      '<button class="event-tab-btn" data-tab="special" style="padding:10px 28px;border:none;background:' + (activeTab === 'special' ? '#6366f1' : 'transparent') + ';color:' + (activeTab === 'special' ? '#fff' : '#94a3b8') + ';font-weight:600;font-size:0.85rem;cursor:pointer;">🎉 Special Events</button>' +
    '</div>';

    var content = '';
    if (activeTab === 'holidays') content = buildHolidaysTab(months, monthColors);
    else content = buildSpecialTab(months, monthColors);

    app.innerHTML = '<div class="layout">' + renderSidebar() +
      '<div class="main-content">' + renderNavbar('Events Management') +
      '<div class="page-content" id="page-body">' +
      tabBtns +
      '<div id="events-content" style="margin-top:20px;">' + content + '</div>' +
      '</div></div></div>';

    document.querySelectorAll('.event-tab-btn').forEach(function(btn) {
      btn.addEventListener('click', function() { activeTab = btn.dataset.tab; render(); });
    });
    document.getElementById('logout-btn')?.addEventListener('click', function(e) { e.preventDefault(); Auth.logout(); });
  }

  function buildMonthCard(monthIndex, monthName, color, contentItems, type) {
    var today = new Date();
    var isCurrent = today.getMonth() === monthIndex;
    var borderColor = isCurrent ? color + '66' : '#2a3040';
    var shadow = isCurrent ? 'box-shadow:0 0 12px ' + color + '15;' : '';

    var body = '<div style="padding:10px 12px;flex:1;display:flex;flex-direction:column;justify-content:flex-start;">';
    if (contentItems.length === 0) {
      body += '<div style="color:#475569;font-size:0.75rem;text-align:center;padding:8px 0;">No ' + type + '</div>';
    } else {
      contentItems.forEach(function(item) { body += item; });
    }
    body += '</div>';

    return '<div style="background:#1a1f2e;border:1px solid ' + borderColor + ';border-radius:10px;overflow:hidden;' + shadow + ';display:flex;flex-direction:column;flex:1 1 0;min-width:0;">' +
      '<div style="background:' + color + '22;padding:8px 12px;display:flex;align-items:center;border-bottom:1px solid ' + color + '33;flex-shrink:0;">' +
        '<span style="color:' + color + ';font-weight:700;font-size:0.85rem;">' + monthName + '</span>' +
        (isCurrent ? '<span style="background:' + color + ';color:#fff;padding:1px 5px;border-radius:6px;font-size:0.55rem;font-weight:600;margin-left:6px;">NOW</span>' : '') +
        '<span style="margin-left:auto;background:' + color + '33;color:' + color + ';padding:1px 6px;border-radius:6px;font-size:0.6rem;font-weight:600;">' + contentItems.length + '</span>' +
      '</div>' + body + '</div>';
  }

  function renderRow(monthIndices, months, monthColors, itemsByMonth, type) {
    var row = '<div style="display:flex;gap:12px;margin-bottom:12px;align-items:stretch;width:100%;max-width:100%;">';
    monthIndices.forEach(function(m) {
      row += buildMonthCard(m, months[m], monthColors[m], itemsByMonth[m], type);
    });
    row += '</div>';
    return row;
  }

  function buildHolidaysTab(months, monthColors) {
    var holidayByMonth = {};
    for (var i = 0; i < 12; i++) holidayByMonth[i] = [];
    holidays.forEach(function(h) {
      var d = new Date(h.date);
      holidayByMonth[d.getMonth()].push(h);
    });

    var dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    var renderedByMonth = {};
    for (var m = 0; m < 12; m++) {
      renderedByMonth[m] = holidayByMonth[m].map(function(h) {
        var d = new Date(h.date);
        var color = monthColors[m];
        return '<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #1e2736;">' +
          '<div style="width:36px;height:36px;border-radius:8px;background:' + color + '15;border:1px solid ' + color + '33;display:flex;flex-direction:column;align-items:center;justify-content:center;flex-shrink:0;">' +
            '<div style="color:' + color + ';font-size:0.95rem;font-weight:800;line-height:1;">' + d.getDate() + '</div>' +
            '<div style="color:' + color + ';font-size:0.45rem;font-weight:600;">' + dayNames[d.getDay()] + '</div>' +
          '</div>' +
          '<div style="flex:1;min-width:0;">' +
            '<div style="color:#e2e8f0;font-weight:600;font-size:0.8rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + escE(h.name) + '</div>' +
            '<div style="display:flex;gap:6px;align-items:center;margin-top:1px;">' +
              (h.is_recurring ? '<span style="color:#22c55e;font-size:0.55rem;">Recurring</span>' : '') +
              '<span style="color:#666;font-size:0.55rem;">All Branches</span>' +
            '</div>' +
          '</div>' +
          '<div style="display:flex;gap:3px;flex-shrink:0;">' +
            '<button onclick="window.__editH(' + h.id + ')" style="padding:3px 7px;border:1px solid #30363d;border-radius:5px;background:transparent;color:#94a3b8;font-size:0.6rem;cursor:pointer;">Edit</button>' +
            '<button onclick="window.__delH(' + h.id + ')" style="padding:3px 7px;border:1px solid #ef4444;border-radius:5px;background:transparent;color:#fca5a5;font-size:0.6rem;cursor:pointer;">Del</button>' +
          '</div></div>';
      });
    }

    var header = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">' +
      '<div><h2 style="color:#e2e8f0;margin:0;font-size:1.15rem;">' + holidays.length + ' Philippine Holidays</h2>' +
      '<p style="color:#94a3b8;margin:4px 0 0;font-size:0.78rem;">Regular Holidays & Special Non-Working Days</p></div>' +
      '<button id="add-holiday-btn" style="background:#6366f1;color:#fff;border:none;border-radius:8px;padding:10px 24px;cursor:pointer;font-weight:600;font-size:0.85rem;">+ Add Holiday</button>' +
    '</div>';

    var rows = header;
    rows += renderRow([0,1,2], months, monthColors, renderedByMonth, 'holidays');
    rows += renderRow([3,4,5], months, monthColors, renderedByMonth, 'holidays');
    rows += renderRow([6,7,8], months, monthColors, renderedByMonth, 'holidays');
    rows += renderRow([9,10,11], months, monthColors, renderedByMonth, 'holidays');

    setTimeout(function() {
      window.__editH = function(id) { var h = holidays.find(function(x) { return String(x.id) === String(id); }); if (h) openHolidayModal(h); };
      window.__delH = async function(id) { if (!await confirmAsync('Delete this holiday?')) return; try { await apiDelete('/holidays/' + id); Toast.success('Deleted'); loadData(); } catch (err) { Toast.error(err.message); } };
      var addBtn = document.getElementById('add-holiday-btn');
      if (addBtn) addBtn.addEventListener('click', function() { openHolidayModal(null); });
    }, 10);

    return rows;
  }

  function buildSpecialTab(months, monthColors) {
    var allByMonth = {};
    for (var i = 0; i < 12; i++) allByMonth[i] = [];

    for (var m = 0; m < 12; m++) {
      (staticEvents[m] || []).forEach(function(ev) {
        allByMonth[m].push({ name: ev.name, date: ev.date, icon: ev.icon, desc: ev.desc, isCustom: false });
      });
    }

    customEvents.forEach(function(ev) {
      var d = new Date(ev.date);
      var m = d.getMonth();
      var monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
      allByMonth[m].push({ id: ev.id, name: ev.name, date: monthNames[m] + ' ' + d.getDate() + ', ' + d.getFullYear(), icon: ev.icon || '🎉', desc: ev.description || '', isCustom: true });
    });

    var totalCustom = customEvents.length;
    var totalAll = 0;
    for (var m = 0; m < 12; m++) totalAll += allByMonth[m].length;

    var renderedByMonth = {};
    for (var m = 0; m < 12; m++) {
      renderedByMonth[m] = allByMonth[m].map(function(ev) {
        var color = monthColors[m];
        var borderLeft = ev.isCustom ? 'border-left:3px solid #22c55e;padding-left:6px;' : '';
        var html = '<div style="display:flex;align-items:flex-start;gap:7px;padding:5px 0;border-bottom:1px solid #1e2736;' + borderLeft + '">' +
          '<div style="font-size:1.1rem;line-height:1;flex-shrink:0;">' + escE(ev.icon) + '</div>' +
          '<div style="flex:1;min-width:0;overflow:hidden;">' +
            '<div style="color:#e2e8f0;font-weight:600;font-size:0.78rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + escE(ev.name) + (ev.isCustom ? ' <span style="color:#22c55e;font-size:0.5rem;background:#22c55e15;padding:1px 4px;border-radius:3px;">CUSTOM</span>' : '') + '</div>' +
            '<div style="color:' + color + ';font-size:0.6rem;margin-top:1px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + escE(ev.date) + '</div>' +
            (ev.desc ? '<div style="color:#94a3b8;font-size:0.65rem;margin-top:1px;line-height:1.3;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + escE(ev.desc) + '</div>' : '') +
          '</div>';

        if (ev.isCustom) {
          html += '<div style="display:flex;gap:3px;flex-shrink:0;">' +
            '<button onclick="window.__editSE(' + ev.id + ')" style="padding:3px 7px;border:1px solid #30363d;border-radius:5px;background:transparent;color:#94a3b8;font-size:0.6rem;cursor:pointer;">Edit</button>' +
            '<button onclick="window.__delSE(' + ev.id + ')" style="padding:3px 7px;border:1px solid #ef4444;border-radius:5px;background:transparent;color:#fca5a5;font-size:0.6rem;cursor:pointer;">Del</button>' +
          '</div>';
        }
        html += '</div>';
        return html;
      });
    }

    var header = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;overflow:hidden;">' +
      '<div style="min-width:0;flex:1;"><h2 style="color:#e2e8f0;margin:0;font-size:1.15rem;">' + totalAll + ' Special Events & Occasions</h2>' +
      '<p style="color:#94a3b8;margin:4px 0 0;font-size:0.78rem;">Philippine holidays, celebrations & custom events (' + totalCustom + ' custom)</p></div>' +
      '<button id="add-event-btn" style="background:#22c55e;color:#fff;border:none;border-radius:8px;padding:10px 24px;cursor:pointer;font-weight:600;font-size:0.85rem;flex-shrink:0;">+ Add Event</button>' +
    '</div>';

    var rows = header;
    rows += renderRow([0,1,2], months, monthColors, renderedByMonth, 'events');
    rows += renderRow([3,4,5], months, monthColors, renderedByMonth, 'events');
    rows += renderRow([6,7,8], months, monthColors, renderedByMonth, 'events');
    rows += renderRow([9,10,11], months, monthColors, renderedByMonth, 'events');

    setTimeout(function() {
      window.__editSE = function(id) {
        var ev = customEvents.find(function(x) { return String(x.id) === String(id); });
        if (ev) openSpecialEventModal(ev);
      };
      window.__delSE = async function(id) {
        if (!await confirmAsync('Delete this custom event?')) return;
        try { await apiDelete('/special-events/' + id); Toast.success('Deleted'); loadData(); } catch (err) { Toast.error(err.message); }
      };
      var addBtn = document.getElementById('add-event-btn');
      if (addBtn) addBtn.addEventListener('click', function() { openSpecialEventModal(null); });
    }, 10);

    return rows;
  }

  function openHolidayModal(holiday) {
    var isEdit = !!holiday;
    var html = '<form id="holiday-form" style="display:flex;flex-direction:column;gap:12px;">' +
      '<div><label style="color:#94a3b8;font-size:0.8rem;display:block;margin-bottom:4px;">Holiday Name</label>' +
      '<input name="name" style="width:100%;background:#0d1117;border:1px solid #30363d;border-radius:6px;padding:8px;color:#e2e8f0;" value="' + (isEdit ? escE(holiday.name) : '') + '" required placeholder="e.g. Independence Day"></div>' +
      '<div><label style="color:#94a3b8;font-size:0.8rem;display:block;margin-bottom:4px;">Date</label>' +
      '<input type="date" name="date" style="width:100%;background:#0d1117;border:1px solid #30363d;border-radius:6px;padding:8px;color:#e2e8f0;" value="' + (isEdit ? holiday.date : '') + '" required></div>' +
      '<div><label style="color:#94a3b8;font-size:0.8rem;display:block;margin-bottom:4px;">Branch (optional)</label>' +
      '<select name="branch_id" style="width:100%;background:#0d1117;border:1px solid #30363d;border-radius:6px;padding:8px;color:#e2e8f0;">' +
      '<option value="">All Branches</option></select></div>' +
      '<div><label style="display:flex;align-items:center;gap:8px;color:#94a3b8;font-size:0.85rem;cursor:pointer;">' +
      '<input type="checkbox" name="is_recurring"' + (isEdit && holiday.is_recurring ? ' checked' : '') + '> Recurring (every year)</label></div>' +
      '<div style="display:flex;gap:10px;justify-content:flex-end;">' +
        '<button type="button" onclick="Modal.close()" style="padding:8px 20px;border:1px solid #30363d;border-radius:6px;background:transparent;color:#94a3b8;cursor:pointer;">Cancel</button>' +
        '<button type="submit" style="padding:8px 20px;border:none;border-radius:6px;background:#6366f1;color:#fff;font-weight:600;cursor:pointer;">' + (isEdit ? 'Update' : 'Add') + '</button>' +
      '</div></form>';

    Modal.show(isEdit ? 'Edit Holiday' : 'Add Holiday', html, { width: '420px' });

    document.getElementById('holiday-form')?.addEventListener('submit', async function(e) {
      e.preventDefault();
      var f = e.target;
      var data = { name: f.name.value, date: f.date.value, branch_id: f.branch_id.value || null, is_recurring: f.is_recurring.checked };
      try {
        if (isEdit) { await apiPut('/holidays/' + holiday.id, data); Toast.success('Updated'); }
        else { await apiPost('/holidays', data); Toast.success('Added'); }
        Modal.close(); loadData();
      } catch (err) { Toast.error(err.message); }
    });
  }

  function openSpecialEventModal(event) {
    var isEdit = !!event;
    var dateVal = '';
    if (isEdit && event.date) {
      var d = new Date(event.date);
      if (!isNaN(d.getTime())) dateVal = d.toISOString().split('T')[0];
    }

    var selectedIcon = (isEdit ? (event.icon || '🎉') : '🎉');

    var gridHtml = '<div id="emoji-grid" style="display:grid;grid-template-columns:repeat(10,1fr);gap:4px;max-height:160px;overflow-y:auto;padding:4px;border:1px solid #30363d;border-radius:8px;background:#0d1117;">';
    emojiOptions.forEach(function(em) {
      var isActive = em === selectedIcon;
      gridHtml += '<div class="emoji-pick" data-em="' + escE(em) + '" style="width:100%;aspect-ratio:1;display:flex;align-items:center;justify-content:center;font-size:1.1rem;border-radius:6px;cursor:pointer;border:1px solid ' + (isActive ? '#6366f1' : 'transparent') + ';background:' + (isActive ? '#6366f122' : 'transparent') + ';">' + em + '</div>';
    });
    gridHtml += '</div>';

    var html = '<form id="event-form" style="display:flex;flex-direction:column;gap:14px;">' +
      '<div><label style="color:#94a3b8;font-size:0.8rem;display:block;margin-bottom:4px;">Event Name</label>' +
      '<input name="name" style="width:100%;background:#0d1117;border:1px solid #30363d;border-radius:6px;padding:8px;color:#e2e8f0;" value="' + (isEdit ? escE(event.name) : '') + '" required placeholder="e.g. Summer Arcade Fest"></div>' +
      '<div><label style="color:#94a3b8;font-size:0.8rem;display:block;margin-bottom:4px;">Date</label>' +
      '<input type="date" name="date" style="width:100%;background:#0d1117;border:1px solid #30363d;border-radius:6px;padding:8px;color:#e2e8f0;" value="' + dateVal + '" required></div>' +
      '<div><label style="color:#94a3b8;font-size:0.8rem;display:block;margin-bottom:4px;">Description (optional)</label>' +
      '<textarea name="description" rows="2" style="width:100%;background:#0d1117;border:1px solid #30363d;border-radius:6px;padding:8px;color:#e2e8f0;resize:vertical;" placeholder="Details...">' + (isEdit ? escE(event.description || '') : '') + '</textarea></div>' +
      '<div><label style="color:#94a3b8;font-size:0.8rem;display:block;margin-bottom:4px;">Icon</label>' +
      '<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">' +
        '<span id="selected-icon-preview" style="font-size:1.8rem;">' + escE(selectedIcon) + '</span>' +
        '<span style="color:#666;font-size:0.75rem;">Click an icon below</span>' +
      '</div>' + gridHtml + '</div>' +
      '<input type="hidden" name="icon" value="' + escE(selectedIcon) + '">' +
      '<div><label style="color:#94a3b8;font-size:0.8rem;display:block;margin-bottom:4px;">Branch (optional)</label>' +
      '<select name="branch_id" style="width:100%;background:#0d1117;border:1px solid #30363d;border-radius:6px;padding:8px;color:#e2e8f0;">' +
      '<option value="">All Branches</option></select></div>' +
      '<div style="display:flex;gap:10px;justify-content:flex-end;">' +
        '<button type="button" onclick="Modal.close()" style="padding:8px 20px;border:1px solid #30363d;border-radius:6px;background:transparent;color:#94a3b8;cursor:pointer;">Cancel</button>' +
        '<button type="submit" style="padding:8px 20px;border:none;border-radius:6px;background:#22c55e;color:#fff;font-weight:600;cursor:pointer;">' + (isEdit ? 'Update' : 'Add Event') + '</button>' +
      '</div></form>';

    Modal.show(isEdit ? 'Edit Event' : 'Add Special Event', html, { width: '480px' });

    document.querySelectorAll('.emoji-pick').forEach(function(el) {
      el.addEventListener('click', function() {
        selectedIcon = el.dataset.em;
        document.querySelectorAll('.emoji-pick').forEach(function(x) { x.style.borderColor = 'transparent'; x.style.background = 'transparent'; });
        el.style.borderColor = '#6366f1';
        el.style.background = '#6366f122';
        var preview = document.getElementById('selected-icon-preview');
        if (preview) preview.textContent = selectedIcon;
        var iconInput = document.querySelector('#event-form input[name="icon"]');
        if (iconInput) iconInput.value = selectedIcon;
      });
    });

    document.getElementById('event-form')?.addEventListener('submit', async function(e) {
      e.preventDefault();
      var f = e.target;
      var data = { name: f.name.value, date: f.date.value, description: f.description.value || null, icon: f.icon.value, branch_id: f.branch_id.value || null };
      try {
        if (isEdit) { await apiPut('/special-events/' + event.id, data); Toast.success('Updated'); }
        else { await apiPost('/special-events', data); Toast.success('Event added'); }
        Modal.close(); loadData();
      } catch (err) { Toast.error(err.message); }
    });
  }

  function escE(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  loadData();
}

Router.register('events', renderAdminEvents);
