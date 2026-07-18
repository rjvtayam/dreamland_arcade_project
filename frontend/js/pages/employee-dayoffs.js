function renderEmployeeDayoffs() {
  const app = document.getElementById('app');
  const user = Auth.getUser();

  app.innerHTML = '<div class="layout">' + renderSidebar() +
    '<div class="main-content">' + renderNavbar('My Day-Offs') +
    '<div class="page-content" id="page-body">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">' +
        '<h2 style="color:#e2e8f0;margin:0;font-size:1.2rem;">Day-Off Requests</h2>' +
        '<button id="request-dayoff-btn" style="background:#6366f1;color:#fff;border:none;border-radius:8px;padding:8px 20px;cursor:pointer;font-size:0.9rem;font-weight:600;">+ Request Day Off</button>' +
      '</div>' +
      '<div id="dayoffs-table-container" style="background:#1a1f2e;border:1px solid #2a3040;border-radius:12px;overflow:hidden;">' +
        '<div style="padding:40px;text-align:center;color:#666;">Loading...</div>' +
      '</div>' +
    '</div></div></div>';

  document.getElementById('logout-btn')?.addEventListener('click', (e) => {
    e.preventDefault();
    Auth.logout();
  });

  document.getElementById('request-dayoff-btn').addEventListener('click', function() {
    showRequestDayoffModal(user);
  });

  loadDayoffRecords();
}

async function loadDayoffRecords() {
  var container = document.getElementById('dayoffs-table-container');

  try {
    var records = await apiGet('/dayoffs/my');
    if (!Array.isArray(records)) records = [];

    if (records.length === 0) {
      container.innerHTML =
        '<div style="padding:40px;text-align:center;color:#666;">' +
          '<div style="font-size:2rem;margin-bottom:12px;">&#128197;</div>No day-off requests found.' +
        '</div>';
      return;
    }

    var statusBadge = function(status) {
      var map = {
        pending: { bg: '#713f12', color: '#facc15' },
        approved: { bg: '#166534', color: '#4ade80' },
        rejected: { bg: '#7f1d1d', color: '#f87171' }
      };
      var s = map[status] || { bg: '#1e293b', color: '#888' };
      return '<span style="background:' + s.bg + ';color:' + s.color + ';padding:3px 10px;border-radius:20px;font-size:0.78rem;font-weight:600;text-transform:capitalize;">' + (status || 'N/A') + '</span>';
    };

    var columns = [
      { key: 'date', label: 'Date', render: function(v) { return v || ''; } },
      { key: 'reason', label: 'Reason', render: function(v) { return '<span style="max-width:300px;display:inline-block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="' + (v || '') + '">' + (v || '-') + '</span>'; } },
      { key: 'status', label: 'Status', render: function(v) { return statusBadge(v); } },
      { key: 'reviewed_by', label: 'Reviewed By', render: function(v) { return v || '<span style="color:#555;">-</span>'; } },
      { key: 'created_at', label: 'Date Submitted', render: function(v) { return v ? formatDate(v) : ''; } }
    ];

    renderTable('dayoffs-table-container', columns, records);

  } catch (err) {
    container.innerHTML = '<div style="padding:40px;text-align:center;color:#f87171;">Failed to load day-off requests: ' + (err.message || 'Unknown error') + '</div>';
  }
}

function showRequestDayoffModal(user) {
  var today = new Date().toISOString().slice(0, 10);

  var html =
    '<div style="padding:8px 0;">' +
      '<div style="margin-bottom:16px;">' +
        '<label style="display:block;color:#aaa;font-size:0.85rem;margin-bottom:6px;">Date *</label>' +
        '<input type="date" id="dayoff-date" min="' + today + '" value="" style="width:100%;background:#0d1117;border:1px solid #30363d;border-radius:6px;padding:8px 12px;color:#e2e8f0;font-size:0.9rem;box-sizing:border-box;">' +
      '</div>' +
      '<div style="margin-bottom:16px;">' +
        '<label style="display:block;color:#aaa;font-size:0.85rem;margin-bottom:6px;">Reason *</label>' +
        '<textarea id="dayoff-reason" rows="3" placeholder="Enter reason for day off..." style="width:100%;background:#0d1117;border:1px solid #30363d;border-radius:6px;padding:8px 12px;color:#e2e8f0;font-size:0.9rem;resize:vertical;box-sizing:border-box;font-family:inherit;"></textarea>' +
      '</div>' +
      '<div id="dayoff-error" style="color:#f87171;font-size:0.85rem;min-height:18px;margin-bottom:8px;"></div>' +
      '<button id="dayoff-submit-btn" style="width:100%;padding:10px;border:none;border-radius:8px;background:#6366f1;color:#fff;font-size:0.95rem;font-weight:600;cursor:pointer;">Submit Request</button>' +
    '</div>';

  Modal.show('Request Day Off', html);

  setTimeout(function() {
    var submitBtn = document.getElementById('dayoff-submit-btn');
    var errEl = document.getElementById('dayoff-error');
    var submitted = false;

    submitBtn.addEventListener('click', async function() {
      if (submitted) return;

      var date = document.getElementById('dayoff-date').value;
      var reason = document.getElementById('dayoff-reason').value.trim();

      if (!date) {
        errEl.textContent = 'Please select a date';
        return;
      }
      if (!reason) {
        errEl.textContent = 'Please enter a reason';
        return;
      }

      submitted = true;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting...';
      errEl.textContent = '';

      try {
        await apiPost('/dayoffs', {
          date: date,
          reason: reason,
          branch_id: user.branch_id
        });
        Toast.success('Day-off request submitted!');
        Modal.close();
        loadDayoffRecords();
      } catch (err) {
        errEl.textContent = err.message || 'Failed to submit request';
        submitted = false;
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Request';
      }
    });
  }, 100);
}

Router.register('my-dayoffs', renderEmployeeDayoffs);
