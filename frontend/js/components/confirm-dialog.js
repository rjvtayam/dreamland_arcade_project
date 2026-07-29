const ConfirmDialog = {
    _resolve: null,
    _open: false,

    show(options = {}) {
        return new Promise((resolve) => {
            this._resolve = resolve;
            this._open = true;

            const type = options.type || 'danger';
            const title = options.title || 'Confirm';
            const message = options.message || 'Are you sure?';
            const confirmText = options.confirmText || 'Confirm';
            const cancelText = options.cancelText || 'Cancel';

            const colors = {
                danger: { accent: '#ef4444', glow: 'rgba(239,68,68,0.3)', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.3)' },
                warning: { accent: '#f59e0b', glow: 'rgba(245,158,11,0.3)', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.3)' },
                info: { accent: '#6366f1', glow: 'rgba(99,102,241,0.3)', bg: 'rgba(99,102,241,0.08)', border: 'rgba(99,102,241,0.3)' },
                success: { accent: '#22c55e', glow: 'rgba(34,197,94,0.3)', bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.3)' },
            };
            const c = colors[type] || colors.danger;

            const icons = {
                danger: '<svg width="28" height="28" fill="none" stroke="' + c.accent + '" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>',
                warning: '<svg width="28" height="28" fill="none" stroke="' + c.accent + '" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>',
                info: '<svg width="28" height="28" fill="none" stroke="' + c.accent + '" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
                success: '<svg width="28" height="28" fill="none" stroke="' + c.accent + '" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
            };
            const icon = icons[type] || icons.danger;

            const existing = document.getElementById('confirm-dialog');
            if (existing) existing.remove();

            const overlay = document.createElement('div');
            overlay.id = 'confirm-dialog';
            overlay.className = 'cd-overlay';
            document.body.appendChild(overlay);

            overlay.innerHTML = `
                <div class="cd-card" style="--cd-accent:${c.accent};--cd-glow:${c.glow};--cd-bg:${c.bg};--cd-border:${c.border};">
                    <div class="cd-glow-ring"></div>
                    <div class="cd-icon-wrap">
                        <div class="cd-icon">${icon}</div>
                    </div>
                    <div class="cd-title">${title}</div>
                    <div class="cd-message">${message}</div>
                    <div class="cd-actions">
                        <button id="cd-cancel" class="cd-btn cd-btn-cancel">${cancelText}</button>
                        <button id="cd-confirm" class="cd-btn cd-btn-confirm">${confirmText}</button>
                    </div>
                </div>
            `;

            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) this._cancel();
            });
            document.addEventListener('keydown', this._escHandler = (e) => {
                if (e.key === 'Escape') this._cancel();
            });

            setTimeout(() => {
                document.getElementById('cd-cancel').onclick = () => this._cancel();
                document.getElementById('cd-confirm').onclick = () => this._confirm();
                document.getElementById('cd-confirm').focus();
            }, 0);
        });
    },

    _confirm() {
        this._close();
        if (this._resolve) this._resolve(true);
    },

    _cancel() {
        this._close();
        if (this._resolve) this._resolve(false);
    },

    _close() {
        this._open = false;
        if (this._escHandler) {
            document.removeEventListener('keydown', this._escHandler);
            this._escHandler = null;
        }
        const overlay = document.getElementById('confirm-dialog');
        if (overlay) {
            overlay.classList.add('cd-closing');
            setTimeout(() => overlay.remove(), 200);
        }
    },

    delete(message, title) {
        return this.show({
            type: 'danger',
            title: title || 'Delete',
            message: message || 'Are you sure you want to delete this? This cannot be undone.',
            confirmText: 'Delete',
            cancelText: 'Cancel',
        });
    },

    warn(message, title) {
        return this.show({
            type: 'warning',
            title: title || 'Warning',
            message: message,
            confirmText: 'Continue',
            cancelText: 'Cancel',
        });
    },

    info(message, title) {
        return this.show({
            type: 'info',
            title: title || 'Confirm',
            message: message,
            confirmText: 'Continue',
            cancelText: 'Cancel',
        });
    },

    success(message, title) {
        return this.show({
            type: 'success',
            title: title || 'Success',
            message: message,
            confirmText: 'OK',
            cancelText: 'Cancel',
        });
    }
};

function confirmAsync(message, title, type) {
    return ConfirmDialog.show({
        type: type || 'danger',
        title: title || 'Confirm',
        message: message,
        confirmText: type === 'success' ? 'Confirm' : 'Confirm',
        cancelText: 'Cancel',
    });
}
