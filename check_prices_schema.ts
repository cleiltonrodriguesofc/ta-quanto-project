
import { supabase } from './utils/supabase';

async function checkPricesSchema() {
    const { data, error } = await supabase.from('prices').select('*').limit(1);
    if (error) {
        console.error('Error fetching price record:', error);
    } else if (data && data.length > 0) {
        console.log('Prices columns:', Object.keys(data[0]));
        console.log('Prices data sample:', data[0]);
    } else {
        console.log('No prices found in table.');
        // Fallback: try to see if we can get columns via rpc or just a raw query if allowed, 
        // but select('*') usually returns keys even if data is null if the table exists.
        // Actually, let's try to insert a dummy record and see? No, let's try to select from a non-existent column to see error message.
    }
}

checkPricesSchema();
