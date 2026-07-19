async function renderAdminBranches() {
    const user = Auth.getUser();
    if (user && user.role !== 'owner') {
        Router.navigate('dashboard');
        Toast.error('Access denied. Owner only.');
        return;
    }
    const app = document.getElementById('app');
    app.innerHTML = `<div class="layout">${renderSidebar()}<div class="main-content">${renderNavbar('Branch Management')}<div class="page-content" id="page-body"><div style="text-align:center;padding:60px;"><div class="spinner"></div></div></div></div></div>`;
    document.getElementById('logout-btn')?.addEventListener('click', (e) => { e.preventDefault(); Auth.logout(); });

    try {
        const branches = await apiGet('/branches');
        const body = document.getElementById('page-body');
        body.innerHTML = `
            <div class="page-header">
                <h2>Branches</h2>
                <button class="btn btn-primary" id="add-branch-btn">+ Add Branch</button>
            </div>
            <div class="table-container">
                <table class="data-table" id="branches-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>City</th>
                            <th>Location</th>
                            <th>Phone</th>
                            <th>Employees</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${branches.map(b => `
                            <tr>
                                <td><strong>${b.name}</strong></td>
                                <td>${b.city || '—'}</td>
                                <td>${b.location || '—'}</td>
                                <td>${b.phone || '—'}</td>
                                <td>${b.employee_count ?? 0}</td>
                                <td><span class="badge badge-${b.is_active ? 'green' : 'red'}">${b.is_active ? 'Active' : 'Inactive'}</span></td>
                                <td class="actions-cell">
                                    <button class="btn btn-sm btn-outline edit-branch" data-id="${b.id}" data-name="${b.name}" data-city="${b.city || ''}" data-location="${b.location || ''}" data-phone="${b.phone || ''}">Edit</button>
                                    <button class="btn btn-sm btn-outline btn-danger delete-branch" data-id="${b.id}" data-active="${b.is_active}">${b.is_active ? 'Deactivate' : 'Activate'}</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            ${branches.length === 0 ? '<div class="empty-state"><p>No branches found</p></div>' : ''}
        `;

        document.getElementById('add-branch-btn').addEventListener('click', () => showBranchModal());

        body.querySelectorAll('.edit-branch').forEach(btn => {
            btn.addEventListener('click', () => {
                showBranchModal({
                    id: btn.dataset.id,
                    name: btn.dataset.name,
                    city: btn.dataset.city,
                    location: btn.dataset.location,
                    phone: btn.dataset.phone
                });
            });
        });

        body.querySelectorAll('.delete-branch').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.dataset.id;
                const isActive = btn.dataset.active === 'true';
                const action = isActive ? 'deactivate' : 'activate';
                const confirmed = await Modal.confirm(`Confirm ${action}`, `Are you sure you want to ${action} this branch?`);
                if (confirmed) {
                    try {
                        await apiPut(`/branches/${id}`, { is_active: !isActive });
                        Toast.success(`Branch ${action}d successfully`);
                        renderAdminBranches();
                    } catch (err) {
                        Toast.error(`Failed to ${action} branch`);
                    }
                }
            });
        });

    } catch (err) {
        document.getElementById('page-body').innerHTML = `<div class="empty-state"><p>Failed to load branches</p></div>`;
    }
}

function showBranchModal(existing) {
    const isEdit = !!existing;
    const html = `
        <form id="branch-form" class="modal-form">
            <div class="form-group">
                <label>Branch Name</label>
                <input type="text" name="name" class="form-input" required value="${existing?.name || ''}" placeholder="e.g. Main Branch">
            </div>
            <div class="form-group">
                <label>Location</label>
                <input type="text" name="location" class="form-input" value="${existing?.location || ''}" placeholder="e.g. 123 Main St">
            </div>
            <div class="form-group">
                <label>City</label>
                <input type="text" name="city" class="form-input" value="${existing?.city || ''}" placeholder="e.g. Manila">
            </div>
            <div class="form-group">
                <label>Phone</label>
                <input type="text" name="phone" class="form-input" value="${existing?.phone || ''}" placeholder="e.g. 09171234567">
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-outline" onclick="Modal.close()">Cancel</button>
                <button type="submit" class="btn btn-primary">${isEdit ? 'Update' : 'Create'}</button>
            </div>
        </form>
    `;
    Modal.show(isEdit ? 'Edit Branch' : 'Add Branch', html);

    document.getElementById('branch-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = {
            name: formData.get('name'),
            location: formData.get('location'),
            city: formData.get('city'),
            phone: formData.get('phone')
        };
        try {
            if (isEdit) {
                await apiPut(`/branches/${existing.id}`, data);
                Toast.success('Branch updated successfully');
            } else {
                await apiPost('/branches', data);
                Toast.success('Branch created successfully');
            }
            Modal.close();
            renderAdminBranches();
        } catch (err) {
            Toast.error(err.message || 'Failed to save branch');
        }
    });
}

Router.register('branches', renderAdminBranches);
