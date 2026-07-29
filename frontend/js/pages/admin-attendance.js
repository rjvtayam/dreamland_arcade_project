async function renderAdminAttendance() {
    const user = Auth.getUser();
    const app = document.getElementById('app');
    app.innerHTML = `<div class="layout">${renderSidebar()}<div class="main-content">${renderNavbar('Attendance')}<div class="page-content" id="page-body"><div style="text-align:center;padding:60px;"><div class="spinner"></div></div></div></div></div>`;
    document.getElementById('logout-btn')?.addEventListener('click', (e) => { e.preventDefault(); Auth.logout(); });

    try {
        const isAdmin = user.role === 'admin';
        const [records, branches, myRes, dayoffsRes, employeesRes, schedulesRes] = await Promise.all([
            apiGet('/attendance'),
            isAdmin ? Promise.resolve([]) : apiGet('/branches'),
            apiGet('/attendance/my').catch(() => []),
            apiGet('/dayoffs').catch(() => []),
            apiGet('/users?role=employee').catch(() => []),
            apiGet('/schedules').catch(() => [])
        ]);

        const allDayoffs = Array.isArray(dayoffsRes) ? dayoffsRes : [];
        const allEmployees = Array.isArray(employeesRes) ? employeesRes : [];
        const allSchedules = Array.isArray(schedulesRes) ? schedulesRes : [];

        const body = document.getElementById('page-body');
        const today = new Date().toISOString().slice(0, 10);
        const myRecords = Array.isArray(myRes) ? myRes : [];
        const todayRecord = myRecords.find(r => r.clock_in && r.clock_in.slice(0, 10) === today);
        const isClockedIn = todayRecord && !todayRecord.clock_out;

        let hoursWorked = '0h 0m';
        let hoursDecimal = 0;
        if (todayRecord && todayRecord.clock_out) {
            const diff = new Date(todayRecord.clock_out) - new Date(todayRecord.clock_in);
            hoursDecimal = diff / 3600000;
            const h = Math.floor(hoursDecimal);
            const m = Math.floor((diff % 3600000) / 60000);
            hoursWorked = h + 'h ' + m + 'm';
        } else if (todayRecord && todayRecord.clock_in) {
            const diff = new Date() - new Date(todayRecord.clock_in);
            hoursDecimal = diff / 3600000;
            const h = Math.floor(hoursDecimal);
            const m = Math.floor((diff % 3600000) / 60000);
            hoursWorked = h + 'h ' + m + 'm';
        }

        const clockInStr = todayRecord && todayRecord.clock_in
            ? new Date(todayRecord.clock_in).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', hour12: true })
            : '—';
        const clockOutStr = todayRecord && todayRecord.clock_out
            ? new Date(todayRecord.clock_out).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', hour12: true })
            : '—';

        const adminRoles = ['owner', 'admin'];
        const adminRecords = records.filter(r => {
            return r.user_role === 'admin' || r.user_role === 'owner' || (!r.user_role && adminRoles.includes(r.role));
        });
        const employeeRecords = records.filter(r => {
            return r.user_role && r.user_role !== 'admin' && r.user_role !== 'owner';
        });

        const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const branchBadge = isAdmin
            ? `<span style="background:linear-gradient(135deg,#065f46,#059669);color:#fff;padding:4px 12px;border-radius:8px;font-size:0.75rem;font-weight:600;">${escA(user.branch_name || 'My Branch')}</span>`
            : '';

        body.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;flex-wrap:wrap;gap:12px;">
                <div>
                    <h2 style="color:#fff;margin:0 0 4px;font-size:1.3rem;">Attendance</h2>
                    <div style="display:flex;gap:10px;align-items:center;color:#64748b;font-size:0.8rem;">
                        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                        ${todayStr} ${branchBadge}
                    </div>
                </div>
                <div id="att-live-clock" style="color:#64748b;font-size:0.85rem;font-family:monospace;"></div>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;margin-bottom:24px;">
                <div style="background:linear-gradient(135deg,#0f172a,#1e293b);border:1px solid #1e293b;border-radius:14px;padding:20px;position:relative;overflow:hidden;">
                    <div style="position:absolute;top:-15px;right:-15px;width:60px;height:60px;border-radius:50%;background:rgba(99,102,241,0.08);"></div>
                    <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
                        <div style="width:36px;height:36px;border-radius:10px;background:rgba(99,102,241,0.12);display:flex;align-items:center;justify-content:center;">
                            <svg width="16" height="16" fill="none" stroke="#6366f1" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                        </div>
                        <span style="color:#64748b;font-size:0.7rem;text-transform:uppercase;letter-spacing:1px;">Your Status</span>
                    </div>
                    <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
                        <span style="width:8px;height:8px;border-radius:50%;background:${isClockedIn ? '#22c55e' : '#ef4444'};"></span>
                        <span style="color:${isClockedIn ? '#4ade80' : '#f87171'};font-size:1.1rem;font-weight:700;">${isClockedIn ? 'Timed In' : (todayRecord ? 'Timed Out' : 'Not Timed In')}</span>
                    </div>
                    <div style="color:#475569;font-size:0.8rem;">Hours today: <span style="color:#94a3b8;font-weight:600;">${hoursWorked}</span></div>
                </div>

                <div style="background:linear-gradient(135deg,#0f172a,#1e293b);border:1px solid #1e293b;border-radius:14px;padding:20px;">
                    <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
                        <div style="width:36px;height:36px;border-radius:10px;background:rgba(34,197,94,0.12);display:flex;align-items:center;justify-content:center;">
                            <svg width="16" height="16" fill="none" stroke="#22c55e" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                        </div>
                        <span style="color:#64748b;font-size:0.7rem;text-transform:uppercase;letter-spacing:1px;">Clock Times</span>
                    </div>
                    <div style="display:flex;gap:16px;">
                        <div>
                            <div style="color:#475569;font-size:0.65rem;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:2px;">In</div>
                            <div style="color:#4ade80;font-size:0.95rem;font-weight:600;">${clockInStr}</div>
                        </div>
                        <div>
                            <div style="color:#475569;font-size:0.65rem;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:2px;">Out</div>
                            <div style="color:#f87171;font-size:0.95rem;font-weight:600;">${clockOutStr}</div>
                        </div>
                    </div>
                </div>

                <div style="display:flex;gap:10px;">
                    <button id="clock-in-btn" style="flex:1;padding:14px;background:linear-gradient(135deg,rgba(34,197,94,0.12),rgba(34,197,94,0.06));border:1px solid rgba(34,197,94,0.25);border-radius:12px;color:#4ade80;font-size:0.85rem;font-weight:600;cursor:pointer;transition:all 0.2s;display:flex;flex-direction:column;align-items:center;gap:8px;" onmouseenter="this.style.borderColor='rgba(34,197,94,0.5)';this.style.background='rgba(34,197,94,0.15)'" onmouseleave="this.style.borderColor='rgba(34,197,94,0.25)';this.style.background='linear-gradient(135deg,rgba(34,197,94,0.12),rgba(34,197,94,0.06))'">
                        <svg width="20" height="20" fill="none" stroke="#4ade80" stroke-width="2" viewBox="0 0 24 24"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" stroke-linecap="round"/></svg>
                        Time In
                    </button>
                    <button id="clock-out-btn" style="flex:1;padding:14px;background:linear-gradient(135deg,rgba(239,68,68,0.12),rgba(239,68,68,0.06));border:1px solid rgba(239,68,68,0.25);border-radius:12px;color:#f87171;font-size:0.85rem;font-weight:600;cursor:pointer;transition:all 0.2s;display:flex;flex-direction:column;align-items:center;gap:8px;" onmouseenter="this.style.borderColor='rgba(239,68,68,0.5)';this.style.background='rgba(239,68,68,0.15)'" onmouseleave="this.style.borderColor='rgba(239,68,68,0.25)';this.style.background='linear-gradient(135deg,rgba(239,68,68,0.12),rgba(239,68,68,0.06))'">
                        <svg width="20" height="20" fill="none" stroke="#f87171" stroke-width="2" viewBox="0 0 24 24"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" stroke-linecap="round" stroke-linejoin="round"/></svg>
                        Time Out
                    </button>
                </div>
            </div>

            <div style="display:flex;gap:16px;margin-bottom:20px;">
                <div style="background:linear-gradient(135deg,#0f172a,#1e293b);border:1px solid #1e293b;border-radius:12px;padding:16px;flex:1;text-align:center;">
                    <div style="color:#64748b;font-size:0.65rem;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Present Today</div>
                    <div id="stat-present" style="color:#4ade80;font-size:1.4rem;font-weight:700;">0</div>
                </div>
                <div style="background:linear-gradient(135deg,#0f172a,#1e293b);border:1px solid #1e293b;border-radius:12px;padding:16px;flex:1;text-align:center;">
                    <div style="color:#64748b;font-size:0.65rem;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Late</div>
                    <div id="stat-late" style="color:#fbbf24;font-size:1.4rem;font-weight:700;">0</div>
                </div>
                <div style="background:linear-gradient(135deg,#0f172a,#1e293b);border:1px solid #1e293b;border-radius:12px;padding:16px;flex:1;text-align:center;">
                    <div style="color:#64748b;font-size:0.65rem;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Overtime</div>
                    <div id="stat-overtime" style="color:#a78bfa;font-size:1.4rem;font-weight:700;">0</div>
                </div>
                <div style="background:linear-gradient(135deg,#0f172a,#1e293b);border:1px solid #1e293b;border-radius:12px;padding:16px;flex:1;text-align:center;">
                    <div style="color:#64748b;font-size:0.65rem;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Absent</div>
                    <div id="stat-absent" style="color:#f87171;font-size:1.4rem;font-weight:700;">0</div>
                </div>
            </div>

            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:12px;">
                <div style="display:flex;gap:4px;background:#0f172a;border:1px solid #1e293b;border-radius:10px;padding:3px;">
                    <button class="att-tab active" data-tab="admin" style="padding:8px 18px;border:none;border-radius:8px;background:rgba(99,102,241,0.15);color:#a78bfa;font-weight:600;font-size:0.8rem;cursor:pointer;transition:all 0.2s;display:flex;align-items:center;gap:6px;">
                        <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/></svg>
                        Admins
                    </button>
                    <button class="att-tab" data-tab="employee" style="padding:8px 18px;border:none;border-radius:8px;background:transparent;color:#64748b;font-weight:600;font-size:0.8rem;cursor:pointer;transition:all 0.2s;display:flex;align-items:center;gap:6px;">
                        <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                        Employees
                    </button>
                </div>
                <div style="display:flex;gap:8px;align-items:center;">
                    ${isAdmin ? '' : `<select id="filter-branch" style="background:#0f172a;border:1px solid #1e293b;border-radius:8px;padding:8px 12px;color:#e2e8f0;font-size:0.8rem;">
                        <option value="">All Branches</option>
                        ${branches.map(b => `<option value="${b.id}">${escA(b.name)}</option>`).join('')}
                    </select>`}
                    <div style="position:relative;">
                        <svg width="14" height="14" fill="none" stroke="#475569" viewBox="0 0 24 24" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);pointer-events:none;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                        <input type="date" id="filter-date" value="${today}" style="background:#0f172a;border:1px solid #1e293b;border-radius:8px;padding:8px 12px 8px 32px;color:#e2e8f0;font-size:0.8rem;">
                    </div>
                </div>
            </div>

            <div id="att-tab-content"></div>
        `;

        const tabContent = document.getElementById('att-tab-content');
        let currentTab = 'admin';
        let filteredBranch = isAdmin ? String(user.branch_id || '') : '';
        let filteredDate = today;
        let latestRecords = records;

        const DUTY_START_HOUR = 10;
        const DUTY_START_MIN = 0;
        const DUTY_END_HOUR = 20;
        const DUTY_END_MIN = 0;

        function isRecordDayOff(r) {
            return r.status === 'day-off' || r.status === 'no-duty';
        }

        function calcLateMins(r, now) {
            if (!r.clock_in || isRecordDayOff(r)) return 0;
            const ci = new Date(r.clock_in);
            const threshold = new Date(ci);
            threshold.setHours(DUTY_START_HOUR, DUTY_START_MIN, 0, 0);
            const diff = ci - threshold;
            return diff > 0 ? Math.round(diff / 60000) : 0;
        }

        function calcOtMins(r, now) {
            if (isRecordDayOff(r) || !r.clock_in) return 0;
            if (r.clock_out) {
                const co = new Date(r.clock_out);
                const threshold = new Date(co);
                threshold.setHours(DUTY_END_HOUR, DUTY_END_MIN, 0, 0);
                return co > threshold ? Math.round((co - threshold) / 60000) : 0;
            }
            const n = now || new Date();
            const threshold = new Date(n);
            threshold.setHours(DUTY_END_HOUR, DUTY_END_MIN, 0, 0);
            return n > threshold ? Math.round((n - threshold) / 60000) : 0;
        }

        function calcHoursWorked(r, now) {
            if (!r.clock_in || isRecordDayOff(r)) return 0;
            const ci = new Date(r.clock_in);
            if (r.clock_out) return (new Date(r.clock_out) - ci) / 3600000;
            return ((now || new Date()) - ci) / 3600000;
        }

        function calcRecordStatus(r, now) {
            if (!r.clock_in || isRecordDayOff(r)) return r.status;
            const late = calcLateMins(r, now);
            const ot = calcOtMins(r, now);
            if (late > 0 && ot > 0) return 'late-ot';
            if (late > 0) return 'late';
            if (ot > 0) return 'overtime';
            return 'present';
        }

        function fmtMins(mins) {
            if (mins <= 0) return '—';
            if (mins >= 60) return (Math.round(mins / 60 * 10) / 10) + 'h';
            return mins + 'm';
        }

        function fmtHours(h) {
            if (h <= 0) return '0h';
            return (Math.round(h * 10) / 10) + 'h';
        }

        function updateStats(recs) {
            const now = new Date();
            let present = 0, late = 0, overtime = 0, lateOt = 0, dayOff = 0, absent = 0;
            let totalLateMins = 0, lateCount = 0;
            let totalOtMins = 0, otCount = 0;

            recs.forEach(r => {
                const s = calcRecordStatus(r, now);
                if (s === 'present') present++;
                else if (s === 'late') { late++; const lm = calcLateMins(r, now); totalLateMins += lm; lateCount++; }
                else if (s === 'overtime') { overtime++; const om = calcOtMins(r, now); totalOtMins += om; otCount++; }
                else if (s === 'late-ot') { lateOt++; totalLateMins += calcLateMins(r, now); lateCount++; totalOtMins += calcOtMins(r, now); otCount++; }
                else if (s === 'day-off' || s === 'no-duty') dayOff++;
                else absent++;
            });

            const totalPresent = present + late + overtime + lateOt;
            const avgLate = lateCount > 0 ? Math.round(totalLateMins / lateCount) : 0;
            const avgOt = otCount > 0 ? Math.round(totalOtMins / otCount) : 0;

            const el1 = document.getElementById('stat-present');
            const el2 = document.getElementById('stat-late');
            const el3 = document.getElementById('stat-overtime');
            const el4 = document.getElementById('stat-absent');

            if (el1) el1.textContent = totalPresent;
            if (el2) el2.innerHTML = (late + lateOt) + (lateCount > 0 ? ' <span style="font-size:0.65rem;color:#f59e0b;font-weight:400;">avg ' + fmtMins(avgLate) + '</span>' : '');
            if (el3) el3.innerHTML = (overtime + lateOt) + (otCount > 0 ? ' <span style="font-size:0.65rem;color:#a78bfa;font-weight:400;">avg ' + fmtMins(avgOt) + '</span>' : '');
            if (el4) el4.innerHTML = absent + (dayOff > 0 ? ' <span style="font-size:0.65rem;color:#3b82f6;font-weight:400;">+ ' + dayOff + ' off</span>' : '');
        }

        function renderAttTable(recs) {
            updateStats(recs);
            if (!recs || recs.length === 0) {
                return '<div style="text-align:center;padding:50px 20px;color:#475569;">' +
                    '<svg width="40" height="40" fill="none" stroke="#334155" viewBox="0 0 24 24" style="margin:0 auto 12px;display:block;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>' +
                    '<div style="font-size:0.9rem;color:#64748b;">No records found</div></div>';
            }

            const now = new Date();
            return '<div style="display:grid;gap:8px;">' + recs.map(r => {
                const rtStatus = calcRecordStatus(r, now);
                const name = r.user_name || '—';
                const initials = name !== '—' ? name.split(' ').map(w => w[0]).join('').substring(0,2).toUpperCase() : '?';
                const branchName = r.branch_name || branches.find(b => String(b.id) === String(r.branch_id))?.name || '—';
                const isOnShift = r.clock_in && !r.clock_out && !isRecordDayOff(r);
                const isDayOffType = rtStatus === 'day-off' || rtStatus === 'no-duty';
                const statusMap = { present: '#22c55e', late: '#22c55e', overtime: '#22c55e', 'late-ot': '#22c55e', 'day-off': '#3b82f6', 'no-duty': '#64748b', absent: '#ef4444' };
                const bgMap = { present: 'rgba(34,197,94,0.1)', late: 'rgba(34,197,94,0.1)', overtime: 'rgba(34,197,94,0.1)', 'late-ot': 'rgba(34,197,94,0.1)', 'day-off': 'rgba(59,130,246,0.1)', 'no-duty': 'rgba(100,116,139,0.1)', absent: 'rgba(239,68,68,0.1)' };
                const statusColor = statusMap[rtStatus] || '#ef4444';
                const statusBg = bgMap[rtStatus] || 'rgba(239,68,68,0.1)';
                const clockInTime = r.clock_in ? new Date(r.clock_in).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', hour12: true }) : '—';
                const clockOutTime = r.clock_out ? new Date(r.clock_out).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', hour12: true }) : '—';
                const recDate = r.clock_in ? r.clock_in.substring(0, 10) : r.date || '';
                const hoursVal = calcHoursWorked(r, now);
                const hoursDisplay = isDayOffType ? '0h' : (r.clock_in ? fmtHours(hoursVal) : '—');
                const lateMins = calcLateMins(r, now);
                const otMins = calcOtMins(r, now);
                const lateDisplay = fmtMins(lateMins);
                const otDisplay = fmtMins(otMins);
                const statusLabel = isDayOffType ? rtStatus.toUpperCase() : (r.clock_in ? 'PRESENT' : 'ABSENT');
                const station = getStationForEmployee(r.user_id, recDate);
                const stationDisplay = station || '—';
                const stationColor = station ? '#818cf8' : '#475569';

                return '<div style="background:#0f172a;border:1px solid #1e293b;border-radius:12px;padding:14px 18px;display:flex;align-items:center;gap:14px;transition:all 0.2s;" onmouseenter="this.style.borderColor=\'#334155\'" onmouseleave="this.style.borderColor=\'#1e293b\'">' +
                    '<div style="width:40px;height:40px;border-radius:10px;background:linear-gradient(135deg,#1a1f3a,#0f172a);display:flex;align-items:center;justify-content:center;color:#a78bfa;font-size:0.75rem;font-weight:700;flex-shrink:0;border:1px solid rgba(99,102,241,0.2);">' + initials + '</div>' +
                    '<div style="flex:1;min-width:0;">' +
                        '<div style="color:#e2e8f0;font-weight:600;font-size:0.9rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + escA(name) + (isOnShift ? ' <span style="color:#22c55e;font-size:0.6rem;font-weight:700;vertical-align:middle;">ON SHIFT</span>' : '') + '</div>' +
                        '<div style="color:#475569;font-size:0.75rem;margin-top:2px;">' + escA(branchName) + ' · ' + recDate + '</div>' +
                    '</div>' +
                    '<div style="text-align:center;min-width:80px;flex-shrink:0;">' +
                        '<div style="color:#475569;font-size:0.6rem;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:2px;">Area</div>' +
                        '<div style="color:' + stationColor + ';font-size:0.75rem;font-weight:600;">' + escA(stationDisplay) + '</div>' +
                    '</div>' +
                    '<div style="display:flex;align-items:center;gap:16px;flex-shrink:0;">' +
                        '<div style="text-align:center;min-width:50px;"><div style="color:#475569;font-size:0.6rem;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:2px;">In</div><div style="color:#4ade80;font-size:0.8rem;font-weight:600;">' + clockInTime + '</div></div>' +
                        '<div style="text-align:center;min-width:50px;"><div style="color:#475569;font-size:0.6rem;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:2px;">Out</div><div style="color:#f87171;font-size:0.8rem;font-weight:600;">' + clockOutTime + '</div></div>' +
                        '<div style="text-align:center;min-width:50px;"><div style="color:#475569;font-size:0.6rem;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:2px;">Hours</div><div style="color:#60a5fa;font-size:0.8rem;font-weight:600;">' + hoursDisplay + '</div></div>' +
                        '<div style="text-align:center;min-width:40px;"><div style="color:#475569;font-size:0.6rem;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:2px;">Late</div><div style="color:' + (lateMins > 0 ? '#f59e0b' : '#475569') + ';font-size:0.8rem;font-weight:600;">' + lateDisplay + '</div></div>' +
                        '<div style="text-align:center;min-width:40px;"><div style="color:#475569;font-size:0.6rem;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:2px;">OT</div><div style="color:' + (otMins > 0 ? '#a855f7' : '#475569') + ';font-size:0.8rem;font-weight:600;">' + otDisplay + '</div></div>' +
                        '<span style="background:' + statusBg + ';color:' + statusColor + ';padding:4px 10px;border-radius:8px;font-size:0.7rem;font-weight:600;text-transform:uppercase;min-width:70px;text-align:center;">' + statusLabel + '</span>' +
                    '</div>' +
                '</div>';
            }).join('') + '</div>';
        }

        function getStationForEmployee(userId, dateStr) {
            if (!dateStr) return null;
            const d = new Date(dateStr + 'T00:00:00');
            const dow = d.getDay();
            const sched = allSchedules.find(s => s.user_id === userId && s.day_of_week === dow && (s.week_number || 0) === 0 && s.is_active);
            return sched ? sched.station : null;
        }

        function getFilteredRecords() {
            let recs = currentTab === 'admin' ? latestRecords.filter(r => r.user_role === 'admin' || r.user_role === 'owner' || (!r.user_role && ['owner','admin'].includes(r.role))) : latestRecords.filter(r => r.user_role && r.user_role !== 'admin' && r.user_role !== 'owner');
            if (filteredBranch) recs = recs.filter(r => String(r.branch_id) === String(filteredBranch));
            if (filteredDate) recs = recs.filter(r => {
                const rd = r.clock_in ? r.clock_in.substring(0, 10) : r.date;
                return rd === filteredDate;
            });

            if (currentTab === 'employee' && filteredDate) {
                const noDutyIds = [15, 16];
                const filterDateObj = new Date(filteredDate + 'T00:00:00');
                const dow = filterDateObj.getDay();
                const isWeekday = dow >= 1 && dow <= 5;

                const attendedIds = new Set(recs.map(r => r.user_id));

                const approvedDayoffs = allDayoffs.filter(d => {
                    if (d.status !== 'approved') return false;
                    const doffDate = d.date || d.day_off_date || '';
                    return doffDate === filteredDate;
                });
                approvedDayoffs.forEach(d => {
                    if (!attendedIds.has(d.user_id)) {
                        const isNoDuty = d.request_type === 'no-duty' || (isWeekday && noDutyIds.includes(d.user_id));
                        recs.push({
                            user_id: d.user_id,
                            user_name: d.user_name || d.employee_name || 'Unknown',
                            branch_id: d.branch_id,
                            branch_name: d.branch_name || '',
                            clock_in: null,
                            clock_out: null,
                            status: isNoDuty ? 'no-duty' : 'day-off',
                            date: filteredDate,
                            hours_worked: 0,
                            user_role: 'employee'
                        });
                    }
                });

                const empBranch = isAdmin ? user.branch_id : null;
                const empList = allEmployees.length > 0 ? allEmployees : [];
                empList.filter(e => e.role === 'employee' && (!empBranch || e.branch_id === empBranch)).forEach(e => {
                    const alreadyIn = recs.some(r => r.user_id === e.id);
                    if (!alreadyIn) {
                        const sched = allSchedules.find(s => s.user_id === e.id && s.day_of_week === dow && s.is_active);
                        const isSchedDayOff = sched && sched.station === 'Day Off';
                        const isNoDuty = isWeekday && noDutyIds.includes(e.id);
                        recs.push({
                            user_id: e.id,
                            user_name: e.first_name + ' ' + e.last_name,
                            branch_id: e.branch_id,
                            branch_name: '',
                            clock_in: null,
                            clock_out: null,
                            status: isNoDuty ? 'no-duty' : (isSchedDayOff ? 'day-off' : 'absent'),
                            date: filteredDate,
                            hours_worked: 0,
                            user_role: 'employee'
                        });
                    }
                });

                recs.sort((a, b) => (a.user_name || '').localeCompare(b.user_name || ''));
            }

            return recs;
        }

        function refreshTab() {
            tabContent.innerHTML = renderAttTable(getFilteredRecords());
        }

        refreshTab();

        document.querySelectorAll('.att-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.att-tab').forEach(t => {
                    t.style.background = 'transparent';
                    t.style.color = '#64748b';
                });
                tab.style.background = 'rgba(99,102,241,0.15)';
                tab.style.color = '#a78bfa';
                currentTab = tab.dataset.tab;
                refreshTab();
            });
        });

        document.getElementById('filter-branch')?.addEventListener('change', (e) => { filteredBranch = e.target.value; refreshTab(); });
        document.getElementById('filter-date').addEventListener('change', (e) => { filteredDate = e.target.value; refreshTab(); });

        document.getElementById('clock-in-btn').addEventListener('click', () => showAttPinModal('Time In', user, true));
        document.getElementById('clock-out-btn').addEventListener('click', () => showAttPinModal('Time Out', user, false));

        function updateClock() {
            const el = document.getElementById('att-live-clock');
            if (el) el.textContent = new Date().toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
        }
        updateClock();
        setInterval(updateClock, 1000);

        setInterval(function() { updateStats(getFilteredRecords()); }, 60000);

        setInterval(async function() {
            try {
                const newRecords = await apiGet('/attendance' + (isAdmin && user.branch_id ? '?branch_id=' + user.branch_id : ''));
                if (Array.isArray(newRecords)) {
                    latestRecords = newRecords;
                    refreshTab();
                }
            } catch (e) {}
        }, 30000);

    } catch (err) {
        document.getElementById('page-body').innerHTML = `<div class="empty-state"><p>Failed to load attendance</p></div>`;
    }
}

function showAttPinModal(action, user, isClockIn) {
    var pin = '';
    var pinVisible = false;

    var inputStyle = 'width:72px;height:58px;border-radius:10px;border:1px solid #1e293b;background:#0f172a;color:#e2e8f0;font-size:1.2rem;font-weight:600;cursor:pointer;transition:all 0.15s;display:flex;align-items:center;justify-content:center;';

    var html =
        '<div style="text-align:center;padding:10px 0;">' +
            '<div style="width:48px;height:48px;border-radius:12px;background:' + (isClockIn ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)') + ';display:flex;align-items:center;justify-content:center;margin:0 auto 16px;">' +
                (isClockIn
                    ? '<svg width="22" height="22" fill="none" stroke="#4ade80" stroke-width="2" viewBox="0 0 24 24"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" stroke-linecap="round"/></svg>'
                    : '<svg width="22" height="22" fill="none" stroke="#f87171" stroke-width="2" viewBox="0 0 24 24"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" stroke-linecap="round" stroke-linejoin="round"/></svg>') +
            '</div>' +
            '<div style="color:#e2e8f0;font-weight:600;font-size:0.95rem;margin-bottom:4px;">' + action + '</div>' +
            '<div style="color:#64748b;font-size:0.8rem;margin-bottom:20px;">Enter your PIN to continue</div>' +
            '<div id="pin-display" style="background:#0f172a;border:1px solid #1e293b;border-radius:12px;padding:16px;margin:0 auto 24px;max-width:260px;min-height:28px;display:flex;align-items:center;justify-content:center;gap:10px;">' +
                '<span id="pin-dots" style="font-size:1.8rem;letter-spacing:10px;color:#a78bfa;"></span>' +
            '</div>' +
            '<div id="pin-keypad" style="display:grid;grid-template-columns:repeat(3,72px);gap:8px;justify-content:center;margin:0 auto 20px;">' +
                [1,2,3,4,5,6,7,8,9,'eye',0,'del'].map(function(key) {
                    var display = key;
                    var dataKey = key;
                    if (key === 'eye') { display = '&#128065;'; dataKey = 'eye'; }
                    else if (key === 'del') { display = '&#9003;'; dataKey = 'del'; }
                    return '<button class="pin-key" data-key="' + dataKey + '" style="' + inputStyle + '">' + display + '</button>';
                }).join('') +
            '</div>' +
            '<div id="pin-error" style="color:#f87171;font-size:0.85rem;min-height:18px;margin-top:8px;"></div>' +
            '<button id="pin-submit-btn" style="width:100%;max-width:280px;padding:13px;border:none;border-radius:10px;background:linear-gradient(135deg,' + (isClockIn ? '#059669,#10b981' : '#dc2626,#ef4444') + ');color:#fff;font-size:0.9rem;font-weight:600;cursor:pointer;margin-top:14px;transition:all 0.2s;">' + action + '</button>' +
        '</div>';

    Modal.show(action, html);

    setTimeout(function() {
        var dotsEl = document.getElementById('pin-dots');
        var errEl = document.getElementById('pin-error');
        var submitBtn = document.getElementById('pin-submit-btn');
        var eyeBtn = document.querySelector('[data-key="eye"]');

        function updateDisplay() {
            if (!dotsEl) return;
            if (pinVisible) {
                dotsEl.textContent = pin;
            } else {
                dotsEl.textContent = pin.split('').map(function() { return '\u2022'; }).join('');
            }
        }

        if (eyeBtn) eyeBtn.addEventListener('click', function() { pinVisible = !pinVisible; updateDisplay(); });

        document.querySelectorAll('.pin-key').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var key = btn.getAttribute('data-key');
                if (key === 'eye') return;
                if (key === 'del') { pin = pin.slice(0, -1); }
                else { if (pin.length < 6) pin += key; }
                updateDisplay();
                if (errEl) errEl.textContent = '';
            });
            btn.addEventListener('mouseenter', function() { btn.style.background = '#1a1f2e'; btn.style.borderColor = '#6366f1'; });
            btn.addEventListener('mouseleave', function() { btn.style.background = '#0f172a'; btn.style.borderColor = '#1e293b'; });
        });

        if (submitBtn) {
            submitBtn.addEventListener('click', async function() {
                if (pin.length < 4) { if (errEl) errEl.textContent = 'PIN must be at least 4 digits'; return; }
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
                    renderAdminAttendance();
                } catch (err) {
                    if (errEl) errEl.textContent = err.message || 'Invalid PIN';
                    submitBtn.disabled = false;
                    submitBtn.textContent = action;
                }
            });
        }
    }, 50);
}

function escA(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

Router.register('attendance', renderAdminAttendance);
