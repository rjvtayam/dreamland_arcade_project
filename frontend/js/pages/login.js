function renderLogin() {
    const pinLength = 6;
    let pin = '';
    let selectedBranch = '';

    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="login-page">
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
