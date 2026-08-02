function renderAdminLoyalty() {
  var app = document.getElementById('app');
  var members = [];
  var branches = [];
  var stats = {};
  var selectedBranch = '';
  var view = 'list';
  var selectedMember = null;
  var searchTerm = '';
  var filterTier = '';
  var historyData = [];
  var trashData = [];
  var viewTab = 'members';
  var historyPage = 1;
  var historyPageSize = 10;


  var TIERS = {
    none: { label: 'None', color: '#64748b', gradient: 'linear-gradient(135deg, #1e293b, #334155)', icon: '🎟️' },
    silver: { label: 'Silver', color: '#c0c0c0', gradient: 'linear-gradient(135deg, #6b7280, #d1d5db, #9ca3af, #e5e7eb, #9ca3af)', icon: '🥈' },
    gold: { label: 'Gold', color: '#fbbf24', gradient: 'linear-gradient(135deg, #b45309, #fbbf24, #f59e0b, #fde68a, #d97706)', icon: '🥇' },
    black: { label: 'Black', color: '#a5b4fc', gradient: 'linear-gradient(135deg, #0a0a15, #1a1a2e, #2d2d44, #0f0f1a, #1a1a2e)', icon: '👑' }
  };

  async function loadData() {
    try {
      branches = await apiGet('/branches');
      if (!Array.isArray(branches)) branches = [];
      var user = Auth.getUser();
      if (user && user.role !== 'owner' && user.branch_id) {
        selectedBranch = String(user.branch_id);
      } else if (branches.length > 0 && !selectedBranch) {
        selectedBranch = String(branches[0].id);
      }
      await loadStats();
      await Promise.all([loadMembers(), loadHistory(), loadTrash()]);
    } catch (e) {
      Toast.error('Failed to load data');
    }
  }

  async function loadMembers() {
    try {
      var params = [];
      if (selectedBranch) params.push('branch_id=' + selectedBranch);
      if (filterTier) params.push('tier=' + filterTier);
      if (searchTerm) params.push('search=' + searchTerm);
      var url = '/members' + (params.length ? '?' + params.join('&') : '');
      members = await apiGet(url);
      if (!Array.isArray(members)) members = [];
    } catch (e) {
      members = [];
    }
    render();
  }

  async function loadStats() {
    try {
      var params = selectedBranch ? '?branch_id=' + selectedBranch : '';
      stats = await apiGet('/members/stats/summary' + params);
    } catch (e) {
      stats = {};
    }
  }

  async function loadHistory() {
    try {
      var params = [];
      if (selectedBranch) params.push('branch_id=' + selectedBranch);
      if (searchTerm) params.push('search=' + searchTerm);
      var url = '/members/history/all' + (params.length ? '?' + params.join('&') : '');
      historyData = await apiGet(url);
      if (!Array.isArray(historyData)) historyData = [];
    } catch (e) {
      historyData = [];
    }
    render();
  }

  async function loadTrash() {
    try {
      var params = [];
      if (selectedBranch) params.push('branch_id=' + selectedBranch);
      if (searchTerm) params.push('search=' + searchTerm);
      var url = '/members/trash/list' + (params.length ? '?' + params.join('&') : '');
      trashData = await apiGet(url);
      if (!Array.isArray(trashData)) trashData = [];
    } catch (e) {
      trashData = [];
    }
    render();
  }

  async function viewMember(id) {
    try {
      selectedMember = await apiGet('/members/' + id);
      view = 'detail';
      render();
    } catch (e) {
      Toast.error('Failed to load member');
    }
  }

  function renderCard(member, size) {
    var tier = TIERS[member.card_tier] || TIERS.none;
    var w = size === 'large' ? '340px' : '210px';
    var h = size === 'large' ? '214px' : '132px';
    var fs = size === 'large' ? '1' : '0.62';
    var nameSize = size === 'large' ? '1.1rem' : '0.7rem';
    var numSize = size === 'large' ? '0.85rem' : '0.55rem';
    var tierSize = size === 'large' ? '0.7rem' : '0.45rem';
    var logoSize = size === 'large' ? '1.5rem' : '0.9rem';
    var ptsSize = size === 'large' ? '1.5rem' : '0.9rem';

    var cardBg = member.card_tier === 'black'
      ? 'linear-gradient(135deg, #0a0a15, #1a1a2e, #2d2d44, #0f0f1a, #1a1a2e)'
      : member.card_tier === 'gold'
      ? 'linear-gradient(135deg, #b45309, #fbbf24, #f59e0b, #fde68a, #d97706)'
      : member.card_tier === 'silver'
      ? 'linear-gradient(135deg, #6b7280, #d1d5db, #9ca3af, #e5e7eb, #9ca3af)'
      : 'linear-gradient(135deg, #1e293b, #334155)';

    var textColor = member.card_tier === 'gold' ? '#422006' : member.card_tier === 'black' ? '#e2e8f0' : '#e2e8f0';
    var subColor = member.card_tier === 'gold' ? '#78350f' : member.card_tier === 'silver' ? '#d1d5db' : 'rgba(255,255,255,0.5)';
    var borderColor = member.card_tier === 'gold' ? '#f59e0b' : member.card_tier === 'silver' ? '#9ca3af' : member.card_tier === 'black' ? '#6366f1' : '#334155';

    return '<div style="width:' + w + ';height:' + h + ';background:' + cardBg + ';border-radius:12px;border:1px solid ' + borderColor + ';position:relative;overflow:hidden;padding:' + (size === 'large' ? '20px' : '12px') + ';display:flex;flex-direction:column;justify-content:space-between;font-family:Arial,sans-serif;">' +
      '<div style="position:absolute;top:-20px;right:-20px;width:' + (size === 'large' ? '80px' : '50px') + ';height:' + (size === 'large' ? '80px' : '50px') + ';border-radius:50%;background:rgba(255,255,255,0.05);"></div>' +
      '<div style="position:absolute;bottom:-30px;left:-10px;width:' + (size === 'large' ? '100px' : '60px') + ';height:' + (size === 'large' ? '100px' : '60px') + ';border-radius:50%;background:rgba(255,255,255,0.03);"></div>' +
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;">' +
        '<div style="display:flex;align-items:center;gap:' + (size === 'large' ? '8px' : '5px') + ';">' +
          '<div style="font-size:' + logoSize + ';">🕹️</div>' +
          '<div><div style="color:' + textColor + ';font-weight:800;font-size:' + (size === 'large' ? '0.75rem' : '0.5rem') + ';letter-spacing:2px;">DREAMLAND</div>' +
          '<div style="color:' + subColor + ';font-size:' + (size === 'large' ? '0.55rem' : '0.38rem') + ';letter-spacing:1px;">ARCADE</div></div>' +
        '</div>' +
        '<div style="text-align:right;">' +
          '<div style="color:' + (member.card_tier === 'gold' ? '#92400e' : '#fff') + ';font-weight:800;font-size:' + tierSize + ';letter-spacing:2px;text-transform:uppercase;">' + tier.icon + ' ' + tier.label + '</div>' +
        '</div>' +
      '</div>' +
      '<div>' +
        '<div style="color:' + textColor + ';font-weight:700;font-size:' + nameSize + ';letter-spacing:1px;margin-bottom:' + (size === 'large' ? '4px' : '2px') + ';">' + esc(member.first_name) + ' ' + esc(member.last_name) + '</div>' +
        '<div style="color:' + subColor + ';font-size:' + numSize + ';letter-spacing:2px;font-family:monospace;">' + esc(member.card_number) + '</div>' +
      '</div>' +
      '<div style="display:flex;justify-content:space-between;align-items:flex-end;">' +
        '<div>' +
          '<div style="color:' + subColor + ';font-size:' + tierSize + ';letter-spacing:1px;">POINTS</div>' +
          '<div style="color:' + textColor + ';font-weight:900;font-size:' + ptsSize + ';">' + (member.total_points || 0).toLocaleString() + '</div>' +
        '</div>' +
        '<div style="text-align:right;">' +
          '<div style="color:' + subColor + ';font-size:' + tierSize + ';letter-spacing:1px;">BONUS TOKENS</div>' +
          '<div style="color:' + textColor + ';font-weight:700;font-size:' + (size === 'large' ? '0.85rem' : '0.55rem') + ';">' + (member.bonus_tokens_earned || 0) + '</div>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  async function issueCard() {
    var html = '<form id="issue-form" style="display:flex;flex-direction:column;gap:12px;">' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">' +
        '<div><label style="color:#94a3b8;font-size:0.75rem;display:block;margin-bottom:4px;">First Name *</label>' +
        '<input type="text" name="first_name" required style="width:100%;background:#0d1117;border:1px solid #30363d;border-radius:6px;padding:8px;color:#e2e8f0;font-size:0.85rem;"></div>' +
        '<div><label style="color:#94a3b8;font-size:0.75rem;display:block;margin-bottom:4px;">Last Name *</label>' +
        '<input type="text" name="last_name" required style="width:100%;background:#0d1117;border:1px solid #30363d;border-radius:6px;padding:8px;color:#e2e8f0;font-size:0.85rem;"></div>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">' +
        '<div><label style="color:#94a3b8;font-size:0.75rem;display:block;margin-bottom:4px;">Phone</label>' +
        '<input type="text" name="phone" style="width:100%;background:#0d1117;border:1px solid #30363d;border-radius:6px;padding:8px;color:#e2e8f0;font-size:0.85rem;"></div>' +
        '<div><label style="color:#94a3b8;font-size:0.75rem;display:block;margin-bottom:4px;">Email</label>' +
        '<input type="email" name="email" style="width:100%;background:#0d1117;border:1px solid #30363d;border-radius:6px;padding:8px;color:#e2e8f0;font-size:0.85rem;"></div>' +
      '</div>' +
      '<div style="display:flex;justify-content:flex-end;gap:8px;margin-top:8px;">' +
        '<button type="button" onclick="Modal.close()" style="background:#374151;color:#9ca3af;border:none;border-radius:6px;padding:8px 20px;cursor:pointer;">Cancel</button>' +
        '<button type="submit" style="background:#6366f1;color:#fff;border:none;border-radius:6px;padding:8px 20px;cursor:pointer;font-weight:600;">Issue Card</button>' +
      '</div></form>';

    Modal.show('Issue Loyalty Card', html, { width: '480px' });

    document.getElementById('issue-form').addEventListener('submit', async function(e) {
      e.preventDefault();
      var f = e.target;
      try {
        var result = await apiPost('/members', {
          first_name: f.first_name.value,
          last_name: f.last_name.value,
          phone: f.phone.value || null,
          email: f.email.value || null,
          branch_id: parseInt(selectedBranch) || null
        });
        Toast.success('Card issued! Number: ' + result.card_number);
        Modal.close();
        await loadMembers();
        await loadStats();
      } catch (err) {
        Toast.error(err.message || 'Failed to issue card');
      }
    });
  }

  async function recordPurchase(member) {
    var tier = TIERS[member.card_tier] || TIERS.none;
    var TIER_BONUS_PCT = { silver: 0.05, gold: 0.10, black: 0.15, none: 0 };
    var bonusPctLabel = { silver: '5%', gold: '10%', black: '15%', none: '0%' };
    var tierBorderColor = member.card_tier === 'gold' ? '#f59e0b' : member.card_tier === 'silver' ? '#9ca3af' : member.card_tier === 'black' ? '#6366f1' : '#30363d';
    var bonusRate = TIER_BONUS_PCT[member.card_tier] || 0;

    var html = '' +
      '<div style="text-align:center;margin-bottom:20px;">' +
        '<div style="display:inline-block;">' + renderCard(member, 'large') + '</div>' +
      '</div>' +
      '<div style="background:linear-gradient(135deg,#0f172a,#1e293b);border:1px solid #2a3040;border-radius:12px;padding:16px;margin-bottom:16px;">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">' +
          '<div style="color:#94a3b8;font-size:0.75rem;text-transform:uppercase;letter-spacing:1px;">Tier Bonus</div>' +
          '<div style="color:' + tier.color + ';font-weight:700;font-size:0.9rem;">' + tier.icon + ' ' + bonusPctLabel[member.card_tier] + ' extra tokens</div>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">' +
          '<div style="background:#0d1117;border:1px solid #1e2736;border-radius:8px;padding:10px;text-align:center;">' +
            '<div style="color:#666;font-size:0.65rem;margin-bottom:4px;">CURRENT POINTS</div>' +
            '<div style="color:#6366f1;font-weight:700;font-size:1.1rem;">' + (member.total_points || 0).toLocaleString() + '</div>' +
          '</div>' +
          '<div style="background:#0d1117;border:1px solid #1e2736;border-radius:8px;padding:10px;text-align:center;">' +
            '<div style="color:#666;font-size:0.65rem;margin-bottom:4px;">TOTAL SPENT</div>' +
            '<div style="color:#22c55e;font-weight:700;font-size:1.1rem;">' + formatCurrency(member.total_spent || 0) + '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<form id="purchase-form" style="display:flex;flex-direction:column;gap:14px;">' +
        '<div>' +
          '<label style="color:#94a3b8;font-size:0.75rem;display:block;margin-bottom:6px;font-weight:600;">Purchase Amount</label>' +
          '<div style="position:relative;">' +
            '<span style="position:absolute;left:14px;top:50%;transform:translateY(-50%);color:#6366f1;font-weight:700;font-size:1.2rem;">₱</span>' +
            '<input type="number" name="amount" min="1" step="0.01" required id="purchase-amount" ' +
              'style="width:100%;background:#0d1117;border:2px solid #30363d;border-radius:10px;padding:14px 14px 14px 32px;color:#e2e8f0;font-size:1.3rem;font-weight:700;font-family:monospace;transition:border-color 0.2s,box-shadow 0.2s;" ' +
              'placeholder="0.00" ' +
              'onfocus="this.style.borderColor=\'#6366f1\';this.style.boxShadow=\'0 0 0 3px rgba(99,102,241,0.15)\'" ' +
              'onblur="this.style.borderColor=\'#30363d\';this.style.boxShadow=\'none\'">' +
          '</div>' +
        '</div>' +
        '<div id="purchase-preview" style="background:#0f172a;border:1px solid #1e293b;border-radius:10px;padding:14px;display:none;">' +
          '<div style="color:#64748b;font-size:0.7rem;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;">After This Purchase</div>' +
          '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;">' +
            '<div style="text-align:center;">' +
              '<div style="color:#666;font-size:0.6rem;margin-bottom:2px;">POINTS EARNED</div>' +
              '<div id="preview-pts" style="color:#22c55e;font-weight:700;font-size:1rem;">+0</div>' +
            '</div>' +
            '<div style="text-align:center;border-left:1px solid #1e2936;border-right:1px solid #1e2936;">' +
              '<div style="color:#666;font-size:0.6rem;margin-bottom:2px;">BONUS TOKENS</div>' +
              '<div id="preview-bonus" style="color:#f59e0b;font-weight:700;font-size:1rem;">+0</div>' +
            '</div>' +
            '<div style="text-align:center;">' +
              '<div style="color:#666;font-size:0.6rem;margin-bottom:2px;">NEW TOTAL</div>' +
              '<div id="preview-total" style="color:#a5b4fc;font-weight:700;font-size:1rem;">' + (member.total_points || 0).toLocaleString() + '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div>' +
          '<label style="color:#94a3b8;font-size:0.75rem;display:block;margin-bottom:6px;font-weight:600;">Description</label>' +
          '<input type="text" name="description" ' +
            'style="width:100%;background:#0d1117;border:1px solid #30363d;border-radius:8px;padding:10px 14px;color:#e2e8f0;font-size:0.85rem;transition:border-color 0.2s;" ' +
            'placeholder="e.g. 250 Token Repack" ' +
            'onfocus="this.style.borderColor=\'#6366f1\'" onblur="this.style.borderColor=\'#30363d\'">' +
        '</div>' +
        '<div style="display:flex;gap:10px;margin-top:6px;">' +
          '<button type="button" onclick="Modal.close()" ' +
            'style="flex:1;padding:12px;border:1px solid #30363d;border-radius:10px;background:#0d1117;color:#94a3b8;font-size:0.9rem;font-weight:600;cursor:pointer;transition:all 0.2s;" ' +
            'onmouseenter="this.style.borderColor=\'#ef4444\';this.style.color=\'#fca5a5\'" ' +
            'onmouseleave="this.style.borderColor=\'#30363d\';this.style.color=\'#94a3b8\'">Cancel</button>' +
          '<button type="submit" ' +
            'style="flex:2;padding:12px;border:none;border-radius:10px;background:linear-gradient(135deg,#22c55e,#10b981);color:#fff;font-size:0.9rem;font-weight:700;cursor:pointer;transition:all 0.2s;box-shadow:0 4px 15px rgba(34,197,94,0.25);" ' +
            'onmouseenter="this.style.boxShadow=\'0 6px 25px rgba(34,197,94,0.4)\';this.style.transform=\'translateY(-1px)\'" ' +
            'onmouseleave="this.style.boxShadow=\'0 4px 15px rgba(34,197,94,0.25)\';this.style.transform=\'translateY(0)\'">' +
            '⚡ Record Purchase' +
          '</button>' +
        '</div>' +
      '</form>';

    Modal.show('Record Purchase', html, { width: '440px' });

    var amountInput = document.getElementById('purchase-amount');
    var previewBox = document.getElementById('purchase-preview');
    var previewPts = document.getElementById('preview-pts');
    var previewBonus = document.getElementById('preview-bonus');
    var previewTotal = document.getElementById('preview-total');

    function updatePreview() {
      var val = parseFloat(amountInput.value) || 0;
      if (val > 0) {
        previewBox.style.display = 'block';
        var pts = Math.floor(val);
        var bonus = Math.floor(val / 5 * bonusRate);
        var newTotal = (member.total_points || 0) + pts;
        previewPts.textContent = '+' + pts.toLocaleString();
        previewBonus.textContent = '+' + bonus;
        previewTotal.textContent = newTotal.toLocaleString();
      } else {
        previewBox.style.display = 'none';
      }
    }

    amountInput.addEventListener('input', updatePreview);

    document.getElementById('purchase-form').addEventListener('submit', async function(e) {
      e.preventDefault();
      var f = e.target;
      try {
        var result = await apiPost('/members/' + member.id + '/purchase', {
          member_id: member.id,
          amount: parseFloat(f.amount.value),
          description: f.description.value || null
        });
        var msg = '+' + result.points_earned + ' pts';
        if (result.bonus_tokens > 0) msg += ', +' + result.bonus_tokens + ' bonus tokens';
        if (result.tier_upgraded) msg += ' | TIER UP!';
        Toast.success(msg);
        Modal.close();
        await loadMembers();
        await loadStats();
        if (selectedMember && selectedMember.id === member.id) {
          selectedMember = await apiGet('/members/' + member.id);
          render();
        }
      } catch (err) {
        Toast.error(err.message || 'Failed to record purchase');
      }
    });
  }

  function render() {
    var user = Auth.getUser();
    var isOwner = user && user.role === 'owner';

    if (view === 'detail' && selectedMember) {
      renderDetail(isOwner);
      return;
    }

    var totalMembers = stats.total_members || 0;
    var totalSpent = stats.total_spent || 0;
    var trashCount = stats.trash_count || 0;

    var tabs = [
      { id: 'members', label: 'Members', count: totalMembers },
      { id: 'history', label: 'History', count: stats.history_count || '' },
      { id: 'trash', label: 'Trash', count: trashCount }
    ];

    var tabBtns = tabs.map(function(t) {
      var active = viewTab === t.id;
      return '<button onclick="window.__loyTab(\'' + t.id + '\')" ' +
        'style="padding:8px 18px;border-radius:8px;border:none;font-size:0.85rem;font-weight:600;cursor:pointer;transition:all 0.2s;' +
        (active ? 'background:linear-gradient(135deg,#6366f1,#818cf8);color:#fff;box-shadow:0 2px 10px rgba(99,102,241,0.3);' : 'background:#0d1117;color:#64748b;border:1px solid #1e2936;') +
        '">' + t.label + (t.count !== '' ? ' <span style="opacity:0.7;font-size:0.75rem;">(' + t.count + ')</span>' : '') + '</button>';
    }).join('');

    app.innerHTML = '<div class="layout">' + renderSidebar() +
      '<div class="main-content">' + renderNavbar('Loyalty Cards') +
      '<div class="page-content" id="page-body">' +

      '<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:20px;">' +
        '<div style="background:#1a1f2e;border:1px solid #2a3040;border-radius:10px;padding:14px;text-align:center;">' +
          '<div style="color:#888;font-size:0.7rem;margin-bottom:4px;">TOTAL MEMBERS</div>' +
          '<div style="color:#e2e8f0;font-weight:700;font-size:1.3rem;">' + totalMembers + '</div></div>' +
        '<div style="background:#1a1f2e;border:1px solid #c0c0c030;border-radius:10px;padding:14px;text-align:center;">' +
          '<div style="color:#c0c0c0;font-size:0.7rem;margin-bottom:4px;">🥈 SILVER</div>' +
          '<div style="color:#c0c0c0;font-weight:700;font-size:1.3rem;">' + (stats.silver || 0) + '</div></div>' +
        '<div style="background:#1a1f2e;border:1px solid #fbbf2430;border-radius:10px;padding:14px;text-align:center;">' +
          '<div style="color:#fbbf24;font-size:0.7rem;margin-bottom:4px;">🥇 GOLD</div>' +
          '<div style="color:#fbbf24;font-weight:700;font-size:1.3rem;">' + (stats.gold || 0) + '</div></div>' +
        '<div style="background:#1a1f2e;border:1px solid #6366f130;border-radius:10px;padding:14px;text-align:center;">' +
          '<div style="color:#a5b4fc;font-size:0.7rem;margin-bottom:4px;">👑 BLACK</div>' +
          '<div style="color:#a5b4fc;font-weight:700;font-size:1.3rem;">' + (stats.black || 0) + '</div></div>' +
        '<div style="background:#1a1f2e;border:1px solid #22c55e30;border-radius:10px;padding:14px;text-align:center;">' +
          '<div style="color:#22c55e;font-size:0.7rem;margin-bottom:4px;">TOTAL REVENUE</div>' +
          '<div style="color:#22c55e;font-weight:700;font-size:1.3rem;">' + formatCurrency(totalSpent) + '</div></div>' +
      '</div>' +

      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:12px;">' +
        '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">' + tabBtns + '</div>' +
        '<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">' +
          (isOwner ?
            '<select id="loy-branch" style="background:#0d1117;border:1px solid #30363d;border-radius:6px;padding:8px 12px;color:#e2e8f0;font-size:0.85rem;">' +
            branches.map(function(b) { return '<option value="' + b.id + '"' + (String(b.id) === String(selectedBranch) ? ' selected' : '') + '>' + esc(b.name) + '</option>'; }).join('') +
            '</select>' : '') +
          '<input type="text" id="loy-search" placeholder="Search name or card #..." style="background:#0d1117;border:1px solid #30363d;border-radius:6px;padding:8px 12px;color:#e2e8f0;font-size:0.85rem;width:200px;" value="' + esc(searchTerm) + '">' +
        '</div>' +
      '</div>' +

      (viewTab === 'members' ?
        '<div style="display:flex;justify-content:flex-end;gap:8px;margin-bottom:16px;">' +
          '<button onclick="window.__loyIssue()" style="background:#6366f1;color:#fff;border:none;border-radius:8px;padding:8px 20px;cursor:pointer;font-weight:600;font-size:0.85rem;">+ Issue Card</button>' +
          '<button onclick="window.__loyPreview()" style="background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;border:none;border-radius:8px;padding:8px 20px;cursor:pointer;font-weight:600;font-size:0.85rem;">★ Card Designs</button>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px;">' +
        (members.length === 0 ? '<div style="grid-column:1/-1;text-align:center;padding:60px;color:#666;">No members found. Issue a card to get started.</div>' :
          members.map(function(m) {
            return '<div onclick="window.__loyView(' + m.id + ')" style="cursor:pointer;transition:transform 0.15s;" onmouseenter="this.style.transform=\'translateY(-3px)\'" onmouseleave="this.style.transform=\'translateY(0)\'">' +
              renderCard(m, 'small') +
            '</div>';
          }).join('')) +
        '</div>'
      : '') +

      (viewTab === 'history' ? renderHistory() : '') +
      (viewTab === 'trash' ? renderTrash() : '') +

      '</div></div></div>';

    attachListEvents();
  }

  function renderPagination(total, page, size) {
    var totalPages = Math.max(1, Math.ceil(total / size));
    if (page > totalPages) page = totalPages;
    var start = total === 0 ? 0 : (page - 1) * size + 1;
    var end = Math.min(page * size, total);

    var pages = [];
    if (totalPages <= 7) {
      for (var i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push('...');
      for (var i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
      if (page < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }

    var btnBase = 'display:inline-flex;align-items:center;justify-content:center;min-width:36px;height:36px;border:1px solid #1e293b;border-radius:8px;background:#0f172a;color:#94a3b8;font-size:0.8rem;font-weight:500;cursor:pointer;transition:all 0.15s;padding:0 8px;';
    var btnActive = 'display:inline-flex;align-items:center;justify-content:center;min-width:36px;height:36px;border:1px solid #6366f1;border-radius:8px;background:rgba(99,102,241,0.15);color:#a78bfa;font-size:0.8rem;font-weight:600;cursor:pointer;padding:0 8px;';
    var btnDisabled = 'display:inline-flex;align-items:center;justify-content:center;min-width:36px;height:36px;border:1px solid #1e293b;border-radius:8px;background:#0f172a;color:#334155;font-size:0.8rem;font-weight:500;cursor:not-allowed;padding:0 8px;';

    var html = '<div style="display:flex;align-items:center;justify-content:space-between;margin-top:16px;flex-wrap:wrap;gap:12px;">';
    html += '<div style="color:#64748b;font-size:0.8rem;">Showing <span style="color:#94a3b8;font-weight:600;">' + start + '-' + end + '</span> of <span style="color:#94a3b8;font-weight:600;">' + total + '</span> transactions</div>';
    html += '<div style="display:flex;align-items:center;gap:4px;">';
    html += '<button class="loy-page-btn" data-page="' + Math.max(1, page - 1) + '" style="' + (page <= 1 ? btnDisabled : btnBase) + '" ' + (page <= 1 ? 'disabled' : '') + '>\u2190</button>';
    pages.forEach(function(p) {
      if (p === '...') {
        html += '<span style="display:inline-flex;align-items:center;justify-content:center;min-width:36px;height:36px;color:#475569;font-size:0.8rem;">...</span>';
      } else {
        html += '<button class="loy-page-btn" data-page="' + p + '" style="' + (p === page ? btnActive : btnBase) + '">' + p + '</button>';
      }
    });
    html += '<button class="loy-page-btn" data-page="' + Math.min(totalPages, page + 1) + '" style="' + (page >= totalPages ? btnDisabled : btnBase) + '" ' + (page >= totalPages ? 'disabled' : '') + '>\u2192</button>';
    html += '<span style="color:#475569;font-size:0.75rem;margin-left:8px;">Page ' + page + ' of ' + totalPages + '</span>';
    html += '</div></div>';
    return html;
  }

  function renderHistory() {
    if (historyData.length === 0) {
      return '<div style="text-align:center;padding:60px;color:#666;">No transaction history found.</div>';
    }
    var totalPages = Math.max(1, Math.ceil(historyData.length / historyPageSize));
    if (historyPage > totalPages) historyPage = totalPages;
    var startIdx = (historyPage - 1) * historyPageSize;
    var pageItems = historyData.slice(startIdx, startIdx + historyPageSize);

    return '<div style="background:#1a1f2e;border:1px solid #2a3040;border-radius:12px;overflow:hidden;">' +
      '<div style="padding:14px 20px;border-bottom:1px solid #2a3040;color:#94a3b8;font-size:0.8rem;font-weight:600;display:flex;justify-content:space-between;align-items:center;">' +
        '<span>Transaction History</span>' +
        '<select id="loy-hist-page-size" style="background:#0d1117;border:1px solid #30363d;border-radius:6px;padding:4px 8px;color:#e2e8f0;font-size:0.75rem;">' +
          '<option value="5"' + (historyPageSize === 5 ? ' selected' : '') + '>5</option>' +
          '<option value="10"' + (historyPageSize === 10 ? ' selected' : '') + '>10</option>' +
          '<option value="25"' + (historyPageSize === 25 ? ' selected' : '') + '>25</option>' +
          '<option value="50"' + (historyPageSize === 50 ? ' selected' : '') + '>50</option>' +
        '</select>' +
      '</div>' +
      '<div>' +
      pageItems.map(function(t) {
        var tierInfo = TIERS[t.card_tier] || TIERS.none;
        return '<div style="display:flex;justify-content:space-between;align-items:center;padding:12px 20px;border-bottom:1px solid #1e2736;transition:background 0.15s;" onmouseenter="this.style.background=\'#1e2936\'" onmouseleave="this.style.background=\'transparent\'">' +
          '<div style="display:flex;align-items:center;gap:12px;">' +
            '<div style="width:36px;height:36px;border-radius:8px;background:linear-gradient(135deg,#6366f1,#818cf8);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:0.8rem;">' +
              esc((t.member_name || '??').charAt(0)) + '</div>' +
            '<div>' +
              '<div style="color:#e2e8f0;font-weight:600;font-size:0.85rem;">' + esc(t.member_name || 'Deleted Member') + '</div>' +
              '<div style="color:#666;font-size:0.7rem;">' + esc(t.card_number || '') + ' &middot; ' + tierInfo.icon + ' ' + tierInfo.label + '</div>' +
            '</div>' +
          '</div>' +
          '<div style="text-align:right;">' +
            '<div style="color:#22c55e;font-weight:600;font-size:0.85rem;">+' + formatCurrency(t.amount) + '</div>' +
            '<div style="color:#666;font-size:0.7rem;">+' + t.points_earned + ' pts' + (t.bonus_tokens > 0 ? ', +' + t.bonus_tokens + ' tokens' : '') + ' &middot; ' + (t.created_at ? t.created_at.split('T')[0] : '') + '</div>' +
          '</div>' +
        '</div>';
      }).join('') +
      '</div>' +
      renderPagination(historyData.length, historyPage, historyPageSize) +
      '</div>';
  }

  function renderTrash() {
    if (trashData.length === 0) {
      return '<div style="text-align:center;padding:60px;color:#666;">Trash is empty.</div>';
    }
    return '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px;">' +
      trashData.map(function(m) {
        var tier = TIERS[m.card_tier] || TIERS.none;
        return '<div style="background:#1a1f2e;border:1px solid #2a3040;border-radius:12px;padding:16px;opacity:0.8;">' +
          '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;">' +
            '<div style="display:flex;align-items:center;gap:10px;">' +
              '<div style="width:40px;height:40px;border-radius:10px;background:linear-gradient(135deg,#1e2936,#334155);display:flex;align-items:center;justify-content:center;color:#666;font-weight:700;">' +
                esc((m.first_name || '').charAt(0) + (m.last_name || '').charAt(0)) + '</div>' +
              '<div>' +
                '<div style="color:#94a3b8;font-weight:600;">' + esc(m.first_name) + ' ' + esc(m.last_name) + '</div>' +
                '<div style="color:#555;font-size:0.75rem;font-family:monospace;">' + esc(m.card_number) + '</div>' +
                '<div style="display:inline-flex;align-items:center;gap:4px;margin-top:4px;padding:2px 8px;border-radius:4px;font-size:0.65rem;font-weight:600;background:' + tier.color + '15;color:' + tier.color + ';border:1px solid ' + tier.color + '30;">' + tier.icon + ' ' + tier.label + '</div>' +
              '</div>' +
            '</div>' +
            '<div style="display:flex;gap:6px;">' +
              '<button onclick="window.__loyRestore(' + m.id + ')" title="Restore" style="background:#22c55e;color:#fff;border:none;border-radius:6px;padding:6px 8px;cursor:pointer;display:flex;align-items:center;justify-content:center;" onmouseenter="this.style.boxShadow=\'0 0 10px rgba(34,197,94,0.4)\'" onmouseleave="this.style.boxShadow=\'none\'"><svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a5 5 0 015 5v2M3 10l4 4M3 10l4-4"/></svg></button>' +
              '<button onclick="window.__loyPermanentDelete(' + m.id + ')" title="Delete permanently" style="background:#ef4444;color:#fff;border:none;border-radius:6px;padding:6px 8px;cursor:pointer;display:flex;align-items:center;justify-content:center;" onmouseenter="this.style.boxShadow=\'0 0 10px rgba(239,68,68,0.4)\'" onmouseleave="this.style.boxShadow=\'none\'"><svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>' +
            '</div>' +
          '</div>' +
          '<div style="color:#555;font-size:0.7rem;">Deleted: ' + (m.deleted_at || '') + '</div>' +
          '<div style="display:flex;gap:16px;margin-top:10px;">' +
            '<div><span style="color:#555;font-size:0.7rem;">Points</span><div style="color:#64748b;font-weight:700;">' + (m.total_points || 0).toLocaleString() + '</div></div>' +
            '<div><span style="color:#555;font-size:0.7rem;">Spent</span><div style="color:#64748b;font-weight:700;">' + formatCurrency(m.total_spent || 0) + '</div></div>' +
          '</div>' +
        '</div>';
      }).join('') +
    '</div>';
  }

  function renderDetail(isOwner) {
    var m = selectedMember;
    var tier = TIERS[m.card_tier] || TIERS.none;

    app.innerHTML = '<div class="layout">' + renderSidebar() +
      '<div class="main-content">' + renderNavbar(m.first_name + ' ' + m.last_name + ' - Loyalty Card') +
      '<div class="page-content" id="page-body" style="overflow-y:auto;">' +

      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">' +
        '<div style="display:flex;gap:10px;align-items:center;">' +
          '<button onclick="window.__loyBack()" style="background:#374151;color:#e2e8f0;border:none;border-radius:6px;padding:8px 16px;cursor:pointer;font-size:0.85rem;">\u2190 Back</button>' +
          '<span style="color:' + tier.color + ';font-weight:700;font-size:1rem;">' + tier.icon + ' ' + tier.label + ' Member</span>' +
        '</div>' +
        '<div style="display:flex;gap:8px;">' +
          '<button onclick="window.__loyPurchase(' + m.id + ')" style="background:#22c55e;color:#fff;border:none;border-radius:6px;padding:8px 20px;cursor:pointer;font-weight:600;">Record Purchase</button>' +
          '<button onclick="window.__loySoftDelete(' + m.id + ')" title="Delete member" style="background:#ef4444;color:#fff;border:none;border-radius:6px;padding:8px 10px;cursor:pointer;font-weight:600;display:flex;align-items:center;justify-content:center;" onmouseenter="this.style.boxShadow=\'0 0 12px rgba(239,68,68,0.4)\'" onmouseleave="this.style.boxShadow=\'none\'"><svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>' +
        '</div>' +
      '</div>' +

      '<div style="display:grid;grid-template-columns:340px 1fr;gap:20px;">' +
        '<div>' +
          renderCard(m, 'large') +
          '<div style="background:#1a1f2e;border:1px solid #2a3040;border-radius:12px;padding:16px;margin-top:16px;">' +
            '<div style="color:#94a3b8;font-size:0.75rem;font-weight:600;margin-bottom:12px;text-transform:uppercase;">Member Info</div>' +
            '<div style="display:flex;flex-direction:column;gap:8px;">' +
              '<div style="display:flex;justify-content:space-between;"><span style="color:#888;font-size:0.8rem;">Name</span><span style="color:#e2e8f0;font-weight:600;">' + esc(m.first_name) + ' ' + esc(m.last_name) + '</span></div>' +
              '<div style="display:flex;justify-content:space-between;"><span style="color:#888;font-size:0.8rem;">Card #</span><span style="color:#e2e8f0;font-weight:600;font-family:monospace;">' + esc(m.card_number) + '</span></div>' +
              (m.phone ? '<div style="display:flex;justify-content:space-between;"><span style="color:#888;font-size:0.8rem;">Phone</span><span style="color:#e2e8f0;font-weight:600;">' + esc(m.phone) + '</span></div>' : '') +
              (m.email ? '<div style="display:flex;justify-content:space-between;"><span style="color:#888;font-size:0.8rem;">Email</span><span style="color:#e2e8f0;font-weight:600;">' + esc(m.email) + '</span></div>' : '') +
              '<div style="display:flex;justify-content:space-between;"><span style="color:#888;font-size:0.8rem;">Since</span><span style="color:#e2e8f0;font-weight:600;">' + esc(m.issued_date || '') + '</span></div>' +
              '<div style="display:flex;justify-content:space-between;"><span style="color:#888;font-size:0.8rem;">Branch</span><span style="color:#e2e8f0;font-weight:600;">' + esc(m.branch_name || '-') + '</span></div>' +
            '</div>' +
          '</div>' +
          (m.next_tier ? '<div style="background:#1a1f2e;border:1px solid #2a3040;border-radius:12px;padding:16px;margin-top:12px;">' +
            '<div style="color:#94a3b8;font-size:0.75rem;font-weight:600;margin-bottom:8px;text-transform:uppercase;">Progress to ' + m.next_tier + '</div>' +
            '<div style="background:#0d1117;border-radius:6px;height:8px;overflow:hidden;">' +
              '<div style="height:100%;background:linear-gradient(90deg,#6366f1,#a78bfa);border-radius:6px;width:' + Math.min(100, ((m.total_points || 0) / ((m.total_points || 0) + m.points_to_next_tier)) * 100) + '%;"></div>' +
            '</div>' +
            '<div style="color:#888;font-size:0.75rem;margin-top:6px;">' + m.points_to_next_tier + ' pts to ' + m.next_tier + '</div>' +
          '</div>' : '') +
        '</div>' +

        '<div style="display:flex;flex-direction:column;gap:12px;">' +
          '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;">' +
            '<div style="background:#1a1f2e;border:1px solid #2a3040;border-radius:10px;padding:14px;text-align:center;">' +
              '<div style="color:#888;font-size:0.65rem;">TOTAL SPENT</div>' +
              '<div style="color:#22c55e;font-weight:700;font-size:0.95rem;">' + formatCurrency(m.total_spent || 0) + '</div></div>' +
            '<div style="background:#1a1f2e;border:1px solid #2a3040;border-radius:10px;padding:14px;text-align:center;">' +
              '<div style="color:#888;font-size:0.65rem;">POINTS</div>' +
              '<div style="color:#6366f1;font-weight:700;font-size:0.95rem;">' + (m.total_points || 0).toLocaleString() + '</div></div>' +
            '<div style="background:#1a1f2e;border:1px solid #2a3040;border-radius:10px;padding:14px;text-align:center;">' +
              '<div style="color:#888;font-size:0.65rem;">BONUS TOKENS</div>' +
              '<div style="color:#f59e0b;font-weight:700;font-size:0.95rem;">' + (m.bonus_tokens_earned || 0) + '</div></div>' +
            '<div style="background:#1a1f2e;border:1px solid #2a3040;border-radius:10px;padding:14px;text-align:center;">' +
              '<div style="color:#888;font-size:0.65rem;">VISITS</div>' +
              '<div style="color:#e2e8f0;font-weight:700;font-size:0.95rem;">' + (m.total_visits || 0) + '</div></div>' +
          '</div>' +

          '<div style="background:#1a1f2e;border:1px solid #2a3040;border-radius:12px;flex:1;overflow:hidden;">' +
            '<div style="padding:14px 16px;border-bottom:1px solid #2a3040;color:#94a3b8;font-size:0.8rem;font-weight:600;">Transaction History</div>' +
            '<div id="loy-txns" style="overflow-y:auto;max-height:400px;padding:8px;">Loading...</div>' +
          '</div>' +
        '</div>' +

      '</div>' +
      '</div></div></div>';

    loadTransactions(m.id);
  }

  async function loadTransactions(memberId) {
    try {
      var txns = await apiGet('/members/' + memberId + '/transactions');
      var container = document.getElementById('loy-txns');
      if (!container) return;
      if (!Array.isArray(txns) || txns.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:30px;color:#666;">No transactions yet</div>';
        return;
      }
      container.innerHTML = txns.map(function(t) {
        return '<div style="display:flex;justify-content:space-between;align-items:center;padding:10px;border-bottom:1px solid #1e2736;">' +
          '<div>' +
            '<div style="color:#e2e8f0;font-size:0.85rem;font-weight:500;">' + esc(t.description || 'Token Purchase') + '</div>' +
            '<div style="color:#666;font-size:0.7rem;">' + (t.created_at ? t.created_at.split('T')[0] : '') + '</div>' +
          '</div>' +
          '<div style="text-align:right;">' +
            '<div style="color:#22c55e;font-weight:600;font-size:0.85rem;">+' + formatCurrency(t.amount) + '</div>' +
            '<div style="color:#888;font-size:0.7rem;">+' + t.points_earned + ' pts' + (t.bonus_tokens > 0 ? ', +' + t.bonus_tokens + ' tokens' : '') + '</div>' +
          '</div>' +
        '</div>';
      }).join('');
    } catch (e) {
      var container = document.getElementById('loy-txns');
      if (container) container.innerHTML = '<div style="text-align:center;padding:30px;color:#666;">Failed to load</div>';
    }
  }

  function attachListEvents() {
    document.getElementById('logout-btn')?.addEventListener('click', function(e) { e.preventDefault(); Auth.logout(); });
    document.getElementById('loy-branch')?.addEventListener('change', async function(e) {
      selectedBranch = e.target.value;
      await Promise.all([loadMembers(), loadStats()]);
      if (viewTab === 'history') loadHistory();
      if (viewTab === 'trash') loadTrash();
    });
    var searchInput = document.getElementById('loy-search');
    if (searchInput) {
      var debounce;
      searchInput.addEventListener('input', function(e) {
        clearTimeout(debounce);
        debounce = setTimeout(function() {
          searchTerm = e.target.value;
          if (viewTab === 'members') loadMembers();
          if (viewTab === 'history') { historyPage = 1; loadHistory(); }
          if (viewTab === 'trash') loadTrash();
        }, 300);
      });
    }
    document.getElementById('loy-hist-page-size')?.addEventListener('change', function(e) {
      historyPageSize = parseInt(e.target.value) || 10;
      historyPage = 1;
      render();
    });
    document.querySelectorAll('.loy-page-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        if (this.disabled) return;
        var p = parseInt(this.dataset.page);
        if (p && p >= 1) { historyPage = p; render(); }
      });
    });

  }



  window.__loyIssue = function() { issueCard(); };
  window.__loyView = function(id) { viewMember(id); };
  window.__loyBack = function() { selectedMember = null; view = 'list'; render(); };
  window.__loyPurchase = function(id) {
    var m = members.find(function(m) { return m.id === id; });
    if (!m && selectedMember) m = selectedMember;
    if (m) recordPurchase(m);
  };
  window.__loyPreview = function() { showCardPreview(); };
  window.__loyTab = function(tab) {
    viewTab = tab;
    if (tab === 'history') { historyPage = 1; if (historyData.length === 0) loadHistory(); else render(); }
    else if (tab === 'trash') { if (trashData.length === 0) loadTrash(); else render(); }
    else render();
  };
  window.__loySoftDelete = async function(id) {
    var ok = await confirmAsync('Move this member to trash? They can be restored later.', 'Delete Member');
    if (!ok) return;
    try {
      await apiPost('/members/' + id + '/soft-delete');
      Toast.success('Member moved to trash');
      selectedMember = null;
      view = 'list';
      viewTab = 'members';
      await loadStats();
      loadMembers();
    } catch (e) {
      Toast.error(e.message || 'Failed to delete');
    }
  };
  window.__loyRestore = async function(id) {
    try {
      await apiPost('/members/' + id + '/restore');
      Toast.success('Member restored!');
      await loadStats();
      loadTrash();
    } catch (e) {
      Toast.error(e.message || 'Failed to restore');
    }
  };
  window.__loyPermanentDelete = async function(id) {
    var ok = await confirmAsync('Permanently delete this member? This cannot be undone.', 'Permanent Delete');
    if (!ok) return;
    try {
      await apiDelete('/members/' + id + '/permanent');
      Toast.success('Member permanently deleted');
      await loadStats();
      loadTrash();
    } catch (e) {
      Toast.error(e.message || 'Failed to delete');
    }
  };

  function showCardPreview() {
    var sampleMembers = [
      { first_name: 'Regular', last_name: 'Member', card_number: 'DLA-00000001', card_tier: 'none', total_points: 0, bonus_tokens_earned: 0, total_spent: 0 },
      { first_name: 'Silver', last_name: 'Member', card_number: 'DLA-00000002', card_tier: 'silver', total_points: 600, bonus_tokens_earned: 6, total_spent: 600 },
      { first_name: 'Gold', last_name: 'Member', card_number: 'DLA-00000003', card_tier: 'gold', total_points: 2500, bonus_tokens_earned: 50, total_spent: 2500 },
      { first_name: 'Black', last_name: 'Member', card_number: 'DLA-00000004', card_tier: 'black', total_points: 5500, bonus_tokens_earned: 165, total_spent: 5500 }
    ];

    var tierInfo = [
      { name: 'Qualifier', color: '#64748b', req: '0 pts', bonus: '0%', perks: 'Standard membership - no discount', discount: 'No Discount' },
      { name: 'Silver', color: '#c0c0c0', req: '1,000 pts', bonus: '5%', perks: '5% discount on all token purchases', discount: '5% Off' },
      { name: 'Gold', color: '#fbbf24', req: '3,000 pts', bonus: '10%', perks: '10% discount + priority access', discount: '10% Off' },
      { name: 'Black', color: '#a5b4fc', req: '5,000 pts', bonus: '15%', perks: '15% discount + exclusive perks + birthday tokens', discount: '15% Off' }
    ];

    var tierStyles = {
      none: {
        bg: 'linear-gradient(135deg, #0f172a 0%, #1e293b 40%, #334155 70%, #1e293b 100%)',
        accent: '#475569', accentLight: '#64748b', text: '#e2e8f0', sub: 'rgba(255,255,255,0.45)',
        border: '#334155', glow: 'rgba(71,85,105,0.3)', holo: 'linear-gradient(135deg, rgba(100,116,139,0.1), rgba(71,85,105,0.05))'
      },
      silver: {
        bg: 'linear-gradient(135deg, #1a1a2e 0%, #374151 25%, #9ca3af 50%, #d1d5db 60%, #9ca3af 75%, #374151 100%)',
        accent: '#d1d5db', accentLight: '#e5e7eb', text: '#f1f5f9', sub: 'rgba(255,255,255,0.6)',
        border: '#9ca3af', glow: 'rgba(156,163,175,0.4)', holo: 'linear-gradient(135deg, rgba(209,213,219,0.15), rgba(156,163,175,0.08), rgba(229,231,235,0.12))'
      },
      gold: {
        bg: 'linear-gradient(135deg, #451a03 0%, #92400e 20%, #f59e0b 45%, #fde68a 55%, #f59e0b 70%, #92400e 90%, #451a03 100%)',
        accent: '#fde68a', accentLight: '#fef3c7', text: '#451a03', sub: 'rgba(69,26,3,0.6)',
        border: '#f59e0b', glow: 'rgba(245,158,11,0.5)', holo: 'linear-gradient(135deg, rgba(253,230,138,0.2), rgba(245,158,11,0.1), rgba(251,191,36,0.15))'
      },
      black: {
        bg: 'linear-gradient(135deg, #020617 0%, #0f172a 20%, #1e1b4b 40%, #312e81 50%, #1e1b4b 60%, #0f172a 80%, #020617 100%)',
        accent: '#a5b4fc', accentLight: '#c7d2fe', text: '#e2e8f0', sub: 'rgba(226,232,240,0.5)',
        border: '#6366f1', glow: 'rgba(99,102,241,0.5)', holo: 'linear-gradient(135deg, rgba(165,180,252,0.12), rgba(99,102,241,0.08), rgba(199,210,254,0.1))'
      }
    };

    function renderPremiumCard(m, idx) {
      var s = tierStyles[m.card_tier] || tierStyles.none;
      var info = tierInfo[idx];
      return '<div id="loyalty-card-' + idx + '" style="width:85.6mm;height:54mm;background:' + s.bg + ';border-radius:3.5mm;border:0.5px solid ' + s.border + ';position:relative;overflow:hidden;font-family:\'Segoe UI\',Arial,sans-serif;color:' + s.text + ';box-shadow:0 4px 24px ' + s.glow + ',0 1px 3px rgba(0,0,0,0.3);display:flex;flex-direction:column;justify-content:space-between;padding:4.5mm 5mm;box-sizing:border-box;">' +
        /* Holographic overlay */
        '<div style="position:absolute;inset:0;background:' + s.holo + ';pointer-events:none;z-index:1;"></div>' +
        /* Decorative circles */
        '<div style="position:absolute;top:-8mm;right:-6mm;width:22mm;height:22mm;border-radius:50%;background:rgba(255,255,255,0.04);z-index:1;"></div>' +
        '<div style="position:absolute;bottom:-10mm;left:-4mm;width:28mm;height:28mm;border-radius:50%;background:rgba(255,255,255,0.025);z-index:1;"></div>' +
        '<div style="position:absolute;top:50%;right:8mm;width:18mm;height:18mm;border-radius:50%;border:0.3px solid ' + s.accent + '22;z-index:1;"></div>' +
        /* Top row: Logo + Tier badge */
        '<div style="display:flex;justify-content:space-between;align-items:flex-start;position:relative;z-index:2;">' +
          '<div style="display:flex;align-items:center;gap:2.5mm;">' +
            '<div style="width:9mm;height:9mm;border-radius:2mm;background:linear-gradient(135deg,' + s.accent + 'cc,' + s.accent + '66);display:flex;align-items:center;justify-content:center;box-shadow:0 1px 4px ' + s.glow + ';border:0.3px solid ' + s.accent + '44;">' +
              '<div style="font-size:3.5mm;line-height:1;">🕹️</div>' +
            '</div>' +
            '<div><div style="font-weight:900;font-size:3.2mm;letter-spacing:1.2px;line-height:1;">DREAMLAND</div>' +
            '<div style="font-size:2.2mm;letter-spacing:2px;color:' + s.sub + ';font-weight:600;line-height:1.2;">ARCADE</div></div>' +
          '</div>' +
          '<div style="text-align:right;">' +
            '<div style="background:' + s.accent + '22;border:0.3px solid ' + s.accent + '55;border-radius:1.5mm;padding:0.8mm 3mm;font-weight:800;font-size:2.2mm;letter-spacing:1.5px;text-transform:uppercase;color:' + s.accent + ';">' + info.name.toUpperCase() + '</div>' +
          '</div>' +
        '</div>' +
        /* Middle: Member info */
        '<div style="position:relative;z-index:2;">' +
          '<div style="font-weight:800;font-size:4.5mm;letter-spacing:0.5px;line-height:1.2;margin-bottom:1mm;">' + esc(m.first_name) + ' ' + esc(m.last_name) + '</div>' +
          '<div style="font-size:2.8mm;letter-spacing:1.5px;font-family:\'Courier New\',monospace;color:' + s.sub + ';">' + esc(m.card_number) + '</div>' +
        '</div>' +
        /* Bottom row: Stats + Barcode area */
        '<div style="display:flex;justify-content:space-between;align-items:flex-end;position:relative;z-index:2;">' +
          '<div style="display:flex;gap:5mm;">' +
            '<div><div style="font-size:2mm;letter-spacing:1px;color:' + s.sub + ';font-weight:600;">POINTS</div>' +
            '<div style="font-weight:900;font-size:5mm;line-height:1;">' + (m.total_points || 0).toLocaleString() + '</div></div>' +
            '<div><div style="font-size:2mm;letter-spacing:1px;color:' + s.sub + ';font-weight:600;">DISCOUNT</div>' +
            '<div style="font-weight:800;font-size:3.2mm;color:' + s.accent + ';line-height:1.4;">' + info.discount + '</div></div>' +
          '</div>' +
          '<div style="text-align:right;">' +
            '<div style="font-size:2mm;letter-spacing:1px;color:' + s.sub + ';font-weight:600;">BONUS</div>' +
            '<div style="font-weight:800;font-size:3.2mm;line-height:1;">' + (m.bonus_tokens_earned || 0) + ' tokens</div>' +
          '</div>' +
        '</div>' +
        /* Subtle barcode lines */
        '<div style="position:absolute;bottom:2mm;right:4mm;display:flex;gap:0.4mm;z-index:2;opacity:0.15;">' +
          [1,3,1,2,1,3,1,1,2,1,3,1,2,1,1,3,1,2,1,3,1,1,2,1,3,1].map(function(w) {
            return '<div style="width:' + (w * 0.3) + 'mm;height:4mm;background:' + s.text + ';border-radius:0.1mm;"></div>';
          }).join('') +
        '</div>' +
      '</div>';
    }

    var cardsHtml = sampleMembers.map(function(m, i) {
      var info = tierInfo[i];
      return '<div style="text-align:center;">' +
        '<div style="margin-bottom:10px;display:flex;justify-content:center;">' + renderPremiumCard(m, i) + '</div>' +
        '<div style="background:#0d1117;border:1px solid #1e2736;border-radius:8px;padding:10px;">' +
          '<div style="color:' + info.color + ';font-weight:700;font-size:0.85rem;margin-bottom:6px;">' + info.name + ' Tier</div>' +
          '<div style="display:flex;flex-direction:column;gap:4px;font-size:0.72rem;">' +
            '<div style="display:flex;justify-content:space-between;"><span style="color:#666;">Requirement</span><span style="color:#94a3b8;font-weight:600;">' + info.req + '</span></div>' +
            '<div style="display:flex;justify-content:space-between;"><span style="color:#666;">Discount</span><span style="color:#22c55e;font-weight:600;">' + info.discount + '</span></div>' +
            '<div style="color:#888;font-size:0.68rem;margin-top:4px;line-height:1.3;">' + info.perks + '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
    }).join('');

    var html = '<div style="margin-bottom:16px;">' +
      '<div style="color:#94a3b8;font-size:0.85rem;line-height:1.6;">Premium loyalty cards at standard school ID size (85.6mm x 54mm). Click <strong style="color:#6366f1;">Print All Cards</strong> to print.</div>' +
    '</div>' +
    '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:16px;">' + cardsHtml + '</div>' +
    '<div style="margin-top:16px;background:#0f172a;border:1px solid #1e293b;border-radius:10px;padding:14px;">' +
      '<div style="color:#94a3b8;font-size:0.75rem;font-weight:600;margin-bottom:8px;text-transform:uppercase;letter-spacing:1px;">Tier Progression</div>' +
      '<div style="display:flex;align-items:center;gap:0;">' +
        '<div style="flex:1;text-align:center;"><div style="color:#64748b;font-size:0.7rem;">Qualifier</div><div style="color:#666;font-size:0.6rem;">0 pts</div></div>' +
        '<div style="color:#30363d;font-size:1.2rem;">&#10132;</div>' +
        '<div style="flex:1;text-align:center;"><div style="color:#c0c0c0;font-size:0.7rem;">Silver</div><div style="color:#666;font-size:0.6rem;">1,000 pts</div></div>' +
        '<div style="color:#30363d;font-size:1.2rem;">&#10132;</div>' +
        '<div style="flex:1;text-align:center;"><div style="color:#fbbf24;font-size:0.7rem;">Gold</div><div style="color:#666;font-size:0.6rem;">3,000 pts</div></div>' +
        '<div style="color:#30363d;font-size:1.2rem;">&#10132;</div>' +
        '<div style="flex:1;text-align:center;"><div style="color:#a5b4fc;font-size:0.7rem;">Black</div><div style="color:#666;font-size:0.6rem;">5,000 pts</div></div>' +
      '</div>' +
    '</div>' +
    '<div style="margin-top:14px;text-align:center;">' +
      '<button onclick="window.__printLoyaltyCards()" style="background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;border:none;border-radius:8px;padding:10px 28px;cursor:pointer;font-weight:700;font-size:0.85rem;letter-spacing:0.5px;box-shadow:0 2px 10px rgba(99,102,241,0.3);">🖨 Print All Cards</button>' +
    '</div>';

    Modal.show('Loyalty Card Designs', html, { width: '960px' });

    window.__printLoyaltyCards = function() {
      var cardStyles = '<style>' +
        '@page { size: landscape; margin: 8mm; }' +
        '@media print { body { margin: 0; padding: 0; background: #fff; } .no-print { display: none !important; } }' +
        '*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }' +
        'body { font-family: "Segoe UI", Arial, sans-serif; background: #f8fafc; padding: 10mm; }' +
        '.print-title { text-align: center; font-size: 11pt; font-weight: 800; color: #1e293b; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 6mm; }' +
        '.print-subtitle { text-align: center; font-size: 8pt; color: #64748b; margin-bottom: 8mm; }' +
        '.cards-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6mm; justify-items: center; }' +
        '.card-wrap { width: 85.6mm; height: 54mm; border-radius: 3.5mm; position: relative; overflow: hidden; color: #e2e8f0; display: flex; flex-direction: column; justify-content: space-between; padding: 4.5mm 5mm; border: 0.5px solid rgba(0,0,0,0.15); -webkit-print-color-adjust: exact; print-color-adjust: exact; }' +
        '.card-holo { position: absolute; inset: 0; pointer-events: none; z-index: 1; }' +
        '.card-circle-tr { position: absolute; top: -8mm; right: -6mm; width: 22mm; height: 22mm; border-radius: 50%; background: rgba(255,255,255,0.04); z-index: 1; }' +
        '.card-circle-bl { position: absolute; bottom: -10mm; left: -4mm; width: 28mm; height: 28mm; border-radius: 50%; background: rgba(255,255,255,0.025); z-index: 1; }' +
        '.card-circle-mid { position: absolute; top: 50%; right: 8mm; width: 18mm; height: 18mm; border-radius: 50%; border: 0.3px solid rgba(255,255,255,0.1); z-index: 1; }' +
        '.card-top { display: flex; justify-content: space-between; align-items: flex-start; position: relative; z-index: 2; }' +
        '.card-logo { display: flex; align-items: center; gap: 2.5mm; }' +
        '.card-logo-icon { width: 9mm; height: 9mm; border-radius: 2mm; display: flex; align-items: center; justify-content: center; border: 0.3px solid rgba(255,255,255,0.2); }' +
        '.card-logo-text { font-weight: 900; font-size: 3.2mm; letter-spacing: 1.2px; line-height: 1; }' +
        '.card-logo-sub { font-size: 2.2mm; letter-spacing: 2px; opacity: 0.5; font-weight: 600; line-height: 1.2; }' +
        '.card-tier-badge { padding: 0.8mm 3mm; border-radius: 1.5mm; font-weight: 800; font-size: 2.2mm; letter-spacing: 1.5px; text-transform: uppercase; }' +
        '.card-mid { position: relative; z-index: 2; }' +
        '.card-name { font-weight: 800; font-size: 4.5mm; letter-spacing: 0.5px; line-height: 1.2; margin-bottom: 1mm; }' +
        '.card-number { font-size: 2.8mm; letter-spacing: 1.5px; font-family: "Courier New", monospace; opacity: 0.5; }' +
        '.card-bottom { display: flex; justify-content: space-between; align-items: flex-end; position: relative; z-index: 2; }' +
        '.card-stats { display: flex; gap: 5mm; }' +
        '.card-stat-label { font-size: 2mm; letter-spacing: 1px; opacity: 0.45; font-weight: 600; }' +
        '.card-stat-value { font-weight: 900; line-height: 1; }' +
        '.card-pts { font-size: 5mm; }' +
        '.card-discount { font-size: 3.2mm; font-weight: 800; }' +
        '.card-bonus { font-size: 3.2mm; font-weight: 800; }' +
        '.barcode { position: absolute; bottom: 2mm; right: 4mm; display: flex; gap: 0.4mm; z-index: 2; opacity: 0.12; }' +
        '.barcode div { height: 4mm; border-radius: 0.1mm; }' +
        '.print-footer { text-align: center; font-size: 7pt; color: #94a3b8; margin-top: 6mm; }' +
      '</style>';

      var cards = [
        { m: sampleMembers[0], s: tierStyles.none, info: tierInfo[0] },
        { m: sampleMembers[1], s: tierStyles.silver, info: tierInfo[1] },
        { m: sampleMembers[2], s: tierStyles.gold, info: tierInfo[2] },
        { m: sampleMembers[3], s: tierStyles.black, info: tierInfo[3] }
      ];

      var barcodePattern = [1,3,1,2,1,3,1,1,2,1,3,1,2,1,1,3,1,2,1,3,1,1,2,1,3,1];

      var cardsHtml = cards.map(function(c) {
        var m = c.m, s = c.s, info = c.info;
        var tc = m.card_tier === 'gold' ? '#451a03' : '#fff';
        return '<div class="card-wrap" style="background:' + s.bg + ';box-shadow:0 2px 12px ' + s.glow + ';">' +
          '<div class="card-holo" style="background:' + s.holo + ';"></div>' +
          '<div class="card-circle-tr"></div>' +
          '<div class="card-circle-bl"></div>' +
          '<div class="card-circle-mid"></div>' +
          '<div class="card-top">' +
            '<div class="card-logo">' +
              '<div class="card-logo-icon" style="background:linear-gradient(135deg,' + s.accent + 'cc,' + s.accent + '66);">' +
                '<div style="font-size:3.5mm;line-height:1;">🕹️</div>' +
              '</div>' +
              '<div><div class="card-logo-text">DREAMLAND</div><div class="card-logo-sub">ARCADE</div></div>' +
            '</div>' +
            '<div class="card-tier-badge" style="background:' + s.accent + '22;border:0.3px solid ' + s.accent + '55;color:' + s.accent + ';">' + info.name.toUpperCase() + '</div>' +
          '</div>' +
          '<div class="card-mid">' +
            '<div class="card-name" style="color:' + s.text + ';">' + esc(m.first_name) + ' ' + esc(m.last_name) + '</div>' +
            '<div class="card-number" style="color:' + s.sub + ';">' + esc(m.card_number) + '</div>' +
          '</div>' +
          '<div class="card-bottom">' +
            '<div class="card-stats">' +
              '<div><div class="card-stat-label" style="color:' + s.sub + ';">POINTS</div><div class="card-stat-value card-pts" style="color:' + s.text + ';">' + (m.total_points || 0).toLocaleString() + '</div></div>' +
              '<div><div class="card-stat-label" style="color:' + s.sub + ';">DISCOUNT</div><div class="card-discount" style="color:' + s.accent + ';">' + info.discount + '</div></div>' +
            '</div>' +
            '<div style="text-align:right;"><div class="card-stat-label" style="color:' + s.sub + ';">BONUS</div><div class="card-bonus" style="color:' + s.text + ';">' + (m.bonus_tokens_earned || 0) + ' tokens</div></div>' +
          '</div>' +
          '<div class="barcode">' +
            barcodePattern.map(function(w) {
              return '<div style="width:' + (w * 0.3) + 'mm;background:' + s.text + ';"></div>';
            }).join('') +
          '</div>' +
        '</div>';
      }).join('');

      var win = window.open('', '_blank');
      win.document.write('<!DOCTYPE html><html><head><meta charset="utf-8"><title>Dreamland Arcade - Loyalty Cards</title>');
      win.document.write(cardStyles);
      win.document.write('</head><body>');
      win.document.write('<div class="print-title">Dreamland Arcade Loyalty Cards</div>');
      win.document.write('<div class="print-subtitle">Standard School ID Size - 85.6mm x 54mm</div>');
      win.document.write('<div class="cards-grid">' + cardsHtml + '</div>');
      win.document.write('<div class="print-footer">Dreamland Arcade &bull; Loyalty Card Program &bull; Confidential</div>');
      win.document.write('</body></html>');
      win.document.close();
      setTimeout(function() { win.print(); }, 500);
    };
  }

  loadData();
}

Router.register('loyalty', renderAdminLoyalty);
