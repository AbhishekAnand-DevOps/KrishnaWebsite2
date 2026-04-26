/**
 * app.js — Main application controller
 * Wires together the backend services (AuthService, PropertyService)
 * with the UI views and components.
 */

document.addEventListener('DOMContentLoaded', async () => {

    // ─────────────────────────────────────────────
    // DOM REFERENCES
    // ─────────────────────────────────────────────
    const htmlElement = document.documentElement;
    const views = document.querySelectorAll('.view');

    const themeToggle = document.getElementById('theme-toggle');
    const adminThemeToggle = document.getElementById('admin-theme-toggle');
    const btnUserLogin = document.getElementById('btn-user-login');
    const btnPostProperty = document.getElementById('btn-post-property');
    const btnCtaPost = document.getElementById('btn-cta-post');
    const adminTrigger = document.getElementById('admin-trigger');
    const btnUserReturn = document.getElementById('btn-user-return');
    const btnAdminReturn = document.getElementById('btn-admin-return');
    const btnAdminLogout = document.getElementById('btn-admin-logout');
    const btnRegisterReturn = document.getElementById('btn-register-return');
    const linkCreateAccount = document.getElementById('link-create-account');
    const linkLoginAccount = document.getElementById('link-login-account');

    const modalPost = document.getElementById('modal-post-property');
    const btnCloseModal = document.getElementById('btn-close-modal');
    const modalOverlay = document.getElementById('modal-overlay-post');
    const formPostProperty = document.getElementById('form-post-property');

    const modalEdit = document.getElementById('modal-edit-property');
    const btnCloseEditModal = document.getElementById('btn-close-edit-modal');
    const modalOverlayEdit = document.getElementById('modal-overlay-edit');
    const formEditProperty = document.getElementById('form-edit-property');

    const formUserLogin = document.getElementById('form-user-login');
    const formUserRegister = document.getElementById('form-user-register');
    const formAdminLogin = document.getElementById('form-admin-login');
    const adminError = document.getElementById('admin-error');

    const propertiesGrid = document.getElementById('properties-grid');
    const adminTableBody = document.getElementById('admin-table-body');
    const adminStats = document.querySelectorAll('.stat-value');

    const hasAdminViews = document.getElementById('view-admin-login') && document.getElementById('view-admin-dashboard');

    if (!hasAdminViews) {
        if (themeToggle) {
            htmlElement.setAttribute('data-theme', state.theme);
            themeToggle.addEventListener('click', () => {
                state.theme = state.theme === 'light' ? 'dark' : 'light';
                htmlElement.setAttribute('data-theme', state.theme);
                localStorage.setItem('theme', state.theme);
            });
        }

        if (adminTrigger) {
            adminTrigger.addEventListener('click', () => {
                window.location.href = 'index.html#admin';
            });
        }

        return;
    }

    // ─────────────────────────────────────────────
    // BOOT — Initialize DB, seed data, restore session
    // ─────────────────────────────────────────────
    await KrishnaDB.open();
    await PropertyService.seedIfEmpty();
    await restoreSession();
    initTheme();
    await loadMainProperties();
    await refreshAdminDashboard();

    if (window.location.hash === '#admin') {
        switchView(state.isAdmin ? 'view-admin-dashboard' : 'view-admin-login');
        history.replaceState(null, '', window.location.pathname);
    }

    // ─────────────────────────────────────────────
    // VIEW ROUTING
    // ─────────────────────────────────────────────
    function switchView(viewId) {
        views.forEach(view => {
            view.classList.remove('active');
            setTimeout(() => {
                if (!view.classList.contains('active')) view.classList.add('hidden');
            }, 400);
        });

        const target = document.getElementById(viewId);
        target.classList.remove('hidden');
        setTimeout(() => target.classList.add('active'), 10);
        state.currentView = viewId;
        window.scrollTo(0, 0);
    }

    // ─────────────────────────────────────────────
    // THEME
    // ─────────────────────────────────────────────
    function initTheme() {
        htmlElement.setAttribute('data-theme', state.theme);
    }

    function toggleTheme() {
        state.theme = state.theme === 'light' ? 'dark' : 'light';
        htmlElement.setAttribute('data-theme', state.theme);
        localStorage.setItem('theme', state.theme);
    }

    themeToggle.addEventListener('click', toggleTheme);
    adminThemeToggle.addEventListener('click', toggleTheme);

    // ─────────────────────────────────────────────
    // SESSION RESTORE
    // ─────────────────────────────────────────────
    async function restoreSession() {
        state.currentUser = await AuthService.getCurrentUser();
        state.isAdmin = AuthService.isAdminLoggedIn();
        updateNavForUser();
    }

    function updateNavForUser() {
        const user = state.currentUser;
        if (user) {
            btnUserLogin.textContent = user.name.split(' ')[0];
            btnUserLogin.title = `Logged in as ${user.email}`;
        } else {
            btnUserLogin.textContent = 'Log In';
            btnUserLogin.title = '';
        }
    }

    // ─────────────────────────────────────────────
    // PROPERTY RENDERING (Main View)
    // ─────────────────────────────────────────────
    async function loadMainProperties(filters = {}) {
        propertiesGrid.innerHTML = `<div class="loading-spinner"></div>`;
        const props = await PropertyService.getProperties({ ...filters, status: 'Active' });
        state.properties = props;
        renderProperties(props);
    }

    function renderProperties(props) {
        if (props.length === 0) {
            propertiesGrid.innerHTML = `<div class="empty-state"><p>No properties found.</p></div>`;
            return;
        }
        propertiesGrid.innerHTML = props.map(prop => {
            return `
            <div class="property-card slide-up" data-id="${prop.id}">
                <div class="property-img">
                    <img src="${prop.image}" alt="${prop.title}" onerror="this.src='assets/images/property1.png'">
                    <span class="property-badge badge-${prop.intent}">${prop.intent === 'sell' ? 'For Sale' : 'For Rent'}</span>
                </div>
                <div class="property-info">
                    <div class="property-price">${prop.priceFormatted}</div>
                    <h3 class="property-title">${prop.title}</h3>
                    <p class="text-muted" style="margin-bottom:1rem;">${prop.location}</p>
                    <div class="property-meta">
                        <span>🛏 ${prop.beds} Beds</span>
                        <span>🚿 ${prop.baths} Baths</span>
                        <span>📐 ${prop.area}</span>
                    </div>
                </div>
            </div>`;
        }).join('');
    }

    // ─────────────────────────────────────────────
    // SEARCH
    // ─────────────────────────────────────────────
    const searchInput = document.querySelector('.search-fields input[type="text"]');
    const searchSelects = document.querySelectorAll('.search-fields select');
    const searchBtn = document.querySelector('.btn-search');
    const searchTabs = document.querySelectorAll('.search-tabs .tab');

    let activeIntent = 'sell';

    searchTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            searchTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const label = tab.textContent.toLowerCase();
            activeIntent = label === 'buy' ? 'sell' : label === 'rent' ? 'rent' : null;
        });
    });

    if (searchBtn) {
        searchBtn.addEventListener('click', async () => {
            const location = searchInput ? searchInput.value.trim() : '';
            const typeSelect = searchSelects[0];
            const budgetSelect = searchSelects[1];

            const filters = {};
            if (location) filters.location = location;
            if (activeIntent) filters.intent = activeIntent;
            if (typeSelect && typeSelect.value !== 'Property Type') filters.type = typeSelect.value;

            const budgetMap = {
                '$500k - $1M': { minPrice: 500000, maxPrice: 1000000 },
                '$1M - $5M': { minPrice: 1000000, maxPrice: 5000000 },
                '$5M+': { minPrice: 5000000 }
            };
            if (budgetSelect && budgetMap[budgetSelect.value]) {
                Object.assign(filters, budgetMap[budgetSelect.value]);
            }

            await loadMainProperties(filters);
        });
    }

    // ─────────────────────────────────────────────
    // NAVIGATION
    // ─────────────────────────────────────────────
    btnUserLogin.addEventListener('click', () => {
        if (state.currentUser) {
            // If logged in: clicking name shows options
            const confirmed = confirm(`Logged in as ${state.currentUser.email}\n\nClick OK to log out.`);
            if (confirmed) {
                AuthService.logoutUser();
                state.currentUser = null;
                updateNavForUser();
                showToast('Logged out successfully.', 'info');
            }
        } else {
            switchView('view-user-login');
        }
    });

    btnUserReturn.addEventListener('click', () => switchView('view-main'));
    if (btnRegisterReturn) btnRegisterReturn.addEventListener('click', () => switchView('view-main'));
    if (linkCreateAccount) linkCreateAccount.addEventListener('click', (e) => { e.preventDefault(); switchView('view-user-register'); });
    if (linkLoginAccount) linkLoginAccount.addEventListener('click', (e) => { e.preventDefault(); switchView('view-user-login'); });

    adminTrigger.addEventListener('click', () => {
        if (state.isAdmin) {
            switchView('view-admin-dashboard');
        } else {
            switchView('view-admin-login');
        }
    });

    btnAdminReturn.addEventListener('click', () => switchView('view-main'));
    btnAdminLogout.addEventListener('click', () => {
        AuthService.logoutAdmin();
        state.isAdmin = false;
        showToast('Logged out of admin.', 'info');
        switchView('view-main');
    });

    // ─────────────────────────────────────────────
    // MODAL — Post Property
    // ─────────────────────────────────────────────
    // Uploaded image Base64 store
    let uploadedImageBase64 = null;

    const openModal = () => {
        if (!state.currentUser) {
            showToast('Please log in to post a property.', 'warning');
            switchView('view-user-login');
            return;
        }
        modalPost.classList.remove('hidden');
    };
    const closeModal = () => {
        modalPost.classList.add('hidden');
        uploadedImageBase64 = null;
        const preview = document.getElementById('upload-preview');
        const placeholder = document.getElementById('upload-placeholder');
        if (preview) { preview.innerHTML = ''; preview.style.display = 'none'; }
        if (placeholder) placeholder.style.display = 'flex';
    };

    btnPostProperty.addEventListener('click', openModal);
    btnCtaPost.addEventListener('click', openModal);
    btnCloseModal.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', closeModal);

    // ── Image Upload Logic ──
    const imageInput = document.getElementById('prop-image-input');
    const uploadBox  = document.getElementById('upload-box');
    const uploadPreview   = document.getElementById('upload-preview');
    const uploadPlaceholder = document.getElementById('upload-placeholder');

    function readFileAsBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload  = e => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    async function handleImageFiles(files) {
        if (!files || files.length === 0) return;
        const file = files[0]; // Use first image as main
        if (file.size > 5 * 1024 * 1024) {
            showToast('Image exceeds 5MB limit.', 'warning'); return;
        }
        uploadedImageBase64 = await readFileAsBase64(file);
        uploadPlaceholder.style.display = 'none';
        uploadPreview.style.display     = 'flex';
        uploadPreview.innerHTML = `
            <div class="upload-thumb-wrap">
                <img src="${uploadedImageBase64}" class="upload-thumb" alt="Preview">
                <button type="button" class="upload-remove" onclick="clearUpload()" title="Remove">✕</button>
            </div>
            <p class="upload-thumb-name">${file.name}</p>
        `;
    }

    window.clearUpload = () => {
        uploadedImageBase64 = null;
        uploadPreview.innerHTML = '';
        uploadPreview.style.display = 'none';
        uploadPlaceholder.style.display = 'flex';
        if (imageInput) imageInput.value = '';
    };

    if (imageInput) {
        imageInput.addEventListener('change', () => handleImageFiles(imageInput.files));
    }
    if (uploadBox) {
        uploadBox.addEventListener('dragover', e => { e.preventDefault(); uploadBox.classList.add('drag-over'); });
        uploadBox.addEventListener('dragleave', ()  => uploadBox.classList.remove('drag-over'));
        uploadBox.addEventListener('drop', e => {
            e.preventDefault();
            uploadBox.classList.remove('drag-over');
            handleImageFiles(e.dataTransfer.files);
        });
    }

    // ── Form Submission ──
    formPostProperty.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = formPostProperty.querySelector('[type="submit"]');
        setLoading(btn, true);

        try {
            const data = {
                intent:     document.getElementById('prop-intent').value,
                type:       document.getElementById('prop-type').value,
                title:      document.getElementById('prop-title').value.trim(),
                location:   document.getElementById('prop-location').value.trim(),
                price:      document.getElementById('prop-price').value,
                area:       document.getElementById('prop-area').value,
                beds:       document.getElementById('prop-beds').value,
                baths:      document.getElementById('prop-baths').value,
                ownerName:  document.getElementById('prop-owner-name').value.trim(),
                ownerPhone: document.getElementById('prop-owner-phone').value.trim(),
                image:      uploadedImageBase64 || 'assets/images/property1.png',
                status:     'Active'   // Immediately visible on main page
            };

            await PropertyService.createProperty(data, state.currentUser);
            closeModal();
            formPostProperty.reset();
            showToast('🏠 Property listed successfully!', 'success');
            await loadMainProperties();
            await refreshAdminDashboard();
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setLoading(btn, false);
        }
    });

    // ─────────────────────────────────────────────
    // USER AUTH FORMS
    // ─────────────────────────────────────────────

    // Login
    formUserLogin.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = formUserLogin.querySelector('[type="submit"]');
        setLoading(btn, true);
        clearFormErrors(formUserLogin);

        try {
            const email = formUserLogin.querySelector('input[type="email"]').value;
            const password = formUserLogin.querySelector('input[type="password"]').value;
            const { user } = await AuthService.loginUser({ email, password });
            state.currentUser = user;
            updateNavForUser();
            formUserLogin.reset();
            showToast(`Welcome back, ${user.name}!`, 'success');
            switchView('view-main');
        } catch (err) {
            showFormError(formUserLogin, err.message);
        } finally {
            setLoading(btn, false);
        }
    });

    // Register
    formUserRegister.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = formUserRegister.querySelector('[type="submit"]');
        setLoading(btn, true);
        clearFormErrors(formUserRegister);

        try {
            const name = formUserRegister.querySelector('input[type="text"]').value;
            const email = formUserRegister.querySelector('input[type="email"]').value;
            const password = formUserRegister.querySelector('input[type="password"]').value;

            if (password.length < 6) throw new Error('Password must be at least 6 characters.');

            const { user } = await AuthService.registerUser({ name, email, password });
            state.currentUser = user;
            updateNavForUser();
            formUserRegister.reset();
            showToast(`Welcome to Krishna Realty, ${user.name}!`, 'success');
            switchView('view-main');
        } catch (err) {
            showFormError(formUserRegister, err.message);
        } finally {
            setLoading(btn, false);
        }
    });

    // Admin Login
    formAdminLogin.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = formAdminLogin.querySelector('[type="submit"]');
        setLoading(btn, true);
        adminError.classList.add('hidden');

        try {
            const username = document.getElementById('admin-user').value;
            const password = document.getElementById('admin-pass').value;
            await AuthService.loginAdmin({ username, password });
            state.isAdmin = true;
            document.getElementById('admin-user').value = '';
            document.getElementById('admin-pass').value = '';
            await refreshAdminDashboard();
            switchView('view-admin-dashboard');
        } catch (err) {
            adminError.textContent = err.message;
            adminError.classList.remove('hidden');
        } finally {
            setLoading(btn, false);
        }
    });

    // ─────────────────────────────────────────────
    // ADMIN DASHBOARD
    // ─────────────────────────────────────────────
    async function refreshAdminDashboard() {
        const stats = await PropertyService.getStats();

        const el = (id) => document.getElementById(id);
        if (el('stat-total'))   el('stat-total').textContent   = stats.total.toLocaleString();
        if (el('stat-active'))  el('stat-active').textContent  = stats.active.toLocaleString();
        if (el('stat-pending')) el('stat-pending').textContent = stats.pending.toLocaleString();
        if (el('stat-users'))   el('stat-users').textContent   = stats.users.toLocaleString();
        if (el('stat-views'))   el('stat-views').textContent   = stats.totalViews.toLocaleString();

        const allProperties = await PropertyService.getProperties();
        state.adminProperties = allProperties;
        renderAdminTable(allProperties);
    }

    function renderAdminTable(props) {
        if (!adminTableBody) return;
        adminTableBody.innerHTML = props.map(prop => `
            <tr>
                <td><strong>PRP-${String(prop.id).padStart(3, '0')}</strong></td>
                <td>
                    <div><strong>${prop.title}</strong></div>
                    <div style="font-size:0.8rem;color:var(--text-muted)">${prop.location}</div>
                </td>
                <td>
                    <select class="status-select" data-id="${prop.id}" onchange="adminChangeStatus(${prop.id}, this.value)">
                        <option ${prop.status === 'Active' ? 'selected' : ''}>Active</option>
                        <option ${prop.status === 'Pending' ? 'selected' : ''}>Pending</option>
                        <option ${prop.status === 'Sold' ? 'selected' : ''}>Sold</option>
                    </select>
                </td>
                <td>${prop.priceFormatted}</td>
                <td style="display:flex;gap:0.5rem;flex-wrap:wrap;">
                    <button class="action-btn" onclick="openEditModal(${prop.id})" style="color:#c99855;border-color:#c99855;">✏️ Edit</button>
                    <button class="action-btn" onclick="adminDeleteProperty(${prop.id})" style="color:#ef4444;border-color:#fca5a5;">🗑 Delete</button>
                </td>
            </tr>
        `).join('');
    }

    // ─────────────────────────────────────────────
    // ADMIN TABLE SEARCH & FILTER
    // ─────────────────────────────────────────────
    const adminSearch = document.getElementById('admin-search');
    const adminStatusFilter = document.getElementById('admin-status-filter');

    function applyAdminFilters() {
        let filtered = [...state.adminProperties];
        const q = adminSearch ? adminSearch.value.trim().toLowerCase() : '';
        const status = adminStatusFilter ? adminStatusFilter.value : '';
        if (q) filtered = filtered.filter(p =>
            p.title.toLowerCase().includes(q) ||
            p.location.toLowerCase().includes(q)
        );
        if (status) filtered = filtered.filter(p => p.status === status);
        renderAdminTable(filtered);
    }

    if (adminSearch) adminSearch.addEventListener('input', applyAdminFilters);
    if (adminStatusFilter) adminStatusFilter.addEventListener('change', applyAdminFilters);

    // ─────────────────────────────────────────────
    // ADMIN ACTIONS (exposed globally for table buttons)
    // ─────────────────────────────────────────────
    window.adminChangeStatus = async (id, status) => {
        try {
            await PropertyService.updateStatus(id, status);
            showToast(`Status updated to ${status}`, 'success');
            await refreshAdminDashboard();
        } catch (err) {
            showToast(err.message, 'error');
        }
    };

    window.adminDeleteProperty = async (id) => {
        if (!confirm('Are you sure you want to delete this property?')) return;
        try {
            await PropertyService.deleteProperty(id);
            showToast('Property deleted.', 'success');
            await refreshAdminDashboard();
            await loadMainProperties();
        } catch (err) {
            showToast(err.message, 'error');
        }
    };

    // ─────────────────────────────────────────────
    // EDIT PROPERTY MODAL
    // ─────────────────────────────────────────────
    let editImageBase64 = null; // holds new image if user picks one

    const closeEditModal = () => {
        modalEdit.classList.add('hidden');
        editImageBase64 = null;
        const prev = document.getElementById('edit-upload-preview');
        const ph   = document.getElementById('edit-upload-placeholder');
        if (prev) { prev.innerHTML = ''; prev.style.display = 'none'; }
        if (ph)   ph.style.display = 'flex';
    };

    btnCloseEditModal.addEventListener('click', closeEditModal);
    modalOverlayEdit.addEventListener('click', closeEditModal);

    // Edit image upload
    const editImageInput      = document.getElementById('edit-image-input');
    const editUploadBox       = document.getElementById('edit-upload-box');
    const editUploadPreview   = document.getElementById('edit-upload-preview');
    const editUploadPH        = document.getElementById('edit-upload-placeholder');

    async function handleEditImageFiles(files) {
        if (!files || files.length === 0) return;
        const file = files[0];
        if (file.size > 5 * 1024 * 1024) { showToast('Image exceeds 5MB limit.', 'warning'); return; }
        editImageBase64 = await readFileAsBase64(file);
        editUploadPH.style.display    = 'none';
        editUploadPreview.style.display = 'flex';
        editUploadPreview.innerHTML = `
            <div class="upload-thumb-wrap">
                <img src="${editImageBase64}" class="upload-thumb" alt="Preview">
                <button type="button" class="upload-remove" onclick="clearEditUpload()" title="Remove">✕</button>
            </div>
            <p class="upload-thumb-name">${file.name}</p>`;
    }

    window.clearEditUpload = () => {
        editImageBase64 = null;
        editUploadPreview.innerHTML = '';
        editUploadPreview.style.display = 'none';
        editUploadPH.style.display = 'flex';
        if (editImageInput) editImageInput.value = '';
    };

    if (editImageInput) {
        editImageInput.addEventListener('change', () => handleEditImageFiles(editImageInput.files));
    }
    if (editUploadBox) {
        editUploadBox.addEventListener('dragover', e => { e.preventDefault(); editUploadBox.classList.add('drag-over'); });
        editUploadBox.addEventListener('dragleave', () => editUploadBox.classList.remove('drag-over'));
        editUploadBox.addEventListener('drop', e => {
            e.preventDefault(); editUploadBox.classList.remove('drag-over');
            handleEditImageFiles(e.dataTransfer.files);
        });
    }

    // Open edit modal — fetch property and pre-fill all fields
    window.openEditModal = async (id) => {
        const prop = await PropertyService.getPropertyRaw(id);
        if (!prop) { showToast('Property not found.', 'error'); return; }

        // Reset image state and show existing image as preview
        editImageBase64 = null;
        editUploadPH.style.display    = 'none';
        editUploadPreview.style.display = 'flex';
        editUploadPreview.innerHTML = `
            <div class="upload-thumb-wrap">
                <img src="${prop.image || 'assets/images/property1.png'}" class="upload-thumb" alt="Current Photo">
            </div>
            <p class="upload-thumb-name">Current photo (click box to change)</p>`;

        // Fill all fields
        document.getElementById('edit-prop-id').value     = prop.id;
        document.getElementById('edit-intent').value      = prop.intent   || 'sell';
        document.getElementById('edit-type').value        = prop.type     || 'Apartment';
        document.getElementById('edit-title').value       = prop.title    || '';
        document.getElementById('edit-location').value    = prop.location || '';
        document.getElementById('edit-description').value = prop.description || '';
        document.getElementById('edit-price').value       = prop.price    || '';
        // Strip ' sq.ft' suffix for the number input
        document.getElementById('edit-area').value        = String(prop.area || '').replace(/[^\d.]/g, '');
        document.getElementById('edit-beds').value        = prop.beds     ?? '';
        document.getElementById('edit-baths').value       = prop.baths    ?? '';
        document.getElementById('edit-owner-name').value  = prop.ownerName  || '';
        document.getElementById('edit-owner-phone').value = prop.ownerPhone || '';
        document.getElementById('edit-status').value      = prop.status   || 'Active';

        modalEdit.classList.remove('hidden');
    };

    // Save edited property
    formEditProperty.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = formEditProperty.querySelector('[type="submit"]');
        setLoading(btn, true);

        try {
            const id = parseInt(document.getElementById('edit-prop-id').value);
            const rawArea = document.getElementById('edit-area').value;

            const updates = {
                intent:      document.getElementById('edit-intent').value,
                type:        document.getElementById('edit-type').value,
                title:       document.getElementById('edit-title').value.trim(),
                location:    document.getElementById('edit-location').value.trim(),
                description: document.getElementById('edit-description').value.trim(),
                price:       parseFloat(document.getElementById('edit-price').value) || 0,
                area:        rawArea ? `${rawArea} sq.ft` : 'N/A',
                beds:        parseInt(document.getElementById('edit-beds').value)  || 0,
                baths:       parseInt(document.getElementById('edit-baths').value) || 0,
                ownerName:   document.getElementById('edit-owner-name').value.trim(),
                ownerPhone:  document.getElementById('edit-owner-phone').value.trim(),
                status:      document.getElementById('edit-status').value,
            };

            // Only update image if user picked a new one
            if (editImageBase64) updates.image = editImageBase64;

            await PropertyService.updateProperty(id, updates);
            closeEditModal();
            showToast('✅ Property updated successfully!', 'success');
            await loadMainProperties();
            await refreshAdminDashboard();
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setLoading(btn, false);
        }
    });

    // ─────────────────────────────────────────────
    // UI HELPERS
    // ─────────────────────────────────────────────

    function setLoading(btn, isLoading) {
        btn.disabled = isLoading;
        btn._origText = btn._origText || btn.textContent;
        btn.textContent = isLoading ? 'Please wait…' : btn._origText;
    }

    function showFormError(form, message) {
        let el = form.querySelector('.form-error-msg');
        if (!el) {
            el = document.createElement('p');
            el.className = 'form-error-msg error-msg';
            form.prepend(el);
        }
        el.textContent = message;
        el.style.display = 'block';
    }

    function clearFormErrors(form) {
        const el = form.querySelector('.form-error-msg');
        if (el) el.style.display = 'none';
    }

    function showToast(message, type = 'info') {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        container.appendChild(toast);

        setTimeout(() => toast.classList.add('toast-show'), 10);
        setTimeout(() => {
            toast.classList.remove('toast-show');
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    }
});
