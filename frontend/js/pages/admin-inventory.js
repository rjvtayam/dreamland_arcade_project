function renderAdminInventory() {
    const app = document.getElementById('app');
    const user = Auth.getUser();
    const isAdmin = user && user.role === 'admin';
    let items = [];
    let categories = [];
    let branches = [];
    let logs = [];
    let filterBranch = isAdmin ? String(user.branch_id || '') : '';
    let filterCategory = '';
    let filterSearch = '';
    let showLogs = false;
    let currentPage = 1;
    let pageSize = 10;

    async function loadData() {
        try {
            items = await apiGet('/inventory');
            if (!Array.isArray(items)) items = [];
            if (!isAdmin) {
                branches = await apiGet('/branches');
                if (!Array.isArray(branches)) branches = [];
            }
            categories = await apiGet('/inventory/categories').catch(() => []);
            if (!Array.isArray(categories)) categories = [];
            currentPage = 1;
            render();
        } catch (e) {
            Toast.error('Failed to load inventory');
        }
    }

    async function loadLogs() {
        try {
            logs = await apiGet('/inventory/logs?limit=50');
            if (!Array.isArray(logs)) logs = [];
        } catch (e) {
            console.error('Failed to load logs:', e);
        }
    }

    function getFiltered() {
        return items.filter(item => {
            if (filterBranch && String(item.branch_id) !== String(filterBranch)) return false;
            if (filterCategory && String(item.category_id) !== String(filterCategory)) return false;
            if (filterSearch) {
                const q = filterSearch.toLowerCase();
                const name = (item.name || '').toLowerCase();
                const cat = (item.category_name || '').toLowerCase();
                if (!name.includes(q) && !cat.includes(q)) return false;
            }
            return true;
        });
    }

    function renderPagination(total, page, size) {
        const totalPages = Math.max(1, Math.ceil(total / size));
        if (page > totalPages) page = totalPages;
        const start = total === 0 ? 0 : (page - 1) * size + 1;
        const end = Math.min(page * size, total);

        let pages = [];
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (page > 3) pages.push('...');
            for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
            if (page < totalPages - 2) pages.push('...');
            pages.push(totalPages);
        }

        const btnBase = 'display:inline-flex;align-items:center;justify-content:center;min-width:36px;height:36px;border:1px solid #1e293b;border-radius:8px;background:#0f172a;color:#94a3b8;font-size:0.8rem;font-weight:500;cursor:pointer;transition:all 0.15s;padding:0 8px;';
        const btnActive = 'display:inline-flex;align-items:center;justify-content:center;min-width:36px;height:36px;border:1px solid #6366f1;border-radius:8px;background:rgba(99,102,241,0.15);color:#a78bfa;font-size:0.8rem;font-weight:600;cursor:pointer;padding:0 8px;';
        const btnDisabled = 'display:inline-flex;align-items:center;justify-content:center;min-width:36px;height:36px;border:1px solid #1e293b;border-radius:8px;background:#0f172a;color:#334155;font-size:0.8rem;font-weight:500;cursor:not-allowed;padding:0 8px;';

        let html = '<div style="display:flex;align-items:center;justify-content:space-between;margin-top:20px;flex-wrap:wrap;gap:12px;">';
        html += '<div style="color:#64748b;font-size:0.8rem;">Showing <span style="color:#94a3b8;font-weight:600;">' + start + '-' + end + '</span> of <span style="color:#94a3b8;font-weight:600;">' + total + '</span> items</div>';
        html += '<div style="display:flex;align-items:center;gap:4px;">';
        html += '<button class="inv-page-btn" data-page="' + Math.max(1, page - 1) + '" style="' + (page <= 1 ? btnDisabled : btnBase) + '" ' + (page <= 1 ? 'disabled' : '') + '><svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg></button>';
        pages.forEach(function(p) {
            if (p === '...') {
                html += '<span style="display:inline-flex;align-items:center;justify-content:center;min-width:36px;height:36px;color:#475569;font-size:0.8rem;">...</span>';
            } else {
                html += '<button class="inv-page-btn" data-page="' + p + '" style="' + (p === page ? btnActive : btnBase) + '">' + p + '</button>';
            }
        });
        html += '<button class="inv-page-btn" data-page="' + Math.min(totalPages, page + 1) + '" style="' + (page >= totalPages ? btnDisabled : btnBase) + '" ' + (page >= totalPages ? 'disabled' : '') + '><svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg></button>';
        html += '<span style="color:#475569;font-size:0.75rem;margin-left:8px;">Page ' + page + ' of ' + totalPages + '</span>';
        html += '</div></div>';
        return html;
    }

    function render() {
        const filtered = getFiltered();
        const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
        if (currentPage > totalPages) currentPage = totalPages;
        const startIdx = (currentPage - 1) * pageSize;
        const pageItems = filtered.slice(startIdx, startIdx + pageSize);

        const lowStock = items.filter(i => i.reorder_level && i.quantity <= i.reorder_level && i.quantity > 0);
        const outOfStock = items.filter(i => i.quantity <= 0);
        const totalValue = items.reduce((sum, i) => sum + ((i.cost_price || 0) * (i.quantity || 0)), 0);

        const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const branchBadge = isAdmin
            ? '<span style="background:linear-gradient(135deg,#065f46,#059669);color:#fff;padding:4px 12px;border-radius:8px;font-size:0.75rem;font-weight:600;">' + esc(user.branch_name || 'My Branch') + '</span>'
            : '';

        app.innerHTML = '<div class="layout">' + renderSidebar() +
            '<div class="main-content">' + renderNavbar('Inventory Management') +
            '<div class="page-content" id="page-body">' +

            '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;flex-wrap:wrap;gap:12px;">' +
                '<div>' +
                    '<h2 style="color:#fff;margin:0 0 4px;font-size:1.3rem;">Inventory Management</h2>' +
                    '<div style="display:flex;gap:10px;align-items:center;color:#64748b;font-size:0.8rem;">' +
                        '<svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>' +
                        today + branchBadge +
                    '</div>' +
                '</div>' +
                '<div style="display:flex;gap:8px;align-items:center;">' +
                    '<button id="toggle-logs-btn" style="background:rgba(99,102,241,0.1);border:1px solid rgba(99,102,241,0.2);border-radius:8px;padding:8px 16px;color:#a78bfa;font-size:0.8rem;font-weight:500;cursor:pointer;display:flex;align-items:center;gap:6px;transition:all 0.2s;" onmouseenter="this.style.borderColor=\'rgba(99,102,241,0.4)\'" onmouseleave="this.style.borderColor=\'rgba(99,102,241,0.2)\'">' +
                        '<svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>' +
                        (showLogs ? 'Hide Logs' : 'View Logs') +
                    '</button>' +
                    '<button id="add-item-btn" style="background:linear-gradient(135deg,#4f46e5,#6366f1);color:#fff;border:none;border-radius:8px;padding:8px 18px;cursor:pointer;font-weight:600;font-size:0.85rem;display:flex;align-items:center;gap:6px;transition:all 0.2s;box-shadow:0 2px 8px rgba(99,102,241,0.3);" onmouseenter="this.style.transform=\'translateY(-1px)\'" onmouseleave="this.style.transform=\'\'">' +
                        '<svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>' +
                        'Add Item' +
                    '</button>' +
                '</div>' +
            '</div>' +

            (showLogs ?
                '<div style="background:#0f172a;border:1px solid #1e293b;border-radius:14px;padding:20px;margin-bottom:24px;">' +
                    '<div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">' +
                        '<div style="width:36px;height:36px;border-radius:10px;background:rgba(99,102,241,0.12);display:flex;align-items:center;justify-content:center;">' +
                            '<svg width="16" height="16" fill="none" stroke="#6366f1" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>' +
                        '</div>' +
                        '<div style="color:#e2e8f0;font-weight:600;font-size:0.95rem;">Recent Stock Movements</div>' +
                    '</div>' +
                    (logs.length === 0
                        ? '<div style="text-align:center;padding:30px;color:#475569;">No logs found</div>'
                        : '<div style="overflow-x:auto;">' +
                            '<table style="width:100%;border-collapse:collapse;font-size:0.8rem;">' +
                            '<thead><tr style="border-bottom:1px solid #1e293b;">' +
                                '<th style="text-align:left;padding:10px 12px;color:#64748b;font-weight:600;text-transform:uppercase;font-size:0.65rem;letter-spacing:1px;">Date</th>' +
                                '<th style="text-align:left;padding:10px 12px;color:#64748b;font-weight:600;text-transform:uppercase;font-size:0.65rem;letter-spacing:1px;">Item</th>' +
                                '<th style="text-align:left;padding:10px 12px;color:#64748b;font-weight:600;text-transform:uppercase;font-size:0.65rem;letter-spacing:1px;">Type</th>' +
                                '<th style="text-align:left;padding:10px 12px;color:#64748b;font-weight:600;text-transform:uppercase;font-size:0.65rem;letter-spacing:1px;">Qty</th>' +
                                '<th style="text-align:left;padding:10px 12px;color:#64748b;font-weight:600;text-transform:uppercase;font-size:0.65rem;letter-spacing:1px;">Notes</th>' +
                                '<th style="text-align:left;padding:10px 12px;color:#64748b;font-weight:600;text-transform:uppercase;font-size:0.65rem;letter-spacing:1px;">By</th>' +
                            '</tr></thead><tbody>' +
                            logs.map(l => {
                                const isIn = l.type === 'in' || l.movement_type === 'in';
                                return '<tr style="border-bottom:1px solid #1e293b;">' +
                                    '<td style="padding:10px 12px;color:#94a3b8;">' + esc(l.created_at || l.date || '—') + '</td>' +
                                    '<td style="padding:10px 12px;color:#e2e8f0;font-weight:500;">' + esc(l.item_name || l.inventory_item_name || '—') + '</td>' +
                                    '<td style="padding:10px 12px;"><span style="padding:3px 8px;border-radius:6px;font-size:0.7rem;font-weight:600;background:' + (isIn ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)') + ';color:' + (isIn ? '#4ade80' : '#f87171') + ';">' + esc(l.type || l.movement_type || '—') + '</span></td>' +
                                    '<td style="padding:10px 12px;color:#e2e8f0;font-weight:600;">' + esc(String(l.quantity || '—')) + '</td>' +
                                    '<td style="padding:10px 12px;color:#94a3b8;">' + esc(l.notes || '—') + '</td>' +
                                    '<td style="padding:10px 12px;color:#94a3b8;">' + esc(l.user_name || '—') + '</td>' +
                                '</tr>';
                            }).join('') +
                            '</tbody></table></div>') +
                '</div>' : '') +

            '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin-bottom:24px;">' +
                '<div style="background:linear-gradient(135deg,#0f172a,#1e293b);border:1px solid #1e293b;border-radius:14px;padding:18px;position:relative;overflow:hidden;">' +
                    '<div style="position:absolute;top:-15px;right:-15px;width:60px;height:60px;border-radius:50%;background:rgba(99,102,241,0.08);"></div>' +
                    '<div style="color:#64748b;font-size:0.65rem;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Total Items</div>' +
                    '<div style="color:#a78bfa;font-size:1.5rem;font-weight:700;">' + items.length + '</div>' +
                '</div>' +
                '<div style="background:linear-gradient(135deg,#0f172a,#1e293b);border:1px solid #1e293b;border-radius:14px;padding:18px;position:relative;overflow:hidden;">' +
                    '<div style="position:absolute;top:-15px;right:-15px;width:60px;height:60px;border-radius:50%;background:rgba(34,197,94,0.08);"></div>' +
                    '<div style="color:#64748b;font-size:0.65rem;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">In Stock</div>' +
                    '<div style="color:#4ade80;font-size:1.5rem;font-weight:700;">' + (items.length - lowStock.length - outOfStock.length) + '</div>' +
                '</div>' +
                '<div style="background:linear-gradient(135deg,#0f172a,#1e293b);border:1px solid #1e293b;border-radius:14px;padding:18px;position:relative;overflow:hidden;">' +
                    '<div style="position:absolute;top:-15px;right:-15px;width:60px;height:60px;border-radius:50%;background:rgba(245,158,11,0.08);"></div>' +
                    '<div style="color:#64748b;font-size:0.65rem;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Low Stock</div>' +
                    '<div style="color:#fbbf24;font-size:1.5rem;font-weight:700;">' + lowStock.length + '</div>' +
                '</div>' +
                '<div style="background:linear-gradient(135deg,#0f172a,#1e293b);border:1px solid #1e293b;border-radius:14px;padding:18px;position:relative;overflow:hidden;">' +
                    '<div style="position:absolute;top:-15px;right:-15px;width:60px;height:60px;border-radius:50%;background:rgba(239,68,68,0.08);"></div>' +
                    '<div style="color:#64748b;font-size:0.65rem;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Out of Stock</div>' +
                    '<div style="color:#f87171;font-size:1.5rem;font-weight:700;">' + outOfStock.length + '</div>' +
                '</div>' +
            '</div>' +

            '<div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap;align-items:center;">' +
                '<div style="position:relative;">' +
                    '<svg width="14" height="14" fill="none" stroke="#475569" viewBox="0 0 24 24" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);pointer-events:none;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>' +
                    '<input id="inv-search" type="text" placeholder="Search items..." value="' + esc(filterSearch) + '" style="background:#0f172a;border:1px solid #1e293b;border-radius:8px;padding:8px 12px 8px 32px;color:#e2e8f0;font-size:0.8rem;width:200px;outline:none;transition:border 0.2s;" onfocus="this.style.borderColor=\'#6366f1\'" onblur="this.style.borderColor=\'#1e293b\'">' +
                '</div>' +
                (isAdmin ? '' :
                '<select id="branch-filter" style="background:#0f172a;border:1px solid #1e293b;border-radius:8px;padding:8px 12px;color:#e2e8f0;font-size:0.8rem;">' +
                    '<option value="">All Branches</option>' +
                    branches.map(b => '<option value="' + b.id + '"' + (String(b.id) === String(filterBranch) ? ' selected' : '') + '>' + esc(b.name || '') + '</option>').join('') +
                '</select>') +
                '<select id="category-filter" style="background:#0f172a;border:1px solid #1e293b;border-radius:8px;padding:8px 12px;color:#e2e8f0;font-size:0.8rem;">' +
                    '<option value="">All Categories</option>' +
                    categories.map(c => '<option value="' + c.id + '"' + (String(c.id) === String(filterCategory) ? ' selected' : '') + '>' + esc(c.name || '') + '</option>').join('') +
                '</select>' +
                '<div style="flex:1;"></div>' +
                '<div style="display:flex;align-items:center;gap:6px;">' +
                    '<span style="color:#64748b;font-size:0.8rem;">Show</span>' +
                    '<select id="page-size" style="background:#0f172a;border:1px solid #1e293b;border-radius:6px;padding:5px 8px;color:#e2e8f0;font-size:0.8rem;">' +
                        '<option value="5"' + (pageSize === 5 ? ' selected' : '') + '>5</option>' +
                        '<option value="10"' + (pageSize === 10 ? ' selected' : '') + '>10</option>' +
                        '<option value="25"' + (pageSize === 25 ? ' selected' : '') + '>25</option>' +
                        '<option value="50"' + (pageSize === 50 ? ' selected' : '') + '>50</option>' +
                    '</select>' +
                    '<span style="color:#64748b;font-size:0.8rem;">per page</span>' +
                '</div>' +
            '</div>' +

            '<div style="background:#0f172a;border:1px solid #1e293b;border-radius:14px;overflow:hidden;">' +
                '<table style="width:100%;border-collapse:collapse;font-size:0.8rem;">' +
                '<thead><tr style="border-bottom:1px solid #1e293b;">' +
                    '<th style="text-align:left;padding:14px 16px;color:#64748b;font-weight:600;text-transform:uppercase;font-size:0.65rem;letter-spacing:1px;">Name</th>' +
                    '<th style="text-align:left;padding:14px 16px;color:#64748b;font-weight:600;text-transform:uppercase;font-size:0.65rem;letter-spacing:1px;">Category</th>' +
                    '<th style="text-align:left;padding:14px 16px;color:#64748b;font-weight:600;text-transform:uppercase;font-size:0.65rem;letter-spacing:1px;">Branch</th>' +
                    '<th style="text-align:center;padding:14px 16px;color:#64748b;font-weight:600;text-transform:uppercase;font-size:0.65rem;letter-spacing:1px;">Qty</th>' +
                    '<th style="text-align:center;padding:14px 16px;color:#64748b;font-weight:600;text-transform:uppercase;font-size:0.65rem;letter-spacing:1px;">Reorder</th>' +
                    '<th style="text-align:right;padding:14px 16px;color:#64748b;font-weight:600;text-transform:uppercase;font-size:0.65rem;letter-spacing:1px;">Cost</th>' +
                    '<th style="text-align:center;padding:14px 16px;color:#64748b;font-weight:600;text-transform:uppercase;font-size:0.65rem;letter-spacing:1px;">Status</th>' +
                    '<th style="text-align:right;padding:14px 16px;color:#64748b;font-weight:600;text-transform:uppercase;font-size:0.65rem;letter-spacing:1px;">Actions</th>' +
                '</tr></thead>' +
                '<tbody>' +
                (pageItems.length === 0
                    ? '<tr><td colspan="8" style="text-align:center;padding:50px;color:#475569;">No items found</td></tr>'
                    : pageItems.map(item => {
                        const isLow = item.reorder_level && item.quantity <= item.reorder_level && item.quantity > 0;
                        const isOut = item.quantity <= 0;
                        const statusColor = isOut ? '#ef4444' : isLow ? '#f59e0b' : '#22c55e';
                        const statusBg = isOut ? 'rgba(239,68,68,0.1)' : isLow ? 'rgba(245,158,11,0.1)' : 'rgba(34,197,94,0.1)';
                        const statusText = isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock';

                        return '<tr style="border-bottom:1px solid #1e293b;transition:background 0.15s;" onmouseenter="this.style.background=\'rgba(99,102,241,0.03)\'" onmouseleave="this.style.background=\'transparent\'">' +
                            '<td style="padding:12px 16px;color:#e2e8f0;font-weight:500;">' + esc(item.name || '—') + '</td>' +
                            '<td style="padding:12px 16px;color:#94a3b8;">' + esc(item.category_name || '—') + '</td>' +
                            '<td style="padding:12px 16px;color:#94a3b8;">' + esc(item.branch_name || '—') + '</td>' +
                            '<td style="padding:12px 16px;text-align:center;"><span style="color:' + (isOut ? '#f87171' : isLow ? '#fbbf24' : '#e2e8f0') + ';font-weight:600;">' + (item.quantity ?? '—') + '</span></td>' +
                            '<td style="padding:12px 16px;text-align:center;color:#64748b;">' + (item.reorder_level ?? '—') + '</td>' +
                            '<td style="padding:12px 16px;text-align:right;color:#94a3b8;">' + (item.cost_price != null ? formatCurrency(item.cost_price) : '—') + '</td>' +
                            '<td style="padding:12px 16px;text-align:center;"><span style="padding:4px 10px;border-radius:6px;font-size:0.7rem;font-weight:600;background:' + statusBg + ';color:' + statusColor + ';">' + statusText + '</span></td>' +
                            '<td style="padding:12px 16px;text-align:right;">' +
                                '<div style="display:flex;gap:4px;justify-content:flex-end;">' +
                                    '<button class="inv-stock-in" data-id="' + item.id + '" style="padding:5px 10px;border:1px solid rgba(34,197,94,0.3);border-radius:6px;background:rgba(34,197,94,0.08);color:#4ade80;font-size:0.7rem;font-weight:600;cursor:pointer;transition:all 0.15s;" onmouseenter="this.style.borderColor=\'rgba(34,197,94,0.6)\'" onmouseleave="this.style.borderColor=\'rgba(34,197,94,0.3)\'">In</button>' +
                                    '<button class="inv-stock-out" data-id="' + item.id + '" style="padding:5px 10px;border:1px solid rgba(245,158,11,0.3);border-radius:6px;background:rgba(245,158,11,0.08);color:#fbbf24;font-size:0.7rem;font-weight:600;cursor:pointer;transition:all 0.15s;" onmouseenter="this.style.borderColor=\'rgba(245,158,11,0.6)\'" onmouseleave="this.style.borderColor=\'rgba(245,158,11,0.3)\'">Out</button>' +
                                    '<button class="inv-edit" data-id="' + item.id + '" style="padding:5px 10px;border:1px solid #30363d;border-radius:6px;background:transparent;color:#94a3b8;font-size:0.7rem;font-weight:600;cursor:pointer;transition:all 0.15s;" onmouseenter="this.style.borderColor=\'#6366f1\';this.style.color=\'#a78bfa\'" onmouseleave="this.style.borderColor=\'#30363d\';this.style.color=\'#94a3b8\'">Edit</button>' +
                                    '<button class="inv-delete" data-id="' + item.id + '" style="padding:5px 10px;border:1px solid rgba(239,68,68,0.3);border-radius:6px;background:rgba(239,68,68,0.08);color:#f87171;font-size:0.7rem;font-weight:600;cursor:pointer;transition:all 0.15s;" onmouseenter="this.style.borderColor=\'rgba(239,68,68,0.6)\'" onmouseleave="this.style.borderColor=\'rgba(239,68,68,0.3)\'">Del</button>' +
                                '</div>' +
                            '</td>' +
                        '</tr>';
                    }).join('')) +
                '</tbody></table>' +
            '</div>' +

            renderPagination(filtered.length, currentPage, pageSize) +

            '</div></div></div>';

        attachEvents();
    }

    function attachEvents() {
        document.getElementById('logout-btn')?.addEventListener('click', e => { e.preventDefault(); Auth.logout(); });
        document.getElementById('branch-filter')?.addEventListener('change', e => { filterBranch = e.target.value; currentPage = 1; render(); });
        document.getElementById('category-filter')?.addEventListener('change', e => { filterCategory = e.target.value; currentPage = 1; render(); });
        document.getElementById('inv-search')?.addEventListener('input', e => { filterSearch = e.target.value; currentPage = 1; render(); });
        document.getElementById('page-size')?.addEventListener('change', e => { pageSize = parseInt(e.target.value) || 10; currentPage = 1; render(); });

        document.querySelectorAll('.inv-page-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                if (this.disabled) return;
                const p = parseInt(this.dataset.page);
                if (p && p >= 1) { currentPage = p; render(); }
            });
        });

        document.getElementById('add-item-btn')?.addEventListener('click', () => openItemModal());
        document.getElementById('toggle-logs-btn')?.addEventListener('click', async () => {
            showLogs = !showLogs;
            if (showLogs) await loadLogs();
            render();
        });

        document.querySelectorAll('.inv-edit').forEach(btn => {
            btn.addEventListener('click', () => {
                const item = items.find(i => String(i.id) === String(btn.dataset.id));
                if (item) openItemModal(item);
            });
        });
        document.querySelectorAll('.inv-delete').forEach(btn => {
            btn.addEventListener('click', () => deleteItem(btn.dataset.id));
        });
        document.querySelectorAll('.inv-stock-in').forEach(btn => {
            btn.addEventListener('click', () => openStockModal(btn.dataset.id, 'in'));
        });
        document.querySelectorAll('.inv-stock-out').forEach(btn => {
            btn.addEventListener('click', () => openStockModal(btn.dataset.id, 'out'));
        });
    }

    function openItemModal(item) {
        const isEdit = !!item;
        const title = isEdit ? 'Edit Item' : 'Add New Item';

        const inputStyle = 'width:100%;background:#0f172a;border:1px solid #1e293b;border-radius:8px;padding:10px 12px;color:#e2e8f0;font-size:0.85rem;outline:none;transition:border 0.2s;box-sizing:border-box;';
        const labelStyle = 'color:#94a3b8;font-size:0.75rem;display:flex;align-items:center;gap:6px;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.5px;';

        const catOptions = categories.map(c => '<option value="' + c.id + '"' + (isEdit && String(item.category_id) === String(c.id) ? ' selected' : '') + '>' + esc(c.name || '') + '</option>').join('');
        const branchOptions = branches.map(b => '<option value="' + b.id + '"' + (isEdit && String(item.branch_id) === String(b.id) ? ' selected' : '') + '>' + esc(b.name || '') + '</option>').join('');

        const html =
            '<div style="background:#0f172a;border:1px solid #1e293b;border-radius:12px;padding:20px;margin-bottom:16px;">' +
                '<div style="display:flex;align-items:center;gap:12px;">' +
                    '<div style="width:40px;height:40px;border-radius:10px;background:' + (isEdit ? 'rgba(245,158,11,0.15)' : 'rgba(99,102,241,0.15)') + ';display:flex;align-items:center;justify-content:center;">' +
                        (isEdit
                            ? '<svg width="18" height="18" fill="none" stroke="#f59e0b" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>'
                            : '<svg width="18" height="18" fill="none" stroke="#6366f1" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>') +
                    '</div>' +
                    '<div>' +
                        '<div style="color:#e2e8f0;font-weight:600;font-size:1rem;">' + title + '</div>' +
                        '<div style="color:#64748b;font-size:0.8rem;">' + (isEdit ? 'Update item details' : 'Add a new item to inventory') + '</div>' +
                    '</div>' +
                '</div>' +
            '</div>' +
            '<form id="item-form" style="display:flex;flex-direction:column;gap:14px;">' +
                '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">' +
                    '<div><label style="' + labelStyle + '">Category</label><select name="category_id" style="' + inputStyle + '" required><option value="">Select</option>' + catOptions + '</select></div>' +
                    '<div><label style="' + labelStyle + '">Branch</label><select name="branch_id" style="' + inputStyle + '" required><option value="">Select</option>' + branchOptions + '</select></div>' +
                '</div>' +
                '<div><label style="' + labelStyle + '">Name</label><input name="name" style="' + inputStyle + '" required value="' + (isEdit ? esc(item.name || '') : '') + '"></div>' +
                '<div><label style="' + labelStyle + '">Description</label><input name="description" style="' + inputStyle + '" value="' + (isEdit ? esc(item.description || '') : '') + '"></div>' +
                '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;">' +
                    '<div><label style="' + labelStyle + '">Quantity</label><input type="number" name="quantity" style="' + inputStyle + '" value="' + (isEdit ? (item.quantity ?? 0) : '0') + '" min="0" required></div>' +
                    '<div><label style="' + labelStyle + '">Unit</label><input name="unit" style="' + inputStyle + '" value="' + (isEdit ? esc(item.unit || '') : '') + '" placeholder="pcs"></div>' +
                    '<div><label style="' + labelStyle + '">Reorder Level</label><input type="number" name="reorder_level" style="' + inputStyle + '" value="' + (isEdit ? (item.reorder_level ?? '') : '') + '" min="0"></div>' +
                '</div>' +
                '<div><label style="' + labelStyle + '">Cost Price</label><input type="number" name="cost_price" style="' + inputStyle + '" value="' + (isEdit ? (item.cost_price ?? '') : '') + '" min="0" step="0.01"></div>' +
                '<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:4px;">' +
                    '<button type="button" onclick="Modal.close()" style="padding:10px 20px;border:1px solid #30363d;border-radius:8px;background:transparent;color:#94a3b8;cursor:pointer;font-size:0.85rem;">Cancel</button>' +
                    '<button type="submit" style="padding:10px 24px;border:none;border-radius:8px;background:linear-gradient(135deg,#4f46e5,#6366f1);color:#fff;font-weight:600;cursor:pointer;font-size:0.85rem;">' + (isEdit ? 'Update' : 'Add') + ' Item</button>' +
                '</div>' +
            '</form>';

        Modal.show(title, html, { width: '540px' });

        document.getElementById('item-form')?.addEventListener('submit', async e => {
            e.preventDefault();
            const form = e.target;
            const data = {
                category_id: form.category_id.value,
                branch_id: form.branch_id.value,
                name: form.name.value,
                description: form.description.value,
                quantity: parseFloat(form.quantity.value) || 0,
                unit: form.unit.value,
                reorder_level: parseFloat(form.reorder_level.value) || null,
                cost_price: parseFloat(form.cost_price.value) || null
            };
            try {
                if (isEdit) {
                    await apiPut('/inventory/' + item.id, data);
                    Toast.success('Item updated');
                } else {
                    await apiPost('/inventory', data);
                    Toast.success('Item added');
                }
                Modal.close();
                loadData();
            } catch (err) {
                Toast.error(err.message || 'Failed to save item');
            }
        });
    }

    function openStockModal(itemId, type) {
        const item = items.find(i => String(i.id) === String(itemId));
        if (!item) return;

        const inputStyle = 'width:100%;background:#0f172a;border:1px solid #1e293b;border-radius:8px;padding:10px 12px;color:#e2e8f0;font-size:0.85rem;outline:none;transition:border 0.2s;box-sizing:border-box;';
        const labelStyle = 'color:#94a3b8;font-size:0.75rem;display:flex;align-items:center;gap:6px;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.5px;';
        const is_in = type === 'in';
        const color = is_in ? '#22c55e' : '#f59e0b';

        const html =
            '<div style="background:#0f172a;border:1px solid #1e293b;border-radius:12px;padding:20px;margin-bottom:16px;">' +
                '<div style="display:flex;align-items:center;gap:12px;">' +
                    '<div style="width:40px;height:40px;border-radius:10px;background:' + (is_in ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)') + ';display:flex;align-items:center;justify-content:center;">' +
                        (is_in
                            ? '<svg width="18" height="18" fill="none" stroke="#22c55e" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>'
                            : '<svg width="18" height="18" fill="none" stroke="#f59e0b" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"/></svg>') +
                    '</div>' +
                    '<div>' +
                        '<div style="color:#e2e8f0;font-weight:600;font-size:1rem;">Stock ' + (is_in ? 'In' : 'Out') + '</div>' +
                        '<div style="color:#64748b;font-size:0.8rem;">' + esc(item.name) + '</div>' +
                    '</div>' +
                '</div>' +
            '</div>' +
            '<form id="stock-form" style="display:flex;flex-direction:column;gap:14px;">' +
                '<div style="display:flex;align-items:center;gap:8px;padding:12px;background:#0f172a;border:1px solid #1e293b;border-radius:8px;">' +
                    '<span style="color:#64748b;font-size:0.8rem;">Current:</span>' +
                    '<span style="color:#e2e8f0;font-weight:600;">' + item.quantity + '</span>' +
                    '<span style="color:#475569;font-size:0.8rem;">' + esc(item.unit || 'pcs') + '</span>' +
                '</div>' +
                '<div><label style="' + labelStyle + '">Quantity</label><input type="number" name="quantity" style="' + inputStyle + '" min="1" required placeholder="Enter quantity"></div>' +
                '<div><label style="' + labelStyle + '">Notes</label><input name="notes" style="' + inputStyle + '" placeholder="Optional notes"></div>' +
                '<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:4px;">' +
                    '<button type="button" onclick="Modal.close()" style="padding:10px 20px;border:1px solid #30363d;border-radius:8px;background:transparent;color:#94a3b8;cursor:pointer;font-size:0.85rem;">Cancel</button>' +
                    '<button type="submit" style="padding:10px 24px;border:none;border-radius:8px;background:linear-gradient(135deg,' + (is_in ? '#059669,#10b981' : '#d97706,#f59e0b') + ');color:#fff;font-weight:600;cursor:pointer;font-size:0.85rem;">Stock ' + (is_in ? 'In' : 'Out') + '</button>' +
                '</div>' +
            '</form>';

        Modal.show('Stock ' + (is_in ? 'In' : 'Out'), html, { width: '420px' });

        document.getElementById('stock-form')?.addEventListener('submit', async e => {
            e.preventDefault();
            const form = e.target;
            const data = { quantity: parseFloat(form.quantity.value), notes: form.notes.value };
            try {
                const endpoint = is_in ? '/api/inventory/' + itemId + '/stock-in' : '/api/inventory/' + itemId + '/stock-out';
                await apiPost(endpoint, data);
                Toast.success('Stock ' + type + ' recorded');
                Modal.close();
                loadData();
            } catch (err) {
                Toast.error(err.message || 'Failed to record stock movement');
            }
        });
    }

    async function deleteItem(id) {
        if (!await confirmAsync('Are you sure you want to delete this item?')) return;
        try {
            await apiDelete('/inventory/' + id);
            Toast.success('Item deleted');
            loadData();
        } catch (err) {
            Toast.error(err.message || 'Failed to delete item');
        }
    }

    function esc(str) {
        if (!str) return '';
        return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }

    loadData();
}

Router.register('inventory', renderAdminInventory);
