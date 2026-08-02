const NotificationCenter = {
    _pollInterval: null,
    _lastNotifCount: 0,
    _lastMsgCount: 0,
    _panelOpen: false,
    _activeTab: 'notifications',

    init() {
        this.startPolling();
        this.updateBadges();
    },

    startPolling() {
        if (this._pollInterval) clearInterval(this._pollInterval);
        this._pollInterval = setInterval(() => this.updateBadges(), 15000);
        this.updateBadges();
    },

    stopPolling() {
        if (this._pollInterval) { clearInterval(this._pollInterval); this._pollInterval = null; }
    },

    async updateBadges() {
        if (!Auth.isAuthenticated()) { this.stopPolling(); return; }
        try {
            const [notifRes, msgRes] = await Promise.all([
                apiGet('/notifications/unread-count'),
                apiGet('/messages/unread-count')
            ]);
            const nc = notifRes.count || 0;
            const mc = msgRes.count || 0;

            document.querySelectorAll('.notif-badge').forEach(b => {
                b.textContent = nc;
                b.style.display = nc > 0 ? 'flex' : 'none';
            });
            document.querySelectorAll('.msg-badge').forEach(b => {
                b.textContent = mc;
                b.style.display = mc > 0 ? 'flex' : 'none';
            });

            if (nc > this._lastNotifCount && this._lastNotifCount > 0) {
                Toast.info('You have new notifications');
            }
            this._lastNotifCount = nc;
            this._lastMsgCount = mc;
        } catch (e) {}
    },

    renderNotifButton() {
        return `
            <div style="position:relative;display:inline-flex;">
                <button id="nav-notif-btn" class="nav-icon-btn" title="Notifications">
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
                    <span class="notif-badge" style="display:none;position:absolute;top:-4px;right:-4px;background:#ff0044;color:#fff;font-size:0.55rem;font-weight:700;border-radius:50%;min-width:16px;height:16px;align-items:center;justify-content:center;padding:0 4px;box-shadow:0 0 8px rgba(255,0,68,0.5);">0</span>
                </button>
            </div>
        `;
    },

    renderMsgButton() {
        return `
            <div style="position:relative;display:inline-flex;">
                <button id="nav-msg-btn" class="nav-icon-btn" title="Messages">
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>
                    <span class="msg-badge" style="display:none;position:absolute;top:-4px;right:-4px;background:#6366f1;color:#fff;font-size:0.55rem;font-weight:700;border-radius:50%;min-width:16px;height:16px;align-items:center;justify-content:center;padding:0 4px;box-shadow:0 0 8px rgba(99,102,241,0.5);">0</span>
                </button>
            </div>
        `;
    },

    bindNavButtons() {
        const nb = document.getElementById('nav-notif-btn');
        const mb = document.getElementById('nav-msg-btn');
        if (nb) {
            nb.onclick = (e) => { e.stopPropagation(); this.togglePanel('notifications'); };
        }
        if (mb) {
            mb.onclick = (e) => { e.stopPropagation(); this.togglePanel('messages'); };
        }
    },

    bindDashboardButtons() {
        const dashMsg = document.getElementById('dash-msg-btn');
        const dashNotif = document.getElementById('dash-notif-btn');
        if (dashMsg) {
            dashMsg.onclick = (e) => { e.stopPropagation(); this.togglePanel('messages'); };
        }
        if (dashNotif) {
            dashNotif.onclick = (e) => { e.stopPropagation(); this.togglePanel('notifications'); };
        }
    },

    togglePanel(tab) {
        if (this._panelOpen && this._activeTab === tab) {
            this.closePanel();
            return;
        }
        this._activeTab = tab;
        this._panelOpen = true;
        this._renderPanel();
    },

    closePanel() {
        this._panelOpen = false;
        this._removeOutsideHandler();
        const panel = document.getElementById('nc-panel');
        if (panel) {
            panel.classList.remove('nc-panel-open');
            panel.classList.add('nc-panel-closing');
            setTimeout(() => panel.remove(), 200);
        }
    },

    _removeOutsideHandler() {
        if (this._outsideClickHandler) {
            document.removeEventListener('click', this._outsideClickHandler, true);
            this._outsideClickHandler = null;
        }
    },

    _renderPanel() {
        this._removeOutsideHandler();
        const existing = document.getElementById('nc-panel');
        if (existing) existing.remove();

        const panel = document.createElement('div');
        panel.id = 'nc-panel';
        panel.className = 'nc-panel nc-panel-open';
        document.body.appendChild(panel);

        const isNotif = this._activeTab === 'notifications';
        panel.innerHTML = `
            <div class="nc-panel-inner">
                <div class="nc-header">
                    <div class="nc-tabs">
                        <button id="nc-tab-notif" class="nc-tab ${isNotif ? 'active' : ''}">
                            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
                            Notifications
                        </button>
                        <button id="nc-tab-msg" class="nc-tab ${!isNotif ? 'active' : ''}">
                            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>
                            Messages
                        </button>
                    </div>
                    <button id="nc-close" class="nc-close">&times;</button>
                </div>
                <div id="nc-body" class="nc-body">
                    <div style="text-align:center;padding:40px;"><div class="spinner"></div></div>
                </div>
                <div class="nc-footer">
                    <button id="nc-new-thread" class="nc-new-btn" style="${isNotif ? 'display:none' : ''}">
                        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                        New Message
                    </button>
                </div>
            </div>
        `;

        panel.querySelector('#nc-close').onclick = () => this.closePanel();
        panel.querySelector('#nc-tab-notif').onclick = () => this._switchTab('notifications');
        panel.querySelector('#nc-tab-msg').onclick = () => this._switchTab('messages');
        panel.querySelector('#nc-new-thread').onclick = () => this.showNewThreadModal();

        this._outsideClickHandler = (e) => {
            const currentPanel = document.getElementById('nc-panel');
            if (!currentPanel) return;
            if (currentPanel.contains(e.target)) return;
            if (e.target.closest('#nav-notif-btn') || e.target.closest('#nav-msg-btn')) return;
            if (e.target.closest('#dash-msg-btn') || e.target.closest('#dash-notif-btn')) return;
            this.closePanel();
        };
        setTimeout(() => {
            document.addEventListener('click', this._outsideClickHandler, true);
        }, 0);

        this._loadTabContent(panel);
    },

    _switchTab(tab) {
        if (this._activeTab === tab) return;
        this._activeTab = tab;
        const panel = document.getElementById('nc-panel');
        if (!panel) return;

        panel.querySelectorAll('.nc-tab').forEach(t => t.classList.remove('active'));
        const targetTab = tab === 'notifications' ? panel.querySelector('#nc-tab-notif') : panel.querySelector('#nc-tab-msg');
        if (targetTab) targetTab.classList.add('active');

        const footer = panel.querySelector('#nc-footer');
        const newBtn = panel.querySelector('#nc-new-thread');
        if (newBtn) newBtn.style.display = tab === 'messages' ? '' : 'none';

        const body = panel.querySelector('#nc-body');
        body.innerHTML = '<div style="text-align:center;padding:40px;"><div class="spinner"></div></div>';

        if (tab === 'notifications') {
            this._loadNotifications(body);
        } else {
            this._loadThreads(body, panel);
        }
    },

    async _loadTabContent(panel) {
        const body = panel.querySelector('#nc-body');
        if (this._activeTab === 'notifications') {
            await this._loadNotifications(body);
        } else {
            await this._loadThreads(body, panel);
        }
    },

    async _loadNotifications(body) {
        try {
            const notifs = await apiGet('/notifications?limit=30');
            if (!notifs.length) {
                body.innerHTML = '<div class="nc-empty"><svg width="32" height="32" fill="none" stroke="#334155" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg><p>No notifications yet</p></div>';
                return;
            }
            const hasUnread = notifs.some(n => !n.is_read);
            body.innerHTML = `
                ${hasUnread ? '<div class="nc-actions"><button id="nc-mark-all" class="nc-mark-all">Mark all as read</button></div>' : ''}
                <div class="nc-list">${notifs.map(n => this._renderNotifItem(n)).join('')}</div>
            `;
            body.querySelector('#nc-mark-all')?.addEventListener('click', async () => {
                await apiPut('/notifications/read-all', {});
                this.updateBadges();
                this._loadNotifications(body);
            });
            body.querySelectorAll('.nc-notif-item').forEach(item => {
                item.onclick = async (e) => {
                    if (e.target.closest('.nc-notif-delete')) return;
                    const id = parseInt(item.dataset.id);
                    if (!item.classList.contains('read')) {
                        await apiPut(`/notifications/${id}/read`, {});
                        item.classList.add('read');
                        this.updateBadges();
                    }
                    const link = item.dataset.link;
                    if (link) { this.closePanel(); Router.navigate(link); }
                };
            });
            body.querySelectorAll('.nc-notif-delete').forEach(btn => {
                btn.onclick = async (e) => {
                    e.stopPropagation();
                    const id = parseInt(btn.dataset.id);
                    await apiDelete(`/notifications/${id}`);
                    this._loadNotifications(body);
                    this.updateBadges();
                };
            });
        } catch (e) {
            body.innerHTML = '<div class="nc-empty"><p>Failed to load notifications</p></div>';
        }
    },

    _renderNotifItem(n) {
        const iconMap = {
            info: '<svg width="16" height="16" fill="none" stroke="#6366f1" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
            success: '<svg width="16" height="16" fill="none" stroke="#22c55e" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
            warning: '<svg width="16" height="16" fill="none" stroke="#f59e0b" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>',
            error: '<svg width="16" height="16" fill="none" stroke="#ef4444" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
        };
        const icon = iconMap[n.type] || iconMap.info;
        return `
            <div class="nc-notif-item ${n.is_read ? 'read' : 'unread'}" data-id="${n.id}" data-link="${n.link || ''}" style="cursor:${n.link ? 'pointer' : 'default'};">
                <div class="nc-notif-icon">${icon}</div>
                <div class="nc-notif-content">
                    <div class="nc-notif-title">${esc(n.title)}</div>
                    <div class="nc-notif-msg">${esc(n.message)}</div>
                    <div class="nc-notif-meta">
                        ${n.sender_name ? '<span>' + esc(n.sender_name) + '</span> · ' : ''}
                        <span>${timeAgo(n.created_at)}</span>
                    </div>
                </div>
                <button class="nc-notif-delete" data-id="${n.id}" title="Delete">&times;</button>
            </div>
        `;
    },

    async _loadThreads(body, panel) {
        try {
            const threads = await apiGet('/messages/threads');
            if (!threads.length) {
                body.innerHTML = '<div class="nc-empty"><svg width="32" height="32" fill="none" stroke="#334155" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg><p>No conversations yet</p></div>';
                return;
            }
            body.innerHTML = '<div class="nc-list">' + threads.map(t => this._renderThreadItem(t)).join('') + '</div>';
            body.querySelectorAll('.nc-thread-item').forEach(item => {
                item.onclick = () => this._showThread(parseInt(item.dataset.id), body);
            });
        } catch (e) {
            body.innerHTML = '<div class="nc-empty"><p>Failed to load messages</p></div>';
        }
    },

    _renderThreadItem(t) {
        const senderLine = t.last_message_sender
            ? `<div class="nc-thread-to">From: ${esc(t.last_message_sender)} <span style="color:#6366f1;">• ${esc(t.last_message_sender_role || '')}</span></div>`
            : `<div class="nc-thread-to">${esc((t.participant_names || []).join(', '))}</div>`;
        const avatarText = t.last_message_sender
            ? t.last_message_sender.split(' ').map(w => w[0]).join('').substring(0,2).toUpperCase()
            : '??';
        return `
            <div class="nc-thread-item ${t.unread_count > 0 ? 'unread' : ''}" data-id="${t.id}">
                <div class="nc-thread-avatar">${avatarText}</div>
                <div class="nc-thread-content">
                    <div class="nc-thread-header">
                        <span class="nc-thread-names">${esc(t.subject)}</span>
                        <span class="nc-thread-time">${timeAgo(t.last_message_at || t.created_at)}</span>
                    </div>
                    <div class="nc-thread-preview">${esc(t.last_message || 'No messages yet')}</div>
                    ${senderLine}
                </div>
                ${t.unread_count > 0 ? '<div class="nc-thread-unread">' + t.unread_count + '</div>' : ''}
            </div>
        `;
    },

    async _showThread(threadId, body) {
        body.innerHTML = '<div style="text-align:center;padding:40px;"><div class="spinner"></div></div>';
        try {
            const data = await apiGet(`/messages/threads/${threadId}`);
            const user = Auth.getUser();
            body.innerHTML = `
                <div class="nc-thread-view">
                    <div class="nc-thread-messages" id="nc-messages">
                        ${(data.messages || []).map(m => this._renderMessage(m, user)).join('')}
                    </div>
                    <div class="nc-thread-input">
                        <input type="text" id="nc-msg-input" class="nc-input" placeholder="Type a message..." autocomplete="off" />
                        <button id="nc-send-btn" class="nc-send-btn">
                            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
                        </button>
                    </div>
                </div>
            `;
            const msgs = document.getElementById('nc-messages');
            if (msgs) msgs.scrollTop = msgs.scrollHeight;
            const sendMsg = async () => {
                const input = document.getElementById('nc-msg-input');
                const content = input?.value.trim();
                if (!content) return;
                input.value = '';
                await apiPost(`/messages/threads/${threadId}/messages`, { content });
                this._showThread(threadId, body);
                this.updateBadges();
            };
            document.getElementById('nc-send-btn').onclick = sendMsg;
            document.getElementById('nc-msg-input').onkeydown = (e) => { if (e.key === 'Enter') sendMsg(); };
        } catch (e) {
            body.innerHTML = '<div class="nc-empty"><p>Failed to load conversation</p></div>';
        }
    },

    _renderMessage(m, user) {
        const isMe = m.sender_id === user?.id;
        const roleBadge = m.sender_role ? `<span style="color:#6366f1;font-size:0.6rem;margin-left:4px;">• ${esc(m.sender_role)}</span>` : '';
        return `
            <div class="nc-msg ${isMe ? 'me' : 'other'}">
                <div class="nc-msg-bubble">
                    ${!isMe ? '<div class="nc-msg-sender">' + esc(m.sender_name || 'Unknown') + roleBadge + '</div>' : ''}
                    <div class="nc-msg-text">${esc(m.content)}</div>
                    <div class="nc-msg-time">${timeAgo(m.created_at)}</div>
                </div>
            </div>
        `;
    },

    async showNewThreadModal() {
        let users = [];
        try {
            users = await apiGet('/users?role=employee');
            const allUsers = await apiGet('/users?role=admin').catch(() => []);
            users = [...users, ...allUsers];
        } catch (e) {}
        const user = Auth.getUser();
        users = users.filter(u => u.id !== user?.id && u.is_active);

        const content = `
            <div style="display:flex;flex-direction:column;gap:16px;">
                <div>
                    <label style="color:#94a3b8;font-size:0.75rem;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;display:block;">Subject</label>
                    <input type="text" id="nc-thread-subject" class="nc-input" placeholder="Message subject..." style="width:100%;" />
                </div>
                <div>
                    <label style="color:#94a3b8;font-size:0.75rem;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;display:block;">To</label>
                    <div id="nc-participant-list" style="max-height:150px;overflow-y:auto;display:flex;flex-direction:column;gap:4px;">
                        ${users.map(u => `
                            <label class="nc-user-check">
                                <input type="checkbox" value="${u.id}" class="nc-participant-cb" />
                                <span class="nc-user-check-name">${esc(u.first_name + ' ' + u.last_name)}</span>
                                <span class="nc-user-check-role">${u.role}</span>
                            </label>
                        `).join('')}
                    </div>
                </div>
                <div>
                    <label style="color:#94a3b8;font-size:0.75rem;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;display:block;">Message</label>
                    <textarea id="nc-thread-content" class="nc-input" rows="3" placeholder="Write your message..." style="width:100%;resize:vertical;"></textarea>
                </div>
                <button id="nc-send-thread" class="nc-new-btn" style="align-self:flex-end;">
                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
                    Send
                </button>
            </div>
        `;
        Modal.show('New Message', content, { width: '480px', onOpen: (modal) => {
            modal.querySelector('#nc-send-thread')?.addEventListener('click', async () => {
                const subject = modal.querySelector('#nc-thread-subject')?.value.trim();
                const messageContent = modal.querySelector('#nc-thread-content')?.value.trim();
                const checked = [...modal.querySelectorAll('.nc-participant-cb:checked')].map(cb => parseInt(cb.value));
                if (!subject) { Toast.error('Subject is required'); return; }
                if (!checked.length) { Toast.error('Select at least one recipient'); return; }
                if (!messageContent) { Toast.error('Message is required'); return; }
                try {
                    await apiPost('/messages/threads', { subject, participant_ids: checked, content: messageContent });
                    Modal.close();
                    Toast.success('Message sent!');
                    this.updateBadges();
                    if (this._panelOpen) this._renderPanel();
                } catch (e) { Toast.error(e.message || 'Failed to send'); }
            });
        }});
    },

};
