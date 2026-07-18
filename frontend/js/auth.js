const Auth = {
    saveTokens(accessToken, refreshToken) {
        localStorage.setItem('access_token', accessToken);
        localStorage.setItem('refresh_token', refreshToken);
    },

    getAccessToken() {
        return localStorage.getItem('access_token');
    },

    getRefreshToken() {
        return localStorage.getItem('refresh_token');
    },

    clearTokens() {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
    },

    isAuthenticated() {
        return !!this.getAccessToken();
    },

    getUser() {
        const data = localStorage.getItem('user');
        if (!data) return null;
        try {
            return JSON.parse(data);
        } catch {
            return null;
        }
    },

    saveUser(user) {
        localStorage.setItem('user', JSON.stringify(user));
    },

    logout() {
        this.clearTokens();
        localStorage.removeItem('user');
        window.location.hash = 'login';
        window.location.reload();
    },

    getUserRole() {
        const user = this.getUser();
        return user ? user.role : null;
    }
};
