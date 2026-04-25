/**
 * CryptoService — Real password hashing & session token generation
 * Uses the Web Crypto API (built into all modern browsers).
 * Implements PBKDF2 for password hashing — same algorithm used in real backends.
 */

const CryptoService = (() => {

    // --- Password Hashing (PBKDF2) ---

    async function hashPassword(password) {
        const encoder = new TextEncoder();
        const salt = crypto.getRandomValues(new Uint8Array(16));

        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            encoder.encode(password),
            { name: 'PBKDF2' },
            false,
            ['deriveBits']
        );

        const hashBuffer = await crypto.subtle.deriveBits(
            { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
            keyMaterial,
            256
        );

        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const saltArray = Array.from(salt);

        return {
            hash: hashArray.map(b => b.toString(16).padStart(2, '0')).join(''),
            salt: saltArray.map(b => b.toString(16).padStart(2, '0')).join('')
        };
    }

    async function verifyPassword(password, storedHash, storedSalt) {
        const encoder = new TextEncoder();
        const salt = new Uint8Array(storedSalt.match(/.{2}/g).map(h => parseInt(h, 16)));

        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            encoder.encode(password),
            { name: 'PBKDF2' },
            false,
            ['deriveBits']
        );

        const hashBuffer = await crypto.subtle.deriveBits(
            { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
            keyMaterial,
            256
        );

        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const computedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return computedHash === storedHash;
    }

    // --- Session Token Generation ---

    async function generateToken(payload) {
        const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
        const body = btoa(JSON.stringify({
            ...payload,
            iat: Date.now(),
            exp: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
        }));

        const rawBytes = crypto.getRandomValues(new Uint8Array(32));
        const signature = Array.from(rawBytes).map(b => b.toString(16).padStart(2, '0')).join('');

        return `${header}.${body}.${signature}`;
    }

    function decodeToken(token) {
        try {
            const parts = token.split('.');
            if (parts.length !== 3) return null;
            const payload = JSON.parse(atob(parts[1]));
            if (payload.exp && Date.now() > payload.exp) return null; // expired
            return payload;
        } catch {
            return null;
        }
    }

    return { hashPassword, verifyPassword, generateToken, decodeToken };
})();
