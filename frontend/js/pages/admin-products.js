function renderAdminProducts() {
  const app = document.getElementById('app');
  let products = [];
  let branches = [];
  let filterBranch = '';
  let filterCategory = '';

  const categories = ['Tokens', 'Snacks', 'Drinks', 'Merch'];

  async function loadData() {
    try {
      products = await apiGet('/products');
      if (!Array.isArray(products)) products = [];
      branches = await apiGet('/branches');
      if (!Array.isArray(branches)) branches = [];
      render();
    } catch (e) {
      console.error('Failed to load products:', e);
      Toast.error('Failed to load products');
    }
  }

  function getFiltered() {
    return products.filter(p => {
      if (filterBranch && String(p.branch_id) !== String(filterBranch)) return false;
      if (filterCategory && p.category !== filterCategory) return false;
      return true;
    });
  }

  function render() {
    const filtered = getFiltered();
    app.innerHTML = '<div class="layout">' + renderSidebar() +
      '<div class="main-content">' + renderNavbar('Product Management') +
      '<div class="page-content" id="page-body">' +
      '<div class="page-header">' +
      '<div class="page-header-left">' +
      '<div class="filter-group">' +
      '<select id="branch-filter" class="form-control">' +
      '<option value="">All Branches</option>' +
      branches.map(b => '<option value="' + b.id + '"' + (String(b.id) === String(filterBranch) ? ' selected' : '') + '>' + escapeHtml(b.name || '') + '</option>').join('') +
      '</select>' +
      '<select id="category-filter" class="form-control">' +
      '<option value="">All Categories</option>' +
      categories.map(c => '<option value="' + c + '"' + (filterCategory === c ? ' selected' : '') + '>' + c + '</option>').join('') +
      '</select>' +
      '</div>' +
      '</div>' +
      '<button class="btn btn-primary" id="add-product-btn">Add Product</button>' +
      '</div>' +
      '<div class="table-container">' +
      '<table class="data-table">' +
      '<thead><tr>' +
      '<th>Name</th><th>Category</th><th>Branch</th><th>Price</th><th>Discount</th><th>Final</th><th>Stock</th><th>Status</th><th>Actions</th>' +
      '</tr></thead>' +
      '<tbody>' +
      (filtered.length === 0 ? '<tr><td colspan="9" class="no-data">No products found</td></tr>' :
        filtered.map(p => {
          var finalPrice = p.price - (p.discount || 0);
          return '<tr>' +
          '<td>' + escapeHtml(p.name || '-') + '</td>' +
          '<td><span class="badge badge-info">' + escapeHtml(p.category || '-') + '</span></td>' +
          '<td>' + escapeHtml(p.branch_name || '-') + '</td>' +
          '<td>' + formatCurrency(p.price) + '</td>' +
          '<td>' + (p.discount > 0 ? '<span style="color:#f59e0b;">-' + formatCurrency(p.discount) + '</span>' : '<span style="color:#666;">-</span>') + '</td>' +
          '<td style="font-weight:600;color:#22c55e;">' + formatCurrency(finalPrice) + '</td>' +
          '<td class="' + (p.stock <= 0 ? 'text-danger' : '') + '">' + escapeHtml(String(p.stock ?? 0)) + '</td>' +
          '<td>' + (p.is_active !== false ? '<span class="badge badge-success">Active</span>' : '<span class="badge badge-secondary">Inactive</span>') + '</td>' +
          '<td class="actions-cell">' +
          '<button class="btn btn-sm btn-secondary edit-product-btn" data-id="' + p.id + '">Edit</button> ' +
          '<button class="btn btn-sm btn-' + (p.is_active !== false ? 'warning' : 'success') + ' toggle-product-btn" data-id="' + p.id + '">' +
          (p.is_active !== false ? 'Deactivate' : 'Activate') + '</button>' +
          '</td></tr>';
        }).join('')) +
      '</tbody></table>' +
      '</div></div></div></div>';

    attachEvents();
  }

  function attachEvents() {
    document.getElementById('logout-btn')?.addEventListener('click', e => { e.preventDefault(); Auth.logout(); });

    document.getElementById('branch-filter')?.addEventListener('change', e => { filterBranch = e.target.value; render(); });
    document.getElementById('category-filter')?.addEventListener('change', e => { filterCategory = e.target.value; render(); });

    document.getElementById('add-product-btn')?.addEventListener('click', () => openModal());

    document.querySelectorAll('.edit-product-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const product = products.find(p => String(p.id) === String(btn.dataset.id));
        if (product) openModal(product);
      });
    });

    document.querySelectorAll('.toggle-product-btn').forEach(btn => {
      btn.addEventListener('click', () => toggleProduct(btn.dataset.id));
    });
  }

  function openModal(product) {
    const isEdit = !!product;
    const title = isEdit ? 'Edit Product' : 'Add Product';

    const branchOptions = '<option value="">Select Branch</option>' +
      branches.map(b => '<option value="' + b.id + '"' +
        (isEdit && String(product.branch_id) === String(b.id) ? ' selected' : '') +
        '>' + escapeHtml(b.name || '') + '</option>').join('');

    const catOptions = '<option value="">Select Category</option>' +
      categories.map(c => '<option value="' + c + '"' +
        (isEdit && product.category === c ? ' selected' : '') +
        '>' + c + '</option>').join('');

    const html = '<form id="product-form" class="modal-form">' +
      '<div class="form-group">' +
      '<label>Branch</label>' +
      '<select name="branch_id" class="form-control" required>' + branchOptions + '</select>' +
      '</div>' +
      '<div class="form-group">' +
      '<label>Name</label>' +
      '<input type="text" name="name" class="form-control" value="' + (isEdit ? escapeHtml(product.name || '') : '') + '" required>' +
      '</div>' +
      '<div class="form-group">' +
      '<label>Category</label>' +
      '<select name="category" class="form-control" required>' + catOptions + '</select>' +
      '</div>' +
      '<div class="form-row">' +
      '<div class="form-group">' +
      '<label>Price</label>' +
      '<input type="number" name="price" class="form-control" value="' + (isEdit ? (product.price ?? '') : '') + '" min="0" step="0.01" required>' +
      '</div>' +
      '<div class="form-group">' +
      '<label>Discount</label>' +
      '<input type="number" name="discount" class="form-control" value="' + (isEdit ? (product.discount ?? 0) : '0') + '" min="0" step="0.01">' +
      '</div>' +
      '<div class="form-group">' +
      '<label>Stock</label>' +
      '<input type="number" name="stock" class="form-control" value="' + (isEdit ? (product.stock ?? 0) : '0') + '" min="0" required>' +
      '</div>' +
      '</div>' +
      '<div class="form-actions">' +
      '<button type="button" class="btn btn-secondary" id="modal-cancel-btn">Cancel</button>' +
      '<button type="submit" class="btn btn-primary">' + (isEdit ? 'Update' : 'Add') + ' Product</button>' +
      '</div></form>';

    Modal.show(title, html);

    document.getElementById('modal-cancel-btn')?.addEventListener('click', () => Modal.close());
    document.getElementById('product-form')?.addEventListener('submit', async e => {
      e.preventDefault();
      const form = e.target;
      const data = {
        branch_id: form.branch_id.value,
        name: form.name.value,
        category: form.category.value,
        price: parseFloat(form.price.value),
        discount: parseFloat(form.discount.value) || 0,
        stock: parseInt(form.stock.value) || 0
      };
      try {
        if (isEdit) {
          await apiPut('/products/' + product.id, data);
          Toast.success('Product updated');
        } else {
          await apiPost('/products', data);
          Toast.success('Product added');
        }
        Modal.close();
        loadData();
      } catch (err) {
        Toast.error(err.message || 'Failed to save product');
      }
    });
  }

  async function toggleProduct(id) {
    const product = products.find(p => String(p.id) === String(id));
    if (!product) return;
    const newActive = product.is_active === false ? true : false;
    if (!await confirmAsync(newActive ? 'Activate this product?' : 'Deactivate this product?')) return;
    try {
      await apiPut('/products/' + id, { is_active: newActive });
      Toast.success('Product ' + (newActive ? 'activated' : 'deactivated'));
      loadData();
    } catch (err) {
      Toast.error(err.message || 'Failed to update product');
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  loadData();
}

Router.register('admin-products', renderAdminProducts);
