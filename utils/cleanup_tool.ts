
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load from .env manually since we are outside of Expo
dotenv.config();

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('Missing credentials in .env');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function cleanupDuplicates() {
    console.log('[Cleanup] Starting duplicate cleanup...');

    // 1. Fetch all prices
    const { data: prices, error } = await supabase
        .from('prices')
        .select('*')
        .order('timestamp', { ascending: false }); // Newest first

    if (error) {
        console.error('[Cleanup] Error fetching prices:', error);
        return;
    }

    if (!prices || prices.length === 0) {
        console.log('[Cleanup] No prices found.');
        return;
    }

    console.log(`[Cleanup] Scanning ${prices.length} prices...`);

    const toDelete: string[] = [];

    // Group by (barcode, supermarket)
    const groupBy = (array: any[], key: (i: any) => string) => {
        return array.reduce((groups, item) => {
            const groupKey = key(item);
            groups[groupKey] = groups[groupKey] || [];
            groups[groupKey].push(item);
            return groups;
        }, {});
    };

    const groups = groupBy(prices, p => `${p.barcode}_${p.supermarket}`);

    for (const key in groups) {
        const group = groups[key];
        // Ensure sorted new -> old
        group.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        for (let i = 0; i < group.length - 1; i++) {
            const current = group[i];
            const next = group[i + 1]; // Older

            // Relaxed comparison: same price
            if (current.price === next.price) {
                toDelete.push(next.id);
                console.log(`[Cleanup] Duplicate found: ${next.productName} (${next.price}) at ${next.supermarket}. Keeping ${current.timestamp}, deleting ${next.timestamp}`);
            }
        }
    }

    console.log(`[Cleanup] Found ${toDelete.length} duplicates to delete.`);

    if (toDelete.length > 0) {
        const { error: deleteError } = await supabase
            .from('prices')
            .delete()
            .in('id', toDelete);

        if (deleteError) {
            console.error('[Cleanup] Delete failed:', deleteError);
        } else {
            console.log('[Cleanup] Successfully deleted duplicate prices.');
        }
    } else {
        console.log('[Cleanup] Clean.');
    }
}

cleanupDuplicates().catch(console.error);
