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
        const [stats, branches, attendanceRes] = await Promise.all([
            apiGet('/reports/dashboard'),
            apiGet('/branches'),
            apiGet('/attendance/my').catch(() => [])
        ]);

        const records = Array.isArray(attendanceRes) ? attendanceRes : [];
        const today = new Date().toISOString().slice(0, 10);
        const todayRecord = records.find(r => r.clock_in && r.clock_in.slice(0, 10) === today);
        const isClockedIn = todayRecord && !todayRecord.clock_out;

        let hoursWorked = '0h 0m';
        if (todayRecord && todayRecord.clock_out) {
            const diff = new Date(todayRecord.clock_out) - new Date(todayRecord.clock_in);
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            hoursWorked = h + 'h ' + m + 'm';
        } else if (todayRecord && todayRecord.clock_in) {
            const diff = new Date() - new Date(todayRecord.clock_in);
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            hoursWorked = h + 'h ' + m + 'm (running)';
        }

        const body = document.getElementById('page-body');
        body.innerHTML = `
            <div style="margin-bottom:24px;">
                <h2 style="color:#fff;margin:0 0 4px 0;font-size:1.4rem;">Welcome back, ${user.first_name || ''}!</h2>
                <p style="color:#aaa;margin:0;font-size:0.9rem;">${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>

            <div style="display:flex;gap:16px;margin-bottom:24px;flex-wrap:wrap;">
                <button id="clock-in-btn" style="flex:1;min-width:180px;padding:16px;background:#166534;border:2px solid #22c55e;border-radius:12px;color:#fff;font-size:1.1rem;font-weight:700;cursor:pointer;transition:all 0.2s;">
                    <div style="font-size:1.6rem;margin-bottom:6px;">&#9201;</div>Time In
                </button>
                <button id="clock-out-btn" style="flex:1;min-width:180px;padding:16px;background:#7f1d1d;border:2px solid #ef4444;border-radius:12px;color:#fff;font-size:1.1rem;font-weight:700;cursor:pointer;transition:all 0.2s;">
                    <div style="font-size:1.6rem;margin-bottom:6px;">&#9202;</div>Time Out
                </button>
            </div>

            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin-bottom:24px;">
                <div style="background:#1a1f2e;border:1px solid #2a3040;border-radius:12px;padding:20px;">
                    <div style="color:#888;font-size:0.75rem;text-transform:uppercase;margin-bottom:6px;">Today's Status</div>
                    <div style="font-size:1.2rem;font-weight:700;color:${isClockedIn ? '#4ade80' : (todayRecord ? '#60a5fa' : '#f87171')};">
                        ${isClockedIn ? 'Timed In' : (todayRecord ? 'Timed Out' : 'Not Timed In')}
                    </div>
                </div>
                <div style="background:#1a1f2e;border:1px solid #2a3040;border-radius:12px;padding:20px;">
                    <div style="color:#888;font-size:0.75rem;text-transform:uppercase;margin-bottom:6px;">Hours Worked Today</div>
                    <div style="font-size:1.2rem;font-weight:700;color:#60a5fa;">${hoursWorked}</div>
                </div>
            </div>

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

        document.getElementById('clock-in-btn').addEventListener('click', function() {
            showAdminPinModal('Time In', user, true);
        });
        document.getElementById('clock-out-btn').addEventListener('click', function() {
            showAdminPinModal('Time Out', user, false);
        });

        document.querySelectorAll('#clock-in-btn, #clock-out-btn').forEach(function(btn) {
            btn.addEventListener('mouseenter', function() { btn.style.transform = 'translateY(-2px)'; });
            btn.addEventListener('mouseleave', function() { btn.style.transform = 'none'; });
        });

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

function showAdminPinModal(action, user, isClockIn) {
    var pin = '';
    var pinVisible = false;

    var html =
        '<div style="text-align:center;padding:10px 0;">' +
            '<div style="color:#aaa;margin-bottom:20px;font-size:0.95rem;">Enter your PIN to ' + action.toLowerCase() + '</div>' +
            '<div id="pin-display" style="background:#0d1117;border:2px solid #30363d;border-radius:10px;padding:14px;margin:0 auto 24px;max-width:240px;min-height:24px;display:flex;align-items:center;justify-content:center;gap:10px;">' +
                '<span id="pin-dots" style="font-size:1.6rem;letter-spacing:8px;color:#60a5fa;"></span>' +
            '</div>' +
            '<div id="pin-keypad" style="display:grid;grid-template-columns:repeat(3,70px);gap:8px;justify-content:center;margin:0 auto 20px;">' +
                [1,2,3,4,5,6,7,8,9,'\uD83D\uDC41',0,'\u232B'].map(function(key) {
                    var display = key;
                    var cls = 'pin-key';
                    var dataKey = key;
                    if (key === '\uD83D\uDC41') { display = '\uD83D\uDC41'; cls = 'pin-key pin-key-eye'; dataKey = 'eye'; }
                    else if (key === '\u232B') { display = '\u232B'; cls = 'pin-key pin-key-del'; dataKey = 'del'; }
                    return '<button class="' + cls + '" data-key="' + dataKey + '" style="width:70px;height:56px;border-radius:10px;border:1px solid #30363d;background:#161b22;color:#e2e8f0;font-size:1.2rem;font-weight:600;cursor:pointer;transition:all 0.15s;display:flex;align-items:center;justify-content:center;">' + display + '</button>';
                }).join('') +
            '</div>' +
            '<div id="pin-error" style="color:#f87171;font-size:0.85rem;min-height:18px;margin-top:8px;"></div>' +
            '<button id="pin-submit-btn" style="width:100%;max-width:280px;padding:12px;border:none;border-radius:8px;background:' + (isClockIn ? '#22c55e' : '#ef4444') + ';color:#fff;font-size:1rem;font-weight:600;cursor:pointer;margin-top:12px;">' + action + '</button>' +
        '</div>';

    Modal.show(action, html);

    setTimeout(function() {
        var dotsEl = document.getElementById('pin-dots');
        var errEl = document.getElementById('pin-error');
        var submitBtn = document.getElementById('pin-submit-btn');
        var eyeBtn = document.querySelector('.pin-key-eye');

        function updateDisplay() {
            if (!dotsEl) return;
            if (pinVisible) {
                dotsEl.textContent = pin;
                if (eyeBtn) eyeBtn.textContent = '\uD83D\uDC41';
            } else {
                dotsEl.textContent = pin.split('').map(function() { return '\u2022'; }).join('');
                if (eyeBtn) eyeBtn.textContent = '\uD83D\uDE48';
            }
        }

        if (eyeBtn) {
            eyeBtn.addEventListener('click', function() {
                pinVisible = !pinVisible;
                updateDisplay();
            });
        }

        document.querySelectorAll('.pin-key').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var key = btn.getAttribute('data-key');
                if (key === 'eye') return;
                if (key === 'del') {
                    pin = pin.slice(0, -1);
                } else {
                    if (pin.length < 6) pin += key;
                }
                updateDisplay();
                if (errEl) errEl.textContent = '';
            });
            btn.addEventListener('mouseenter', function() { btn.style.background = '#1f2937'; });
            btn.addEventListener('mouseleave', function() { btn.style.background = '#161b22'; });
        });

        if (submitBtn) {
            submitBtn.addEventListener('click', async function() {
                if (pin.length < 4) {
                    if (errEl) errEl.textContent = 'PIN must be at least 4 digits';
                    return;
                }
                submitBtn.disabled = true;
                submitBtn.textContent = 'Processing...';
                try {
                    if (isClockIn) {
                        await apiPost('/attendance/clock-in', { pin: pin, branch_id: user.branch_id });
                        Toast.success('Timed in successfully!');
                    } else {
                        await apiPost('/attendance/clock-out', { pin: pin });
                        Toast.success('Timed out successfully!');
                    }
                    Modal.close();
                    renderAdminDashboard();
                } catch (err) {
                    if (errEl) errEl.textContent = err.message || 'Invalid PIN or error occurred';
                    submitBtn.disabled = false;
                    submitBtn.textContent = action;
                }
            });
        }
    }, 50);
}
Router.register('dashboard', renderAdminDashboard);
