const db = require('./db');

db.all('SELECT * FROM products LIMIT 5', [], (err, rows) => {
    if (err) {
        console.error(err);
        return;
    }
    console.log('Sample products:', rows);
});
