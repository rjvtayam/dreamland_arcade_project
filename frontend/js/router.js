const Router = {
    routes: {},
    currentPage: null,

    register(hash, renderFn) {
        this.routes[hash] = renderFn;
    },

    navigate(hash) {
        window.location.hash = hash;
    },

    init() {
        window.addEventListener('hashchange', () => this.handleRoute());
        this.handleRoute();
    },

    handleRoute() {
        const hash = window.location.hash.slice(1) || 'dashboard';
        const routeKey = hash.split('/')[0];

        if (!Auth.isAuthenticated() && routeKey !== 'login') {
            this.navigate('login');
            return;
        }

        if (Auth.isAuthenticated() && routeKey === 'login') {
            this.navigate('dashboard');
            return;
        }

        const renderFn = this.routes[routeKey];
        if (renderFn) {
            this.currentPage = routeKey;
            renderFn(hash);
            this.updateActiveNav(routeKey);
        } else {
            this.navigate('dashboard');
        }
    },

    updateActiveNav(routeKey) {
        document.querySelectorAll('.sidebar-nav a').forEach(link => {
            link.classList.remove('active');
            const href = link.getAttribute('href');
            if (href && href === `#${routeKey}`) {
                link.classList.add('active');
            }
        });
    }
};
