/**
 * AuthService — User & Admin authentication backend
 * Handles: Register, Login, Logout, Session validation
 * All data persisted in IndexedDB via KrishnaDB
 */

const AuthService = (() => {

    const ADMIN_CREDENTIALS = {
        username: 'admin',
        password: 'Krishna@2026'  // Change this in production
    };

    const SESSION_KEY = 'kr_session_token';
    const ADMIN_SESSION_KEY = 'kr_admin_session';

    // --- User Registration ---
    async function registerUser({ name, email, password }) {
        // Check if email already exists
        const existing = await KrishnaDB.getByIndex('users', 'email', email);
        if (existing) {
            throw new Error('An account with this email already exists.');
        }

        const { hash, salt } = await CryptoService.hashPassword(password);

        const userId = await KrishnaDB.add('users', {
            name,
            email,
            passwordHash: hash,
            passwordSalt: salt,
            role: 'user',
            createdAt: new Date().toISOString(),
            avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`
        });

        // Auto-login after registration
        return await loginUser({ email, password });
    }

    // --- User Login ---
    async function loginUser({ email, password }) {
        const user = await KrishnaDB.getByIndex('users', 'email', email);
        if (!user) throw new Error('No account found with this email.');

        const isValid = await CryptoService.verifyPassword(password, user.passwordHash, user.passwordSalt);
        if (!isValid) throw new Error('Incorrect password. Please try again.');

        const token = await CryptoService.generateToken({ userId: user.id, email: user.email, role: 'user' });

        // Persist session
        await KrishnaDB.put('sessions', {
            token,
            userId: user.id,
            createdAt: new Date().toISOString()
        });

        localStorage.setItem(SESSION_KEY, token);

        return {
            user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar },
            token
        };
    }

    // --- User Logout ---
    async function logoutUser() {
        const token = localStorage.getItem(SESSION_KEY);
        if (token) {
            await KrishnaDB.remove('sessions', token).catch(() => {});
            localStorage.removeItem(SESSION_KEY);
        }
    }

    // --- Admin Login ---
    async function loginAdmin({ username, password }) {
        if (username !== ADMIN_CREDENTIALS.username || password !== ADMIN_CREDENTIALS.password) {
            throw new Error('Invalid admin credentials.');
        }

        const token = await CryptoService.generateToken({ role: 'admin', username });
        localStorage.setItem(ADMIN_SESSION_KEY, token);
        return token;
    }

    // --- Admin Logout ---
    function logoutAdmin() {
        localStorage.removeItem(ADMIN_SESSION_KEY);
    }

    // --- Session Validation ---
    async function getCurrentUser() {
        const token = localStorage.getItem(SESSION_KEY);
        if (!token) return null;

        const payload = CryptoService.decodeToken(token);
        if (!payload) {
            localStorage.removeItem(SESSION_KEY);
            return null;
        }

        const user = await KrishnaDB.getOne('users', payload.userId);
        if (!user) return null;

        return { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar };
    }

    function isAdminLoggedIn() {
        const token = localStorage.getItem(ADMIN_SESSION_KEY);
        if (!token) return false;
        const payload = CryptoService.decodeToken(token);
        return payload && payload.role === 'admin';
    }

    async function isUserLoggedIn() {
        const user = await getCurrentUser();
        return !!user;
    }

    return {
        registerUser,
        loginUser,
        logoutUser,
        loginAdmin,
        logoutAdmin,
        getCurrentUser,
        isAdminLoggedIn,
        isUserLoggedIn
    };
})();
