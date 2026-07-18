function renderAdminPOS() {
  const app = document.getElementById('app');
  let products = [];
  let branches = [];
  let cart = [];
  let selectedBranch = '';
  let paymentMethod = 'Cash';

  async function loadData() {
    try {
      branches = await apiGet('/branches');
      if (!Array.isArray(branches)) branches = [];
      if (branches.length > 0 && !selectedBranch) {
        selectedBranch = String(branches[0].id);
      }
      await loadProducts();
    } catch (e) {
      console.error('Failed to load POS data:', e);
      Toast.error('Failed to load POS data');
    }
  }

  async function loadProducts() {
    try {
      let url = '/api/products';
      const params = [];
      if (selectedBranch) params.push('branch_id=' + selectedBranch);
      if (params.length) url += '?' + params.join('&');
      products = await apiGet(url);
      if (!Array.isArray(products)) products = [];
      products = products.filter(p => p.is_active !== false);
      render();
    } catch (e) {
      console.error('Failed to load products:', e);
      Toast.error('Failed to load products');
    }
  }

  function addToCart(productId) {
    const product = products.find(p => String(p.id) === String(productId));
    if (!product) return;

    const existing = cart.find(c => String(c.product_id) === String(productId));
    if (existing) {
      if (existing.quantity >= (product.stock || 0)) {
        Toast.error('Not enough stock');
        return;
      }
      existing.quantity++;
    } else {
      if ((product.stock || 0) <= 0) {
        Toast.error('Out of stock');
        return;
      }
      cart.push({
        product_id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        stock: product.stock
      });
    }
    render();
  }

  function updateCartQuantity(productId, delta) {
    const item = cart.find(c => String(c.product_id) === String(productId));
    if (!item) return;
    item.quantity += delta;
    if (item.quantity <= 0) {
      cart = cart.filter(c => String(c.product_id) !== String(productId));
    } else if (item.quantity > item.stock) {
      Toast.error('Not enough stock');
      item.quantity = item.stock;
    }
    render();
  }

  function removeFromCart(productId) {
    cart = cart.filter(c => String(c.product_id) !== String(productId));
    render();
  }

  function getCartTotal() {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  function render() {
    const total = getCartTotal();

    app.innerHTML = '<div class="layout">' + renderSidebar() +
      '<div class="main-content">' + renderNavbar('POS Terminal') +
      '<div class="page-content" id="page-body">' +
      '<div class="pos-container">' +

      '<div class="pos-left">' +
      '<div class="pos-header">' +
      '<div class="filter-group">' +
      '<label>Branch:</label>' +
      '<select id="branch-selector" class="form-control">' +
      branches.map(b => '<option value="' + b.id + '"' + (String(b.id) === String(selectedBranch) ? ' selected' : '') + '>' + escapeHtml(b.name || '') + '</option>').join('') +
      '</select>' +
      '</div>' +
      '</div>' +
      '<div class="product-grid" id="product-grid">' +
      (products.length === 0 ? '<div class="no-data">No products available</div>' :
        products.map(p => '<div class="product-card' + ((p.stock || 0) <= 0 ? ' out-of-stock' : '') + '" data-id="' + p.id + '">' +
          '<div class="product-name">' + escapeHtml(p.name || '') + '</div>' +
          '<div class="product-price">' + formatCurrency(p.price) + '</div>' +
          '<div class="product-stock">Stock: ' + escapeHtml(String(p.stock ?? 0)) + '</div>' +
          '</div>').join('')) +
      '</div>' +
      '</div>' +

      '<div class="pos-right">' +
      '<div class="cart-header"><h3>Cart</h3></div>' +
      '<div class="cart-items" id="cart-items">' +
      (cart.length === 0 ? '<div class="no-data">No items in cart</div>' :
        cart.map(item => '<div class="cart-item">' +
          '<div class="cart-item-info">' +
          '<div class="cart-item-name">' + escapeHtml(item.name) + '</div>' +
          '<div class="cart-item-price">' + formatCurrency(item.price) + '</div>' +
          '</div>' +
          '<div class="cart-item-controls">' +
          '<button class="btn btn-sm cart-qty-btn" data-id="' + item.product_id + '" data-action="minus">-</button>' +
          '<span class="cart-qty">' + item.quantity + '</span>' +
          '<button class="btn btn-sm cart-qty-btn" data-id="' + item.product_id + '" data-action="plus">+</button>' +
          '<button class="btn btn-sm btn-danger cart-remove-btn" data-id="' + item.product_id + '">x</button>' +
          '</div>' +
          '<div class="cart-item-subtotal">' + formatCurrency(item.price * item.quantity) + '</div>' +
          '</div>').join('')) +
      '</div>' +
      '<div class="cart-footer">' +
      '<div class="cart-total"><strong>Total: ' + formatCurrency(total) + '</strong></div>' +
      '<div class="form-group">' +
      '<label>Payment Method</label>' +
      '<select id="payment-method" class="form-control">' +
      '<option value="Cash"' + (paymentMethod === 'Cash' ? ' selected' : '') + '>Cash</option>' +
      '<option value="GCash"' + (paymentMethod === 'GCash' ? ' selected' : '') + '>GCash</option>' +
      '<option value="Card"' + (paymentMethod === 'Card' ? ' selected' : '') + '>Card</option>' +
      '</select></div>' +
      '<button class="btn btn-primary btn-block" id="complete-sale-btn"' + (cart.length === 0 ? ' disabled' : '') + '>Complete Sale</button>' +
      '</div>' +
      '</div>' +

      '</div></div></div></div>';

    attachEvents();
  }

  function attachEvents() {
    document.getElementById('logout-btn')?.addEventListener('click', e => { e.preventDefault(); Auth.logout(); });

    document.getElementById('branch-selector')?.addEventListener('change', async e => {
      selectedBranch = e.target.value;
      cart = [];
      await loadProducts();
    });

    document.getElementById('payment-method')?.addEventListener('change', e => {
      paymentMethod = e.target.value;
    });

    document.querySelectorAll('.product-card').forEach(card => {
      card.addEventListener('click', () => addToCart(card.dataset.id));
    });

    document.querySelectorAll('.cart-qty-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        updateCartQuantity(btn.dataset.id, btn.dataset.action === 'plus' ? 1 : -1);
      });
    });

    document.querySelectorAll('.cart-remove-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        removeFromCart(btn.dataset.id);
      });
    });

    document.getElementById('complete-sale-btn')?.addEventListener('click', completeSale);
  }

  async function completeSale() {
    if (cart.length === 0) {
      Toast.error('Cart is empty');
      return;
    }

    const total = getCartTotal();
    if (!confirm('Complete sale for ' + formatCurrency(total) + '?')) return;

    const data = {
      branch_id: selectedBranch,
      items: cart.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity
      })),
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

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  loadData();
}

Router.register('pos', renderAdminPOS);
