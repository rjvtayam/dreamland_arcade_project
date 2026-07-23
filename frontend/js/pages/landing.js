function renderLanding() {
    var app = document.getElementById('app');

    var particles = '';
    for (var i = 0; i < 30; i++) {
        var left = Math.random() * 100;
        var delay = Math.random() * 15;
        var duration = 8 + Math.random() * 12;
        var size = 1 + Math.random() * 3;
        var colors = ['#00f0ff', '#ff00e5', '#b44aff', '#00ff88'];
        var color = colors[Math.floor(Math.random() * colors.length)];
        particles += '<div class="landing-particle" style="left:' + left + '%;width:' + size + 'px;height:' + size + 'px;background:' + color + ';animation-delay:' + delay + 's;animation-duration:' + duration + 's;"></div>';
    }

    app.innerHTML = '<div class="landing-page">' +
        '<div class="landing-bg">' +
            '<div class="landing-grid"></div>' +
            '<div class="landing-glow-1"></div>' +
            '<div class="landing-glow-2"></div>' +
            '<div class="landing-glow-3"></div>' +
            '<div class="landing-particles">' + particles + '</div>' +
        '</div>' +

        '<nav class="landing-nav">' +
            '<div class="landing-nav-brand">' +
                '<div class="landing-nav-logo">🕹️</div>' +
                '<div class="landing-nav-title">DREAMLAND</div>' +
            '</div>' +
            '<div style="display:flex;gap:10px;align-items:center;">' +
                '<button class="landing-nav-pos" style="padding:8px 24px;background:transparent;border:1px solid #22c55e;border-radius:8px;color:#22c55e;font-family:var(--font-display);font-size:0.75rem;font-weight:600;letter-spacing:2px;cursor:pointer;transition:all 250ms ease;" onclick="Router.navigate(\'pos-login\')">POS</button>' +
                '<button class="landing-nav-enter" onclick="Router.navigate(\'login\')">ENTER</button>' +
            '</div>' +
        '</nav>' +

        '<div class="landing-content">' +
            '<div class="landing-hero">' +
                '<div class="landing-icon">' +
                    '<svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="url(#landingGrad)" stroke-width="1.2">' +
                        '<defs><linearGradient id="landingGrad" x1="0%" y1="0%" x2="100%" y2="100%">' +
                            '<stop offset="0%" style="stop-color:#00f0ff"/>' +
                            '<stop offset="100%" style="stop-color:#ff00e5"/>' +
                        '</linearGradient></defs>' +
                        '<path d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" stroke-linecap="round" stroke-linejoin="round"/>' +
                    '</svg>' +
                '</div>' +
                '<h1 class="landing-title">DREAMLAND</h1>' +
                '<p class="landing-tagline">ARCADE MANAGEMENT SYSTEM</p>' +
                '<p class="landing-subtitle">Level up your arcade operations</p>' +
            '</div>' +

            '<div class="landing-divider"></div>' +

            '<div class="landing-features">' +
                '<div class="landing-feature">' +
                    '<span class="landing-feature-icon">🎮</span>' +
                    '<div class="landing-feature-title">Arcade Management</div>' +
                    '<div class="landing-feature-desc">Track games, monitor usage, and manage your arcade floor in real-time.</div>' +
                '</div>' +
                '<div class="landing-feature">' +
                    '<span class="landing-feature-icon">👥</span>' +
                    '<div class="landing-feature-title">Staff Control</div>' +
                    '<div class="landing-feature-desc">Schedules, attendance, payroll — manage your team from one dashboard.</div>' +
                '</div>' +
                '<div class="landing-feature">' +
                    '<span class="landing-feature-icon">📊</span>' +
                    '<div class="landing-feature-title">Analytics & Reports</div>' +
                    '<div class="landing-feature-desc">Sales insights, performance metrics, and revenue tracking at a glance.</div>' +
                '</div>' +
            '</div>' +

            '<div class="landing-cta">' +
                '<button class="landing-enter-btn" onclick="Router.navigate(\'login\')">' +
                    'ENTER ARCADE' +
                    '<span class="landing-enter-arrow">\u2192</span>' +
                '</button>' +
                '<button class="landing-pos-btn" style="display:inline-flex;align-items:center;gap:10px;padding:16px 40px;background:transparent;border:1px solid #22c55e;border-radius:12px;color:#22c55e;font-family:var(--font-display);font-size:1rem;font-weight:700;letter-spacing:4px;text-transform:uppercase;cursor:pointer;transition:all 250ms ease;position:relative;overflow:hidden;" onclick="Router.navigate(\'pos-login\')">' +
                    '<span style="font-size:1.1rem;">\u25B6</span>' +
                    'POS TERMINAL' +
                '</button>' +
            '</div>' +

            '<div class="landing-branches">' +
                '<div class="landing-branch">' +
                    '<div class="landing-branch-dot"></div>' +
                    '<span>Siniloan, Laguna</span>' +
                '</div>' +
                '<div class="landing-branch">' +
                    '<div class="landing-branch-dot"></div>' +
                    '<span>Infanta, Quezon</span>' +
                '</div>' +
            '</div>' +
        '</div>' +

        '<footer class="landing-footer">' +
            '<div class="landing-footer-text">\u00a9 2026 DREAMLAND ARCADE \u2014 MANAGEMENT SYSTEM</div>' +
            '<div class="landing-footer-links">' +
                '<span class="landing-footer-link" onclick="Router.navigate(\'login\')">Staff Login</span>' +
                '<span class="landing-footer-link" onclick="Router.navigate(\'pos-login\')" style="color:#22c55e;">POS Terminal</span>' +
            '</div>' +
        '</footer>' +
    '</div>';
}

Router.register('landing', renderLanding);
