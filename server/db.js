const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'taquanto.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        initializeTables();
    }
});

function initializeTables() {
    db.serialize(() => {
        // Prices Table
        db.run(`CREATE TABLE IF NOT EXISTS prices (
      id TEXT PRIMARY KEY,
      userId TEXT,
      productName TEXT NOT NULL,
      price REAL NOT NULL,
      supermarket TEXT NOT NULL,
      quantity TEXT,
      timestamp TEXT NOT NULL,
      barcode TEXT,
      brand TEXT,
      imageUrl TEXT,
      latitude REAL,
      longitude REAL,
      address TEXT
    )`);

        // Users Table
        db.run(`CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      displayName TEXT NOT NULL,
      avatarId TEXT NOT NULL,
      joinedDate TEXT NOT NULL,
      pricesShared INTEGER DEFAULT 0,
      totalSavings REAL DEFAULT 0
    )`);

        // Products Table (Cache)
        db.run(`CREATE TABLE IF NOT EXISTS products (
      barcode TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      brand TEXT,
      imageUrl TEXT,
      createdAt TEXT NOT NULL
    )`);
    });
}

module.exports = db;
