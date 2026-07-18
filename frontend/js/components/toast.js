const Toast = {
    container: null,

    init() {
        if (this.container) return;
        this.container = document.createElement('div');
        this.container.id = 'toast-container';
        this.container.style.cssText = 'position:fixed;top:20px;right:20px;z-index:10000;display:flex;flex-direction:column;gap:10px;pointer-events:none;';
        document.body.appendChild(this.container);
    },

    show(message, type = 'info', duration = 3000) {
        this.init();

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.style.cssText = `
            pointer-events:auto;
            min-width:280px;
            max-width:400px;
            padding:14px 20px;
            border-radius:8px;
            color:#fff;
            font-size:14px;
            font-weight:500;
            box-shadow:0 4px 12px rgba(0,0,0,0.3);
            display:flex;
            align-items:center;
            gap:10px;
            animation:toastSlideIn 0.3s ease;
            transition:all 0.3s ease;
        `;

        const colors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };
        const icons = {
            success: '&#10004;',
            error: '&#10008;',
            warning: '&#9888;',
            info: '&#8505;'
        };

        toast.style.backgroundColor = colors[type] || colors.info;
        toast.innerHTML = `<span style="font-size:16px;">${icons[type] || icons.info}</span><span>${message}</span>`;

        this.container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100px)';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },

    success(msg) { this.show(msg, 'success'); },
    error(msg) { this.show(msg, 'error', 5000); },
    warning(msg) { this.show(msg, 'warning', 4000); },
    info(msg) { this.show(msg, 'info'); }
};
