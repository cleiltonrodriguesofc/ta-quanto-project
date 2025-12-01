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

    // Supermarkets Table
    db.run(`CREATE TABLE IF NOT EXISTS supermarkets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            type TEXT,
            address TEXT,
            latitude REAL,
            longitude REAL
        )`, (err) => {
      if (!err) {
        seedSupermarkets();
      }
    });
  });
}

function seedSupermarkets() {
  db.get("SELECT count(*) as count FROM supermarkets", (err, row) => {
    if (err) {
      return console.error('Error checking supermarkets count:', err.message);
    }
    if (row.count === 0) {
      console.log('Seeding supermarkets...');
      const supermarkets = [
        { name: 'Zumica Supermercado', type: 'Supermarket', address: 'Av. Davi Alves Silva, 495 – Centro' },
        { name: 'Mateus Supermercados', type: 'Supermarket', address: 'Rua Divino Espírito Santo – Vila Mansueto' },
        { name: 'Mundo Atacado (Mundô Supermercado)', type: 'Supermarket', address: 'Av. Davi Alves Silva, 820 – Colégio Agrícola' },
        { name: 'Supermercado Bom Preço', type: 'Supermarket', address: 'Rua da Paz, 72 – Vila Davi' },
        { name: 'Sacolão Econômico', type: 'Fruit Store/Sacolão', address: 'BR-222 (rodovia) – Buriticupu' },
        { name: 'Atacadão das Frutas', type: 'Fruit Store/Sacolão', address: 'BR-222, km 554, s/n – Buritizinho area' },
        { name: 'Mercado União', type: 'Small Market', address: 'Av. Davi Alves Silva, 599 – Centro' },
        { name: 'Mercadinho Jb', type: 'Small Market', address: 'Rua 244 – Terra Bela' },
        { name: 'Mercadinho Marques', type: 'Small Market', address: 'Av. 20 – Eco II' },
        { name: 'Mercadinho Menor Preço', type: 'Small Market', address: 'Rua 220 – Terra Bela' },
        { name: 'Mercadinho Mix Davi', type: 'Small Market', address: 'Rua 08 – Letra A – Vila Primo' },
        { name: 'Mercadinho Rodrigues', type: 'Small Market', address: 'Rua 21 – Armz – Terra Bela' },
        { name: 'Mercantil J. Rezende', type: 'Small Market', address: 'Zona Rural – Buriticupu' },
        { name: 'Mercantil Mateuzin', type: 'Small Market', address: 'Av. 343 – Centro' },
        { name: 'Mercantil Oliveira', type: 'Small Market', address: 'Rua 537 – Armz – Centro' },
        { name: 'Mercearia Moraes', type: 'Small Market', address: 'Rua 14 – Vila Cajueiro' },
        { name: 'Supermercado Wonanth', type: 'Supermarket', address: 'Rua Cafeteira, 115 – Buriticupu' },
        { name: 'Depósito Vale Buriti', type: 'Supermarket', address: 'Av. Davi Alves Silva – Buriticupu' },
        { name: 'Solange M. C. Brito Supermercados', type: 'Supermarket', address: 'Rua Dom Pedro I – Centro' },
        { name: 'Comercial Johnattan', type: 'Supermarket', address: 'Av. Castelo Branco – Buriticupu' },
      ];

      const stmt = db.prepare("INSERT INTO supermarkets (name, type, address) VALUES (?, ?, ?)");
      supermarkets.forEach(s => {
        stmt.run(s.name, s.type, s.address);
      });
      stmt.finalize();
      console.log('Supermarkets seeded.');
    }
  });
}

module.exports = db;
