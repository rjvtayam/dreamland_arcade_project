function renderAdminPOS() {
  var app = document.getElementById('app');
  var products = [];
  var branches = [];
  var cart = [];
  var selectedBranch = '';
  var paymentMethod = 'Cash';
  var searchQuery = '';

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
      await loadProducts();
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

  function addToCart(productId) {
    var product = products.find(function(p) { return String(p.id) === String(productId); });
    if (!product) return;
    var existing = cart.find(function(c) { return String(c.product_id) === String(productId); });
    if (existing) {
      if (existing.quantity >= (product.stock || 0)) { Toast.error('Not enough stock'); return; }
      existing.quantity++;
    } else {
      if ((product.stock || 0) <= 0) { Toast.error('Out of stock'); return; }
      cart.push({ product_id: product.id, name: product.name, price: product.price, quantity: 1, stock: product.stock });
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

        '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px;overflow-y:auto;padding-right:4px;flex:1;">' +
        (filteredProducts.length === 0 ? '<div style="grid-column:1/-1;text-align:center;padding:40px;color:#666;">No products found</div>' :
          filteredProducts.map(function(p) {
            var stock = p.stock || 0;
            var isOut = stock <= 0;
            var isLow = stock > 0 && stock <= 10;
            var stockColor = isOut ? '#ef4444' : isLow ? '#f59e0b' : '#22c55e';
            return '<div onclick="window.__posAdd(\'' + p.id + '\')" style="background:#1a1f2e;border:1px solid ' + (isOut ? '#3a1a1a' : '#2a3040') + ';border-radius:12px;padding:16px;cursor:' + (isOut ? 'not-allowed' : 'pointer') + ';opacity:' + (isOut ? '0.5' : '1') + ';transition:all 0.15s;display:flex;flex-direction:column;gap:8px;" onmouseenter="this.style.borderColor=\'#6366f1\'" onmouseleave="this.style.borderColor=\'' + (isOut ? '#3a1a1a' : '#2a3040') + '\'">' +
              '<div style="color:#e2e8f0;font-weight:600;font-size:0.9rem;line-height:1.3;">' + esc(p.name || '') + '</div>' +
              '<div style="color:#6366f1;font-weight:700;font-size:1.1rem;">' + formatCurrency(p.price) + '</div>' +
              '<div style="display:flex;justify-content:space-between;align-items:center;">' +
                '<span style="color:' + stockColor + ';font-size:0.75rem;font-weight:600;">Stock: ' + stock + '</span>' +
                (isOut ? '<span style="color:#ef4444;font-size:0.7rem;">SOLD OUT</span>' : '<span style="color:#888;font-size:0.7rem;">Click to add</span>') +
              '</div>' +
            '</div>';
          }).join('')) +
        '</div>' +
      '</div>' +

      '<div style="background:#1a1f2e;border:1px solid #2a3040;border-radius:12px;display:flex;flex-direction:column;overflow:hidden;">' +
        '<div style="padding:16px 20px;border-bottom:1px solid #2a3040;display:flex;justify-content:space-between;align-items:center;">' +
          '<h3 style="color:#e2e8f0;margin:0;font-size:1rem;">Cart</h3>' +
          '<span style="color:#888;font-size:0.8rem;">' + cart.reduce(function(s, i) { return s + i.quantity; }, 0) + ' items</span>' +
        '</div>' +

        '<div style="flex:1;overflow-y:auto;padding:12px;">' +
        (cart.length === 0 ? '<div style="text-align:center;padding:40px 0;color:#666;">Cart is empty</div>' :
          cart.map(function(item) {
            return '<div style="display:flex;align-items:center;gap:10px;padding:10px;background:#0d1117;border-radius:8px;margin-bottom:8px;">' +
              '<div style="flex:1;min-width:0;">' +
                '<div style="color:#e2e8f0;font-weight:600;font-size:0.85rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + esc(item.name) + '</div>' +
                '<div style="color:#6366f1;font-size:0.8rem;">' + formatCurrency(item.price) + ' each</div>' +
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
        await loadProducts();
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

  async function completeSale() {
    if (cart.length === 0) { Toast.error('Cart is empty'); return; }
    var total = getCartTotal();
    if (!confirm('Complete sale for ' + formatCurrency(total) + '?')) return;
    var data = {
      branch_id: selectedBranch,
      items: cart.map(function(item) { return { product_id: item.product_id, quantity: item.quantity }; }),
      payment_method: paymentMethod
    };
    try {
      await apiPost('/sales', data);
      Toast.success('Sale completed! Total: ' + formatCurrency(total));
      cart = [];
      await loadProducts();
    } catch (err) {
      Toast.error(err.message || 'Failed to complete sale');
    }
  }

  function esc(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  loadData();
}

Router.register('pos', renderAdminPOS);
