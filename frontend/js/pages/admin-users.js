async function renderAdminUsers() {
    var app = document.getElementById('app');
    app.innerHTML = '<div class="layout">' + renderSidebar() + '<div class="main-content">' + renderNavbar('Employee Management') + '<div class="page-content" id="page-body"><div style="text-align:center;padding:60px;"><div class="spinner"></div></div></div></div></div>';
    document.getElementById('logout-btn')?.addEventListener('click', function(e) { e.preventDefault(); Auth.logout(); });

    try {
        var user = Auth.getUser();
        var isOwner = user && user.role === 'owner';
        var users = await apiGet('/users');
        if (!Array.isArray(users)) users = [];

        var filtered = users;
        if (!isOwner && user.branch_id) {
            filtered = users.filter(function(u) { return String(u.branch_id) === String(user.branch_id); });
        }

        var activeCount = filtered.filter(function(u) { return u.is_active; }).length;
        var inactiveCount = filtered.length - activeCount;
        var adminCount = filtered.filter(function(u) { return u.role === 'admin'; }).length;
        var empCount = filtered.filter(function(u) { return u.role === 'employee'; }).length;

        var body = document.getElementById('page-body');
        body.innerHTML =
            '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:12px;">' +
                '<div style="display:flex;gap:10px;align-items:center;">' +
                    (isOwner ?
                        '<select id="emp-role-filter" style="background:#0d1117;border:1px solid #30363d;border-radius:8px;padding:8px 12px;color:#e2e8f0;font-size:0.85rem;">' +
                        '<option value="">All Roles</option><option value="admin">Admin</option><option value="employee">Employee</option></select>' : '') +
                '</div>' +
                '<button id="add-emp-btn" style="background:#6366f1;color:#fff;border:none;border-radius:8px;padding:8px 20px;cursor:pointer;font-weight:600;font-size:0.85rem;">+ Add Employee</button>' +
            '</div>' +

            '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-bottom:24px;">' +
                empCard('Total', filtered.length, '#6366f1') +
                empCard('Active', activeCount, '#22c55e') +
                empCard('Inactive', inactiveCount, '#ef4444') +
                empCard('Admins', adminCount, '#a855f7') +
            '</div>' +

            '<div id="emp-list"></div>';

        renderEmpList(filtered);

        var roleFilter = document.getElementById('emp-role-filter');
        if (roleFilter) {
            roleFilter.addEventListener('change', function() {
                var v = this.value;
                var f = v ? users.filter(function(u) { return u.role === v; }) : users;
                if (!isOwner && user.branch_id) f = f.filter(function(u) { return String(u.branch_id) === String(user.branch_id); });
                filtered = f;
                renderEmpList(filtered);
            });
        }

        document.getElementById('add-emp-btn')?.addEventListener('click', function() { showEmpModal(null); });

    } catch (err) {
        document.getElementById('page-body').innerHTML = '<div style="color:#f87171;padding:40px;text-align:center;">Failed to load employees</div>';
    }
}

function empCard(label, value, color) {
    return '<div style="background:#1a1f2e;border:1px solid #2a3040;border-radius:12px;padding:16px;">' +
        '<div style="color:#94a3b8;font-size:0.75rem;text-transform:uppercase;margin-bottom:6px;">' + label + '</div>' +
        '<div style="color:' + color + ';font-size:1.3rem;font-weight:700;">' + value + '</div></div>';
}

function renderEmpList(employees) {
    var container = document.getElementById('emp-list');
    if (!container) return;

    if (employees.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:40px;color:#666;">No employees found</div>';
        return;
    }

    var html = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:12px;">';
    employees.forEach(function(u) {
        var initials = u.first_name && u.last_name ? (u.first_name[0] + u.last_name[0]).toUpperCase() : '??';
        var roleColor = u.role === 'owner' ? '#00f0ff' : u.role === 'admin' ? '#a855f7' : '#6366f1';
        var statusColor = u.is_active ? '#22c55e' : '#ef4444';
        var statusBg = u.is_active ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)';
        var user = Auth.getUser();
        var canEdit = user && (user.role === 'owner' || (user.role === 'admin' && u.role === 'employee'));
        var canDeactivate = user && user.role === 'owner' && u.role !== 'owner';

        html += '<div style="background:#1a1f2e;border:1px solid #2a3040;border-radius:12px;padding:16px;display:flex;flex-direction:column;gap:12px;">' +
            '<div style="display:flex;align-items:center;gap:12px;">' +
                '<div style="width:42px;height:42px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#a855f7);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.8rem;color:#fff;flex-shrink:0;">' + initials + '</div>' +
                '<div style="flex:1;min-width:0;">' +
                    '<div style="color:#e2e8f0;font-weight:600;font-size:0.9rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + escU(u.first_name + ' ' + u.last_name) + '</div>' +
                    '<div style="color:#94a3b8;font-size:0.75rem;">' + escU(u.email || 'No email') + '</div>' +
                '</div>' +
            '</div>' +
            '<div style="display:flex;gap:8px;align-items:center;">' +
                '<span style="background:' + roleColor + '22;color:' + roleColor + ';padding:3px 10px;border-radius:20px;font-size:0.7rem;font-weight:600;text-transform:uppercase;">' + u.role + '</span>' +
                '<span style="background:' + statusBg + ';color:' + statusColor + ';padding:3px 10px;border-radius:20px;font-size:0.7rem;font-weight:600;">' + (u.is_active ? 'Active' : 'Inactive') + '</span>' +
            '</div>' +
            (canEdit || canDeactivate ?
                '<div style="display:flex;gap:8px;border-top:1px solid #2a3040;padding-top:10px;">' +
                    (canEdit ? '<button onclick="window.__editEmp(' + u.id + ')" style="flex:1;padding:6px;border:1px solid #30363d;border-radius:6px;background:transparent;color:#94a3b8;font-size:0.75rem;cursor:pointer;">Edit</button>' : '') +
                    (canDeactivate ? '<button onclick="window.__toggleEmp(' + u.id + ',' + u.is_active + ')" style="flex:1;padding:6px;border:1px solid ' + (u.is_active ? '#ef4444' : '#22c55e') + ';border-radius:6px;background:transparent;color:' + (u.is_active ? '#fca5a5' : '#86efac') + ';font-size:0.75rem;cursor:pointer;">' + (u.is_active ? 'Deactivate' : 'Activate') + '</button>' : '') +
                '</div>' : '') +
        '</div>';
    });
    html += '</div>';
    container.innerHTML = html;

    var allUsers = [];
    try { allUsers = JSON.parse(JSON.stringify(employees)); } catch(e) {}
    window.__editEmp = function(id) {
        var u = allUsers.find(function(x) { return String(x.id) === String(id); });
        if (u) showEmpModal(u);
    };
    window.__toggleEmp = async function(id, isActive) {
        if (!confirm(isActive ? 'Deactivate this employee?' : 'Activate this employee?')) return;
        try {
            await apiPut('/users/' + id, { is_active: !isActive });
            Toast.success(isActive ? 'Employee deactivated' : 'Employee activated');
            renderAdminUsers();
        } catch (err) { Toast.error(err.message || 'Failed'); }
    };
}

async function showEmpModal(existing) {
    var isEdit = !!existing;
    var user = Auth.getUser();
    var isOwner = user && user.role === 'owner';
    var branches = [];
    if (isOwner) {
        branches = await apiGet('/branches');
        if (!Array.isArray(branches)) branches = [];
    }

    var branchSelect = '';
    if (isOwner) {
        branchSelect = '<div style="margin-bottom:12px;"><label style="color:#94a3b8;font-size:0.8rem;display:block;margin-bottom:4px;">Branch</label>' +
            '<select name="branch_id" style="width:100%;background:#0d1117;border:1px solid #30363d;border-radius:6px;padding:8px;color:#e2e8f0;">' +
            branches.map(function(b) { return '<option value="' + b.id + '"' + (isEdit && String(existing.branch_id) === String(b.id) ? ' selected' : '') + '>' + escU(b.name) + '</option>'; }).join('') +
            '</select></div>';
    }

    var roleSelect = '<div style="margin-bottom:12px;"><label style="color:#94a3b8;font-size:0.8rem;display:block;margin-bottom:4px;">Role</label>' +
        '<select name="role" style="width:100%;background:#0d1117;border:1px solid #30363d;border-radius:6px;padding:8px;color:#e2e8f0;">' +
        '<option value="employee"' + (isEdit && existing.role === 'employee' ? ' selected' : '') + '>Employee</option>' +
        '<option value="admin"' + (isEdit && existing.role === 'admin' ? ' selected' : '') + '>Admin</option>' +
        (isOwner ? '<option value="owner"' + (isEdit && existing.role === 'owner' ? ' selected' : '') + '>Owner</option>' : '') +
        '</select></div>';

    var html = '<form id="emp-form" style="display:flex;flex-direction:column;gap:12px;">' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">' +
            '<div><label style="color:#94a3b8;font-size:0.8rem;display:block;margin-bottom:4px;">First Name</label><input name="first_name" style="width:100%;background:#0d1117;border:1px solid #30363d;border-radius:6px;padding:8px;color:#e2e8f0;" required value="' + (isEdit ? escU(existing.first_name) : '') + '"></div>' +
            '<div><label style="color:#94a3b8;font-size:0.8rem;display:block;margin-bottom:4px;">Last Name</label><input name="last_name" style="width:100%;background:#0d1117;border:1px solid #30363d;border-radius:6px;padding:8px;color:#e2e8f0;" required value="' + (isEdit ? escU(existing.last_name) : '') + '"></div>' +
        '</div>' +
        '<div><label style="color:#94a3b8;font-size:0.8rem;display:block;margin-bottom:4px;">Email</label><input type="email" name="email" style="width:100%;background:#0d1117;border:1px solid #30363d;border-radius:6px;padding:8px;color:#e2e8f0;" required value="' + (isEdit ? escU(existing.email || '') : '') + '"></div>' +
        '<div><label style="color:#94a3b8;font-size:0.8rem;display:block;margin-bottom:4px;">PIN (4-6 digits)</label><input name="pin" style="width:100%;background:#0d1117;border:1px solid #30363d;border-radius:6px;padding:8px;color:#e2e8f0;" ' + (isEdit ? '' : 'required') + ' maxlength="6" placeholder="' + (isEdit ? 'Leave blank to keep' : 'Enter PIN') + '"></div>' +
        roleSelect + branchSelect +
        '<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:8px;">' +
            '<button type="button" onclick="Modal.close()" style="padding:8px 20px;border:1px solid #30363d;border-radius:6px;background:transparent;color:#94a3b8;cursor:pointer;">Cancel</button>' +
            '<button type="submit" style="padding:8px 20px;border:none;border-radius:6px;background:#6366f1;color:#fff;font-weight:600;cursor:pointer;">' + (isEdit ? 'Update' : 'Create') + '</button>' +
        '</div></form>';

    Modal.show(isEdit ? 'Edit Employee' : 'Add Employee', html, { width: '500px' });

    document.getElementById('emp-form')?.addEventListener('submit', async function(e) {
        e.preventDefault();
        var f = e.target;
        var data = { first_name: f.first_name.value, last_name: f.last_name.value, email: f.email.value, role: f.role.value };
        if (f.branch_id) data.branch_id = parseInt(f.branch_id.value);
        else if (user.branch_id) data.branch_id = user.branch_id;
        if (f.pin.value) data.pin = f.pin.value;
        try {
            if (isEdit) { await apiPut('/users/' + existing.id, data); Toast.success('Employee updated'); }
            else { if (!data.pin) { Toast.error('PIN required'); return; } await apiPost('/users', data); Toast.success('Employee created'); }
            Modal.close();
            renderAdminUsers();
        } catch (err) { Toast.error(err.message || 'Failed'); }
    });
}

function escU(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

Router.register('users', renderAdminUsers);
