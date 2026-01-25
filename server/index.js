const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// --- PRICES ---

// Get prices (optional filter by barcode)
app.get('/prices', (req, res) => {
    const { barcode } = req.query;
    let query = 'SELECT * FROM prices';
    const params = [];

    if (barcode) {
        query += ' WHERE barcode = ?';
        params.push(barcode);
    }

    query += ' ORDER BY timestamp DESC';

    db.all(query, params, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        // Format location object back
        const formattedRows = rows.map(row => {
            const { latitude, longitude, address, ...rest } = row;
            const entry = { ...rest };
            if (latitude !== null && longitude !== null) {
                entry.location = { latitude, longitude, address };
            }
            return entry;
        });
        res.json(formattedRows);
    });
});

// Add a new price
app.post('/prices', (req, res) => {
    const {
        id, userId, productName, price, supermarket, quantity,
        timestamp, barcode, brand, imageUrl, location
    } = req.body;

    const sql = `INSERT INTO prices (
    id, userId, productName, price, supermarket, quantity,
    timestamp, barcode, brand, imageUrl, latitude, longitude, address
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const params = [
        id, userId, productName, price, supermarket, quantity,
        timestamp, barcode, brand, imageUrl,
        location?.latitude || null, location?.longitude || null, location?.address || null
    ];

    db.run(sql, params, function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: 'Price added successfully', id });
    });
});

// Batch upload prices (for sync)
app.post('/prices/batch', (req, res) => {
    const prices = req.body;
    if (!Array.isArray(prices)) {
        return res.status(400).json({ error: 'Expected an array of prices' });
    }

    const sql = `INSERT OR IGNORE INTO prices (
    id, userId, productName, price, supermarket, quantity,
    timestamp, barcode, brand, imageUrl, latitude, longitude, address
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        const stmt = db.prepare(sql);

        prices.forEach(price => {
            const params = [
                price.id, price.userId, price.productName, price.price, price.supermarket, price.quantity,
                price.timestamp, price.barcode, price.brand, price.imageUrl,
                price.location?.latitude || null, price.location?.longitude || null, price.location?.address || null
            ];
            stmt.run(params);
        });

        stmt.finalize();
        db.run('COMMIT', (err) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ message: `Batch upload processed. ${prices.length} items processed.` });
        });
    });
});

// --- USERS ---

// Get user profile
app.get('/users/:id', (req, res) => {
    const { id } = req.params;
    db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (!row) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        // Format stats object back
        const { pricesShared, totalSavings, ...rest } = row;
        const user = {
            ...rest,
            stats: { pricesShared, totalSavings }
        };
        res.json(user);
    });
});

// Save/Update user profile
app.post('/users', (req, res) => {
    const { id, displayName, avatarId, joinedDate, stats } = req.body;

    const sql = `INSERT OR REPLACE INTO users (
    id, displayName, avatarId, joinedDate, pricesShared, totalSavings
  ) VALUES (?, ?, ?, ?, ?, ?)`;

    const params = [
        id, displayName, avatarId, joinedDate,
        stats?.pricesShared || 0, stats?.totalSavings || 0
    ];

    db.run(sql, params, function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: 'User profile saved successfully' });
    });
});

// --- PRODUCTS (CACHE) ---

// Get product by barcode
app.get('/products/:barcode', (req, res) => {
    const { barcode } = req.params;
    db.get('SELECT * FROM products WHERE barcode = ?', [barcode], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (!row) {
            res.status(404).json({ error: 'Product not found' });
            return;
        }
        res.json(row);
    });
});

// Add/Update product
app.post('/products', (req, res) => {
    const { barcode, name, brand, imageUrl } = req.body;
    const createdAt = new Date().toISOString();

    const sql = `INSERT OR REPLACE INTO products (
    barcode, name, brand, imageUrl, createdAt
  ) VALUES (?, ?, ?, ?, ?)`;

    const params = [barcode, name, brand, imageUrl, createdAt];

    db.run(sql, params, function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: 'Product saved successfully' });
    });
});

// --- SUPERMARKETS ---

// Get all supermarkets
app.get('/supermarkets', (req, res) => {
    db.all('SELECT * FROM supermarkets ORDER BY name ASC', [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Add a new supermarket
app.post('/supermarkets', (req, res) => {
    const { name, type, address, latitude, longitude } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'Name is required' });
    }

    const sql = `INSERT INTO supermarkets (name, type, address, latitude, longitude) VALUES (?, ?, ?, ?, ?)`;
    const params = [name, type || 'Supermarket', address || '', latitude || null, longitude || null];

    db.run(sql, params, function (err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(409).json({ error: 'Supermarket already exists' });
            }
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({
            id: this.lastID,
            name,
            type: type || 'Supermarket',
            address: address || '',
            latitude: latitude || null,
            longitude: longitude || null
        });
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('[DEBUG] Server started, Database connected');
});
