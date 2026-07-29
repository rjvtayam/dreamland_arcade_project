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

    var body = '<div style="padding:10px 12px;flex:1;display:flex;flex-direction:column;justify-content:flex-start;min-width:0;overflow:hidden;">';
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
    var row = '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:12px;">';
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

  var DREAMLAND_LOGO_ICON = '<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="dl-ev1" x1="6" y1="6" x2="42" y2="42"><stop stop-color="#a855f7"/><stop offset="1" stop-color="#06b6d4"/></linearGradient></defs><rect x="2" y="2" width="44" height="44" rx="12" fill="#0a0e1a" stroke="url(#dl-ev1)" stroke-width="1.5"/><path d="M10 18c0-1.2 1-2.2 2.2-2.4l5-.8c1.6-.3 2.8 1 2.8 2.6v12c0 1.6-1.2 2.9-2.8 2.6l-5-.8c-1.2-.2-2.2-1.2-2.2-2.4V18z" stroke="url(#dl-ev1)" stroke-width="1.8" fill="none"/><circle cx="15" cy="19" r="1.5" fill="#a855f7"/><circle cx="19" cy="23" r="1.5" fill="#6366f1"/><path d="M28 18c0-1.2 1-2.2 2.2-2.4l5-.8c1.6-.3 2.8 1 2.8 2.6v12c0 1.6-1.2 2.9-2.8 2.6l-5-.8c-1.2-.2-2.2-1.2-2.2-2.4V18z" stroke="url(#dl-ev1)" stroke-width="1.8" fill="none"/><circle cx="33" cy="19" r="1.5" fill="#a855f7"/><circle cx="37" cy="23" r="1.5" fill="#6366f1"/><path d="M14 15h20" stroke="url(#dl-ev1)" stroke-width="1.8" stroke-linecap="round"/></svg>';
  var MODAL_LABEL = 'color:#94a3b8;font-size:0.72rem;display:block;margin-bottom:5px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;';
  var MODAL_INPUT = 'width:100%;background:#0d1117;border:1px solid #30363d;border-radius:8px;padding:10px 12px;color:#e2e8f0;font-size:0.85rem;outline:none;transition:border 0.2s;box-sizing:border-box;';

  function buildModalHeader(titleText, subtitleText, accentColor) {
    return '<div style="position:relative;">' +
      '<div style="position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,' + accentColor + ',' + accentColor + '88,' + accentColor + ');"></div>' +
      '<div style="padding:24px 28px 20px;display:flex;align-items:center;gap:14px;">' +
        DREAMLAND_LOGO_ICON +
        '<div><div style="color:#e2e8f0;font-size:1.05rem;font-weight:800;letter-spacing:0.3px;">DREAMLAND ARCADE</div>' +
        '<div style="color:' + accentColor + ';font-size:0.62rem;text-transform:uppercase;letter-spacing:2px;margin-top:2px;">' + titleText + '</div></div>' +
      '</div>' +
      '<div style="height:1px;background:linear-gradient(90deg,transparent,#1e293b,#1e293b,transparent);"></div>' +
    '</div>';
  }

  function openHolidayModal(holiday) {
    var isEdit = !!holiday;
    var accentColor = isEdit ? '#f59e0b' : '#6366f1';
    var accentGradient = isEdit ? 'linear-gradient(135deg,#f59e0b,#f97316)' : 'linear-gradient(135deg,#6366f1,#818cf8)';

    var html = '' +
      '<div style="background:linear-gradient(135deg,#060a14,#0a0e1a,#0c1222);border:1px solid #1e293b;border-radius:16px;overflow:hidden;">' +
        buildModalHeader(isEdit ? 'Edit Holiday' : 'New Holiday', '', accentColor) +

        '<form id="holiday-form" style="padding:20px 28px 24px;">' +
          '<div style="background:#0f172a;border:1px solid #1e293b;border-radius:10px;padding:18px;margin-bottom:16px;">' +
            '<div style="color:' + accentColor + ';font-size:0.65rem;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:14px;display:flex;align-items:center;gap:6px;">' +
              '<svg width="14" height="14" fill="none" stroke="' + accentColor + '" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>' +
              ' Holiday Details</div>' +
            '<div style="display:flex;flex-direction:column;gap:14px;">' +
              '<div><label style="' + MODAL_LABEL + '">Holiday Name</label>' +
              '<input name="name" style="' + MODAL_INPUT + '" value="' + (isEdit ? escE(holiday.name) : '') + '" required placeholder="e.g. Independence Day" onfocus="this.style.borderColor=\'' + accentColor + '\'" onblur="this.style.borderColor=\'#30363d\'"></div>' +
              '<div><label style="' + MODAL_LABEL + '">Date</label>' +
              '<input type="date" name="date" style="' + MODAL_INPUT + '" value="' + (isEdit ? holiday.date : '') + '" required onfocus="this.style.borderColor=\'' + accentColor + '\'" onblur="this.style.borderColor=\'#30363d\'"></div>' +
              '<div><label style="' + MODAL_LABEL + '">Branch (optional)</label>' +
              '<select name="branch_id" style="' + MODAL_INPUT + '" onfocus="this.style.borderColor=\'' + accentColor + '\'" onblur="this.style.borderColor=\'#30363d\'">' +
              '<option value="">All Branches</option></select></div>' +
              '<label style="display:flex;align-items:center;gap:10px;cursor:pointer;padding:10px 14px;background:#0d1117;border:1px solid #1e293b;border-radius:8px;transition:all 0.2s;" onmouseenter="this.style.borderColor=\'' + accentColor + '44\';this.style.background=\'' + accentColor + '08\'" onmouseleave="this.style.borderColor=\'#1e293b\';this.style.background=\'#0d1117\'">' +
                '<input type="checkbox" name="is_recurring"' + (isEdit && holiday.is_recurring ? ' checked' : '') + ' style="accent-color:' + accentColor + ';width:16px;height:16px;">' +
                '<span style="color:#94a3b8;font-size:0.82rem;">Recurring (every year)</span>' +
              '</label>' +
            '</div>' +
          '</div>' +

          '<div style="display:flex;gap:10px;">' +
            '<button type="button" onclick="Modal.close()" style="flex:1;padding:11px;border:1px solid #30363d;border-radius:8px;background:#0d1117;color:#94a3b8;font-weight:600;cursor:pointer;transition:all 0.2s;" onmouseenter="this.style.borderColor=\'#ef4444\';this.style.color=\'#fca5a5\'" onmouseleave="this.style.borderColor=\'#30363d\';this.style.color=\'#94a3b8\'">Cancel</button>' +
            '<button type="submit" style="flex:2;padding:11px;border:none;border-radius:8px;background:' + accentGradient + ';color:#fff;font-weight:700;cursor:pointer;box-shadow:0 2px 10px ' + accentColor + '30;">' +
              (isEdit ? 'Update Holiday' : 'Add Holiday') +
            '</button>' +
          '</div>' +
        '</form>' +
      '</div>';

    Modal.show('', html, { width: '480px' });

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
    var accentColor = isEdit ? '#f59e0b' : '#22c55e';
    var accentGradient = isEdit ? 'linear-gradient(135deg,#f59e0b,#f97316)' : 'linear-gradient(135deg,#22c55e,#4ade80)';

    var gridHtml = '<div id="emoji-grid" style="display:grid;grid-template-columns:repeat(10,1fr);gap:4px;max-height:140px;overflow-y:auto;padding:6px;border:1px solid #1e293b;border-radius:8px;background:#0d1117;">';
    emojiOptions.forEach(function(em) {
      var isActive = em === selectedIcon;
      gridHtml += '<div class="emoji-pick" data-em="' + escE(em) + '" style="width:100%;aspect-ratio:1;display:flex;align-items:center;justify-content:center;font-size:1.05rem;border-radius:6px;cursor:pointer;border:1px solid ' + (isActive ? '#6366f1' : 'transparent') + ';background:' + (isActive ? '#6366f122' : 'transparent') + ';transition:all 0.15s;" onmouseenter="if(!this.classList.contains(\'active\'))this.style.background=\'#ffffff08\'" onmouseleave="if(!this.classList.contains(\'active\'))this.style.background=\'transparent\'">' + em + '</div>';
    });
    gridHtml += '</div>';

    var html = '' +
      '<div style="background:linear-gradient(135deg,#060a14,#0a0e1a,#0c1222);border:1px solid #1e293b;border-radius:16px;overflow:hidden;">' +
        buildModalHeader(isEdit ? 'Edit Special Event' : 'New Special Event', '', accentColor) +

        '<form id="event-form" style="padding:20px 28px 24px;">' +

          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;">' +

            '<div style="background:#0f172a;border:1px solid #1e293b;border-radius:10px;padding:18px;">' +
              '<div style="color:' + accentColor + ';font-size:0.65rem;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:14px;display:flex;align-items:center;gap:6px;">' +
                '<svg width="14" height="14" fill="none" stroke="' + accentColor + '" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>' +
                ' Event Details</div>' +
              '<div style="display:flex;flex-direction:column;gap:12px;">' +
                '<div><label style="' + MODAL_LABEL + '">Event Name</label>' +
                '<input name="name" style="' + MODAL_INPUT + '" value="' + (isEdit ? escE(event.name) : '') + '" required placeholder="e.g. Summer Arcade Fest" onfocus="this.style.borderColor=\'' + accentColor + '\'" onblur="this.style.borderColor=\'#30363d\'"></div>' +
                '<div><label style="' + MODAL_LABEL + '">Date</label>' +
                '<input type="date" name="date" style="' + MODAL_INPUT + '" value="' + dateVal + '" required onfocus="this.style.borderColor=\'' + accentColor + '\'" onblur="this.style.borderColor=\'#30363d\'"></div>' +
                '<div><label style="' + MODAL_LABEL + '">Description (optional)</label>' +
                '<textarea name="description" rows="3" style="' + MODAL_INPUT + 'resize:vertical;" placeholder="Details about the event..." onfocus="this.style.borderColor=\'' + accentColor + '\'" onblur="this.style.borderColor=\'#30363d\'">' + (isEdit ? escE(event.description || '') : '') + '</textarea></div>' +
                '<div><label style="' + MODAL_LABEL + '">Branch (optional)</label>' +
                '<select name="branch_id" style="' + MODAL_INPUT + '" onfocus="this.style.borderColor=\'' + accentColor + '\'" onblur="this.style.borderColor=\'#30363d\'">' +
                '<option value="">All Branches</option></select></div>' +
              '</div>' +
            '</div>' +

            '<div style="background:#0f172a;border:1px solid #1e293b;border-radius:10px;padding:18px;display:flex;flex-direction:column;">' +
              '<div style="color:' + accentColor + ';font-size:0.65rem;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:14px;display:flex;align-items:center;gap:6px;">' +
                '<svg width="14" height="14" fill="none" stroke="' + accentColor + '" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>' +
                ' Event Icon</div>' +
              '<div style="margin-bottom:12px;padding:16px;background:linear-gradient(135deg,' + accentColor + '08,transparent);border:1px solid ' + accentColor + '15;border-radius:10px;text-align:center;">' +
                '<div id="selected-icon-preview" style="font-size:2.8rem;line-height:1;">' + escE(selectedIcon) + '</div>' +
                '<div style="color:#64748b;font-size:0.65rem;margin-top:6px;">Selected Icon</div>' +
              '</div>' +
              '<div style="flex:1;min-height:0;">' + gridHtml + '</div>' +
              '<input type="hidden" name="icon" value="' + escE(selectedIcon) + '">' +
            '</div>' +

          '</div>' +

          '<div style="display:flex;gap:10px;">' +
            '<button type="button" onclick="Modal.close()" style="flex:1;padding:11px;border:1px solid #30363d;border-radius:8px;background:#0d1117;color:#94a3b8;font-weight:600;cursor:pointer;transition:all 0.2s;" onmouseenter="this.style.borderColor=\'#ef4444\';this.style.color=\'#fca5a5\'" onmouseleave="this.style.borderColor=\'#30363d\';this.style.color=\'#94a3b8\'">Cancel</button>' +
            '<button type="submit" style="flex:2;padding:11px;border:none;border-radius:8px;background:' + accentGradient + ';color:#fff;font-weight:700;cursor:pointer;box-shadow:0 2px 10px ' + accentColor + '30;">' +
              (isEdit ? 'Update Event' : 'Add Special Event') +
            '</button>' +
          '</div>' +
        '</form>' +
      '</div>';

    Modal.show('', html, { width: '680px' });

    document.querySelectorAll('.emoji-pick').forEach(function(el) {
      el.addEventListener('click', function() {
        selectedIcon = el.dataset.em;
        document.querySelectorAll('.emoji-pick').forEach(function(x) {
          x.style.borderColor = 'transparent';
          x.style.background = 'transparent';
          x.classList.remove('active');
        });
        el.style.borderColor = '#6366f1';
        el.style.background = '#6366f122';
        el.classList.add('active');
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
