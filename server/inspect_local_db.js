const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'taquanto.db');
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY);

db.all("SELECT * FROM prices LIMIT 5", (err, rows) => {
    if (err) {
        console.error(err);
        return;
    }
    console.log('Sample content from local DB (prices):');
    rows.forEach(r => console.log(`ID: ${r.id} (Type: ${typeof r.id}), Product: ${r.productName}`));
});

db.all("SELECT count(*) as count FROM prices", (err, rows) => {
    if (err) console.error(err);
    else console.log('Total local prices:', rows[0].count);
});

db.close();
