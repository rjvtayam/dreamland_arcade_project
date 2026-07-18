function renderTable(containerId, columns, data, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!data || data.length === 0) {
        container.innerHTML = `
            <div class="table-container ${options.class || ''}">
                <div style="text-align:center;padding:40px 20px;color:#94a3b8;">
                    <svg width="48" height="48" fill="none" stroke="#475569" viewBox="0 0 24 24" style="margin:0 auto 12px;">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                    </svg>
                    <p style="margin:0;font-size:15px;">${options.emptyMessage || 'No records found'}</p>
                </div>
            </div>
        `;
        return;
    }

    let html = `<div class="table-container ${options.class || ''}"><table><thead><tr>`;

    columns.forEach(col => {
        const align = col.align ? `text-align:${col.align};` : '';
        html += `<th style="${align}">${col.label}</th>`;
    });

    html += `</tr></thead><tbody>`;

    data.forEach((row, index) => {
        const clickable = options.onRowClick ? 'style="cursor:pointer;"' : '';
        const clickHandler = options.onRowClick ? `data-row-index="${index}"` : '';

        html += `<tr ${clickable} ${clickHandler}>`;

        columns.forEach(col => {
            const align = col.align ? `text-align:${col.align};` : '';
            const value = col.render ? col.render(row[col.key], row) : (row[col.key] ?? '-');
            html += `<td style="${align}">${value}</td>`;
        });

        html += `</tr>`;
    });

    html += `</tbody></table></div>`;

    container.innerHTML = html;

    if (options.onRowClick) {
        container.querySelectorAll('tr[data-row-index]').forEach(tr => {
            tr.addEventListener('click', () => {
                const idx = parseInt(tr.dataset.rowIndex);
                options.onRowClick(data[idx], idx);
            });
        });
    }
}
