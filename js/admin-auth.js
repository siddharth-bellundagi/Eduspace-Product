/**
 * admin-auth.js — Native Admin Login/Logout System
 *
 * Handles:
 *   1. Direct REST JWT authentication (email/password)
 *   2. Login modal UI (injected into DOM)
 *   3. Session management (JWT token stored in localStorage)
 *   4. Admin state in the top bar across all pages
 *
 * Zero external Firebase dependencies.
 */

const AdminAuth = (() => {
    let currentUser = null;

    // ─── Login Modal HTML ─────────────────────────────
    function createLoginModal() {
        if (document.getElementById('adminLoginModal')) return;

        const modal = document.createElement('div');
        modal.id = 'adminLoginModal';
        modal.className = 'admin-modal-overlay';
        modal.innerHTML = `
            <div class="admin-modal">
                <button class="admin-modal-close" id="adminModalClose" aria-label="Close">
                    <i class="fa-solid fa-xmark"></i>
                </button>
                <div class="admin-modal-header">
                    <div class="admin-modal-icon">
                        <i class="fa-solid fa-user-shield"></i>
                    </div>
                    <h2>Admin Login</h2>
                    <p>${window.SCHOOL_CONFIG?.name || 'School'} — Management Portal</p>
                </div>
                <form id="adminLoginForm" class="admin-login-form">
                    <div class="admin-form-group">
                        <label for="adminEmail">
                            <i class="fa-solid fa-envelope"></i> Email Address
                        </label>
                        <input type="email" id="adminEmail" name="email" 
                               placeholder="Enter admin email address" 
                               required autocomplete="email">
                    </div>
                    <div class="admin-form-group">
                        <label for="adminPassword">
                            <i class="fa-solid fa-lock"></i> Password
                        </label>
                        <div class="admin-password-wrapper">
                            <input type="password" id="adminPassword" name="password" 
                                   placeholder="Enter your password" 
                                   required autocomplete="current-password">
                            <button type="button" class="admin-password-toggle" id="adminPasswordToggle" aria-label="Toggle password visibility">
                                <i class="fa-solid fa-eye"></i>
                            </button>
                        </div>
                    </div>
                    <div id="adminLoginError" class="admin-login-error" style="display:none;"></div>
                    <button type="submit" class="admin-login-submit" id="adminLoginSubmit">
                        <i class="fa-solid fa-right-to-bracket"></i> Sign In
                    </button>
                </form>
                <div class="admin-modal-footer">
                    <p><i class="fa-solid fa-shield-halved"></i> ${window.SCHOOL_CONFIG?.name || 'School'} Administrative Portal</p>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        bindModalEvents();
    }

    // ─── Modal Event Handlers ─────────────────────────
    function bindModalEvents() {
        const modal = document.getElementById('adminLoginModal');
        const closeBtn = document.getElementById('adminModalClose');
        const form = document.getElementById('adminLoginForm');
        const passwordToggle = document.getElementById('adminPasswordToggle');

        // Close on X button
        closeBtn.addEventListener('click', hideModal);

        // Close on overlay click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) hideModal();
        });

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('active')) {
                hideModal();
            }
        });

        // Password visibility toggle
        passwordToggle.addEventListener('click', () => {
            const input = document.getElementById('adminPassword');
            const icon = passwordToggle.querySelector('i');
            if (input.type === 'password') {
                input.type = 'text';
                icon.className = 'fa-solid fa-eye-slash';
            } else {
                input.type = 'password';
                icon.className = 'fa-solid fa-eye';
            }
        });

        // Form submission
        form.addEventListener('submit', handleLogin);
    }

    // ─── Show/Hide Modal ──────────────────────────────
    function showModal() {
        createLoginModal();
        const modal = document.getElementById('adminLoginModal');
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        setTimeout(() => {
            document.getElementById('adminEmail')?.focus();
        }, 300);
    }

    function hideModal() {
        const modal = document.getElementById('adminLoginModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
            const form = document.getElementById('adminLoginForm');
            if (form) form.reset();
            clearError();
        }
    }

    // ─── Error Display ────────────────────────────────
    function showError(message) {
        const errorDiv = document.getElementById('adminLoginError');
        if (errorDiv) {
            errorDiv.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> ${message}`;
            errorDiv.style.display = 'flex';
        }
    }

    function clearError() {
        const errorDiv = document.getElementById('adminLoginError');
        if (errorDiv) {
            errorDiv.style.display = 'none';
            errorDiv.textContent = '';
        }
    }

    // ─── Direct Native JWT Login Handler ──────────────
    async function handleLogin(e) {
        e.preventDefault();
        clearError();

        const email = document.getElementById('adminEmail').value.trim();
        const password = document.getElementById('adminPassword').value;
        const submitBtn = document.getElementById('adminLoginSubmit');

        if (!email || !password) {
            showError('Please enter both email and password');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Signing in...';

        try {
            // Direct REST API Call
            const response = await EduSphereAPI.post('/auth/login', { email, password });

            if (response.data && response.data.token) {
                const token = response.data.token;
                const user = response.data.user || response.data;

                // Save session in localStorage (persists across page refreshes)
                localStorage.setItem('edusphere_admin_token', token);
                localStorage.setItem('edusphere_admin_user', JSON.stringify({
                    id: user.id || user.uid,
                    email: user.email,
                    displayName: user.name || user.displayName || 'School Admin',
                    isAdmin: true,
                }));

                currentUser = user;
                hideModal();
                updateTopBar(true);
                showToast('Welcome, ' + (user.name || user.displayName || 'Admin') + '!', 'success');

                // If currently on admin.html, refresh dashboard
                if (window.location.pathname.endsWith('admin.html') && window.AdminDashboard) {
                    window.location.reload();
                }
            } else {
                showError('Invalid login response from server');
            }
        } catch (error) {
            console.error('[AdminAuth] Login error:', error);
            showError(error.message || 'Invalid email or password. Please try again.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Sign In';
        }
    }

    // ─── Logout Handler ───────────────────────────────
    function handleLogout() {
        localStorage.removeItem('edusphere_admin_token');
        localStorage.removeItem('edusphere_admin_user');
        currentUser = null;
        updateTopBar(false);
        showToast('Logged out successfully', 'info');

        if (window.location.pathname.endsWith('admin.html')) {
            window.location.href = 'index.html';
        }
    }

    // ─── Top Bar UI Update ────────────────────────────
    function updateTopBar(isLoggedIn) {
        const loginBtns = document.querySelectorAll('.admin-login-btn');

        loginBtns.forEach(btn => {
            const oldQuickLogout = btn.parentElement?.querySelector('#quickLogoutBtn');
            if (oldQuickLogout) oldQuickLogout.remove();

            if (isLoggedIn && currentUser) {
                const displayName = currentUser.displayName || currentUser.name || currentUser.email?.split('@')[0] || 'Admin';
                btn.innerHTML = `<i class="fa-solid fa-gauge-high"></i> ${displayName}`;
                btn.classList.add('admin-logged-in');
                btn.href = 'admin.html';
                btn.title = 'Open Admin Dashboard';

                const newBtn = btn.cloneNode(true);
                btn.parentNode.replaceChild(newBtn, btn);

                newBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    window.location.href = 'admin.html';
                });

                // Quick Logout button
                const logoutBtn = document.createElement('button');
                logoutBtn.id = 'quickLogoutBtn';
                logoutBtn.title = 'Sign Out';
                logoutBtn.style.cssText = 'color: #ffffff; background: #dc2626; border: none; padding: 4px 8px; border-radius: 6px; cursor: pointer; margin-left: 6px; font-size: 0.75rem; transition: background 0.2s; display: inline-flex; align-items: center; justify-content: center;';
                logoutBtn.innerHTML = '<i class="fa-solid fa-right-from-bracket"></i>';
                logoutBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleLogout();
                });
                newBtn.parentNode.insertBefore(logoutBtn, newBtn.nextSibling);

            } else {
                btn.innerHTML = '<i class="fa-solid fa-user-lock"></i> Admin Login';
                btn.classList.remove('admin-logged-in');
                btn.href = '#';

                const newBtn = btn.cloneNode(true);
                btn.parentNode.replaceChild(newBtn, btn);

                newBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    showModal();
                });
            }
        });
    }

    // ─── Dropdown Menu ────────────────────────────────
    function toggleAdminDropdown(btn) {
        const existing = document.querySelector('.admin-dropdown-menu');
        if (existing) {
            existing.remove();
            return;
        }

        const dropdown = document.createElement('div');
        dropdown.className = 'admin-dropdown-menu';
        dropdown.innerHTML = `
            <div class="admin-dropdown-item admin-dropdown-info">
                <i class="fa-solid fa-circle-user"></i>
                <div>
                    <strong>${currentUser?.displayName || currentUser?.name || 'Admin'}</strong>
                    <small>${currentUser?.email || ''}</small>
                </div>
            </div>
            <div class="admin-dropdown-divider"></div>
            <a href="admin.html" class="admin-dropdown-item">
                <i class="fa-solid fa-gauge-high"></i> Admin Dashboard
            </a>
            <div class="admin-dropdown-divider"></div>
            <button class="admin-dropdown-item admin-dropdown-logout" id="adminLogoutBtn">
                <i class="fa-solid fa-right-from-bracket"></i> Sign Out
            </button>
        `;

        btn.parentElement.style.position = 'relative';
        btn.parentElement.appendChild(dropdown);

        requestAnimationFrame(() => dropdown.classList.add('active'));

        document.getElementById('adminLogoutBtn').addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.remove();
            handleLogout();
        });

        const closeDropdown = (e) => {
            if (!dropdown.contains(e.target) && e.target !== btn) {
                dropdown.remove();
                document.removeEventListener('click', closeDropdown);
            }
        };
        setTimeout(() => document.addEventListener('click', closeDropdown), 10);
    }

    // ─── Toast Notification ───────────────────────────
    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `admin-toast admin-toast-${type}`;
        const icon = type === 'success' ? 'fa-circle-check' : 'fa-circle-info';
        toast.innerHTML = `<i class="fa-solid ${icon}"></i> ${message}`;
        document.body.appendChild(toast);

        requestAnimationFrame(() => toast.classList.add('active'));

        setTimeout(() => {
            toast.classList.remove('active');
            setTimeout(() => toast.remove(), 400);
        }, 3000);
    }

    // ─── Session Restore ──────────────────────────────
    function checkExistingSession() {
        const token = localStorage.getItem('edusphere_admin_token');
        const userData = localStorage.getItem('edusphere_admin_user');

        if (token && userData) {
            try {
                currentUser = JSON.parse(userData);
                updateTopBar(true);
            } catch {
                localStorage.removeItem('edusphere_admin_token');
                localStorage.removeItem('edusphere_admin_user');
            }
        }
    }

    // ─── Initialize ───────────────────────────────────
    function init() {
        checkExistingSession();

        document.querySelectorAll('.admin-login-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                if (currentUser) {
                    toggleAdminDropdown(btn);
                } else {
                    showModal();
                }
            });
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    return {
        login: showModal,
        logout: handleLogout,
        isLoggedIn: () => !!currentUser,
        getUser: () => currentUser,
        getToken: () => localStorage.getItem('edusphere_admin_token'),
    };
})();

window.AdminAuth = AdminAuth;
