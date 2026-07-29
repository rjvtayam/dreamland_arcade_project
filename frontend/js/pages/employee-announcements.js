function renderEmployeeAnnouncements() {
  var app = document.getElementById('app');
  var user = Auth.getUser();
  var announcements = [];
  var expandedId = null;

  async function loadData() {
    announcements = await apiGet('/announcements/my');
    if (!Array.isArray(announcements)) announcements = [];
    render();
  }

  var priorityConfig = {
    urgent:   { color: '#ef4444', bg: '#ef444418', border: '#ef444444', glow: '#ef444422', label: 'Urgent', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
    important: { color: '#f59e0b', bg: '#f59e0b18', border: '#f59e0b44', glow: '#f59e0b22', label: 'Important', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    normal:    { color: '#3b82f6', bg: '#3b82f618', border: '#3b82f644', glow: '#3b82f622', label: 'Normal', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' }
  };

  var roleConfig = {
    owner:   { color: '#f59e0b', bg: '#f59e0b18', border: '#f59e0b44', label: 'Owner', icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' },
    admin:   { color: '#6366f1', bg: '#6366f118', border: '#6366f144', label: 'Admin', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
    employee: { color: '#22c55e', bg: '#22c55e18', border: '#22c55e44', label: 'Staff', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' }
  };

  var iconSvg = function(d, c) { return '<svg width="18" height="18" fill="none" stroke="' + c + '" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="' + d + '"/></svg>'; };

  function render() {
    var urgent = announcements.filter(function(a) { return a.priority === 'urgent'; }).length;
    var important = announcements.filter(function(a) { return a.priority === 'important'; }).length;

    var cardsHtml = '';
    if (announcements.length === 0) {
      cardsHtml =
        '<div style="text-align:center;padding:60px 20px;">' +
          '<div style="width:64px;height:64px;border-radius:16px;background:#1a2035;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;">' +
            iconSvg('M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z', '#475569') +
          '</div>' +
          '<div style="color:#94a3b8;font-weight:600;font-size:0.95rem;margin-bottom:4px;">No announcements yet</div>' +
          '<div style="color:#475569;font-size:0.8rem;">When management posts announcements, they will appear here.</div>' +
        '</div>';
    } else {
      announcements.forEach(function(a) {
        var pc = priorityConfig[a.priority] || priorityConfig.normal;
        var rc = roleConfig[a.creator_role] || roleConfig.employee;
        var dt = a.created_at ? new Date(a.created_at) : new Date();
        var dateStr = dt.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: '2-digit' });
        var timeStr = dt.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', hour12: true });
        var creator = a.creator_name || 'Unknown';
        var creatorInitials = creator.split(' ').map(function(w) { return w[0]; }).join('').substring(0, 2).toUpperCase();
        var isExpanded = expandedId === a.id;

        cardsHtml +=
          '<div onclick="window.__empAnnToggle(' + a.id + ')" style="position:relative;border-radius:14px;overflow:hidden;cursor:pointer;transition:all 0.3s ease;border:1px solid ' + (isExpanded ? pc.border : '#1e293b') + ';background:' + (isExpanded ? 'linear-gradient(135deg,#0f172a,#1a1030)' : 'linear-gradient(135deg,#0f172a,#1e293b)') + ';' + (isExpanded ? 'box-shadow:0 4px 24px ' + pc.glow + ';' : '') + '" onmouseenter="if(!' + isExpanded + '){this.style.borderColor=\'' + pc.border + '\';this.style.transform=\'translateY(-1px)\';this.style.boxShadow=\'0 4px 16px ' + pc.glow + '\'}" onmouseleave="if(!' + isExpanded + '){this.style.borderColor=\'#1e293b\';this.style.transform=\'translateY(0)\';this.style.boxShadow=\'none\'}">' +

            '<div style="position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,' + pc.color + ',' + pc.color + '66,' + pc.color + ');opacity:' + (isExpanded ? '0.8' : '0.3') + ';transition:opacity 0.3s;"></div>' +

            '<div style="padding:20px 24px;">' +

              '<div style="display:flex;align-items:flex-start;gap:14px;">' +

                '<div style="width:44px;height:44px;border-radius:12px;background:' + pc.bg + ';border:1px solid ' + pc.border + ';display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 2px 8px ' + pc.glow + ';">' +
                  iconSvg(pc.icon, pc.color) +
                '</div>' +

                '<div style="flex:1;min-width:0;">' +

                  '<div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;flex-wrap:wrap;">' +
                    '<div style="color:#e2e8f0;font-weight:700;font-size:1rem;">' + esc(a.title) + '</div>' +
                    '<span style="background:' + pc.bg + ';color:' + pc.color + ';border:1px solid ' + pc.border + ';padding:2px 8px;border-radius:10px;font-size:0.6rem;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">' + pc.label + '</span>' +
                  '</div>' +

                  '<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:8px;">' +

                    '<div style="display:flex;align-items:center;gap:6px;">' +
                      '<div style="width:20px;height:20px;border-radius:5px;background:linear-gradient(135deg,' + rc.color + ',' + rc.color + 'aa);display:flex;align-items:center;justify-content:center;">' +
                        iconSvg(rc.icon, 'white') +
                      '</div>' +
                      '<span style="color:' + rc.color + ';font-size:0.72rem;font-weight:600;">' + rc.label + '</span>' +
                    '</div>' +

                    '<div style="width:1px;height:12px;background:#2a3040;"></div>' +

                    '<div style="display:flex;align-items:center;gap:5px;color:#64748b;font-size:0.78rem;">' +
                      '<div style="width:20px;height:20px;border-radius:5px;background:linear-gradient(135deg,#6366f1,#8b5cf6);display:flex;align-items:center;justify-content:center;color:#fff;font-size:0.45rem;font-weight:700;">' + creatorInitials + '</div>' +
                      esc(creator) +
                    '</div>' +

                    '<div style="width:1px;height:12px;background:#2a3040;"></div>' +

                    '<div style="display:flex;align-items:center;gap:4px;color:#64748b;font-size:0.78rem;">' +
                      iconSvg('M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', '#475569') +
                      dateStr +
                    '</div>' +

                    '<div style="width:1px;height:12px;background:#2a3040;"></div>' +

                    '<div style="display:flex;align-items:center;gap:4px;color:#64748b;font-size:0.78rem;">' +
                      iconSvg('M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', '#475569') +
                      timeStr +
                    '</div>' +

                  '</div>' +

                  (a.branch_name && a.branch_name !== 'All Branches' ?
                    '<div style="display:inline-flex;align-items:center;gap:4px;background:#6366f118;color:#6366f1;border:1px solid #6366f144;padding:2px 8px;border-radius:8px;font-size:0.65rem;font-weight:600;margin-bottom:8px;">' +
                      iconSvg('M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4', '#6366f1') +
                      esc(a.branch_name) +
                    '</div>' : '') +

                  '<div style="color:' + (isExpanded ? '#c8ccd8' : '#64748b') + ';font-size:0.85rem;line-height:1.6;white-space:pre-wrap;' + (!isExpanded ? 'max-height:3em;overflow:hidden;text-overflow:ellipsis;' : '') + 'transition:color 0.3s;">' + esc(a.content) + '</div>' +

                '</div>' +

                '<div style="flex-shrink:0;align-self:center;">' +
                  '<div style="width:28px;height:28px;border-radius:8px;background:#1a2035;border:1px solid #2a3040;display:flex;align-items:center;justify-content:center;transition:all 0.3s;transform:rotate(' + (isExpanded ? '180deg' : '0deg') + ');">' +
                    iconSvg('M19 9l-7 7-7-7', '#64748b') +
                  '</div>' +
                '</div>' +

              '</div>' +

            '</div>' +

          '</div>';
      });
    }

    app.innerHTML = '<div class="layout">' + renderSidebar() +
      '<div class="main-content">' + renderNavbar('Announcements') +
      '<div class="page-content" id="page-body">' +

      '<div style="position:relative;margin-bottom:28px;">' +
        '<div style="position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,#3b82f6,#00f0ff,#3b82f6);border-radius:1px;opacity:0.6;"></div>' +
        '<div style="padding-top:20px;display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;">' +
          '<div style="display:flex;align-items:center;gap:14px;">' +
            '<div style="width:40px;height:40px;border-radius:10px;background:rgba(59,130,246,0.12);display:flex;align-items:center;justify-content:center;">' +
              iconSvg('M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z', '#3b82f6') +
            '</div>' +
            '<div>' +
              '<h2 style="color:#e2e8f0;margin:0;font-size:1.2rem;font-weight:800;">Announcements</h2>' +
              '<div style="color:#3b82f6;font-size:0.6rem;text-transform:uppercase;letter-spacing:2px;margin-top:2px;">Company Updates & Notices</div>' +
            '</div>' +
          '</div>' +
          '<div style="display:flex;align-items:center;gap:8px;">' +
            '<span style="color:#64748b;font-size:0.78rem;">' + announcements.length + ' announcement' + (announcements.length !== 1 ? 's' : '') + '</span>' +
          '</div>' +
        '</div>' +
      '</div>' +

      (urgent > 0 || important > 0 ?
        '<div style="display:flex;gap:10px;margin-bottom:20px;flex-wrap:wrap;">' +
          (urgent > 0 ?
            '<div style="display:flex;align-items:center;gap:8px;background:#ef444418;border:1px solid #ef444444;border-radius:10px;padding:8px 14px;">' +
              '<div style="width:8px;height:8px;border-radius:50%;background:#ef4444;box-shadow:0 0 8px #ef4444;"></div>' +
              '<span style="color:#ef4444;font-size:0.78rem;font-weight:600;">' + urgent + ' Urgent</span>' +
            '</div>' : '') +
          (important > 0 ?
            '<div style="display:flex;align-items:center;gap:8px;background:#f59e0b18;border:1px solid #f59e0b44;border-radius:10px;padding:8px 14px;">' +
              '<div style="width:8px;height:8px;border-radius:50%;background:#f59e0b;box-shadow:0 0 8px #f59e0b;"></div>' +
              '<span style="color:#f59e0b;font-size:0.78rem;font-weight:600;">' + important + ' Important</span>' +
            '</div>' : '') +
        '</div>' : '') +

      '<div style="display:flex;flex-direction:column;gap:12px;">' +
        cardsHtml +
      '</div>' +

      '</div></div></div>';
  }

  window.__empAnnToggle = function(id) {
    expandedId = expandedId === id ? null : id;
    render();
  };

  loadData();
}

Router.register('my-announcements', renderEmployeeAnnouncements);
