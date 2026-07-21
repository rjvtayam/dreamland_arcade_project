function renderAdminPOS() {
  var app = document.getElementById('app');
  var products = [];
  var branches = [];
  var cart = [];
  var selectedBranch = '';
  var paymentMethod = 'Cash';
  var searchQuery = '';
  var activeArea = 'Arcade';
  var tracking = [];
  var loyaltyMember = null;

  var AREAS = [
    { id: 'Arcade', icon: '🎮', color: '#6366f1' },
    { id: 'Playhouse', icon: '🏠', color: '#22c55e' },
    { id: 'Cafe', icon: '☕', color: '#f59e0b' }
  ];

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
      await Promise.all([loadProducts(), loadTracking()]);
    } catch (e) {
      Toast.error('Failed to load POS data');
    }
  }

  async function loadProducts() {
    try {
      var url = '/products';
      var params = [];
      if (selectedBranch) params.push('branch_id=' + selectedBranch);
      if (params.length) url += '?' + params.join('&');
      products = await apiGet(url);
      if (!Array.isArray(products)) products = [];
      products = products.filter(function(p) { return p.is_active !== false; });
      render();
    } catch (e) {
      Toast.error('Failed to load products');
    }
  }

  async function loadTracking() {
    try {
      var url = '/sales/tracking';
      var params = [];
      if (selectedBranch) params.push('branch_id=' + selectedBranch);
      if (params.length) url += '?' + params.join('&');
      tracking = await apiGet(url);
      if (!Array.isArray(tracking)) tracking = [];
    } catch (e) {
      tracking = [];
    }
  }

  function getAreaTracking(area) {
    var t = tracking.find(function(t) { return t.area === area; });
    return t || { total_sales: 0, total_transactions: 0 };
  }

  function addToCart(productId) {
    var product = products.find(function(p) { return String(p.id) === String(productId); });
    if (!product) return;
    var existing = cart.find(function(c) { return String(c.product_id) === String(productId); });
    if (existing) {
      if (existing.quantity >= (product.stock || 0)) { Toast.error('Not enough stock'); return; }
      existing.quantity++;
    } else {
      if ((product.stock || 0) <= 0) { Toast.error('Out of stock'); return; }
      cart.push({ product_id: product.id, name: product.name, price: product.price, quantity: 1, stock: product.stock, area: activeArea });
    }
    render();
  }

  function updateCartQuantity(productId, delta) {
    var item = cart.find(function(c) { return String(c.product_id) === String(productId); });
    if (!item) return;
    item.quantity += delta;
    if (item.quantity <= 0) { cart = cart.filter(function(c) { return String(c.product_id) !== String(productId); }); }
    else if (item.quantity > item.stock) { Toast.error('Not enough stock'); item.quantity = item.stock; }
    render();
  }

  function removeFromCart(productId) {
    cart = cart.filter(function(c) { return String(c.product_id) !== String(productId); });
    render();
  }

  function getCartTotal() { return cart.reduce(function(sum, item) { return sum + (item.price * item.quantity); }, 0); }

  function render() {
    var total = getCartTotal();
    var user = Auth.getUser();
    var isOwner = user && user.role === 'owner';

    var filteredProducts = products;
    if (searchQuery) {
      var q = searchQuery.toLowerCase();
      filteredProducts = products.filter(function(p) { return (p.name || '').toLowerCase().indexOf(q) >= 0; });
    }

    var tokens = filteredProducts.filter(function(p) { return p.category === 'Tokens'; });
    var others = filteredProducts.filter(function(p) { return p.category !== 'Tokens'; });

    app.innerHTML = '<div class="layout">' + renderSidebar() +
      '<div class="main-content">' + renderNavbar('POS Terminal') +
      '<div class="page-content" id="page-body">' +

      '<div style="display:grid;grid-template-columns:1fr 380px;gap:20px;height:calc(100vh - 120px);">' +

      '<div style="display:flex;flex-direction:column;gap:16px;min-height:0;">' +

        '<div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;">' +
          (isOwner ?
            '<select id="pos-branch" style="background:#0d1117;border:1px solid #30363d;border-radius:8px;padding:8px 12px;color:#e2e8f0;font-size:0.85rem;">' +
            branches.map(function(b) { return '<option value="' + b.id + '"' + (String(b.id) === String(selectedBranch) ? ' selected' : '') + '>' + esc(b.name) + '</option>'; }).join('') +
            '</select>' : '<div style="background:#0d1117;border:1px solid #30363d;border-radius:8px;padding:8px 12px;color:#00f0ff;font-size:0.85rem;font-weight:600;">' + esc(user.branch_name || 'Branch') + '</div>') +
          '<input type="text" id="pos-search" placeholder="Search products..." style="flex:1;min-width:200px;background:#0d1117;border:1px solid #30363d;border-radius:8px;padding:8px 12px;color:#e2e8f0;font-size:0.85rem;" value="' + esc(searchQuery) + '">' +
        '</div>' +

        '<div style="display:flex;gap:8px;">' +
          AREAS.map(function(a) {
            var isActive = activeArea === a.id;
            var tg = getAreaTracking(a.id);
            return '<div onclick="window.__posArea(\'' + a.id + '\')" style="flex:1;background:' + (isActive ? a.color + '15' : '#1a1f2e') + ';border:1px solid ' + (isActive ? a.color : '#2a3040') + ';border-radius:10px;padding:12px 16px;cursor:pointer;transition:all 0.15s;">' +
              '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">' +
                '<span style="font-size:1.1rem;">' + a.icon + '</span>' +
                '<span style="color:' + a.color + ';font-weight:700;font-size:0.9rem;">' + a.id + '</span>' +
              '</div>' +
              '<div style="display:flex;justify-content:space-between;">' +
                '<div><div style="color:#888;font-size:0.65rem;">Today Sales</div>' +
                '<div style="color:#e2e8f0;font-weight:600;font-size:0.85rem;">' + formatCurrency(tg.total_sales) + '</div></div>' +
                '<div style="text-align:right;"><div style="color:#888;font-size:0.65rem;">Transactions</div>' +
                '<div style="color:#e2e8f0;font-weight:600;font-size:0.85rem;">' + tg.total_transactions + '</div></div>' +
              '</div>' +
            '</div>';
          }).join('') +
        '</div>' +

        (tokens.length > 0 ?
          '<div style="background:#1a1f2e;border:1px solid #2a3040;border-radius:12px;padding:16px;">' +
            '<div style="color:#94a3b8;font-size:0.8rem;font-weight:600;margin-bottom:12px;text-transform:uppercase;letter-spacing:0.5px;">Token Repacks (₱5/token)</div>' +
            '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px;">' +
            tokens.map(function(p) {
              var stock = p.stock || 0;
              var isOut = stock <= 0;
              return '<div onclick="window.__posAdd(\'' + p.id + '\')" style="background:#0d1117;border:1px solid ' + (isOut ? '#3a1a1a' : '#2a3040') + ';border-radius:10px;padding:14px;cursor:' + (isOut ? 'not-allowed' : 'pointer') + ';opacity:' + (isOut ? '0.5' : '1') + ';transition:all 0.15s;" onmouseenter="this.style.borderColor=\'' + '#6366f1' + '\'" onmouseleave="this.style.borderColor=\'' + (isOut ? '#3a1a1a' : '#2a3040') + '\'">' +
                '<div style="color:#e2e8f0;font-weight:600;font-size:0.85rem;margin-bottom:6px;">' + esc(p.name || '') + '</div>' +
                '<div style="color:#6366f1;font-weight:700;font-size:1rem;">' + formatCurrency(p.price) + '</div>' +
                '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px;">' +
                  '<span style="color:' + (isOut ? '#ef4444' : '#22c55e') + ';font-size:0.7rem;font-weight:600;">' + (isOut ? 'SOLD OUT' : 'Stock: ' + stock) + '</span>' +
                  (isOut ? '' : '<span style="color:#888;font-size:0.65rem;">+ add</span>') +
                '</div>' +
              '</div>';
            }).join('') +
            '</div>' +
          '</div>' : '') +

        (others.length > 0 ?
          '<div style="background:#1a1f2e;border:1px solid #2a3040;border-radius:12px;padding:16px;flex:1;overflow-y:auto;">' +
            '<div style="color:#94a3b8;font-size:0.8rem;font-weight:600;margin-bottom:12px;text-transform:uppercase;letter-spacing:0.5px;">Other Items</div>' +
            '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px;">' +
            others.map(function(p) {
              var stock = p.stock || 0;
              var isOut = stock <= 0;
              var catColor = p.category === 'Drinks' ? '#3b82f6' : p.category === 'Snacks' ? '#f59e0b' : '#a855f7';
              return '<div onclick="window.__posAdd(\'' + p.id + '\')" style="background:#0d1117;border:1px solid ' + (isOut ? '#3a1a1a' : '#2a3040') + ';border-radius:10px;padding:14px;cursor:' + (isOut ? 'not-allowed' : 'pointer') + ';opacity:' + (isOut ? '0.5' : '1') + ';transition:all 0.15s;" onmouseenter="this.style.borderColor=\'' + catColor + '\'" onmouseleave="this.style.borderColor=\'' + (isOut ? '#3a1a1a' : '#2a3040') + '\'">' +
                '<div style="color:' + catColor + ';font-size:0.65rem;font-weight:600;margin-bottom:4px;">' + esc(p.category || '') + '</div>' +
                '<div style="color:#e2e8f0;font-weight:600;font-size:0.85rem;margin-bottom:6px;">' + esc(p.name || '') + '</div>' +
                '<div style="color:#e2e8f0;font-weight:700;font-size:1rem;">' + formatCurrency(p.price) + '</div>' +
                '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px;">' +
                  '<span style="color:' + (isOut ? '#ef4444' : '#22c55e') + ';font-size:0.7rem;font-weight:600;">' + (isOut ? 'SOLD OUT' : 'Stock: ' + stock) + '</span>' +
                  (isOut ? '' : '<span style="color:#888;font-size:0.65rem;">+ add</span>') +
                '</div>' +
              '</div>';
            }).join('') +
            '</div>' +
          '</div>' : '') +

      '</div>' +

      '<div style="background:#1a1f2e;border:1px solid #2a3040;border-radius:12px;display:flex;flex-direction:column;overflow:hidden;">' +
        '<div style="padding:16px 20px;border-bottom:1px solid #2a3040;display:flex;justify-content:space-between;align-items:center;">' +
          '<h3 style="color:#e2e8f0;margin:0;font-size:1rem;">Cart</h3>' +
          '<span style="color:#888;font-size:0.8rem;">' + cart.reduce(function(s, i) { return s + i.quantity; }, 0) + ' items</span>' +
        '</div>' +

        '<div style="padding:12px 16px;border-bottom:1px solid #2a3040;">' +
          (loyaltyMember ?
            '<div style="display:flex;justify-content:space-between;align-items:center;background:#0d1117;border:1px solid #6366f1;border-radius:8px;padding:10px;">' +
              '<div><span style="color:#a78bfa;font-weight:600;font-size:0.85rem;">' + esc(loyaltyMember.first_name) + ' ' + esc(loyaltyMember.last_name) + '</span>' +
              '<span style="color:#888;font-size:0.7rem;margin-left:8px;">' + esc(loyaltyMember.card_number) + '</span></div>' +
              '<button onclick="window.__posClearMember()" style="background:none;border:none;color:#ef4444;cursor:pointer;font-size:0.75rem;">remove</button>' +
            '</div>' :
            '<div style="display:flex;gap:8px;">' +
              '<input type="text" id="loyalty-card-input" placeholder="Card # or name..." style="flex:1;background:#0d1117;border:1px solid #30363d;border-radius:6px;padding:7px 10px;color:#e2e8f0;font-size:0.8rem;">' +
              '<button onclick="window.__posLookupMember()" style="background:#6366f1;color:#fff;border:none;border-radius:6px;padding:7px 12px;cursor:pointer;font-size:0.8rem;">Lookup</button>' +
            '</div>'
          ) +
        '</div>' +

        '<div style="flex:1;overflow-y:auto;padding:12px;">' +
        (cart.length === 0 ? '<div style="text-align:center;padding:40px 0;color:#666;">Cart is empty</div>' :
          cart.map(function(item) {
            var areaObj = AREAS.find(function(a) { return a.id === item.area; });
            var areaColor = areaObj ? areaObj.color : '#6366f1';
            return '<div style="display:flex;align-items:center;gap:10px;padding:10px;background:#0d1117;border-radius:8px;margin-bottom:8px;border-left:3px solid ' + areaColor + ';">' +
              '<div style="flex:1;min-width:0;">' +
                '<div style="color:#e2e8f0;font-weight:600;font-size:0.85rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + esc(item.name) + '</div>' +
                '<div style="display:flex;gap:8px;align-items:center;">' +
                  '<span style="color:' + areaColor + ';font-size:0.65rem;font-weight:600;">' + (item.area || 'Arcade') + '</span>' +
                  '<span style="color:#6366f1;font-size:0.8rem;">' + formatCurrency(item.price) + '</span>' +
                '</div>' +
              '</div>' +
              '<div style="display:flex;align-items:center;gap:6px;">' +
                '<button onclick="window.__posQty(\'' + item.product_id + '\',-1)" style="width:28px;height:28px;border-radius:6px;border:1px solid #30363d;background:#161b22;color:#e2e8f0;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:0.9rem;">-</button>' +
                '<span style="color:#e2e8f0;font-weight:600;min-width:24px;text-align:center;">' + item.quantity + '</span>' +
                '<button onclick="window.__posQty(\'' + item.product_id + '\',1)" style="width:28px;height:28px;border-radius:6px;border:1px solid #30363d;background:#161b22;color:#e2e8f0;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:0.9rem;">+</button>' +
              '</div>' +
              '<div style="display:flex;flex-direction:column;align-items:flex-end;gap:2px;">' +
                '<div style="color:#e2e8f0;font-weight:600;font-size:0.85rem;">' + formatCurrency(item.price * item.quantity) + '</div>' +
                '<button onclick="window.__posRemove(\'' + item.product_id + '\')" style="background:none;border:none;color:#ef4444;cursor:pointer;font-size:0.7rem;padding:0;">remove</button>' +
              '</div>' +
            '</div>';
          }).join('')) +
        '</div>' +

        '<div style="border-top:1px solid #2a3040;padding:16px 20px;">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">' +
            '<span style="color:#94a3b8;font-size:0.9rem;">Total</span>' +
            '<span style="color:#e2e8f0;font-size:1.3rem;font-weight:700;">' + formatCurrency(total) + '</span>' +
          '</div>' +
          '<div style="margin-bottom:12px;">' +
            '<select id="payment-method" style="width:100%;background:#0d1117;border:1px solid #30363d;border-radius:8px;padding:8px;color:#e2e8f0;font-size:0.85rem;">' +
              '<option value="Cash"' + (paymentMethod === 'Cash' ? ' selected' : '') + '>Cash</option>' +
              '<option value="GCash"' + (paymentMethod === 'GCash' ? ' selected' : '') + '>GCash</option>' +
              '<option value="Card"' + (paymentMethod === 'Card' ? ' selected' : '') + '>Card</option>' +
            '</select>' +
          '</div>' +
          '<button id="complete-sale-btn" style="width:100%;padding:12px;border:none;border-radius:8px;background:' + (cart.length === 0 ? '#374151' : '#6366f1') + ';color:#fff;font-size:1rem;font-weight:600;cursor:' + (cart.length === 0 ? 'not-allowed' : 'pointer') + ';"' + (cart.length === 0 ? ' disabled' : '') + '>Complete Sale</button>' +
        '</div>' +
      '</div>' +

      '</div></div></div>';

    attachEvents();
  }

  function attachEvents() {
    document.getElementById('logout-btn')?.addEventListener('click', function(e) { e.preventDefault(); Auth.logout(); });

    var branchSel = document.getElementById('pos-branch');
    if (branchSel) {
      branchSel.addEventListener('change', async function(e) {
        selectedBranch = e.target.value;
        cart = [];
        await Promise.all([loadProducts(), loadTracking()]);
      });
    }

    var searchInput = document.getElementById('pos-search');
    if (searchInput) {
      searchInput.addEventListener('input', function(e) {
        searchQuery = e.target.value;
        render();
        var newInput = document.getElementById('pos-search');
        if (newInput) { newInput.focus(); newInput.setSelectionRange(newInput.value.length, newInput.value.length); }
      });
    }

    var paySel = document.getElementById('payment-method');
    if (paySel) {
      paySel.addEventListener('change', function(e) { paymentMethod = e.target.value; });
    }

    var saleBtn = document.getElementById('complete-sale-btn');
    if (saleBtn && cart.length > 0) {
      saleBtn.addEventListener('click', completeSale);
    }
  }

  window.__posAdd = function(id) { addToCart(id); };
  window.__posQty = function(id, delta) { updateCartQuantity(id, delta); };
  window.__posRemove = function(id) { removeFromCart(id); };
  window.__posArea = function(area) { activeArea = area; render(); };

  window.__posLookupMember = async function() {
    var input = document.getElementById('loyalty-card-input');
    if (!input) return;
    var q = input.value.trim();
    if (!q) { Toast.error('Enter card number or name'); return; }
    try {
      var params = 'search=' + encodeURIComponent(q);
      if (selectedBranch) params += '&branch_id=' + selectedBranch;
      var results = await apiGet('/members?' + params);
      if (!Array.isArray(results) || results.length === 0) { Toast.error('Member not found'); return; }
      loyaltyMember = results[0];
      Toast.success('Member: ' + loyaltyMember.first_name + ' ' + loyaltyMember.last_name + ' (' + loyaltyMember.card_number + ')');
      render();
    } catch (e) {
      Toast.error('Lookup failed');
    }
  };

  window.__posClearMember = function() { loyaltyMember = null; render(); };

  async function completeSale() {
    if (cart.length === 0) { Toast.error('Cart is empty'); return; }
    var total = getCartTotal();
    if (!confirm('Complete sale for ' + formatCurrency(total) + '?')) return;

    var areaTotals = {};
    cart.forEach(function(item) {
      var a = item.area || 'Arcade';
      if (!areaTotals[a]) areaTotals[a] = [];
      areaTotals[a].push(item);
    });

    var areas = Object.keys(areaTotals);
    for (var i = 0; i < areas.length; i++) {
      var area = areas[i];
      var areaItems = areaTotals[area];
      var data = {
        branch_id: selectedBranch,
        items: areaItems.map(function(item) { return { product_id: item.product_id, quantity: item.quantity }; }),
        payment_method: paymentMethod,
        area: area
      };
      if (loyaltyMember && i === 0) {
        data.member_id = loyaltyMember.id;
      }
      try {
        await apiPost('/sales', data);
      } catch (err) {
        Toast.error(err.message || 'Failed to complete sale');
        return;
      }
    }

    Toast.success('Sale completed! Total: ' + formatCurrency(total));
    cart = [];
    loyaltyMember = null;
    await Promise.all([loadProducts(), loadTracking()]);
  }

  function esc(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  loadData();
}

Router.register('pos', renderAdminPOS);
