async function renderAdminDashboard() {
    const user = Auth.getUser();
    if (user && user.role !== 'admin' && user.role !== 'owner') {
        renderEmployeeDashboard();
        return;
    }

    const app = document.getElementById('app');
    app.innerHTML = `<div class="layout">${renderSidebar()}<div class="main-content">${renderNavbar('Dashboard')}<div class="page-content" id="page-body"><div style="text-align:center;padding:60px;"><div class="spinner"></div></div></div></div></div>`;
    document.getElementById('logout-btn')?.addEventListener('click', (e) => { e.preventDefault(); Auth.logout(); });
    initNavbarNotifications();

    try {
        const isAdmin = user.role === 'admin';
        const userBranchId = isAdmin ? user.branch_id : null;
        const dashUrl = isAdmin && userBranchId ? `/reports/dashboard?branch_id=${userBranchId}` : '/reports/dashboard';
        const summaryUrl = isAdmin && userBranchId ? `/sales/summary?period=daily&branch_id=${userBranchId}` : '/sales/summary?period=daily';
        const comparisonUrl = isAdmin && userBranchId ? `/sales/comparison?period=daily&branch_id=${userBranchId}` : '/sales/comparison?period=daily';
        const deletedUrl = '/recycle-bin';
        const todayStr = new Date().toISOString().slice(0, 10);
        const attendanceUrl = isAdmin && userBranchId ? `/attendance?branch_id=${userBranchId}&target_date=${todayStr}` : `/attendance?target_date=${todayStr}`;
        const [stats, branches, attendanceRes, salesSummary, deletedRes, comparisonData, emailUnreadRes] = await Promise.all([
            apiGet(dashUrl),
            apiGet('/branches'),
            apiGet(attendanceUrl).catch(() => []),
            apiGet(summaryUrl).catch(() => []),
            apiGet(deletedUrl).catch(() => []),
            apiGet(comparisonUrl).catch(() => null),
            apiGet('/emails/unread-count').catch(() => ({count: 0}))
        ]);

        const body = document.getElementById('page-body');
        const records = Array.isArray(attendanceRes) ? attendanceRes : [];
        const lastSeen = localStorage.getItem('bin_last_seen');
        const newItems = Array.isArray(deletedRes) ? deletedRes.filter(item => {
            if (!lastSeen) return true;
            return new Date(item.deleted_at) > new Date(lastSeen);
        }) : [];
        const deletedCount = newItems.length;
        const emailUnreadCount = emailUnreadRes.count || 0;

        body.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;flex-wrap:wrap;gap:12px;">
                <div>
                    <h2 style="color:#fff;margin:0 0 4px 0;font-size:1.4rem;">Welcome back, ${user.first_name || ''}!</h2>
                    <p style="color:#888;margin:0;font-size:0.85rem;">${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                <div style="display:flex;gap:8px;align-items:center;">
                    <button id="dash-msg-btn" title="Messages" style="position:relative;background:#1a1f2e;border:1px solid #30363d;border-radius:8px;padding:8px 10px;color:#94a3b8;cursor:pointer;display:flex;align-items:center;transition:all 0.2s;" onmouseenter="this.style.borderColor=#6366f1;this.style.color=#a78bfa" onmouseleave="this.style.borderColor=#30363d;this.style.color=#94a3b8">
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>
                    </button>
                    <button id="dash-notif-btn" title="Notifications" style="position:relative;background:#1a1f2e;border:1px solid #30363d;border-radius:8px;padding:8px 10px;color:#94a3b8;cursor:pointer;display:flex;align-items:center;transition:all 0.2s;" onmouseenter="this.style.borderColor=#6366f1;this.style.color=#a78bfa" onmouseleave="this.style.borderColor=#30363d;this.style.color=#94a3b8">
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
                    </button>
                    <button id="dash-email-btn" title="Email" onclick="window.location.hash='email'" style="position:relative;background:#1a1f2e;border:1px solid #30363d;border-radius:8px;padding:8px 10px;color:#94a3b8;cursor:pointer;display:flex;align-items:center;transition:all 0.2s;" onmouseenter="this.style.borderColor=#6366f1;this.style.color=#a78bfa" onmouseleave="this.style.borderColor=#30363d;this.style.color=#94a3b8">
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                        ${emailUnreadCount > 0 ? '<span id="dash-email-badge" style="position:absolute;top:-4px;right:-4px;background:#8b5cf6;color:#fff;font-size:0.6rem;font-weight:700;border-radius:50%;min-width:16px;height:16px;display:flex;align-items:center;justify-content:center;padding:0 4px;">' + emailUnreadCount + '</span>' : ''}
                    </button>
                    <button id="dash-bin-btn" title="Deleted Reports" style="position:relative;background:#1a1f2e;border:1px solid #30363d;border-radius:8px;padding:8px 10px;color:#94a3b8;cursor:pointer;display:flex;align-items:center;transition:all 0.2s;" onmouseenter="this.style.borderColor=#ef4444;this.style.color=#f87171" onmouseleave="this.style.borderColor=#30363d;this.style.color=#94a3b8">
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                        ${deletedCount > 0 ? '<span id="dash-bin-badge" style="position:absolute;top:-4px;right:-4px;background:#ef4444;color:#fff;font-size:0.6rem;font-weight:700;border-radius:50%;min-width:16px;height:16px;display:flex;align-items:center;justify-content:center;padding:0 4px;">' + deletedCount + '</span>' : ''}
                    </button>
                    <button id="dash-refresh" style="background:#1a1f2e;border:1px solid #30363d;border-radius:8px;padding:8px 14px;color:#94a3b8;font-size:0.8rem;cursor:pointer;display:flex;align-items:center;gap:6px;transition:all 0.2s;" onmouseenter="this.style.borderColor=#6366f1;this.style.color=#a78bfa" onmouseleave="this.style.borderColor=#30363d;this.style.color=#94a3b8">
                        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                        Refresh
                    </button>
                </div>
            </div>

            ${isAdmin ? '' :
            `<div class="branch-tabs" style="margin-bottom:20px;">
                <button class="branch-tab active" data-branch="all">All Branches</button>
                ${branches.map(b => `<button class="branch-tab" data-branch="${b.id}">${b.name}</button>`).join('')}
            </div>`}

            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px;margin-bottom:24px;">
                <div class="dash-stat-card" style="background:linear-gradient(135deg,#0f172a,#1e293b);border:1px solid #1e293b;border-radius:14px;padding:18px;position:relative;overflow:hidden;transition:all 0.3s;" onmouseenter="this.style.borderColor=#334155;this.style.transform='translateY(-2px)'" onmouseleave="this.style.borderColor=#1e293b;this.style.transform=''">
                    <div style="position:absolute;top:-15px;right:-15px;width:60px;height:60px;border-radius:50%;background:rgba(99,102,241,0.08);"></div>
                    <div style="color:#64748b;font-size:0.7rem;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Total Employees</div>
                    <div class="dash-stat-value" data-field="total_employees" style="color:#a78bfa;font-size:1.8rem;font-weight:700;">${stats.total_employees}</div>
                </div>
                <div class="dash-stat-card" style="background:linear-gradient(135deg,#0f172a,#1e293b);border:1px solid #1e293b;border-radius:14px;padding:18px;position:relative;overflow:hidden;transition:all 0.3s;" onmouseenter="this.style.borderColor=#334155;this.style.transform='translateY(-2px)'" onmouseleave="this.style.borderColor=#1e293b;this.style.transform=''">
                    <div style="position:absolute;top:-15px;right:-15px;width:60px;height:60px;border-radius:50%;background:rgba(34,197,94,0.08);"></div>
                    <div style="color:#64748b;font-size:0.7rem;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Present Today</div>
                    <div class="dash-stat-value" data-field="today_attendance" style="color:#4ade80;font-size:1.8rem;font-weight:700;">${stats.today_attendance}</div>
                    <div class="dash-stat-sub" style="color:#475569;font-size:0.75rem;margin-top:2px;">${stats.attendance_rate}% rate</div>
                </div>
                <div class="dash-stat-card" style="background:linear-gradient(135deg,#0f172a,#1e293b);border:1px solid #1e293b;border-radius:14px;padding:18px;position:relative;overflow:hidden;transition:all 0.3s;" onmouseenter="this.style.borderColor=#334155;this.style.transform='translateY(-2px)'" onmouseleave="this.style.borderColor=#1e293b;this.style.transform=''">
                    <div style="position:absolute;top:-15px;right:-15px;width:60px;height:60px;border-radius:50%;background:rgba(245,158,11,0.08);"></div>
                    <div style="color:#64748b;font-size:0.7rem;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Today's Sales</div>
                    <div class="dash-stat-value" data-field="today_sales" style="color:#fbbf24;font-size:1.8rem;font-weight:700;">${formatCurrency(stats.today_sales)}</div>
                    <div class="dash-stat-sub" style="color:#475569;font-size:0.75rem;margin-top:2px;">${stats.today_transactions} transactions</div>
                </div>
                <div class="dash-stat-card" style="background:linear-gradient(135deg,#0f172a,#1e293b);border:1px solid #1e293b;border-radius:14px;padding:18px;position:relative;overflow:hidden;transition:all 0.3s;" onmouseenter="this.style.borderColor=#334155;this.style.transform='translateY(-2px)'" onmouseleave="this.style.borderColor=#1e293b;this.style.transform=''">
                    <div style="position:absolute;top:-15px;right:-15px;width:60px;height:60px;border-radius:50%;background:rgba(239,68,68,0.08);"></div>
                    <div style="color:#64748b;font-size:0.7rem;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Low Stock</div>
                    <div class="dash-stat-value" data-field="low_stock_count" style="color:#f87171;font-size:1.8rem;font-weight:700;">${stats.low_stock_count}</div>
                </div>
            </div>

            <div style="display:grid;grid-template-columns:2fr 1fr;gap:16px;margin-bottom:24px;">
                <div style="background:#0f172a;border:1px solid #1e293b;border-radius:14px;padding:20px;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
                        <div style="display:flex;align-items:center;gap:10px;">
                            <div style="color:#e2e8f0;font-weight:600;font-size:0.95rem;">Sales Overview</div>
                            <span id="sales-chart-change"></span>
                        </div>
                        <div style="display:flex;gap:6px;">
                            <button class="chart-period active" data-period="daily" style="padding:4px 10px;border-radius:6px;border:1px solid #30363d;background:#1a1f2e;color:#94a3b8;font-size:0.7rem;cursor:pointer;">Daily</button>
                            <button class="chart-period" data-period="weekly" style="padding:4px 10px;border-radius:6px;border:1px solid #30363d;background:transparent;color:#64748b;font-size:0.7rem;cursor:pointer;">Weekly</button>
                            <button class="chart-period" data-period="monthly" style="padding:4px 10px;border-radius:6px;border:1px solid #30363d;background:transparent;color:#64748b;font-size:0.7rem;cursor:pointer;">Monthly</button>
                        </div>
                    </div>
                    <div style="position:relative;height:250px;"><canvas id="sales-chart"></canvas></div>
                </div>
                <div style="background:#0f172a;border:1px solid #1e293b;border-radius:14px;padding:20px;">
                    <div style="color:#e2e8f0;font-weight:600;font-size:0.95rem;margin-bottom:16px;">Sales by Area</div>
                    <div style="position:relative;height:250px;"><canvas id="area-chart"></canvas></div>
                </div>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
                <div style="background:#0f172a;border:1px solid #1e293b;border-radius:14px;padding:20px;">
                    <div style="color:#e2e8f0;font-weight:600;font-size:0.95rem;margin-bottom:16px;">Recent Attendance</div>
                    <div id="dash-attendance-list" style="max-height:260px;overflow-y:auto;"></div>
                </div>
                <div style="background:#0f172a;border:1px solid #1e293b;border-radius:14px;padding:20px;">
                    <div style="color:#e2e8f0;font-weight:600;font-size:0.95rem;margin-bottom:16px;">Token Sales Trend</div>
                    <div style="position:relative;height:220px;"><canvas id="token-chart"></canvas></div>
                </div>
            </div>
        `;

        initCharts(stats, salesSummary, comparisonData);
        renderRecentAttendance(records);
        if (!isAdmin) initBranchTabs();
        initPeriodButtons(user);

        document.getElementById('dash-refresh').addEventListener('click', () => renderAdminDashboard());
        NotificationCenter.bindDashboardButtons();

        document.getElementById('dash-bin-btn')?.addEventListener('click', () => {
            localStorage.setItem('bin_last_seen', new Date().toISOString());
            const badge = document.getElementById('dash-bin-badge');
            if (badge) badge.remove();
            openDeletedPanel();
        });

    } catch (err) {
        document.getElementById('page-body').innerHTML = `<div class="empty-state"><p>Failed to load dashboard</p></div>`;
    }
}

window.__salesChart = null;

function initCharts(stats, salesSummary, comparisonData) {
    const chartDefaults = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
            x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#64748b', font: { size: 10 } } },
                y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#64748b', font: { size: 10 } } }
        }
    };

    const cmp = comparisonData && comparisonData.labels ? comparisonData : null;
    const labels = cmp ? cmp.labels : ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    const currentValues = cmp ? cmp.current : [1200,1900,1500,2200,1800,2400,2100];
    const prevValues = cmp ? cmp.previous : [1000,1600,1400,1900,1700,2100,1800];

    const changePct = cmp ? cmp.change_pct : 0;
    const changeColor = changePct >= 0 ? '#4ade80' : '#f87171';
    const changeIcon = changePct >= 0 ? '&#9650;' : '&#9660;';
    const changeEl = document.getElementById('sales-chart-change');
    if (changeEl) {
        changeEl.innerHTML = '<span style="color:' + changeColor + ';font-size:0.75rem;font-weight:600;">' + changeIcon + ' ' + Math.abs(changePct) + '% vs prev</span>';
    }

    if (window.__salesChart) window.__salesChart.destroy();
    window.__salesChart = new Chart(document.getElementById('sales-chart'), {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'This Period',
                    data: currentValues,
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99,102,241,0.1)',
                    fill: true,
                    tension: 0.4,
                    borderWidth: 2,
                    pointRadius: 4,
                    pointBackgroundColor: '#6366f1',
                    pointBorderColor: '#0f172a',
                    pointBorderWidth: 2
                },
                {
                    label: 'Previous Period',
                    data: prevValues,
                    borderColor: '#475569',
                    backgroundColor: 'rgba(71,85,105,0.05)',
                    fill: false,
                    tension: 0.4,
                    borderWidth: 1.5,
                    borderDash: [5, 5],
                    pointRadius: 3,
                    pointBackgroundColor: '#475569',
                    pointBorderColor: '#0f172a',
                    pointBorderWidth: 1
                }
            ]
        },
        options: {
            ...chartDefaults,
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        color: '#94a3b8',
                        padding: 12,
                        usePointStyle: true,
                        pointStyle: 'line',
                        font: { size: 10 }
                    }
                }
            },
            scales: {
                ...chartDefaults.scales,
                y: {
                    ...chartDefaults.scales.y,
                    ticks: { ...chartDefaults.scales.y.ticks, callback: function(v) { return '₱' + v.toLocaleString(); } }
                }
            }
        }
    });

    const areaData = stats.area_sales || { Arcade: 500, Playhouse: 300, Cafe: 200 };
    new Chart(document.getElementById('area-chart'), {
        type: 'doughnut',
        data: {
            labels: Object.keys(areaData),
            datasets: [{
                data: Object.values(areaData),
                backgroundColor: ['#6366f1', '#22c55e', '#f59e0b'],
                borderColor: '#0f172a',
                borderWidth: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', padding: 12, usePointStyle: true, pointStyle: 'circle', font: { size: 11 } } } },
            cutout: '65%'
        }
    });

    const tokenData = stats.token_sales || {};
    const tokenKeys = Object.keys(tokenData);
    const tokenColors = tokenKeys.map(function(k) {
        if (k === 'Smash') return 'rgba(245,158,11,0.7)';
        if (k === 'Extra') return 'rgba(239,68,68,0.7)';
        if (k.includes('50')) return 'rgba(99,102,241,0.7)';
        if (k.includes('100')) return 'rgba(139,92,246,0.7)';
        if (k.includes('150')) return 'rgba(168,85,247,0.7)';
        if (k.includes('250')) return 'rgba(192,132,252,0.7)';
        return 'rgba(99,102,241,0.7)';
    });
    const tokenBorders = tokenKeys.map(function(k) {
        if (k === 'Smash') return '#f59e0b';
        if (k === 'Extra') return '#ef4444';
        if (k.includes('50')) return '#6366f1';
        if (k.includes('100')) return '#8b5cf6';
        if (k.includes('150')) return '#a855f7';
        if (k.includes('250')) return '#c084fc';
        return '#6366f1';
    });
    new Chart(document.getElementById('token-chart'), {
        type: 'bar',
        data: {
            labels: tokenKeys.map(k => k === 'Smash' ? 'Smash' : k === 'Extra' ? 'Extra' : k),
            datasets: [{
                data: tokenKeys.map(k => tokenData[k]),
                backgroundColor: tokenColors,
                borderColor: tokenBorders,
                borderWidth: 1,
                borderRadius: 6
            }]
        },
        options: chartDefaults
    });
}

function renderRecentAttendance(records) {
    const container = document.getElementById('dash-attendance-list');
    if (!container) return;
    const recent = records.slice(0, 8);
    if (recent.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:20px;color:#475569;font-size:0.85rem;">No attendance records today</div>';
        return;
    }
    container.innerHTML = recent.map(r => {
        const name = r.user_name || '—';
        const initials = name !== '—' ? name.split(' ').map(w => w[0]).join('').substring(0,2).toUpperCase() : '?';
        const statusColor = r.status === 'present' ? '#22c55e' : r.status === 'late' ? '#f59e0b' : '#ef4444';
        const time = r.clock_in ? new Date(r.clock_in).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', hour12: true }) : '—';
        return '<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #1e293b;">' +
            '<div style="width:32px;height:32px;border-radius:8px;background:linear-gradient(135deg,#6366f1,#8b5cf6);display:flex;align-items:center;justify-content:center;color:#fff;font-size:0.65rem;font-weight:700;">' + initials + '</div>' +
            '<div style="flex:1;min-width:0;"><div style="color:#e2e8f0;font-size:0.8rem;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + name + '</div></div>' +
            '<div style="color:#64748b;font-size:0.75rem;">' + time + '</div>' +
            '<div style="width:8px;height:8px;border-radius:50%;background:' + statusColor + ';"></div>' +
        '</div>';
    }).join('');
}

function initBranchTabs() {
    document.querySelectorAll('.branch-tab').forEach(tab => {
        tab.addEventListener('click', async () => {
            document.querySelectorAll('.branch-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const branchId = tab.dataset.branch === 'all' ? null : tab.dataset.branch;
            const url = branchId ? `/reports/dashboard?branch_id=${branchId}` : '/reports/dashboard';
            try {
                const newStats = await apiGet(url);
                document.querySelectorAll('.dash-stat-value').forEach(el => {
                    const field = el.dataset.field;
                    if (field && newStats[field] !== undefined) {
                        if (field === 'today_sales') el.textContent = formatCurrency(newStats[field]);
                        else el.textContent = newStats[field];
                    }
                });
                document.querySelectorAll('.dash-stat-sub').forEach(el => {
                    if (el.previousElementSibling && el.previousElementSibling.dataset.field === 'today_attendance') {
                        el.textContent = newStats.attendance_rate + '% rate';
                    } else if (el.previousElementSibling && el.previousElementSibling.dataset.field === 'today_sales') {
                        el.textContent = newStats.today_transactions + ' transactions';
                    }
                });
            } catch(e) {}
        });
    });
}

async function openDeletedPanel() {
    const existing = document.getElementById('bin-panel');
    if (existing) { existing.remove(); return; }

    const panel = document.createElement('div');
    panel.id = 'bin-panel';
    panel.className = 'nc-panel';
    document.body.appendChild(panel);

    var moduleConfig = {
        proposals: { color: '#f59e0b', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', label: 'Proposals' },
        tracking: { color: '#6366f1', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', label: 'Tracking' },
        announcements: { color: '#22c55e', icon: 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z', label: 'Announcements' },
        files: { color: '#3b82f6', icon: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z', label: 'Files' }
    };

    panel.innerHTML = '<div class="nc-panel-inner">' +
        '<div class="nc-header">' +
            '<div style="display:flex;align-items:center;gap:10px;">' +
                '<div style="width:32px;height:32px;border-radius:8px;background:rgba(239,68,68,0.1);display:flex;align-items:center;justify-content:center;">' +
                    '<svg width="16" height="16" fill="none" stroke="#ef4444" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>' +
                '</div>' +
                '<div>' +
                    '<div style="color:#e2e8f0;font-weight:700;font-size:1rem;">Recycle Bin</div>' +
                    '<div style="color:#ef4444;font-size:0.6rem;text-transform:uppercase;letter-spacing:1px;margin-top:1px;">Deleted Items from Across System</div>' +
                '</div>' +
            '</div>' +
            '<button id="bin-close" class="nc-close">&times;</button>' +
        '</div>' +
        '<div id="bin-filters" class="nc-tabs" style="padding:0 16px;border-bottom:1px solid rgba(30,58,95,0.2);"></div>' +
        '<div id="bin-body" class="nc-body">' +
            '<div style="text-align:center;padding:40px;"><div class="spinner"></div></div>' +
        '</div>' +
    '</div>';

    panel.querySelector('#bin-close').onclick = function() {
        panel.classList.remove('nc-panel-open');
        panel.classList.add('nc-panel-closing');
        setTimeout(function() { panel.remove(); }, 200);
    };

    requestAnimationFrame(function() { panel.classList.add('nc-panel-open'); });

    var outsideClick = function(e) {
        var p = document.getElementById('bin-panel');
        if (!p) { document.removeEventListener('click', outsideClick, true); return; }
        if (p.contains(e.target)) return;
        if (e.target.closest('#dash-bin-btn')) return;
        panel.classList.remove('nc-panel-open');
        panel.classList.add('nc-panel-closing');
        setTimeout(function() { panel.remove(); }, 200);
        document.removeEventListener('click', outsideClick, true);
    };
    setTimeout(function() { document.addEventListener('click', outsideClick, true); }, 0);

    var body = panel.querySelector('#bin-body');
    var filtersEl = panel.querySelector('#bin-filters');
    var currentFilter = '';
    var allItems = [];



    function renderBinItem(item) {
        var mc = moduleConfig[item.source_module] || { color: '#94a3b8', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4', label: item.source_module || 'Unknown' };
        var meta = item.metadata || {};
        var detailParts = [];

        if (item.source_module === 'proposals') {
            if (meta.area) {
                var ac = meta.area === 'Arcade' ? '#6366f1' : meta.area === 'Playhouse' ? '#22c55e' : '#f59e0b';
                detailParts.push('<span style="color:' + ac + ';">' + esc(meta.area) + '</span>');
            }
            if (meta.proposal_month) detailParts.push('<span style="color:#64748b;">' + esc(meta.proposal_month) + '</span>');
            if (meta.status) detailParts.push('<span style="color:#64748b;">' + esc(meta.status) + '</span>');
            if (meta.amount !== undefined && meta.amount !== null) detailParts.push('<span style="color:#22c55e;">' + formatCurrency(meta.amount) + '</span>');
        } else if (item.source_module === 'tracking') {
            if (meta.area) {
                var tc = meta.area === 'Arcade' ? '#6366f1' : meta.area === 'Playhouse' ? '#22c55e' : '#f59e0b';
                detailParts.push('<span style="color:' + tc + ';">' + esc(meta.area) + '</span>');
            }
            if (meta.sheet_date) detailParts.push('<span style="color:#64748b;">' + esc(meta.sheet_date) + '</span>');
            if (meta.total_sales !== undefined) detailParts.push('<span style="color:#22c55e;">' + formatCurrency(meta.total_sales) + '</span>');
        }

        var details = detailParts.join(' <span style="color:#334155;">&middot;</span> ');

        return '<div class="nc-notif-item" style="cursor:default;padding:14px 16px;">' +
            '<div class="nc-notif-icon" style="background:' + mc.color + '18;border:1px solid ' + mc.color + '33;">' +
                '<svg width="16" height="16" fill="none" stroke="' + mc.color + '" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="' + mc.icon + '"/></svg>' +
            '</div>' +
            '<div class="nc-notif-content">' +
                '<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">' +
                    '<span style="background:' + mc.color + '18;color:' + mc.color + ';padding:2px 8px;border-radius:10px;font-size:0.55rem;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;border:1px solid ' + mc.color + '33;">' + mc.label + '</span>' +
                    '<span style="color:#ef4444;font-size:0.55rem;background:rgba(239,68,68,0.1);padding:2px 7px;border-radius:10px;font-weight:600;">DELETED</span>' +
                '</div>' +
                '<div class="nc-notif-title" style="font-size:0.82rem;line-height:1.3;margin-bottom:4px;">' + esc(item.title) + '</div>' +
                (details ? '<div style="margin-bottom:4px;">' + details + '</div>' : '') +
                '<div class="nc-notif-meta">' +
                    (item.deleted_by_name ? '<span>Deleted by ' + esc(item.deleted_by_name) + '</span> &middot; ' : '') +
                    '<span>' + timeAgo(item.deleted_at) + '</span>' +
                '</div>' +
                '<div style="display:flex;gap:6px;margin-top:10px;">' +
                    '<button onclick="window.__binRestore(\'' + item.source_module + '\',' + item.source_id + ')" style="padding:5px 12px;border:none;border-radius:6px;background:linear-gradient(135deg,#065f46,#059669);color:#fff;font-size:0.7rem;font-weight:600;cursor:pointer;transition:all 0.2s;" onmouseenter="this.style.boxShadow=\'0 0 12px rgba(5,150,105,0.3)\'" onmouseleave="this.style.boxShadow=\'none\'">Restore</button>' +
                    '<button onclick="window.__binPermDelete(' + item.id + ')" style="padding:5px 12px;border:none;border-radius:6px;background:linear-gradient(135deg,#991b1b,#dc2626);color:#fff;font-size:0.7rem;font-weight:600;cursor:pointer;transition:all 0.2s;" onmouseenter="this.style.boxShadow=\'0 0 12px rgba(220,38,38,0.3)\'" onmouseleave="this.style.boxShadow=\'none\'">Delete</button>' +
                '</div>' +
            '</div>' +
        '</div>';
    }

    function renderTabs() {
        var modules = {};
        allItems.forEach(function(it) {
            if (!modules[it.source_module]) modules[it.source_module] = 0;
            modules[it.source_module]++;
        });

        filtersEl.innerHTML = '<button class="nc-tab' + (!currentFilter ? ' active' : '') + '" data-filter="">All <span style="background:rgba(255,255,255,0.08);padding:1px 7px;border-radius:10px;font-size:0.6rem;margin-left:4px;">' + allItems.length + '</span></button>' +
            Object.keys(modules).map(function(m) {
                var mc = moduleConfig[m] || { color: '#94a3b8', label: m };
                var isActive = currentFilter === m;
                return '<button class="nc-tab' + (isActive ? ' active' : '') + '" data-filter="' + m + '" style="' + (isActive ? 'color:' + mc.color + ';' : '') + '">' +
                    mc.label + ' <span style="background:' + mc.color + '22;color:' + mc.color + ';padding:1px 7px;border-radius:10px;font-size:0.6rem;margin-left:4px;">' + modules[m] + '</span></button>';
            }).join('');

        filtersEl.querySelectorAll('.nc-tab').forEach(function(btn) {
            btn.onclick = function() {
                currentFilter = btn.dataset.filter || '';
                renderTabs();
                renderList();
            };
        });
    }

    function renderList() {
        var filtered = currentFilter ? allItems.filter(function(it) { return it.source_module === currentFilter; }) : allItems;

        if (filtered.length === 0) {
            body.innerHTML = '<div class="nc-empty"><svg width="32" height="32" fill="none" stroke="#334155" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg><p style="color:#64748b;">Trash is empty</p></div>';
            return;
        }

        body.innerHTML = '<div class="nc-list">' + filtered.map(renderBinItem).join('') + '</div>';
    }

    async function loadBinItems() {
        body.innerHTML = '<div style="text-align:center;padding:40px;"><div class="spinner"></div></div>';

        try {
            allItems = await apiGet('/recycle-bin');
            if (!Array.isArray(allItems)) allItems = [];

            renderTabs();
            renderList();

            window.__binRestore = async function(module, sourceId) {
                if (!await confirmAsync('Restore this ' + module + ' item?', 'Restore', 'info')) return;
                try {
                    if (module === 'proposals') {
                        await apiPost('/proposals/' + sourceId + '/restore', {});
                    } else if (module === 'tracking') {
                        await apiPost('/tracking-sheets/' + sourceId + '/restore', {});
                    }
                    Toast.success('Restored');
                    panel.remove();
                    renderAdminDashboard();
                } catch (e) { Toast.error(e.message || 'Failed to restore'); }
            };

            window.__binPermDelete = async function(binId) {
                if (!await confirmAsync('Permanently delete this item? This cannot be undone.', 'Delete', 'danger')) return;
                try {
                    await apiDelete('/recycle-bin/' + binId);
                    Toast.success('Permanently deleted');
                    allItems = allItems.filter(function(it) { return it.id !== binId; });
                    renderTabs();
                    renderList();
                } catch (e) { Toast.error(e.message || 'Failed to delete'); }
            };
        } catch (e) {
            body.innerHTML = '<div class="nc-empty"><p style="color:#64748b;">Failed to load deleted items</p></div>';
        }
    }

    loadBinItems();
}

function renderEmployeeDashboard() {
    const user = Auth.getUser();
    const app = document.getElementById('app');
    app.innerHTML = `<div class="layout">${renderSidebar()}<div class="main-content">${renderNavbar('Dashboard')}<div class="page-content" id="page-body"><div style="text-align:center;padding:60px;"><div class="spinner"></div></div></div></div></div>`;
    document.getElementById('logout-btn')?.addEventListener('click', (e) => { e.preventDefault(); Auth.logout(); });
    initNavbarNotifications();

    apiGet('/attendance/my').then(records => {
        const body = document.getElementById('page-body');
        const today = new Date().toISOString().slice(0, 10);
        const todayRecord = records.find(r => r.clock_in && r.clock_in.slice(0, 10) === today);
        const isClockedIn = todayRecord && !todayRecord.clock_out;
        const initials = ((user.first_name || '')[0] || '') + ((user.last_name || '')[0] || '');

        body.innerHTML = `
            <div style="text-align:center;padding:40px 20px;">
                <div style="width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#8b5cf6);display:flex;align-items:center;justify-content:center;color:#fff;font-size:1.5rem;font-weight:700;margin:0 auto 16px;">${initials.toUpperCase()}</div>
                <h2 style="color:#fff;margin:0 0 4px;">Welcome, ${user.first_name || ''}!</h2>
                <p style="color:#888;margin:0 0 24px;">${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <div style="display:flex;gap:16px;justify-content:center;flex-wrap:wrap;">
                    <div style="background:#1a1f2e;border:1px solid #2a3040;border-radius:12px;padding:20px;min-width:160px;">
                        <div style="color:#888;font-size:0.75rem;text-transform:uppercase;">Status</div>
                        <div style="font-size:1.2rem;font-weight:700;color:${isClockedIn ? '#4ade80' : '#f87171'};margin-top:4px;">${isClockedIn ? 'Timed In' : 'Not Timed In'}</div>
                    </div>
                    <div style="background:#1a1f2e;border:1px solid #2a3040;border-radius:12px;padding:20px;min-width:160px;">
                        <div style="color:#888;font-size:0.75rem;text-transform:uppercase;">Recent</div>
                        <div style="font-size:1.2rem;font-weight:700;color:#60a5fa;margin-top:4px;">${records.length} records</div>
                    </div>
                </div>
            </div>
        `;
    }).catch(() => {
        document.getElementById('page-body').innerHTML = '<div class="empty-state"><p>Failed to load dashboard</p></div>';
    });
}

function initPeriodButtons(user) {
    const isAdmin = user.role === 'admin';
    const userBranchId = isAdmin ? user.branch_id : null;
    document.querySelectorAll('.chart-period').forEach(btn => {
        btn.addEventListener('click', async () => {
            document.querySelectorAll('.chart-period').forEach(b => { b.classList.remove('active'); b.style.background = 'transparent'; b.style.color = '#64748b'; });
            btn.classList.add('active');
            btn.style.background = '#1a1f2e';
            btn.style.color = '#94a3b8';
            const period = btn.dataset.period;
            const branchParam = userBranchId ? '&branch_id=' + userBranchId : '';
            try {
                const [summary, cmp] = await Promise.all([
                    apiGet('/sales/summary?period=' + period + branchParam).catch(() => []),
                    apiGet('/sales/comparison?period=' + period + branchParam).catch(() => null)
                ]);
                initCharts({}, summary, cmp);
            } catch (e) {}
        });
    });
}

Router.register('dashboard', renderAdminDashboard);
