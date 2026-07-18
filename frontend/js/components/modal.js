const Modal = {
    show(title, content, options = {}) {
        this.close();

        const overlay = document.createElement('div');
        overlay.id = 'modal-overlay';
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:9000;display:flex;align-items:center;justify-content:center;animation:fadeIn 0.2s ease;';

        const modal = document.createElement('div');
        modal.className = 'modal-dialog';
        modal.style.cssText = `
            background:#1e293b;
            border-radius:12px;
            width:90%;
            max-width:${options.width || '480px'};
            max-height:85vh;
            overflow-y:auto;
            box-shadow:0 20px 60px rgba(0,0,0,0.5);
            animation:modalSlideIn 0.3s ease;
        `;

        const headerStyle = 'padding:20px 24px;border-bottom:1px solid #334155;display:flex;align-items:center;justify-content:space-between;';
        const bodyStyle = 'padding:24px;';

        modal.innerHTML = `
            <div style="${headerStyle}">
                <h3 style="margin:0;color:#f1f5f9;font-size:18px;font-weight:600;">${title}</h3>
                <button id="modal-close-btn" style="background:none;border:none;color:#94a3b8;font-size:24px;cursor:pointer;padding:0 4px;line-height:1;">&times;</button>
            </div>
            <div style="${bodyStyle}">${content}</div>
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) this.close();
        });

        document.getElementById('modal-close-btn').addEventListener('click', () => this.close());

        document.addEventListener('keydown', this._escHandler = (e) => {
            if (e.key === 'Escape') this.close();
        });

        if (options.onOpen) options.onOpen(modal);
        return modal;
    },

    confirm(title, message) {
        return new Promise((resolve) => {
            const content = `
                <p style="color:#cbd5e1;margin:0 0 24px 0;line-height:1.6;">${message}</p>
                <div style="display:flex;gap:12px;justify-content:flex-end;">
                    <button id="modal-cancel" style="padding:10px 20px;border-radius:8px;border:1px solid #475569;background:transparent;color:#94a3b8;cursor:pointer;font-size:14px;font-weight:500;">Cancel</button>
                    <button id="modal-confirm" style="padding:10px 20px;border-radius:8px;border:none;background:#ef4444;color:#fff;cursor:pointer;font-size:14px;font-weight:500;">Confirm</button>
                </div>
            `;

            this.show(title, content);

            document.getElementById('modal-confirm').addEventListener('click', () => {
                this.close();
                resolve(true);
            });

            document.getElementById('modal-cancel').addEventListener('click', () => {
                this.close();
                resolve(false);
            });
        });
    },

    close() {
        const overlay = document.getElementById('modal-overlay');
        if (overlay) overlay.remove();
        if (this._escHandler) {
            document.removeEventListener('keydown', this._escHandler);
            this._escHandler = null;
        }
    }
};
