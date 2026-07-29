function renderAdminAnnouncements() {
  var app = document.getElementById('app');
  var announcements = [];
  var branches = [];
  var filterBranch = '';
  var filterPriority = '';
  var editingAnnouncement = null;
  var view = 'list';

  async function loadData() {
    branches = await apiGet('/branches');
    if (!Array.isArray(branches)) branches = [];
    var user = Auth.getUser();
    if (user && user.role !== 'owner' && user.branch_id) {
      filterBranch = String(user.branch_id);
    }
    await loadAnnouncements();
    render();
  }

  async function loadAnnouncements() {
    var params = [];
    if (filterBranch) params.push('branch_id=' + filterBranch);
    var url = '/announcements' + (params.length ? '?' + params.join('&') : '');
    announcements = await apiGet(url);
    if (!Array.isArray(announcements)) announcements = [];
  }

  function createNew() {
    var user = Auth.getUser();
    editingAnnouncement = {
      branch_id: user.role === 'owner' ? null : user.branch_id,
      title: '',
      content: '',
      priority: 'normal',
      is_active: 1
    };
    view = 'edit';
    render();
  }

  function editAnnouncement(a) {
    editingAnnouncement = JSON.parse(JSON.stringify(a));
    view = 'edit';
    render();
  }

  function viewAnnouncement(a) {
    editingAnnouncement = JSON.parse(JSON.stringify(a));
    view = 'detail';
    render();
  }

  async function saveAnnouncement() {
    var user = Auth.getUser();
    var title = document.getElementById('ann-title')?.value;
    var content = document.getElementById('ann-content')?.value;
    var priority = document.getElementById('ann-priority')?.value || 'normal';
    var branchId = parseInt(document.getElementById('ann-branch')?.value) || null;

    if (!title) { Toast.error('Title is required'); return; }
    if (user.role !== 'owner') branchId = user.branch_id;
    if (!content) { Toast.error('Content is required'); return; }

    if (editingAnnouncement.id) {
      await apiPut('/announcements/' + editingAnnouncement.id, {
        title: title, content: content, priority: priority, branch_id: branchId
      });
      Toast.success('Announcement updated!');
    } else {
      await apiPost('/announcements', {
        title: title, content: content, priority: priority, branch_id: branchId
      });
      Toast.success('Announcement published!');
    }
    editingAnnouncement = null;
    view = 'list';
    await loadAnnouncements();
    render();
  }

  async function deleteAnnouncement(id) {
    if (!await confirmAsync('Are you sure you want to delete this announcement?')) return;
    await apiDelete('/announcements/' + id);
    Toast.success('Announcement deleted!');
    await loadAnnouncements();
    render();
  }

  async function toggleActive(id, current) {
    await apiPut('/announcements/' + id, { is_active: current ? 0 : 1 });
    Toast.success(current ? 'Announcement deactivated' : 'Announcement activated');
    await loadAnnouncements();
    render();
  }

  var priorityConfig = {
    urgent:   { color: '#ef4444', bg: '#ef444418', border: '#ef444455', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z', label: 'Urgent' },
    important: { color: '#f59e0b', bg: '#f59e0b18', border: '#f59e0b55', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z', label: 'Important' },
    normal:    { color: '#3b82f6', bg: '#3b82f618', border: '#3b82f655', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9', label: 'Normal' }
  };

  var roleConfig = {
    owner:   { color: '#f59e0b', bg: '#f59e0b18', border: '#f59e0b55', label: 'Owner', icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' },
    admin:   { color: '#6366f1', bg: '#6366f118', border: '#6366f155', label: 'Admin', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
    employee: { color: '#22c55e', bg: '#22c55e18', border: '#22c55e55', label: 'Staff', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' }
  };

  function statusBadge(isActive) {
    if (isActive) return '<span style="background:#22c55e18;color:#22c55e;border:1px solid #22c55e55;padding:3px 10px;border-radius:12px;font-size:0.65rem;font-weight:700;text-transform:uppercase;">Active</span>';
    return '<span style="background:#ef444418;color:#ef4444;border:1px solid #ef444455;padding:3px 10px;border-radius:12px;font-size:0.65rem;font-weight:700;text-transform:uppercase;">Inactive</span>';
  }

  var iconSvg = function(d, c) { return '<svg width="18" height="18" fill="none" stroke="' + c + '" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="' + d + '"/></svg>'; };
  var icons = {
    megaphone: 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z',
    title: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
    content: 'M4 6h16M4 12h16M4 18h7',
    branch: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
    save: 'M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4',
    back: 'M10 19l-7-7m0 0l7-7m-7 7h18',
    add: 'M12 4v16m8-8H4',
    trash: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
    edit: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
    eye: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z',
    toggle: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4',
    calendar: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    user: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
  };

  function render() {
    var user = Auth.getUser();
    var isOwner = user && user.role === 'owner';

    if (view === 'edit' && editingAnnouncement) return renderEditor(isOwner);
    if (view === 'detail' && editingAnnouncement) return renderDetail(isOwner);

    var urgent = announcements.filter(function(a) { return a.priority === 'urgent'; }).length;
    var important = announcements.filter(function(a) { return a.priority === 'important'; }).length;
    var normal = announcements.filter(function(a) { return a.priority === 'normal'; }).length;
    var active = announcements.filter(function(a) { return a.is_active; }).length;

    var filteredAnnouncements = announcements;
    if (filterPriority) filteredAnnouncements = announcements.filter(function(a) { return a.priority === filterPriority; });

    var priorityTabs = [
      { id: '', icon: icons.megaphone, label: 'All', color: '#94a3b8' },
      { id: 'urgent', icon: priorityConfig.urgent.icon, label: 'Urgent', color: priorityConfig.urgent.color },
      { id: 'important', icon: priorityConfig.important.icon, label: 'Important', color: priorityConfig.important.color },
      { id: 'normal', icon: priorityConfig.normal.icon, label: 'Normal', color: priorityConfig.normal.color }
    ];

    var tabsHtml = priorityTabs.map(function(t) {
      var active = filterPriority === t.id;
      var bg = active ? t.color + '18' : 'transparent';
      var border = active ? t.color + '55' : '#1e293b';
      var textColor = active ? t.color : '#64748b';
      return '<button onclick="window.__annFilterPriority(\'' + t.id + '\')" style="background:' + bg + ';border:1px solid ' + border + ';border-radius:8px;padding:6px 14px;cursor:pointer;font-size:0.75rem;font-weight:600;color:' + textColor + ';display:inline-flex;align-items:center;gap:6px;transition:all 0.2s;">' +
        iconSvg(t.icon, textColor) + t.label + '</button>';
    }).join('');

    var rows = '';
    filteredAnnouncements.forEach(function(a) {
      var pc = priorityConfig[a.priority] || priorityConfig.normal;
      var dt = a.created_at ? new Date(a.created_at) : new Date();
      var dateStr = dt.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: '2-digit' });
      var timeStr = dt.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', hour12: true });
      var creator = a.creator_name || 'Unknown';
      var creatorInitials = creator.split(' ').map(function(w) { return w[0]; }).join('').substring(0, 2).toUpperCase();
      var canEdit = isOwner || a.created_by === user.id;
      var rc = roleConfig[a.creator_role] || { color: '#94a3b8', bg: '#94a3b818', border: '#94a3b844', label: a.creator_role || 'Unknown', icon: icons.user };

      rows += '<tr style="border-bottom:1px solid #1e2736;cursor:pointer;transition:background 0.15s;" onmouseenter="this.style.background=\'#1a1f2e22\'" onmouseleave="this.style.background=\'transparent\'" onclick="window.__annView(' + a.id + ')">' +
        '<td style="padding:12px 14px;">' +
          '<div style="display:flex;align-items:center;gap:10px;">' +
            '<div style="width:36px;height:36px;border-radius:9px;background:' + pc.bg + ';border:1px solid ' + pc.border + ';display:flex;align-items:center;justify-content:center;flex-shrink:0;">' +
              iconSvg(pc.icon, pc.color) +
            '</div>' +
            '<div>' +
              '<div style="color:#e2e8f0;font-weight:700;font-size:0.88rem;">' + esc(a.title) + '</div>' +
              '<div style="color:#64748b;font-size:0.7rem;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:300px;">' + esc((a.content || '').substring(0, 80)) + '</div>' +
            '</div>' +
          '</div>' +
        '</td>' +
        '<td style="padding:12px 14px;"><span style="background:' + pc.bg + ';color:' + pc.color + ';border:1px solid ' + pc.border + ';padding:3px 10px;border-radius:12px;font-size:0.65rem;font-weight:700;text-transform:uppercase;">' + pc.label + '</span></td>' +
        '<td style="padding:12px 14px;color:#94a3b8;font-size:0.8rem;">' + (a.branch_name || '<span style="color:#6366f1;">All Branches</span>') + '</td>' +
        '<td style="padding:12px 14px;">' +
          '<div style="display:flex;align-items:center;gap:6px;">' +
            '<div style="width:20px;height:20px;border-radius:5px;background:' + rc.bg + ';border:1px solid ' + rc.border + ';display:flex;align-items:center;justify-content:center;">' + iconSvg(rc.icon, rc.color) + '</div>' +
            '<div>' +
              '<div style="color:#94a3b8;font-size:0.78rem;">' + esc(creator) + '</div>' +
              '<div style="color:' + rc.color + ';font-size:0.6rem;font-weight:600;text-transform:uppercase;">' + rc.label + '</div>' +
            '</div>' +
          '</div>' +
        '</td>' +
        '<td style="padding:12px 14px;color:#64748b;font-size:0.78rem;">' + dateStr + '</td>' +
        '<td style="padding:12px 14px;">' + statusBadge(a.is_active) + '</td>' +
        '<td style="padding:12px 14px;text-align:right;">' +
          (canEdit ?
            '<div style="display:flex;gap:4px;justify-content:flex-end;">' +
              '<button onclick="event.stopPropagation();window.__annEdit(' + a.id + ')" style="background:#1a2035;color:#94a3b8;border:1px solid #2a3040;border-radius:6px;padding:5px 8px;cursor:pointer;transition:all 0.2s;" onmouseenter="this.style.borderColor=\'#6366f1\';this.style.color=\'#a78bfa\'" onmouseleave="this.style.borderColor=\'#2a3040\';this.style.color=\'#94a3b8\'">' + iconSvg(icons.edit, 'currentColor') + '</button>' +
              '<button onclick="event.stopPropagation();window.__annToggle(' + a.id + ',' + (a.is_active ? 'true' : 'false') + ')" style="background:#1a2035;color:#94a3b8;border:1px solid #2a3040;border-radius:6px;padding:5px 8px;cursor:pointer;transition:all 0.2s;" onmouseenter="this.style.borderColor=\'#f59e0b\';this.style.color=\'#fbbf24\'" onmouseleave="this.style.borderColor=\'#2a3040\';this.style.color=\'#94a3b8\'">' + iconSvg(icons.toggle, 'currentColor') + '</button>' +
              (isOwner ?
                '<button onclick="event.stopPropagation();window.__annDelete(' + a.id + ')" style="background:#1a2035;color:#94a3b8;border:1px solid #2a3040;border-radius:6px;padding:5px 8px;cursor:pointer;transition:all 0.2s;" onmouseenter="this.style.borderColor=\'#ef4444\';this.style.color=\'#f87171\'" onmouseleave="this.style.borderColor=\'#2a3040\';this.style.color=\'#94a3b8\'">' + iconSvg(icons.trash, 'currentColor') + '</button>' : '') +
            '</div>' : '<span style="color:#475569;font-size:0.72rem;">' + esc(creator) + '</span>') +
        '</td>' +
      '</tr>';
    });

    app.innerHTML = '<div class="layout">' + renderSidebar() +
      '<div class="main-content">' + renderNavbar('Announcements') +
      '<div class="page-content" id="page-body">' +

      '<div style="position:relative;margin-bottom:28px;">' +
        '<div style="position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,#ef4444,#f59e0b,#3b82f6);border-radius:1px;opacity:0.6;"></div>' +
        '<div style="padding-top:20px;display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;">' +
          '<div style="display:flex;align-items:center;gap:14px;">' +
            '<div style="width:40px;height:40px;border-radius:10px;background:rgba(239,68,68,0.12);display:flex;align-items:center;justify-content:center;">' +
              iconSvg(icons.megaphone, '#ef4444') +
            '</div>' +
            '<div>' +
              '<h2 style="color:#e2e8f0;margin:0;font-size:1.2rem;font-weight:800;">Announcements</h2>' +
              '<div style="color:#ef4444;font-size:0.6rem;text-transform:uppercase;letter-spacing:2px;margin-top:2px;">Company-Wide Communications</div>' +
            '</div>' +
          '</div>' +
          '<button onclick="window.__annNew()" style="background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff;border:none;border-radius:8px;padding:8px 16px;cursor:pointer;font-weight:600;font-size:0.8rem;display:inline-flex;align-items:center;gap:6px;box-shadow:0 2px 8px #ef444430;transition:all 0.2s;" onmouseenter="this.style.transform=\'translateY(-1px)\';this.style.boxShadow=\'0 4px 14px #ef444444\'" onmouseleave="this.style.transform=\'translateY(0)\';this.style.boxShadow=\'0 2px 8px #ef444430\'">' +
            iconSvg(icons.add, 'white') + ' New Announcement' +
          '</button>' +
        '</div>' +
      '</div>' +

      '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:20px;">' +
        '<div style="background:linear-gradient(135deg,#0f172a,#1e293b);border:1px solid #1e293b;border-radius:12px;padding:14px;transition:all 0.2s;cursor:pointer;" onmouseenter="this.style.borderColor=\'#ef444455\';this.style.transform=\'translateY(-1px)\'" onmouseleave="this.style.borderColor=\'#1e293b\';this.style.transform=\'translateY(0)\'" onclick="window.__annFilterPriority(\'urgent\')">' +
          '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">' +
            '<div style="width:28px;height:28px;border-radius:7px;background:#ef444418;display:flex;align-items:center;justify-content:center;">' + iconSvg(priorityConfig.urgent.icon, '#ef4444') + '</div>' +
            '<div style="color:#64748b;font-size:0.65rem;text-transform:uppercase;letter-spacing:1px;">Urgent</div>' +
          '</div>' +
          '<div style="color:#ef4444;font-size:1.5rem;font-weight:800;">' + urgent + '</div>' +
        '</div>' +
        '<div style="background:linear-gradient(135deg,#0f172a,#1e293b);border:1px solid #1e293b;border-radius:12px;padding:14px;transition:all 0.2s;cursor:pointer;" onmouseenter="this.style.borderColor=\'#f59e0b55\';this.style.transform=\'translateY(-1px)\'" onmouseleave="this.style.borderColor=\'#1e293b\';this.style.transform=\'translateY(0)\'" onclick="window.__annFilterPriority(\'important\')">' +
          '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">' +
            '<div style="width:28px;height:28px;border-radius:7px;background:#f59e0b18;display:flex;align-items:center;justify-content:center;">' + iconSvg(priorityConfig.important.icon, '#f59e0b') + '</div>' +
            '<div style="color:#64748b;font-size:0.65rem;text-transform:uppercase;letter-spacing:1px;">Important</div>' +
          '</div>' +
          '<div style="color:#f59e0b;font-size:1.5rem;font-weight:800;">' + important + '</div>' +
        '</div>' +
        '<div style="background:linear-gradient(135deg,#0f172a,#1e293b);border:1px solid #1e293b;border-radius:12px;padding:14px;transition:all 0.2s;cursor:pointer;" onmouseenter="this.style.borderColor=\'#3b82f655\';this.style.transform=\'translateY(-1px)\'" onmouseleave="this.style.borderColor=\'#1e293b\';this.style.transform=\'translateY(0)\'" onclick="window.__annFilterPriority(\'normal\')">' +
          '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">' +
            '<div style="width:28px;height:28px;border-radius:7px;background:#3b82f618;display:flex;align-items:center;justify-content:center;">' + iconSvg(priorityConfig.normal.icon, '#3b82f6') + '</div>' +
            '<div style="color:#64748b;font-size:0.65rem;text-transform:uppercase;letter-spacing:1px;">Normal</div>' +
          '</div>' +
          '<div style="color:#3b82f6;font-size:1.5rem;font-weight:800;">' + normal + '</div>' +
        '</div>' +
        '<div style="background:linear-gradient(135deg,#0f172a,#1e293b);border:1px solid #1e293b;border-radius:12px;padding:14px;transition:all 0.2s;">' +
          '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">' +
            '<div style="width:28px;height:28px;border-radius:7px;background:#22c55e18;display:flex;align-items:center;justify-content:center;">' + iconSvg('M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', '#22c55e') + '</div>' +
            '<div style="color:#64748b;font-size:0.65rem;text-transform:uppercase;letter-spacing:1px;">Active</div>' +
          '</div>' +
          '<div style="color:#22c55e;font-size:1.5rem;font-weight:800;">' + active + '</div>' +
        '</div>' +
      '</div>' +

      '<div style="display:flex;gap:6px;margin-bottom:16px;flex-wrap:wrap;align-items:center;">' + tabsHtml +
        '<span style="color:#64748b;font-size:0.75rem;margin-left:auto;">' + filteredAnnouncements.length + ' announcement' + (filteredAnnouncements.length !== 1 ? 's' : '') + '</span>' +
      '</div>' +

      '<div style="background:#1a1f2e;border:1px solid #2a3040;border-radius:12px;overflow:hidden;">' +
        '<table style="width:100%;border-collapse:collapse;font-size:0.82rem;">' +
        '<thead><tr style="border-bottom:2px solid #2a3040;background:#151a28;">' +
          '<th style="padding:10px 14px;color:#94a3b8;text-align:left;font-weight:600;">Announcement</th>' +
          '<th style="padding:10px 14px;color:#94a3b8;text-align:left;font-weight:600;">Priority</th>' +
          '<th style="padding:10px 14px;color:#94a3b8;text-align:left;font-weight:600;">Branch</th>' +
          '<th style="padding:10px 14px;color:#94a3b8;text-align:left;font-weight:600;">Author</th>' +
          '<th style="padding:10px 14px;color:#94a3b8;text-align:left;font-weight:600;">Date</th>' +
          '<th style="padding:10px 14px;color:#94a3b8;text-align:left;font-weight:600;">Status</th>' +
          '<th style="padding:10px 14px;color:#94a3b8;text-align:right;font-weight:600;">Actions</th>' +
        '</tr></thead><tbody>' +
        (rows || '<tr><td colspan="7" style="padding:40px;color:#475569;text-align:center;">' +
          '<div style="margin:0 auto 12px;width:48px;height:48px;border-radius:12px;background:#1a2035;display:flex;align-items:center;justify-content:center;">' +
            iconSvg(icons.megaphone, '#475569') +
          '</div>' +
          '<div style="font-weight:600;margin-bottom:4px;">No announcements yet</div>' +
          '<div style="font-size:0.75rem;">Create your first announcement to get started</div>' +
        '</td></tr>') +
        '</tbody></table>' +
      '</div>' +

      '</div></div></div>';
  }

  function renderEditor(isOwner) {
    var a = editingAnnouncement;
    var isNew = !a.id;
    var user = Auth.getUser();

    var branchOptions = '';
    if (isOwner) {
      branchOptions = '<option value="">All Branches</option>';
      branches.forEach(function(b) {
        branchOptions += '<option value="' + b.id + '"' + (a.branch_id == b.id ? ' selected' : '') + '>' + esc(b.name) + '</option>';
      });
    } else {
      var myBranch = branches.find(function(b) { return b.id == user.branch_id; });
      branchOptions = '<option value="' + user.branch_id + '" selected>' + (myBranch ? esc(myBranch.name) : 'My Branch') + '</option>';
    }

    var inputStyle = 'width:100%;background:#080c18;border:1px solid #1e2a3a;border-radius:10px;padding:10px 14px 10px 40px;color:#e2e8f0;font-size:0.85rem;transition:all 0.3s;outline:none;box-sizing:border-box;';
    var inputFocus = 'onfocus="this.style.borderColor=\'#ef4444\';this.style.boxShadow=\'0 0 0 2px #ef444422\'" onblur="this.style.borderColor=\'#1e2a3a\';this.style.boxShadow=\'none\'"';
    var selectStyle = 'width:100%;background:#080c18;border:1px solid #1e2a3a;border-radius:10px;padding:10px 14px 10px 40px;color:#e2e8f0;font-size:0.85rem;transition:all 0.3s;outline:none;cursor:pointer;box-sizing:border-box;appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' fill=\'%2394a3b8\' viewBox=\'0 0 24 24\'%3E%3Cpath d=\'M7 10l5 5 5-5z\'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 12px center;';
    var labelStyle = 'color:#94a3b8;font-size:0.7rem;font-weight:600;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;display:flex;align-items:center;gap:6px;';
    var fieldWrap = 'margin-bottom:18px;position:relative;';

    var priorityOptions = '<option value="normal"' + (a.priority === 'normal' ? ' selected' : '') + '>Normal</option>' +
      '<option value="important"' + (a.priority === 'important' ? ' selected' : '') + '>Important</option>' +
      '<option value="urgent"' + (a.priority === 'urgent' ? ' selected' : '') + '>Urgent</option>';

    app.innerHTML = '<div class="layout">' + renderSidebar() +
      '<div class="main-content">' + renderNavbar(isNew ? 'New Announcement' : 'Edit Announcement') +
      '<div class="page-content" id="page-body">' +

      '<div style="margin-bottom:20px;">' +
        '<button onclick="window.__annBack()" style="background:#1a2035;color:#94a3b8;border:1px solid #2a3040;border-radius:8px;padding:7px 16px;cursor:pointer;font-size:0.8rem;display:inline-flex;align-items:center;gap:6px;transition:all 0.2s;" onmouseenter="this.style.color=\'#e2e8f0\';this.style.borderColor=\'#475569\'" onmouseleave="this.style.color=\'#94a3b8\';this.style.borderColor=\'#2a3040\'">' + iconSvg(icons.back, 'currentColor') + ' Back</button>' +
      '</div>' +

      '<div style="max-width:780px;">' +

        '<div style="position:relative;border-radius:16px;overflow:hidden;margin-bottom:24px;background:linear-gradient(135deg,#0f172a 0%,#1a1030 50%,#0f172a 100%);border:1px solid #2a2050;">' +
          '<div style="position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,#ef4444,#f59e0b,#ef4444);"></div>' +
          '<div style="position:absolute;top:-40px;right:-40px;width:120px;height:120px;background:radial-gradient(circle,rgba(239,68,68,0.08),transparent);border-radius:50%;"></div>' +
          '<div style="position:absolute;bottom:-30px;left:-30px;width:80px;height:80px;background:radial-gradient(circle,rgba(245,158,11,0.06),transparent);border-radius:50%;"></div>' +
          '<div style="padding:24px 28px;position:relative;">' +
            '<div style="display:flex;align-items:center;gap:14px;margin-bottom:8px;">' +
              '<div style="width:44px;height:44px;border-radius:12px;background:linear-gradient(135deg,#ef4444,#dc2626);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px #ef444433;">' +
                iconSvg(isNew ? icons.add : icons.megaphone, 'white') +
              '</div>' +
              '<div>' +
                '<div style="color:#ef4444;font-size:0.65rem;font-weight:700;text-transform:uppercase;letter-spacing:2px;margin-bottom:2px;">' + (isNew ? 'New Announcement' : 'Edit Announcement') + '</div>' +
                '<div style="color:#e2e8f0;font-size:1.1rem;font-weight:800;">' + (isNew ? 'Create a Company Announcement' : esc(a.title)) + '</div>' +
              '</div>' +
            '</div>' +
            '<div style="color:#64748b;font-size:0.75rem;margin-top:4px;">' + (isNew ? 'Broadcast important information to your team members.' : 'Modify the announcement details below.') + '</div>' +
          '</div>' +
        '</div>' +

        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">' +

          '<div style="background:linear-gradient(180deg,#111827,#0d1117);border:1px solid #1e293b;border-radius:14px;padding:22px;">' +
            '<div style="display:flex;align-items:center;gap:8px;margin-bottom:18px;padding-bottom:12px;border-bottom:1px solid #1e293b;">' +
              '<div style="width:28px;height:28px;border-radius:7px;background:rgba(239,68,68,0.1);display:flex;align-items:center;justify-content:center;">' + iconSvg(icons.title, '#ef4444') + '</div>' +
              '<span style="color:#e2e8f0;font-weight:700;font-size:0.85rem;">Announcement Details</span>' +
            '</div>' +

            '<div style="' + fieldWrap + '">' +
              '<label style="' + labelStyle + '">' + iconSvg(icons.title, '#94a3b8') + ' Title <span style="color:#ef4444;">*</span></label>' +
              '<div style="position:relative;"><span style="position:absolute;left:12px;top:50%;transform:translateY(-50%);pointer-events:none;">' + iconSvg(icons.title, '#475569') + '</span>' +
              '<input type="text" id="ann-title" value="' + esc(a.title || '') + '" placeholder="e.g. System Maintenance Notice" style="' + inputStyle + '" ' + inputFocus + '></div>' +
            '</div>' +

            '<div style="' + fieldWrap + '">' +
              '<label style="' + labelStyle + '">' + iconSvg(icons.branch, '#94a3b8') + ' Branch</label>' +
              '<div style="position:relative;"><span style="position:absolute;left:12px;top:50%;transform:translateY(-50%);pointer-events:none;">' + iconSvg(icons.branch, '#475569') + '</span>' +
              '<select id="ann-branch" style="' + selectStyle + '" ' + inputFocus + '>' + branchOptions + '</select></div>' +
            '</div>' +

            '<div style="' + fieldWrap + '">' +
              '<label style="' + labelStyle + '">' + iconSvg(priorityConfig[a.priority]?.icon || icons.megaphone, '#94a3b8') + ' Priority</label>' +
              '<div style="position:relative;"><span style="position:absolute;left:12px;top:50%;transform:translateY(-50%);pointer-events:none;">' + iconSvg(priorityConfig[a.priority]?.icon || icons.megaphone, '#475569') + '</span>' +
              '<select id="ann-priority" style="' + selectStyle + '" ' + inputFocus + ' onchange="window.__annPriorityChange(this.value)">' + priorityOptions + '</select></div>' +
            '</div>' +
          '</div>' +

          '<div style="background:linear-gradient(180deg,#111827,#0d1117);border:1px solid #1e293b;border-radius:14px;padding:22px;display:flex;flex-direction:column;">' +
            '<div style="display:flex;align-items:center;gap:8px;margin-bottom:18px;padding-bottom:12px;border-bottom:1px solid #1e293b;">' +
              '<div style="width:28px;height:28px;border-radius:7px;background:rgba(59,130,246,0.1);display:flex;align-items:center;justify-content:center;">' + iconSvg(icons.content, '#3b82f6') + '</div>' +
              '<span style="color:#e2e8f0;font-weight:700;font-size:0.85rem;">Content</span>' +
            '</div>' +
            '<div style="flex:1;position:relative;">' +
              '<textarea id="ann-content" rows="10" placeholder="Write your announcement content...&#10;&#10;• What is the announcement about?&#10;• Key details and instructions&#10;• Any deadlines or dates&#10;• Contact information" style="width:100%;height:calc(100% - 4px);background:#080c18;border:1px solid #1e2a3a;border-radius:10px;padding:12px 14px;color:#e2e8f0;font-size:0.85rem;resize:none;font-family:inherit;line-height:1.6;transition:all 0.3s;outline:none;box-sizing:border-box;" ' + inputFocus + '>' + esc(a.content || '') + '</textarea>' +
            '</div>' +
          '</div>' +

        '</div>' +

        '<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:24px;padding-top:20px;border-top:1px solid #1e293b;">' +
          '<button onclick="window.__annBack()" style="background:#1a2035;color:#94a3b8;border:1px solid #2a3040;border-radius:10px;padding:10px 24px;cursor:pointer;font-weight:600;font-size:0.85rem;transition:all 0.2s;" onmouseenter="this.style.borderColor=\'#475569\';this.style.color=\'#e2e8f0\'" onmouseleave="this.style.borderColor=\'#2a3040\';this.style.color=\'#94a3b8\'">Cancel</button>' +
          '<button onclick="window.__annSave()" style="background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff;border:none;border-radius:10px;padding:10px 24px;cursor:pointer;font-weight:700;font-size:0.85rem;display:inline-flex;align-items:center;gap:8px;box-shadow:0 4px 14px #ef444433;transition:all 0.2s;" onmouseenter="this.style.transform=\'translateY(-1px)\';this.style.boxShadow=\'0 6px 20px #ef444444\'" onmouseleave="this.style.transform=\'translateY(0)\';this.style.boxShadow=\'0 4px 14px #ef444433\'">' +
            iconSvg(icons.save, 'white') + (isNew ? ' Publish Announcement' : ' Update Announcement') +
          '</button>' +
        '</div>' +

      '</div>' +

      '</div></div></div>';
  }

  function renderDetail(isOwner) {
    var a = editingAnnouncement;
    var user = Auth.getUser();
    var canEdit = isOwner || a.created_by === user.id;
    var pc = priorityConfig[a.priority] || priorityConfig.normal;
    var rc = roleConfig[a.creator_role] || { color: '#94a3b8', bg: '#94a3b818', border: '#94a3b844', label: a.creator_role || 'Unknown', icon: icons.user };
    var dt = a.created_at ? new Date(a.created_at) : new Date();
    var dateStr = dt.toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: '2-digit' });
    var timeStr = dt.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', hour12: true });
    var creator = a.creator_name || 'Unknown';
    var creatorInitials = creator.split(' ').map(function(w) { return w[0]; }).join('').substring(0, 2).toUpperCase();

    app.innerHTML = '<div class="layout">' + renderSidebar() +
      '<div class="main-content">' + renderNavbar('Announcement Details') +
      '<div class="page-content" id="page-body">' +

      '<div style="margin-bottom:20px;">' +
        '<button onclick="window.__annBack()" style="background:#1a2035;color:#94a3b8;border:1px solid #2a3040;border-radius:8px;padding:7px 16px;cursor:pointer;font-size:0.8rem;display:inline-flex;align-items:center;gap:6px;transition:all 0.2s;" onmouseenter="this.style.color=\'#e2e8f0\';this.style.borderColor=\'#475569\'" onmouseleave="this.style.color=\'#94a3b8\';this.style.borderColor=\'#2a3040\'">' + iconSvg(icons.back, 'currentColor') + ' Back</button>' +
      '</div>' +

      '<div style="max-width:780px;">' +

        '<div style="position:relative;border-radius:16px;overflow:hidden;margin-bottom:24px;background:linear-gradient(135deg,#0f172a 0%,#1a1030 50%,#0f172a 100%);border:1px solid ' + pc.border + ';">' +
          '<div style="position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,' + pc.color + ',' + pc.color + '88,' + pc.color + ');"></div>' +
          '<div style="position:absolute;top:-40px;right:-40px;width:120px;height:120px;background:radial-gradient(circle,rgba(' + (pc.color === '#ef4444' ? '239,68,68' : pc.color === '#f59e0b' ? '245,158,11' : '59,130,246') + ',0.08),transparent);border-radius:50%;"></div>' +
          '<div style="padding:24px 28px;position:relative;">' +
            '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;">' +
              '<div style="display:flex;align-items:center;gap:14px;">' +
                '<div style="width:44px;height:44px;border-radius:12px;background:' + pc.bg + ';border:1px solid ' + pc.border + ';display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px ' + pc.color + '33;">' +
                  iconSvg(pc.icon, pc.color) +
                '</div>' +
                '<div>' +
                  '<div style="display:flex;gap:8px;align-items:center;margin-bottom:4px;">' +
                    '<span style="background:' + pc.bg + ';color:' + pc.color + ';border:1px solid ' + pc.border + ';padding:3px 10px;border-radius:12px;font-size:0.65rem;font-weight:700;text-transform:uppercase;">' + pc.label + '</span>' +
                    statusBadge(a.is_active) +
                  '</div>' +
                  '<div style="color:#e2e8f0;font-size:1.15rem;font-weight:800;">' + esc(a.title) + '</div>' +
                '</div>' +
              '</div>' +
              '<div style="display:flex;gap:6px;flex-shrink:0;">' +
                (canEdit ?
                  '<button onclick="window.__annEdit(' + a.id + ')" style="background:#1a2035;color:#94a3b8;border:1px solid #2a3040;border-radius:8px;padding:7px 14px;cursor:pointer;font-size:0.8rem;display:inline-flex;align-items:center;gap:6px;transition:all 0.2s;" onmouseenter="this.style.borderColor=\'#6366f1\';this.style.color=\'#a78bfa\'" onmouseleave="this.style.borderColor=\'#2a3040\';this.style.color=\'#94a3b8\'">' + iconSvg(icons.edit, 'currentColor') + ' Edit</button>' : '') +
                (isOwner ?
                  '<button onclick="window.__annDelete(' + a.id + ')" style="background:#1a2035;color:#94a3b8;border:1px solid #2a3040;border-radius:8px;padding:7px 14px;cursor:pointer;font-size:0.8rem;display:inline-flex;align-items:center;gap:6px;transition:all 0.2s;" onmouseenter="this.style.borderColor=\'#ef4444\';this.style.color=\'#f87171\'" onmouseleave="this.style.borderColor=\'#2a3040\';this.style.color=\'#94a3b8\'">' + iconSvg(icons.trash, 'currentColor') + ' Delete</button>' : '') +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +

        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px;">' +
          '<div style="background:#1a1f2e;border:1px solid #2a3040;border-radius:10px;padding:14px;">' +
            '<div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">' + iconSvg(icons.branch, '#64748b') + '<div style="color:#64748b;font-size:0.65rem;text-transform:uppercase;letter-spacing:1px;">Branch</div></div>' +
            '<div style="color:#e2e8f0;font-weight:600;font-size:0.9rem;">' + (a.branch_name || '<span style="color:#6366f1;">All Branches</span>') + '</div>' +
          '</div>' +
          '<div style="background:#1a1f2e;border:1px solid #2a3040;border-radius:10px;padding:14px;">' +
            '<div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">' + iconSvg(icons.user, '#64748b') + '<div style="color:#64748b;font-size:0.65rem;text-transform:uppercase;letter-spacing:1px;">Author</div></div>' +
            '<div style="display:flex;align-items:center;gap:8px;">' +
              '<div style="width:24px;height:24px;border-radius:6px;background:' + rc.bg + ';border:1px solid ' + rc.border + ';display:flex;align-items:center;justify-content:center;">' + iconSvg(rc.icon, rc.color) + '</div>' +
              '<div>' +
                '<div style="color:#e2e8f0;font-weight:600;font-size:0.85rem;">' + esc(creator) + '</div>' +
                '<div style="color:' + rc.color + ';font-size:0.6rem;font-weight:600;text-transform:uppercase;">' + rc.label + '</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div style="background:#1a1f2e;border:1px solid #2a3040;border-radius:10px;padding:14px;">' +
            '<div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">' + iconSvg(icons.calendar, '#64748b') + '<div style="color:#64748b;font-size:0.65rem;text-transform:uppercase;letter-spacing:1px;">Date Published</div></div>' +
            '<div style="color:#e2e8f0;font-weight:600;font-size:0.9rem;">' + dateStr + ' at ' + timeStr + '</div>' +
          '</div>' +
          '<div style="background:#1a1f2e;border:1px solid #2a3040;border-radius:10px;padding:14px;">' +
            '<div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">' + iconSvg('M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', '#64748b') + '<div style="color:#64748b;font-size:0.65rem;text-transform:uppercase;letter-spacing:1px;">Time Ago</div></div>' +
            '<div style="color:#e2e8f0;font-weight:600;font-size:0.9rem;">' + timeAgo(a.created_at) + '</div>' +
          '</div>' +
        '</div>' +

        '<div style="background:linear-gradient(180deg,#111827,#0d1117);border:1px solid #1e293b;border-radius:14px;padding:22px;">' +
          '<div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;padding-bottom:12px;border-bottom:1px solid #1e293b;">' +
            '<div style="width:28px;height:28px;border-radius:7px;background:rgba(59,130,246,0.1);display:flex;align-items:center;justify-content:center;">' + iconSvg(icons.content, '#3b82f6') + '</div>' +
            '<span style="color:#e2e8f0;font-weight:700;font-size:0.85rem;">Announcement Content</span>' +
          '</div>' +
          '<div style="color:#cbd5e1;font-size:0.88rem;line-height:1.7;white-space:pre-wrap;background:#080c18;border:1px solid #1e2a3a;border-radius:10px;padding:16px;">' + esc(a.content || 'No content provided.') + '</div>' +
        '</div>' +

      '</div>' +

      '</div></div></div>';
  }

  window.__annNew = function() { createNew(); };
  window.__annBack = function() { editingAnnouncement = null; view = 'list'; render(); };
  window.__annView = function(id) { var a = announcements.find(function(x) { return x.id === id; }); if (a) viewAnnouncement(a); };
  window.__annEdit = function(id) { var a = announcements.find(function(x) { return x.id === id; }); if (a) editAnnouncement(a); };
  window.__annSave = function() { saveAnnouncement(); };
  window.__annDelete = function(id) { deleteAnnouncement(id); };
  window.__annToggle = function(id, current) { toggleActive(id, current); };
  window.__annFilterPriority = async function(val) { filterPriority = val; await loadAnnouncements(); render(); };
  window.__annFilterBranch = async function(val) { filterBranch = val; await loadAnnouncements(); render(); };
  window.__annPriorityChange = function(val) {
    if (editingAnnouncement) editingAnnouncement.priority = val;
  };

  loadData();
}

Router.register('announcements', renderAdminAnnouncements);
