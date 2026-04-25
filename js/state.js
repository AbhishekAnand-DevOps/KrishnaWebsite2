/**
 * Application State — Runtime state only (persistent data lives in IndexedDB)
 */
const state = {
    theme: localStorage.getItem('theme') || 'light',
    currentView: 'view-main',
    currentUser: null,       // Populated after auth check
    isAdmin: false,
    properties: [],          // Loaded from DB
    adminProperties: [],     // Admin view (all properties)
    searchFilters: {}
};
