function renderAdminDayoffs() {
  const app = document.getElementById('app');
  let dayoffs = [];
  let branches = [];
  let filterStatus = '';
  let filterBranch = '';

  async function loadData() {
    try {
      dayoffs = await apiGet('/dayoffs');
      if (!Array.isArray(dayoffs)) dayoffs = [];
      branches = await apiGet('/branches');
      if (!Array.isArray(branches)) branches = [];
      render();
    } catch (e) {
      console.error('Failed to load day-offs:', e);
      Toast.error('Failed to load day-off requests');
    }
  }

  function getFiltered() {
    return dayoffs.filter(d => {
      if (filterStatus && d.status !== filterStatus) return false;
      if (filterBranch && String(d.branch_id) !== String(filterBranch)) return false;
      return true;
    });
  }

  function statusBadge(status) {
    const colors = { pending: 'badge-warning', approved: 'badge-success', rejected: 'badge-danger' };
    return '<span class="badge ' + (colors[status] || 'badge-secondary') + '">' + (status || 'unknown') + '</span>';
  }

  function render() {
    const filtered = getFiltered();
    app.innerHTML = '<div class="layout">' + renderSidebar() +
      '<div class="main-content">' + renderNavbar('Day-Off Requests') +
      '<div class="page-content" id="page-body">' +
      '<div class="page-header">' +
      '<div class="page-header-left">' +
      '<div class="filter-group">' +
      '<select id="status-filter" class="form-control">' +
      '<option value="">All Status</option>' +
      '<option value="pending"' + (filterStatus === 'pending' ? ' selected' : '') + '>Pending</option>' +
      '<option value="approved"' + (filterStatus === 'approved' ? ' selected' : '') + '>Approved</option>' +
      '<option value="rejected"' + (filterStatus === 'rejected' ? ' selected' : '') + '>Rejected</option>' +
      '</select>' +
      '<select id="branch-filter" class="form-control">' +
      '<option value="">All Branches</option>' +
      branches.map(b => '<option value="' + b.id + '"' + (String(b.id) === String(filterBranch) ? ' selected' : '') + '>' + escapeHtml(b.name || '') + '</option>').join('') +
      '</select>' +
      '</div>' +
      '</div></div>' +
      '<div class="table-container">' +
      '<table class="data-table">' +
      '<thead><tr>' +
      '<th>Employee</th><th>Branch</th><th>Date</th><th>Reason</th><th>Status</th><th>Reviewed By</th><th>Actions</th>' +
      '</tr></thead>' +
      '<tbody>' +
      (filtered.length === 0 ? '<tr><td colspan="7" class="no-data">No day-off requests found</td></tr>' :
        filtered.map(d => '<tr>' +
          '<td>' + escapeHtml(d.user_name || d.employee_name || '-') + '</td>' +
          '<td>' + escapeHtml(d.branch_name || '-') + '</td>' +
          '<td>' + escapeHtml(d.date || d.day_off_date || '-') + '</td>' +
          '<td>' + escapeHtml(d.reason || '-') + '</td>' +
          '<td>' + statusBadge(d.status) + '</td>' +
          '<td>' + escapeHtml(d.reviewed_by_name || '-') + '</td>' +
          '<td class="actions-cell">' +
          (d.status === 'pending'
            ? '<button class="btn btn-sm btn-success approve-dayoff-btn" data-id="' + d.id + '">Approve</button> ' +
              '<button class="btn btn-sm btn-danger reject-dayoff-btn" data-id="' + d.id + '">Reject</button>'
            : '<span class="text-muted">No actions</span>') +
          '</td></tr>').join('')) +
      '</tbody></table>' +
      '</div></div></div></div>';

    attachEvents();
  }

  function attachEvents() {
    document.getElementById('logout-btn')?.addEventListener('click', e => { e.preventDefault(); Auth.logout(); });

    document.getElementById('status-filter')?.addEventListener('change', e => {
      filterStatus = e.target.value;
      render();
    });

    document.getElementById('branch-filter')?.addEventListener('change', e => {
      filterBranch = e.target.value;
      render();
    });

    document.querySelectorAll('.approve-dayoff-btn').forEach(btn => {
      btn.addEventListener('click', () => updateStatus(btn.dataset.id, 'approved'));
    });

    document.querySelectorAll('.reject-dayoff-btn').forEach(btn => {
      btn.addEventListener('click', () => updateStatus(btn.dataset.id, 'rejected'));
    });
  }

  async function updateStatus(id, status) {
    if (!confirm('Are you sure you want to ' + status + ' this request?')) return;
    try {
      await apiPut('/dayoffs/' + id + '/status', { status: status });
      Toast.success('Request ' + status);
      loadData();
    } catch (err) {
      Toast.error(err.message || 'Failed to update request');
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  loadData();
}

Router.register('dayoffs', renderAdminDayoffs);
