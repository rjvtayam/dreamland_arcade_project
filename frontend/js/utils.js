function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'Asia/Manila' });
}

function formatDateTime(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Manila'
    });
}

function formatTime(timeStr) {
    if (!timeStr) return '';
    const date = new Date(timeStr);
    if (isNaN(date.getTime())) return timeStr;
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Manila' });
}

function formatCurrency(amount) {
    if (amount === null || amount === undefined) return '₱0.00';
    const num = parseFloat(amount);
    return '₱' + num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function getInitials(firstName, lastName) {
    const first = (firstName || '').charAt(0).toUpperCase();
    const last = (lastName || '').charAt(0).toUpperCase();
    return first + last;
}

function timeAgo(dateStr) {
    if (!dateStr) return '';
    const now = new Date();
    const date = new Date(dateStr);
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) {
        const hours = Math.floor(seconds / 3600);
        return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
    }
    if (seconds < 172800) return 'yesterday';
    if (seconds < 604800) {
        const days = Math.floor(seconds / 86400);
        return `${days} days ago`;
    }
    return formatDate(dateStr);
}

function debounce(fn, delay = 300) {
    let timer;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}

function confirmAsync(message, title) {
    if (typeof document === 'undefined') return Promise.resolve(confirm(message));
    return new Promise(function(resolve) {
        var existing = document.getElementById('custom-confirm-modal');
        if (existing) existing.remove();
        var modal = document.createElement('div');
        modal.id = 'custom-confirm-modal';
        modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:99999;';

        var html = '<div style="background:#1a1f2e;border:1px solid #2a3040;border-radius:16px;padding:28px;width:380px;max-width:90vw;text-align:center;">' +
            '<div style="font-size:1.5rem;margin-bottom:8px;">\ud83d\udca1</div>' +
            (title ? '<div style="color:#e2e8f0;font-weight:700;font-size:1rem;margin-bottom:8px;">' + title + '</div>' : '') +
            '<div style="color:#94a3b8;font-size:0.9rem;margin-bottom:24px;line-height:1.5;">' + message + '</div>' +
            '<div style="display:flex;gap:10px;justify-content:center;">' +
                '<button id="confirm-no" style="flex:1;padding:10px;border:1px solid #30363d;border-radius:8px;background:#0d1117;color:#94a3b8;font-size:0.9rem;font-weight:600;cursor:pointer;transition:all 0.15s;" onmouseenter="this.style.borderColor=\'#ef4444\';this.style.color=\'#ef4444\'" onmouseleave="this.style.borderColor=\'#30363d\';this.style.color=\'#94a3b8\'">Cancel</button>' +
                '<button id="confirm-yes" style="flex:1;padding:10px;border:none;border-radius:8px;background:linear-gradient(135deg,#22c55e,#10b981);color:#fff;font-size:0.9rem;font-weight:600;cursor:pointer;transition:all 0.15s;" onmouseenter="this.style.boxShadow=\'0 0 20px rgba(34,197,94,0.3)\'" onmouseleave="this.style.boxShadow=\'none\'">Confirm</button>' +
            '</div>' +
        '</div>';

        modal.innerHTML = html;
        document.body.appendChild(modal);

        modal.addEventListener('click', function(e) { if (e.target === modal) { modal.remove(); resolve(false); } });
        document.getElementById('confirm-no').addEventListener('click', function() { modal.remove(); resolve(false); });
        document.getElementById('confirm-yes').addEventListener('click', function() { modal.remove(); resolve(true); });
    });
}
