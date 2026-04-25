/**
 * KrishnaDB — IndexedDB wrapper
 * Provides a Promise-based interface to a persistent client-side database.
 * Stores: users, properties, sessions, inquiries
 */

const KrishnaDB = (() => {
    const DB_NAME = 'KrishnaRealtyDB';
    const DB_VERSION = 1;
    let db = null;

    const STORES = {
        users: { keyPath: 'id', autoIncrement: true, indexes: [{ name: 'email', unique: true }] },
        properties: { keyPath: 'id', autoIncrement: true, indexes: [{ name: 'status', unique: false }, { name: 'type', unique: false }] },
        sessions: { keyPath: 'token', autoIncrement: false, indexes: [{ name: 'userId', unique: false }] },
        inquiries: { keyPath: 'id', autoIncrement: true, indexes: [{ name: 'propertyId', unique: false }] }
    };

    function open() {
        return new Promise((resolve, reject) => {
            if (db) return resolve(db);

            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = (e) => {
                const database = e.target.result;
                Object.entries(STORES).forEach(([storeName, config]) => {
                    if (!database.objectStoreNames.contains(storeName)) {
                        const store = database.createObjectStore(storeName, {
                            keyPath: config.keyPath,
                            autoIncrement: config.autoIncrement
                        });
                        config.indexes.forEach(idx => store.createIndex(idx.name, idx.name, { unique: idx.unique }));
                    }
                });
            };

            request.onsuccess = (e) => {
                db = e.target.result;
                resolve(db);
            };

            request.onerror = (e) => reject(e.target.error);
        });
    }

    function transaction(storeName, mode = 'readonly') {
        return db.transaction(storeName, mode).objectStore(storeName);
    }

    function getAll(storeName, indexName = null, query = null) {
        return open().then(() => new Promise((resolve, reject) => {
            const store = transaction(storeName, 'readonly');
            const source = indexName ? store.index(indexName) : store;
            const request = query ? source.getAll(query) : source.getAll();
            request.onsuccess = (e) => resolve(e.target.result);
            request.onerror = (e) => reject(e.target.error);
        }));
    }

    function getOne(storeName, key) {
        return open().then(() => new Promise((resolve, reject) => {
            const request = transaction(storeName, 'readonly').get(key);
            request.onsuccess = (e) => resolve(e.target.result);
            request.onerror = (e) => reject(e.target.error);
        }));
    }

    function getByIndex(storeName, indexName, value) {
        return open().then(() => new Promise((resolve, reject) => {
            const request = transaction(storeName, 'readonly').index(indexName).get(value);
            request.onsuccess = (e) => resolve(e.target.result);
            request.onerror = (e) => reject(e.target.error);
        }));
    }

    function add(storeName, data) {
        return open().then(() => new Promise((resolve, reject) => {
            const request = transaction(storeName, 'readwrite').add(data);
            request.onsuccess = (e) => resolve(e.target.result);
            request.onerror = (e) => reject(e.target.error);
        }));
    }

    function put(storeName, data) {
        return open().then(() => new Promise((resolve, reject) => {
            const request = transaction(storeName, 'readwrite').put(data);
            request.onsuccess = (e) => resolve(e.target.result);
            request.onerror = (e) => reject(e.target.error);
        }));
    }

    function remove(storeName, key) {
        return open().then(() => new Promise((resolve, reject) => {
            const request = transaction(storeName, 'readwrite').delete(key);
            request.onsuccess = () => resolve(true);
            request.onerror = (e) => reject(e.target.error);
        }));
    }

    function count(storeName) {
        return open().then(() => new Promise((resolve, reject) => {
            const request = transaction(storeName, 'readonly').count();
            request.onsuccess = (e) => resolve(e.target.result);
            request.onerror = (e) => reject(e.target.error);
        }));
    }

    return { open, getAll, getOne, getByIndex, add, put, remove, count };
})();
