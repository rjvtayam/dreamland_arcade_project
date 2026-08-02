function renderAdminProposals() {
  var app = document.getElementById('app');
  var proposals = [];
  var branches = [];
  var selectedBranch = '';
  var filterMonth = '';
  var filterStatus = '';
  var filterArea = '';
  var editingProposal = null;
  var view = 'list';



  async function loadData() {
    branches = await apiGet('/branches');
    if (!Array.isArray(branches)) branches = [];
    var user = Auth.getUser();
    if (user && user.role !== 'owner' && user.branch_id) {
      selectedBranch = String(user.branch_id);
    }
    await loadProposals();
    render();
  }

  async function loadProposals() {
    var params = [];
    if (selectedBranch) params.push('branch_id=' + selectedBranch);
    if (filterArea) params.push('area=' + filterArea);
    if (filterMonth) params.push('proposal_month=' + filterMonth);
    var url = '/proposals' + (params.length ? '?' + params.join('&') : '');
    proposals = await apiGet(url);
    if (!Array.isArray(proposals)) proposals = [];
  }

  function createNew() {
    var user = Auth.getUser();
    var now = new Date();
    var month = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
    editingProposal = {
      branch_id: user.role === 'owner' ? (branches.length ? branches[0].id : 1) : user.branch_id,
      area: filterArea || 'Arcade',
      title: '',
      description: '',
      proposal_month: month,
      amount: 0,
      status: 'draft'
    };
    view = 'edit';
    render();
  }

  function editProposal(p) {
    editingProposal = JSON.parse(JSON.stringify(p));
    view = 'edit';
    render();
  }

  function viewProposal(p) {
    editingProposal = JSON.parse(JSON.stringify(p));
    view = 'detail';
    render();
  }

  async function saveProposal() {
    var title = document.getElementById('p-title')?.value;
    var desc = document.getElementById('p-desc')?.value;
    var month = document.getElementById('p-month')?.value;
    var amount = parseInt(document.getElementById('p-amount')?.value) || 0;
    var branchId = parseInt(document.getElementById('p-branch')?.value) || editingProposal.branch_id;
    var area = document.getElementById('p-area')?.value || editingProposal.area;

    if (!title) { Toast.error('Title is required'); return; }

    var user = Auth.getUser();
    if (editingProposal.id) {
      await apiPut('/proposals/' + editingProposal.id, {
        title: title, description: desc, proposal_month: month, amount: amount
      });
      Toast.success('Proposal updated!');
    } else {
      await apiPost('/proposals', {
        branch_id: branchId, area: area, title: title, description: desc,
        proposal_month: month, amount: amount
      });
      Toast.success('Proposal created!');
    }
    editingProposal = null;
    view = 'list';
    await loadProposals();
    render();
  }

  async function submitProposal() {
    if (!editingProposal?.id) return;
    if (!await confirmAsync('Submit this proposal for owner review?')) return;
    await apiPost('/proposals/' + editingProposal.id + '/submit', {});
    Toast.success('Proposal submitted!');
    editingProposal = null;
    view = 'list';
    await loadProposals();
    render();
  }

  async function approveProposal(id) {
    if (!await confirmAsync('Approve this proposal?')) return;
    await apiPost('/proposals/' + id + '/approve', {});
    Toast.success('Proposal approved!');
    editingProposal = null;
    view = 'list';
    await loadProposals();
    render();
  }

  async function declineProposal(id) {
    var comment = prompt('Reason for declining (optional):');
    await apiPost('/proposals/' + id + '/decline', { owner_comment: comment || '' });
    Toast.success('Proposal declined');
    editingProposal = null;
    view = 'list';
    await loadProposals();
    render();
  }

  async function deleteProposal(id) {
    if (!await confirmAsync('Move this proposal to trash?')) return;
    await apiPost('/proposals/' + id + '/soft-delete', {});
    Toast.success('Moved to trash');
    editingProposal = null;
    view = 'list';
    await loadProposals();
    render();
  }

  async function restoreProposal(id) {
    if (!await confirmAsync('Restore this proposal?')) return;
    await apiPost('/proposals/' + id + '/restore', {});
    Toast.success('Proposal restored');
    editingProposal = null;
    view = 'list';
    await loadProposals();
    render();
  }

  async function permanentDeleteProposal(id) {
    if (!await confirmAsync('Permanently delete this proposal? This cannot be undone.')) return;
    await apiDelete('/proposals/' + id);
    Toast.success('Permanently deleted');
    editingProposal = null;
    view = 'list';
    await loadProposals();
    render();
  }

  function getPrintStyles(ac) {
    return '<style>' +
    '@import url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap");' +
    '@page{size:A4;margin:15mm 15mm 18mm 15mm;}' +
    '*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}' +
    'body{font-family:"Inter",sans-serif;font-size:10pt;color:#0f172a;line-height:1.6;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact;}' +

    /* Page frame */
    '.page{width:100%;min-height:100vh;position:relative;padding:0 0 50px 0;}' +
    '.top-accent{position:absolute;top:0;left:0;right:0;height:5px;background:linear-gradient(90deg,' + ac + ',#0ea5e9,' + ac + ');}' +
    '.corner-mark{position:absolute;top:12px;right:16px;font-family:"JetBrains Mono",monospace;font-size:0.5rem;font-weight:500;color:#94a3b8;letter-spacing:1px;text-transform:uppercase;}' +

    /* Header */
    '.header{padding:40px 36px 28px;position:relative;}' +
    '.header-grid{display:grid;grid-template-columns:1fr auto;gap:20px;align-items:start;}' +
    '.brand-wrap{position:relative;}' +
    '.brand-line{display:flex;align-items:center;gap:12px;margin-bottom:10px;}' +
    '.brand-icon{width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,' + ac + ',' + ac + 'cc);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px ' + ac + '30;}' +
    '.brand-icon svg{width:18px;height:18px;fill:none;stroke:#fff;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;}' +
    '.brand-text{font-size:0.58rem;font-weight:800;text-transform:uppercase;letter-spacing:5px;color:' + ac + ';}' +
    '.title{font-size:1.5rem;font-weight:900;color:#0f172a;line-height:1.2;letter-spacing:-0.8px;margin:0 0 8px 0;}' +
    '.subtitle{font-size:0.72rem;color:#64748b;font-weight:500;letter-spacing:0.3px;}' +
    '.header-meta{display:flex;flex-direction:column;align-items:flex-end;gap:8px;padding-top:4px;}' +
    '.area-chip{display:inline-flex;align-items:center;gap:6px;background:' + ac + ';color:#fff;font-size:0.58rem;font-weight:700;text-transform:uppercase;letter-spacing:2px;padding:6px 14px;border-radius:6px;box-shadow:0 2px 10px ' + ac + '30;}' +
    '.status-pill{display:inline-flex;align-items:center;gap:4px;font-size:0.55rem;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;padding:5px 12px;border-radius:20px;border:1.5px solid;}' +
    '.s-draft{color:#b45309;border-color:#fbbf24;background:#fef3c7;}' +
    '.s-submitted{color:#1d4ed8;border-color:#60a5fa;background:#dbeafe;}' +
    '.s-approved{color:#15803d;border-color:#4ade80;background:#dcfce7;}' +
    '.s-declined{color:#b91c1c;border-color:#f87171;background:#fee2e2;}' +

    /* Divider */
    '.header-divider{margin:0 36px;height:1px;background:linear-gradient(90deg,transparent,' + ac + '55,transparent);}' +
    '.header-divider::after{content:"";display:block;margin:-1px auto 0;width:60px;height:2px;background:' + ac + ';border-radius:1px;}' +

    /* Content */
    '.content{padding:24px 36px;color:#1e293b;font-size:10pt;line-height:1.7;}' +
    '.content div,.content span,.content td,.content th,.content li,.content p{color:#1e293b !important;}' +
    '.content h2{font-size:0.75rem;font-weight:800;text-transform:uppercase;letter-spacing:2px;color:' + ac + ' !important;margin:22px 0 12px;padding-bottom:8px;border-bottom:2px solid ' + ac + '30;position:relative;}' +
    '.content h2::after{content:"";position:absolute;bottom:-2px;left:0;width:40px;height:2px;background:' + ac + ';}' +
    '.content h3{font-size:0.68rem;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;color:#334155 !important;margin:16px 0 8px;padding:6px 0 6px 12px;border-left:3px solid ' + ac + ';background:' + ac + '06;}' +
    '.content p{margin:3px 0;color:#1e293b !important;}' +
    '.content ul,.content ol{margin:4px 0 6px 20px;}' +
    '.content li{margin:3px 0;color:#1e293b !important;}' +
    '.content strong{font-weight:700;color:#0f172a !important;}' +

    /* Tables */
    'table{width:100%;border-collapse:collapse;margin:12px 0;font-size:9pt;font-family:"Inter",sans-serif;}' +
    'thead th{background:' + ac + '12;color:' + ac + ' !important;font-weight:700;font-size:0.6rem;text-transform:uppercase;letter-spacing:1.2px;padding:10px 12px;text-align:left;border-bottom:2px solid ' + ac + '44;}' +
    'tbody td{padding:9px 12px;border-bottom:1px solid #e2e8f0;color:#1e293b !important;vertical-align:top;}' +
    'tbody tr:nth-child(even) td{background:#f8fafc;}' +
    'tbody tr:nth-child(odd) td{background:#ffffff;}' +
    'tbody tr:hover td{background:' + ac + '06;}' +
    '.proposal-table-wrap{border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;margin:14px 0;box-shadow:0 1px 4px rgba(0,0,0,0.04);}' +
    '.proposal-table-wrap table{margin:0;border:none;}' +
    '.proposal-table-wrap thead th{background:' + ac + '14;border-bottom:2px solid ' + ac + '44;}' +
    '.proposal-table-wrap tbody td{border-bottom:1px solid #f1f5f9;}' +
    '.proposal-table-wrap tbody tr:last-child td{border-bottom:none;}' +
    '.proposal-table-gutter{width:3px;background:' + ac + ' !important;padding:0 !important;border:none !important;}' +
    '.proposal-table-cell-total{color:#166534 !important;font-weight:800 !important;font-size:0.95rem !important;}' +
    '.proposal-table-cell-price{color:#166534 !important;font-weight:700 !important;font-family:"JetBrains Mono",monospace;font-size:0.85rem !important;}' +

    /* Special rows */
    '.total-row td{font-weight:700;color:' + ac + ' !important;border-top:2px solid ' + ac + ' !important;background:' + ac + '08 !important;}' +

    /* Green highlights */
    '.content *[style*="color:#22c55e"]{color:#166534 !important;}' +
    '.content *[style*="color:#f59e0b"]{color:#92400e !important;}' +
    '.content *[style*="color:#ef4444"]{color:#991b1b !important;}' +

    /* Footer */
    '.footer-section{position:relative;margin:30px 36px 0;padding:0;}' +
    '.footer-divider{height:1px;background:linear-gradient(90deg,transparent,#cbd5e1,transparent);margin-bottom:14px;}' +
    '.footer-grid{display:flex;justify-content:space-between;align-items:center;}' +
    '.footer-left{font-size:0.6rem;color:#64748b;font-weight:500;}' +
    '.footer-left strong{color:#334155;font-weight:700;}' +
    '.footer-right{font-size:0.55rem;color:#94a3b8;font-family:"JetBrains Mono",monospace;letter-spacing:0.5px;text-align:right;}' +
    '.bottom-accent{position:absolute;bottom:0;left:0;right:0;height:4px;background:linear-gradient(90deg,' + ac + ',#0ea5e9,' + ac + ');}' +

    '</style>';
  }

  function getPrintBody(p, ac, desc) {
    var statusClass = 's-' + (p.status || 'draft');
    var areaIcon = { Arcade: 'M14.5 10l-5 3V7l5 3z', Playhouse: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4', Cafe: 'M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z' };
    return '<div class="page">' +
      '<div class="top-accent"></div>' +
      '<div class="corner-mark">DREAMLAND ARCADE &bull; PROPOSAL DOCUMENT</div>' +

      '<div class="header">' +
        '<div class="header-grid">' +
          '<div class="brand-wrap">' +
            '<div class="brand-line">' +
              '<div class="brand-icon"><svg viewBox="0 0 24 24"><path d="' + (areaIcon[p.area] || areaIcon.Arcade) + '"/></svg></div>' +
              '<div class="brand-text">Dreamland Arcade</div>' +
            '</div>' +
            '<div class="title">' + esc(p.title) + '</div>' +
            '<div class="subtitle">' + esc(p.branch_name || 'Dreamland Arcade') + ' &mdash; ' + esc(p.proposal_month || 'August 2026') + '</div>' +
          '</div>' +
          '<div class="header-meta">' +
            '<div class="area-chip">' + esc(p.area) + '</div>' +
            '<div class="status-pill ' + statusClass + '">' + esc(p.status || 'draft') + '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="header-divider"></div>' +

      '<div class="content">' + desc + '</div>' +

      '<div class="footer-section">' +
        '<div class="footer-divider"></div>' +
        '<div class="footer-grid">' +
          '<div class="footer-left">Prepared by <strong>' + esc(p.creator_name || 'Admin') + '</strong> &bull; ' + esc(p.creator_role || 'admin') + '</div>' +
          '<div class="footer-right">' + esc(p.area) + ' PROPOSAL &bull; ' + esc(p.proposal_month || 'AUG 2026') + ' &bull; PAGE 1</div>' +
        '</div>' +
      '</div>' +
      '<div class="bottom-accent"></div>' +
    '</div>';
  }

  function printProposal(id) {
    var p = proposals.find(function(x) { return x.id === id; });
    if (!p) return;
    var areaColors = { Arcade: '#6366f1', Playhouse: '#d97706', Cafe: '#15803d' };
    var ac = areaColors[p.area] || '#6366f1';
    var desc = formatDescription(p.description || '');
    var win = window.open('', '_blank');
    win.document.write('<!DOCTYPE html><html><head><meta charset="utf-8"><title>' + esc(p.title) + '</title>');
    win.document.write(getPrintStyles(ac));
    win.document.write('</head><body>');
    win.document.write(getPrintBody(p, ac, desc));
    win.document.write('</body></html>');
    win.document.close();
    setTimeout(function() { win.print(); }, 700);
  }

  function downloadProposal(id) {
    var p = proposals.find(function(x) { return x.id === id; });
    if (!p) return;
    var areaColors = { Arcade: '#6366f1', Playhouse: '#d97706', Cafe: '#15803d' };
    var ac = areaColors[p.area] || '#6366f1';
    var desc = formatDescription(p.description || '');
    var doc = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>' + esc(p.title) + '</title>';
    doc += getPrintStyles(ac);
    doc += '</head><body>';
    doc += getPrintBody(p, ac, desc);
    doc += '</body></html>';
    var blob = new Blob([doc], { type: 'text/html' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    var safeName = (p.title || 'proposal').replace(/[^a-zA-Z0-9\s\-]/g, '').replace(/\s+/g, '_');
    a.download = safeName + '.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    Toast.success('Proposal saved — open and Print > Save as PDF');
  }

  async function saveOwnerComment(id) {
    var comment = document.getElementById('owner-comment')?.value;
    await apiPut('/proposals/' + id, { owner_comment: comment });
    Toast.success('Comment saved!');
  }

  function statusBadge(status) {
    var colors = {
      draft: { bg: '#f59e0b22', color: '#f59e0b', border: '#f59e0b55', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
      submitted: { bg: '#3b82f622', color: '#3b82f6', border: '#3b82f655', icon: 'M12 19l9 2-9-18-9 18 9-2zm0 0v-8' },
      approved: { bg: '#22c55e22', color: '#22c55e', border: '#22c55e55', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
      declined: { bg: '#ef444422', color: '#ef4444', border: '#ef444455', icon: 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636' }
    };
    var c = colors[status] || colors.draft;
    return '<span style="background:' + c.bg + ';color:' + c.color + ';border:1px solid ' + c.border + ';padding:3px 10px;border-radius:12px;font-size:0.65rem;font-weight:700;text-transform:uppercase;display:inline-flex;align-items:center;gap:4px;">' +
      '<svg width="12" height="12" fill="none" stroke="' + c.color + '" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="' + c.icon + '"/></svg>' +
      status + '</span>';
  }

  function render() {
    var user = Auth.getUser();
    var isOwner = user && user.role === 'owner';

    if (view === 'edit' && editingProposal) return renderEditor(isOwner);
    if (view === 'detail' && editingProposal) return renderDetail(isOwner);

    var now = new Date();
    var currentMonth = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
    var monthSet = {};
    proposals.forEach(function(p) {
      if (p.proposal_month) monthSet[p.proposal_month] = true;
    });
    var monthKeys = Object.keys(monthSet).sort().reverse();
    var monthOptions = monthKeys.map(function(val) {
      var parts = val.split('-');
      var d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1);
      var label = d.toLocaleString('default', { month: 'long', year: 'numeric' });
      return '<option value="' + val + '"' + (filterMonth === val ? ' selected' : '') + '>' + label + '</option>';
    }).join('');

    var filteredProposals = proposals;
    if (filterStatus) filteredProposals = proposals.filter(function(p) { return p.status === filterStatus; });

    var areas = [
      { id: '', icon: 'M4 6h16M4 10h16M4 14h16M4 18h16', label: 'All Areas', color: '#94a3b8' },
      { id: 'Arcade', icon: 'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z', label: 'Arcade', color: '#6366f1' },
      { id: 'Playhouse', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', label: 'Playhouse', color: '#22c55e' },
      { id: 'Cafe', icon: 'M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z M6 1v3 M10 1v3 M14 1v3', label: 'Cafe', color: '#f59e0b' }
    ];

    var areaTabs = areas.map(function(a) {
      var active = filterArea === a.id;
      var bg = active ? a.color + '18' : 'transparent';
      var border = active ? a.color + '55' : '#1e293b';
      var textColor = active ? a.color : '#64748b';
      return '<button onclick="window.__proposalFilterArea(\'' + a.id + '\')" style="background:' + bg + ';border:1px solid ' + border + ';border-radius:8px;padding:6px 14px;cursor:pointer;font-size:0.75rem;font-weight:600;color:' + textColor + ';display:inline-flex;align-items:center;gap:6px;transition:all 0.2s;">' +
        '<svg width="14" height="14" fill="none" stroke="' + textColor + '" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="' + a.icon + '"/></svg>' +
        a.label + '</button>';
    }).join('');

    var rows = '';
    filteredProposals.forEach(function(p) {
      var canEdit = isOwner || p.created_by === user.id;
      var areaColors = { Arcade: '#6366f1', Playhouse: '#22c55e', Cafe: '#f59e0b' };
      var ac = areaColors[p.area] || '#94a3b8';
      var areaIcons = {
        Arcade: 'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
        Playhouse: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
        Cafe: 'M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z M6 1v3 M10 1v3 M14 1v3'
      };
      var roleConfig = { owner: { color: '#f59e0b', label: 'Owner' }, admin: { color: '#6366f1', label: 'Admin' }, employee: { color: '#22c55e', label: 'Staff' } };
      var rc = roleConfig[p.creator_role] || { color: '#94a3b8', label: p.creator_role || '-' };
      var desc = (p.description || '');
      var featureCount = (desc.match(/===/g) || []).length / 2;
      rows += '<tr style="border-bottom:1px solid #1e2736;cursor:pointer;transition:background 0.15s;" onmouseenter="this.style.background=\'#1a1f2e22\'" onmouseleave="this.style.background=\'transparent\'" onclick="window.__proposalView(' + p.id + ')">' +
        '<td style="padding:12px 14px;">' +
          '<div style="display:flex;align-items:center;gap:10px;">' +
            '<div style="width:36px;height:36px;border-radius:9px;background:' + ac + '18;border:1px solid ' + ac + '44;display:flex;align-items:center;justify-content:center;flex-shrink:0;">' +
              '<svg width="18" height="18" fill="none" stroke="' + ac + '" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="' + (areaIcons[p.area] || areaIcons.Arcade) + '"/></svg>' +
            '</div>' +
            '<div>' +
              '<div style="color:#e2e8f0;font-weight:700;font-size:0.88rem;">' + esc(p.title) + '</div>' +
              '<div style="color:#64748b;font-size:0.7rem;margin-top:2px;">' + formatMonth(p.proposal_month) + '</div>' +
            '</div>' +
          '</div>' +
        '</td>' +
        '<td style="padding:12px 14px;"><span style="background:' + ac + '18;color:' + ac + ';border:1px solid ' + ac + '44;padding:3px 10px;border-radius:12px;font-size:0.65rem;font-weight:700;text-transform:uppercase;">' + (p.area || '-') + '</span></td>' +
        '<td style="padding:12px 14px;color:#94a3b8;font-size:0.8rem;">' + (p.branch_name || '-') + '</td>' +
        '<td style="padding:12px 14px;">' +
          '<div style="display:flex;align-items:center;gap:6px;">' +
            '<div style="width:20px;height:20px;border-radius:5px;background:' + rc.color + '18;border:1px solid ' + rc.color + '44;display:flex;align-items:center;justify-content:center;">' +
              '<svg width="12" height="12" fill="none" stroke="' + rc.color + '" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>' +
            '</div>' +
            '<div>' +
              '<div style="color:#94a3b8;font-size:0.78rem;">' + esc(p.creator_name || '-') + '</div>' +
              '<div style="color:' + rc.color + ';font-size:0.6rem;font-weight:600;text-transform:uppercase;">' + rc.label + '</div>' +
            '</div>' +
          '</div>' +
        '</td>' +
        '<td style="padding:12px 14px;color:#22c55e;font-weight:600;">' + formatCurrency(p.amount || 0) + '</td>' +
        '<td style="padding:12px 14px;">' + statusBadge(p.status) + '</td>' +
        '<td style="padding:12px 14px;text-align:right;">' +
          (canEdit && p.status !== 'approved' ?
            '<button onclick="event.stopPropagation();window.__proposalEdit(' + p.id + ')" style="background:#1a2035;color:#94a3b8;border:1px solid #2a3040;border-radius:6px;padding:5px 8px;cursor:pointer;transition:all 0.2s;" onmouseenter="this.style.borderColor=\'#6366f1\';this.style.color=\'#a78bfa\'" onmouseleave="this.style.borderColor=\'#2a3040\';this.style.color=\'#94a3b8\'">' +
              '<svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg></button>' : '') +
          (isOwner && p.status === 'submitted' ?
            '<button onclick="event.stopPropagation();window.__proposalApprove(' + p.id + ')" style="background:#1a2035;color:#22c55e;border:1px solid #22c55e44;border-radius:6px;padding:5px 8px;cursor:pointer;transition:all 0.2s;" onmouseenter="this.style.borderColor=\'#22c55e\';this.style.transform=\'translateY(-1px)\'" onmouseleave="this.style.borderColor=\'#22c55e44\';this.style.transform=\'translateY(0)\'">' +
              '<svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg></button>' +
            '<button onclick="event.stopPropagation();window.__proposalDecline(' + p.id + ')" style="background:#1a2035;color:#ef4444;border:1px solid #ef444444;border-radius:6px;padding:5px 8px;cursor:pointer;transition:all 0.2s;" onmouseenter="this.style.borderColor=\'#ef4444\';this.style.transform=\'translateY(-1px)\'" onmouseleave="this.style.borderColor=\'#ef444444\';this.style.transform=\'translateY(0)\'">' +
              '<svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg></button>' : '') +
          (canEdit && p.status !== 'approved' && p.status !== 'submitted' ?
            '<button onclick="event.stopPropagation();window.__proposalDelete(' + p.id + ')" style="background:#1a2035;color:#ef4444;border:1px solid #ef444444;border-radius:6px;padding:5px 8px;cursor:pointer;transition:all 0.2s;" onmouseenter="this.style.borderColor=\'#ef4444\';this.style.color=\'#f87171\'" onmouseleave="this.style.borderColor=\'#ef444444\';this.style.color=\'#ef4444\'">' +
              '<svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>' : '') +
        '</td>' +
      '</tr>';
    });

    var stats = { draft: 0, submitted: 0, approved: 0, declined: 0 };
    proposals.forEach(function(p) { if (stats[p.status] !== undefined) stats[p.status]++; });

    app.innerHTML = '<div class="layout">' + renderSidebar() +
      '<div class="main-content">' + renderNavbar('Proposals') +
      '<div class="page-content" id="page-body">' +

      '<div style="position:relative;margin-bottom:28px;">' +
        '<div style="position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,#f59e0b,#22c55e,#f59e0b);border-radius:1px;opacity:0.6;"></div>' +
        '<div style="padding-top:20px;display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;">' +
          '<div style="display:flex;align-items:center;gap:14px;">' +
            '<div style="width:40px;height:40px;border-radius:10px;background:rgba(245,158,11,0.12);display:flex;align-items:center;justify-content:center;"><svg width="20" height="20" fill="none" stroke="#f59e0b" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg></div>' +
            '<div>' +
              '<h2 style="color:#e2e8f0;margin:0;font-size:1.2rem;font-weight:800;">Proposals</h2>' +
              '<div style="color:#f59e0b;font-size:0.6rem;text-transform:uppercase;letter-spacing:2px;margin-top:2px;">Monthly Business Proposals</div>' +
            '</div>' +
          '</div>' +
          '<button onclick="window.__proposalNew()" style="background:linear-gradient(135deg,#f59e0b,#f59e0bcc);color:#fff;border:none;border-radius:8px;padding:8px 16px;cursor:pointer;font-weight:600;font-size:0.8rem;box-shadow:0 2px 8px #f59e0b30;">+ New Proposal</button>' +
        '</div>' +
      '</div>' +

      '<div style="display:flex;gap:6px;margin-bottom:16px;flex-wrap:wrap;align-items:center;">' + areaTabs + '</div>' +

      '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:20px;">' +
        '<div style="background:linear-gradient(135deg,#0f172a,#1e293b);border:1px solid #1e293b;border-radius:12px;padding:14px;">' +
          '<div style="color:#64748b;font-size:0.65rem;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Draft</div>' +
          '<div style="color:#f59e0b;font-size:1.4rem;font-weight:800;">' + stats.draft + '</div>' +
        '</div>' +
        '<div style="background:linear-gradient(135deg,#0f172a,#1e293b);border:1px solid #1e293b;border-radius:12px;padding:14px;">' +
          '<div style="color:#64748b;font-size:0.65rem;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Submitted</div>' +
          '<div style="color:#3b82f6;font-size:1.4rem;font-weight:800;">' + stats.submitted + '</div>' +
        '</div>' +
        '<div style="background:linear-gradient(135deg,#0f172a,#1e293b);border:1px solid #1e293b;border-radius:12px;padding:14px;">' +
          '<div style="color:#64748b;font-size:0.65rem;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Approved</div>' +
          '<div style="color:#22c55e;font-size:1.4rem;font-weight:800;">' + stats.approved + '</div>' +
        '</div>' +
        '<div style="background:linear-gradient(135deg,#0f172a,#1e293b);border:1px solid #1e293b;border-radius:12px;padding:14px;">' +
          '<div style="color:#64748b;font-size:0.65rem;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Declined</div>' +
          '<div style="color:#ef4444;font-size:1.4rem;font-weight:800;">' + stats.declined + '</div>' +
        '</div>' +
      '</div>' +

      '<div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap;align-items:center;">' +
        '<select id="filter-month" onchange="window.__proposalFilterMonth(this.value)" style="background:#0d1117;border:1px solid #1e293b;border-radius:8px;padding:7px 12px;color:#e2e8f0;font-size:0.8rem;cursor:pointer;">' +
          '<option value="">All Months</option>' + monthOptions +
        '</select>' +
        '<select id="filter-status" onchange="window.__proposalFilterStatus(this.value)" style="background:#0d1117;border:1px solid #1e293b;border-radius:8px;padding:7px 12px;color:#e2e8f0;font-size:0.8rem;cursor:pointer;">' +
          '<option value="">All Status</option>' +
          '<option value="draft"' + (filterStatus === 'draft' ? ' selected' : '') + '>Draft</option>' +
          '<option value="submitted"' + (filterStatus === 'submitted' ? ' selected' : '') + '>Submitted</option>' +
          '<option value="approved"' + (filterStatus === 'approved' ? ' selected' : '') + '>Approved</option>' +
          '<option value="declined"' + (filterStatus === 'declined' ? ' selected' : '') + '>Declined</option>' +
        '</select>' +
        '<span style="color:#64748b;font-size:0.75rem;margin-left:auto;">' + filteredProposals.length + ' proposals</span>' +
      '</div>' +

      '<div style="background:#1a1f2e;border:1px solid #2a3040;border-radius:12px;overflow:hidden;">' +
        '<table style="width:100%;border-collapse:collapse;font-size:0.82rem;">' +
        '<thead><tr style="border-bottom:2px solid #2a3040;background:#151a28;">' +
          '<th style="padding:10px 14px;color:#94a3b8;text-align:left;font-weight:600;">Proposal</th>' +
          '<th style="padding:10px 14px;color:#94a3b8;text-align:left;font-weight:600;">Area</th>' +
          '<th style="padding:10px 14px;color:#94a3b8;text-align:left;font-weight:600;">Branch</th>' +
          '<th style="padding:10px 14px;color:#94a3b8;text-align:left;font-weight:600;">Created By</th>' +
          '<th style="padding:10px 14px;color:#94a3b8;text-align:left;font-weight:600;">Amount</th>' +
          '<th style="padding:10px 14px;color:#94a3b8;text-align:left;font-weight:600;">Status</th>' +
          '<th style="padding:10px 14px;color:#94a3b8;text-align:right;font-weight:600;">Actions</th>' +
        '</tr></thead><tbody>' +
        (rows || '<tr><td colspan="7" style="padding:30px;color:#666;text-align:center;">No proposals found</td></tr>') +
        '</tbody></table>' +
      '</div>' +

      '</div></div></div>';
  }

  function renderEditor(isOwner) {
    var p = editingProposal;
    var isNew = !p.id;
    var user = Auth.getUser();
    var branchOptions = '';
    if (isOwner) {
      branches.forEach(function(b) {
        branchOptions += '<option value="' + b.id + '"' + (p.branch_id === b.id ? ' selected' : '') + '>' + esc(b.name) + '</option>';
      });
    }

    var now = new Date();
    var monthOptions = '';
    for (var i = 0; i < 12; i++) {
      var d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      var val = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
      var label = d.toLocaleString('default', { month: 'long', year: 'numeric' });
      monthOptions += '<option value="' + val + '"' + (p.proposal_month === val ? ' selected' : '') + '>' + label + '</option>';
    }

    var iconSvg = function(d, c, s) { s = s || 16; return '<svg width="' + s + '" height="' + s + '" fill="none" stroke="' + c + '" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="' + d + '"/></svg>'; };
    var icons = {
      title: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
      month: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
      amount: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      desc: 'M4 6h16M4 12h16M4 18h7',
      branch: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
      area: 'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      save: 'M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4',
      send: 'M12 19l9 2-9-18-9 18 9-2zm0 0v-8',
      back: 'M10 19l-7-7m0 0l7-7m-7 7h18',
      check: 'M5 13l4 4L19 7',
    };

    var ac = p.area === 'Playhouse' ? '#22c55e' : p.area === 'Cafe' ? '#f59e0b' : '#6366f1';
    var areaIcon = p.area === 'Playhouse' ? 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'
      : p.area === 'Cafe' ? 'M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z M6 1v3 M10 1v3 M14 1v3'
      : 'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z';

    var fieldWrap = 'margin-bottom:14px;';
    var labelStyle = 'color:#64748b;font-size:0.68rem;font-weight:600;text-transform:uppercase;letter-spacing:1.2px;margin-bottom:5px;display:flex;align-items:center;gap:5px;';
    var inputStyle = 'width:100%;background:#080c18;border:1px solid #1e293b;border-radius:10px;padding:10px 12px 10px 34px;color:#e2e8f0;font-size:0.85rem;transition:all 0.25s ease;outline:none;box-sizing:border-box;';
    var inputFocus = 'onfocus="this.style.borderColor=\'' + ac + '\';this.style.boxShadow=\'0 0 0 3px ' + ac + '15\';this.style.background=\'#0a0e1a\'" onblur="this.style.borderColor=\'#1e293b\';this.style.boxShadow=\'none\';this.style.background=\'#080c18\'"';
    var selectStyle = 'width:100%;background:#080c18;border:1px solid #1e293b;border-radius:10px;padding:10px 12px 10px 34px;color:#e2e8f0;font-size:0.85rem;transition:all 0.25s ease;outline:none;cursor:pointer;box-sizing:border-box;appearance:none;background-image:url(\"data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' fill=\'%2394a3b8\' viewBox=\'0 0 24 24\'%3E%3Cpath d=\'M7 10l5 5 5-5z\'/%3E%3C/svg%3E\");background-repeat:no-repeat;background-position:right 12px center;';
    var iconInField = function(iconD) { return '<span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);pointer-events:none;opacity:0.4;">' + iconSvg(iconD, '#64748b') + '</span>'; };

    app.innerHTML = '<div class="layout">' + renderSidebar() +
      '<div class="main-content">' + renderNavbar(isNew ? 'New Proposal' : 'Edit Proposal') +
      '<div class="page-content" id="page-body">' +

      '<div style="max-width:920px;margin:0 auto;">' +

        '<div style="margin-bottom:18px;display:flex;align-items:center;gap:10px;">' +
          '<button onclick="window.__proposalBack()" style="background:transparent;color:#64748b;border:1px solid #1e293b;border-radius:8px;padding:6px 14px;cursor:pointer;font-size:0.78rem;display:inline-flex;align-items:center;gap:5px;transition:all 0.2s;font-family:inherit;" onmouseenter="this.style.color=\'#e2e8f0\';this.style.borderColor=\'#334155\';this.style.background=\'#111827\'" onmouseleave="this.style.color=\'#64748b\';this.style.borderColor=\'#1e293b\';this.style.background=\'transparent\'">' + iconSvg(icons.back, 'currentColor') + ' Back</button>' +
          '<div style="height:16px;width:1px;background:#1e293b;"></div>' +
          '<span style="color:#475569;font-size:0.75rem;">' + (isNew ? 'Create new proposal for owner review' : 'Editing proposal') + '</span>' +
        '</div>' +

        '<div id="proposal-header-banner" style="position:relative;border-radius:16px;overflow:hidden;margin-bottom:22px;background:linear-gradient(135deg,#0f172a 0%,' + ac + '06 40%,' + ac + '03 60%,#0f172a 100%);border:1px solid ' + ac + '18;">' +
          '<div style="position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,' + ac + ',transparent);opacity:0.6;"></div>' +
          '<div style="position:absolute;top:-50px;right:-50px;width:140px;height:140px;background:radial-gradient(circle,' + ac + '08,transparent 70%);border-radius:50%;"></div>' +
          '<div style="position:absolute;bottom:-40px;left:30%;width:100px;height:100px;background:radial-gradient(circle,' + ac + '05,transparent 70%);border-radius:50%;"></div>' +
          '<div style="padding:22px 26px;position:relative;">' +
            '<div style="display:flex;align-items:center;gap:14px;">' +
              '<div id="proposal-header-icon-wrap" style="width:46px;height:46px;border-radius:13px;background:linear-gradient(135deg,' + ac + 'dd,' + ac + '88);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 20px ' + ac + '25;border:1px solid ' + ac + '44;">' +
                '<span id="proposal-header-icon">' + iconSvg(areaIcon, 'white', 22) + '</span>' +
              '</div>' +
              '<div>' +
                '<div id="proposal-header-area" style="color:' + ac + ';font-size:0.58rem;font-weight:700;text-transform:uppercase;letter-spacing:2.5px;margin-bottom:3px;opacity:0.9;">' + (p.area || 'Arcade') + ' Area</div>' +
                '<div style="color:#e2e8f0;font-size:1.1rem;font-weight:800;letter-spacing:-0.3px;">' + (isNew ? 'Create New Proposal' : esc(p.title)) + '</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +

        '<div style="display:grid;grid-template-columns:340px 1fr;gap:18px;">' +

          '<div style="background:#111827;border:1px solid #1e293b;border-radius:14px;padding:20px;">' +
            '<div style="display:flex;align-items:center;gap:8px;margin-bottom:16px;padding-bottom:10px;border-bottom:1px solid #1e293b;">' +
              '<div style="width:6px;height:6px;border-radius:50%;background:' + ac + ';box-shadow:0 0 8px ' + ac + '66;"></div>' +
              '<span style="color:#94a3b8;font-weight:700;font-size:0.75rem;text-transform:uppercase;letter-spacing:1px;">Configuration</span>' +
            '</div>' +

            (isOwner ? '<div style="' + fieldWrap + '">' +
              '<label style="' + labelStyle + '">' + iconSvg(icons.branch, '#475569', 12) + ' Branch</label>' +
              '<div style="position:relative;">' + iconInField(icons.branch) +
              '<select id="p-branch" style="' + selectStyle + '" ' + inputFocus + '>' + branchOptions + '</select></div>' +
            '</div>' : '') +

            '<div style="' + fieldWrap + '">' +
              '<label style="' + labelStyle + '">' + iconSvg(icons.area, '#475569', 12) + ' Area</label>' +
              '<div style="position:relative;">' + iconInField(icons.area) +
              '<select id="p-area" style="' + selectStyle + '" ' + inputFocus + ' onchange="window.__proposalChangeArea(this.value)">' +
                '<option value="Arcade"' + (p.area === 'Arcade' ? ' selected' : '') + '>Arcade</option>' +
                '<option value="Playhouse"' + (p.area === 'Playhouse' ? ' selected' : '') + '>Playhouse</option>' +
                '<option value="Cafe"' + (p.area === 'Cafe' ? ' selected' : '') + '>Cafe</option>' +
              '</select></div>' +
            '</div>' +

            '<div style="' + fieldWrap + '">' +
              '<label style="' + labelStyle + '">' + iconSvg(icons.month, '#475569', 12) + ' Month</label>' +
              '<div style="position:relative;">' + iconInField(icons.month) +
              '<select id="p-month" style="' + selectStyle + '" ' + inputFocus + '>' + monthOptions + '</select></div>' +
            '</div>' +

            '<div style="' + fieldWrap + '">' +
              '<label style="' + labelStyle + '">' + iconSvg(icons.amount, '#475569', 12) + ' Budget</label>' +
              '<div style="position:relative;">' + iconInField(icons.amount) +
              '<input type="number" id="p-amount" min="0" value="' + (p.amount || 0) + '" placeholder="0" style="' + inputStyle.replace('#e2e8f0', '#22c55e') + '" ' + inputFocus + '></div>' +
            '</div>' +
          '</div>' +

          '<div style="display:flex;flex-direction:column;gap:18px;">' +

            '<div style="background:#111827;border:1px solid #1e293b;border-radius:14px;padding:18px 20px;">' +
              '<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">' +
                '<div style="width:6px;height:6px;border-radius:50%;background:#6366f1;box-shadow:0 0 8px #6366f166;"></div>' +
                '<span style="color:#94a3b8;font-weight:700;font-size:0.75rem;text-transform:uppercase;letter-spacing:1px;">Title</span>' +
              '</div>' +
              '<div style="position:relative;">' + iconInField(icons.title) +
              '<input type="text" id="p-title" value="' + esc(p.title || '') + '" placeholder="e.g. August 2026 Arcade Promotions" style="' + inputStyle + '" ' + inputFocus + '></div>' +
            '</div>' +

            '<div style="background:#111827;border:1px solid #1e293b;border-radius:14px;padding:18px 20px;display:flex;flex-direction:column;flex:1;">' +
              '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">' +
                '<div style="display:flex;align-items:center;gap:8px;">' +
                  '<div style="width:6px;height:6px;border-radius:50%;background:#a78bfa;box-shadow:0 0 8px #a78bfa66;"></div>' +
                  '<span style="color:#94a3b8;font-weight:700;font-size:0.75rem;text-transform:uppercase;letter-spacing:1px;">Description</span>' +
                '</div>' +
                '<span style="color:#334155;font-size:0.68rem;">monospace</span>' +
              '</div>' +
              '<div style="flex:1;">' +
                '<textarea id="p-desc" rows="10" placeholder="Write your proposal here..." style="width:100%;height:300px;background:#080c18;border:1px solid #1e293b;border-radius:10px;padding:14px 16px;color:#e2e8f0;font-size:0.82rem;resize:vertical;font-family:Consolas,Monaco,\'Courier New\',monospace;line-height:1.65;transition:all 0.25s ease;outline:none;box-sizing:border-box;tab-size:2;" ' + inputFocus + '>' + esc(p.description || '') + '</textarea>' +
              '</div>' +
            '</div>' +

          '</div>' +

        '</div>' +

        '<div class="qi-bar" style="margin-top:24px;">' +
          '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">' +
            '<div class="qi-label">' +
              '<svg width="14" height="14" fill="none" stroke="#a78bfa" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>' +
              '<span>Quick Insert</span>' +
            '</div>' +
            '<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;">' +
              '<button onclick="window.__proposalInsert(\'=== SECTION HEADER\\n\')" onmouseenter="this.style.background=\'rgba(99,102,241,0.12)\';this.style.borderColor=\'rgba(99,102,241,0.45)\';this.style.color=\'#c4b5fd\';this.style.boxShadow=\'0 0 12px rgba(99,102,241,0.15),inset 0 0 12px rgba(99,102,241,0.06)\'" onmouseleave="this.style.background=\'rgba(15,17,30,0.6)\';this.style.borderColor=\'rgba(99,102,241,0.2)\';this.style.color=\'#a78bfa\';this.style.boxShadow=\'none\'" style="background:rgba(15,17,30,0.6);color:#a78bfa;border:1px solid rgba(99,102,241,0.2);border-radius:8px;padding:6px 12px;cursor:pointer;font-size:0.7rem;font-weight:600;font-family:inherit;transition:all 0.25s cubic-bezier(0.4,0,0.2,1);display:inline-flex;align-items:center;gap:6px;white-space:nowrap;backdrop-filter:blur(8px);">' +
                '<svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7"/></svg>' +
                'Section' +
              '</button>' +
              '<button onclick="window.__proposalInsert(\'---\\n\')" onmouseenter="this.style.background=\'rgba(100,116,139,0.1)\';this.style.borderColor=\'rgba(100,116,139,0.35)\';this.style.color=\'#94a3b8\';this.style.boxShadow=\'0 0 12px rgba(100,116,139,0.1),inset 0 0 12px rgba(100,116,139,0.05)\'" onmouseleave="this.style.background=\'rgba(15,17,30,0.6)\';this.style.borderColor=\'rgba(100,116,139,0.15)\';this.style.color=\'#64748b\';this.style.boxShadow=\'none\'" style="background:rgba(15,17,30,0.6);color:#64748b;border:1px solid rgba(100,116,139,0.15);border-radius:8px;padding:6px 12px;cursor:pointer;font-size:0.7rem;font-weight:600;font-family:inherit;transition:all 0.25s cubic-bezier(0.4,0,0.2,1);display:inline-flex;align-items:center;gap:6px;white-space:nowrap;backdrop-filter:blur(8px);">' +
                '<svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"/></svg>' +
                'Divider' +
              '</button>' +
              '<button onclick="window.__proposalInsert(\'1. \\n2. \\n3. \\n\')" onmouseenter="this.style.background=\'rgba(59,130,246,0.1)\';this.style.borderColor=\'rgba(59,130,246,0.4)\';this.style.color=\'#93c5fd\';this.style.boxShadow=\'0 0 12px rgba(59,130,246,0.1),inset 0 0 12px rgba(59,130,246,0.05)\'" onmouseleave="this.style.background=\'rgba(15,17,30,0.6)\';this.style.borderColor=\'rgba(59,130,246,0.18)\';this.style.color=\'#60a5fa\';this.style.boxShadow=\'none\'" style="background:rgba(15,17,30,0.6);color:#60a5fa;border:1px solid rgba(59,130,246,0.18);border-radius:8px;padding:6px 12px;cursor:pointer;font-size:0.7rem;font-weight:600;font-family:inherit;transition:all 0.25s cubic-bezier(0.4,0,0.2,1);display:inline-flex;align-items:center;gap:6px;white-space:nowrap;backdrop-filter:blur(8px);">' +
                '<svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 6h13M8 12h13M8 19h13M3 6h.01M3 12h.01M3 19h.01"/></svg>' +
                'List' +
              '</button>' +
              '<button onclick="window.__proposalInsert(\'Type: \\nDuration: \\nBudget: \u20B1\\n\')" onmouseenter="this.style.background=\'rgba(16,185,129,0.1)\';this.style.borderColor=\'rgba(16,185,129,0.4)\';this.style.color=\'#6ee7b7\';this.style.boxShadow=\'0 0 12px rgba(16,185,129,0.1),inset 0 0 12px rgba(16,185,129,0.05)\'" onmouseleave="this.style.background=\'rgba(15,17,30,0.6)\';this.style.borderColor=\'rgba(16,185,129,0.18)\';this.style.color=\'#34d399\';this.style.boxShadow=\'none\'" style="background:rgba(15,17,30,0.6);color:#34d399;border:1px solid rgba(16,185,129,0.18);border-radius:8px;padding:6px 12px;cursor:pointer;font-size:0.7rem;font-weight:600;font-family:inherit;transition:all 0.25s cubic-bezier(0.4,0,0.2,1);display:inline-flex;align-items:center;gap:6px;white-space:nowrap;backdrop-filter:blur(8px);">' +
                '<svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>' +
                'Fields' +
              '</button>' +
              '<div class="qi-sep"></div>' +
              '<button onclick="window.__proposalInsert(\'| Column 1 | Column 2 | Column 3 |\\n+----------+----------+----------+\\n| Data     | Data     | Data     |\\n| Data     | Data     | Data     |\\n+----------+----------+----------+\\n\')" onmouseenter="this.style.background=\'rgba(245,158,11,0.1)\';this.style.borderColor=\'rgba(245,158,11,0.4)\';this.style.color=\'#fde68a\';this.style.boxShadow=\'0 0 12px rgba(245,158,11,0.1),inset 0 0 12px rgba(245,158,11,0.05)\'" onmouseleave="this.style.background=\'rgba(15,17,30,0.6)\';this.style.borderColor=\'rgba(245,158,11,0.18)\';this.style.color=\'#fbbf24\';this.style.boxShadow=\'none\'" style="background:rgba(15,17,30,0.6);color:#fbbf24;border:1px solid rgba(245,158,11,0.18);border-radius:8px;padding:6px 12px;cursor:pointer;font-size:0.7rem;font-weight:600;font-family:inherit;transition:all 0.25s cubic-bezier(0.4,0,0.2,1);display:inline-flex;align-items:center;gap:6px;white-space:nowrap;backdrop-filter:blur(8px);">' +
                '<svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M3 14h18M3 6h18M3 18h18"/></svg>' +
                'Table' +
              '</button>' +
              '<button onclick="window.__proposalInsert(\'TOTAL: \u20B10\\n\')" onmouseenter="this.style.background=\'rgba(239,68,68,0.1)\';this.style.borderColor=\'rgba(239,68,68,0.4)\';this.style.color=\'#fca5a5\';this.style.boxShadow=\'0 0 12px rgba(239,68,68,0.1),inset 0 0 12px rgba(239,68,68,0.05)\'" onmouseleave="this.style.background=\'rgba(15,17,30,0.6)\';this.style.borderColor=\'rgba(239,68,68,0.18)\';this.style.color=\'#f87171\';this.style.boxShadow=\'none\'" style="background:rgba(15,17,30,0.6);color:#f87171;border:1px solid rgba(239,68,68,0.18);border-radius:8px;padding:6px 12px;cursor:pointer;font-size:0.7rem;font-weight:600;font-family:inherit;transition:all 0.25s cubic-bezier(0.4,0,0.2,1);display:inline-flex;align-items:center;gap:6px;white-space:nowrap;backdrop-filter:blur(8px);">' +
                '<svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>' +
                'Total' +
              '</button>' +
              '<div class="qi-sep"></div>' +
              '<button onclick="window.__proposalLoadTemplate()" onmouseenter="this.style.background=\'linear-gradient(135deg,rgba(99,102,241,0.18),rgba(168,85,247,0.1))\';this.style.borderColor=\'rgba(99,102,241,0.5)\';this.style.color=\'#fff\';this.style.boxShadow=\'0 0 16px rgba(99,102,241,0.15),0 0 32px rgba(168,85,247,0.08),inset 0 0 16px rgba(99,102,241,0.08)\'" onmouseleave="this.style.background=\'linear-gradient(135deg,rgba(99,102,241,0.1),rgba(168,85,247,0.06))\';this.style.borderColor=\'rgba(99,102,241,0.25)\';this.style.color=\'#e2e8f0\';this.style.boxShadow=\'none\'" style="background:linear-gradient(135deg,rgba(99,102,241,0.1),rgba(168,85,247,0.06));color:#e2e8f0;border:1px solid rgba(99,102,241,0.25);border-radius:8px;padding:6px 12px;cursor:pointer;font-size:0.7rem;font-weight:700;font-family:inherit;transition:all 0.25s cubic-bezier(0.4,0,0.2,1);display:inline-flex;align-items:center;gap:6px;white-space:nowrap;backdrop-filter:blur(8px);">' +
                '<svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>' +
                'Template' +
              '</button>' +
            '</div>' +
          '</div>' +
        '</div>' +

        '<div style="display:flex;gap:10px;justify-content:flex-end;padding-top:18px;border-top:1px solid #1e293b;">' +
          '<button onclick="window.__proposalSave()" style="background:transparent;color:#64748b;border:1px solid #1e293b;border-radius:10px;padding:9px 18px;cursor:pointer;font-weight:600;font-size:0.8rem;display:inline-flex;align-items:center;gap:7px;transition:all 0.2s;font-family:inherit;" onmouseenter="this.style.color=\'#e2e8f0\';this.style.borderColor=\'#334155\';this.style.background=\'#111827\'" onmouseleave="this.style.color=\'#64748b\';this.style.borderColor=\'#1e293b\';this.style.background=\'transparent\'">' + iconSvg(icons.save, 'currentColor') + ' Save Draft</button>' +
          (isNew || p.status === 'draft' || p.status === 'declined' ?
            '<button onclick="window.__proposalSaveSubmit()" style="background:linear-gradient(135deg,' + ac + ',' + ac + 'cc);color:#fff;border:none;border-radius:10px;padding:9px 22px;cursor:pointer;font-weight:700;font-size:0.8rem;display:inline-flex;align-items:center;gap:7px;box-shadow:0 2px 12px ' + ac + '30,0 0 0 1px ' + ac + '44;transition:all 0.25s ease;font-family:inherit;" onmouseenter="this.style.transform=\'translateY(-1px)\';this.style.boxShadow=\'0 4px 20px ' + ac + '40,0 0 0 1px ' + ac + '66\'" onmouseleave="this.style.transform=\'translateY(0)\';this.style.boxShadow=\'0 2px 12px ' + ac + '30,0 0 0 1px ' + ac + '44\'">' + iconSvg(icons.send, 'white') + ' Submit for Review</button>' : '') +
        '</div>' +

      '</div>' +

      '</div></div></div>';
  }

  function formatDescription(text) {
    if (!text) return '<div style="color:#475569;text-align:center;padding:40px;">No description provided.</div>';
    var lines = text.split('\n');
    var html = '';
    var inTable = false;
    var tableRows = [];
    var paraBuf = [];

    function flushPara() {
      if (paraBuf.length === 0) return;
      html += '<p style="color:#cbd5e1;font-size:0.82rem;margin:4px 0;line-height:1.7;text-align:justify;">' + esc(paraBuf.join(' ')) + '</p>';
      paraBuf = [];
    }

    function parsePipeRow(line) {
      return line.split('|').map(function(c) { return c.trim(); }).filter(function(c) { return c.length > 0; });
    }

    function isTableSeparator(line) {
      return line.match(/^\+[-]+\+[-+]*\+$/) || line.match(/^\|?[\s\-:]+(\|[\s\-:]+)+\|?$/);
    }

    function isPipeRow(line) {
      return line.match(/^\|.+\|$/);
    }

    function renderTable(rows) {
      if (rows.length === 0) return '';
      var headerCells = parsePipeRow(rows[0]);
      if (headerCells.length === 0) return '';
      var colCount = headerCells.length;
      var uid = 'tbl' + Math.random().toString(36).substr(2, 6);

      var html = '<div class="proposal-table-wrap">' +
        '<table class="proposal-table" data-cols="' + colCount + '">';

      html += '<thead><tr><th class="proposal-table-gutter"></th>' + headerCells.map(function(c, idx) {
        return '<th>' + esc(c) + '</th>';
      }).join('') + '</tr></thead><tbody>';

      for (var i = 1; i < rows.length; i++) {
        if (isTableSeparator(rows[i])) continue;
        var cells = parsePipeRow(rows[i]);
        if (cells.length === 0) continue;
        var isLast = i === rows.length - 1 || (i + 1 < rows.length && isTableSeparator(rows[i + 1]));
        var rowCls = 'proposal-table-row';
        if (isLast) rowCls += ' proposal-table-row-last';

        html += '<tr class="' + rowCls + '"><td class="proposal-table-gutter"></td>' + cells.map(function(c) {
          var isTotal = c.toUpperCase().indexOf('TOTAL') !== -1;
          var isPrice = c.match(/^[\u20B1P][\d,]+/);
          var cls = isTotal ? 'proposal-table-cell proposal-table-cell-total' : isPrice ? 'proposal-table-cell proposal-table-cell-price' : 'proposal-table-cell';
          return '<td class="' + cls + '">' + esc(c) + '</td>';
        }).join('') + '</tr>';
      }
      html += '</tbody></table></div>';
      return html;
    }

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      var trimmed = line.trim();
      var isSep = trimmed.match(/^\+[-]+\+[-+]*\+$/);
      var isPipe = isPipeRow(trimmed);

      if (isSep || isPipe) {
        if (!inTable) { inTable = true; tableRows = []; }
        if (!isSep) tableRows.push(trimmed);
        continue;
      } else if (inTable) {
        flushPara();
        html += renderTable(tableRows);
        inTable = false;
        tableRows = [];
      }

      if (trimmed.match(/^={3,}$/)) {
        flushPara();
        continue;
      } else if (trimmed.match(/^DREAMLAND/)) {
        flushPara();
        html += '<div style="text-align:center;padding:16px 0 8px;margin-bottom:12px;border-bottom:2px solid #6366f144;">' +
          '<div style="font-size:1.1rem;font-weight:900;letter-spacing:3px;background:linear-gradient(135deg,#6366f1,#a78bfa,#6366f1);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">' + esc(trimmed) + '</div></div>';
      } else if (trimmed.match(/^[A-Z][A-Z\s\-]+$/) && trimmed.length > 5 && !trimmed.match(/^TOTAL/) && !trimmed.match(/^(TOKEN|TYPE|DURATION|TARGET|MACHINE|REWARD|RULES|HOW|DETAILS|QUALIFICATION|POINTS|BLACK|TIER|PROMOTIONAL|STANDARD|OPERATING|SERVICE|REQUESTED|PROPOSAL|AREA|BRANCH|PREPARED)/)) {
        flushPara();
        html += '<div style="text-align:center;padding:14px 0 6px;margin:10px 0 8px;">' +
          '<div style="font-size:0.82rem;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:#a78bfa;">' + esc(trimmed) + '</div></div>';
      } else if (trimmed.match(/^Prepared by:|^Date:/)) {
        flushPara();
        html += '<div style="text-align:center;color:#64748b;font-size:0.78rem;margin-bottom:4px;">' + esc(trimmed) + '</div>';
      } else if (trimmed.match(/^I\. |^II\. |^III\. |^IV\. |^V\. |^VI\. |^VII\. |^VIII\. |^IX\. |^X\. |^XI\. /)) {
        flushPara();
        html += '<div style="display:flex;align-items:center;gap:10px;margin:20px 0 12px;padding-bottom:8px;border-bottom:1px solid #6366f144;">' +
          '<div style="width:32px;height:32px;border-radius:8px;background:linear-gradient(135deg,#6366f1,#4f46e5);display:flex;align-items:center;justify-content:center;flex-shrink:0;">' +
            '<svg width="16" height="16" fill="none" stroke="#fff" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>' +
          '</div>' +
          '<span style="color:#e2e8f0;font-weight:800;font-size:0.9rem;letter-spacing:1px;">' + esc(trimmed) + '</span>' +
        '</div>';
      } else if (trimmed.match(/^[-]{3,}$/)) {
        flushPara();
        html += '<div style="margin:14px 0;"><div style="height:1px;background:linear-gradient(90deg,transparent,#2a3040,transparent);"></div></div>';
      } else if (trimmed.match(/^\d+\.?\d* [A-Z]/)) {
        flushPara();
        var labelParts = trimmed.split(' ');
        var labelNum = labelParts.shift();
        var labelText = labelParts.join(' ');
        html += '<div style="display:flex;align-items:center;gap:8px;margin:14px 0 8px;padding:8px 12px;background:#6366f110;border:1px solid #6366f122;border-radius:8px;border-left:3px solid #6366f1;">' +
          '<div style="width:22px;height:22px;border-radius:6px;background:#6366f1;color:#fff;display:flex;align-items:center;justify-content:center;font-size:0.65rem;font-weight:700;flex-shrink:0;">' + trimmed.charAt(0) + '</div>' +
          '<span style="color:#a78bfa;font-weight:700;font-size:0.88rem;">' + esc(labelText) + '</span>' +
        '</div>';
      } else if (trimmed.match(/^(Type|Duration|Target|Machine|Reward|Rules|How It Works|Details|Qualification|Points|Black Member|Tier|Promotional|Standard|Operating|Service|Requested|Proposal Period|Area|Branch|Prepared|Phase|Key Observations|Why This Matters|Objective|Return on Investment|Non-Financial):/i)) {
        flushPara();
        var parts = trimmed.split(':');
        var label = parts[0].trim();
        var value = parts.slice(1).join(':').trim();
        html += '<div style="display:flex;gap:8px;margin:6px 0;align-items:baseline;">' +
          '<div style="color:#6366f1;font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;min-width:100px;flex-shrink:0;">' + esc(label) + '</div>' +
          '<div style="color:#cbd5e1;font-size:0.82rem;">' + esc(value) + '</div>' +
        '</div>';
      } else if (trimmed.match(/^[-] /)) {
        flushPara();
        var bulletText = trimmed.substring(2);
        html += '<div style="display:flex;gap:8px;margin:4px 0;padding-left:16px;">' +
          '<div style="color:#6366f1;flex-shrink:0;margin-top:2px;">&#9670;</div>' +
          '<div style="color:#cbd5e1;font-size:0.82rem;text-align:justify;">' + esc(bulletText) + '</div>' +
        '</div>';
      } else if (trimmed.match(/^\d+ [A-Z]/)) {
        flushPara();
        html += '<div style="display:flex;gap:8px;margin:4px 0;padding-left:16px;">' +
          '<div style="color:#22c55e;flex-shrink:0;margin-top:2px;">&#9670;</div>' +
          '<div style="color:#cbd5e1;font-size:0.82rem;text-align:justify;">' + esc(trimmed) + '</div>' +
        '</div>';
      } else if (trimmed.match(/TOTAL/)) {
        flushPara();
        html += '<div style="display:flex;justify-content:space-between;padding:8px 14px;margin:6px 0;background:linear-gradient(135deg,#22c55e11,#22c55e08);border:1px solid #22c55e33;border-radius:8px;">' +
          '<span style="color:#22c55e;font-weight:800;font-size:0.85rem;">' + esc(trimmed) + '</span>' +
        '</div>';
      } else if (trimmed === '') {
        flushPara();
        html += '<div style="height:6px;"></div>';
      } else if (trimmed.startsWith('TOKEN') || trimmed.startsWith('Token Packages') || trimmed.startsWith('Special Prize')) {
        flushPara();
        html += '<div style="color:#f59e0b;font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:10px 0 4px;">' + esc(trimmed) + '</div>';
      } else {
        paraBuf.push(trimmed);
      }
    }
    flushPara();
    if (inTable) html += renderTable(tableRows);
    return html;
  }

  function renderDetail(isOwner) {
    var p = editingProposal;
    var user = Auth.getUser();
    var canEdit = isOwner || p.created_by === user.id;
    var ac = { Arcade: '#6366f1', Playhouse: '#22c55e', Cafe: '#f59e0b' }[p.area] || '#94a3b8';
    var areaIcons = {
      Arcade: 'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      Playhouse: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
      Cafe: 'M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z M6 1v3 M10 1v3 M14 1v3'
    };
    var roleConfig = { owner: { color: '#f59e0b', label: 'Owner' }, admin: { color: '#6366f1', label: 'Admin' }, employee: { color: '#22c55e', label: 'Staff' } };
    var rc = roleConfig[p.creator_role] || { color: '#94a3b8', label: p.creator_role || '-' };

    var statusColors = { draft: '#f59e0b', submitted: '#3b82f6', approved: '#22c55e', declined: '#ef4444' };
    var statusLabels = { draft: 'Draft', submitted: 'Submitted', approved: 'Approved', declined: 'Declined' };
    var sc = statusColors[p.status] || '#94a3b8';

    app.innerHTML = '<div class="layout">' + renderSidebar() +
      '<div class="main-content">' + renderNavbar('Proposal Details') +
      '<div class="page-content" id="page-body">' +

      '<div style="max-width:1060px;margin:0 auto;">' +

        '<div style="margin-bottom:18px;display:flex;align-items:center;gap:10px;">' +
          '<button onclick="window.__proposalBack()" style="background:transparent;color:#64748b;border:1px solid #1e293b;border-radius:8px;padding:6px 14px;cursor:pointer;font-size:0.78rem;display:inline-flex;align-items:center;gap:5px;transition:all 0.2s;font-family:inherit;" onmouseenter="this.style.color=\'#e2e8f0\';this.style.borderColor=\'#334155\';this.style.background=\'#111827\'" onmouseleave="this.style.color=\'#64748b\';this.style.borderColor=\'#1e293b\';this.style.background=\'transparent\'">' +
            '<svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg> Back</button>' +
          '<div style="height:16px;width:1px;background:#1e293b;"></div>' +
          '<div style="display:flex;align-items:center;gap:6px;">' +
            '<div style="width:8px;height:8px;border-radius:50%;background:' + sc + ';box-shadow:0 0 8px ' + sc + '66;"></div>' +
            '<span style="color:' + sc + ';font-size:0.72rem;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">' + (statusLabels[p.status] || p.status) + '</span>' +
          '</div>' +
          '<div style="height:16px;width:1px;background:#1e293b;"></div>' +
          '<span style="color:#475569;font-size:0.72rem;">' + formatMonth(p.proposal_month) + '</span>' +
        '</div>' +

        '<div style="position:relative;border-radius:16px;overflow:hidden;margin-bottom:22px;background:linear-gradient(135deg,#0f172a 0%,' + ac + '06 40%,' + ac + '03 60%,#0f172a 100%);border:1px solid ' + ac + '18;">' +
          '<div style="position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,' + ac + ',transparent);opacity:0.6;"></div>' +
          '<div style="position:absolute;top:-50px;right:-50px;width:140px;height:140px;background:radial-gradient(circle,' + ac + '08,transparent 70%);border-radius:50%;"></div>' +
          '<div style="position:absolute;bottom:-40px;left:30%;width:100px;height:100px;background:radial-gradient(circle,' + ac + '05,transparent 70%);border-radius:50%;"></div>' +
          '<div style="padding:22px 26px;position:relative;">' +
            '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;">' +
              '<div style="display:flex;align-items:center;gap:14px;">' +
                '<div style="width:48px;height:48px;border-radius:13px;background:linear-gradient(135deg,' + ac + 'dd,' + ac + '88);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 20px ' + ac + '25;border:1px solid ' + ac + '44;">' +
                  '<svg width="22" height="22" fill="none" stroke="#fff" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="' + (areaIcons[p.area] || areaIcons.Arcade) + '"/></svg>' +
                '</div>' +
                '<div>' +
                  '<div style="color:' + ac + ';font-size:0.58rem;font-weight:700;text-transform:uppercase;letter-spacing:2.5px;margin-bottom:3px;opacity:0.9;">' + (p.area || '') + ' Proposal</div>' +
                  '<div style="color:#e2e8f0;font-size:1.1rem;font-weight:800;line-height:1.3;letter-spacing:-0.3px;">' + esc(p.title) + '</div>' +
                '</div>' +
              '</div>' +
              '<div style="display:flex;gap:6px;flex-shrink:0;">' +
                '<button onclick="window.__proposalPrint(' + p.id + ')" style="background:transparent;color:#64748b;border:1px solid #1e293b;border-radius:8px;padding:6px 14px;cursor:pointer;font-size:0.78rem;display:inline-flex;align-items:center;gap:5px;transition:all 0.2s;font-family:inherit;" onmouseenter="this.style.color=\'#38bdf8\';this.style.borderColor=\'#0ea5e944\';this.style.background=\'#0ea5e908\'" onmouseleave="this.style.color=\'#64748b\';this.style.borderColor=\'#1e293b\';this.style.background=\'transparent\'">' +
                  '<svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg> Print</button>' +
                '<button onclick="window.__proposalDownload(' + p.id + ')" style="background:transparent;color:#64748b;border:1px solid #1e293b;border-radius:8px;padding:6px 14px;cursor:pointer;font-size:0.78rem;display:inline-flex;align-items:center;gap:5px;transition:all 0.2s;font-family:inherit;" onmouseenter="this.style.color=\'#a78bfa\';this.style.borderColor=\'#8b5cf644\';this.style.background=\'#8b5cf608\'" onmouseleave="this.style.color=\'#64748b\';this.style.borderColor=\'#1e293b\';this.style.background=\'transparent\'">' +
                  '<svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg> Save</button>' +
                (canEdit && p.status !== 'approved' ?
                  '<button onclick="window.__proposalEdit(' + p.id + ')" style="background:transparent;color:#64748b;border:1px solid #1e293b;border-radius:8px;padding:6px 14px;cursor:pointer;font-size:0.78rem;display:inline-flex;align-items:center;gap:5px;transition:all 0.2s;font-family:inherit;" onmouseenter="this.style.color=\'#a78bfa\';this.style.borderColor=\'#6366f144\';this.style.background=\'#6366f108\'" onmouseleave="this.style.color=\'#64748b\';this.style.borderColor=\'#1e293b\';this.style.background=\'transparent\'">' +
                    '<svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg> Edit</button>' : '') +
                (isOwner && p.status === 'submitted' ?
                  '<button onclick="window.__proposalApprove(' + p.id + ')" style="background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff;border:none;border-radius:8px;padding:6px 14px;cursor:pointer;font-size:0.78rem;display:inline-flex;align-items:center;gap:5px;font-family:inherit;font-weight:600;box-shadow:0 2px 10px #22c55e30;">' +
                    '<svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg> Approve</button>' +
                  '<button onclick="window.__proposalDecline(' + p.id + ')" style="background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff;border:none;border-radius:8px;padding:6px 14px;cursor:pointer;font-size:0.78rem;display:inline-flex;align-items:center;gap:5px;font-family:inherit;font-weight:600;box-shadow:0 2px 10px #ef444430;">' +
                    '<svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg> Decline</button>' : '') +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +

        '<div style="display:grid;grid-template-columns:1fr 300px;gap:18px;align-items:start;">' +

          '<div style="background:#111827;border:1px solid #1e293b;border-radius:14px;padding:24px;">' +
            '<div style="display:flex;align-items:center;gap:8px;margin-bottom:18px;padding-bottom:12px;border-bottom:1px solid #1e293b;">' +
              '<div style="width:6px;height:6px;border-radius:50%;background:' + ac + ';box-shadow:0 0 8px ' + ac + '66;"></div>' +
              '<span style="color:#94a3b8;font-weight:700;font-size:0.72rem;text-transform:uppercase;letter-spacing:1px;">Proposal Content</span>' +
            '</div>' +
            '<div style="color:#cbd5e1;font-size:0.84rem;line-height:1.7;text-align:justify;">' + formatDescription(p.description) + '</div>' +
          '</div>' +

          '<div style="display:flex;flex-direction:column;gap:14px;position:sticky;top:20px;">' +

            '<div style="background:#111827;border:1px solid #1e293b;border-radius:14px;padding:16px;">' +
              '<div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;padding-bottom:10px;border-bottom:1px solid #1e293b;">' +
                '<div style="width:6px;height:6px;border-radius:50%;background:#f59e0b;box-shadow:0 0 8px #f59e0b66;"></div>' +
                '<span style="color:#94a3b8;font-weight:700;font-size:0.72rem;text-transform:uppercase;letter-spacing:1px;">Information</span>' +
              '</div>' +
              '<div style="display:flex;flex-direction:column;gap:12px;">' +
                '<div style="display:flex;align-items:center;gap:10px;">' +
                  '<div style="width:30px;height:30px;border-radius:8px;background:' + ac + '12;border:1px solid ' + ac + '33;display:flex;align-items:center;justify-content:center;flex-shrink:0;">' +
                    '<svg width="13" height="13" fill="none" stroke="' + ac + '" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>' +
                  '</div>' +
                  '<div><div style="color:#475569;font-size:0.58rem;text-transform:uppercase;letter-spacing:0.8px;font-weight:600;">Branch</div><div style="color:#e2e8f0;font-weight:600;font-size:0.8rem;">' + (p.branch_name || '-') + '</div></div>' +
                '</div>' +
                '<div style="display:flex;align-items:center;gap:10px;">' +
                  '<div style="width:30px;height:30px;border-radius:8px;background:#22c55e12;border:1px solid #22c55e33;display:flex;align-items:center;justify-content:center;flex-shrink:0;">' +
                    '<svg width="13" height="13" fill="none" stroke="#22c55e" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>' +
                  '</div>' +
                  '<div><div style="color:#475569;font-size:0.58rem;text-transform:uppercase;letter-spacing:0.8px;font-weight:600;">Budget</div><div style="color:#22c55e;font-weight:700;font-size:0.9rem;">' + formatCurrency(p.amount || 0) + '</div></div>' +
                '</div>' +
                '<div style="display:flex;align-items:center;gap:10px;">' +
                  '<div style="width:30px;height:30px;border-radius:8px;background:' + rc.color + '12;border:1px solid ' + rc.color + '33;display:flex;align-items:center;justify-content:center;flex-shrink:0;">' +
                    '<svg width="13" height="13" fill="none" stroke="' + rc.color + '" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>' +
                  '</div>' +
                  '<div><div style="color:#475569;font-size:0.58rem;text-transform:uppercase;letter-spacing:0.8px;font-weight:600;">Created By</div>' +
                    '<div style="display:flex;align-items:center;gap:5px;"><span style="color:#e2e8f0;font-weight:600;font-size:0.8rem;">' + esc(p.creator_name || '-') + '</span>' +
                    '<span style="color:' + rc.color + ';font-size:0.5rem;font-weight:700;text-transform:uppercase;background:' + rc.color + '15;padding:1px 6px;border-radius:4px;">' + rc.label + '</span></div>' +
                  '</div>' +
                '</div>' +
              '</div>' +
            '</div>' +

            (isOwner ? '<div style="background:#111827;border:1px solid #f59e0b22;border-radius:14px;padding:16px;">' +
              '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">' +
                '<div style="width:6px;height:6px;border-radius:50%;background:#f59e0b;box-shadow:0 0 8px #f59e0b66;"></div>' +
                '<span style="color:#94a3b8;font-weight:700;font-size:0.72rem;text-transform:uppercase;letter-spacing:1px;">Owner Comment</span>' +
              '</div>' +
              '<textarea id="owner-comment" rows="3" style="width:100%;background:#080c18;border:1px solid #1e293b;border-radius:8px;padding:10px;color:#e2e8f0;font-size:0.8rem;resize:vertical;font-family:inherit;outline:none;transition:all 0.25s ease;box-sizing:border-box;" onfocus="this.style.borderColor=\'#f59e0b\';this.style.boxShadow=\'0 0 0 3px #f59e0b12\';this.style.background=\'#0a0e1a\'" onblur="this.style.borderColor=\'#1e293b\';this.style.boxShadow=\'none\';this.style.background=\'#080c18\'">' + esc(p.owner_comment || '') + '</textarea>' +
              '<button onclick="window.__proposalSaveComment(' + p.id + ')" style="margin-top:8px;width:100%;background:linear-gradient(135deg,#f59e0b,#f59e0bcc);color:#000;border:none;border-radius:8px;padding:7px;cursor:pointer;font-weight:700;font-size:0.75rem;display:flex;align-items:center;justify-content:center;gap:5px;font-family:inherit;transition:all 0.2s;" onmouseenter="this.style.transform=\'translateY(-1px)\'" onmouseleave="this.style.transform=\'translateY(0)\'">' +
                '<svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg> Save Comment</button>' +
            '</div>' : '') +

            (p.owner_comment && !isOwner ? '<div style="background:#111827;border:1px solid #f59e0b22;border-radius:14px;padding:16px;">' +
              '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">' +
                '<div style="width:6px;height:6px;border-radius:50%;background:#f59e0b;box-shadow:0 0 8px #f59e0b66;"></div>' +
                '<span style="color:#94a3b8;font-weight:700;font-size:0.72rem;text-transform:uppercase;letter-spacing:1px;">Owner Comment</span>' +
              '</div>' +
              '<div style="color:#cbd5e1;font-size:0.8rem;line-height:1.6;white-space:pre-wrap;background:#080c18;border-radius:8px;padding:10px 12px;border:1px solid #1e293b;">' + esc(p.owner_comment) + '</div>' +
            '</div>' : '') +

            '<div style="background:#111827;border:1px solid #1e293b;border-radius:14px;padding:16px;">' +
              '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">' +
                '<div style="width:6px;height:6px;border-radius:50%;background:#6366f1;box-shadow:0 0 8px #6366f166;"></div>' +
                '<span style="color:#94a3b8;font-weight:700;font-size:0.72rem;text-transform:uppercase;letter-spacing:1px;">Timeline</span>' +
              '</div>' +
              '<div style="display:flex;flex-direction:column;gap:8px;">' +
                '<div style="display:flex;justify-content:space-between;align-items:center;"><span style="color:#475569;font-size:0.7rem;">Created</span><span style="color:#94a3b8;font-size:0.7rem;font-weight:500;">' + timeAgo(p.created_at) + '</span></div>' +
                '<div style="display:flex;justify-content:space-between;align-items:center;"><span style="color:#475569;font-size:0.7rem;">Updated</span><span style="color:#94a3b8;font-size:0.7rem;font-weight:500;">' + timeAgo(p.updated_at) + '</span></div>' +
              '</div>' +
            '</div>' +

          '</div>' +

        '</div>' +

      '</div>' +

      '</div></div></div>';
  }

  function formatMonth(m) {
    if (!m) return '-';
    var parts = m.split('-');
    var d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1);
    return d.toLocaleString('default', { month: 'long', year: 'numeric' });
  }

  window.__proposalNew = function() { createNew(); };
  window.__proposalBack = function() { editingProposal = null; view = 'list'; render(); };
  window.__proposalView = function(id) { var p = proposals.find(function(p) { return p.id === id; }); if (p) viewProposal(p); };
  window.__proposalEdit = function(id) { var p = proposals.find(function(p) { return p.id === id; }); if (p) editProposal(p); };
  window.__proposalChangeArea = function(area) {
    var areaMap = {
      Playhouse: { c: '#22c55e', i: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
      Cafe: { c: '#f59e0b', i: 'M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z M6 1v3 M10 1v3 M14 1v3' },
      Arcade: { c: '#6366f1', i: 'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z' }
    };
    var d = areaMap[area] || areaMap.Arcade;
    var banner = document.getElementById('proposal-header-banner');
    var iconWrap = document.getElementById('proposal-header-icon-wrap');
    var iconEl = document.getElementById('proposal-header-icon');
    var areaLabel = document.getElementById('proposal-header-area');
    if (banner) {
      banner.style.background = 'linear-gradient(135deg,#0f172a 0%,' + d.c + '06 40%,' + d.c + '03 60%,#0f172a 100%)';
      banner.style.border = '1px solid ' + d.c + '18';
      banner.style.transition = 'all 0.3s ease';
    }
    if (iconWrap) {
      iconWrap.style.background = 'linear-gradient(135deg,' + d.c + 'dd,' + d.c + '88)';
      iconWrap.style.boxShadow = '0 4px 20px ' + d.c + '25';
      iconWrap.style.border = '1px solid ' + d.c + '44';
      iconWrap.style.transition = 'all 0.3s ease';
    }
    if (iconEl) {
      iconEl.innerHTML = '<svg width="22" height="22" fill="none" stroke="white" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="' + d.i + '"/></svg>';
    }
    if (areaLabel) {
      areaLabel.style.color = d.c;
      areaLabel.style.transition = 'color 0.3s ease';
      areaLabel.textContent = area + ' Area';
    }
    var descBorder = document.querySelector('#p-desc');
    if (descBorder) descBorder.style.borderColor = d.c + '44';
  };
  window.__proposalInsert = function(text) {
    var ta = document.getElementById('p-desc');
    if (!ta) return;
    var start = ta.selectionStart;
    var end = ta.selectionEnd;
    var val = ta.value;
    ta.value = val.substring(0, start) + text + val.substring(end);
    ta.selectionStart = ta.selectionEnd = start + text.length;
    ta.focus();
  };

  window.__proposalLoadTemplate = function() {
    var user = Auth.getUser();
    var area = (editingProposal && editingProposal.area) || 'Arcade';
    var now = new Date();
    var monthLabel = now.toLocaleString('default', { month: 'long', year: 'numeric' });
    var template = '=== ' + monthLabel.toUpperCase() + ' OPERATIONS UPDATE\\n' +
      '==================================================\\n' +
      '\\n' +
      'Prepared by: ' + (user.first_name || '') + ' ' + (user.last_name || '') + ' | Branch: Dreamland Arcade\\n' +
      'Date: ' + now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) + '\\n' +
      '\\n' +
      '===\\n' +
      'I. LIMITED TIME PROMOTIONS (' + monthLabel + ' Only)\\n' +
      '===\\n' +
      '\\n' +
      '---\\n' +
      '1. PROMO NAME\\n' +
      '---\\n' +
      'Type: Weekend/Weekday/Daily\\n' +
      'Duration: ' + monthLabel + '\\n' +
      'Details:\\n' +
      '- Discount: X%\\n' +
      '- Minimum spend: ₱XXX\\n' +
      '\\n' +
      '===\\n' +
      'II. BUDGET ALLOCATION\\n' +
      '===\\n' +
      '\\n' +
      '| Item | Cost |\\n' +
      '| --- | --- |\\n' +
      '| | |\\n' +
      '\\n' +
      'TOTAL: ₱0\\n';
    var ta = document.getElementById('p-desc');
    if (ta) {
      ta.value = template.replace(/\\n/g, '\n').replace(/\\t/g, '\t');
      ta.focus();
    }
  };

  window.__proposalSave = function() { saveProposal(); };
  window.__proposalSaveSubmit = async function() {
    await saveProposal();
    if (editingProposal && editingProposal.id) {
      await submitProposal();
    }
  };
  window.__proposalApprove = function(id) { approveProposal(id); };
  window.__proposalDecline = function(id) { declineProposal(id); };
  window.__proposalDelete = function(id) { deleteProposal(id); };
  window.__proposalRestore = function(id) { restoreProposal(id); };
  window.__proposalPermanentDelete = function(id) { permanentDeleteProposal(id); };
  window.__proposalSaveComment = function(id) { saveOwnerComment(id); };
  window.__proposalPrint = function(id) { printProposal(id); };
  window.__proposalDownload = function(id) { downloadProposal(id); };
  window.__proposalFilterMonth = async function(val) { filterMonth = val; filterStatus = ''; await loadProposals(); render(); };
  window.__proposalFilterStatus = async function(val) {
    filterStatus = val;
    await loadProposals();
    render();
  };
  window.__proposalFilterArea = async function(val) { filterArea = val; filterStatus = ''; await loadProposals(); render(); };

  loadData();
}

Router.register('proposals', renderAdminProposals);
