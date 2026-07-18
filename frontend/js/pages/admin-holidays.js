function renderAdminHolidays() {
  const app = document.getElementById('app');
  let holidays = [];
  let branches = [];

  async function loadData() {
    try {
      holidays = await apiGet('/holidays');
      if (!Array.isArray(holidays)) holidays = [];
      branches = await apiGet('/branches');
      if (!Array.isArray(branches)) branches = [];
      render();
    } catch (e) {
      console.error('Failed to load holidays:', e);
      Toast.error('Failed to load holidays');
    }
  }

  function render() {
    app.innerHTML = '<div class="layout">' + renderSidebar() +
      '<div class="main-content">' + renderNavbar('Holiday Management') +
      '<div class="page-content" id="page-body">' +
      '<div class="page-header">' +
      '<div class="page-header-left"></div>' +
      '<button class="btn btn-primary" id="add-holiday-btn">Add Holiday</button>' +
      '</div>' +
      '<div class="table-container">' +
      '<table class="data-table">' +
      '<thead><tr>' +
      '<th>Name</th><th>Date</th><th>Branch</th><th>Recurring</th><th>Actions</th>' +
      '</tr></thead>' +
      '<tbody>' +
      (holidays.length === 0 ? '<tr><td colspan="5" class="no-data">No holidays found</td></tr>' :
        holidays.map(h => '<tr>' +
          '<td>' + escapeHtml(h.name || '-') + '</td>' +
          '<td>' + escapeHtml(h.date || '-') + '</td>' +
          '<td>' + escapeHtml(h.branch_name || 'All Branches') + '</td>' +
          '<td>' + (h.is_recurring ? '<span class="badge badge-success">Yes</span>' : '<span class="badge badge-secondary">No</span>') + '</td>' +
          '<td class="actions-cell">' +
          '<button class="btn btn-sm btn-secondary edit-holiday-btn" data-id="' + h.id + '">Edit</button> ' +
          '<button class="btn btn-sm btn-danger delete-holiday-btn" data-id="' + h.id + '">Delete</button>' +
          '</td></tr>').join('')) +
      '</tbody></table>' +
      '</div></div></div></div>';

    attachEvents();
  }

  function attachEvents() {
    document.getElementById('logout-btn')?.addEventListener('click', e => { e.preventDefault(); Auth.logout(); });

    document.getElementById('add-holiday-btn')?.addEventListener('click', () => openModal());

    document.querySelectorAll('.edit-holiday-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const holiday = holidays.find(h => String(h.id) === String(btn.dataset.id));
        if (holiday) openModal(holiday);
      });
    });

    document.querySelectorAll('.delete-holiday-btn').forEach(btn => {
      btn.addEventListener('click', () => deleteHoliday(btn.dataset.id));
    });
  }

  function openModal(holiday) {
    const isEdit = !!holiday;
    const title = isEdit ? 'Edit Holiday' : 'Add Holiday';

    const branchOptions = '<option value="">All Branches</option>' +
      branches.map(b => '<option value="' + b.id + '"' +
        (isEdit && String(holiday.branch_id) === String(b.id) ? ' selected' : '') +
        '>' + escapeHtml(b.name || '') + '</option>').join('');

    const html = '<form id="holiday-form" class="modal-form">' +
      '<div class="form-group">' +
      '<label>Name</label>' +
      '<input type="text" name="name" class="form-control" value="' + (isEdit ? escapeHtml(holiday.name || '') : '') + '" required placeholder="Holiday name">' +
      '</div>' +
      '<div class="form-group">' +
      '<label>Date</label>' +
      '<input type="date" name="date" class="form-control" value="' + (isEdit ? escapeHtml(holiday.date || '') : '') + '" required>' +
      '</div>' +
      '<div class="form-group">' +
      '<label>Branch (optional)</label>' +
      '<select name="branch_id" class="form-control">' + branchOptions + '</select>' +
      '</div>' +
      '<div class="form-group">' +
      '<label class="checkbox-label">' +
      '<input type="checkbox" name="is_recurring" value="1"' + (isEdit && holiday.is_recurring ? ' checked' : '') + '> ' +
      'Recurring (every year)</label>' +
      '</div>' +
      '<div class="form-actions">' +
      '<button type="button" class="btn btn-secondary" id="modal-cancel-btn">Cancel</button>' +
      '<button type="submit" class="btn btn-primary">' + (isEdit ? 'Update' : 'Add') + ' Holiday</button>' +
      '</div></form>';

    Modal.show(title, html);

    document.getElementById('modal-cancel-btn')?.addEventListener('click', () => Modal.close());
    document.getElementById('holiday-form')?.addEventListener('submit', async e => {
      e.preventDefault();
      const form = e.target;
      const data = {
        name: form.name.value,
        date: form.date.value,
        branch_id: form.branch_id.value || null,
        is_recurring: form.is_recurring.checked
      };
      try {
        if (isEdit) {
          await apiPut('/holidays/' + holiday.id, data);
          Toast.success('Holiday updated');
        } else {
          await apiPost('/holidays', data);
          Toast.success('Holiday added');
        }
        Modal.close();
        loadData();
      } catch (err) {
        Toast.error(err.message || 'Failed to save holiday');
      }
    });
  }

  async function deleteHoliday(id) {
    if (!confirm('Are you sure you want to delete this holiday?')) return;
    try {
      await apiDelete('/holidays/' + id);
      Toast.success('Holiday deleted');
      loadData();
    } catch (err) {
      Toast.error(err.message || 'Failed to delete holiday');
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  loadData();
}

Router.register('holidays', renderAdminHolidays);
