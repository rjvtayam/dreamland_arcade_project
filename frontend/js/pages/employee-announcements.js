function renderEmployeeAnnouncements() {
  const app = document.getElementById('app');
  const user = Auth.getUser();

  app.innerHTML = '<div class="layout">' + renderSidebar() +
    '<div class="main-content">' + renderNavbar('Announcements') +
    '<div class="page-content" id="page-body">' +
      '<div style="text-align:center;padding:60px;color:#888;"><div class="spinner"></div></div>' +
    '</div></div></div>';

  document.getElementById('logout-btn')?.addEventListener('click', (e) => { e.preventDefault(); Auth.logout(); });
  loadAnnouncements();
}

async function loadAnnouncements() {
  const container = document.getElementById('page-body');
  try {
    var announcements = await apiGet('/announcements/my');

    container.innerHTML =
      '<div class="page-header"><h1 class="page-title">Announcements</h1></div>';

    if (!announcements || announcements.length === 0) {
      container.innerHTML += '<div class="empty-state"><div class="empty-state-icon">📢</div><p>No announcements yet.</p></div>';
      return;
    }

    var html = '<div style="display:flex;flex-direction:column;gap:16px;">';
    announcements.forEach(function(a) {
      var priorityColor = a.priority === 'urgent' ? 'var(--neon-red)' : a.priority === 'important' ? 'var(--neon-yellow)' : 'var(--neon-cyan)';
      var priorityBadge = a.priority === 'urgent' ? 'badge-red' : a.priority === 'important' ? 'badge-yellow' : 'badge-cyan';
      html +=
        '<div class="card" style="border-left:3px solid ' + priorityColor + ';">' +
          '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;">' +
            '<div>' +
              '<h3 style="margin:0 0 4px 0;font-size:1.1rem;color:var(--text-bright);">' + a.title + '</h3>' +
              '<div style="display:flex;gap:12px;font-size:0.8rem;color:var(--text-secondary);">' +
                '<span>' + (a.branch_name || 'All Branches') + '</span>' +
                '<span>' + formatDate(a.created_at) + '</span>' +
                '<span>By ' + (a.creator_name || 'Unknown') + '</span>' +
              '</div>' +
            '</div>' +
            '<span class="badge ' + priorityBadge + '">' + a.priority + '</span>' +
          '</div>' +
          '<div style="color:var(--text-primary);line-height:1.6;white-space:pre-wrap;">' + a.content + '</div>' +
        '</div>';
    });
    html += '</div>';
    container.innerHTML += html;

  } catch (err) {
    container.innerHTML = '<div class="empty-state"><p>Failed to load announcements: ' + (err.message || 'Unknown error') + '</p></div>';
  }
}

Router.register('my-announcements', renderEmployeeAnnouncements);
