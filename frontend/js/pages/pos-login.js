function renderPOSLogin() {
    const pinLength = 6;
    let pin = '';
    let selectedBranch = '';

    var particles = '';
    for (var i = 0; i < 30; i++) {
        var left = Math.random() * 100;
        var delay = Math.random() * 10;
        var duration = 6 + Math.random() * 10;
        var size = 1 + Math.random() * 3;
        var colors = ['#22c55e', '#10b981', '#34d399', '#00ff88'];
        var color = colors[Math.floor(Math.random() * colors.length)];
        particles += '<div class="login-particle" style="left:' + left + '%;width:' + size + 'px;height:' + size + 'px;background:' + color + ';animation-delay:' + delay + 's;animation-duration:' + duration + 's;"></div>';
    }

    var molecules = '';
    for (var i = 0; i < 10; i++) {
        var left = 5 + Math.random() * 90;
        var top = 5 + Math.random() * 90;
        var delay = Math.random() * 6;
        var duration = 4 + Math.random() * 6;
        var size = 20 + Math.random() * 40;
        var colors = ['rgba(34,197,94,0.06)', 'rgba(16,185,129,0.05)', 'rgba(52,211,153,0.04)'];
        var color = colors[Math.floor(Math.random() * colors.length)];
        molecules += '<div class="login-molecule" style="left:' + left + '%;top:' + top + '%;width:' + size + 'px;height:' + size + 'px;background:' + color + ';animation-delay:' + delay + 's;animation-duration:' + duration + 's;"></div>';
    }

    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="login-page pos-login-page">
            <div class="login-bg"></div>
            <div class="login-grid-lines"></div>
            <div class="login-particles">${particles}</div>
            <div class="login-molecules">${molecules}</div>
            <div class="login-orb login-orb-1"></div>
            <div class="login-orb login-orb-2"></div>
            <div class="login-container">
                <div class="login-card pos-login-card">
                <div style="position:absolute;top:16px;left:16px;">
                    <a href="#landing" style="color:#94a3b8;font-size:0.8rem;text-decoration:none;display:flex;align-items:center;gap:6px;transition:color 0.2s;" onmouseenter="this.style.color='#22c55e'" onmouseleave="this.style.color='#94a3b8'">
                        <span style="font-size:1.1rem;">&#8592;</span> Back
                    </a>
                </div>
                <div class="login-logo">
                    <svg class="login-logo-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="1.5">
                        <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </div>
                <h1 class="login-title" style="background:linear-gradient(135deg,#22c55e,#10b981);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">POS TERMINAL</h1>
                <p class="login-subtitle">ADMIN ACCESS ONLY</p>

                <div class="login-form">
                    <div class="login-field">
                        <label>Select Branch</label>
                        <select id="pos-branch-select" class="login-select">
                            <option value="">Loading branches...</option>
                        </select>
                    </div>

                    <div class="login-field">
                        <label>Enter Admin PIN</label>
                        <div class="pin-display" id="pos-pin-display"></div>
                    </div>

                    <div class="keypad">
                        ${[1,2,3,4,5,6,7,8,9].map(n => `<button class="keypad-btn pos-keypad" data-key="${n}">${n}</button>`).join('')}
                        <button class="keypad-btn keypad-back pos-keypad" data-key="back">&larr;</button>
                        <button class="keypad-btn pos-keypad" data-key="0">0</button>
                        <span></span>
                    </div>

                    <button id="pos-login-btn" class="login-btn pos-login-btn" disabled>OPEN POS</button>

                    <div id="pos-login-error" class="login-error" style="display:none;"></div>
                </div>
            </div>
        </div>
    `;

    const pinDisplay = document.getElementById('pos-pin-display');
    const loginBtn = document.getElementById('pos-login-btn');
    const branchSelect = document.getElementById('pos-branch-select');
    const errorDiv = document.getElementById('pos-login-error');

    function updatePinDisplay() {
        let dots = '';
        for (let i = 0; i < pinLength; i++) {
            if (i < pin.length) {
                dots += '<span class="pin-dot filled"></span>';
            } else {
                dots += '<span class="pin-dot"></span>';
            }
        }
        pinDisplay.innerHTML = dots;
        loginBtn.disabled = pin.length < 4 || !branchSelect.value;
    }

    function showError(msg) {
        errorDiv.textContent = msg;
        errorDiv.style.display = 'block';
    }

    function hideError() {
        errorDiv.style.display = 'none';
    }

    document.querySelectorAll('.pos-keypad').forEach(btn => {
        btn.addEventListener('click', () => {
            hideError();
            const key = btn.dataset.key;
            if (key === 'back') {
                pin = pin.slice(0, -1);
            } else {
                if (pin.length < pinLength) {
                    pin += key;
                }
            }
            updatePinDisplay();
        });
    });

    branchSelect.addEventListener('change', () => {
        selectedBranch = branchSelect.value;
        updatePinDisplay();
    });

    loginBtn.addEventListener('click', async () => {
        if (pin.length < 4 || !selectedBranch) return;

        loginBtn.disabled = true;
        loginBtn.textContent = 'AUTHENTICATING...';
        hideError();

        try {
            const data = await apiPost('/auth/login', {
                pin: pin,
                branch_id: parseInt(selectedBranch)
            });

            const userResp = await fetch(API_BASE + '/auth/me', {
                headers: { 'Authorization': 'Bearer ' + data.access_token }
            });
            const user = await userResp.json();

            if (user.role !== 'admin' && user.role !== 'owner') {
                showError('POS access is restricted to Admin and Owner roles.');
                loginBtn.disabled = false;
                loginBtn.textContent = 'OPEN POS';
                pin = '';
                updatePinDisplay();
                return;
            }

            localStorage.setItem('pos_token', data.access_token);
            localStorage.setItem('pos_refresh', data.refresh_token);
            localStorage.setItem('pos_user', JSON.stringify(user));

            Toast.success('POS access granted!');
            Router.navigate('pos-terminal');
        } catch (err) {
            showError(err.message || 'Login failed. Check your PIN and branch.');
            loginBtn.disabled = false;
            loginBtn.textContent = 'OPEN POS';
            pin = '';
            updatePinDisplay();
        }
    });

    async function loadBranches() {
        try {
            const branches = await apiGet('/branches');
            branchSelect.innerHTML = '<option value="">-- Select Branch --</option>';
            branches.forEach(branch => {
                const opt = document.createElement('option');
                opt.value = branch.id;
                opt.textContent = branch.name;
                branchSelect.appendChild(opt);
            });
        } catch {
            branchSelect.innerHTML = '<option value="">Failed to load branches</option>';
        }
    }

    loadBranches();
    updatePinDisplay();
}

Router.register('pos-login', renderPOSLogin);
