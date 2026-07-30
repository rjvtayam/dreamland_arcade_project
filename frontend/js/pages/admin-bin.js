function renderBin() {
  var app = document.getElementById('app');
  var items = [];
  var filterModule = '';

  async function loadItems() {
    var params = [];
    if (filterModule) params.push('source_module=' + filterModule);
    var url = '/recycle-bin' + (params.length ? '?' + params.join('&') : '');
    var data = await apiGet(url);
    items = Array.isArray(data) ? data : [];
  }

  async function restoreItem(id) {
    if (!await confirmAsync('Restore this item?')) return;
    await apiPost('/recycle-bin/' + id + '/restore', {});
    Toast.success('Item restored');
    await loadItems();
    render();
  }

  async function permanentDelete(id) {
    if (!await confirmAsync('Permanently delete this item? This cannot be undone.')) return;
    await apiDelete('/recycle-bin/' + id);
    Toast.success('Permanently deleted');
    await loadItems();
    render();
  }

  async function emptyBin(mod) {
    var msg = mod ? 'Empty all ' + mod + ' items from trash?' : 'Empty entire trash?';
    if (!await confirmAsync(msg)) return;
    var params = mod ? '?source_module=' + mod : '';
    await apiDelete('/recycle-bin' + params);
    Toast.success('Trash emptied');
    await loadItems();
    render();
  }

  function moduleConfig(m) {
    var configs = {
      proposals: { color: '#f59e0b', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', label: 'Proposals' },
      tracking: { color: '#6366f1', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', label: 'Tracking' },
      announcements: { color: '#22c55e', icon: 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z', label: 'Announcements' },
      files: { color: '#3b82f6', icon: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z', label: 'Files' },
    };
    return configs[m] || { color: '#94a3b8', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4', label: m };
  }

  async function render() {
    var user = Auth.getUser();
    var isOwner = user && user.role === 'owner';
    await loadItems();

    var modules = {};
    items.forEach(function(item) {
      if (!modules[item.source_module]) modules[item.source_module] = 0;
      modules[item.source_module]++;
    });

    var moduleTabs = '<button onclick="window.__binFilterModule(\'\')" style="background:' + (!filterModule ? '#6366f118' : 'transparent') + ';border:1px solid ' + (!filterModule ? '#6366f155' : '#1e293b') + ';border-radius:8px;padding:6px 14px;cursor:pointer;font-size:0.75rem;font-weight:600;color:' + (!filterModule ? '#a78bfa' : '#64748b') + ';display:inline-flex;align-items:center;gap:6px;">All</button>';
    Object.keys(modules).forEach(function(m) {
      var mc = moduleConfig(m);
      var active = filterModule === m;
      moduleTabs += '<button onclick="window.__binFilterModule(\'' + m + '\')" style="background:' + (active ? mc.color + '18' : 'transparent') + ';border:1px solid ' + (active ? mc.color + '55' : '#1e293b') + ';border-radius:8px;padding:6px 14px;cursor:pointer;font-size:0.75rem;font-weight:600;color:' + (active ? mc.color : '#64748b') + ';display:inline-flex;align-items:center;gap:6px;">' +
        '<svg width="14" height="14" fill="none" stroke="' + (active ? mc.color : '#64748b') + '" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="' + mc.icon + '"/></svg>' +
        mc.label + ' <span style="background:' + mc.color + '22;color:' + mc.color + ';padding:1px 7px;border-radius:10px;font-size:0.65rem;">' + modules[m] + '</span></button>';
    });

    var rows = '';
    items.forEach(function(item) {
      var mc = moduleConfig(item.source_module);
      var meta = item.metadata || {};
      var metaDetails = '';
      if (item.source_module === 'proposals') {
        metaDetails = '<span style="color:#64748b;font-size:0.7rem;">' + (meta.area || '') + ' &middot; ' + (meta.proposal_month || '') + '</span>';
      }

      rows += '<tr style="border-bottom:1px solid #1e2736;transition:background 0.15s;" onmouseenter="this.style.background=\'#1a1f2e22\'" onmouseleave="this.style.background=\'transparent\'">' +
        '<td style="padding:14px 16px;">' +
          '<div style="display:flex;align-items:center;gap:12px;">' +
            '<div style="width:40px;height:40px;border-radius:10px;background:' + mc.color + '18;border:1px solid ' + mc.color + '44;display:flex;align-items:center;justify-content:center;flex-shrink:0;">' +
              '<svg width="18" height="18" fill="none" stroke="' + mc.color + '" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="' + mc.icon + '"/></svg>' +
            '</div>' +
            '<div style="min-width:0;">' +
              '<div style="color:#e2e8f0;font-weight:600;font-size:0.88rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + esc(item.title) + '</div>' +
              '<div style="display:flex;align-items:center;gap:8px;margin-top:3px;">' +
                '<span style="background:' + mc.color + '18;color:' + mc.color + ';padding:2px 8px;border-radius:10px;font-size:0.6rem;font-weight:700;text-transform:uppercase;">' + mc.label + '</span>' +
                metaDetails +
              '</div>' +
            '</div>' +
          '</div>' +
        '</td>' +
        '<td style="padding:14px 16px;color:#64748b;font-size:0.78rem;">' + (item.deleted_by_name || '-') + '</td>' +
        '<td style="padding:14px 16px;color:#64748b;font-size:0.78rem;">' + timeAgo(item.deleted_at) + '</td>' +
        '<td style="padding:14px 16px;text-align:right;">' +
          '<div style="display:flex;gap:6px;justify-content:flex-end;">' +
            '<button onclick="window.__binRestore(' + item.id + ')" style="background:#1a2035;color:#22c55e;border:1px solid #22c55e44;border-radius:7px;padding:6px 10px;cursor:pointer;font-size:0.75rem;display:inline-flex;align-items:center;gap:5px;transition:all 0.2s;" onmouseenter="this.style.borderColor=\'#22c55e\';this.style.color=\'#4ade80\'" onmouseleave="this.style.borderColor=\'#22c55e44\';this.style.color=\'#22c55e\'">' +
              '<svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/></svg> Restore</button>' +
            (isOwner ?
              '<button onclick="window.__binDelete(' + item.id + ')" style="background:#1a2035;color:#ef4444;border:1px solid #ef444444;border-radius:7px;padding:6px 10px;cursor:pointer;font-size:0.75rem;display:inline-flex;align-items:center;gap:5px;transition:all 0.2s;" onmouseenter="this.style.borderColor=\'#ef4444\';this.style.color=\'#f87171\'" onmouseleave="this.style.borderColor=\'#ef444444\';this.style.color=\'#ef4444\'">' +
                '<svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg> Delete</button>' : '') +
          '</div>' +
        '</td>' +
      '</tr>';
    });

    app.innerHTML = '<div class="layout">' + renderSidebar() +
      '<div class="main-content">' + renderNavbar('Recycle Bin') +
      '<div class="page-content" id="page-body">' +

      '<div style="position:relative;margin-bottom:28px;">' +
        '<div style="position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,#ef4444,#f59e0b,#ef4444);border-radius:1px;opacity:0.6;"></div>' +
        '<div style="padding-top:20px;display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;">' +
          '<div style="display:flex;align-items:center;gap:14px;">' +
            '<div style="width:40px;height:40px;border-radius:10px;background:rgba(239,68,68,0.12);display:flex;align-items:center;justify-content:center;">' +
              '<svg width="20" height="20" fill="none" stroke="#ef4444" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>' +
            '</div>' +
            '<div>' +
              '<h2 style="color:#e2e8f0;margin:0;font-size:1.2rem;font-weight:800;">Recycle Bin</h2>' +
              '<div style="color:#ef4444;font-size:0.6rem;text-transform:uppercase;letter-spacing:2px;margin-top:2px;">Deleted Items from Across System</div>' +
            '</div>' +
          '</div>' +
          (isOwner && items.length > 0 ?
            '<button onclick="window.__binEmpty()" style="background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff;border:none;border-radius:8px;padding:8px 16px;cursor:pointer;font-weight:600;font-size:0.8rem;display:inline-flex;align-items:center;gap:6px;box-shadow:0 2px 8px #ef444430;">' +
              '<svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg> Empty Trash</button>' : '') +
        '</div>' +
      '</div>' +

      '<div style="display:flex;gap:6px;margin-bottom:16px;flex-wrap:wrap;align-items:center;">' + moduleTabs + '</div>' +

      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">' +
        '<span style="color:#64748b;font-size:0.78rem;">' + items.length + ' item' + (items.length !== 1 ? 's' : '') + ' in trash</span>' +
      '</div>' +

      '<div style="background:#1a1f2e;border:1px solid #2a3040;border-radius:12px;overflow:hidden;">' +
        '<table style="width:100%;border-collapse:collapse;font-size:0.82rem;">' +
        '<thead><tr style="border-bottom:2px solid #2a3040;background:#151a28;">' +
          '<th style="padding:10px 16px;color:#94a3b8;text-align:left;font-weight:600;">Item</th>' +
          '<th style="padding:10px 16px;color:#94a3b8;text-align:left;font-weight:600;">Deleted By</th>' +
          '<th style="padding:10px 16px;color:#94a3b8;text-align:left;font-weight:600;">Deleted</th>' +
          '<th style="padding:10px 16px;color:#94a3b8;text-align:right;font-weight:600;">Actions</th>' +
        '</tr></thead><tbody>' +
        (rows || '<tr><td colspan="4" style="padding:40px;color:#666;text-align:center;">' +
          '<div style="display:flex;flex-direction:column;align-items:center;gap:12px;">' +
            '<svg width="40" height="40" fill="none" stroke="#333" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>' +
            '<div style="color:#64748b;font-size:0.85rem;">Trash is empty</div>' +
          '</div>' +
        '</td></tr>') +
        '</tbody></table>' +
      '</div>' +

      '</div></div></div>';

    window.__binFilterModule = async function(val) {
      filterModule = val;
      await render();
    };
    window.__binRestore = function(id) { restoreItem(id); };
    window.__binDelete = function(id) { permanentDelete(id); };
    window.__binEmpty = function() { emptyBin(filterModule); };
  }

  render();
}

Router.register('bin', renderBin);
