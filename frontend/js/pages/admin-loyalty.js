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

  var TIERS = {
    none: { label: 'None', color: '#64748b', gradient: 'linear-gradient(135deg, #1e293b, #334155)', icon: '🎟️' },
    silver: { label: 'Silver', color: '#c0c0c0', gradient: 'linear-gradient(135deg, #6b7280, #d1d5db, #9ca3af, #e5e7eb, #9ca3af)', icon: '🥈' },
    gold: { label: 'Gold', color: '#fbbf24', gradient: 'linear-gradient(135deg, #b45309, #fbbf24, #f59e0b, #fde68a, #d97706)', icon: '🥇' },
    black: { label: 'Black', color: '#1a1a2e', gradient: 'linear-gradient(135deg, #0a0a15, #1a1a2e, #2d2d44, #0f0f1a, #1a1a2e)', icon: '👑' }
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
      await Promise.all([loadMembers(), loadStats()]);
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
    var html = '<div style="margin-bottom:12px;">' + renderCard(member, 'large') + '</div>' +
      '<form id="purchase-form" style="display:flex;flex-direction:column;gap:12px;">' +
      '<div><label style="color:#94a3b8;font-size:0.75rem;display:block;margin-bottom:4px;">Purchase Amount (₱) *</label>' +
      '<input type="number" name="amount" min="1" step="0.01" required style="width:100%;background:#0d1117;border:1px solid #30363d;border-radius:6px;padding:10px;color:#e2e8f0;font-size:1rem;font-weight:600;" placeholder="Enter amount"></div>' +
      '<div style="background:#1a1f2e;border:1px solid #2a3040;border-radius:8px;padding:10px;font-size:0.8rem;color:#888;">' +
        'Points earned: <strong style="color:#22c55e;">1 pt/₱1</strong> | ' +
        'Bonus rate: <strong style="color:#f59e0b;">' + (TIER_BONUS_PCT[member.card_tier] || '0%') + '</strong>' +
      '</div>' +
      '<div><label style="color:#94a3b8;font-size:0.75rem;display:block;margin-bottom:4px;">Description</label>' +
      '<input type="text" name="description" style="width:100%;background:#0d1117;border:1px solid #30363d;border-radius:6px;padding:8px;color:#e2e8f0;font-size:0.85rem;" placeholder="e.g. 250 Token Repack"></div>' +
      '<div style="display:flex;justify-content:flex-end;gap:8px;margin-top:8px;">' +
        '<button type="button" onclick="Modal.close()" style="background:#374151;color:#9ca3af;border:none;border-radius:6px;padding:8px 20px;cursor:pointer;">Cancel</button>' +
        '<button type="submit" style="background:#22c55e;color:#fff;border:none;border-radius:6px;padding:8px 20px;cursor:pointer;font-weight:600;">Record Purchase</button>' +
      '</div></form>';

    var TIER_BONUS_PCT = { silver: '5%', gold: '10%', black: '15%', none: '0%' };
    Modal.show('Record Purchase - ' + member.first_name + ' ' + member.last_name, html, { width: '420px' });

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
        '<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">' +
          (isOwner ?
            '<select id="loy-branch" style="background:#0d1117;border:1px solid #30363d;border-radius:6px;padding:8px 12px;color:#e2e8f0;font-size:0.85rem;">' +
            branches.map(function(b) { return '<option value="' + b.id + '"' + (String(b.id) === String(selectedBranch) ? ' selected' : '') + '>' + esc(b.name) + '</option>'; }).join('') +
            '</select>' : '') +
          '<select id="loy-tier" style="background:#0d1117;border:1px solid #30363d;border-radius:6px;padding:8px 12px;color:#e2e8f0;font-size:0.85rem;">' +
            '<option value="">All Tiers</option>' +
            '<option value="none">None</option>' +
            '<option value="silver">🥈 Silver</option>' +
            '<option value="gold">🥇 Gold</option>' +
            '<option value="black">👑 Black</option>' +
          '</select>' +
          '<input type="text" id="loy-search" placeholder="Search name or card #..." style="background:#0d1117;border:1px solid #30363d;border-radius:6px;padding:8px 12px;color:#e2e8f0;font-size:0.85rem;width:200px;" value="' + esc(searchTerm) + '">' +
        '</div>' +
        '<button onclick="window.__loyIssue()" style="background:#6366f1;color:#fff;border:none;border-radius:8px;padding:8px 20px;cursor:pointer;font-weight:600;font-size:0.85rem;">+ Issue Card</button>' +
      '</div>' +

      '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px;">' +
      (members.length === 0 ? '<div style="grid-column:1/-1;text-align:center;padding:60px;color:#666;">No members found. Issue a card to get started.</div>' :
        members.map(function(m) {
          return '<div onclick="window.__loyView(' + m.id + ')" style="cursor:pointer;transition:transform 0.15s;" onmouseenter="this.style.transform=\'translateY(-3px)\'" onmouseleave="this.style.transform=\'translateY(0)\'">' +
            renderCard(m, 'small') +
          '</div>';
        }).join('')) +
      '</div>' +

      '</div></div></div>';

    attachListEvents();
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
    });
    document.getElementById('loy-tier')?.addEventListener('change', function(e) {
      filterTier = e.target.value;
      loadMembers();
    });
    var searchInput = document.getElementById('loy-search');
    if (searchInput) {
      var debounce;
      searchInput.addEventListener('input', function(e) {
        clearTimeout(debounce);
        debounce = setTimeout(function() {
          searchTerm = e.target.value;
          loadMembers();
        }, 300);
      });
    }
  }

  function esc(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  window.__loyIssue = function() { issueCard(); };
  window.__loyView = function(id) { viewMember(id); };
  window.__loyBack = function() { selectedMember = null; view = 'list'; loadMembers(); };
  window.__loyPurchase = function(id) {
    var m = members.find(function(m) { return m.id === id; });
    if (!m && selectedMember) m = selectedMember;
    if (m) recordPurchase(m);
  };

  loadData();
}

Router.register('loyalty', renderAdminLoyalty);
