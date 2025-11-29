const https = require('https');
const db = require('./db');

const KEYWORDS = ['rice', 'beans', 'pasta', 'coke', 'chocolate', 'soap', 'shampoo', 'coffee', 'sugar', 'milk'];
const MAX_ITEMS_PER_KEYWORD = 5; // 5 items * 10 keywords = 50 requests (safe limit)

function searchUPCitemdb(keyword) {
    return new Promise((resolve, reject) => {
        const url = `https://api.upcitemdb.com/prod/trial/search?s=${keyword}&match_mode=0&type=product`;

        https.get(url, (res) => {
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

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function seed() {
    console.log('Starting UPCitemdb seed process...');

    let totalAdded = 0;

    for (const keyword of KEYWORDS) {
        console.log(`Searching for "${keyword}"...`);
        try {
            const data = await searchUPCitemdb(keyword);

            if (data.code === 'OK' && data.items) {
                const items = data.items.slice(0, MAX_ITEMS_PER_KEYWORD);

                db.serialize(() => {
                    const stmt = db.prepare(`INSERT OR REPLACE INTO products (barcode, name, brand, imageUrl, createdAt) VALUES (?, ?, ?, ?, ?)`);

                    items.forEach(item => {
                        if (item.ean && item.title) {
                            const createdAt = new Date().toISOString();
                            const imageUrl = item.images && item.images.length > 0 ? item.images[0] : '';
                            stmt.run(item.ean, item.title, item.brand || '', imageUrl, createdAt);
                            totalAdded++;
                        }
                    });

                    stmt.finalize();
                });
                console.log(`  Added ${items.length} items.`);
            } else {
                console.log('  No items found or error:', data.code);
            }

        } catch (error) {
            console.error(`  Error searching for ${keyword}:`, error.message);
        }

        // Wait 12 seconds between requests to avoid burst limit (6 req/min = 1 req every 10s)
        await sleep(12000);
    }

    console.log(`\nSeeding complete! Added ${totalAdded} new products.`);
    db.close();
}

seed();
