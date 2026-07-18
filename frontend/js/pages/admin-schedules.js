function renderAdminSchedules() {
  const app = document.getElementById('app');
  let schedules = [];
  let users = [];
  let branches = [];
  let filterBranch = '';

  async function loadData() {
    try {
      schedules = await apiGet('/schedules');
      if (!Array.isArray(schedules)) schedules = [];
      render();
    } catch (e) {
      console.error('Failed to load schedules:', e);
      Toast.error('Failed to load schedules');
    }
  }

  async function loadModalData() {
    try {
      users = await apiGet('/users');
      if (!Array.isArray(users)) users = [];
      branches = await apiGet('/branches');
      if (!Array.isArray(branches)) branches = [];
    } catch (e) {
      console.error('Failed to load modal data:', e);
      Toast.error('Failed to load form data');
    }
  }

  function getFiltered() {
    if (!filterBranch) return schedules;
    return schedules.filter(s => String(s.branch_id) === String(filterBranch));
  }

  function render() {
    const filtered = getFiltered();
    app.innerHTML = '<div class="layout">' + renderSidebar() +
      '<div class="main-content">' + renderNavbar('Schedule Management') +
      '<div class="page-content" id="page-body">' +
      '<div class="page-header">' +
      '<div class="page-header-left">' +
      '<div class="filter-group">' +
      '<select id="branch-filter" class="form-control">' +
      '<option value="">All Branches</option>' +
      branches.map(b => '<option value="' + b.id + '"' + (String(b.id) === String(filterBranch) ? ' selected' : '') + '>' + (b.name || '') + '</option>').join('') +
      '</select>' +
      '</div>' +
      '</div>' +
      '<button class="btn btn-primary" id="add-schedule-btn">Add Schedule</button>' +
      '</div>' +
      '<div class="table-container">' +
      '<table class="data-table">' +
      '<thead><tr>' +
      '<th>Employee</th><th>Branch</th><th>Day</th><th>Start Time</th><th>End Time</th><th>Actions</th>' +
      '</tr></thead>' +
      '<tbody>' +
      (filtered.length === 0 ? '<tr><td colspan="6" class="no-data">No schedules found</td></tr>' :
        filtered.map(s => '<tr>' +
          '<td>' + escapeHtml(s.user_name || s.employee_name || '-') + '</td>' +
          '<td>' + escapeHtml(s.branch_name || '-') + '</td>' +
          '<td>' + escapeHtml(s.day_of_week || '-') + '</td>' +
          '<td>' + escapeHtml(s.start_time || '-') + '</td>' +
          '<td>' + escapeHtml(s.end_time || '-') + '</td>' +
          '<td class="actions-cell">' +
          '<button class="btn btn-sm btn-secondary edit-schedule-btn" data-id="' + s.id + '">Edit</button> ' +
          '<button class="btn btn-sm btn-danger delete-schedule-btn" data-id="' + s.id + '">Delete</button>' +
          '</td></tr>').join('')) +
      '</tbody></table>' +
      '</div></div></div></div>';

    attachEvents();
  }

  function attachEvents() {
    document.getElementById('logout-btn')?.addEventListener('click', e => { e.preventDefault(); Auth.logout(); });

    document.getElementById('branch-filter')?.addEventListener('change', e => {
      filterBranch = e.target.value;
      render();
    });

    document.getElementById('add-schedule-btn')?.addEventListener('click', () => openModal());

    document.querySelectorAll('.edit-schedule-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const schedule = schedules.find(s => String(s.id) === String(id));
        if (schedule) openModal(schedule);
      });
    });

    document.querySelectorAll('.delete-schedule-btn').forEach(btn => {
      btn.addEventListener('click', () => deleteSchedule(btn.dataset.id));
    });
  }

  async function openModal(schedule) {
    await loadModalData();
    const isEdit = !!schedule;
    const title = isEdit ? 'Edit Schedule' : 'Add Schedule';
    const dayOptions = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
      .map(d => '<option value="' + d + '"' + (isEdit && schedule.day_of_week === d ? ' selected' : '') + '>' + d + '</option>').join('');

    const html = '<form id="schedule-form" class="modal-form">' +
      '<div class="form-group">' +
      '<label>Employee</label>' +
      '<select name="user_id" class="form-control" required>' +
      '<option value="">Select Employee</option>' +
      users.map(u => '<option value="' + u.id + '"' + (isEdit && String(schedule.user_id) === String(u.id) ? ' selected' : '') + '>' + escapeHtml((u.first_name || '') + ' ' + (u.last_name || '')) + '</option>').join('') +
      '</select></div>' +
      '<div class="form-group">' +
      '<label>Branch</label>' +
      '<select name="branch_id" class="form-control" required>' +
      '<option value="">Select Branch</option>' +
      branches.map(b => '<option value="' + b.id + '"' + (isEdit && String(schedule.branch_id) === String(b.id) ? ' selected' : '') + '>' + escapeHtml(b.name || '') + '</option>').join('') +
      '</select></div>' +
      '<div class="form-group">' +
      '<label>Day of Week</label>' +
      '<select name="day_of_week" class="form-control" required>' +
      '<option value="">Select Day</option>' + dayOptions +
      '</select></div>' +
      '<div class="form-group">' +
      '<label>Start Time</label>' +
      '<input type="time" name="start_time" class="form-control" value="' + (isEdit ? escapeHtml(schedule.start_time || '') : '') + '" required>' +
      '</div>' +
      '<div class="form-group">' +
      '<label>End Time</label>' +
      '<input type="time" name="end_time" class="form-control" value="' + (isEdit ? escapeHtml(schedule.end_time || '') : '') + '" required>' +
      '</div>' +
      '<div class="form-actions">' +
      '<button type="button" class="btn btn-secondary" id="modal-cancel-btn">Cancel</button>' +
      '<button type="submit" class="btn btn-primary">' + (isEdit ? 'Update' : 'Add') + ' Schedule</button>' +
      '</div></form>';

    Modal.show(title, html);

    document.getElementById('modal-cancel-btn')?.addEventListener('click', () => Modal.close());
    document.getElementById('schedule-form')?.addEventListener('submit', async e => {
      e.preventDefault();
      const form = e.target;
      const data = {
        user_id: form.user_id.value,
        branch_id: form.branch_id.value,
        day_of_week: form.day_of_week.value,
        start_time: form.start_time.value,
        end_time: form.end_time.value
      };
      try {
        if (isEdit) {
          await apiPut('/schedules/' + schedule.id, data);
          Toast.success('Schedule updated');
        } else {
          await apiPost('/schedules', data);
          Toast.success('Schedule added');
        }
        Modal.close();
        loadData();
      } catch (err) {
        Toast.error(err.message || 'Failed to save schedule');
      }
    });
  }

  async function deleteSchedule(id) {
    if (!confirm('Are you sure you want to delete this schedule?')) return;
    try {
      await apiDelete('/schedules/' + id);
      Toast.success('Schedule deleted');
      loadData();
    } catch (err) {
      Toast.error(err.message || 'Failed to delete schedule');
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  loadData();
}

Router.register('schedules', renderAdminSchedules);
