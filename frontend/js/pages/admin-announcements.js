function renderAdminAnnouncements() {
  const app = document.getElementById('app');
  app.innerHTML = '<div class="layout">' + renderSidebar() +
    '<div class="main-content">' + renderNavbar('Announcements Management') +
    '<div class="page-content" id="page-body">' +
      '<div style="text-align:center;padding:60px;color:#888;"><div class="spinner"></div></div>' +
    '</div></div></div>';
  document.getElementById('logout-btn')?.addEventListener('click', (e) => { e.preventDefault(); Auth.logout(); });
  loadAnnouncements();
}

async function loadAnnouncements() {
  const container = document.getElementById('page-body');
  try {
    var branches = await apiGet('/branches');
    var announcements = await apiGet('/announcements');

    container.innerHTML =
      '<div class="page-header">' +
        '<h1 class="page-title">Announcements Management</h1>' +
        '<button class="btn btn-primary" onclick="showCreateAnnouncementModal()">+ New Announcement</button>' +
      '</div>' +
      '<div id="announcements-list" style="display:flex;flex-direction:column;gap:16px;"></div>';

    var listContainer = document.getElementById('announcements-list');

    if (!announcements || announcements.length === 0) {
      listContainer.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📢</div><p>No announcements yet.</p></div>';
      return;
    }

    announcements.forEach(function(a) {
      var priorityColor = a.priority === 'urgent' ? 'var(--neon-red)' : a.priority === 'important' ? 'var(--neon-yellow)' : 'var(--neon-cyan)';
      var priorityBadge = a.priority === 'urgent' ? 'badge-red' : a.priority === 'important' ? 'badge-yellow' : 'badge-cyan';
      var card = document.createElement('div');
      card.className = 'card';
      card.style.borderLeft = '3px solid ' + priorityColor;
      card.innerHTML =
        '<div style="display:flex;justify-content:space-between;align-items:flex-start;">' +
          '<div style="flex:1;">' +
            '<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">' +
              '<h3 style="margin:0;font-size:1.1rem;color:var(--text-bright);">' + a.title + '</h3>' +
              '<span class="badge ' + priorityBadge + '">' + a.priority + '</span>' +
              (!a.is_active ? '<span class="badge badge-red">Inactive</span>' : '') +
            '</div>' +
            '<div style="display:flex;gap:12px;font-size:0.8rem;color:var(--text-secondary);margin-bottom:12px;">' +
              '<span>' + (a.branch_name || 'All Branches') + '</span>' +
              '<span>' + formatDate(a.created_at) + '</span>' +
              '<span>By ' + (a.creator_name || 'Unknown') + '</span>' +
            '</div>' +
            '<div style="color:var(--text-primary);line-height:1.6;white-space:pre-wrap;">' + a.content + '</div>' +
          '</div>' +
          '<div style="display:flex;gap:6px;margin-left:16px;">' +
            '<button class="btn btn-sm btn-secondary" onclick="editAnnouncement(' + a.id + ')">Edit</button>' +
            '<button class="btn btn-sm btn-danger" onclick="deleteAnnouncement(' + a.id + ')">Delete</button>' +
          '</div>' +
        '</div>';
      listContainer.appendChild(card);
    });

  } catch (err) {
    container.innerHTML = '<div class="empty-state"><p>Failed to load announcements: ' + err.message + '</p></div>';
  }
}

async function showCreateAnnouncementModal() {
  var branches = await apiGet('/branches');
  var branchOpts = '<option value="">All Branches</option>' + branches.map(function(b) {
    return '<option value="' + b.id + '">' + b.name + '</option>';
  }).join('');

  var html =
    '<form id="create-announcement-form">' +
      '<div class="form-group"><label class="form-label">Title</label><input type="text" class="form-input" id="ann-title" required placeholder="Announcement title"></div>' +
      '<div class="form-row">' +
        '<div class="form-group"><label class="form-label">Branch</label><select class="form-select" id="ann-branch">' + branchOpts + '</select></div>' +
        '<div class="form-group"><label class="form-label">Priority</label><select class="form-select" id="ann-priority"><option value="normal">Normal</option><option value="important">Important</option><option value="urgent">Urgent</option></select></div>' +
      '</div>' +
      '<div class="form-group"><label class="form-label">Content</label><textarea class="form-input" id="ann-content" rows="5" required placeholder="Write your announcement..."></textarea></div>' +
    '</form>';

  Modal.show('New Announcement', html,
    { width: '560px', onOpen: function(modal) {
      var footer = document.createElement('div');
      footer.style.cssText = 'padding:16px 24px;border-top:1px solid var(--border-color);display:flex;justify-content:flex-end;gap:10px;';
      footer.innerHTML = '<button class="btn btn-secondary" onclick="Modal.close()">Cancel</button><button class="btn btn-primary" id="ann-submit">Publish</button>';
      modal.appendChild(footer);

      document.getElementById('ann-submit').addEventListener('click', async function() {
        var title = document.getElementById('ann-title').value;
        var content = document.getElementById('ann-content').value;
        if (!title || !content) { Toast.error('Please fill in title and content'); return; }
        var data = {
          title: title,
          content: content,
          branch_id: document.getElementById('ann-branch').value ? parseInt(document.getElementById('ann-branch').value) : null,
          priority: document.getElementById('ann-priority').value
        };
        try {
          await apiPost('/announcements', data);
          Toast.success('Announcement published!');
          Modal.close();
          loadAnnouncements();
        } catch (err) { Toast.error(err.message); }
      });
    }}
  );
}

async function editAnnouncement(id) {
  try {
    var announcements = await apiGet('/announcements');
    var a = announcements.find(function(x) { return x.id === id; });
    if (!a) { Toast.error('Not found'); return; }

    var branches = await apiGet('/branches');
    var branchOpts = '<option value="">All Branches</option>' + branches.map(function(b) {
      return '<option value="' + b.id + '" ' + (a.branch_id == b.id ? 'selected' : '') + '>' + b.name + '</option>';
    }).join('');

    var html =
      '<form id="edit-announcement-form">' +
        '<div class="form-group"><label class="form-label">Title</label><input type="text" class="form-input" id="ann-title" value="' + a.title + '" required></div>' +
        '<div class="form-row">' +
          '<div class="form-group"><label class="form-label">Branch</label><select class="form-select" id="ann-branch">' + branchOpts + '</select></div>' +
          '<div class="form-group"><label class="form-label">Priority</label><select class="form-select" id="ann-priority"><option value="normal" ' + (a.priority === 'normal' ? 'selected' : '') + '>Normal</option><option value="important" ' + (a.priority === 'important' ? 'selected' : '') + '>Important</option><option value="urgent" ' + (a.priority === 'urgent' ? 'selected' : '') + '>Urgent</option></select></div>' +
        '</div>' +
        '<div class="form-group"><label class="form-label">Content</label><textarea class="form-input" id="ann-content" rows="5" required>' + a.content + '</textarea></div>' +
      '</form>';

    Modal.show('Edit Announcement', html,
      { width: '560px', onOpen: function(modal) {
        var footer = document.createElement('div');
        footer.style.cssText = 'padding:16px 24px;border-top:1px solid var(--border-color);display:flex;justify-content:flex-end;gap:10px;';
        footer.innerHTML = '<button class="btn btn-secondary" onclick="Modal.close()">Cancel</button><button class="btn btn-primary" id="ann-update">Update</button>';
        modal.appendChild(footer);

        document.getElementById('ann-update').addEventListener('click', async function() {
          var data = {
            title: document.getElementById('ann-title').value,
            content: document.getElementById('ann-content').value,
            branch_id: document.getElementById('ann-branch').value ? parseInt(document.getElementById('ann-branch').value) : null,
            priority: document.getElementById('ann-priority').value
          };
          try {
            await apiPut('/announcements/' + id, data);
            Toast.success('Announcement updated!');
            Modal.close();
            loadAnnouncements();
          } catch (err) { Toast.error(err.message); }
        });
      }}
    );
  } catch (err) { Toast.error(err.message); }
}

async function deleteAnnouncement(id) {
  var confirmed = await Modal.confirm('Delete Announcement', 'Are you sure you want to delete this announcement?');
  if (!confirmed) return;
  try {
    await apiDelete('/announcements/' + id);
    Toast.success('Announcement deleted!');
    loadAnnouncements();
  } catch (err) { Toast.error(err.message); }
}

Router.register('announcements', renderAdminAnnouncements);
