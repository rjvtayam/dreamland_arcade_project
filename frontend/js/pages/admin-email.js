(function() {
    var view = 'list';
    var currentFolder = 'inbox';
    var selectedEmail = null;
    var emails = [];
    var searchQuery = '';
    var composing = false;
    var replyingTo = null;



    function timeAgo(dateStr) {
        if (!dateStr) return '';
        var now = new Date();
        var d = new Date(dateStr);
        var diff = Math.floor((now - d) / 1000);
        if (diff < 60) return 'just now';
        if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
        if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
        if (diff < 604800) return Math.floor(diff / 86400) + 'd ago';
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    function formatDate(dateStr) {
        if (!dateStr) return '';
        var d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    }

    function stripHtml(html) {
        if (!html) return '';
        var tmp = document.createElement('div');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    }

    var iconSvg = function(d, c, s) {
        s = s || 18;
        return '<svg width="' + s + '" height="' + s + '" fill="none" stroke="' + c + '" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="' + d + '"/></svg>';
    };

    var icons = {
        inbox: 'M22 12h-6l-2 3h-4l-2-3H2',
        sent: 'M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z',
        all: 'M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z',
        unread: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
        compose: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
        reply: 'M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6',
        back: 'M10 19l-7-7m0 0l7-7m-7 7h18',
        search: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
        refresh: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
        close: 'M6 18L18 6M6 6l12 12',
        mail: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
        send: 'M12 19l9 2-9-18-9 18 9-2zm0 0v-8',
        paperclip: 'M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13',
        trash: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
        check: 'M5 13l4 4L19 7',
        user: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    };

    function renderEmailPage() {
        var user = Auth.getUser();
        var app = document.getElementById('app');
        app.innerHTML = '<div class="layout">' + renderSidebar() +
            '<div class="main-content">' + renderNavbar('Email') +
            '<div class="page-content" id="page-body">' + renderEmailLayout() +
            '</div></div></div>';

        document.getElementById('logout-btn') && document.getElementById('logout-btn').addEventListener('click', function(e) { e.preventDefault(); Auth.logout(); });
        initNavbarNotifications();
        loadEmails();
        bindEvents();
    }

    function renderEmailLayout() {
        return '<div style="display:grid;grid-template-columns:220px 380px 1fr;gap:0;height:calc(100vh - 120px);overflow:hidden;border-radius:16px;border:1px solid #1e293b;background:#0a0e1a;">' +
            renderFolderPanel() +
            '<div id="email-list-panel" style="border-right:1px solid #1e293b;display:flex;flex-direction:column;overflow:hidden;">' +
                renderEmailListHeader() +
                '<div id="email-list" style="flex:1;overflow-y:auto;"></div>' +
            '</div>' +
            '<div id="email-view-panel" style="display:flex;flex-direction:column;overflow:hidden;">' +
                '<div id="email-view" style="flex:1;overflow-y:auto;"></div>' +
            '</div>' +
        '</div>';
    }

    function renderFolderPanel() {
        var folders = [
            { key: 'inbox', label: 'Inbox', icon: icons.inbox, color: '#6366f1' },
            { key: 'unread', label: 'Unread', icon: icons.unread, color: '#f59e0b' },
            { key: 'sent', label: 'Sent', icon: icons.sent, color: '#22c55e' },
            { key: 'all', label: 'All Mail', icon: icons.all, color: '#94a3b8' },
        ];
        var html = '<div style="padding:16px 12px;display:flex;flex-direction:column;gap:2px;background:linear-gradient(180deg,#0f1219,#0a0e1a);">';
        html += '<div style="padding:8px 10px;margin-bottom:12px;">' +
            '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">' +
                '<div style="width:28px;height:28px;border-radius:8px;background:linear-gradient(135deg,#6366f1,#8b5cf6);display:flex;align-items:center;justify-content:center;">' +
                    iconSvg(icons.mail, '#fff', 14) +
                '</div>' +
                '<span style="color:#e2e8f0;font-weight:800;font-size:0.85rem;">Mail</span>' +
            '</div>' +
        '</div>';

        folders.forEach(function(f) {
            var active = currentFolder === f.key;
            html += '<button onclick="window.__emailFolder(\'' + f.key + '\')" style="width:100%;display:flex;align-items:center;gap:10px;padding:9px 10px;border:none;border-radius:8px;cursor:pointer;font-size:0.78rem;font-weight:' + (active ? '700' : '500') + ';font-family:inherit;transition:all 0.2s;background:' + (active ? 'rgba(99,102,241,0.1)' : 'transparent') + ';color:' + (active ? f.color : '#94a3b8') + ';text-align:left;">' +
                iconSvg(f.icon, active ? f.color : '#64748b', 16) +
                '<span>' + f.label + '</span>' +
            '</button>';
        });

        html += '<div style="flex:1;"></div>';
        html += '<button onclick="window.__emailCompose()" style="display:flex;align-items:center;justify-content:center;gap:8px;padding:10px;border:none;border-radius:10px;cursor:pointer;font-size:0.78rem;font-weight:700;font-family:inherit;background:linear-gradient(135deg,#6366f1,#4f46e5);color:#fff;box-shadow:0 2px 12px rgba(99,102,241,0.3);transition:all 0.25s;" onmouseenter="this.style.transform=\'translateY(-1px)\';this.style.boxShadow=\'0 4px 20px rgba(99,102,241,0.4)\'" onmouseleave="this.style.transform=\'translateY(0)\';this.style.boxShadow=\'0 2px 12px rgba(99,102,241,0.3)\'">' +
            iconSvg(icons.compose, '#fff', 15) + ' Compose' +
        '</button>';
        html += '</div>';
        return html;
    }

    function renderEmailListHeader() {
        var folderLabels = { inbox: 'Inbox', sent: 'Sent', all: 'All Mail', unread: 'Unread' };
        return '<div style="padding:14px 16px;border-bottom:1px solid #1e293b;background:#0d1117;">' +
            '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">' +
                '<span style="color:#e2e8f0;font-weight:800;font-size:0.9rem;">' + (folderLabels[currentFolder] || 'Inbox') + '</span>' +
                '<button onclick="window.__emailRefresh()" style="background:transparent;border:1px solid #1e293b;border-radius:6px;padding:4px 8px;cursor:pointer;color:#64748b;transition:all 0.2s;" onmouseenter="this.style.color=\'#a78bfa\';this.style.borderColor=\'#6366f144\'" onmouseleave="this.style.color=\'#64748b\';this.style.borderColor=\'#1e293b\'">' +
                    iconSvg(icons.refresh, 'currentColor', 14) +
                '</button>' +
            '</div>' +
            '<div style="position:relative;">' +
                '<span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);opacity:0.4;">' + iconSvg(icons.search, '#64748b', 14) + '</span>' +
                '<input type="text" id="email-search" placeholder="Search emails..." oninput="window.__emailSearch(this.value)" style="width:100%;background:#080c18;border:1px solid #1e293b;border-radius:8px;padding:8px 10px 8px 32px;color:#e2e8f0;font-size:0.78rem;font-family:inherit;outline:none;transition:border-color 0.2s;box-sizing:border-box;" onfocus="this.style.borderColor=\'#6366f144\'" onblur="this.style.borderColor=\'#1e293b\'">' +
            '</div>' +
        '</div>';
    }

    function renderEmailListItem(em) {
        var active = selectedEmail && selectedEmail.id === em.id;
        var isUnread = em.direction === 'inbound' && em.status !== 'read';
        var isSent = em.direction === 'outbound';
        var preview = stripHtml(em.body || em.body_text || '').substring(0, 80);
        var displayName = isSent ? ('To: ' + em.to_email) : em.from_email;
        if (em.sender_name && !isSent) displayName = em.sender_name;

        return '<div onclick="window.__emailSelect(' + em.id + ')" style="padding:12px 16px;cursor:pointer;border-bottom:1px solid #111827;transition:all 0.15s;background:' + (active ? 'rgba(99,102,241,0.08)' : 'transparent') + ';border-left:3px solid ' + (active ? '#6366f1' : 'transparent') + ';" onmouseenter="if(!this.classList.contains(\'email-active\'))this.style.background=\'rgba(99,102,241,0.04)\'" onmouseleave="if(!this.classList.contains(\'email-active\'))this.style.background=\'' + (active ? 'rgba(99,102,241,0.08)' : 'transparent') + '\'">' +
        '<div style="display:flex;align-items:center;gap:10px;">' +
            (isUnread ? '<div style="width:8px;height:8px;border-radius:50%;background:#8b5cf6;box-shadow:0 0 8px rgba(139,92,246,0.5);flex-shrink:0;"></div>' : '<div style="width:8px;flex-shrink:0;"></div>') +
            '<div style="flex:1;min-width:0;">' +
                '<div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:3px;">' +
                    '<span style="color:' + (isUnread ? '#e2e8f0' : '#94a3b8') + ';font-weight:' + (isUnread ? '700' : '500') + ';font-size:0.78rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:200px;">' + esc(displayName) + '</span>' +
                    '<span style="color:#475569;font-size:0.65rem;flex-shrink:0;">' + timeAgo(em.created_at) + '</span>' +
                '</div>' +
                '<div style="color:' + (isUnread ? '#e2e8f0' : '#64748b') + ';font-size:0.75rem;font-weight:' + (isUnread ? '600' : '400') + ';white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:2px;">' + esc(em.subject || '(no subject)') + '</div>' +
                '<div style="color:#475569;font-size:0.7rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + esc(preview) + '</div>' +
            '</div>' +
        '</div></div>';
    }

    function renderEmptyState(msg) {
        return '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:#475569;">' +
            '<div style="margin-bottom:12px;opacity:0.3;">' + iconSvg(icons.mail, '#475569', 48) + '</div>' +
            '<div style="font-size:0.85rem;font-weight:500;">' + msg + '</div>' +
        '</div>';
    }

    function renderEmailViewEmpty() {
        return '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:#475569;">' +
            '<div style="margin-bottom:16px;opacity:0.2;">' + iconSvg(icons.mail, '#475569', 64) + '</div>' +
            '<div style="font-size:0.95rem;font-weight:600;margin-bottom:4px;color:#64748b;">Select an email to read</div>' +
            '<div style="font-size:0.78rem;">Choose from the list on the left</div>' +
        '</div>';
    }

    function renderComposeView() {
        var toAddr = replyingTo ? (replyingTo.direction === 'outbound' ? replyingTo.to_email : replyingTo.from_email) : '';
        var subj = replyingTo ? ('Re: ' + (replyingTo.subject || '')) : '';
        var quotedBody = replyingTo ? '\n\n---\nOn ' + formatDate(replyingTo.created_at) + ', ' + (replyingTo.from_email) + ' wrote:\n\n' + stripHtml(replyingTo.body) : '';

        return '<div style="padding:20px 24px;height:100%;display:flex;flex-direction:column;">' +
            '<div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;padding-bottom:14px;border-bottom:1px solid #1e293b;">' +
                '<button onclick="window.__emailBackToList()" style="background:transparent;border:1px solid #1e293b;border-radius:8px;padding:6px 10px;cursor:pointer;color:#64748b;transition:all 0.2s;" onmouseenter="this.style.color=\'#e2e8f0\';this.style.borderColor=\'#334155\'" onmouseleave="this.style.color=\'#64748b\';this.style.borderColor=\'#1e293b\'">' +
                    iconSvg(icons.back, 'currentColor', 14) +
                '</button>' +
                '<span style="color:#e2e8f0;font-weight:800;font-size:0.95rem;">' + (replyingTo ? 'Reply' : 'New Email') + '</span>' +
            '</div>' +
            '<div style="display:flex;flex-direction:column;gap:12px;flex:1;">' +
                '<div style="display:flex;align-items:center;gap:10px;">' +
                    '<label style="color:#64748b;font-size:0.7rem;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;min-width:50px;">To</label>' +
                    '<input type="email" id="email-to" value="' + esc(toAddr) + '" placeholder="recipient@email.com" style="flex:1;background:#080c18;border:1px solid #1e293b;border-radius:8px;padding:8px 12px;color:#e2e8f0;font-size:0.82rem;font-family:inherit;outline:none;transition:border-color 0.2s;" onfocus="this.style.borderColor=\'#6366f144\'" onblur="this.style.borderColor=\'#1e293b\'">' +
                '</div>' +
                '<div style="display:flex;align-items:center;gap:10px;">' +
                    '<label style="color:#64748b;font-size:0.7rem;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;min-width:50px;">CC</label>' +
                    '<input type="email" id="email-cc" value="" placeholder="cc@email.com (optional)" style="flex:1;background:#080c18;border:1px solid #1e293b;border-radius:8px;padding:8px 12px;color:#e2e8f0;font-size:0.82rem;font-family:inherit;outline:none;transition:border-color 0.2s;" onfocus="this.style.borderColor=\'#6366f144\'" onblur="this.style.borderColor=\'#1e293b\'">' +
                '</div>' +
                '<div style="display:flex;align-items:center;gap:10px;">' +
                    '<label style="color:#64748b;font-size:0.7rem;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;min-width:50px;">Subject</label>' +
                    '<input type="text" id="email-subject" value="' + esc(subj) + '" placeholder="Email subject" style="flex:1;background:#080c18;border:1px solid #1e293b;border-radius:8px;padding:8px 12px;color:#e2e8f0;font-size:0.82rem;font-family:inherit;outline:none;transition:border-color 0.2s;" onfocus="this.style.borderColor=\'#6366f144\'" onblur="this.style.borderColor=\'#1e293b\'">' +
                '</div>' +
                '<div style="flex:1;display:flex;flex-direction:column;">' +
                    '<textarea id="email-body" placeholder="Write your email here..." style="flex:1;min-height:200px;background:#080c18;border:1px solid #1e293b;border-radius:10px;padding:14px;color:#e2e8f0;font-size:0.82rem;font-family:Consolas,Monaco,\'Courier New\',monospace;line-height:1.65;resize:none;outline:none;transition:border-color 0.2s;box-sizing:border-box;" onfocus="this.style.borderColor=\'#6366f144\'" onblur="this.style.borderColor=\'#1e293b\'">' + esc(quotedBody) + '</textarea>' +
                '</div>' +
                '<div style="display:flex;justify-content:flex-end;gap:10px;padding-top:12px;border-top:1px solid #1e293b;">' +
                    '<button onclick="window.__emailBackToList()" style="background:transparent;color:#64748b;border:1px solid #1e293b;border-radius:8px;padding:8px 16px;cursor:pointer;font-weight:600;font-size:0.78rem;font-family:inherit;transition:all 0.2s;" onmouseenter="this.style.color=\'#e2e8f0\';this.style.borderColor=\'#334155\'" onmouseleave="this.style.color=\'#64748b\';this.style.borderColor=\'#1e293b\'">Cancel</button>' +
                    '<button onclick="window.__emailSend()" style="background:linear-gradient(135deg,#6366f1,#4f46e5);color:#fff;border:none;border-radius:8px;padding:8px 20px;cursor:pointer;font-weight:700;font-size:0.78rem;font-family:inherit;display:inline-flex;align-items:center;gap:6px;box-shadow:0 2px 12px rgba(99,102,241,0.3);transition:all 0.25s;" onmouseenter="this.style.transform=\'translateY(-1px)\';this.style.boxShadow=\'0 4px 20px rgba(99,102,241,0.4)\'" onmouseleave="this.style.transform=\'translateY(0)\';this.style.boxShadow=\'0 2px 12px rgba(99,102,241,0.3)\'">' +
                        iconSvg(icons.send, '#fff', 14) + ' Send' +
                    '</button>' +
                '</div>' +
            '</div>' +
        '</div>';
    }

    function renderEmailDetail(em) {
        var isSent = em.direction === 'outbound';
        var displayFrom = isSent ? settings_from_email() : (em.sender_name ? em.sender_name + ' <' + em.from_email + '>' : em.from_email);
        var displayTo = isSent ? (em.sender_name ? em.sender_name + ' <' + em.from_email + '>' : em.from_email) : em.to_email;

        var html = '<div style="padding:20px 24px;height:100%;display:flex;flex-direction:column;">';
        html += '<div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;padding-bottom:14px;border-bottom:1px solid #1e293b;">' +
            '<button onclick="window.__emailBackToList()" style="background:transparent;border:1px solid #1e293b;border-radius:8px;padding:6px 10px;cursor:pointer;color:#64748b;transition:all 0.2s;" onmouseenter="this.style.color=\'#e2e8f0\';this.style.borderColor=\'#334155\'" onmouseleave="this.style.color=\'#64748b\';this.style.borderColor=\'#1e293b\'">' +
                iconSvg(icons.back, 'currentColor', 14) +
            '</button>' +
            '<div style="flex:1;"></div>' +
            '<button onclick="window.__emailReply(' + em.id + ')" style="background:transparent;border:1px solid rgba(99,102,241,0.25);border-radius:8px;padding:6px 14px;cursor:pointer;color:#a78bfa;font-size:0.75rem;font-weight:600;font-family:inherit;display:inline-flex;align-items:center;gap:5px;transition:all 0.2s;" onmouseenter="this.style.borderColor=\'#6366f1\';this.style.background=\'rgba(99,102,241,0.08)\'" onmouseleave="this.style.borderColor=\'rgba(99,102,241,0.25)\';this.style.background=\'transparent\'">' +
                iconSvg(icons.reply, 'currentColor', 13) + ' Reply' +
            '</button>' +
            '<button onclick="window.__emailDelete(' + em.id + ')" style="background:transparent;border:1px solid rgba(239,68,68,0.2);border-radius:8px;padding:6px 10px;cursor:pointer;color:#ef4444;transition:all 0.2s;" onmouseenter="this.style.borderColor=\'#ef4444\';this.style.background=\'rgba(239,68,68,0.08)\'" onmouseleave="this.style.borderColor=\'rgba(239,68,68,0.2)\';this.style.background=\'transparent\'">' +
                iconSvg(icons.trash, 'currentColor', 13) +
            '</button>' +
        '</div>';

        html += '<div style="flex:1;overflow-y:auto;">';
        html += '<div style="margin-bottom:16px;">' +
            '<h2 style="color:#e2e8f0;font-size:1.1rem;font-weight:800;margin:0 0 14px 0;line-height:1.4;">' + esc(em.subject || '(no subject)') + '</h2>' +
            '<div style="display:flex;align-items:flex-start;gap:12px;">' +
                '<div style="width:38px;height:38px;border-radius:10px;background:linear-gradient(135deg,' + (isSent ? '#22c55e' : '#6366f1') + ',' + (isSent ? '#16a34a' : '#4f46e5') + ');display:flex;align-items:center;justify-content:center;flex-shrink:0;">' +
                    iconSvg(icons.user, '#fff', 18) +
                '</div>' +
                '<div style="flex:1;">' +
                    '<div style="display:flex;align-items:baseline;gap:8px;margin-bottom:2px;">' +
                        '<span style="color:#e2e8f0;font-weight:700;font-size:0.82rem;">' + esc(displayFrom) + '</span>' +
                        '<span style="color:#475569;font-size:0.68rem;">to</span>' +
                        '<span style="color:#94a3b8;font-size:0.78rem;">' + esc(displayTo) + '</span>' +
                    '</div>' +
                    '<div style="color:#475569;font-size:0.7rem;">' + formatDate(em.created_at) + (em.cc_email ? ' · CC: ' + esc(em.cc_email) : '') + '</div>' +
                '</div>' +
            '</div>' +
        '</div>';

        html += '<div style="border-top:1px solid #1e293b;padding-top:16px;color:#cbd5e1;font-size:0.82rem;line-height:1.75;word-wrap:break-word;">';
        if (em.body && em.body.includes('<')) {
            html += '<div class="email-body-content" style="max-width:100%;overflow-wrap:break-word;">' + em.body + '</div>';
        } else {
            html += '<pre style="white-space:pre-wrap;word-wrap:break-word;font-family:Consolas,Monaco,\'Courier New\',monospace;margin:0;font-size:0.82rem;color:#cbd5e1;">' + esc(em.body_text || em.body || '') + '</pre>';
        }
        html += '</div>';

        if (em.reply_chain && em.reply_chain.length > 0) {
            html += '<div style="border-top:1px solid #1e293b;margin-top:20px;padding-top:14px;">' +
                '<div style="color:#64748b;font-size:0.7rem;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;">Thread</div>';
            em.reply_chain.forEach(function(r) {
                html += '<div onclick="window.__emailSelect(' + r.id + ')" style="padding:8px 12px;border-radius:8px;margin-bottom:4px;cursor:pointer;transition:all 0.15s;border:1px solid transparent;" onmouseenter="this.style.background=\'rgba(99,102,241,0.05)\';this.style.borderColor=\'#1e293b\'" onmouseleave="this.style.background=\'transparent\';this.style.borderColor=\'transparent\'">' +
                    '<div style="display:flex;justify-content:space-between;">' +
                        '<span style="color:#94a3b8;font-size:0.75rem;">' + esc(r.from_email) + '</span>' +
                        '<span style="color:#475569;font-size:0.65rem;">' + timeAgo(r.created_at) + '</span>' +
                    '</div>' +
                    '<div style="color:#64748b;font-size:0.72rem;">' + esc(r.subject) + '</div>' +
                '</div>';
            });
            html += '</div>';
        }

        html += '</div></div>';
        return html;
    }

    function settings_from_email() {
        return 'Dreamland Arcade <dreamlandarcade2026@gmail.com>';
    }

    async function loadEmails() {
        var listEl = document.getElementById('email-list');
        if (!listEl) return;
        listEl.innerHTML = '<div style="padding:40px;text-align:center;color:#475569;"><div class="spinner"></div></div>';

        try {
            var params = '?folder=' + currentFolder;
            if (searchQuery) params += '&search=' + encodeURIComponent(searchQuery);
            var data = await apiGet('/emails' + params);
            emails = data.emails || [];
            renderEmailList();
        } catch (err) {
            listEl.innerHTML = renderEmptyState('Failed to load emails');
        }
    }

    function renderEmailList() {
        var listEl = document.getElementById('email-list');
        if (!listEl) return;
        if (emails.length === 0) {
            listEl.innerHTML = renderEmptyState(currentFolder === 'sent' ? 'No sent emails' : 'No emails');
            return;
        }
        var html = '';
        emails.forEach(function(em) {
            html += renderEmailListItem(em);
        });
        listEl.innerHTML = html;
    }

    function renderViewPanel() {
        var viewEl = document.getElementById('email-view');
        if (!viewEl) return;
        if (composing) {
            viewEl.innerHTML = renderComposeView();
        } else if (selectedEmail) {
            viewEl.innerHTML = renderEmailDetail(selectedEmail);
        } else {
            viewEl.innerHTML = renderEmailViewEmpty();
        }
    }

    function bindEvents() {
        renderViewPanel();
    }

    window.__emailFolder = function(folder) {
        currentFolder = folder;
        selectedEmail = null;
        composing = false;
        replyingTo = null;
        var pageBody = document.getElementById('page-body');
        if (pageBody) {
            pageBody.innerHTML = renderEmailLayout();
            loadEmails();
            bindEvents();
        }
    };

    window.__emailSearch = function(val) {
        searchQuery = val;
        clearTimeout(window.__emailSearchTimer);
        window.__emailSearchTimer = setTimeout(function() { loadEmails(); }, 300);
    };

    window.__emailSelect = async function(id) {
        composing = false;
        replyingTo = null;
        try {
            selectedEmail = await apiGet('/emails/' + id);
            renderViewPanel();
            var listItems = document.querySelectorAll('#email-list > div');
            listItems.forEach(function(el) { el.style.borderLeftColor = 'transparent'; el.style.background = 'transparent'; });
        } catch (err) {
            Toast.error('Failed to load email');
        }
    };

    window.__emailCompose = function() {
        composing = true;
        replyingTo = null;
        selectedEmail = null;
        renderViewPanel();
    };

    window.__emailReply = function(id) {
        composing = true;
        replyingTo = selectedEmail;
        renderViewPanel();
    };

    window.__emailBackToList = function() {
        composing = false;
        replyingTo = null;
        renderViewPanel();
    };

    window.__emailRefresh = function() {
        loadEmails();
        Toast.info('Refreshing...');
    };

    window.__emailSend = async function() {
        var to = document.getElementById('email-to') ? document.getElementById('email-to').value.trim() : '';
        var cc = document.getElementById('email-cc') ? document.getElementById('email-cc').value.trim() : '';
        var subject = document.getElementById('email-subject') ? document.getElementById('email-subject').value.trim() : '';
        var body = document.getElementById('email-body') ? document.getElementById('email-body').value : '';

        if (!to) { Toast.error('Recipient is required'); return; }
        if (!subject && !body) { Toast.error('Subject or body is required'); return; }

        try {
            var payload = { to: to, subject: subject, body: '<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;">' + body.replace(/\n/g, '<br>') + '</div>', body_text: body };
            if (cc) payload.cc = cc;
            if (replyingTo) payload.in_reply_to = replyingTo.id;

            var endpoint = replyingTo ? '/emails/' + replyingTo.id + '/reply' : '/emails/send';
            var result = await apiPost(endpoint, payload);

            Toast.success(result.message || 'Email sent');
            composing = false;
            replyingTo = null;
            selectedEmail = null;
            currentFolder = 'sent';
            var pageBody = document.getElementById('page-body');
            if (pageBody) {
                pageBody.innerHTML = renderEmailLayout();
                loadEmails();
                bindEvents();
            }
        } catch (err) {
            Toast.error('Failed to send email: ' + (err.message || 'Unknown error'));
        }
    };

    window.__emailDelete = async function(id) {
        if (!await confirmAsync('Delete this email?')) return;
        try {
            await apiDelete('/emails/' + id);
            Toast.success('Email deleted');
            selectedEmail = null;
            loadEmails();
            renderViewPanel();
        } catch (err) {
            Toast.error('Failed to delete');
        }
    };

    window.__emailMarkRead = async function(id) {
        try {
            await apiPut('/emails/' + id + '/read');
        } catch (err) {}
    };

    Router.register('email', renderEmailPage);
})();
