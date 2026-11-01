/**
 * api.js — Centralized API Client
 *
 * All frontend ↔ backend communication flows through this module.
 * Handles: base URL resolution, JSON parsing, error handling, loading states.
 *
 * Usage:
 *   const data = await EduSphereAPI.get('/news/announcements');
 *   const result = await EduSphereAPI.post('/admissions', formData);
 */

const EduSphereAPI = (() => {
    // ─── Token Key (consistent across all modules) ────
    const TOKEN_KEY = 'edusphere_admin_token';

    // ─── Configuration ──────────────────────────────────
    // Auto-detect: if running locally, use localhost backend; otherwise use production URL
    const API_BASE = (() => {
        // If school.config.js provides a base URL, use it
        if (window.SCHOOL_CONFIG?.api?.baseUrl) {
            return window.SCHOOL_CONFIG.api.baseUrl;
        }

        const hostname = window.location.hostname;
        const protocol = window.location.protocol;

        if (protocol === 'file:') {
            return 'http://localhost:5000/api';
        }

        if (
            hostname === 'localhost' ||
            hostname === '127.0.0.1' ||
            hostname.startsWith('192.168.') ||
            hostname.startsWith('10.') ||
            hostname.startsWith('172.')
        ) {
            return `${protocol}//${hostname}:5000/api`;
        }

        // Production: relative endpoint (works on any domain)
        return '/api';
    })();

    const DEFAULT_HEADERS = {
        'Content-Type': 'application/json',
    };

    // ─── Core Request Method ────────────────────────────
    async function request(method, endpoint, body = null, options = {}) {
        const url = `${API_BASE}${endpoint}`;
        const config = {
            method,
            headers: { ...DEFAULT_HEADERS },
        };

        // Add auth token if available (for admin operations)
        const token = localStorage.getItem(TOKEN_KEY);
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }

        // Handle body
        if (body !== null) {
            if (body instanceof FormData) {
                // Let browser set Content-Type with boundary for multipart
                delete config.headers['Content-Type'];
                config.body = body;
            } else {
                config.body = JSON.stringify(body);
            }
        }

        // Add timeout (longer for FormData / file uploads)
        const timeoutMs = options.timeout || (body instanceof FormData ? 90000 : 20000);
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), timeoutMs);
        config.signal = controller.signal;

        try {
            const response = await fetch(url, config);
            clearTimeout(timeout);

            // Safe parsing: check content-type before parsing JSON
            const contentType = response.headers.get('content-type') || '';
            let data = {};
            if (contentType.includes('application/json')) {
                data = await response.json().catch(() => ({}));
            } else {
                const text = await response.text();
                data = { message: text };
            }

            if (!response.ok) {
                let errorMsg = data.message || `Request failed with status ${response.status}`;
                if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
                    const errorDetails = data.errors.map(e => e.message || e.msg || (e.field ? `${e.field} is invalid` : '')).filter(Boolean).join('. ');
                    errorMsg = errorDetails || errorMsg;
                }
                const error = new Error(errorMsg);
                error.status = response.status;
                error.data = data;
                throw error;
            }

            return data;
        } catch (error) {
            clearTimeout(timeout);

            if (error.name === 'AbortError') {
                throw new Error('Request timed out — please check your internet connection.');
            }

            if (!error.status) {
                // Network error — backend unreachable
                console.warn('[EduSphereAPI] Backend unreachable:', error.message);
                throw new Error('Unable to connect to server. Please try again later.');
            }

            throw error;
        }
    }

    // ─── Public API ─────────────────────────────────────
    return {
        get: (endpoint) => request('GET', endpoint),
        post: (endpoint, body) => request('POST', endpoint, body),
        put: (endpoint, body) => request('PUT', endpoint, body),
        patch: (endpoint, body) => request('PATCH', endpoint, body),
        delete: (endpoint) => request('DELETE', endpoint),

        /** Token key — shared with admin-auth.js */
        TOKEN_KEY,

        /**
         * Submit a form to the backend API.
         * Shows loading state on the button, handles success/error UI.
         *
         * @param {HTMLFormElement} form - The form element
         * @param {string} endpoint - API endpoint (e.g., '/admissions')
         * @param {Object} options - { successMessage, fieldMap, onSuccess }
         */
        async submitForm(form, endpoint, options = {}) {
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalBtnHTML = submitBtn ? submitBtn.innerHTML : '';

            try {
                // Show loading state
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Submitting...';
                }

                // Collect form data
                const formData = new FormData(form);
                const payload = {};

                // Use field mapping if provided, otherwise use FormData keys directly
                if (options.fieldMap) {
                    for (const [formField, apiField] of Object.entries(options.fieldMap)) {
                        const value = formData.get(formField);
                        if (value !== null && value !== '') {
                            payload[apiField] = value;
                        }
                    }
                } else {
                    formData.forEach((value, key) => {
                        if (value !== '') payload[key] = value;
                    });
                }

                const result = await this.post(endpoint, payload);

                // Show success
                showFormMessage(form, options.successMessage || 'Submitted successfully!', 'success');
                form.reset();

                if (options.onSuccess) options.onSuccess(result);

                return result;
            } catch (error) {
                // Show error
                let errorMsg = error.message || 'Something went wrong. Please try again.';

                // If validation errors exist, show them
                if (error.data && error.data.errors && error.data.errors.length > 0) {
                    errorMsg = error.data.errors.map(e => e.message || e.msg).join('. ');
                }

                showFormMessage(form, errorMsg, 'error');
                throw error;
            } finally {
                // Restore button
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtnHTML;
                }
            }
        },

        /** Check if backend is reachable */
        async healthCheck() {
            try {
                const data = await this.get('/health');
                return data.data?.status === 'healthy';
            } catch {
                return false;
            }
        },

        /** Get the base URL (useful for debugging) */
        getBaseUrl: () => API_BASE,

        /** Resolve relative media/upload URLs to absolute backend URLs */
        resolveUrl(url) {
            if (!url) return '';
            // Already absolute URL (Cloudinary, CDN, data URI) - return as-is
            if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
                return url;
            }
            // Relative /uploads/... path - resolve to backend origin
            const hostname = window.location.hostname;
            const protocol = window.location.protocol;
            const isLocal = protocol === 'file:' ||
                hostname === 'localhost' ||
                hostname === '127.0.0.1' ||
                hostname.startsWith('192.168.') ||
                hostname.startsWith('10.') ||
                hostname.startsWith('172.');

            if (isLocal) {
                return `http://localhost:5000${url.startsWith('/') ? '' : '/'}${url}`;
            }
            // Production: relative URL (same origin serves both frontend and API)
            return url;
        },
    };
})();

// ─── UI Helpers ─────────────────────────────────────────
function showFormMessage(form, message, type = 'success') {
    // Remove any existing message
    const existing = form.querySelector('.form-api-message');
    if (existing) existing.remove();

    const div = document.createElement('div');
    div.className = 'form-api-message';

    const isSuccess = type === 'success';
    div.style.cssText = `
        background: ${isSuccess ? '#10B981' : '#EF4444'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        text-align: center;
        margin-top: 1rem;
        font-weight: 600;
        font-size: 0.95rem;
        animation: fadeIn 0.4s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
    `;

    const icon = isSuccess ? 'fa-circle-check' : 'fa-circle-exclamation';
    div.innerHTML = `<i class="fa-solid ${icon}"></i> ${message}`;
    form.appendChild(div);

    // Auto-remove after 6 seconds
    setTimeout(() => {
        div.style.opacity = '0';
        div.style.transition = 'opacity 0.5s ease';
        setTimeout(() => div.remove(), 500);
    }, 6000);
}

// Backward compatibility: alias old name → new name
window.EduSphereAPI = EduSphereAPI;
window.StThomasAPI = EduSphereAPI;
