function renderMessagesPage() {
    const user = Auth.getUser();
    const role = user?.role;
    const app = document.getElementById('app');
    app.innerHTML = `<div class="layout">${renderSidebar()}<div class="main-content">${renderNavbar('Messages')}<div class="page-content" id="page-body"><div style="text-align:center;padding:60px;"><div class="spinner"></div></div></div></div></div>`;
    document.getElementById('logout-btn')?.addEventListener('click', (e) => { e.preventDefault(); Auth.logout(); });
    initNavbarNotifications();

    const body = document.getElementById('page-body');
    body.innerHTML = `
        <div style="display:flex;gap:16px;height:calc(100vh - 120px);">
            <div style="width:340px;flex-shrink:0;background:#0f172a;border:1px solid #1e293b;border-radius:14px;display:flex;flex-direction:column;overflow:hidden;">
                <div style="padding:16px;border-bottom:1px solid #1e293b;display:flex;justify-content:space-between;align-items:center;">
                    <span style="color:#e2e8f0;font-weight:700;font-size:0.95rem;">Conversations</span>
                    <button id="msg-new-btn" style="background:linear-gradient(135deg,#6366f1,#4f46e5);border:none;border-radius:8px;padding:6px 12px;color:#fff;font-size:0.75rem;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:4px;transition:all 0.2s;" onmouseenter="this.style.boxShadow='0 0 12px rgba(99,102,241,0.3)'" onmouseleave="this.style.boxShadow='none'">
                        <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                        New
                    </button>
                </div>
                <div id="msg-thread-list" style="flex:1;overflow-y:auto;"></div>
            </div>
            <div style="flex:1;background:#0f172a;border:1px solid #1e293b;border-radius:14px;display:flex;flex-direction:column;overflow:hidden;">
                <div id="msg-chat-header" style="padding:16px 20px;border-bottom:1px solid #1e293b;display:flex;align-items:center;gap:12px;">
                    <div style="color:#475569;font-size:0.9rem;">Select a conversation</div>
                </div>
                <div id="msg-chat-body" style="flex:1;overflow-y:auto;padding:20px;display:flex;flex-direction:column;gap:8px;">
                    <div style="text-align:center;padding:60px;color:#475569;">
                        <svg width="48" height="48" fill="none" stroke="#1e293b" viewBox="0 0 24 24" style="margin:0 auto 12px;display:block;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>
                        <p>Select a conversation to start messaging</p>
                    </div>
                </div>
                <div id="msg-chat-input" style="padding:12px 16px;border-top:1px solid #1e293b;display:none;">
                    <div style="display:flex;gap:8px;">
                        <input type="text" id="msg-text-input" class="nc-input" placeholder="Type a message..." autocomplete="off" style="flex:1;" />
                        <button id="msg-send-btn" class="nc-send-btn">
                            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    loadMsgThreads(body);

    body.querySelector('#msg-new-btn')?.addEventListener('click', () => {
        NotificationCenter.showNewThreadModal();
    });
}

let _msgActiveThreadId = null;

async function loadMsgThreads(body) {
    const list = body.querySelector('#msg-thread-list');
    if (!list) return;
    try {
        const threads = await apiGet('/messages/threads');
        if (!threads.length) {
            list.innerHTML = '<div style="text-align:center;padding:40px 16px;color:#475569;font-size:0.85rem;">No conversations yet</div>';
            return;
        }
        const user = Auth.getUser();
        list.innerHTML = threads.map(t => {
            const senderLine = t.last_message_sender
                ? `<div style="color:#818cf8;font-size:0.7rem;margin-top:2px;font-weight:500;">From: ${esc(t.last_message_sender)} <span style="color:#6366f1;">• ${esc(t.last_message_sender_role || '')}</span></div>`
                : `<div style="color:#64748b;font-size:0.7rem;margin-top:2px;">${esc((t.participant_names || []).join(', '))}</div>`;
            return `
                <div class="msg-thread-row ${t.id === _msgActiveThreadId ? 'active' : ''}" data-id="${t.id}" style="display:flex;align-items:center;gap:12px;padding:14px 16px;cursor:pointer;border-bottom:1px solid rgba(30,58,95,0.15);transition:background 0.15s;${t.id === _msgActiveThreadId ? 'background:rgba(99,102,241,0.08);' : ''}" onmouseenter="this.style.background='rgba(99,102,241,0.04)'" onmouseleave="if(${t.id !== _msgActiveThreadId})this.style.background=''">
                    <div style="width:40px;height:40px;border-radius:10px;background:linear-gradient(135deg,#6366f1,#8b5cf6);display:flex;align-items:center;justify-content:center;color:#fff;font-size:0.7rem;font-weight:700;flex-shrink:0;">${(t.last_message_sender || '').split(' ').map(w => w[0]).join('').substring(0,2).toUpperCase() || '??'}</div>
                    <div style="flex:1;min-width:0;">
                        <div style="display:flex;justify-content:space-between;align-items:center;">
                            <span style="color:#e2e8f0;font-size:0.85rem;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(t.subject)}</span>
                            <span style="color:#475569;font-size:0.65rem;flex-shrink:0;">${timeAgo(t.last_message_at || t.created_at)}</span>
                        </div>
                        <div style="color:#94a3b8;font-size:0.75rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(t.last_message || 'No messages yet')}</div>
                        ${senderLine}
                    </div>
                    ${t.unread_count > 0 ? '<div style="background:#6366f1;color:#fff;font-size:0.6rem;font-weight:700;min-width:18px;height:18px;border-radius:9px;display:flex;align-items:center;justify-content:center;padding:0 5px;flex-shrink:0;">' + t.unread_count + '</div>' : ''}
                </div>
            `;
        }).join('');

        list.querySelectorAll('.msg-thread-row').forEach(row => {
            row.addEventListener('click', () => {
                const threadId = parseInt(row.dataset.id);
                _msgActiveThreadId = threadId;
                loadMsgThread(body, threadId);
                list.querySelectorAll('.msg-thread-row').forEach(r => r.style.background = '');
                row.style.background = 'rgba(99,102,241,0.08)';
            });
        });
    } catch (e) {
        list.innerHTML = '<div style="text-align:center;padding:40px;color:#f87171;">Failed to load</div>';
    }
}

async function loadMsgThread(body, threadId) {
    const header = body.querySelector('#msg-chat-header');
    const chatBody = body.querySelector('#msg-chat-body');
    const inputArea = body.querySelector('#msg-chat-input');
    if (!chatBody) return;

    chatBody.innerHTML = '<div style="text-align:center;padding:40px;"><div class="spinner"></div></div>';

    try {
        const data = await apiGet(`/messages/threads/${threadId}`);
        const user = Auth.getUser();

        header.innerHTML = `
            <div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#6366f1,#8b5cf6);display:flex;align-items:center;justify-content:center;color:#fff;font-size:0.7rem;font-weight:700;">${(data.participants||[]).map(p=>p.name).join(' ').split(' ').map(w=>w[0]).join('').substring(0,2).toUpperCase()}</div>
            <div>
                <div style="color:#e2e8f0;font-weight:600;font-size:0.9rem;">${esc(data.subject)}</div>
                <div style="color:#64748b;font-size:0.7rem;">${(data.participants||[]).map(p=>esc(p.name) + ' <span style="color:#6366f1;">• ' + esc(p.role||'') + '</span>').join(', ')}</div>
            </div>
        `;

        chatBody.innerHTML = (data.messages || []).map(m => {
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
        }).join('');

        chatBody.scrollTop = chatBody.scrollHeight;
        inputArea.style.display = 'block';

        const sendMsg = async () => {
            const input = document.getElementById('msg-text-input');
            const content = input?.value.trim();
            if (!content) return;
            input.value = '';
            await apiPost(`/messages/threads/${threadId}/messages`, { content });
            loadMsgThread(body, threadId);
            NotificationCenter.updateBadges();
        };

        const sendBtn = document.getElementById('msg-send-btn');
        const textInput = document.getElementById('msg-text-input');
        sendBtn?.removeEventListener('click', sendMsg);
        textInput?.removeEventListener('keydown', sendMsg);
        sendBtn?.addEventListener('click', sendMsg);
        textInput?.addEventListener('keydown', (e) => { if (e.key === 'Enter') sendMsg(); });
    } catch (e) {
        chatBody.innerHTML = '<div style="text-align:center;padding:40px;color:#f87171;">Failed to load conversation</div>';
    }
}

Router.register('messages', renderMessagesPage);
