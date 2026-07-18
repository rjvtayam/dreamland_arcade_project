async function renderAdminUsers() {
    const app = document.getElementById('app');
    app.innerHTML = `<div class="layout">${renderSidebar()}<div class="main-content">${renderNavbar('User Management')}<div class="page-content" id="page-body"><div style="text-align:center;padding:60px;"><div class="spinner"></div></div></div></div></div>`;
    document.getElementById('logout-btn')?.addEventListener('click', (e) => { e.preventDefault(); Auth.logout(); });

    try {
        const [users, branches] = await Promise.all([
            apiGet('/users'),
            apiGet('/branches')
        ]);
        const currentUserRole = Auth.getUserRole();

        const body = document.getElementById('page-body');
        body.innerHTML = `
            <div class="page-header">
                <h2>Users</h2>
                <button class="btn btn-primary" id="add-user-btn">+ Add User</button>
            </div>
            <div class="filters-bar">
                <select class="form-select" id="filter-branch">
                    <option value="">All Branches</option>
                    ${branches.map(b => `<option value="${b.id}">${b.name}</option>`).join('')}
                </select>
                <select class="form-select" id="filter-role">
                    <option value="">All Roles</option>
                    <option value="owner">Owner</option>
                    <option value="admin">Admin</option>
                    <option value="employee">Employee</option>
                </select>
            </div>
            <div class="table-container">
                <table class="data-table" id="users-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Branch</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="users-tbody">
                        ${renderUserRows(users, branches, currentUserRole)}
                    </tbody>
                </table>
            </div>
            ${users.length === 0 ? '<div class="empty-state"><p>No users found</p></div>' : ''}
        `;

        document.getElementById('add-user-btn').addEventListener('click', () => showUserModal(null, branches));

        const filterTable = async () => {
            const branchId = document.getElementById('filter-branch').value;
            const role = document.getElementById('filter-role').value;
            let filtered = users;
            if (branchId) filtered = filtered.filter(u => String(u.branch_id) === String(branchId));
            if (role) filtered = filtered.filter(u => u.role === role);
            document.getElementById('users-tbody').innerHTML = renderUserRows(filtered, branches, currentUserRole);
            attachUserActions(filtered, branches, currentUserRole);
        };

        document.getElementById('filter-branch').addEventListener('change', filterTable);
        document.getElementById('filter-role').addEventListener('change', filterTable);

        attachUserActions(users, branches, currentUserRole);

    } catch (err) {
        document.getElementById('page-body').innerHTML = `<div class="empty-state"><p>Failed to load users</p></div>`;
    }
}

function renderUserRows(users, branches, currentUserRole) {
    if (users.length === 0) return '<tr><td colspan="6" class="empty-cell">No users found</td></tr>';
    return users.map(u => {
        const branchName = branches.find(b => String(b.id) === String(u.branch_id))?.name || '—';
        const roleBadge = u.role === 'owner' ? 'cyan' : u.role === 'admin' ? 'magenta' : 'green';
        const canDeactivate = currentUserRole === 'owner' && u.role !== 'owner';
        return `
            <tr>
                <td>
                    <div class="user-cell">
                        <div class="avatar avatar-sm">${getInitials(u.first_name, u.last_name)}</div>
                        <span>${u.first_name} ${u.last_name}</span>
                    </div>
                </td>
                <td>${u.email}</td>
                <td><span class="badge badge-${roleBadge}">${u.role}</span></td>
                <td>${branchName}</td>
                <td><span class="badge badge-${u.is_active ? 'green' : 'red'}">${u.is_active ? 'Active' : 'Inactive'}</span></td>
                <td class="actions-cell">
                    <button class="btn btn-sm btn-outline edit-user" data-id="${u.id}">Edit</button>
                    ${canDeactivate ? `<button class="btn btn-sm btn-outline btn-danger toggle-user" data-id="${u.id}" data-active="${u.is_active}">${u.is_active ? 'Deactivate' : 'Activate'}</button>` : ''}
                </td>
            </tr>
        `;
    }).join('');
}

function attachUserActions(users, branches, currentUserRole) {
    document.querySelectorAll('.edit-user').forEach(btn => {
        btn.addEventListener('click', () => {
            const user = users.find(u => String(u.id) === String(btn.dataset.id));
            if (user) showUserModal(user, branches);
        });
    });

    document.querySelectorAll('.toggle-user').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.dataset.id;
            const isActive = btn.dataset.active === 'true';
            const action = isActive ? 'deactivate' : 'activate';
            const confirmed = await Modal.confirm(`Confirm ${action}`, `Are you sure you want to ${action} this user?`);
            if (confirmed) {
                try {
                    await apiPut(`/users/${id}`, { is_active: !isActive });
                    Toast.success(`User ${action}d successfully`);
                    renderAdminUsers();
                } catch (err) {
                    Toast.error(`Failed to ${action} user`);
                }
            }
        });
    });
}

function showUserModal(existing, branches) {
    const isEdit = !!existing;
    const html = `
        <form id="user-form" class="modal-form">
            <div class="form-row">
                <div class="form-group">
                    <label>First Name</label>
                    <input type="text" name="first_name" class="form-input" required value="${existing?.first_name || ''}">
                </div>
                <div class="form-group">
                    <label>Last Name</label>
                    <input type="text" name="last_name" class="form-input" required value="${existing?.last_name || ''}">
                </div>
            </div>
            <div class="form-group">
                <label>Email</label>
                <input type="email" name="email" class="form-input" required value="${existing?.email || ''}">
            </div>
            <div class="form-group">
                <label>PIN (4-digit)</label>
                <input type="text" name="pin" class="form-input" ${isEdit ? '' : 'required'} maxlength="4" pattern="\\d{4}" placeholder="${isEdit ? 'Leave blank to keep current' : '4-digit PIN'}">
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Role</label>
                    <select name="role" class="form-select" required>
                        <option value="employee" ${existing?.role === 'employee' ? 'selected' : ''}>Employee</option>
                        <option value="admin" ${existing?.role === 'admin' ? 'selected' : ''}>Admin</option>
                        ${Auth.getUserRole() === 'owner' ? `<option value="owner" ${existing?.role === 'owner' ? 'selected' : ''}>Owner</option>` : ''}
                    </select>
                </div>
                <div class="form-group">
                    <label>Branch</label>
                    <select name="branch_id" class="form-select" required>
                        ${branches.map(b => `<option value="${b.id}" ${String(existing?.branch_id) === String(b.id) ? 'selected' : ''}>${b.name}</option>`).join('')}
                    </select>
                </div>
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-outline" onclick="Modal.close()">Cancel</button>
                <button type="submit" class="btn btn-primary">${isEdit ? 'Update' : 'Create'}</button>
            </div>
        </form>
    `;
    Modal.show(isEdit ? 'Edit User' : 'Add User', html);

    document.getElementById('user-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = {
            first_name: formData.get('first_name'),
            last_name: formData.get('last_name'),
            email: formData.get('email'),
            role: formData.get('role'),
            branch_id: formData.get('branch_id')
        };
        const pin = formData.get('pin');
        if (pin) data.pin = pin;

        try {
            if (isEdit) {
                await apiPut(`/users/${existing.id}`, data);
                Toast.success('User updated successfully');
            } else {
                if (!pin) { Toast.error('PIN is required'); return; }
                await apiPost('/users', data);
                Toast.success('User created successfully');
            }
            Modal.close();
            renderAdminUsers();
        } catch (err) {
            Toast.error(err.message || 'Failed to save user');
        }
    });
}

Router.register('users', renderAdminUsers);
