function renderAdminInventory() {
  const app = document.getElementById('app');
  let items = [];
  let categories = [];
  let branches = [];
  let logs = [];
  let filterBranch = '';
  let filterCategory = '';
  let showLogs = false;

  async function loadData() {
    try {
      items = await apiGet('/inventory');
      if (!Array.isArray(items)) items = [];
      branches = await apiGet('/branches');
      if (!Array.isArray(branches)) branches = [];
      render();
    } catch (e) {
      console.error('Failed to load inventory:', e);
      Toast.error('Failed to load inventory');
    }
  }

  async function loadCategories() {
    try {
      categories = await apiGet('/inventory/categories');
      if (!Array.isArray(categories)) categories = [];
    } catch (e) {
      console.error('Failed to load categories:', e);
    }
  }

  async function loadLogs() {
    try {
      logs = await apiGet('/inventory/logs?limit=50');
      if (!Array.isArray(logs)) logs = [];
    } catch (e) {
      console.error('Failed to load logs:', e);
    }
  }

  function getFiltered() {
    return items.filter(item => {
      if (filterBranch && String(item.branch_id) !== String(filterBranch)) return false;
      if (filterCategory && String(item.category_id) !== String(filterCategory)) return false;
      return true;
    });
  }

  function getStatus(item) {
    if (item.quantity <= 0) return '<span class="badge badge-danger">Out of Stock</span>';
    if (item.reorder_level && item.quantity <= item.reorder_level) return '<span class="badge badge-warning">Low Stock</span>';
    return '<span class="badge badge-success">In Stock</span>';
  }

  function render() {
    const filtered = getFiltered();
    const lowStock = items.filter(i => i.reorder_level && i.quantity <= i.reorder_level && i.quantity > 0);

    app.innerHTML = '<div class="layout">' + renderSidebar() +
      '<div class="main-content">' + renderNavbar('Inventory Management') +
      '<div class="page-content" id="page-body">' +

      (lowStock.length > 0 ? '<div class="alert alert-warning">' +
        '<strong>Low Stock Alert:</strong> ' + lowStock.length + ' item(s) below reorder level.' +
        '</div>' : '') +

      '<div class="section-header">' +
      '<h3>Inventory Items</h3>' +
      '<button class="btn btn-secondary" id="toggle-logs-btn">' + (showLogs ? 'Hide Logs' : 'View Logs') + '</button>' +
      '</div>' +

      (showLogs ? '<div class="card" id="logs-section">' +
        '<h4>Recent Stock Movements</h4>' +
        '<div class="table-container">' +
        '<table class="data-table">' +
        '<thead><tr><th>Date</th><th>Item</th><th>Type</th><th>Qty</th><th>Notes</th><th>By</th></tr></thead>' +
        '<tbody>' +
        (logs.length === 0 ? '<tr><td colspan="6" class="no-data">No logs</td></tr>' :
          logs.map(l => '<tr>' +
            '<td>' + escapeHtml(l.created_at || l.date || '-') + '</td>' +
            '<td>' + escapeHtml(l.item_name || l.inventory_item_name || '-') + '</td>' +
            '<td><span class="badge ' + (l.type === 'in' || l.movement_type === 'in' ? 'badge-success' : 'badge-danger') + '">' +
              escapeHtml(l.type || l.movement_type || '-') + '</span></td>' +
            '<td>' + escapeHtml(l.quantity || '-') + '</td>' +
            '<td>' + escapeHtml(l.notes || '-') + '</td>' +
            '<td>' + escapeHtml(l.user_name || '-') + '</td>' +
            '</tr>').join('')) +
        '</tbody></table></div></div>' : '') +

      '<div class="page-header">' +
      '<div class="page-header-left">' +
      '<div class="filter-group">' +
      '<select id="branch-filter" class="form-control">' +
      '<option value="">All Branches</option>' +
      branches.map(b => '<option value="' + b.id + '"' + (String(b.id) === String(filterBranch) ? ' selected' : '') + '>' + escapeHtml(b.name || '') + '</option>').join('') +
      '</select>' +
      '<select id="category-filter" class="form-control">' +
      '<option value="">All Categories</option>' +
      categories.map(c => '<option value="' + c.id + '"' + (String(c.id) === String(filterCategory) ? ' selected' : '') + '>' + escapeHtml(c.name || '') + '</option>').join('') +
      '</select>' +
      '</div></div>' +
      '<button class="btn btn-primary" id="add-item-btn">Add Item</button>' +
      '</div>' +
      '<div class="table-container">' +
      '<table class="data-table">' +
      '<thead><tr>' +
      '<th>Name</th><th>Category</th><th>Branch</th><th>Quantity</th><th>Unit</th><th>Reorder Level</th><th>Cost</th><th>Status</th><th>Actions</th>' +
      '</tr></thead>' +
      '<tbody>' +
      (filtered.length === 0 ? '<tr><td colspan="9" class="no-data">No items found</td></tr>' :
        filtered.map(item => '<tr class="' + (item.reorder_level && item.quantity <= item.reorder_level ? 'low-stock-row' : '') + '">' +
          '<td>' + escapeHtml(item.name || '-') + '</td>' +
          '<td>' + escapeHtml(item.category_name || '-') + '</td>' +
          '<td>' + escapeHtml(item.branch_name || '-') + '</td>' +
          '<td class="' + (item.reorder_level && item.quantity <= item.reorder_level ? 'text-danger font-bold' : '') + '">' + escapeHtml(String(item.quantity ?? '-')) + '</td>' +
          '<td>' + escapeHtml(item.unit || '-') + '</td>' +
          '<td>' + escapeHtml(String(item.reorder_level ?? '-')) + '</td>' +
          '<td>' + (item.cost_price != null ? formatCurrency(item.cost_price) : '-') + '</td>' +
          '<td>' + getStatus(item) + '</td>' +
          '<td class="actions-cell">' +
          '<button class="btn btn-sm btn-success stock-in-btn" data-id="' + item.id + '">In</button> ' +
          '<button class="btn btn-sm btn-warning stock-out-btn" data-id="' + item.id + '">Out</button> ' +
          '<button class="btn btn-sm btn-secondary edit-item-btn" data-id="' + item.id + '">Edit</button> ' +
          '<button class="btn btn-sm btn-danger delete-item-btn" data-id="' + item.id + '">Delete</button>' +
          '</td></tr>').join('')) +
      '</tbody></table>' +
      '</div></div></div></div>';

    attachEvents();
  }

  function attachEvents() {
    document.getElementById('logout-btn')?.addEventListener('click', e => { e.preventDefault(); Auth.logout(); });

    document.getElementById('branch-filter')?.addEventListener('change', e => { filterBranch = e.target.value; render(); });
    document.getElementById('category-filter')?.addEventListener('change', e => { filterCategory = e.target.value; render(); });

    document.getElementById('add-item-btn')?.addEventListener('click', () => openItemModal());
    document.getElementById('toggle-logs-btn')?.addEventListener('click', async () => {
      showLogs = !showLogs;
      if (showLogs) await loadLogs();
      render();
    });

    document.querySelectorAll('.edit-item-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const item = items.find(i => String(i.id) === String(btn.dataset.id));
        if (item) openItemModal(item);
      });
    });

    document.querySelectorAll('.delete-item-btn').forEach(btn => {
      btn.addEventListener('click', () => deleteItem(btn.dataset.id));
    });

    document.querySelectorAll('.stock-in-btn').forEach(btn => {
      btn.addEventListener('click', () => openStockModal(btn.dataset.id, 'in'));
    });

    document.querySelectorAll('.stock-out-btn').forEach(btn => {
      btn.addEventListener('click', () => openStockModal(btn.dataset.id, 'out'));
    });
  }

  async function openItemModal(item) {
    await loadCategories();
    const isEdit = !!item;
    const title = isEdit ? 'Edit Item' : 'Add Item';

    const catOptions = '<option value="">Select Category</option>' +
      categories.map(c => '<option value="' + c.id + '"' +
        (isEdit && String(item.category_id) === String(c.id) ? ' selected' : '') +
        '>' + escapeHtml(c.name || '') + '</option>').join('');

    const branchOptions = '<option value="">Select Branch</option>' +
      branches.map(b => '<option value="' + b.id + '"' +
        (isEdit && String(item.branch_id) === String(b.id) ? ' selected' : '') +
        '>' + escapeHtml(b.name || '') + '</option>').join('');

    const html = '<form id="item-form" class="modal-form">' +
      '<div class="form-group">' +
      '<label>Category</label>' +
      '<select name="category_id" class="form-control" required>' + catOptions + '</select>' +
      '</div>' +
      '<div class="form-group">' +
      '<label>Branch</label>' +
      '<select name="branch_id" class="form-control" required>' + branchOptions + '</select>' +
      '</div>' +
      '<div class="form-group">' +
      '<label>Name</label>' +
      '<input type="text" name="name" class="form-control" value="' + (isEdit ? escapeHtml(item.name || '') : '') + '" required>' +
      '</div>' +
      '<div class="form-group">' +
      '<label>Description</label>' +
      '<input type="text" name="description" class="form-control" value="' + (isEdit ? escapeHtml(item.description || '') : '') + '">' +
      '</div>' +
      '<div class="form-row">' +
      '<div class="form-group">' +
      '<label>Quantity</label>' +
      '<input type="number" name="quantity" class="form-control" value="' + (isEdit ? (item.quantity ?? 0) : '0') + '" min="0" required>' +
      '</div>' +
      '<div class="form-group">' +
      '<label>Unit</label>' +
      '<input type="text" name="unit" class="form-control" value="' + (isEdit ? escapeHtml(item.unit || '') : '') + '" placeholder="pcs, kg, etc.">' +
      '</div>' +
      '</div>' +
      '<div class="form-row">' +
      '<div class="form-group">' +
      '<label>Reorder Level</label>' +
      '<input type="number" name="reorder_level" class="form-control" value="' + (isEdit ? (item.reorder_level ?? '') : '') + '" min="0">' +
      '</div>' +
      '<div class="form-group">' +
      '<label>Cost Price</label>' +
      '<input type="number" name="cost_price" class="form-control" value="' + (isEdit ? (item.cost_price ?? '') : '') + '" min="0" step="0.01">' +
      '</div>' +
      '</div>' +
      '<div class="form-actions">' +
      '<button type="button" class="btn btn-secondary" id="modal-cancel-btn">Cancel</button>' +
      '<button type="submit" class="btn btn-primary">' + (isEdit ? 'Update' : 'Add') + ' Item</button>' +
      '</div></form>';

    Modal.show(title, html);

    document.getElementById('modal-cancel-btn')?.addEventListener('click', () => Modal.close());
    document.getElementById('item-form')?.addEventListener('submit', async e => {
      e.preventDefault();
      const form = e.target;
      const data = {
        category_id: form.category_id.value,
        branch_id: form.branch_id.value,
        name: form.name.value,
        description: form.description.value,
        quantity: parseFloat(form.quantity.value) || 0,
        unit: form.unit.value,
        reorder_level: parseFloat(form.reorder_level.value) || null,
        cost_price: parseFloat(form.cost_price.value) || null
      };
      try {
        if (isEdit) {
          await apiPut('/inventory/' + item.id, data);
          Toast.success('Item updated');
        } else {
          await apiPost('/inventory', data);
          Toast.success('Item added');
        }
        Modal.close();
        loadData();
      } catch (err) {
        Toast.error(err.message || 'Failed to save item');
      }
    });
  }

  function openStockModal(itemId, type) {
    const item = items.find(i => String(i.id) === String(itemId));
    if (!item) return;

    const title = type === 'in' ? 'Stock In - ' + item.name : 'Stock Out - ' + item.name;
    const html = '<form id="stock-form" class="modal-form">' +
      '<div class="form-group">' +
      '<label>Current Quantity: ' + escapeHtml(String(item.quantity)) + '</label>' +
      '</div>' +
      '<div class="form-group">' +
      '<label>Quantity</label>' +
      '<input type="number" name="quantity" class="form-control" min="1" required placeholder="Enter quantity">' +
      '</div>' +
      '<div class="form-group">' +
      '<label>Notes</label>' +
      '<input type="text" name="notes" class="form-control" placeholder="Optional notes">' +
      '</div>' +
      '<div class="form-actions">' +
      '<button type="button" class="btn btn-secondary" id="modal-cancel-btn">Cancel</button>' +
      '<button type="submit" class="btn ' + (type === 'in' ? 'btn-success' : 'btn-warning') + '">' +
      (type === 'in' ? 'Stock In' : 'Stock Out') + '</button>' +
      '</div></form>';

    Modal.show(title, html);

    document.getElementById('modal-cancel-btn')?.addEventListener('click', () => Modal.close());
    document.getElementById('stock-form')?.addEventListener('submit', async e => {
      e.preventDefault();
      const form = e.target;
      const data = {
        quantity: parseFloat(form.quantity.value),
        notes: form.notes.value
      };
      try {
        const endpoint = type === 'in' ? '/api/inventory/' + itemId + '/stock-in' : '/api/inventory/' + itemId + '/stock-out';
        await apiPost(endpoint, data);
        Toast.success('Stock ' + type + ' recorded');
        Modal.close();
        loadData();
      } catch (err) {
        Toast.error(err.message || 'Failed to record stock movement');
      }
    });
  }

  async function deleteItem(id) {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      await apiDelete('/inventory/' + id);
      Toast.success('Item deleted');
      loadData();
    } catch (err) {
      Toast.error(err.message || 'Failed to delete item');
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  loadData();
}

Router.register('inventory', renderAdminInventory);
