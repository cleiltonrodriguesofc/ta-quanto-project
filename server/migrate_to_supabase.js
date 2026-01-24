const sqlite3 = require('sqlite3').verbose();
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const dbPath = path.resolve(__dirname, 'taquanto.db');
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env file.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        process.exit(1);
    }
    console.log('Connected to local SQLite database.');
});

const isValidUuid = (id) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
};

const migratePrices = () => {
    return new Promise((resolve, reject) => {
        db.all("SELECT * FROM prices", async (err, rows) => {
            if (err) return reject(err);

            console.log(`Found ${rows.length} prices to migrate.`);

            const prices = rows.map(row => {
                // Ensure ID is UUID
                const id = isValidUuid(row.id) ? row.id : crypto.randomUUID();

                // Convert snake_case from DB to camelCase/expected Supabase columns if needed
                // Our fix_schema_names.sql renamed Supabase columns to "imageUrl", "productName" (quoted)
                // BUT Supabase client usually handles mapping if we send object keys matching column names.
                // Let's coerce to the schema we expect.

                // NOTE: SQLite columns in db.js: productName, price, supermarket, etc. (mixed case).

                return {
                    id: id,
                    productName: row.productName || 'Unknown Product',
                    price: row.price || 0,
                    supermarket: row.supermarket || 'Unknown Market',
                    barcode: row.barcode || '0000000000000', // Default barcode for items without one
                    brand: row.brand || '',
                    imageUrl: row.imageUrl || null,
                    timestamp: row.timestamp || new Date().toISOString(),
                };
            });

            if (prices.length === 0) return resolve();

            // Upsert prices based on ID (Primary Key)
            const { error } = await supabase.from('prices').upsert(prices);

            if (error) {
                console.error('Error uploading prices:', error);
                reject(error);
            } else {
                console.log(`Successfully migrated ${prices.length} prices.`);
                resolve();
            }
        });
    });
};

const migrateSupermarkets = () => {
    return new Promise((resolve, reject) => {
        db.all("SELECT * FROM supermarkets", async (err, rows) => {
            if (err) return reject(err);

            console.log(`Found ${rows.length} supermarkets to migrate.`);

            const supermarkets = rows.map(row => ({
                // Supabase ID is UUID default, we can let it auto-generate or use existing if UUID
                // SQLite ID is INTEGER. We should let Supabase generate new IDs.
                // UNLESS we need to map them. But 'prices' table stores supermarket Name (text) in this app version, not ID reference.
                // So we just need to ensure the Names exist in the Unique list.
                name: row.name,
                type: row.type || 'Supermarket',
                address: row.address,
                latitude: row.latitude,
                longitude: row.longitude
            }));

            if (supermarkets.length === 0) return resolve();

            // Fetch existing supermarkets to avoid duplicates manually (since name might not be UNIQUE in Postgres)
            const { data: existingData, error: fetchError } = await supabase
                .from('supermarkets')
                .select('name');

            if (fetchError) {
                console.error('Error fetching existing supermarkets:', fetchError);
                return reject(fetchError);
            }

            const existingNames = new Set(existingData.map(s => s.name.toLowerCase()));
            const newSupermarkets = supermarkets.filter(s => !existingNames.has(s.name.toLowerCase()));

            if (newSupermarkets.length === 0) {
                console.log('No new supermarkets to migrate.');
                return resolve();
            }

            const { error } = await supabase.from('supermarkets').insert(newSupermarkets);

            if (error) {
                console.error('Error uploading supermarkets:', error);
                reject(error);
            } else {
                console.log(`Successfully migrated ${newSupermarkets.length} new supermarkets.`);
                resolve();
            }
        });
    });
};

const runMigration = async () => {
    console.log('--- Starting Migration ---');
    try {
        await migrateSupermarkets();
        console.log('✔ Supermarkets migration handled.');
    } catch (error) {
        console.error('✘ Supermarkets migration failed:', error.message || error);
    }

    try {
        await migratePrices();
        console.log('✔ Prices migration handled.');
    } catch (error) {
        console.error('✘ Prices migration failed:', error.message || error);
    }

    console.log('--- Migration Process Finished ---');
    db.close();
    process.exit();
};

runMigration();
