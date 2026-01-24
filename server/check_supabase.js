const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { count: pricesCount, error: pricesError } = await supabase
        .from('prices')
        .select('*', { count: 'exact', head: true });

    if (pricesError) console.error('Error checking prices:', pricesError);
    else console.log('Supabase prices count:', pricesCount);

    const { count: smCount, error: smError } = await supabase
        .from('supermarkets')
        .select('*', { count: 'exact', head: true });

    if (smError) console.error('Error checking supermarkets:', smError);
    else console.log('Supabase supermarkets count:', smCount);
}

check();
