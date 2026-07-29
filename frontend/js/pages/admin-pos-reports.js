function renderPOSReports() {
    var app = document.getElementById('app');
    var user = Auth.getUser();
    var isAdmin = user && user.role === 'admin';
    var reports = [];
    var branches = [];
    var trackingSheets = [];
    var filterBranch = isAdmin ? String(user.branch_id || '') : '';
    var dateFrom = '';
    var dateTo = '';
    var selectedReport = null;
    var activeTab = 'tracking';
    var refreshTimer = null;

    async function loadData() {
        try {
            if (!isAdmin) {
                branches = await apiGet('/branches');
                if (!Array.isArray(branches)) branches = [];
            }
            var today = new Date().toISOString().split('T')[0];
            dateFrom = today;
            dateTo = today;
            await Promise.all([loadReportsData(), loadTrackingData()]);
            render();
            if (!refreshTimer) {
                refreshTimer = setInterval(async function() {
                    if (selectedReport) return;
                    await Promise.all([loadReportsData(), loadTrackingData()]);
                    render();
                }, 15000);
            }
        } catch (e) {
            Toast.error('Failed to load data');
        }
    }

    async function loadReportsData() {
        try {
            var params = [];
            if (filterBranch) params.push('branch_id=' + filterBranch);
            if (dateFrom) params.push('start_date=' + dateFrom);
            if (dateTo) params.push('end_date=' + dateTo);
            var url = '/pos-reports' + (params.length ? '?' + params.join('&') : '');
            reports = await apiGet(url);
            if (!Array.isArray(reports)) reports = [];
        } catch (e) {
            Toast.error('Failed to load reports');
        }
    }

    async function loadTrackingData() {
        try {
            var params = [];
            if (filterBranch) params.push('branch_id=' + filterBranch);
            if (dateFrom) params.push('sheet_date=' + dateFrom);
            var url = '/tracking-sheets' + (params.length ? '?' + params.join('&') : '');
            trackingSheets = await apiGet(url);
            if (!Array.isArray(trackingSheets)) trackingSheets = [];
            for (var i = 0; i < trackingSheets.length; i++) {
                var ts = trackingSheets[i];
                try {
                    var salesUrl = '/sales?branch_id=' + ts.branch_id + '&start_date=' + ts.sheet_date + '&end_date=' + ts.sheet_date;
                    var allSales = await apiGet(salesUrl);
                    if (!Array.isArray(allSales)) allSales = [];
                    ts._salesData = allSales.filter(function(s) { return s.area === ts.area; });
                } catch (e2) {
                    ts._salesData = [];
                }
            }
        } catch (e) {
            Toast.error('Failed to load tracking');
        }
    }

    function renderDetail(r) {
        var items = r.items_summary || [];
        app.innerHTML = '<div class="layout">' + renderSidebar() +
            '<div class="main-content">' + renderNavbar('POS Report - ' + r.report_date) +
            '<div class="page-content" id="page-body" style="overflow-y:auto;">' +

            '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">' +
                '<div style="display:flex;gap:10px;align-items:center;">' +
                    '<button onclick="window.__posReportsBack()" style="background:#1a1f2e;border:1px solid #30363d;border-radius:8px;color:#e2e8f0;padding:8px 16px;cursor:pointer;font-size:0.85rem;display:flex;align-items:center;gap:6px;transition:all 0.2s;" onmouseenter="this.style.borderColor=#6366f1" onmouseleave="this.style.borderColor=#30363d">' +
                        '<svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg> Back</button>' +
                    '<span style="color:#6366f1;font-weight:700;font-size:1rem;">Report for ' + esc(r.report_date) + '</span>' +
                '</div>' +
                '<span style="color:#888;font-size:0.8rem;">Submitted by ' + esc(r.admin_name) + '</span>' +
            '</div>' +

            '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-bottom:20px;">' +
                '<div style="background:linear-gradient(135deg,#0f172a,#1e293b);border:1px solid #1e293b;border-radius:12px;padding:16px;text-align:center;">' +
                    '<div style="color:#64748b;font-size:0.65rem;text-transform:uppercase;letter-spacing:1px;">Total Sales</div>' +
                    '<div style="color:#4ade80;font-weight:700;font-size:1.2rem;margin-top:4px;">' + formatCurrency(r.total_sales) + '</div></div>' +
                '<div style="background:linear-gradient(135deg,#0f172a,#1e293b);border:1px solid #1e293b;border-radius:12px;padding:16px;text-align:center;">' +
                    '<div style="color:#64748b;font-size:0.65rem;text-transform:uppercase;letter-spacing:1px;">Transactions</div>' +
                    '<div style="color:#e2e8f0;font-weight:700;font-size:1.2rem;margin-top:4px;">' + r.total_transactions + '</div></div>' +
                '<div style="background:linear-gradient(135deg,#0f172a,#1e293b);border:1px solid #6366f130;border-radius:12px;padding:16px;text-align:center;">' +
                    '<div style="color:#64748b;font-size:0.65rem;text-transform:uppercase;letter-spacing:1px;">Arcade</div>' +
                    '<div style="color:#a78bfa;font-weight:700;font-size:1.2rem;margin-top:4px;">' + formatCurrency(r.arcade_sales) + '</div></div>' +
                '<div style="background:linear-gradient(135deg,#0f172a,#1e293b);border:1px solid #22c55e30;border-radius:12px;padding:16px;text-align:center;">' +
                    '<div style="color:#64748b;font-size:0.65rem;text-transform:uppercase;letter-spacing:1px;">Playhouse</div>' +
                    '<div style="color:#4ade80;font-weight:700;font-size:1.2rem;margin-top:4px;">' + formatCurrency(r.playhouse_sales) + '</div></div>' +
                '<div style="background:linear-gradient(135deg,#0f172a,#1e293b);border:1px solid #f59e0b30;border-radius:12px;padding:16px;text-align:center;">' +
                    '<div style="color:#64748b;font-size:0.65rem;text-transform:uppercase;letter-spacing:1px;">Cafe</div>' +
                    '<div style="color:#fbbf24;font-weight:700;font-size:1.2rem;margin-top:4px;">' + formatCurrency(r.cafe_sales) + '</div></div>' +
            '</div>' +

            '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-bottom:20px;">' +
                '<div style="background:#0f172a;border:1px solid #1e293b;border-radius:12px;padding:14px;text-align:center;">' +
                    '<div style="color:#64748b;font-size:0.65rem;text-transform:uppercase;">Cash</div>' +
                    '<div style="color:#e2e8f0;font-weight:700;font-size:1rem;margin-top:4px;">' + formatCurrency(r.cash_sales) + '</div></div>' +
                '<div style="background:#0f172a;border:1px solid #1e293b;border-radius:12px;padding:14px;text-align:center;">' +
                    '<div style="color:#64748b;font-size:0.65rem;text-transform:uppercase;">GCash</div>' +
                    '<div style="color:#3b82f6;font-weight:700;font-size:1rem;margin-top:4px;">' + formatCurrency(r.gcash_sales) + '</div></div>' +
                '<div style="background:#0f172a;border:1px solid #1e293b;border-radius:12px;padding:14px;text-align:center;">' +
                    '<div style="color:#64748b;font-size:0.65rem;text-transform:uppercase;">Card</div>' +
                    '<div style="color:#e2e8f0;font-weight:700;font-size:1rem;margin-top:4px;">' + formatCurrency(r.card_sales) + '</div></div>' +
                '<div style="background:#0f172a;border:1px solid #f59e0b30;border-radius:12px;padding:14px;text-align:center;">' +
                    '<div style="color:#64748b;font-size:0.65rem;text-transform:uppercase;">Smash Sales</div>' +
                    '<div style="color:#fbbf24;font-weight:700;font-size:1rem;margin-top:4px;">' + formatCurrency(r.smash_sales || 0) + '</div></div>' +
                '<div style="background:#0f172a;border:1px solid #ef444430;border-radius:12px;padding:14px;text-align:center;">' +
                    '<div style="color:#64748b;font-size:0.65rem;text-transform:uppercase;">Extra Tokens</div>' +
                    '<div style="color:#f87171;font-weight:700;font-size:1rem;margin-top:4px;">' + (r.extra_token_count || 0) + ' tokens</div></div>' +
            '</div>' +

            (items.length > 0 ?
                '<div style="background:#0f172a;border:1px solid #1e293b;border-radius:12px;overflow:hidden;">' +
                    '<div style="padding:14px 18px;border-bottom:1px solid #1e293b;color:#94a3b8;font-size:0.8rem;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Items Sold</div>' +
                    '<table style="width:100%;border-collapse:collapse;"><thead><tr style="border-bottom:1px solid #1e293b;">' +
                        '<th style="padding:10px 18px;text-align:left;color:#64748b;font-size:0.75rem;">PRODUCT</th>' +
                        '<th style="padding:10px 18px;text-align:center;color:#64748b;font-size:0.75rem;">QTY</th>' +
                        '<th style="padding:10px 18px;text-align:right;color:#64748b;font-size:0.75rem;">REVENUE</th>' +
                    '</tr></thead><tbody>' +
                    items.map(function(item) {
                        var typeTag = item.type === 'smash' ? ' <span style="color:#f59e0b;font-size:0.6rem;font-weight:700;background:rgba(245,158,11,0.12);padding:2px 6px;border-radius:4px;">SMASH</span>' : item.type === 'extra' ? ' <span style="color:#ef4444;font-size:0.6rem;font-weight:700;background:rgba(239,68,68,0.12);padding:2px 6px;border-radius:4px;">EXTRA</span>' : '';
                        return '<tr style="border-bottom:1px solid #0f172a;">' +
                            '<td style="padding:10px 18px;color:#e2e8f0;font-size:0.85rem;">' + esc(item.name) + typeTag + '</td>' +
                            '<td style="padding:10px 18px;text-align:center;color:#e2e8f0;">' + item.quantity + '</td>' +
                            '<td style="padding:10px 18px;text-align:right;color:#4ade80;">' + formatCurrency(item.revenue) + '</td>' +
                        '</tr>';
                    }).join('') +
                    '</tbody></table></div>' : '') +

            '</div></div></div>';
        document.getElementById('logout-btn')?.addEventListener('click', function(e) { e.preventDefault(); Auth.logout(); });
    }

    function render() {
        if (selectedReport) { renderDetail(selectedReport); return; }

        var todayCount = reports.length + trackingSheets.length;
        var reportSales = reports.reduce(function(a, r) { return a + (r.total_sales || 0); }, 0);
        var trackingSales = trackingSheets.reduce(function(a, ts) {
            var salesData = ts._salesData || [];
            return a + salesData.reduce(function(b, s) { return b + (s.total_amount || 0); }, 0);
        }, 0);
        var totalSales = reportSales + trackingSales;
        var reportTxns = reports.reduce(function(a, r) { return a + (r.total_transactions || 0); }, 0);
        var trackingTxns = trackingSheets.reduce(function(a, ts) { return a + ((ts._salesData || []).length); }, 0);
        var totalTxns = reportTxns + trackingTxns;

        app.innerHTML = '<div class="layout">' + renderSidebar() +
            '<div class="main-content">' + renderNavbar('POS Tracking') +
            '<div class="page-content" id="page-body">' +

            '<div style="margin-bottom:20px;">' +
                '<h2 style="color:#fff;margin:0 0 4px;font-size:1.3rem;">POS Tracking</h2>' +
                '<p style="color:#888;margin:0;font-size:0.85rem;">Arcade tracking receipts and reports</p>' +
            '</div>' +

            '<div style="display:flex;gap:12px;margin-bottom:20px;flex-wrap:wrap;">' +
                '<div style="flex:1;min-width:160px;background:linear-gradient(135deg,#0f172a,#1e293b);border:1px solid #1e293b;border-radius:14px;padding:16px;text-align:center;transition:all 0.3s;" onmouseenter="this.style.borderColor=#6366f1" onmouseleave="this.style.borderColor=#1e293b">' +
                    '<div style="color:#64748b;font-size:0.65rem;text-transform:uppercase;letter-spacing:1px;">Today\'s Reports</div>' +
                    '<div style="color:#a78bfa;font-size:1.8rem;font-weight:700;margin-top:4px;">' + todayCount + '</div>' +
                '</div>' +
                '<div style="flex:1;min-width:160px;background:linear-gradient(135deg,#0f172a,#1e293b);border:1px solid #1e293b;border-radius:14px;padding:16px;text-align:center;transition:all 0.3s;" onmouseenter="this.style.borderColor=#22c55e" onmouseleave="this.style.borderColor=#1e293b">' +
                    '<div style="color:#64748b;font-size:0.65rem;text-transform:uppercase;letter-spacing:1px;">Total Sales</div>' +
                    '<div style="color:#4ade80;font-size:1.8rem;font-weight:700;margin-top:4px;">' + formatCurrency(totalSales) + '</div>' +
                '</div>' +
                '<div style="flex:1;min-width:160px;background:linear-gradient(135deg,#0f172a,#1e293b);border:1px solid #1e293b;border-radius:14px;padding:16px;text-align:center;transition:all 0.3s;" onmouseenter="this.style.borderColor=#f59e0b" onmouseleave="this.style.borderColor=#1e293b">' +
                    '<div style="color:#64748b;font-size:0.65rem;text-transform:uppercase;letter-spacing:1px;">Transactions</div>' +
                    '<div style="color:#fbbf24;font-size:1.8rem;font-weight:700;margin-top:4px;">' + totalTxns + '</div>' +
                '</div>' +
            '</div>' +

            '<div style="display:flex;gap:8px;margin-bottom:16px;border-bottom:2px solid #1e293b;padding-bottom:0;">' +
                '<button class="posr-tab active" data-tab="tracking" style="padding:10px 20px;background:none;border:none;border-bottom:2px solid #6366f1;color:#6366f1;font-weight:600;font-size:0.85rem;cursor:pointer;margin-bottom:-2px;transition:all 0.2s;">Tracking Receipts</button>' +
                '<button class="posr-tab" data-tab="reports" style="padding:10px 20px;background:none;border:none;border-bottom:2px solid transparent;color:#64748b;font-weight:600;font-size:0.85rem;cursor:pointer;margin-bottom:-2px;transition:all 0.2s;">Submitted Reports</button>' +
            '</div>' +

            '<div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap;align-items:flex-end;">' +
                (isAdmin ? '' :
                '<div><label style="color:#64748b;font-size:0.7rem;display:block;margin-bottom:4px;">Branch</label>' +
                '<select id="posr-branch" style="background:#0d1117;border:1px solid #30363d;border-radius:8px;padding:8px 12px;color:#e2e8f0;font-size:0.85rem;">' +
                '<option value="">All Branches</option>' +
                branches.map(function(b) { return '<option value="' + b.id + '"' + (String(b.id) === String(filterBranch) ? ' selected' : '') + '>' + esc(b.name) + '</option>'; }).join('') +
                '</select></div>') +
                '<div><label style="color:#64748b;font-size:0.7rem;display:block;margin-bottom:4px;">Date</label>' +
                '<input type="date" id="posr-date" style="background:#0d1117;border:1px solid #30363d;border-radius:8px;padding:8px 12px;color:#e2e8f0;font-size:0.85rem;" value="' + dateFrom + '"></div>' +
                '<button id="posr-filter" style="padding:9px 20px;border:none;border-radius:8px;background:linear-gradient(135deg,#4f46e5,#6366f1);color:#fff;font-weight:600;font-size:0.85rem;cursor:pointer;transition:all 0.2s;" onmouseenter="this.style.transform=translateY(-1px)" onmouseleave="this.style.transform=\'\'">Apply</button>' +
            '</div>' +

            '<div id="posr-tab-content"></div>' +

            '</div></div></div>';

        renderTabContent();
        attachEvents();
    }

    function renderTabContent() {
        var container = document.getElementById('posr-tab-content');
        if (!container) return;

        if (activeTab === 'tracking') {
            if (trackingSheets.length === 0) {
                container.innerHTML = '<div style="text-align:center;padding:60px 20px;color:#475569;">' +
                    '<svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="margin:0 auto 12px;display:block;opacity:0.3;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>' +
                    '<div>No tracking receipts for this date</div></div>';
                return;
            }
            container.innerHTML = '<div style="display:grid;gap:12px;">' +
                trackingSheets.map(function(s) {
                    var statusColor = s.status === 'submitted' ? '#22c55e' : s.status === 'draft' ? '#f59e0b' : '#64748b';
                    var statusBg = s.status === 'submitted' ? 'rgba(34,197,94,0.12)' : s.status === 'draft' ? 'rgba(245,158,11,0.12)' : 'rgba(100,116,139,0.12)';
                    var areaColor = s.area === 'Arcade' ? '#6366f1' : s.area === 'Playhouse' ? '#22c55e' : '#f59e0b';
                    var areaIcon = s.area === 'Arcade' ? '\ud83c\udfae' : s.area === 'Playhouse' ? '\ud83c\udfe0' : '\u2615';

                    var salesData = s._salesData || [];
                    var totalSales = salesData.reduce(function(a, s) { return a + (s.total_amount || 0); }, 0);

                    var txCards = salesData.map(function(sale, idx) {
                        var txId = String(sale.id).padStart(6, '0');
                        var dt = sale.created_at ? new Date(sale.created_at) : new Date();
                        var timeStr = dt.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', hour12: true });
                        var payColor = sale.payment_method === 'GCash' ? '#3b82f6' : sale.payment_method === 'Card' ? '#f59e0b' : '#4ade80';
                        var payBg = sale.payment_method === 'GCash' ? 'rgba(59,130,246,0.12)' : sale.payment_method === 'Card' ? 'rgba(245,158,11,0.12)' : 'rgba(74,222,128,0.12)';

                        var itemTags = (sale.items || []).map(function(item) {
                            var label = item.item_type === 'smash' ? 'Smash' : item.item_type === 'extra' ? 'Extra' : (item.product_name || 'Token');
                            var count = item.token_count || item.quantity || 0;
                            var tagColor = item.item_type === 'smash' ? '#f59e0b' : item.item_type === 'extra' ? '#ef4444' : '#a78bfa';
                            var tagBg = item.item_type === 'smash' ? 'rgba(245,158,11,0.12)' : item.item_type === 'extra' ? 'rgba(239,68,68,0.12)' : 'rgba(167,139,250,0.12)';
                            return '<span style="background:' + tagBg + ';color:' + tagColor + ';padding:2px 8px;border-radius:4px;font-size:0.65rem;font-weight:600;">' + esc(label) + ' x' + count + ' &middot; ' + formatCurrency(item.subtotal) + '</span>';
                        }).join(' ');

                        return '<div style="background:#0d1117;border:1px solid #1e293b;border-radius:8px;padding:12px 14px;display:flex;align-items:center;gap:12px;">' +
                            '<div style="flex:1;min-width:0;">' +
                                '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">' +
                                    '<span style="color:#64748b;font-size:0.7rem;font-family:\'Courier New\',monospace;">TXN#' + txId + '</span>' +
                                    '<span style="color:#94a3b8;font-size:0.7rem;">' + timeStr + '</span>' +
                                    '<span style="background:' + payBg + ';color:' + payColor + ';padding:1px 6px;border-radius:3px;font-size:0.6rem;font-weight:600;">' + esc(sale.payment_method || 'Cash') + '</span>' +
                                '</div>' +
                                '<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:6px;">' + itemTags + '</div>' +
                                '<div style="color:#94a3b8;font-size:0.7rem;">by ' + esc(sale.seller_name || '—') + '</div>' +
                            '</div>' +
                            '<div style="display:flex;align-items:center;gap:10px;flex-shrink:0;">' +
                                '<span style="color:#4ade80;font-weight:700;font-size:0.9rem;">' + formatCurrency(sale.total_amount) + '</span>' +
                                '<button onclick="window.__posrViewSingleReceipt(' + sale.id + ')" title="View Receipt" style="background:none;border:1px solid #30363d;border-radius:6px;padding:5px 8px;color:#94a3b8;cursor:pointer;transition:all 0.2s;" onmouseenter="this.style.borderColor=#22c55e;this.style.color=#4ade80" onmouseleave="this.style.borderColor=#30363d;this.style.color=#94a3b8">' +
                                    '<svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>' +
                                '</button>' +
                            '</div>' +
                        '</div>';
                    }).join('');

                    return '<div style="background:#0f172a;border:1px solid #1e293b;border-left:3px solid ' + areaColor + ';border-radius:12px;padding:16px 20px;transition:all 0.2s;">' +
                        '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;">' +
                            '<div style="display:flex;align-items:center;gap:10px;">' +
                                '<div style="width:40px;height:40px;border-radius:10px;background:' + areaColor + '20;border:1px solid ' + areaColor + ';display:flex;align-items:center;justify-content:center;font-size:1.2rem;">' + areaIcon + '</div>' +
                                '<div>' +
                                    '<div style="display:flex;align-items:center;gap:8px;">' +
                                        '<span style="color:' + areaColor + ';font-weight:700;font-size:1rem;">' + esc(s.area) + ' Tracking Receipt</span>' +
                                        '<span style="background:' + statusBg + ';color:' + statusColor + ';padding:2px 8px;border-radius:4px;font-size:0.7rem;font-weight:600;">' + s.status.toUpperCase() + '</span>' +
                                    '</div>' +
                                    '<div style="color:#64748b;font-size:0.8rem;margin-top:2px;">' + esc(s.branch_name || 'Branch') + ' &middot; ' + esc(s.sheet_date) + '</div>' +
                                '</div>' +
                            '</div>' +
                            '<div style="display:flex;align-items:center;gap:10px;">' +
                                '<div style="text-align:right;">' +
                                    '<div style="color:#4ade80;font-weight:700;font-size:1.1rem;">' + formatCurrency(totalSales) + '</div>' +
                                    '<div style="color:#64748b;font-size:0.7rem;">' + salesData.length + ' txn' + (salesData.length !== 1 ? 's' : '') + '</div>' +
                                '</div>' +
                                '<button onclick="window.__posrSoftDelete(' + s.id + ')" title="Delete" style="background:none;border:1px solid #30363d;border-radius:6px;padding:6px 8px;color:#94a3b8;cursor:pointer;transition:all 0.2s;flex-shrink:0;" onmouseenter="this.style.borderColor=#ef4444;this.style.color=#f87171" onmouseleave="this.style.borderColor=#30363d;this.style.color=#94a3b8">' +
                                    '<svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>' +
                                '</button>' +
                            '</div>' +
                        '</div>' +
                        (txCards.length > 0 ?
                        '<div style="display:grid;gap:8px;">' + txCards + '</div>' :
                        '<div style="text-align:center;padding:20px;color:#475569;font-size:0.85rem;">No transactions for this area</div>') +
                    '</div>';
                }).join('') + '</div>';
        } else {
            if (reports.length === 0) {
                container.innerHTML = '<div style="text-align:center;padding:60px 20px;color:#475569;">' +
                    '<svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="margin:0 auto 12px;display:block;opacity:0.3;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>' +
                    '<div>No submitted reports for this date</div></div>';
                return;
            }
            container.innerHTML = '<div style="display:grid;gap:12px;">' +
                reports.map(function(r) {
                    return '<div style="background:#0f172a;border:1px solid #1e293b;border-radius:12px;padding:16px 20px;display:flex;align-items:center;gap:16px;transition:all 0.2s;cursor:pointer;" onmouseenter="this.style.borderColor=#334155" onmouseleave="this.style.borderColor=#1e293b" onclick="window.__posReportView(' + r.id + ')">' +
                        '<div style="width:44px;height:44px;border-radius:12px;background:linear-gradient(135deg,#4f46e5,#6366f1);display:flex;align-items:center;justify-content:center;color:#fff;font-size:0.75rem;font-weight:700;flex-shrink:0;">' + (r.report_date ? r.report_date.slice(5) : '—') + '</div>' +
                        '<div style="flex:1;min-width:0;">' +
                            '<div style="color:#e2e8f0;font-weight:600;font-size:0.95rem;">' + esc(r.branch_name || 'Branch') + '</div>' +
                            '<div style="color:#64748b;font-size:0.8rem;margin-top:2px;">By ' + esc(r.admin_name || '—') + ' · ' + r.total_transactions + ' txns</div>' +
                        '</div>' +
                        '<div style="text-align:right;flex-shrink:0;">' +
                            '<div style="color:#4ade80;font-weight:700;font-size:1.1rem;">' + formatCurrency(r.total_sales) + '</div>' +
                            '<div style="display:flex;gap:8px;margin-top:4px;">' +
                                '<span style="color:#a78bfa;font-size:0.7rem;">Arcade: ' + formatCurrency(r.arcade_sales) + '</span>' +
                                '<span style="color:#4ade80;font-size:0.7rem;">Play: ' + formatCurrency(r.playhouse_sales) + '</span>' +
                            '</div>' +
                        '</div>' +
                        '<svg width="16" height="16" fill="none" stroke="#64748b" viewBox="0 0 24 24" style="flex-shrink:0;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>' +
                    '</div>';
                }).join('') + '</div>';
        }
    }

    function attachEvents() {
        document.getElementById('logout-btn')?.addEventListener('click', function(e) { e.preventDefault(); Auth.logout(); });

        document.querySelectorAll('.posr-tab').forEach(function(tab) {
            tab.addEventListener('click', function() {
                document.querySelectorAll('.posr-tab').forEach(function(t) { t.style.borderBottomColor = 'transparent'; t.style.color = '#64748b'; });
                tab.style.borderBottomColor = '#6366f1';
                tab.style.color = '#6366f1';
                activeTab = tab.dataset.tab;
                renderTabContent();
            });
        });

        document.getElementById('posr-branch')?.addEventListener('change', function(e) { filterBranch = e.target.value; });
        document.getElementById('posr-date')?.addEventListener('change', function(e) { dateFrom = e.target.value; dateTo = e.target.value; });
        document.getElementById('posr-filter')?.addEventListener('click', async function() {
            await Promise.all([loadReportsData(), loadTrackingData()]);
            render();
        });
    }

    function esc(str) {
        if (!str) return '';
        return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }

    window.__posReportView = function(id) {
        selectedReport = reports.find(function(r) { return r.id === id; });
        if (selectedReport) render();
    };

    window.__posReportsBack = function() {
        selectedReport = null;
        render();
    };

    window.__posrSoftDelete = async function(id) {
        if (!await confirmAsync('Delete this tracking receipt? It will be moved to trash.')) return;
        try {
            await apiPost('/tracking-sheets/' + id + '/soft-delete', {});
            Toast.success('Moved to trash');
            await loadTrackingData();
            render();
        } catch (e) { Toast.error(e.message || 'Failed to delete'); }
    };

    window.__posrViewReceipts = async function(area, sheetDate, branchId) {
        try {
            var sales = await apiGet('/sales?branch_id=' + branchId + '&start_date=' + sheetDate + '&end_date=' + sheetDate);
            if (!Array.isArray(sales)) sales = [];
            sales = sales.filter(function(s) { return s.area === area; });

            var modal = document.createElement('div');
            modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:9999;';
            modal.onclick = function(e) { if (e.target === modal) modal.remove(); };

            var totalSales = sales.reduce(function(a, s) { return a + (s.total_amount || 0); }, 0);
            var cashTotal = sales.filter(function(s) { return s.payment_method === 'Cash'; }).reduce(function(a, s) { return a + s.total_amount; }, 0);
            var gcashTotal = sales.filter(function(s) { return s.payment_method === 'GCash'; }).reduce(function(a, s) { return a + s.total_amount; }, 0);

            function renderItemName(item) {
                if (item.item_type === 'smash') return 'Smash Token (' + (item.token_count || '?') + ' pcs)';
                if (item.item_type === 'extra') return 'Extra Token (' + (item.token_count || '?') + ' pcs)';
                return item.product_name || 'Unknown';
            }

            var receiptsHtml = sales.length === 0 ?
                '<div style="text-align:center;padding:40px;color:#64748b;">No transactions for this date</div>' :
                '<div style="display:flex;flex-direction:column;gap:16px;padding:10px 0;">' + sales.map(function(sale) {
                    var txId = String(sale.id).padStart(6, '0');
                    var dt = sale.created_at ? new Date(sale.created_at) : new Date();
                    var dateStr = dt.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: '2-digit' });
                    var timeStr = dt.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', hour12: true });
                    var dayStr = dt.toLocaleDateString('en-PH', { weekday: 'long' });
                    var payColor = sale.payment_method === 'GCash' ? '#3b82f6' : '#22c55e';
                    var cashierName = (sale.seller_name || 'N/A').split(' ');
                    var cashierDisplay = cashierName.length > 1 ? cashierName[0] + ' ' + cashierName[cashierName.length - 1] : sale.seller_name || 'N/A';

                    var itemLines = (sale.items || []).map(function(item) {
                        var itemName = renderItemName(item);
                        if (itemName.length > 28) itemName = itemName.substring(0, 26) + '..';
                        return '<div style="font-family:\'Courier New\',monospace;font-size:0.75rem;color:#1a1a2e;display:flex;justify-content:space-between;">' +
                            '<span>' + esc(itemName) + ' x' + item.quantity + '</span>' +
                            '<span>' + formatCurrency(item.subtotal) + '</span>' +
                        '</div>';
                    }).join('');

                    return '<div style="display:flex;gap:16px;align-items:flex-start;">' +
                        '<div style="width:280px;background:#f5f0e8;border-radius:4px;padding:0;box-shadow:0 4px 16px rgba(0,0,0,0.3);flex-shrink:0;">' +
                            '<div style="padding:16px 20px 8px;text-align:center;">' +
                                '<div style="font-size:1.1rem;margin-bottom:1px;">\ud83c\udfae</div>' +
                                '<div style="font-family:\'Courier New\',monospace;font-weight:900;font-size:0.95rem;color:#1a1a2e;letter-spacing:3px;">DREAMLAND</div>' +
                                '<div style="font-family:\'Courier New\',monospace;font-weight:700;font-size:0.6rem;color:#555;letter-spacing:4px;margin-top:1px;">ARCADE</div>' +
                                '<div style="font-family:\'Courier New\',monospace;font-size:0.6rem;color:#777;margin-top:4px;">' + esc(sale.branch_name || 'Branch') + '</div>' +
                                '<div style="font-family:\'Courier New\',monospace;font-size:0.6rem;color:#555;margin-top:3px;">' + dayStr + ', ' + dateStr + '</div>' +
                            '</div>' +
                            '<div style="border-top:2px dashed #ccc;margin:0 12px;"></div>' +
                            '<div style="padding:8px 16px;">' +
                                '<div style="display:flex;justify-content:space-between;font-family:\'Courier New\',monospace;font-size:0.65rem;color:#555;">' +
                                    '<span>TXN#' + txId + '</span><span>' + timeStr + '</span>' +
                                '</div>' +
                                '<div style="display:flex;justify-content:space-between;font-family:\'Courier New\',monospace;font-size:0.65rem;color:#555;margin-top:1px;">' +
                                    '<span>SLSPRSN: ' + esc(cashierDisplay) + '</span><span>' + esc(sale.payment_method || 'Cash') + '</span>' +
                                '</div>' +
                            '</div>' +
                            '<div style="border-top:1px dashed #ccc;margin:0 12px;"></div>' +
                            '<div style="padding:8px 16px;">' +
                                '<div style="font-family:\'Courier New\',monospace;font-size:0.55rem;color:#888;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Item Description</div>' +
                                itemLines +
                            '</div>' +
                            '<div style="border-top:1px dashed #ccc;margin:0 12px;"></div>' +
                            '<div style="padding:8px 16px;">' +
                                '<div style="display:flex;justify-content:space-between;font-family:\'Courier New\',monospace;font-size:0.75rem;font-weight:700;color:#1a1a2e;">' +
                                    '<span>TOTAL</span><span>' + formatCurrency(sale.total_amount) + '</span>' +
                                '</div>' +
                            '</div>' +
                            '<div style="border-top:1px dashed #ccc;margin:0 12px;"></div>' +
                            '<div style="padding:8px 16px;text-align:center;">' +
                                '<div style="font-family:\'Courier New\',monospace;font-size:0.65rem;font-weight:700;color:' + payColor + ';letter-spacing:1px;">' + esc(sale.payment_method || 'Cash').toUpperCase() + '</div>' +
                            '</div>' +
                            '<div style="border-top:1px dashed #ccc;margin:0 12px;"></div>' +
                            '<div style="padding:10px 16px;text-align:center;">' +
                                '<div style="font-family:\'Courier New\',monospace;font-size:0.75rem;font-weight:900;color:#1a1a2e;letter-spacing:1px;">THANK YOU!</div>' +
                                '<div style="font-family:\'Courier New\',monospace;font-size:0.5rem;color:#bbb;margin-top:4px;letter-spacing:2px;">* * * * * * * * * * * *</div>' +
                            '</div>' +
                        '</div>' +
                        '<div style="flex:1;min-width:0;padding-top:4px;">' +
                            '<div style="color:#64748b;font-size:0.7rem;margin-bottom:4px;">TXN#' + txId + ' &middot; ' + timeStr + '</div>' +
                            '<div style="display:flex;gap:6px;flex-wrap:wrap;">' +
                                '<span style="background:' + payColor + '15;color:' + payColor + ';padding:2px 8px;border-radius:4px;font-size:0.7rem;font-weight:600;">' + esc(sale.payment_method) + '</span>' +
                                '<span style="color:#94a3b8;font-size:0.7rem;">by ' + esc(sale.seller_name || '—') + '</span>' +
                            '</div>' +
                            (sale.items || []).map(function(item) {
                                var isSpecial = item.item_type === 'smash' || item.item_type === 'extra';
                                var tagColor = item.item_type === 'smash' ? '#f59e0b' : '#ef4444';
                                var tagBg = item.item_type === 'smash' ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)';
                                var tagLabel = item.item_type === 'smash' ? 'SMASH' : 'EXTRA';
                                return '<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid #1e293b;">' +
                                    '<div style="display:flex;align-items:center;gap:6px;">' +
                                        (isSpecial ? '<span style="background:' + tagBg + ';color:' + tagColor + ';padding:1px 5px;border-radius:3px;font-size:0.6rem;font-weight:700;">' + tagLabel + '</span>' : '') +
                                        '<span style="color:#e2e8f0;font-size:0.75rem;">' + esc(renderItemName(item)) + '</span>' +
                                    '</div>' +
                                    '<div style="display:flex;gap:8px;align-items:center;">' +
                                        '<span style="color:#94a3b8;font-size:0.7rem;">x' + item.quantity + '</span>' +
                                        '<span style="color:#4ade80;font-size:0.75rem;font-weight:600;">' + formatCurrency(item.subtotal) + '</span>' +
                                    '</div>' +
                                '</div>';
                            }).join('') +
                            '<div style="display:flex;justify-content:space-between;padding:8px 0 0;margin-top:4px;border-top:2px solid #30363d;">' +
                                '<span style="color:#e2e8f0;font-weight:700;font-size:0.85rem;">Total</span>' +
                                '<span style="color:#4ade80;font-weight:700;font-size:0.9rem;">' + formatCurrency(sale.total_amount) + '</span>' +
                            '</div>' +
                        '</div>' +
                    '</div>';
                }).join('') + '</div>';

            modal.innerHTML = '<div style="background:#1a1f2e;border:1px solid #2a3040;border-radius:16px;padding:24px;width:720px;max-width:95vw;max-height:90vh;display:flex;flex-direction:column;">' +
                '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">' +
                    '<div style="display:flex;align-items:center;gap:10px;">' +
                        '<div style="width:36px;height:36px;border-radius:10px;background:' + (area === 'Arcade' ? '#6366f1' : area === 'Playhouse' ? '#22c55e' : '#f59e0b') + '20;display:flex;align-items:center;justify-content:center;font-size:1.1rem;">' + (area === 'Arcade' ? '\ud83c\udfae' : area === 'Playhouse' ? '\ud83c\udfe0' : '\u2615') + '</div>' +
                        '<div>' +
                            '<div style="color:#e2e8f0;font-weight:700;font-size:1rem;">' + esc(area) + ' Receipts</div>' +
                            '<div style="color:#64748b;font-size:0.75rem;">' + esc(sheetDate) + ' &middot; ' + sales.length + ' transaction' + (sales.length !== 1 ? 's' : '') + '</div>' +
                        '</div>' +
                    '</div>' +
                    '<button onclick="this.closest(\'div[style*=fixed]\').remove()" style="background:none;border:1px solid #30363d;border-radius:8px;padding:6px 10px;color:#94a3b8;cursor:pointer;font-size:0.9rem;transition:all 0.2s;" onmouseenter="this.style.borderColor=#ef4444;this.style.color=#f87171" onmouseleave="this.style.borderColor=#30363d;this.style.color=#94a3b8">&times;</button>' +
                '</div>' +
                '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px;">' +
                    '<div style="background:#0d1117;border-radius:10px;padding:12px;text-align:center;border:1px solid #1e293b;">' +
                        '<div style="color:#64748b;font-size:0.6rem;text-transform:uppercase;letter-spacing:1px;">Total</div>' +
                        '<div style="color:#4ade80;font-weight:700;font-size:1.1rem;margin-top:4px;">' + formatCurrency(totalSales) + '</div>' +
                    '</div>' +
                    '<div style="background:#0d1117;border-radius:10px;padding:12px;text-align:center;border:1px solid #1e293b;">' +
                        '<div style="color:#64748b;font-size:0.6rem;text-transform:uppercase;letter-spacing:1px;">Cash</div>' +
                        '<div style="color:#4ade80;font-weight:700;font-size:1.1rem;margin-top:4px;">' + formatCurrency(cashTotal) + '</div>' +
                    '</div>' +
                    '<div style="background:#0d1117;border-radius:10px;padding:12px;text-align:center;border:1px solid #1e293b;">' +
                        '<div style="color:#64748b;font-size:0.6rem;text-transform:uppercase;letter-spacing:1px;">GCash</div>' +
                        '<div style="color:#3b82f6;font-weight:700;font-size:1.1rem;margin-top:4px;">' + formatCurrency(gcashTotal) + '</div>' +
                    '</div>' +
                '</div>' +
                '<div style="overflow-y:auto;flex:1;">' + receiptsHtml + '</div>' +
            '</div>';

            document.body.appendChild(modal);
        } catch (e) {
            Toast.error('Failed to load receipts');
        }
    };

    window.__posrViewSingleReceipt = async function(saleId) {
        try {
            var sales = await apiGet('/sales?start_date=2000-01-01&end_date=2099-12-31');
            if (!Array.isArray(sales)) sales = [];
            var sale = sales.find(function(s) { return s.id === saleId; });
            if (!sale) { Toast.error('Transaction not found'); return; }

            var txId = String(sale.id).padStart(6, '0');
            var dt = sale.created_at ? new Date(sale.created_at) : new Date();
            var dateStr = dt.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: '2-digit' });
            var timeStr = dt.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', hour12: true });
            var dayStr = dt.toLocaleDateString('en-PH', { weekday: 'long' });
            var payColor = sale.payment_method === 'GCash' ? '#3b82f6' : sale.payment_method === 'Card' ? '#f59e0b' : '#4ade80';
            var cashierName = (sale.seller_name || 'N/A').split(' ');
            var cashierDisplay = cashierName.length > 1 ? cashierName[0] + ' ' + cashierName[cashierName.length - 1] : sale.seller_name || 'N/A';

            function renderItemName(item) {
                if (item.item_type === 'smash') return 'Smash Token (' + (item.token_count || '?') + ' pcs)';
                if (item.item_type === 'extra') return 'Extra Token (' + (item.token_count || '?') + ' pcs)';
                return item.product_name || 'Token';
            }

            var itemLines = (sale.items || []).map(function(item) {
                var itemName = renderItemName(item);
                if (itemName.length > 28) itemName = itemName.substring(0, 26) + '..';
                return '<div style="font-family:\'Courier New\',monospace;font-size:0.75rem;color:#1a1a2e;display:flex;justify-content:space-between;">' +
                    '<span>' + esc(itemName) + ' x' + item.quantity + '</span>' +
                    '<span>' + formatCurrency(item.subtotal) + '</span>' +
                '</div>';
            }).join('');

            var modal = document.createElement('div');
            modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:9999;';
            modal.onclick = function(e) { if (e.target === modal) modal.remove(); };

            modal.innerHTML = '<div style="display:flex;gap:20px;align-items:flex-start;">' +
                '<div style="width:300px;background:#f5f0e8;border-radius:4px;padding:0;box-shadow:0 8px 32px rgba(0,0,0,0.4);flex-shrink:0;">' +
                    '<div style="padding:20px 24px 12px;text-align:center;">' +
                        '<div style="font-size:1.3rem;margin-bottom:2px;">\ud83c\udfae</div>' +
                        '<div style="font-family:\'Courier New\',monospace;font-weight:900;font-size:1.1rem;color:#1a1a2e;letter-spacing:3px;">DREAMLAND</div>' +
                        '<div style="font-family:\'Courier New\',monospace;font-weight:700;font-size:0.7rem;color:#555;letter-spacing:4px;margin-top:2px;">ARCADE</div>' +
                        '<div style="font-family:\'Courier New\',monospace;font-size:0.65rem;color:#777;margin-top:6px;">' + esc(sale.branch_name || 'Branch') + '</div>' +
                        '<div style="font-family:\'Courier New\',monospace;font-size:0.7rem;color:#555;margin-top:4px;">' + dayStr + '</div>' +
                        '<div style="font-family:\'Courier New\',monospace;font-size:0.65rem;color:#777;margin-top:2px;">' + dateStr + '</div>' +
                    '</div>' +
                    '<div style="border-top:2px dashed #ccc;margin:0 16px;"></div>' +
                    '<div style="padding:12px 24px;">' +
                        '<div style="display:flex;justify-content:space-between;font-family:\'Courier New\',monospace;font-size:0.7rem;color:#555;">' +
                            '<span>TXN#' + txId + '</span><span>' + timeStr + '</span>' +
                        '</div>' +
                        '<div style="display:flex;justify-content:space-between;font-family:\'Courier New\',monospace;font-size:0.7rem;color:#555;margin-top:2px;">' +
                            '<span>SLSPRSN: ' + esc(cashierDisplay) + '</span><span>' + esc(sale.payment_method || 'Cash') + '</span>' +
                        '</div>' +
                    '</div>' +
                    '<div style="border-top:1px dashed #ccc;margin:0 16px;"></div>' +
                    '<div style="padding:10px 24px;">' +
                        '<div style="font-family:\'Courier New\',monospace;font-size:0.65rem;color:#888;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Item Description</div>' +
                        itemLines +
                    '</div>' +
                    '<div style="border-top:1px dashed #ccc;margin:0 16px;"></div>' +
                    '<div style="padding:10px 24px;">' +
                        '<div style="display:flex;justify-content:space-between;font-family:\'Courier New\',monospace;font-size:0.8rem;font-weight:700;color:#1a1a2e;">' +
                            '<span>TOTAL</span><span>' + formatCurrency(sale.total_amount) + '</span>' +
                        '</div>' +
                    '</div>' +
                    '<div style="border-top:1px dashed #ccc;margin:0 16px;"></div>' +
                    '<div style="padding:10px 24px 6px;text-align:center;">' +
                        '<div style="font-family:\'Courier New\',monospace;font-size:0.65rem;color:#555;">Payment Method</div>' +
                        '<div style="font-family:\'Courier New\',monospace;font-size:0.8rem;font-weight:700;color:' + payColor + ';margin-top:2px;">' + esc(sale.payment_method || 'Cash').toUpperCase() + '</div>' +
                    '</div>' +
                    '<div style="border-top:1px dashed #ccc;margin:0 16px;"></div>' +
                    '<div style="padding:12px 24px 16px;text-align:center;">' +
                        '<div style="font-family:\'Courier New\',monospace;font-size:0.85rem;font-weight:900;color:#1a1a2e;letter-spacing:1px;">THANK YOU!</div>' +
                        '<div style="font-family:\'Courier New\',monospace;font-size:0.6rem;color:#999;margin-top:4px;">This is your official receipt</div>' +
                        '<div style="font-family:\'Courier New\',monospace;font-size:0.55rem;color:#bbb;margin-top:6px;letter-spacing:2px;">* * * * * * * * * * * * * * * *</div>' +
                    '</div>' +
                '</div>' +
                '<div style="background:#1a1f2e;border:1px solid #2a3040;border-radius:12px;padding:20px;width:320px;flex-shrink:0;">' +
                    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">' +
                        '<div style="color:#e2e8f0;font-weight:700;font-size:0.95rem;">Transaction Details</div>' +
                        '<button onclick="this.closest(\'div[style*=fixed]\').remove()" style="background:none;border:1px solid #30363d;border-radius:6px;padding:4px 8px;color:#94a3b8;cursor:pointer;font-size:0.8rem;">&times;</button>' +
                    '</div>' +
                    '<div style="display:flex;gap:8px;margin-bottom:12px;">' +
                        '<span style="background:' + payColor + '15;color:' + payColor + ';padding:3px 10px;border-radius:4px;font-size:0.75rem;font-weight:600;">' + esc(sale.payment_method) + '</span>' +
                        '<span style="color:#94a3b8;font-size:0.75rem;">by ' + esc(sale.seller_name || '—') + '</span>' +
                    '</div>' +
                    (sale.items || []).map(function(item) {
                        var isSpecial = item.item_type === 'smash' || item.item_type === 'extra';
                        var tagColor = item.item_type === 'smash' ? '#f59e0b' : '#ef4444';
                        var tagBg = item.item_type === 'smash' ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)';
                        var tagLabel = item.item_type === 'smash' ? 'SMASH' : 'EXTRA';
                        return '<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid #1e293b;">' +
                            '<div style="display:flex;align-items:center;gap:6px;">' +
                                (isSpecial ? '<span style="background:' + tagBg + ';color:' + tagColor + ';padding:1px 5px;border-radius:3px;font-size:0.6rem;font-weight:700;">' + tagLabel + '</span>' : '') +
                                '<span style="color:#e2e8f0;font-size:0.8rem;">' + esc(renderItemName(item)) + '</span>' +
                            '</div>' +
                            '<div style="display:flex;gap:8px;align-items:center;">' +
                                '<span style="color:#94a3b8;font-size:0.7rem;">x' + item.quantity + '</span>' +
                                '<span style="color:#4ade80;font-size:0.8rem;font-weight:600;">' + formatCurrency(item.subtotal) + '</span>' +
                            '</div>' +
                        '</div>';
                    }).join('') +
                    '<div style="display:flex;justify-content:space-between;padding:10px 0 0;margin-top:4px;border-top:2px solid #30363d;">' +
                        '<span style="color:#e2e8f0;font-weight:700;font-size:0.9rem;">Total</span>' +
                        '<span style="color:#4ade80;font-weight:700;font-size:1rem;">' + formatCurrency(sale.total_amount) + '</span>' +
                    '</div>' +
                '</div>' +
            '</div>';

            document.body.appendChild(modal);
        } catch (e) {
            Toast.error('Failed to load receipt');
        }
    };

    loadData();

    var origRender = app.innerHTML;
    var checkInterval = setInterval(function() {
        if (!document.getElementById('page-body')) {
            clearInterval(checkInterval);
            if (refreshTimer) { clearInterval(refreshTimer); refreshTimer = null; }
        }
    }, 2000);
}

Router.register('pos-reports', renderPOSReports);
