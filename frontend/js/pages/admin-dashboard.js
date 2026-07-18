async function renderAdminDashboard() {
    const user = Auth.getUser();
    if (user && user.role !== 'admin' && user.role !== 'owner') {
        renderEmployeeDashboard();
        return;
    }

    const app = document.getElementById('app');
    app.innerHTML = `<div class="layout">${renderSidebar()}<div class="main-content">${renderNavbar('Dashboard')}<div class="page-content" id="page-body"><div style="text-align:center;padding:60px;"><div class="spinner"></div></div></div></div></div>`;
    document.getElementById('logout-btn')?.addEventListener('click', (e) => { e.preventDefault(); Auth.logout(); });

    try {
        const [stats, branches] = await Promise.all([
            apiGet('/reports/dashboard'),
            apiGet('/branches')
        ]);

        const body = document.getElementById('page-body');
        body.innerHTML = `
            <div class="branch-tabs">
                <button class="branch-tab active" data-branch="all">All Branches</button>
                ${branches.map(b => `<button class="branch-tab" data-branch="${b.id}">${b.name}</button>`).join('')}
            </div>
            <div class="stats-grid">
                <div class="stat-card cyan">
                    <div class="stat-icon cyan">👥</div>
                    <div class="stat-value">${stats.total_employees}</div>
                    <div class="stat-label">Total Employees</div>
                </div>
                <div class="stat-card green">
                    <div class="stat-icon green">✓</div>
                    <div class="stat-value">${stats.today_attendance}</div>
                    <div class="stat-label">Today's Attendance (${stats.attendance_rate}%)</div>
                </div>
                <div class="stat-card yellow">
                    <div class="stat-icon yellow">📦</div>
                    <div class="stat-value">${stats.low_stock_count}</div>
                    <div class="stat-label">Low Stock Items</div>
                </div>
                <div class="stat-card magenta">
                    <div class="stat-icon magenta">💰</div>
                    <div class="stat-value">${formatCurrency(stats.today_sales)}</div>
                    <div class="stat-label">Today's Sales (${stats.today_transactions} txns)</div>
                </div>
            </div>
        `;

        body.querySelectorAll('.branch-tab').forEach(tab => {
            tab.addEventListener('click', async () => {
                body.querySelectorAll('.branch-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                const branchId = tab.dataset.branch === 'all' ? null : tab.dataset.branch;
                const url = branchId ? `/reports/dashboard?branch_id=${branchId}` : '/reports/dashboard';
                const newStats = await apiGet(url);
                const cards = body.querySelectorAll('.stat-value');
                if (cards.length >= 4) {
                    cards[0].textContent = newStats.total_employees;
                    cards[1].textContent = newStats.today_attendance;
                    cards[2].textContent = newStats.low_stock_count;
                    cards[3].textContent = formatCurrency(newStats.today_sales);
                }
            });
        });

    } catch (err) {
        document.getElementById('page-body').innerHTML = `<div class="empty-state"><p>Failed to load dashboard</p></div>`;
    }
}
Router.register('dashboard', renderAdminDashboard);
