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
        const hash = window.location.hash.slice(1) || 'landing';
        const routeKey = hash.split('/')[0];

        const publicRoutes = ['login', 'landing', 'pos-login', 'pos-terminal'];

        if (!Auth.isAuthenticated() && !publicRoutes.includes(routeKey)) {
            this.navigate('landing');
            return;
        }

        if (Auth.isAuthenticated() && (routeKey === 'login' || routeKey === 'landing')) {
            this.navigate('dashboard');
            return;
        }

        const renderFn = this.routes[routeKey];
        if (renderFn) {
            this.currentPage = routeKey;
            renderFn(hash);
            if (routeKey !== 'pos-terminal') {
                this.updateActiveNav(routeKey);
            }
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
