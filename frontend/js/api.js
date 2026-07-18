async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    const token = Auth.getAccessToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        ...options,
        headers
    };

    if (options.body && typeof options.body === 'object') {
        config.body = JSON.stringify(options.body);
    }

    let response = await fetch(url, config);

    if (response.status === 401 && Auth.getRefreshToken()) {
        const refreshed = await tryRefreshToken();
        if (refreshed) {
            headers['Authorization'] = `Bearer ${Auth.getAccessToken()}`;
            config.headers = headers;
            response = await fetch(url, config);
        } else {
            Auth.logout();
            throw new Error('Session expired. Please log in again.');
        }
    }

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message = errorData.detail || errorData.message || `Request failed with status ${response.status}`;
        throw new Error(message);
    }

    if (response.status === 204) {
        return null;
    }

    return response.json();
}

async function tryRefreshToken() {
    try {
        const refreshToken = Auth.getRefreshToken();
        if (!refreshToken) return false;

        const response = await fetch(`${API_BASE}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refreshToken })
        });

        if (!response.ok) return false;

        const data = await response.json();
        Auth.saveTokens(data.access_token, data.refresh_token || refreshToken);
        return true;
    } catch {
        return false;
    }
}

function apiGet(endpoint) {
    return apiRequest(endpoint, { method: 'GET' });
}

function apiPost(endpoint, data) {
    return apiRequest(endpoint, { method: 'POST', body: data });
}

function apiPut(endpoint, data) {
    return apiRequest(endpoint, { method: 'PUT', body: data });
}

function apiDelete(endpoint) {
    return apiRequest(endpoint, { method: 'DELETE' });
}
