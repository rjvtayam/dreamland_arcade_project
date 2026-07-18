async function renderAdminAttendance() {
    const app = document.getElementById('app');
    app.innerHTML = `<div class="layout">${renderSidebar()}<div class="main-content">${renderNavbar('Attendance Management')}<div class="page-content" id="page-body"><div style="text-align:center;padding:60px;"><div class="spinner"></div></div></div></div></div>`;
    document.getElementById('logout-btn')?.addEventListener('click', (e) => { e.preventDefault(); Auth.logout(); });

    try {
        const [records, branches] = await Promise.all([
            apiGet('/attendance'),
            apiGet('/branches')
        ]);

        const body = document.getElementById('page-body');
        body.innerHTML = `
            <div class="page-header">
                <h2>Attendance Records</h2>
            </div>
            <div class="filters-bar">
                <select class="form-select" id="filter-branch">
                    <option value="">All Branches</option>
                    ${branches.map(b => `<option value="${b.id}">${b.name}</option>`).join('')}
                </select>
                <input type="date" class="form-input" id="filter-date" value="${new Date().toISOString().slice(0, 10)}">
            </div>
            <div class="table-container">
                <table class="data-table" id="attendance-table">
                    <thead>
                        <tr>
                            <th>Employee</th>
                            <th>Branch</th>
                            <th>Date</th>
                            <th>Clock In</th>
                            <th>Clock Out</th>
                            <th>Hours</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody id="attendance-tbody">
                        ${renderAttendanceRows(records, branches)}
                    </tbody>
                </table>
            </div>
            ${records.length === 0 ? '<div class="empty-state"><p>No attendance records found</p></div>' : ''}
        `;

        const filterTable = async () => {
            const branchId = document.getElementById('filter-branch').value;
            const date = document.getElementById('filter-date').value;
            let url = '/attendance?';
            if (branchId) url += `branch_id=${branchId}&`;
            if (date) url += `date=${date}`;
            try {
                const filtered = await apiGet(url);
                document.getElementById('attendance-tbody').innerHTML = renderAttendanceRows(filtered, branches);
            } catch (err) {
                Toast.error('Failed to filter attendance');
            }
        };

        document.getElementById('filter-branch').addEventListener('change', filterTable);
        document.getElementById('filter-date').addEventListener('change', filterTable);

    } catch (err) {
        document.getElementById('page-body').innerHTML = `<div class="empty-state"><p>Failed to load attendance records</p></div>`;
    }
}

function renderAttendanceRows(records, branches) {
    if (records.length === 0) return '<tr><td colspan="7" class="empty-cell">No records found</td></tr>';
    return records.map(r => {
        const branchName = branches.find(b => String(b.id) === String(r.branch_id))?.name || '—';
        const statusColor = r.status === 'present' ? 'green' : r.status === 'late' ? 'yellow' : r.status === 'overtime' ? 'purple' : 'red';
        return `
            <tr>
                <td>
                    <div class="user-cell">
                        <div class="avatar avatar-sm">${getInitials(r.first_name, r.last_name)}</div>
                        <span>${r.first_name} ${r.last_name}</span>
                    </div>
                </td>
                <td>${branchName}</td>
                <td>${formatDate(r.date)}</td>
                <td>${r.clock_in ? formatTime(r.clock_in) : '—'}</td>
                <td>${r.clock_out ? formatTime(r.clock_out) : '—'}</td>
                <td>${r.hours_worked ? r.hours_worked.toFixed(1) + 'h' : '—'}</td>
                <td><span class="badge badge-${statusColor}">${r.status}</span></td>
            </tr>
        `;
    }).join('');
}

Router.register('attendance', renderAdminAttendance);
