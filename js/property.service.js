/**
 * PropertyService — Full CRUD backend for property listings
 * Handles: Create, Read, Update, Delete, Search/Filter, Seed data
 */

const PropertyService = (() => {

    const SEED_PROPERTIES = [
        {
            id: 1,
            title: 'Skyline Penthouse',
            location: 'New York City, NY',
            price: 4500000,
            priceFormatted: '$4,500,000',
            beds: 4,
            baths: 4.5,
            area: '3,20000 sq.ft',
            type: 'Penthouse',
            intent: 'sell',
            status: 'Active',
            description: 'Breathtaking 360° city views, floor-to-ceiling windows, private rooftop terrace.',
            image: 'assets/images/property1.png',
            submittedBy: 'system',
            ownerName: 'Krishna Realty',
            ownerPhone: '+1 (800) KRISHNA',
            createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
            views: 1240
        },
        {
            id: 2,
            title: 'Beverly Hills Villa',
            location: 'Los Angeles, CA',
            price: 8200000,
            priceFormatted: '$8,200,000',
            beds: 6,
            baths: 7,
            area: '8,500 sq.ft',
            type: 'Villa',
            intent: 'sell',
            status: 'Active',
            description: 'A sprawling estate with infinity pool, home cinema, and lush gardens.',
            image: 'assets/images/property1.png',
            submittedBy: 'system',
            ownerName: 'Krishna Realty',
            ownerPhone: '+1 (800) KRISHNA',
            createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
            views: 987
        },
        {
            id: 3,
            title: 'Modern Waterfront Estate',
            location: 'Miami, FL',
            price: 12500000,
            priceFormatted: '$12,500,000',
            beds: 5,
            baths: 6,
            area: '6,800 sq.ft',
            type: 'Estate',
            intent: 'sell',
            status: 'Pending',
            description: 'Private dock, ocean views, smart home technology, chef\'s kitchen.',
            image: 'assets/images/property1.png',
            submittedBy: 'system',
            ownerName: 'Krishna Realty',
            ownerPhone: '+1 (800) KRISHNA',
            createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
            views: 2103
        },
        {
            id: 4,
            title: 'Downtown Loft',
            location: 'Chicago, IL',
            price: 1200000,
            priceFormatted: '$1,200,000',
            beds: 2,
            baths: 2,
            area: '1,800 sq.ft',
            type: 'Apartment',
            intent: 'sell',
            status: 'Active',
            description: 'Industrial chic loft with exposed brick, soaring ceilings, and city views.',
            image: 'assets/images/property1.png',
            submittedBy: 'system',
            ownerName: 'Krishna Realty',
            ownerPhone: '+1 (800) KRISHNA',
            createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
            views: 456
        }
    ];

    const SEED_KEY = 'kr_seeded_v1';

    // --- Seed default data (run once) ---
    async function seedIfEmpty() {
        if (localStorage.getItem(SEED_KEY)) return;
        const existing = await KrishnaDB.count('properties');
        if (existing === 0) {
            for (const prop of SEED_PROPERTIES) {
                await KrishnaDB.put('properties', prop);
            }
        }
        localStorage.setItem(SEED_KEY, '1');
    }

    // --- Create Property ---
    async function createProperty(data, user = null) {
        const price = parseFloat(data.price) || 0;
        const property = {
            title: data.title || `${data.type} in ${data.location}`,
            location: data.location,
            price: price,
            priceFormatted: formatPrice(price),
            beds: parseInt(data.beds) || 0,
            baths: parseInt(data.baths) || 0,
            area: data.area ? `${data.area} sq.ft` : 'N/A',
            type: data.type,
            intent: data.intent,
            status: data.status || 'Pending',
            description: data.description || '',
            image: data.image || 'assets/images/property1.png',
            submittedBy: user ? user.id : 'guest',
            ownerName: data.ownerName || 'Unnamed',
            ownerPhone: data.ownerPhone || 'N/A',
            createdAt: new Date().toISOString(),
            views: 0
        };

        const id = await KrishnaDB.add('properties', property);
        return { ...property, id };
    }

    // --- Get All Properties (with filters) ---
    async function getProperties(filters = {}) {
        let properties = await KrishnaDB.getAll('properties');

        if (filters.intent) {
            properties = properties.filter(p => p.intent === filters.intent);
        }
        if (filters.type) {
            properties = properties.filter(p => p.type.toLowerCase() === filters.type.toLowerCase());
        }
        if (filters.status) {
            properties = properties.filter(p => p.status === filters.status);
        }
        if (filters.location) {
            properties = properties.filter(p =>
                p.location.toLowerCase().includes(filters.location.toLowerCase())
            );
        }
        if (filters.minPrice) {
            properties = properties.filter(p => p.price >= filters.minPrice);
        }
        if (filters.maxPrice) {
            properties = properties.filter(p => p.price <= filters.maxPrice);
        }
        if (filters.search) {
            const q = filters.search.toLowerCase();
            properties = properties.filter(p =>
                p.title.toLowerCase().includes(q) ||
                p.location.toLowerCase().includes(q) ||
                p.type.toLowerCase().includes(q)
            );
        }

        // Sort: newest first by default
        properties.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        return properties;
    }

    // --- Get Single Property ---
    async function getProperty(id) {
        const prop = await KrishnaDB.getOne('properties', id);
        if (prop) {
            // Increment view count
            await KrishnaDB.put('properties', { ...prop, views: (prop.views || 0) + 1 });
        }
        return prop;
    }

    // --- Get Single Property (no view increment) ---
    async function getPropertyRaw(id) {
        return await KrishnaDB.getOne('properties', id);
    }

    // --- Update Property ---
    async function updateProperty(id, updates) {
        const existing = await KrishnaDB.getOne('properties', id);
        if (!existing) throw new Error('Property not found.');

        const updated = { ...existing, ...updates, id, updatedAt: new Date().toISOString() };
        if (updates.price) {
            updated.priceFormatted = formatPrice(parseFloat(updates.price));
        }
        await KrishnaDB.put('properties', updated);
        return updated;
    }

    // --- Delete Property ---
    async function deleteProperty(id) {
        await KrishnaDB.remove('properties', id);
        return true;
    }

    // --- Update Status (admin action) ---
    async function updateStatus(id, status) {
        return await updateProperty(id, { status });
    }

    // --- Get Stats ---
    async function getStats() {
        const all = await KrishnaDB.getAll('properties');
        const users = await KrishnaDB.count('users');
        const inquiries = await KrishnaDB.count('inquiries');

        return {
            total: all.length,
            active: all.filter(p => p.status === 'Active').length,
            pending: all.filter(p => p.status === 'Pending').length,
            sold: all.filter(p => p.status === 'Sold').length,
            totalViews: all.reduce((s, p) => s + (p.views || 0), 0),
            users,
            inquiries
        };
    }

    // --- Submit Inquiry ---
    async function submitInquiry({ propertyId, name, email, phone, message }) {
        return await KrishnaDB.add('inquiries', {
            propertyId,
            name,
            email,
            phone,
            message,
            createdAt: new Date().toISOString(),
            read: false
        });
    }

    function formatPrice(price) {
        if (price >= 1000000) return `$${(price / 1000000).toFixed(2)}M`;
        if (price >= 1000) return `$${(price / 1000).toFixed(0)}K`;
        return `$${price.toLocaleString()}`;
    }

    return {
        seedIfEmpty,
        createProperty,
        getProperties,
        getProperty,
        getPropertyRaw,
        updateProperty,
        deleteProperty,
        updateStatus,
        getStats,
        submitInquiry,
        formatPrice
    };
})();
