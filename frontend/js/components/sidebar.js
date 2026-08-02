function renderSidebar() {
    const role = Auth.getUserRole();
    const user = Auth.getUser();
    const initials = user ? getInitials(user.first_name, user.last_name) : '??';
    const fullName = user ? `${user.first_name} ${user.last_name}` : 'User';
    const currentHash = (window.location.hash.slice(1) || 'dashboard').split('/')[0];

    const icon = (d) => `<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="${d}"/></svg>`;

    const I = {
        dash: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
        branch: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
        users: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z',
        attend: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
        sched: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
        dayoff: 'M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z',
        event: 'M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7',
        pay: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z',
        announce: 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z',
        msg: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z',
        email: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
        inv: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
        loyalty: 'M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z',
        report: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
        track: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
        charts: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
        logout: 'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1',
        trash: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
    };

    const ownerSections = [
        { title: 'Overview', collapsed: false, links: [
            { hash: 'dashboard', icon: I.dash, label: 'Dashboard' },
        ]},
        { title: 'Management', links: [
            { hash: 'branches', icon: I.branch, label: 'Branches' },
            { hash: 'users', icon: I.users, label: 'Employees' },
            { hash: 'attendance', icon: I.attend, label: 'Attendance' },
            { hash: 'schedules', icon: I.sched, label: 'Schedules' },
            { hash: 'dayoffs', icon: I.dayoff, label: 'Day-offs' },
            { hash: 'events', icon: I.event, label: 'Events' },
            { hash: 'payslips', icon: I.pay, label: 'Payslips' },
            { hash: 'proposals', icon: I.report, label: 'Proposals' },
        ]},
        { title: 'Communication', links: [
            { hash: 'announcements', icon: I.announce, label: 'Announcements' },
            { hash: 'messages', icon: I.msg, label: 'Messages' },
            { hash: 'email', icon: I.email, label: 'Email' },
        ]},
        { title: 'Operations', links: [
            { hash: 'inventory', icon: I.inv, label: 'Inventory' },
            { hash: 'loyalty', icon: I.loyalty, label: 'Loyalty' },
            { hash: 'pos-reports', icon: I.report, label: 'POS Reports' },
            { hash: 'tracking', icon: I.track, label: 'Tracking' },
            { hash: 'reports', icon: I.charts, label: 'Reports' },
        ]},
    ];

    const adminSections = [
        { title: 'Overview', links: [
            { hash: 'dashboard', icon: I.dash, label: 'Dashboard' },
        ]},
        { title: 'Management', links: [
            { hash: 'users', icon: I.users, label: 'Employees' },
            { hash: 'attendance', icon: I.attend, label: 'Attendance' },
            { hash: 'schedules', icon: I.sched, label: 'Schedules' },
            { hash: 'dayoffs', icon: I.dayoff, label: 'Day-offs' },
            { hash: 'events', icon: I.event, label: 'Events' },
            { hash: 'payslips', icon: I.pay, label: 'Payslips' },
            { hash: 'proposals', icon: I.report, label: 'Proposals' },
        ]},
        { title: 'Communication', links: [
            { hash: 'announcements', icon: I.announce, label: 'Announcements' },
            { hash: 'messages', icon: I.msg, label: 'Messages' },
            { hash: 'email', icon: I.email, label: 'Email' },
        ]},
        { title: 'Operations', links: [
            { hash: 'inventory', icon: I.inv, label: 'Inventory' },
            { hash: 'loyalty', icon: I.loyalty, label: 'Loyalty' },
            { hash: 'pos-reports', icon: I.report, label: 'POS Reports' },
            { hash: 'tracking', icon: I.track, label: 'Tracking' },
            { hash: 'reports', icon: I.charts, label: 'Reports' },
        ]},
    ];

    const employeeSections = [
        { title: 'Overview', links: [
            { hash: 'dashboard', icon: I.dash, label: 'Dashboard' },
        ]},
        { title: 'My Work', links: [
            { hash: 'my-attendance', icon: I.attend, label: 'My Attendance' },
            { hash: 'my-schedule', icon: I.sched, label: 'My Schedule' },
            { hash: 'my-dayoffs', icon: I.dayoff, label: 'My Day-offs' },
            { hash: 'my-payslips', icon: I.pay, label: 'My Payslips' },
        ]},
        { title: 'Communication', links: [
            { hash: 'my-announcements', icon: I.announce, label: 'Announcements' },
            { hash: 'messages', icon: I.msg, label: 'Messages' },
        ]},
    ];

    let sections;
    if (role === 'owner') sections = ownerSections;
    else if (role === 'admin') sections = adminSections;
    else sections = employeeSections;

    let navHtml = '';
    sections.forEach((section, sIdx) => {
        const isActiveSection = section.links.some(l => l.hash === currentHash);
        navHtml += `
            <div class="sidebar-section ${isActiveSection ? 'open' : ''}" data-section="${sIdx}">
                <div class="sidebar-section-header">
                    <span class="sidebar-section-title">${section.title}</span>
                    <svg class="sidebar-section-arrow" width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
                </div>
                <div class="sidebar-section-links">
                    ${section.links.map(link => `
                        <a href="#${link.hash}" class="sidebar-nav-link${currentHash === link.hash ? ' active' : ''}">
                            ${icon(link.icon)}
                            <span>${link.label}</span>
                        </a>
                    `).join('')}
                </div>
            </div>
        `;
    });

    return `
        <aside class="sidebar">
            <div class="sidebar-header">
                <div class="sidebar-logo">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" stroke-width="1.5">
                        <path d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <div>
                        <div class="sidebar-logo-text">DREAMLAND</div>
                        <div class="sidebar-logo-sub">ARCADE</div>
                    </div>
                </div>
            </div>
            <div class="sidebar-user">
                <div class="avatar">${initials}</div>
                <div class="sidebar-user-info">
                    <div class="sidebar-user-name">${fullName}</div>
                    <div class="sidebar-user-role">${role ? role.charAt(0).toUpperCase() + role.slice(1) : ''}</div>
                </div>
            </div>
            <nav class="sidebar-nav">
                ${navHtml}
            </nav>
            <div class="sidebar-footer">
                <a href="#" id="logout-btn" class="sidebar-nav-link">
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="${I.logout}"/>
                    </svg>
                    <span>Logout</span>
                </a>
            </div>
        </aside>
    `;
}

document.addEventListener('click', (e) => {
    const header = e.target.closest('.sidebar-section-header');
    if (header) {
        const section = header.closest('.sidebar-section');
        if (section) section.classList.toggle('open');
    }

    if (e.target.closest('#logout-btn')) {
        e.preventDefault();
        Auth.logout();
    }
});
