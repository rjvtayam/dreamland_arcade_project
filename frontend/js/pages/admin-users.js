async function renderAdminUsers() {
    var app = document.getElementById('app');
    app.innerHTML = '<div class="layout">' + renderSidebar() + '<div class="main-content">' + renderNavbar('Employee Management') + '<div class="page-content" id="page-body"><div style="text-align:center;padding:60px;"><div class="spinner"></div></div></div></div></div>';
    document.getElementById('logout-btn')?.addEventListener('click', function(e) { e.preventDefault(); Auth.logout(); });

    try {
        var user = Auth.getUser();
        var isOwner = user && user.role === 'owner';
        var users = await apiGet('/users');
        if (!Array.isArray(users)) users = [];

        var filtered = users.filter(function(u) { return u.role === 'employee'; });
        if (!isOwner && user.branch_id) {
            filtered = filtered.filter(function(u) { return String(u.branch_id) === String(user.branch_id); });
        }

        var activeCount = filtered.filter(function(u) { return u.is_active; }).length;
        var inactiveCount = filtered.length - activeCount;

        var today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        var branchBadge = isOwner ? '' :
            '<span style="background:linear-gradient(135deg,#065f46,#059669);color:#fff;padding:4px 12px;border-radius:8px;font-size:0.75rem;font-weight:600;">' + escU(user.branch_name || 'My Branch') + '</span>';

        var body = document.getElementById('page-body');
        body.innerHTML =
            '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;flex-wrap:wrap;gap:12px;">' +
                '<div>' +
                    '<h2 style="color:#fff;margin:0 0 4px;font-size:1.3rem;">Employee Management</h2>' +
                    '<div style="display:flex;gap:10px;align-items:center;color:#64748b;font-size:0.8rem;">' +
                        '<svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>' +
                        today + branchBadge +
                    '</div>' +
                '</div>' +
                '<div style="display:flex;gap:8px;align-items:center;">' +
                    '<div style="position:relative;">' +
                        '<svg width="16" height="16" fill="none" stroke="#64748b" viewBox="0 0 24 24" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);pointer-events:none;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>' +
                        '<input id="emp-search" type="text" placeholder="Search employees..." style="background:#0f172a;border:1px solid #1e293b;border-radius:8px;padding:8px 12px 8px 34px;color:#e2e8f0;font-size:0.85rem;width:220px;outline:none;transition:border 0.2s;" onfocus="this.style.borderColor=\'#6366f1\'" onblur="this.style.borderColor=\'#1e293b\'">' +
                    '</div>' +
                    '<button id="add-emp-btn" style="background:linear-gradient(135deg,#4f46e5,#6366f1);color:#fff;border:none;border-radius:8px;padding:8px 18px;cursor:pointer;font-weight:600;font-size:0.85rem;display:flex;align-items:center;gap:6px;transition:all 0.2s;box-shadow:0 2px 8px rgba(99,102,241,0.3);" onmouseenter="this.style.transform=\'translateY(-1px)\';this.style.boxShadow=\'0 4px 12px rgba(99,102,241,0.4)\'" onmouseleave="this.style.transform=\'\';this.style.boxShadow=\'0 2px 8px rgba(99,102,241,0.3)\'">' +
                        '<svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>' +
                        'Add Employee' +
                    '</button>' +
                '</div>' +
            '</div>' +

            '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:24px;">' +
                empStatCard('Total Employees', filtered.length, '#6366f1', '<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>') +
                empStatCard('Active', activeCount, '#22c55e', '<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>') +
                empStatCard('Inactive', inactiveCount, '#ef4444', '<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/></svg>') +
            '</div>' +

            '<div id="emp-list"></div>';

        renderEmpList(filtered);

        document.getElementById('emp-search')?.addEventListener('input', function() {
            var q = this.value.toLowerCase().trim();
            var f = users.filter(function(u) { return u.role === 'employee'; });
            if (!isOwner && user.branch_id) f = f.filter(function(u) { return String(u.branch_id) === String(user.branch_id); });
            if (q) {
                f = f.filter(function(u) {
                    return ((u.first_name || '') + ' ' + (u.last_name || '')).toLowerCase().includes(q) ||
                           (u.email || '').toLowerCase().includes(q) ||
                           (u.role || '').toLowerCase().includes(q);
                });
            }
            filtered = f;
            renderEmpList(filtered);
        });

        document.getElementById('add-emp-btn')?.addEventListener('click', function() { showEmpModal(null); });

    } catch (err) {
        document.getElementById('page-body').innerHTML = '<div style="color:#f87171;padding:40px;text-align:center;">Failed to load employees</div>';
    }
}

function empStatCard(label, value, color, icon) {
    return '<div style="background:linear-gradient(135deg,#0f172a,#1e293b);border:1px solid #1e293b;border-radius:14px;padding:18px;position:relative;overflow:hidden;transition:all 0.3s;" onmouseenter="this.style.borderColor=\'' + color + '44\';this.style.transform=\'translateY(-2px)\'" onmouseleave="this.style.borderColor=\'#1e293b\';this.style.transform=\'\'">' +
        '<div style="position:absolute;top:-15px;right:-15px;width:60px;height:60px;border-radius:50%;background:' + color + '0D;"></div>' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">' +
            '<span style="color:#64748b;font-size:0.7rem;text-transform:uppercase;letter-spacing:1px;">' + label + '</span>' +
            '<div style="color:' + color + ';opacity:0.6;">' + icon + '</div>' +
        '</div>' +
        '<div style="color:' + color + ';font-size:1.6rem;font-weight:700;">' + value + '</div>' +
    '</div>';
}

function renderEmpList(employees) {
    var container = document.getElementById('emp-list');
    if (!container) return;

    if (employees.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:60px 20px;color:#475569;">' +
            '<svg width="48" height="48" fill="none" stroke="#334155" viewBox="0 0 24 24" style="margin:0 auto 12px;display:block;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>' +
            '<div style="font-size:0.95rem;color:#64748b;">No employees found</div>' +
        '</div>';
        return;
    }

    var html = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:14px;">';
    employees.forEach(function(u) {
        var initials = u.first_name && u.last_name ? (u.first_name[0] + u.last_name[0]).toUpperCase() : '??';
        var isActive = u.is_active;
        var currentUser = Auth.getUser();
        var isOwner = currentUser && currentUser.role === 'owner';
        var canEdit = isOwner || currentUser.role === 'admin';

        html += '<div class="emp-card" data-active="' + (isActive ? '1' : '0') + '" style="background:linear-gradient(145deg,#0c1220,#111827);border:1px solid #1e293b;border-radius:14px;padding:0;overflow:hidden;transition:all 0.3s ease;" onmouseenter="this.style.borderColor=\'#334155\';this.style.transform=\'translateY(-2px)\'" onmouseleave="this.style.borderColor=\'#1e293b\';this.style.transform=\'\'">' +
            '<div style="position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,' + (isActive ? '#6366f1,#a855f7' : '#475569,#64748b') + ',transparent);opacity:0.6;"></div>' +
            '<div style="position:absolute;top:10px;right:10px;width:6px;height:6px;border-radius:50%;background:' + (isActive ? '#22c55e' : '#ef4444') + ';"></div>' +
            '<div style="padding:20px 20px 16px;">' +
                '<div style="display:flex;align-items:center;gap:14px;margin-bottom:16px;">' +
                    '<div style="position:relative;width:48px;height:48px;flex-shrink:0;">' +
                        '<div style="width:48px;height:48px;border-radius:12px;background:linear-gradient(135deg,#1a1f3a,#0f172a);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.85rem;color:#a78bfa;border:1px solid rgba(99,102,241,0.2);">' + initials + '</div>' +
                    '</div>' +
                    '<div style="flex:1;min-width:0;">' +
                        '<div style="color:#e2e8f0;font-weight:600;font-size:0.95rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + escU(u.first_name + ' ' + u.last_name) + '</div>' +
                        '<div style="display:flex;align-items:center;gap:6px;margin-top:4px;">' +
                            '<svg width="11" height="11" fill="none" stroke="#4a5568" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>' +
                            '<span style="color:#64748b;font-size:0.78rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + escU(u.email || 'No email') + '</span>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                '<div style="display:flex;align-items:center;justify-content:space-between;border-top:1px solid #1e293b;padding-top:14px;">' +
                    '<span style="display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:6px;font-size:0.7rem;font-weight:600;background:' + (isActive ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)') + ';color:' + (isActive ? '#4ade80' : '#f87171') + ';">' +
                        '<span style="width:5px;height:5px;border-radius:50%;background:' + (isActive ? '#4ade80' : '#f87171') + ';"></span>' +
                        (isActive ? 'ACTIVE' : 'INACTIVE') +
                    '</span>' +
                    (canEdit ?
                        '<button onclick="window.__editEmp(' + u.id + ')" style="display:flex;align-items:center;gap:5px;padding:6px 14px;border:1px solid #30363d;border-radius:8px;background:transparent;color:#94a3b8;font-size:0.75rem;font-weight:600;cursor:pointer;transition:all 0.2s;" onmouseenter="this.style.borderColor=\'#6366f1\';this.style.color=\'#a78bfa\'" onmouseleave="this.style.borderColor=\'#30363d\';this.style.color=\'#94a3b8\'">' +
                            '<svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>' +
                            'EDIT' +
                        '</button>' : '') +
                '</div>' +
            '</div>' +
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

    var inputStyle = 'width:100%;background:#0f172a;border:1px solid #1e293b;border-radius:8px;padding:10px 12px 10px 36px;color:#e2e8f0;font-size:0.85rem;outline:none;transition:border 0.2s;box-sizing:border-box;';
    var labelStyle = 'color:#94a3b8;font-size:0.75rem;display:flex;align-items:center;gap:6px;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.5px;';
    var fieldWrapStyle = 'position:relative;';
    var iconStyle = 'position:absolute;left:10px;top:50%;transform:translateY(-50%);color:#475569;pointer-events:none;';

    var branchSelect = '';
    if (isOwner) {
        branchSelect = '<div>' +
            '<label style="' + labelStyle + '"><svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>Branch</label>' +
            '<div style="' + fieldWrapStyle + '">' +
                '<svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="' + iconStyle + '"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>' +
                '<select name="branch_id" style="' + inputStyle + 'padding-left:36px;">' +
                branches.map(function(b) { return '<option value="' + b.id + '"' + (isEdit && String(existing.branch_id) === String(b.id) ? ' selected' : '') + '>' + escU(b.name) + '</option>'; }).join('') +
                '</select></div></div>';
    }

    var roleSelect = '';
    if (isOwner) {
        roleSelect = '<div>' +
            '<label style="' + labelStyle + '"><svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/></svg>Role</label>' +
            '<div style="' + fieldWrapStyle + '">' +
                '<svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="' + iconStyle + '"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/></svg>' +
                '<select name="role" style="' + inputStyle + 'padding-left:36px;">' +
                '<option value="employee"' + (isEdit && existing.role === 'employee' ? ' selected' : '') + '>Employee</option>' +
                '<option value="admin"' + (isEdit && existing.role === 'admin' ? ' selected' : '') + '>Admin</option>' +
                '<option value="owner"' + (isEdit && existing.role === 'owner' ? ' selected' : '') + '>Owner</option>' +
                '</select></div></div>';
    }

    var html =
        '<div style="background:#0f172a;border:1px solid #1e293b;border-radius:12px;padding:20px;margin-bottom:16px;">' +
            '<div style="display:flex;align-items:center;gap:12px;margin-bottom:4px;">' +
                '<div style="width:40px;height:40px;border-radius:10px;background:linear-gradient(135deg,' + (isEdit ? '#f59e0b33,#f59e0b66' : '#6366f133,#6366f166') + ');display:flex;align-items:center;justify-content:center;">' +
                    (isEdit ?
                        '<svg width="18" height="18" fill="none" stroke="' + '#f59e0b' + '" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>' :
                        '<svg width="18" height="18" fill="none" stroke="#6366f1" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/></svg>') +
                '</div>' +
                '<div>' +
                    '<div style="color:#e2e8f0;font-weight:600;font-size:1rem;">' + (isEdit ? 'Edit Employee' : 'Add New Employee') + '</div>' +
                    '<div style="color:#64748b;font-size:0.8rem;">' + (isEdit ? 'Update employee information' : 'Fill in the details to create a new account') + '</div>' +
                '</div>' +
            '</div>' +
        '</div>' +

        '<form id="emp-form" style="display:flex;flex-direction:column;gap:16px;">' +
            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">' +
                '<div>' +
                    '<label style="' + labelStyle + '"><svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>First Name</label>' +
                    '<div style="' + fieldWrapStyle + '">' +
                        '<svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="' + iconStyle + '"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>' +
                        '<input name="first_name" style="' + inputStyle + '" required value="' + (isEdit ? escU(existing.first_name) : '') + '" placeholder="e.g. Juan">' +
                    '</div>' +
                '</div>' +
                '<div>' +
                    '<label style="' + labelStyle + '"><svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>Last Name</label>' +
                    '<div style="' + fieldWrapStyle + '">' +
                        '<svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="' + iconStyle + '"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>' +
                        '<input name="last_name" style="' + inputStyle + '" required value="' + (isEdit ? escU(existing.last_name) : '') + '" placeholder="e.g. Dela Cruz">' +
                    '</div>' +
                '</div>' +
            '</div>' +
            '<div>' +
                '<label style="' + labelStyle + '"><svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>Email Address</label>' +
                '<div style="' + fieldWrapStyle + '">' +
                    '<svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="' + iconStyle + '"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>' +
                    '<input type="email" name="email" style="' + inputStyle + '" required value="' + (isEdit ? escU(existing.email || '') : '') + '" placeholder="e.g. juan@dreamlandarcade.com">' +
                '</div>' +
            '</div>' +
            '<div>' +
                '<label style="' + labelStyle + '"><svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>PIN (4-6 digits)</label>' +
                '<div style="' + fieldWrapStyle + '">' +
                    '<svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="' + iconStyle + '"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>' +
                    '<input name="pin" style="' + inputStyle + '" ' + (isEdit ? '' : 'required') + ' maxlength="6" placeholder="' + (isEdit ? 'Leave blank to keep current' : 'Enter 4-6 digit PIN') + '">' +
                '</div>' +
            '</div>' +
            roleSelect + branchSelect +
            (isEdit ? '<div style="display:flex;align-items:center;justify-content:space-between;background:#0f172a;border:1px solid #1e293b;border-radius:10px;padding:14px 16px;">' +
                '<div style="display:flex;align-items:center;gap:10px;">' +
                    '<div style="width:32px;height:32px;border-radius:8px;background:' + (existing.is_active ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)') + ';display:flex;align-items:center;justify-content:center;">' +
                        (existing.is_active ?
                            '<svg width="16" height="16" fill="none" stroke="#22c55e" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>' :
                            '<svg width="16" height="16" fill="none" stroke="#ef4444" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/></svg>') +
                    '</div>' +
                    '<div>' +
                        '<div style="color:#e2e8f0;font-size:0.85rem;font-weight:500;">Account Status</div>' +
                        '<div style="color:#64748b;font-size:0.75rem;">' + (existing.is_active ? 'Employee has active access' : 'Employee access is revoked') + '</div>' +
                    '</div>' +
                '</div>' +
                '<label style="position:relative;display:inline-block;width:44px;height:24px;cursor:pointer;">' +
                    '<input type="checkbox" name="is_active" value="1" ' + (existing.is_active ? 'checked' : '') + ' style="opacity:0;width:0;height:0;position:absolute;">' +
                    '<span style="position:absolute;top:0;left:0;right:0;bottom:0;background:' + (existing.is_active ? '#22c55e' : '#475569') + ';border-radius:12px;transition:0.3s;"></span>' +
                    '<span style="position:absolute;top:2px;left:' + (existing.is_active ? '22px' : '2px') + ';width:20px;height:20px;background:#fff;border-radius:50%;transition:0.3s;box-shadow:0 1px 3px rgba(0,0,0,0.3);"></span>' +
                '</label>' +
            '</div>' : '') +
            '<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:8px;">' +
                '<button type="button" onclick="Modal.close()" style="padding:10px 20px;border:1px solid #30363d;border-radius:8px;background:transparent;color:#94a3b8;cursor:pointer;font-size:0.85rem;display:flex;align-items:center;gap:6px;transition:all 0.2s;" onmouseenter="this.style.borderColor=\'#ef4444\';this.style.color=\'#fca5a5\'" onmouseleave="this.style.borderColor=\'#30363d\';this.style.color=\'#94a3b8\'">' +
                    '<svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>' +
                    'Cancel' +
                '</button>' +
                '<button type="submit" style="padding:10px 24px;border:none;border-radius:8px;background:linear-gradient(135deg,#4f46e5,#6366f1);color:#fff;font-weight:600;cursor:pointer;font-size:0.85rem;display:flex;align-items:center;gap:6px;transition:all 0.2s;box-shadow:0 2px 8px rgba(99,102,241,0.3);" onmouseenter="this.style.transform=\'translateY(-1px)\';this.style.boxShadow=\'0 4px 12px rgba(99,102,241,0.4)\'" onmouseleave="this.style.transform=\'\';this.style.boxShadow=\'0 2px 8px rgba(99,102,241,0.3)\'">' +
                    (isEdit ?
                        '<svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>' :
                        '<svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>') +
                    (isEdit ? 'Update Employee' : 'Create Employee') +
                '</button>' +
            '</div>' +
        '</form>';

    Modal.show(isEdit ? 'Edit Employee' : 'Add New Employee', html, { width: '540px' });

    document.getElementById('emp-form')?.addEventListener('submit', async function(e) {
        e.preventDefault();
        var f = e.target;
        var data = { first_name: f.first_name.value, last_name: f.last_name.value, email: f.email.value };
        if (f.branch_id) data.branch_id = parseInt(f.branch_id.value);
        else if (user.branch_id) data.branch_id = user.branch_id;

        if (isOwner && f.role) {
            data.role = f.role.value;
        } else if (!isEdit) {
            data.role = 'employee';
        }

        if (f.pin.value) data.pin = f.pin.value;
        if (isEdit && f.is_active) data.is_active = f.is_active.checked;
        try {
            if (isEdit) { await apiPut('/users/' + existing.id, data); Toast.success('Employee updated'); }
            else { if (!data.pin) { Toast.error('PIN required'); return; } await apiPost('/users', data); Toast.success('Employee created'); }
            Modal.close();
            renderAdminUsers();
        } catch (err) { Toast.error(err.message || 'Failed'); }
    });

    var toggle = document.querySelector('input[name="is_active"]');
    if (toggle) {
        toggle.addEventListener('change', function() {
            var track = this.nextElementSibling;
            var thumb = track.nextElementSibling;
            if (this.checked) {
                track.style.background = '#22c55e';
                thumb.style.left = '22px';
            } else {
                track.style.background = '#475569';
                thumb.style.left = '2px';
            }
            var wrapper = this.closest('div[style]');
            if (wrapper) {
                var iconDiv = wrapper.querySelector('div > div:first-child');
                var desc = wrapper.querySelector('div > div:last-child');
                if (iconDiv) iconDiv.style.background = this.checked ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)';
            }
        });
    }
}

function escU(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

Router.register('users', renderAdminUsers);
