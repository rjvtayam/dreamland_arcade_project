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
  var productCustomizations = {};
  var trackingSheet = null;
  var smashQty = 0;
  var smashPrice = 0;
  var extraQty = 0;
  var extraPrice = 0;

  var AREAS = [
    { id: 'Arcade', icon: '\ud83c\udfae', color: '#6366f1' },
    { id: 'Playhouse', icon: '\ud83c\udfe0', color: '#22c55e' },
    { id: 'Cafe', icon: '\u2615', color: '#f59e0b' }
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
      await Promise.all([loadProducts(), loadTracking(), loadTrackingSheet()]);
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

  async function loadTrackingSheet() {
    try {
      var today = new Date().toISOString().split('T')[0];
      var url = '/tracking-sheets?branch_id=' + selectedBranch + '&area=Arcade&sheet_date=' + today;
      var sheets = await apiGet(url);
      if (Array.isArray(sheets) && sheets.length > 0) {
        trackingSheet = sheets[0];
      } else {
        trackingSheet = null;
      }
    } catch (e) {
      trackingSheet = null;
    }
  }

  function getAreaTracking(area) {
    var t = tracking.find(function(t) { return t.area === area; });
    return t || { total_sales: 0, total_transactions: 0 };
  }

  function getEffectivePrice(product) {
    var cust = productCustomizations[product.id] || {};
    var baseDiscount = product.discount || 0;
    var extraDiscount = cust.discount || 0;
    return product.price - baseDiscount - extraDiscount;
  }

  function addToCart(productId) {
    var product = products.find(function(p) { return String(p.id) === String(productId); });
    if (!product) return;
    var finalPrice = getEffectivePrice(product);
    var cust = productCustomizations[product.id] || {};
    var freeTokens = cust.freeTokens || 0;
    var tokensPerItem = product.category === 'Tokens' ? (parseInt(product.name) || 0) : 0;
    var existing = cart.find(function(c) { return String(c.product_id) === String(productId); });
    if (existing) {
      if (existing.quantity >= (product.stock || 0)) { Toast.error('Not enough stock'); return; }
      existing.quantity++;
    } else {
      if ((product.stock || 0) <= 0) { Toast.error('Out of stock'); return; }
      cart.push({ product_id: product.id, name: product.name, price: finalPrice, quantity: 1, stock: product.stock, area: activeArea, freeTokens: freeTokens, tokens_per_item: tokensPerItem });
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

  function renderProductCard(p) {
    var stock = p.stock || 0;
    var isOut = stock <= 0;
    var cust = productCustomizations[p.id] || {};
    var effectivePrice = getEffectivePrice(p);
    var baseDiscount = p.discount || 0;
    var extraDiscount = cust.discount || 0;
    var totalDiscount = baseDiscount + extraDiscount;
    var hasDiscount = totalDiscount > 0;
    var hasFreeTokens = cust.freeTokens > 0;
    var catColor = p.category === 'Tokens' ? '#6366f1' : p.category === 'Drinks' ? '#3b82f6' : p.category === 'Snacks' ? '#f59e0b' : '#a855f7';

    return '<div style="position:relative;background:#0d1117;border:1px solid ' + (isOut ? '#3a1a1a' : '#2a3040') + ';border-radius:10px;padding:14px;cursor:' + (isOut ? 'not-allowed' : 'pointer') + ';opacity:' + (isOut ? '0.5' : '1') + ';transition:all 0.15s;" onmouseenter="this.style.borderColor=\'' + catColor + '\'" onmouseleave="this.style.borderColor=\'' + (isOut ? '#3a1a1a' : '#2a3040') + '\'">' +
      '<button onclick="event.stopPropagation();window.__posEditProduct(\'' + p.id + '\')" style="position:absolute;top:6px;right:6px;width:24px;height:24px;border-radius:6px;border:1px solid #30363d;background:#161b22;color:#94a3b8;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:0.65rem;transition:all 0.15s;z-index:1;" onmouseenter="this.style.borderColor=\'#6366f1\';this.style.color=\'#6366f1\'" onmouseleave="this.style.borderColor=\'#30363d\';this.style.color=\'#94a3b8\'">&#9998;</button>' +
      (p.category !== 'Tokens' ? '<div style="color:' + catColor + ';font-size:0.65rem;font-weight:600;margin-bottom:4px;">' + esc(p.category || '') + '</div>' : '') +
      '<div onclick="window.__posAdd(\'' + p.id + '\')" style="cursor:' + (isOut ? 'not-allowed' : 'pointer') + ';">' +
        '<div style="color:#e2e8f0;font-weight:600;font-size:0.85rem;margin-bottom:6px;padding-right:28px;">' + esc(p.name || '') + '</div>' +
        '<div style="display:flex;align-items:center;gap:8px;">' +
          (hasDiscount ? '<span style="color:#666;font-size:0.8rem;text-decoration:line-through;">' + formatCurrency(p.price) + '</span>' : '') +
          '<span style="color:' + (hasDiscount ? '#22c55e' : catColor) + ';font-weight:700;font-size:1rem;">' + formatCurrency(effectivePrice) + '</span>' +
        '</div>' +
        (hasFreeTokens ? '<div style="color:#f59e0b;font-size:0.7rem;font-weight:600;margin-top:4px;">+' + cust.freeTokens + ' FREE TOKENS</div>' : '') +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px;">' +
          '<span style="color:' + (isOut ? '#ef4444' : '#22c55e') + ';font-size:0.7rem;font-weight:600;">' + (isOut ? 'SOLD OUT' : 'Stock: ' + stock) + '</span>' +
          (isOut ? '' : '<span style="color:#888;font-size:0.65rem;">+ add</span>') +
        '</div>' +
      '</div>' +
    '</div>';
  }

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
      '<div class="page-content" id="page-body" style="overflow:auto;">' +

      '<div style="display:flex;gap:20px;height:calc(100vh - 120px);overflow:hidden;">' +

      '<div style="flex:1;display:flex;flex-direction:column;gap:16px;min-height:0;overflow-y:auto;">' +

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
            '<div style="color:#94a3b8;font-size:0.8rem;font-weight:600;margin-bottom:12px;text-transform:uppercase;letter-spacing:0.5px;">Token Repacks</div>' +
            '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px;">' +
            tokens.map(renderProductCard).join('') +
            '</div>' +
          '</div>' : '') +

        (function() {
            if (cart.length === 0) {
                return '<div style="background:#1a1f2e;border:1px solid #2a3040;border-radius:12px;padding:16px;">' +
                    '<div style="color:#94a3b8;font-size:0.8rem;font-weight:600;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.5px;">Sales Breakdown</div>' +
                    '<div style="color:#64748b;font-size:0.8rem;text-align:center;padding:12px 0;">Add items to see breakdown</div>' +
                '</div>';
            }
            var totalQty = 0;
            var totalTokens = 0;
            var totalAmount = 0;
            var rows = cart.map(function(item) {
                totalQty += item.quantity;
                var itemTokens = item.item_type === 'smash' || item.item_type === 'extra' ? item.token_count : (item.tokens_per_item || 0) * item.quantity;
                var amount = item.price * item.quantity;
                totalTokens += itemTokens;
                totalAmount += amount;
                var typeTag = item.item_type === 'smash' ? '<span style="color:#f59e0b;font-size:0.55rem;font-weight:700;background:#f59e0b20;padding:1px 4px;border-radius:3px;">SMASH</span> ' : item.item_type === 'extra' ? '<span style="color:#ef4444;font-size:0.55rem;font-weight:700;background:#ef444420;padding:1px 4px;border-radius:3px;">EXTRA</span> ' : '';
                return '<tr style="border-bottom:1px solid #1e2736;">' +
                    '<td style="padding:3px 4px;color:#e2e8f0;font-size:0.7rem;">' + typeTag + esc(item.name || '') + '</td>' +
                    '<td style="padding:3px 4px;text-align:center;color:#f59e0b;font-size:0.7rem;">' + item.quantity + '</td>' +
                    '<td style="padding:3px 4px;text-align:center;color:#6366f1;font-size:0.7rem;">' + itemTokens + '</td>' +
                    '<td style="padding:3px 4px;text-align:right;color:#22c55e;font-size:0.7rem;">' + formatCurrency(amount) + '</td>' +
                '</tr>';
            }).join('');

            return '<div style="background:#1a1f2e;border:1px solid #2a3040;border-radius:12px;padding:16px;">' +
                '<div style="color:#94a3b8;font-size:0.8rem;font-weight:600;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.5px;">Sales Breakdown</div>' +
                '<table style="width:100%;border-collapse:collapse;">' +
                '<thead><tr style="border-bottom:1px solid #2a3040;">' +
                    '<th style="padding:3px 4px;text-align:left;color:#94a3b8;font-size:0.6rem;">ITEM</th>' +
                    '<th style="padding:3px 4px;text-align:center;color:#f59e0b;font-size:0.6rem;">QTY</th>' +
                    '<th style="padding:3px 4px;text-align:center;color:#6366f1;font-size:0.6rem;">TOKENS</th>' +
                    '<th style="padding:3px 4px;text-align:right;color:#22c55e;font-size:0.6rem;">AMOUNT</th>' +
                '</tr></thead><tbody>' + rows + '</tbody></table>' +
                '<div style="display:flex;justify-content:space-between;padding:4px 0;border-top:1px solid #2a3040;margin-top:4px;">' +
                    '<span style="color:#e2e8f0;font-size:0.75rem;font-weight:600;">Total (' + totalQty + ' items)</span>' +
                    '<span style="color:#22c55e;font-size:0.75rem;font-weight:700;">' + formatCurrency(totalAmount) + '</span>' +
                '</div>' +
            '</div>';
        })() +

        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">' +
          '<div style="background:#1a1f2e;border:1px solid #2a3040;border-radius:12px;padding:16px;">' +
            '<div style="color:#f59e0b;font-size:0.8rem;font-weight:600;margin-bottom:12px;text-transform:uppercase;letter-spacing:0.5px;">SMASH (Single Tokens)</div>' +
            '<div style="color:#94a3b8;font-size:0.7rem;margin-bottom:10px;">For buying 1-2 tokens at a time</div>' +
            '<div style="display:flex;gap:8px;margin-bottom:8px;">' +
              '<div style="flex:1;"><label style="color:#888;font-size:0.65rem;display:block;margin-bottom:4px;">Qty</label>' +
              '<input type="number" id="smash-qty" min="0" value="' + smashQty + '" style="width:100%;background:#0d1117;border:1px solid #30363d;border-radius:6px;padding:8px;color:#e2e8f0;font-size:0.85rem;box-sizing:border-box;"></div>' +
              '<div style="flex:1;"><label style="color:#888;font-size:0.65rem;display:block;margin-bottom:4px;">\u20b1 Price</label>' +
              '<input type="number" id="smash-price" min="0" value="' + smashPrice + '" style="width:100%;background:#0d1117;border:1px solid #30363d;border-radius:6px;padding:8px;color:#e2e8f0;font-size:0.85rem;box-sizing:border-box;"></div>' +
            '</div>' +
            '<button onclick="window.__posAddSmash()" style="width:100%;padding:8px;border:none;border-radius:6px;background:#f59e0b;color:#000;font-size:0.8rem;font-weight:600;cursor:pointer;">+ Add Smash</button>' +
          '</div>' +
          '<div style="background:#1a1f2e;border:1px solid #2a3040;border-radius:12px;padding:16px;">' +
            '<div style="color:#ef4444;font-size:0.8rem;font-weight:600;margin-bottom:12px;text-transform:uppercase;letter-spacing:0.5px;">EXTRA TOKEN (Service)</div>' +
            '<div style="color:#94a3b8;font-size:0.7rem;margin-bottom:10px;">For tracking borrowed/lent tokens</div>' +
            '<div style="display:flex;gap:8px;margin-bottom:8px;">' +
              '<div style="flex:1;"><label style="color:#888;font-size:0.65rem;display:block;margin-bottom:4px;">Qty</label>' +
              '<input type="number" id="extra-qty" min="0" value="' + extraQty + '" style="width:100%;background:#0d1117;border:1px solid #30363d;border-radius:6px;padding:8px;color:#e2e8f0;font-size:0.85rem;box-sizing:border-box;"></div>' +
              '<div style="flex:1;"><label style="color:#888;font-size:0.65rem;display:block;margin-bottom:4px;">\u20b1 Price</label>' +
              '<input type="number" id="extra-price" min="0" value="' + extraPrice + '" style="width:100%;background:#0d1117;border:1px solid #30363d;border-radius:6px;padding:8px;color:#e2e8f0;font-size:0.85rem;box-sizing:border-box;"></div>' +
            '</div>' +
            '<button onclick="window.__posAddExtra()" style="width:100%;padding:8px;border:none;border-radius:6px;background:#ef4444;color:#fff;font-size:0.8rem;font-weight:600;cursor:pointer;">+ Add Extra</button>' +
          '</div>' +
        '</div>' +

      '</div>' +

      '<div style="background:#1a1f2e;border:1px solid #2a3040;border-radius:12px;display:flex;flex-direction:column;overflow:hidden;width:380px;flex-shrink:0;">' +
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
          cart.map(function(item, idx) {
            var areaObj = AREAS.find(function(a) { return a.id === item.area; });
            var areaColor = item.item_type === 'smash' ? '#f59e0b' : item.item_type === 'extra' ? '#ef4444' : (areaObj ? areaObj.color : '#6366f1');
            var typeTag = item.item_type === 'smash' ? '<span style="color:#f59e0b;font-size:0.6rem;font-weight:700;background:#f59e0b20;padding:2px 6px;border-radius:4px;">SMASH</span> ' : item.item_type === 'extra' ? '<span style="color:#ef4444;font-size:0.6rem;font-weight:700;background:#ef444420;padding:2px 6px;border-radius:4px;">EXTRA</span> ' : '';
            return '<div style="display:flex;align-items:center;gap:10px;padding:10px;background:#0d1117;border-radius:8px;margin-bottom:8px;border-left:3px solid ' + areaColor + ';">' +
              '<div style="flex:1;min-width:0;">' +
                '<div style="color:#e2e8f0;font-weight:600;font-size:0.85rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + typeTag + esc(item.name) + '</div>' +
                '<div style="display:flex;gap:8px;align-items:center;">' +
                  '<span style="color:' + areaColor + ';font-size:0.65rem;font-weight:600;">' + (item.area || 'Arcade') + '</span>' +
                  '<span style="color:#6366f1;font-size:0.8rem;">' + formatCurrency(item.price) + '</span>' +
                  (item.freeTokens > 0 ? '<span style="color:#f59e0b;font-size:0.65rem;font-weight:600;">+' + item.freeTokens + ' free</span>' : '') +
                '</div>' +
              '</div>' +
              '<div style="display:flex;align-items:center;gap:6px;">' +
                '<button onclick="window.__posQtyIdx(' + idx + ',-1)" style="width:28px;height:28px;border-radius:6px;border:1px solid #30363d;background:#161b22;color:#e2e8f0;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:0.9rem;">-</button>' +
                '<span style="color:#e2e8f0;font-weight:600;min-width:24px;text-align:center;">' + item.quantity + '</span>' +
                '<button onclick="window.__posQtyIdx(' + idx + ',1)" style="width:28px;height:28px;border-radius:6px;border:1px solid #30363d;background:#161b22;color:#e2e8f0;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:0.9rem;">+</button>' +
              '</div>' +
              '<div style="display:flex;flex-direction:column;align-items:flex-end;gap:2px;">' +
                '<div style="color:#e2e8f0;font-weight:600;font-size:0.85rem;">' + formatCurrency(item.price * item.quantity) + '</div>' +
                '<button onclick="window.__posRemoveIdx(' + idx + ')" style="background:none;border:none;color:#ef4444;cursor:pointer;font-size:0.7rem;padding:0;">remove</button>' +
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
        await Promise.all([loadProducts(), loadTracking(), loadTrackingSheet()]);
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

    var smashQtyInput = document.getElementById('smash-qty');
    var smashPriceInput = document.getElementById('smash-price');
    var extraQtyInput = document.getElementById('extra-qty');
    var extraPriceInput = document.getElementById('extra-price');
    if (smashQtyInput) smashQtyInput.addEventListener('change', function(e) { smashQty = parseInt(e.target.value) || 0; });
    if (smashPriceInput) smashPriceInput.addEventListener('change', function(e) { smashPrice = parseInt(e.target.value) || 0; });
    if (extraQtyInput) extraQtyInput.addEventListener('change', function(e) { extraQty = parseInt(e.target.value) || 0; });
    if (extraPriceInput) extraPriceInput.addEventListener('change', function(e) { extraPrice = parseInt(e.target.value) || 0; });
  }

  function renderEditModal(productId) {
    var product = products.find(function(p) { return String(p.id) === String(productId); });
    if (!product) return;
    var cust = productCustomizations[product.id] || {};
    var isToken = product.category === 'Tokens';

    var modal = document.createElement('div');
    modal.id = 'pos-edit-modal';
    modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:9999;';
    modal.onclick = function(e) { if (e.target === modal) modal.remove(); };

    var html = '<div style="background:#1a1f2e;border:1px solid #2a3040;border-radius:16px;padding:24px;width:360px;max-width:90vw;">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">' +
        '<div>' +
          '<div style="color:#e2e8f0;font-weight:700;font-size:1rem;">' + esc(product.name) + '</div>' +
          '<div style="color:#888;font-size:0.75rem;margin-top:2px;">Base price: ' + formatCurrency(product.price) + '</div>' +
        '</div>' +
        '<button onclick="document.getElementById(\'pos-edit-modal\').remove()" style="background:none;border:none;color:#94a3b8;cursor:pointer;font-size:1.2rem;">&times;</button>' +
      '</div>' +

      '<div style="margin-bottom:16px;">' +
        '<label style="color:#94a3b8;font-size:0.75rem;font-weight:600;display:block;margin-bottom:6px;">DISCOUNT (\u20b1 OFF)</label>' +
        '<input type="number" id="edit-discount" min="0" step="1" value="' + (cust.discount || 0) + '" style="width:100%;background:#0d1117;border:1px solid #30363d;border-radius:8px;padding:10px 12px;color:#e2e8f0;font-size:0.9rem;box-sizing:border-box;">' +
      '</div>' +

      (isToken ?
      '<div style="margin-bottom:16px;">' +
        '<label style="color:#94a3b8;font-size:0.75rem;font-weight:600;display:block;margin-bottom:6px;">FREE TOKENS (BONUS)</label>' +
        '<input type="number" id="edit-free-tokens" min="0" step="1" value="' + (cust.freeTokens || 0) + '" style="width:100%;background:#0d1117;border:1px solid #30363d;border-radius:8px;padding:10px 12px;color:#e2e8f0;font-size:0.9rem;box-sizing:border-box;">' +
      '</div>' : '') +

      '<div style="background:#0d1117;border-radius:8px;padding:10px 12px;margin-bottom:16px;">' +
        '<div style="color:#888;font-size:0.7rem;margin-bottom:4px;">Final Price</div>' +
        '<div id="edit-preview-price" style="color:#22c55e;font-weight:700;font-size:1.2rem;">' + formatCurrency(getEffectivePrice(product)) + '</div>' +
      '</div>' +

      '<div style="display:flex;gap:8px;">' +
        '<button onclick="window.__posEditClear(\'' + productId + '\')" style="flex:1;padding:10px;border:1px solid #30363d;border-radius:8px;background:#0d1117;color:#94a3b8;font-size:0.85rem;cursor:pointer;">Clear</button>' +
        '<button onclick="window.__posEditSave(\'' + productId + '\')" style="flex:2;padding:10px;border:none;border-radius:8px;background:#6366f1;color:#fff;font-size:0.85rem;font-weight:600;cursor:pointer;">Save</button>' +
      '</div>' +
    '</div>';

    modal.innerHTML = html;
    document.body.appendChild(modal);

    var discountInput = document.getElementById('edit-discount');
    var freeInput = document.getElementById('edit-free-tokens');
    var previewPrice = document.getElementById('edit-preview-price');

    function updatePreview() {
      var d = parseInt(discountInput.value) || 0;
      var finalPrice = product.price - (product.discount || 0) - d;
      if (finalPrice < 0) finalPrice = 0;
      previewPrice.textContent = formatCurrency(finalPrice);
      previewPrice.style.color = (d > 0) ? '#22c55e' : '#e2e8f0';
    }

    if (discountInput) discountInput.addEventListener('input', updatePreview);
    if (freeInput) freeInput.addEventListener('input', updatePreview);
  }

  window.__posEditProduct = function(id) { renderEditModal(id); };

  window.__posEditSave = function(id) {
    var discountInput = document.getElementById('edit-discount');
    var freeInput = document.getElementById('edit-free-tokens');
    var discount = parseInt(discountInput ? discountInput.value : 0) || 0;
    var freeTokens = parseInt(freeInput ? freeInput.value : 0) || 0;
    if (discount < 0) discount = 0;
    if (freeTokens < 0) freeTokens = 0;
    productCustomizations[id] = { discount: discount, freeTokens: freeTokens };
    var modal = document.getElementById('pos-edit-modal');
    if (modal) modal.remove();
    Toast.success('Product updated');
    render();
  };

  window.__posEditClear = function(id) {
    delete productCustomizations[id];
    var modal = document.getElementById('pos-edit-modal');
    if (modal) modal.remove();
    Toast.success('Customization cleared');
    render();
  };

  window.__posAdd = function(id) { addToCart(id); };
  window.__posQty = function(id, delta) { updateCartQuantity(id, delta); };
  window.__posRemove = function(id) { removeFromCart(id); };
  window.__posArea = function(area) { activeArea = area; render(); };

  window.__posQtyIdx = function(idx, delta) {
    if (idx < 0 || idx >= cart.length) return;
    cart[idx].quantity += delta;
    if (cart[idx].quantity <= 0) { cart.splice(idx, 1); }
    render();
  };

  window.__posRemoveIdx = function(idx) {
    if (idx < 0 || idx >= cart.length) return;
    cart.splice(idx, 1);
    render();
  };

  window.__posAddSmash = function() {
    if (smashQty <= 0) { Toast.error('Enter quantity'); return; }
    if (smashPrice <= 0) { Toast.error('Enter price'); return; }
    var perToken = smashPrice / smashQty;
    var name = 'Smash (' + smashQty + ' token' + (smashQty > 1 ? 's' : '') + ')';
    var existing = cart.find(function(c) { return c.item_type === 'smash'; });
    if (existing) {
      existing.quantity = smashQty;
      existing.price = perToken;
      existing.token_count = smashQty;
      existing.name = name;
    } else {
      cart.push({ product_id: null, name: name, price: perToken, quantity: smashQty, stock: 9999, area: activeArea, item_type: 'smash', token_count: smashQty });
    }
    render();
    Toast.success('Smash added');
  };

  window.__posAddExtra = function() {
    if (extraQty <= 0) { Toast.error('Enter quantity'); return; }
    var perToken = extraQty > 0 ? extraPrice / extraQty : extraPrice;
    var name = 'Extra Token (' + extraQty + ' token' + (extraQty > 1 ? 's' : '') + ')';
    var existing = cart.find(function(c) { return c.item_type === 'extra'; });
    if (existing) {
      existing.quantity = extraQty;
      existing.price = perToken;
      existing.token_count = extraQty;
      existing.name = name;
    } else {
      cart.push({ product_id: null, name: name, price: perToken, quantity: extraQty, stock: 9999, area: activeArea, item_type: 'extra', token_count: extraQty });
    }
    render();
    Toast.success('Extra token added');
  };

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
    if (!await confirmAsync('Complete sale for ' + formatCurrency(total) + '?', 'Complete Sale')) return;

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
        items: areaItems.map(function(item) {
          var d = { product_id: item.product_id, quantity: item.quantity };
          if (item.item_type === 'smash' || item.item_type === 'extra') {
            d.item_type = item.item_type;
            d.custom_price = item.price;
            d.token_count = item.token_count || 0;
          }
          return d;
        }),
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
