(function() {
    var currentFolder = 'inbox';
    var selectedEmail = null;
    var emails = [];
    var searchQuery = '';
    var composing = false;
    var replyingTo = null;
    var selectedIds = {};

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
        replyAll: 'M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4',
        forward: 'M14 4l6 6-6 6M20 10H6m8-6v12',
        back: 'M10 19l-7-7m0 0l7-7m-7 7h18',
        search: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
        refresh: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
        close: 'M6 18L18 6M6 6l12 12',
        mail: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
        send: 'M12 19l9 2-9-18-9 18 9-2zm0 0v-8',
        trash: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
        check: 'M5 13l4 4L19 7',
        user: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
        star: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
        archive: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4',
        filter: 'M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z',
        paperclip: 'M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13',
        more: 'M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z',
        shield: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
        lightning: 'M13 10V3L4 14h7v7l9-11h-7z',
    };

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

    function formatFullDate(dateStr) {
        if (!dateStr) return '';
        var d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }

    function stripHtml(html) {
        if (!html) return '';
        var tmp = document.createElement('div');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    }

    function getEmailFrom() {
        var user = Auth.getUser();
        if (!user) return 'noreply@dreamland-arcade.com';
        return (user.first_name + '.' + user.last_name).toLowerCase() + '@dreamland-arcade.com';
    }

    function renderEmailPage() {
        var app = document.getElementById('app');
        app.innerHTML = '<div class="layout">' + renderSidebar() +
            '<div class="main-content">' + renderNavbar('Email') +
            '<div class="page-content" id="page-body">' + renderEmailContainer() +
            '</div></div></div>';

        document.getElementById('logout-btn') && document.getElementById('logout-btn').addEventListener('click', function(e) { e.preventDefault(); Auth.logout(); });
        initNavbarNotifications();
        loadEmails();
    }

    function renderEmailContainer() {
        return '<div class="email-app">' +
            '<div class="email-sidebar">' + renderFolderPanel() + '</div>' +
            '<div class="email-list-panel" id="email-list-panel">' +
                renderListHeader() +
                '<div class="email-list-scroll" id="email-list"></div>' +
            '</div>' +
            '<div class="email-view-panel" id="email-view-panel">' +
                '<div id="email-view" class="email-view-scroll"></div>' +
            '</div>' +
        '</div>';
    }

    function renderFolderPanel() {
        var folders = [
            { key: 'inbox', label: 'Inbox', icon: icons.inbox, color: '#00f0ff' },
            { key: 'unread', label: 'Unread', icon: icons.unread, color: '#ffaa00' },
            { key: 'sent', label: 'Sent', icon: icons.sent, color: '#00ff88' },
            { key: 'all', label: 'All Mail', icon: icons.all, color: '#8888aa' },
            { key: 'trash', label: 'Trash', icon: icons.trash, color: '#ff4466' },
        ];

        var html = '<div class="email-sidebar-inner">';
        html += '<div class="email-sidebar-brand">' +
            '<div class="email-brand-icon">' + iconSvg(icons.lightning, '#00f0ff', 18) + '</div>' +
            '<div><div class="email-brand-title">DREAMLAND MAIL</div><div class="email-brand-sub">Secure Messaging</div></div>' +
        '</div>';

        html += '<div class="email-folder-list">';
        folders.forEach(function(f) {
            var active = currentFolder === f.key;
            html += '<button class="email-folder-btn ' + (active ? 'active' : '') + '" onclick="window.__emailFolder(\'' + f.key + '\')" style="--accent:' + f.color + '">' +
                '<span class="email-folder-icon">' + iconSvg(f.icon, active ? f.color : '#555577', 16) + '</span>' +
                '<span class="email-folder-label">' + f.label + '</span>' +
            '</button>';
        });
        html += '</div>';

        html += '<div class="email-sidebar-footer">' +
            '<button class="email-compose-btn" onclick="window.__emailCompose()">' +
                iconSvg(icons.compose, '#fff', 15) +
                '<span>Compose</span>' +
            '</button>' +
            '<div class="email-service-badge">' +
                iconSvg(icons.shield, '#00f0ff', 12) +
                '<span>Powered by Gmail SMTP</span>' +
            '</div>' +
        '</div>';
        html += '</div>';
        return html;
    }

    function renderListHeader() {
        var labels = { inbox: 'Inbox', sent: 'Sent', all: 'All Mail', unread: 'Unread', trash: 'Trash' };
        var count = Object.keys(selectedIds).length;
        var isTrash = currentFolder === 'trash';

        var html = '<div class="email-list-header">' +
            '<div class="email-list-title-row">' +
                '<span class="email-list-title">' + (labels[currentFolder] || 'Inbox') + '</span>' +
                '<button class="email-icon-btn" onclick="window.__emailRefresh()" title="Refresh">' + iconSvg(icons.refresh, 'currentColor', 15) + '</button>' +
            '</div>';

        if (count > 0) {
            html += '<div class="email-bulk-bar">' +
                '<span class="email-bulk-count">' + count + ' selected</span>' +
                '<div class="email-bulk-actions">';
            if (isTrash) {
                html += '<button class="email-bulk-btn restore" onclick="window.__emailBulkRestore()">' + iconSvg(icons.inbox, 'currentColor', 13) + ' Restore</button>' +
                    '<button class="email-bulk-btn danger" onclick="window.__emailBulkPermanentDelete()">' + iconSvg(icons.trash, 'currentColor', 13) + ' Delete Forever</button>';
            } else {
                html += '<button class="email-bulk-btn danger" onclick="window.__emailBulkTrash()">' + iconSvg(icons.trash, 'currentColor', 13) + ' Trash</button>';
            }
            html += '<button class="email-bulk-btn" onclick="window.__emailClearSelection()">Cancel</button>' +
                '</div></div>';
        } else {
            html += '<div class="email-search-box">' +
                '<span class="email-search-icon">' + iconSvg(icons.search, '#555577', 14) + '</span>' +
                '<input type="text" id="email-search" class="email-search-input" placeholder="Search emails..." oninput="window.__emailSearch(this.value)">' +
            '</div>';
        }

        html += '</div>';
        return html;
    }

    function renderListItem(em) {
        var active = selectedEmail && selectedEmail.id === em.id;
        var checked = selectedIds[em.id] ? true : false;
        var isUnread = em.direction === 'inbound' && em.status !== 'read';
        var isSent = em.direction === 'outbound';
        var preview = stripHtml(em.body || em.body_text || '').substring(0, 100);
        var displayName = isSent ? ('To: ' + em.to_email) : em.from_email;
        if (em.sender_name && !isSent) displayName = em.sender_name;

        return '<div class="email-list-item ' + (active ? 'active' : '') + ' ' + (isUnread ? 'unread' : '') + ' ' + (checked ? 'checked' : '') + '">' +
            '<div class="email-item-checkbox" onclick="event.stopPropagation(); window.__emailToggleSelect(' + em.id + ')">' +
                '<div class="email-checkbox ' + (checked ? 'active' : '') + '">' + (checked ? iconSvg(icons.check, '#fff', 12) : '') + '</div>' +
            '</div>' +
            '<div class="email-item-click" onclick="window.__emailSelect(' + em.id + ')">' +
                '<div class="email-item-indicator">' +
                    (isUnread ? '<div class="email-unread-dot"></div>' : '') +
                '</div>' +
                '<div class="email-item-body">' +
                    '<div class="email-item-top">' +
                        '<span class="email-item-sender">' + esc(displayName) + '</span>' +
                        '<span class="email-item-time">' + timeAgo(em.created_at) + '</span>' +
                    '</div>' +
                    '<div class="email-item-subject">' + esc(em.subject || '(no subject)') + '</div>' +
                    '<div class="email-item-preview">' + esc(preview) + '</div>' +
                '</div>' +
            '</div>' +
        '</div>';
    }

    function renderEmptyState(msg) {
        return '<div class="email-empty-state">' +
            '<div class="email-empty-icon">' + iconSvg(icons.mail, '#333355', 48) + '</div>' +
            '<div class="email-empty-text">' + msg + '</div>' +
        '</div>';
    }

    function renderViewEmpty() {
        return '<div class="email-view-empty">' +
            '<div class="email-empty-hero">' +
                '<div class="email-empty-glow"></div>' +
                iconSvg(icons.mail, '#333366', 56) +
            '</div>' +
            '<div class="email-empty-title">Select an email</div>' +
            '<div class="email-empty-sub">Choose from the list or compose a new message</div>' +
        '</div>';
    }

    function renderComposeView() {
        var toAddr = replyingTo ? (replyingTo.direction === 'outbound' ? replyingTo.to_email : replyingTo.from_email) : '';
        var subj = replyingTo ? ('Re: ' + (replyingTo.subject || '')) : '';
        var quotedBody = replyingTo ? '\n\n---\nOn ' + formatFullDate(replyingTo.created_at) + ', ' + (replyingTo.from_email) + ' wrote:\n\n' + stripHtml(replyingTo.body) : '';

        return '<div class="email-compose">' +
            '<div class="email-compose-header">' +
                '<button class="email-back-btn" onclick="window.__emailBackToList()">' + iconSvg(icons.back, 'currentColor', 14) + '</button>' +
                '<span class="email-compose-title">' + (replyingTo ? 'Reply' : 'New Message') + '</span>' +
                '<div class="email-compose-actions">' +
                    '<button class="email-icon-btn danger" onclick="window.__emailBackToList()" title="Discard">' + iconSvg(icons.trash, 'currentColor', 14) + '</button>' +
                '</div>' +
            '</div>' +
            '<div class="email-compose-fields">' +
                '<div class="email-field-row">' +
                    '<label class="email-field-label">To</label>' +
                    '<input type="email" id="email-to" class="email-field-input" value="' + esc(toAddr) + '" placeholder="recipient@email.com">' +
                '</div>' +
                '<div class="email-field-row">' +
                    '<label class="email-field-label">CC</label>' +
                    '<input type="email" id="email-cc" class="email-field-input" value="" placeholder="cc@email.com (optional)">' +
                '</div>' +
                '<div class="email-field-row">' +
                    '<label class="email-field-label">Subject</label>' +
                    '<input type="text" id="email-subject" class="email-field-input" value="' + esc(subj) + '" placeholder="Email subject">' +
                '</div>' +
            '</div>' +
            '<div class="email-compose-body">' +
                '<textarea id="email-body" class="email-body-textarea" placeholder="Write your message...">' + esc(quotedBody) + '</textarea>' +
            '</div>' +
            '<div class="email-compose-footer">' +
                '<div class="email-compose-footer-left">' +
                    '<button class="email-compose-attach" title="Attach file">' + iconSvg(icons.paperclip, 'currentColor', 15) + '</button>' +
                '</div>' +
                '<div class="email-compose-footer-right">' +
                    '<button class="email-btn secondary" onclick="window.__emailBackToList()">Discard</button>' +
                    '<button class="email-btn primary" onclick="window.__emailSend()">' +
                        iconSvg(icons.send, '#fff', 14) + ' Send' +
                    '</button>' +
                '</div>' +
            '</div>' +
        '</div>';
    }

    function getSenderLogo(fromEmail) {
        var domain = fromEmail.split('@')[1] || '';
        domain = domain.toLowerCase();
        var logos = {
            'google.com': 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg',
            'gmail.com': 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg',
            'facebook.com': 'https://upload.wikimedia.org/wikipedia/commons/5/51/Facebook_f_logo_%282019%29.svg',
            'instagram.com': 'https://upload.wikimedia.org/wikipedia/commons/e/e7/Instagram_logo_2016.svg',
            'twitter.com': 'https://upload.wikimedia.org/wikipedia/commons/6/6f/Logo_of_Twitter.svg',
            'x.com': 'https://upload.wikimedia.org/wikipedia/commons/6/6f/Logo_of_Twitter.svg',
            'linkedin.com': 'https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png',
            'github.com': 'https://upload.wikimedia.org/wikipedia/commons/9/91/Octicons-mark-github.svg',
            'paypal.com': 'https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg',
            'amazon.com': 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg',
            'microsoft.com': 'https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg',
            'apple.com': 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg',
            'netflix.com': 'https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg',
            'spotify.com': 'https://upload.wikimedia.org/wikipedia/commons/2/26/Spotify_logo_with_text.svg',
        };
        for (var key in logos) {
            if (domain.includes(key)) return logos[key];
        }
        return null;
    }

    function getSenderColor(fromEmail) {
        var domain = fromEmail.split('@')[1] || '';
        domain = domain.toLowerCase();
        var colors = {
            'google.com': ['#4285f4', '#34a853'],
            'gmail.com': ['#ea4335', '#4285f4'],
            'facebook.com': ['#1877f2', '#0d47a1'],
            'instagram.com': ['#e1306c', '#f77737'],
            'twitter.com': ['#1da1f2', '#0d8bd9'],
            'x.com': ['#000000', '#333333'],
            'linkedin.com': ['#0077b5', '#005e93'],
            'github.com': ['#333333', '#24292e'],
            'paypal.com': ['#003087', '#009cde'],
            'amazon.com': ['#ff9900', '#232f3e'],
            'microsoft.com': ['#00a4ef', '#7fba00'],
            'apple.com': ['#555555', '#333333'],
            'netflix.com': ['#e50914', '#b20710'],
            'spotify.com': ['#1db954', '#1ed760'],
        };
        for (var key in colors) {
            if (domain.includes(key)) return colors[key];
        }
        var hue = 0;
        for (var i = 0; i < domain.length; i++) hue += domain.charCodeAt(i);
        hue = hue % 360;
        return ['hsl(' + hue + ',60%,50%)', 'hsl(' + hue + ',60%,35%)'];
    }

    function renderEmailDetail(em) {
        var isSent = em.direction === 'outbound';
        var isTrash = currentFolder === 'trash';
        var senderName = em.sender_name || em.from_email.split('@')[0];
        var senderInitial = senderName.charAt(0).toUpperCase();
        var logoUrl = getSenderLogo(em.from_email);
        var colors = getSenderColor(em.from_email);
        var statusBadge = em.status === 'sent' ? '<span class="email-status-badge sent">Sent</span>' :
                         em.status === 'demo' ? '<span class="email-status-badge demo">Demo</span>' :
                         em.status === 'failed' ? '<span class="email-status-badge failed">Failed</span>' : '';

        var html = '<div class="email-detail">';
        html += '<div class="email-detail-header">' +
            '<button class="email-back-btn" onclick="window.__emailBackToList()">' + iconSvg(icons.back, 'currentColor', 14) + '</button>' +
            '<div class="email-detail-actions">';

        if (isTrash) {
            html += '<button class="email-action-btn restore" onclick="window.__emailRestore(' + em.id + ')" title="Restore">' + iconSvg(icons.inbox, 'currentColor', 13) + ' Restore</button>' +
                '<button class="email-action-btn danger" onclick="window.__emailPermanentDelete(' + em.id + ')" title="Permanent Delete">' + iconSvg(icons.trash, 'currentColor', 13) + ' Delete Forever</button>';
        } else {
            html += '<button class="email-action-btn" onclick="window.__emailReply(' + em.id + ')" title="Reply">' + iconSvg(icons.reply, 'currentColor', 13) + ' Reply</button>' +
                '<button class="email-action-btn" title="Forward">' + iconSvg(icons.forward, 'currentColor', 13) + ' Forward</button>' +
                '<button class="email-action-btn danger" onclick="window.__emailDelete(' + em.id + ')" title="Move to Trash">' + iconSvg(icons.trash, 'currentColor', 13) + '</button>';
        }

        html += '</div></div>';

        html += '<div class="email-detail-scroll">';
        html += '<div class="email-detail-subject">' +
            '<h1 class="email-subject-text">' + esc(em.subject || '(no subject)') + '</h1>' +
            statusBadge +
        '</div>';

        html += '<div class="email-detail-meta">' +
            '<div class="email-meta-avatar" style="background:linear-gradient(135deg,' + colors[0] + ',' + colors[1] + ');">';
        if (logoUrl) {
            html += '<img src="' + logoUrl + '" style="width:18px;height:18px;object-fit:contain;" alt="">';
        } else {
            html += '<span style="color:#fff;font-weight:700;font-size:11px;">' + senderInitial + '</span>';
        }
        html += '</div>' +
            '<div class="email-meta-info">' +
                '<div class="email-meta-from">' +
                    '<span class="email-meta-name">' + esc(senderName) + '</span>' +
                    '<span class="email-meta-email">&lt;' + esc(em.from_email) + '&gt;</span>' +
                '</div>' +
                '<div class="email-meta-to">to <span>' + esc(em.to_email || '') + '</span></div>' +
                '<div class="email-meta-date">' + formatFullDate(em.created_at) + (em.cc_email ? ' · CC: ' + esc(em.cc_email) : '') + '</div>' +
            '</div>' +
        '</div>';

        html += '<div class="email-detail-body">';
        if (em.body && em.body.includes('<')) {
            html += '<div class="email-html-content">' + em.body + '</div>';
        } else {
            html += '<pre class="email-plain-content">' + esc(em.body_text || em.body || '') + '</pre>';
        }
        html += '</div>';

        if (em.reply_chain && em.reply_chain.length > 0) {
            html += '<div class="email-thread">' +
                '<div class="email-thread-header">' +
                    iconSvg(icons.inbox, '#555577', 14) +
                    '<span>Thread (' + em.reply_chain.length + ' messages)</span>' +
                '</div>';
            em.reply_chain.forEach(function(r) {
                html += '<div class="email-thread-item" onclick="window.__emailSelect(' + r.id + ')">' +
                    '<div class="email-thread-from">' + esc(r.from_email) + '</div>' +
                    '<div class="email-thread-subject">' + esc(r.subject) + '</div>' +
                    '<div class="email-thread-date">' + timeAgo(r.created_at) + '</div>' +
                '</div>';
            });
            html += '</div>';
        }

        html += '</div></div>';
        return html;
    }

    async function loadEmails() {
        var listEl = document.getElementById('email-list');
        if (!listEl) return;
        listEl.innerHTML = '<div class="email-loading"><div class="spinner"></div></div>';

        try {
            var params = '?folder=' + currentFolder;
            if (searchQuery) params += '&search=' + encodeURIComponent(searchQuery);
            var data = await apiGet('/emails' + params);
            emails = data.emails || [];
            renderList();
        } catch (err) {
            listEl.innerHTML = renderEmptyState('Failed to load emails');
        }
    }

    function renderList() {
        var listEl = document.getElementById('email-list');
        if (!listEl) return;
        if (emails.length === 0) {
            listEl.innerHTML = renderEmptyState(currentFolder === 'sent' ? 'No sent emails' : 'No emails');
            return;
        }
        var html = '';
        emails.forEach(function(em) {
            html += renderListItem(em);
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
            viewEl.innerHTML = renderViewEmpty();
        }
    }

    window.__emailFolder = function(folder) {
        currentFolder = folder;
        selectedEmail = null;
        composing = false;
        replyingTo = null;
        var pageBody = document.getElementById('page-body');
        if (pageBody) {
            pageBody.innerHTML = renderEmailContainer();
            loadEmails();
            renderViewPanel();
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
            renderList();
            renderViewPanel();
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

    window.__emailToggleSelect = function(id) {
        if (selectedIds[id]) {
            delete selectedIds[id];
        } else {
            selectedIds[id] = true;
        }
        renderList();
        renderViewPanel();
    };

    window.__emailToggleSelectAll = function() {
        var allSelected = emails.length > 0 && emails.every(function(e) { return selectedIds[e.id]; });
        if (allSelected) {
            selectedIds = {};
        } else {
            emails.forEach(function(e) { selectedIds[e.id] = true; });
        }
        renderList();
        renderViewPanel();
    };

    window.__emailClearSelection = function() {
        selectedIds = {};
        renderList();
        renderViewPanel();
    };

    window.__emailBulkTrash = async function() {
        var ids = Object.keys(selectedIds).map(Number);
        if (ids.length === 0) return;
        if (!await confirmAsync('Move ' + ids.length + ' email(s) to Trash?')) return;
        try {
            for (var i = 0; i < ids.length; i++) {
                await apiPut('/emails/' + ids[i] + '/trash');
            }
            Toast.success(ids.length + ' email(s) moved to Trash');
            selectedIds = {};
            selectedEmail = null;
            loadEmails();
            renderViewPanel();
        } catch (err) {
            Toast.error('Failed to move emails to trash');
        }
    };

    window.__emailBulkRestore = async function() {
        var ids = Object.keys(selectedIds).map(Number);
        if (ids.length === 0) return;
        try {
            for (var i = 0; i < ids.length; i++) {
                await apiPut('/emails/' + ids[i] + '/restore');
            }
            Toast.success(ids.length + ' email(s) restored');
            selectedIds = {};
            selectedEmail = null;
            loadEmails();
            renderViewPanel();
        } catch (err) {
            Toast.error('Failed to restore emails');
        }
    };

    window.__emailBulkPermanentDelete = async function() {
        var ids = Object.keys(selectedIds).map(Number);
        if (ids.length === 0) return;
        if (!await confirmAsync('Permanently delete ' + ids.length + ' email(s)? This cannot be undone.')) return;
        try {
            for (var i = 0; i < ids.length; i++) {
                await apiDelete('/emails/' + ids[i]);
            }
            Toast.success(ids.length + ' email(s) permanently deleted');
            selectedIds = {};
            selectedEmail = null;
            loadEmails();
            renderViewPanel();
        } catch (err) {
            Toast.error('Failed to delete emails');
        }
    };

    window.__emailSend = async function() {
        var to = document.getElementById('email-to') ? document.getElementById('email-to').value.trim() : '';
        var cc = document.getElementById('email-cc') ? document.getElementById('email-cc').value.trim() : '';
        var subject = document.getElementById('email-subject') ? document.getElementById('email-subject').value.trim() : '';
        var body = document.getElementById('email-body') ? document.getElementById('email-body').value : '';

        if (!to) { Toast.error('Recipient is required'); return; }
        if (!subject && !body) { Toast.error('Subject or body is required'); return; }

        try {
            var payload = {
                to: to,
                subject: subject,
                body: '<div style="font-family:system-ui,-apple-system,sans-serif;font-size:14px;line-height:1.6;color:#e2e8f0;">' +
                    '<div style="background:linear-gradient(135deg,#0a0e1a 0%,#1a1040 100%);padding:24px;border-radius:12px;border:1px solid #1e293b;">' +
                    '<div style="margin-bottom:16px;padding-bottom:16px;border-bottom:1px solid #1e293b;">' +
                    '<span style="color:#00f0ff;font-weight:700;font-size:16px;">🕹️ Dreamland Arcade</span>' +
                    '</div>' +
                    body.replace(/\n/g, '<br>') +
                    '<div style="margin-top:16px;padding-top:16px;border-top:1px solid #1e293b;color:#555577;font-size:12px;">' +
                    'This message was sent via Dreamland Arcade Mail System' +
                    '</div></div></div>',
            };
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
                pageBody.innerHTML = renderEmailContainer();
                loadEmails();
                renderViewPanel();
            }
        } catch (err) {
            Toast.error('Failed to send email: ' + (err.message || 'Unknown error'));
        }
    };

    window.__emailDelete = async function(id) {
        if (!await confirmAsync('Move this email to Trash?')) return;
        try {
            await apiPut('/emails/' + id + '/trash');
            Toast.success('Email moved to Trash');
            selectedEmail = null;
            loadEmails();
            renderViewPanel();
        } catch (err) {
            Toast.error('Failed to delete');
        }
    };

    window.__emailRestore = async function(id) {
        try {
            await apiPut('/emails/' + id + '/restore');
            Toast.success('Email restored to Inbox');
            selectedEmail = null;
            loadEmails();
            renderViewPanel();
        } catch (err) {
            Toast.error('Failed to restore');
        }
    };

    window.__emailPermanentDelete = async function(id) {
        if (!await confirmAsync('Permanently delete this email? This cannot be undone.')) return;
        try {
            await apiDelete('/emails/' + id);
            Toast.success('Email permanently deleted');
            selectedEmail = null;
            loadEmails();
            renderViewPanel();
        } catch (err) {
            Toast.error('Failed to delete');
        }
    };

    Router.register('email', renderEmailPage);
})();
