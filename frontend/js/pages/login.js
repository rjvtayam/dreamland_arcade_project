function renderLogin() {
    const pinLength = 6;
    let pin = '';
    let selectedBranch = '';

    let particles = '';
    for (var i = 0; i < 40; i++) {
        var left = Math.random() * 100;
        var delay = Math.random() * 10;
        var duration = 6 + Math.random() * 10;
        var size = 1 + Math.random() * 3;
        var colors = ['#00f0ff', '#ff00e5', '#b44aff', '#00ff88'];
        var color = colors[Math.floor(Math.random() * colors.length)];
        particles += '<div class="login-particle" style="left:' + left + '%;width:' + size + 'px;height:' + size + 'px;background:' + color + ';animation-delay:' + delay + 's;animation-duration:' + duration + 's;"></div>';
    }

    let molecules = '';
    for (var i = 0; i < 12; i++) {
        var left = 5 + Math.random() * 90;
        var top = 5 + Math.random() * 90;
        var delay = Math.random() * 6;
        var duration = 4 + Math.random() * 6;
        var size = 20 + Math.random() * 40;
        var colors = ['rgba(0,240,255,0.06)', 'rgba(255,0,229,0.05)', 'rgba(180,74,255,0.04)'];
        var color = colors[Math.floor(Math.random() * colors.length)];
        molecules += '<div class="login-molecule" style="left:' + left + '%;top:' + top + '%;width:' + size + 'px;height:' + size + 'px;background:' + color + ';animation-delay:' + delay + 's;animation-duration:' + duration + 's;"></div>';
    }

    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="login-page">
            <div class="login-bg"></div>
            <div class="login-grid-lines"></div>
            <div class="login-particles">${particles}</div>
            <div class="login-molecules">${molecules}</div>
            <div class="login-orb login-orb-1"></div>
            <div class="login-orb login-orb-2"></div>
            <div class="login-orb login-orb-3"></div>
            <div class="login-container">
                <div class="login-card">
                <div class="login-logo">
                    <svg class="login-logo-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" stroke-width="1.5">
                        <path d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </div>
                <h1 class="login-title">DREAMLAND</h1>
                <p class="login-subtitle">ARCADE MANAGEMENT SYSTEM</p>

                <div class="login-form">
                    <div class="login-field">
                        <label>Select Branch</label>
                        <select id="branch-select" class="login-select">
                            <option value="">Loading branches...</option>
                        </select>
                    </div>

                    <div class="login-field">
                        <label>Enter PIN</label>
                        <div class="pin-display" id="pin-display"></div>
                    </div>

                    <div class="keypad">
                        ${[1,2,3,4,5,6,7,8,9].map(n => `<button class="keypad-btn" data-key="${n}">${n}</button>`).join('')}
                        <button class="keypad-btn keypad-back" data-key="back">&larr;</button>
                        <button class="keypad-btn" data-key="0">0</button>
                        <span></span>
                    </div>

                    <button id="login-btn" class="login-btn" disabled>LOGIN</button>

                    <div id="login-error" class="login-error" style="display:none;"></div>
                </div>
            </div>
        </div>
    `;

    const pinDisplay = document.getElementById('pin-display');
    const loginBtn = document.getElementById('login-btn');
    const branchSelect = document.getElementById('branch-select');
    const errorDiv = document.getElementById('login-error');

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

    document.querySelectorAll('.keypad-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            hideError();
            const key = btn.dataset.key;

            if (key === 'clear') {
                pin = '';
            } else if (key === 'back') {
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
        loginBtn.textContent = 'LOGGING IN...';
        hideError();

        try {
            const data = await apiPost('/auth/login', {
                pin: pin,
                branch_id: parseInt(selectedBranch)
            });

            Auth.saveTokens(data.access_token, data.refresh_token);

            const user = await apiGet('/auth/me');
            Auth.saveUser(user);

            Toast.success('Login successful!');

            const role = user.role;
            if (role === 'admin' || role === 'owner') {
                Router.navigate('dashboard');
            } else {
                Router.navigate('dashboard');
            }

            window.location.reload();
        } catch (err) {
            showError(err.message || 'Login failed. Please check your PIN and branch.');
            loginBtn.disabled = false;
            loginBtn.textContent = 'LOGIN';
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

Router.register('login', renderLogin);
