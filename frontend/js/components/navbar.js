function renderNavbar(title) {
    const user = Auth.getUser();
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    const initials = user ? getInitials(user.first_name, user.last_name) : '??';
    const branchName = user && user.branch_name ? user.branch_name : '';

    return `
        <div class="topbar">
            <div class="topbar-left">
                <h2 class="topbar-title">${title}</h2>
            </div>
            <div class="topbar-right">
                <span class="topbar-date" style="display:flex;align-items:center;gap:6px;">
                    <svg width="16" height="16" fill="none" stroke="#ffffff" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                    ${dateStr}
                </span>
                ${branchName ? `<span class="topbar-branch">${branchName}</span>` : ''}
                <div class="topbar-user" id="user-menu-trigger" style="cursor:pointer;display:flex;align-items:center;gap:8px;">
                    <div class="avatar avatar-sm">${initials}</div>
                    <span class="topbar-username">${user ? user.first_name : ''}</span>
                </div>
            </div>
        </div>
    `;
}
