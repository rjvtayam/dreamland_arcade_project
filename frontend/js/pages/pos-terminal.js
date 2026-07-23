function renderPOSTerminal() {
    var posUser = null;
    try { posUser = JSON.parse(localStorage.getItem('pos_user')); } catch(e) {}
    var posToken = localStorage.getItem('pos_token');

    if (!posToken || !posUser) {
        Router.navigate('pos-login');
        return;
    }

    var app = document.getElementById('app');
    var products = [];
    var cart = [];
    var selectedBranch = String(posUser.branch_id || '');
    var paymentMethod = 'Cash';
    var searchQuery = '';
    var activeArea = 'Arcade';
    var tracking = [];
    var loyaltyMember = null;
    var productCustomizations = {};

    var AREAS = [
        { id: 'Arcade', icon: '\ud83c\udfae', color: '#6366f1' },
        { id: 'Playhouse', icon: '\ud83c\udfe0', color: '#22c55e' },
        { id: 'Cafe', icon: '\u2615', color: '#f59e0b' }
    ];

    function posApiHeaders() {
        return { 'Authorization': 'Bearer ' + posToken, 'Content-Type': 'application/json' };
    }

    async function posApiGet(path) {
        var resp = await fetch(API_BASE + path, { headers: posApiHeaders() });
        if (!resp.ok) { var e = await resp.json().catch(function() { return {}; }); throw new Error(e.detail || 'Request failed'); }
        return resp.json();
    }

    async function posApiPost(path, body) {
        var resp = await fetch(API_BASE + path, { method: 'POST', headers: posApiHeaders(), body: JSON.stringify(body) });
        if (!resp.ok) { var e = await resp.json().catch(function() { return {}; }); throw new Error(e.detail || 'Request failed'); }
        return resp.json();
    }

    async function loadData() {
        try {
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
            products = await posApiGet(url);
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
            tracking = await posApiGet(url);
            if (!Array.isArray(tracking)) tracking = [];
        } catch (e) {
            tracking = [];
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
        var existing = cart.find(function(c) { return String(c.product_id) === String(productId); });
        if (existing) {
            if (existing.quantity >= (product.stock || 0)) { Toast.error('Not enough stock'); return; }
            existing.quantity++;
        } else {
            if ((product.stock || 0) <= 0) { Toast.error('Out of stock'); return; }
            cart.push({ product_id: product.id, name: product.name, price: finalPrice, quantity: 1, stock: product.stock, area: activeArea, freeTokens: freeTokens });
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
        var initials = posUser ? (posUser.first_name || '').charAt(0) + (posUser.last_name || '').charAt(0) : '??';

        var filteredProducts = products;
        if (searchQuery) {
            var q = searchQuery.toLowerCase();
            filteredProducts = products.filter(function(p) { return (p.name || '').toLowerCase().indexOf(q) >= 0; });
        }

        var tokens = filteredProducts.filter(function(p) { return p.category === 'Tokens'; });
        var others = filteredProducts.filter(function(p) { return p.category !== 'Tokens'; });

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

            return '<div style="position:relative;background:#0d1117;border:1px solid ' + (isOut ? '#3a1a1a' : '#2a3040') + ';border-radius:10px;padding:14px;cursor:' + (isOut ? 'not-allowed' : 'pointer') + ';opacity:' + (isOut ? '0.5' : '1') + ';transition:all 0.15s;">' +
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

        app.innerHTML =
        '<div style="display:flex;flex-direction:column;height:100vh;background:#0a0e1a;">' +

        '<div style="background:#0d1117;border-bottom:1px solid #2a3040;padding:10px 24px;display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">' +
            '<div style="display:flex;align-items:center;gap:16px;">' +
                '<a href="#landing" onclick="window.__posTerminalLogout()" style="color:#94a3b8;font-size:0.8rem;text-decoration:none;display:flex;align-items:center;gap:6px;transition:color 0.2s;" onmouseenter="this.style.color=\'#22c55e\'" onmouseleave="this.style.color=\'#94a3b8\'">' +
                    '<span style="font-size:1.1rem;">&#8592;</span> Back' +
                '</a>' +
                '<div style="width:1px;height:24px;background:#2a3040;"></div>' +
                '<div style="display:flex;align-items:center;gap:8px;">' +
                    '<span style="font-size:1.2rem;">\ud83c\udfae</span>' +
                    '<span style="color:#22c55e;font-weight:700;font-size:0.85rem;letter-spacing:1px;">POS TERMINAL</span>' +
                '</div>' +
                '<button onclick="window.__posSubmitReport()" style="background:linear-gradient(135deg,#6366f1,#8b5cf6);border:none;color:#fff;font-size:0.75rem;font-weight:600;padding:6px 16px;border-radius:6px;cursor:pointer;letter-spacing:1px;transition:all 0.2s;" onmouseenter="this.style.boxShadow=\'0 0 15px rgba(99,102,241,0.4)\'" onmouseleave="this.style.boxShadow=\'none\'">Submit Report</button>' +
            '</div>' +
            '<div style="display:flex;align-items:center;gap:12px;">' +
                '<div style="background:#1a1f2e;border:1px solid #2a3040;border-radius:8px;padding:6px 14px;color:#22c55e;font-size:0.8rem;font-weight:600;">' + esc(posUser.branch_name || 'Branch') + '</div>' +
                '<div style="display:flex;align-items:center;gap:8px;">' +
                    '<div style="width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,#22c55e,#10b981);display:flex;align-items:center;justify-content:center;color:#fff;font-size:0.7rem;font-weight:700;">' + esc(initials) + '</div>' +
                    '<span style="color:#e2e8f0;font-size:0.8rem;">' + esc(posUser.first_name) + '</span>' +
                '</div>' +
                '<button onclick="window.__posTerminalLogout()" style="background:none;border:none;color:#94a3b8;cursor:pointer;font-size:0.8rem;padding:6px 12px;border:1px solid #30363d;border-radius:6px;transition:all 0.2s;" onmouseenter="this.style.color=\'#ef4444\';this.style.borderColor=\'#ef4444\'" onmouseleave="this.style.color=\'#94a3b8\';this.style.borderColor=\'#30363d\'">Logout</button>' +
            '</div>' +
        '</div>' +

        '<div style="flex:1;display:grid;grid-template-columns:1fr 380px;gap:0;overflow:hidden;">' +

        '<div style="display:flex;flex-direction:column;gap:12px;padding:16px 20px;overflow-y:auto;">' +

            '<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">' +
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

            (others.length > 0 ?
                '<div style="background:#1a1f2e;border:1px solid #2a3040;border-radius:12px;padding:16px;flex:1;">' +
                    '<div style="color:#94a3b8;font-size:0.8rem;font-weight:600;margin-bottom:12px;text-transform:uppercase;letter-spacing:0.5px;">Other Items</div>' +
                    '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px;">' +
                    others.map(renderProductCard).join('') +
                    '</div>' +
                '</div>' : '') +

        '</div>' +

        '<div style="background:#0d1117;border-left:1px solid #2a3040;display:flex;flex-direction:column;overflow:hidden;">' +
            '<div style="padding:16px 20px;border-bottom:1px solid #2a3040;display:flex;justify-content:space-between;align-items:center;">' +
                '<h3 style="color:#e2e8f0;margin:0;font-size:1rem;">Cart</h3>' +
                '<span style="color:#888;font-size:0.8rem;">' + cart.reduce(function(s, i) { return s + i.quantity; }, 0) + ' items</span>' +
            '</div>' +

            '<div style="padding:12px 16px;border-bottom:1px solid #2a3040;">' +
                (loyaltyMember ?
                    '<div style="display:flex;justify-content:space-between;align-items:center;background:#161b22;border:1px solid #6366f1;border-radius:8px;padding:10px;">' +
                        '<div><span style="color:#a78bfa;font-weight:600;font-size:0.85rem;">' + esc(loyaltyMember.first_name) + ' ' + esc(loyaltyMember.last_name) + '</span>' +
                        '<span style="color:#888;font-size:0.7rem;margin-left:8px;">' + esc(loyaltyMember.card_number) + '</span></div>' +
                        '<button onclick="window.__posClearMember()" style="background:none;border:none;color:#ef4444;cursor:pointer;font-size:0.75rem;">remove</button>' +
                    '</div>' :
                    '<div style="display:flex;gap:8px;">' +
                        '<input type="text" id="loyalty-card-input" placeholder="Card # or name..." style="flex:1;background:#161b22;border:1px solid #30363d;border-radius:6px;padding:7px 10px;color:#e2e8f0;font-size:0.8rem;">' +
                        '<button onclick="window.__posLookupMember()" style="background:#6366f1;color:#fff;border:none;border-radius:6px;padding:7px 12px;cursor:pointer;font-size:0.8rem;">Lookup</button>' +
                    '</div>'
                ) +
            '</div>' +

            '<div style="flex:1;overflow-y:auto;padding:12px;">' +
            (cart.length === 0 ? '<div style="text-align:center;padding:40px 0;color:#666;">Cart is empty</div>' :
                cart.map(function(item) {
                    var areaObj = AREAS.find(function(a) { return a.id === item.area; });
                    var areaColor = areaObj ? areaObj.color : '#6366f1';
                    return '<div style="display:flex;align-items:center;gap:10px;padding:10px;background:#161b22;border-radius:8px;margin-bottom:8px;border-left:3px solid ' + areaColor + ';">' +
                        '<div style="flex:1;min-width:0;">' +
                            '<div style="color:#e2e8f0;font-weight:600;font-size:0.85rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + esc(item.name) + '</div>' +
                            '<div style="display:flex;gap:8px;align-items:center;">' +
                                '<span style="color:' + areaColor + ';font-size:0.65rem;font-weight:600;">' + (item.area || 'Arcade') + '</span>' +
                                '<span style="color:#6366f1;font-size:0.8rem;">' + formatCurrency(item.price) + '</span>' +
                                (item.freeTokens > 0 ? '<span style="color:#f59e0b;font-size:0.65rem;font-weight:600;">+' + item.freeTokens + ' free</span>' : '') +
                            '</div>' +
                        '</div>' +
                        '<div style="display:flex;align-items:center;gap:6px;">' +
                            '<button onclick="window.__posQty(\'' + item.product_id + '\',-1)" style="width:28px;height:28px;border-radius:6px;border:1px solid #30363d;background:#1a1f2e;color:#e2e8f0;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:0.9rem;">-</button>' +
                            '<span style="color:#e2e8f0;font-weight:600;min-width:24px;text-align:center;">' + item.quantity + '</span>' +
                            '<button onclick="window.__posQty(\'' + item.product_id + '\',1)" style="width:28px;height:28px;border-radius:6px;border:1px solid #30363d;background:#1a1f2e;color:#e2e8f0;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:0.9rem;">+</button>' +
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
                    '<select id="payment-method" style="width:100%;background:#161b22;border:1px solid #30363d;border-radius:8px;padding:8px;color:#e2e8f0;font-size:0.85rem;">' +
                        '<option value="Cash"' + (paymentMethod === 'Cash' ? ' selected' : '') + '>Cash</option>' +
                        '<option value="GCash"' + (paymentMethod === 'GCash' ? ' selected' : '') + '>GCash</option>' +
                        '<option value="Card"' + (paymentMethod === 'Card' ? ' selected' : '') + '>Card</option>' +
                    '</select>' +
                '</div>' +
                '<button id="complete-sale-btn" style="width:100%;padding:12px;border:none;border-radius:8px;background:' + (cart.length === 0 ? '#374151' : '#22c55e') + ';color:#fff;font-size:1rem;font-weight:600;cursor:' + (cart.length === 0 ? 'not-allowed' : 'pointer') + ';"' + (cart.length === 0 ? ' disabled' : '') + '>Complete Sale</button>' +
            '</div>' +
        '</div>' +

        '</div></div>';

        attachEvents();
    }

    function attachEvents() {
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
                '<button onclick="window.__posEditSave(\'' + productId + '\')" style="flex:2;padding:10px;border:none;border-radius:8px;background:#22c55e;color:#fff;font-size:0.85rem;font-weight:600;cursor:pointer;">Save</button>' +
            '</div>' +
        '</div>';

        modal.innerHTML = html;
        document.body.appendChild(modal);

        var discountInput = document.getElementById('edit-discount');
        var freeInput = document.getElementById('edit-free-tokens');
        var previewPrice = document.getElementById('edit-preview-price');

        function updatePreview() {
            var d = parseInt(discountInput.value) || 0;
            var f = parseInt(freeInput ? freeInput.value : 0) || 0;
            var finalPrice = product.price - (product.discount || 0) - d;
            if (finalPrice < 0) finalPrice = 0;
            previewPrice.textContent = formatCurrency(finalPrice);
            if (d > 0 || f > 0) {
                previewPrice.style.color = '#22c55e';
            } else {
                previewPrice.style.color = '#e2e8f0';
            }
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

    window.__posLookupMember = async function() {
        var input = document.getElementById('loyalty-card-input');
        if (!input) return;
        var q = input.value.trim();
        if (!q) { Toast.error('Enter card number or name'); return; }
        try {
            var params = 'search=' + encodeURIComponent(q);
            if (selectedBranch) params += '&branch_id=' + selectedBranch;
            var results = await posApiGet('/members?' + params);
            if (!Array.isArray(results) || results.length === 0) { Toast.error('Member not found'); return; }
            loyaltyMember = results[0];
            Toast.success('Member: ' + loyaltyMember.first_name + ' ' + loyaltyMember.last_name);
            render();
        } catch (e) {
            Toast.error('Lookup failed');
        }
    };

    window.__posClearMember = function() { loyaltyMember = null; render(); };

    window.__posSubmitReport = async function() {
        if (!confirm('Submit daily sales report to owner?')) return;
        try {
            var result = await posApiPost('/pos-reports', {});
            Toast.success('Report submitted! Sales: ' + formatCurrency(result.total_sales) + ' (' + result.total_transactions + ' transactions)');
        } catch (err) {
            Toast.error(err.message || 'Failed to submit report');
        }
    };

    window.__posTerminalLogout = function() {
        localStorage.removeItem('pos_token');
        localStorage.removeItem('pos_refresh');
        localStorage.removeItem('pos_user');
    };

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
                await posApiPost('/sales', data);
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

Router.register('pos-terminal', renderPOSTerminal);
