const https = require('https');
const db = require('./db');

const SEED_URL = 'https://br.openfoodfacts.org/cgi/search.pl?search_simple=1&action=process&json=1&page_size=100';

function fetchProducts() {
    return new Promise((resolve, reject) => {
        const options = {
            headers: {
                'User-Agent': 'TaQuantoApp/1.0 (cleiltonrodriguesofc@gmail.com)'
            }
        };

        https.get(SEED_URL, options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', (err) => reject(err));
    });
}

async function seed() {
    console.log('Starting seed process...');

    try {
        const data = await fetchProducts();
        const products = data.products || [];
        console.log(`Fetched ${products.length} products from OpenFoodFacts.`);

        db.serialize(() => {
            const stmt = db.prepare(`INSERT OR REPLACE INTO products (barcode, name, brand, imageUrl, createdAt) VALUES (?, ?, ?, ?, ?)`);

            let count = 0;
            products.forEach(p => {
                if (p.code && p.product_name) {
                    const createdAt = new Date().toISOString();
                    stmt.run(p.code, p.product_name, p.brands || '', p.image_url || '', createdAt);
                    count++;
                }
            });

            stmt.finalize();
            console.log(`Successfully seeded ${count} products.`);
        });

    } catch (error) {
        console.error('Seeding failed:', error);
    } finally {
        db.close();
    }
}

seed();
