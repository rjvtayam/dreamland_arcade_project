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
    if (!await confirmAsync('Delete this proposal?')) return;
    await apiDelete('/proposals/' + id);
    Toast.success('Deleted');
    editingProposal = null;
    view = 'list';
    await loadProposals();
    render();
  }

  async function saveOwnerComment(id) {
    var comment = document.getElementById('owner-comment')?.value;
    await apiPut('/proposals/' + id, { owner_comment: comment });
    Toast.success('Comment saved!');
  }

  function statusBadge(status) {
    var colors = {
      draft: { bg: '#f59e0b22', color: '#f59e0b', border: '#f59e0b55' },
      submitted: { bg: '#3b82f622', color: '#3b82f6', border: '#3b82f655' },
      approved: { bg: '#22c55e22', color: '#22c55e', border: '#22c55e55' },
      declined: { bg: '#ef444422', color: '#ef4444', border: '#ef444455' }
    };
    var c = colors[status] || colors.draft;
    return '<span style="background:' + c.bg + ';color:' + c.color + ';border:1px solid ' + c.border + ';padding:3px 10px;border-radius:12px;font-size:0.7rem;font-weight:700;text-transform:uppercase;">' + status + '</span>';
  }

  function render() {
    var user = Auth.getUser();
    var isOwner = user && user.role === 'owner';

    if (view === 'edit' && editingProposal) return renderEditor(isOwner);
    if (view === 'detail' && editingProposal) return renderDetail(isOwner);

    var now = new Date();
    var currentMonth = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
    var monthOptions = '';
    for (var i = 0; i < 12; i++) {
      var d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      var val = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
      var label = d.toLocaleString('default', { month: 'long', year: 'numeric' });
      monthOptions += '<option value="' + val + '"' + (filterMonth === val ? ' selected' : '') + '>' + label + '</option>';
    }

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
      rows += '<tr style="border-bottom:1px solid #1e2736;cursor:pointer;" onclick="window.__proposalView(' + p.id + ')">' +
        '<td style="padding:10px;color:#e2e8f0;font-weight:600;">' + esc(p.title) + '</td>' +
        '<td style="padding:10px;"><span style="background:' + ac + '18;color:' + ac + ';border:1px solid ' + ac + '44;padding:2px 8px;border-radius:6px;font-size:0.7rem;font-weight:600;">' + (p.area || '-') + '</span></td>' +
        '<td style="padding:10px;color:#94a3b8;">' + (p.branch_name || '-') + '</td>' +
        '<td style="padding:10px;color:#94a3b8;">' + (p.creator_name || '-') + '</td>' +
        '<td style="padding:10px;color:#94a3b8;">' + formatMonth(p.proposal_month) + '</td>' +
        '<td style="padding:10px;color:#22c55e;font-weight:600;">' + formatCurrency(p.amount || 0) + '</td>' +
        '<td style="padding:10px;">' + statusBadge(p.status) + '</td>' +
        '<td style="padding:10px;">' +
          (canEdit && p.status !== 'approved' ?
            '<button onclick="event.stopPropagation();window.__proposalEdit(' + p.id + ')" style="background:#6366f1;color:#fff;border:none;border-radius:4px;padding:4px 10px;cursor:pointer;font-size:0.7rem;margin-right:4px;">Edit</button>' : '') +
          (isOwner && p.status === 'submitted' ?
            '<button onclick="event.stopPropagation();window.__proposalApprove(' + p.id + ')" style="background:#22c55e;color:#fff;border:none;border-radius:4px;padding:4px 10px;cursor:pointer;font-size:0.7rem;margin-right:4px;">Approve</button>' +
            '<button onclick="event.stopPropagation();window.__proposalDecline(' + p.id + ')" style="background:#ef4444;color:#fff;border:none;border-radius:4px;padding:4px 10px;cursor:pointer;font-size:0.7rem;">Decline</button>' : '') +
          (canEdit && p.status !== 'approved' && p.status !== 'submitted' ?
            '<button onclick="event.stopPropagation();window.__proposalDelete(' + p.id + ')" style="background:#374151;color:#ef4444;border:none;border-radius:4px;padding:4px 10px;cursor:pointer;font-size:0.7rem;">Delete</button>' : '') +
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
          '<th style="padding:10px 12px;color:#94a3b8;text-align:left;font-weight:600;">Title</th>' +
          '<th style="padding:10px 12px;color:#94a3b8;text-align:left;font-weight:600;">Area</th>' +
          '<th style="padding:10px 12px;color:#94a3b8;text-align:left;font-weight:600;">Branch</th>' +
          '<th style="padding:10px 12px;color:#94a3b8;text-align:left;font-weight:600;">Created By</th>' +
          '<th style="padding:10px 12px;color:#94a3b8;text-align:left;font-weight:600;">Month</th>' +
          '<th style="padding:10px 12px;color:#94a3b8;text-align:left;font-weight:600;">Amount</th>' +
          '<th style="padding:10px 12px;color:#94a3b8;text-align:left;font-weight:600;">Status</th>' +
          '<th style="padding:10px 12px;color:#94a3b8;text-align:right;font-weight:600;">Actions</th>' +
        '</tr></thead><tbody>' +
        (rows || '<tr><td colspan="8" style="padding:30px;color:#666;text-align:center;">No proposals found</td></tr>') +
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

    var iconSvg = function(d, c) { return '<svg width="18" height="18" fill="none" stroke="' + c + '" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="' + d + '"/></svg>'; };
    var icons = {
      title: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
      month: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
      amount: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      desc: 'M4 6h16M4 12h16M4 18h7',
      branch: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
      save: 'M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4',
      send: 'M12 19l9 2-9-18-9 18 9-2zm0 0v-8',
      back: 'M10 19l-7-7m0 0l7-7m-7 7h18',
    };

    var inputStyle = 'width:100%;background:#080c18;border:1px solid #1e2a3a;border-radius:10px;padding:10px 14px 10px 40px;color:#e2e8f0;font-size:0.85rem;transition:all 0.3s;outline:none;box-sizing:border-box;';
    var inputFocus = 'onfocus="this.style.borderColor=\'#f59e0b\';this.style.boxShadow=\'0 0 0 2px #f59e0b22\'" onblur="this.style.borderColor=\'#1e2a3a\';this.style.boxShadow=\'none\'"';
    var selectStyle = 'width:100%;background:#080c18;border:1px solid #1e2a3a;border-radius:10px;padding:10px 14px 10px 40px;color:#e2e8f0;font-size:0.85rem;transition:all 0.3s;outline:none;cursor:pointer;box-sizing:border-box;appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' fill=\'%2394a3b8\' viewBox=\'0 0 24 24\'%3E%3Cpath d=\'M7 10l5 5 5-5z\'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 12px center;';
    var labelStyle = 'color:#94a3b8;font-size:0.7rem;font-weight:600;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;display:flex;align-items:center;gap:6px;';
    var fieldWrap = 'margin-bottom:18px;position:relative;';

    app.innerHTML = '<div class="layout">' + renderSidebar() +
      '<div class="main-content">' + renderNavbar(isNew ? 'New Proposal' : 'Edit Proposal') +
      '<div class="page-content" id="page-body">' +

      '<div style="margin-bottom:20px;">' +
        '<button onclick="window.__proposalBack()" style="background:#1a2035;color:#94a3b8;border:1px solid #2a3040;border-radius:8px;padding:7px 16px;cursor:pointer;font-size:0.8rem;display:inline-flex;align-items:center;gap:6px;transition:all 0.2s;" onmouseenter="this.style.color=\'#e2e8f0\';this.style.borderColor=\'#475569\'" onmouseleave="this.style.color=\'#94a3b8\';this.style.borderColor=\'#2a3040\'">' + iconSvg(icons.back, 'currentColor') + ' Back</button>' +
      '</div>' +

      '<div style="max-width:780px;">' +

        '<div style="position:relative;border-radius:16px;overflow:hidden;margin-bottom:24px;background:linear-gradient(135deg,#0f172a 0%,#1a1040 50%,#0f172a 100%);border:1px solid #2a2050;">' +
          '<div style="position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,#f59e0b,#ff6b35,#f59e0b);"></div>' +
          '<div style="position:absolute;top:-40px;right:-40px;width:120px;height:120px;background:radial-gradient(circle,rgba(245,158,11,0.08),transparent);border-radius:50%;"></div>' +
          '<div style="position:absolute;bottom:-30px;left:-30px;width:80px;height:80px;background:radial-gradient(circle,rgba(99,102,241,0.06),transparent);border-radius:50%;"></div>' +
          '<div style="padding:24px 28px;position:relative;">' +
            '<div style="display:flex;align-items:center;gap:14px;margin-bottom:8px;">' +
              '<div style="width:44px;height:44px;border-radius:12px;background:linear-gradient(135deg,#f59e0b,#ff6b35);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px #f59e0b33;">' +
                (isNew ? iconSvg('M12 4v16m8-8H4', 'white') : iconSvg(icons.title, 'white')) +
              '</div>' +
              '<div>' +
                '<div style="color:#f59e0b;font-size:0.65rem;font-weight:700;text-transform:uppercase;letter-spacing:2px;margin-bottom:2px;">' + (isNew ? 'New Proposal' : 'Edit Proposal') + '</div>' +
                '<div style="color:#e2e8f0;font-size:1.1rem;font-weight:800;">' + (isNew ? 'Create a Business Proposal' : esc(p.title)) + '</div>' +
              '</div>' +
            '</div>' +
            '<div style="color:#64748b;font-size:0.75rem;margin-top:4px;">' + (isNew ? 'Submit your monthly business proposal for owner review and approval.' : 'Modify the proposal details below.') + '</div>' +
          '</div>' +
        '</div>' +

        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">' +

          '<div style="background:linear-gradient(180deg,#111827,#0d1117);border:1px solid #1e293b;border-radius:14px;padding:22px;">' +
            '<div style="display:flex;align-items:center;gap:8px;margin-bottom:18px;padding-bottom:12px;border-bottom:1px solid #1e293b;">' +
              '<div style="width:28px;height:28px;border-radius:7px;background:rgba(245,158,11,0.1);display:flex;align-items:center;justify-content:center;">' + iconSvg(icons.title, '#f59e0b') + '</div>' +
              '<span style="color:#e2e8f0;font-weight:700;font-size:0.85rem;">Proposal Details</span>' +
            '</div>' +

            (isOwner ? '<div style="' + fieldWrap + 'position:relative;">' +
              '<label style="' + labelStyle + '">' + iconSvg(icons.branch, '#94a3b8') + ' Branch</label>' +
              '<div style="position:relative;"><span style="position:absolute;left:12px;top:50%;transform:translateY(-50%);pointer-events:none;">' + iconSvg(icons.branch, '#475569') + '</span>' +
              '<select id="p-branch" style="' + selectStyle + '" ' + inputFocus + '>' + branchOptions + '</select></div>' +
            '</div>' : '') +

            '<div style="' + fieldWrap + 'position:relative;">' +
              '<label style="' + labelStyle + '">' + iconSvg(icons.branch, '#94a3b8') + ' Area</label>' +
              '<div style="position:relative;"><span style="position:absolute;left:12px;top:50%;transform:translateY(-50%);pointer-events:none;">' + iconSvg(icons.branch, '#475569') + '</span>' +
              '<select id="p-area" style="' + selectStyle + '" ' + inputFocus + '>' +
                '<option value="Arcade"' + (p.area === 'Arcade' ? ' selected' : '') + '>Arcade</option>' +
                '<option value="Playhouse"' + (p.area === 'Playhouse' ? ' selected' : '') + '>Playhouse</option>' +
                '<option value="Cafe"' + (p.area === 'Cafe' ? ' selected' : '') + '>Cafe</option>' +
              '</select></div>' +
            '</div>' +

            '<div style="' + fieldWrap + '">' +
              '<label style="' + labelStyle + '">' + iconSvg(icons.title, '#94a3b8') + ' Title <span style="color:#ef4444;">*</span></label>' +
              '<div style="position:relative;"><span style="position:absolute;left:12px;top:50%;transform:translateY(-50%);pointer-events:none;">' + iconSvg(icons.title, '#475569') + '</span>' +
              '<input type="text" id="p-title" value="' + esc(p.title || '') + '" placeholder="e.g. July 2026 Operations Plan" style="' + inputStyle + '" ' + inputFocus + '></div>' +
            '</div>' +

            '<div style="' + fieldWrap + '">' +
              '<label style="' + labelStyle + '">' + iconSvg(icons.month, '#94a3b8') + ' Proposal Month</label>' +
              '<div style="position:relative;"><span style="position:absolute;left:12px;top:50%;transform:translateY(-50%);pointer-events:none;">' + iconSvg(icons.month, '#475569') + '</span>' +
              '<select id="p-month" style="' + selectStyle + '" ' + inputFocus + '>' + monthOptions + '</select></div>' +
            '</div>' +

            '<div style="' + fieldWrap + '">' +
              '<label style="' + labelStyle + '">' + iconSvg(icons.amount, '#94a3b8') + ' Budget Amount (₱)</label>' +
              '<div style="position:relative;"><span style="position:absolute;left:12px;top:50%;transform:translateY(-50%);pointer-events:none;">' + iconSvg(icons.amount, '#22c55e') + '</span>' +
              '<input type="number" id="p-amount" min="0" value="' + (p.amount || 0) + '" placeholder="0" style="' + inputStyle.replace('#e2e8f0', '#22c55e').replace('#1e2a3a', '#1a3020') + '" ' + inputFocus + '></div>' +
            '</div>' +
          '</div>' +

          '<div style="background:linear-gradient(180deg,#111827,#0d1117);border:1px solid #1e293b;border-radius:14px;padding:22px;display:flex;flex-direction:column;">' +
            '<div style="display:flex;align-items:center;gap:8px;margin-bottom:18px;padding-bottom:12px;border-bottom:1px solid #1e293b;">' +
              '<div style="width:28px;height:28px;border-radius:7px;background:rgba(99,102,241,0.1);display:flex;align-items:center;justify-content:center;">' + iconSvg(icons.desc, '#6366f1') + '</div>' +
              '<span style="color:#e2e8f0;font-weight:700;font-size:0.85rem;">Description</span>' +
            '</div>' +
            '<div style="flex:1;position:relative;">' +
              '<textarea id="p-desc" rows="10" placeholder="Describe your proposal in detail...&#10;&#10;• What is the purpose?&#10;• Expected outcomes&#10;• Budget breakdown&#10;• Timeline" style="width:100%;height:calc(100% - 4px);background:#080c18;border:1px solid #1e2a3a;border-radius:10px;padding:12px 14px;color:#e2e8f0;font-size:0.85rem;resize:none;font-family:inherit;line-height:1.6;transition:all 0.3s;outline:none;box-sizing:border-box;" ' + inputFocus + '>' + esc(p.description || '') + '</textarea>' +
            '</div>' +
          '</div>' +

        '</div>' +

        '<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:24px;padding-top:20px;border-top:1px solid #1e293b;">' +
          '<button onclick="window.__proposalSave()" style="background:linear-gradient(135deg,#6366f1,#4f46e5);color:#fff;border:none;border-radius:10px;padding:10px 24px;cursor:pointer;font-weight:700;font-size:0.85rem;display:inline-flex;align-items:center;gap:8px;box-shadow:0 4px 14px #6366f133;transition:all 0.2s;" onmouseenter="this.style.transform=\'translateY(-1px)\';this.style.boxShadow=\'0 6px 20px #6366f144\'" onmouseleave="this.style.transform=\'translateY(0)\';this.style.boxShadow=\'0 4px 14px #6366f133\'">' + iconSvg(icons.save, 'white') + ' Save Draft</button>' +
          (isNew || p.status === 'draft' || p.status === 'declined' ?
            '<button onclick="window.__proposalSaveSubmit()" style="background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff;border:none;border-radius:10px;padding:10px 24px;cursor:pointer;font-weight:700;font-size:0.85rem;display:inline-flex;align-items:center;gap:8px;box-shadow:0 4px 14px #22c55e33;transition:all 0.2s;" onmouseenter="this.style.transform=\'translateY(-1px)\';this.style.boxShadow=\'0 6px 20px #22c55e44\'" onmouseleave="this.style.transform=\'translateY(0)\';this.style.boxShadow=\'0 4px 14px #22c55e33\'">' + iconSvg(icons.send, 'white') + ' Save & Submit</button>' : '') +
        '</div>' +

      '</div>' +

      '</div></div></div>';
  }

  function renderDetail(isOwner) {
    var p = editingProposal;
    var user = Auth.getUser();
    var canEdit = isOwner || p.created_by === user.id;

    app.innerHTML = '<div class="layout">' + renderSidebar() +
      '<div class="main-content">' + renderNavbar('Proposal Details') +
      '<div class="page-content" id="page-body">' +

      '<div style="margin-bottom:20px;">' +
        '<button onclick="window.__proposalBack()" style="background:#374151;color:#e2e8f0;border:none;border-radius:6px;padding:6px 14px;cursor:pointer;font-size:0.8rem;">← Back</button>' +
      '</div>' +

      '<div style="display:grid;grid-template-columns:1fr 300px;gap:20px;">' +
        '<div>' +
          '<div style="background:#1a1f2e;border:1px solid #2a3040;border-radius:12px;padding:20px;">' +
            '<div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:16px;">' +
              '<div>' +
                '<h3 style="color:#e2e8f0;margin:0 0 6px;font-size:1.1rem;">' + esc(p.title) + '</h3>' +
                '<div style="display:flex;gap:10px;align-items:center;">' +
                  statusBadge(p.status) +
                  '<span style="background:' + ({ Arcade: '#6366f1', Playhouse: '#22c55e', Cafe: '#f59e0b' }[p.area] || '#94a3b8') + '18;color:' + ({ Arcade: '#6366f1', Playhouse: '#22c55e', Cafe: '#f59e0b' }[p.area] || '#94a3b8') + ';border:1px solid ' + ({ Arcade: '#6366f1', Playhouse: '#22c55e', Cafe: '#f59e0b' }[p.area] || '#94a3b8') + '44;padding:3px 10px;border-radius:12px;font-size:0.7rem;font-weight:700;text-transform:uppercase;">' + (p.area || '-') + '</span>' +
                  '<span style="color:#64748b;font-size:0.75rem;">' + formatMonth(p.proposal_month) + '</span>' +
                '</div>' +
              '</div>' +
              '<div style="display:flex;gap:6px;">' +
                (canEdit && p.status !== 'approved' ?
                  '<button onclick="window.__proposalEdit(' + p.id + ')" style="background:#6366f1;color:#fff;border:none;border-radius:6px;padding:6px 14px;cursor:pointer;font-size:0.8rem;">Edit</button>' : '') +
                (isOwner && p.status === 'submitted' ?
                  '<button onclick="window.__proposalApprove(' + p.id + ')" style="background:#22c55e;color:#fff;border:none;border-radius:6px;padding:6px 14px;cursor:pointer;font-size:0.8rem;">Approve</button>' +
                  '<button onclick="window.__proposalDecline(' + p.id + ')" style="background:#ef4444;color:#fff;border:none;border-radius:6px;padding:6px 14px;cursor:pointer;font-size:0.8rem;">Decline</button>' : '') +
              '</div>' +
            '</div>' +

            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">' +
              '<div style="background:#0d1117;border-radius:8px;padding:10px;">' +
                '<div style="color:#64748b;font-size:0.65rem;text-transform:uppercase;margin-bottom:4px;">Branch</div>' +
                '<div style="color:#e2e8f0;font-weight:600;">' + (p.branch_name || '-') + '</div>' +
              '</div>' +
              '<div style="background:#0d1117;border-radius:8px;padding:10px;">' +
                '<div style="color:#64748b;font-size:0.65rem;text-transform:uppercase;margin-bottom:4px;">Amount</div>' +
                '<div style="color:#22c55e;font-weight:700;font-size:1rem;">' + formatCurrency(p.amount || 0) + '</div>' +
              '</div>' +
              '<div style="background:#0d1117;border-radius:8px;padding:10px;">' +
                '<div style="color:#64748b;font-size:0.65rem;text-transform:uppercase;margin-bottom:4px;">Created By</div>' +
                '<div style="color:#e2e8f0;font-weight:600;">' + (p.creator_name || '-') + '</div>' +
              '</div>' +
              '<div style="background:#0d1117;border-radius:8px;padding:10px;">' +
                '<div style="color:#64748b;font-size:0.65rem;text-transform:uppercase;margin-bottom:4px;">Date Created</div>' +
                '<div style="color:#e2e8f0;font-weight:600;">' + timeAgo(p.created_at) + '</div>' +
              '</div>' +
            '</div>' +

            '<div style="margin-bottom:16px;">' +
              '<div style="color:#64748b;font-size:0.65rem;text-transform:uppercase;margin-bottom:6px;">Description</div>' +
              '<div style="color:#cbd5e1;font-size:0.85rem;line-height:1.6;white-space:pre-wrap;background:#0d1117;border-radius:8px;padding:12px;">' + esc(p.description || 'No description provided.') + '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +

        '<div style="display:flex;flex-direction:column;gap:12px;">' +
          (isOwner ? '<div style="background:#1a1f2e;border:1px solid #2a3040;border-radius:12px;padding:16px;">' +
            '<div style="color:#f59e0b;font-weight:700;font-size:0.8rem;margin-bottom:10px;">Owner Comment</div>' +
            '<textarea id="owner-comment" rows="4" style="width:100%;background:#0d1117;border:1px solid #30363d;border-radius:6px;padding:8px;color:#e2e8f0;font-size:0.85rem;resize:vertical;font-family:inherit;">' + esc(p.owner_comment || '') + '</textarea>' +
            '<button onclick="window.__proposalSaveComment(' + p.id + ')" style="margin-top:8px;width:100%;background:#f59e0b;color:#000;border:none;border-radius:6px;padding:7px;cursor:pointer;font-weight:600;font-size:0.8rem;">Save Comment</button>' +
          '</div>' : '') +

          (p.owner_comment && !isOwner ? '<div style="background:#1a1f2e;border:1px solid #2a3040;border-radius:12px;padding:16px;">' +
            '<div style="color:#f59e0b;font-weight:700;font-size:0.8rem;margin-bottom:10px;">Owner Comment</div>' +
            '<div style="color:#cbd5e1;font-size:0.85rem;line-height:1.6;white-space:pre-wrap;background:#0d1117;border-radius:8px;padding:12px;">' + esc(p.owner_comment) + '</div>' +
          '</div>' : '') +

          '<div style="background:#1a1f2e;border:1px solid #2a3040;border-radius:12px;padding:16px;">' +
            '<div style="color:#64748b;font-size:0.65rem;text-transform:uppercase;margin-bottom:8px;">Timeline</div>' +
            '<div style="color:#94a3b8;font-size:0.75rem;">Created: ' + timeAgo(p.created_at) + '</div>' +
            '<div style="color:#94a3b8;font-size:0.75rem;">Updated: ' + timeAgo(p.updated_at) + '</div>' +
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
  window.__proposalSaveComment = function(id) { saveOwnerComment(id); };
  window.__proposalFilterMonth = async function(val) { filterMonth = val; await loadProposals(); render(); };
  window.__proposalFilterStatus = function(val) { filterStatus = val; render(); };
  window.__proposalFilterArea = async function(val) { filterArea = val; await loadProposals(); render(); };

  loadData();
}

Router.register('proposals', renderAdminProposals);
