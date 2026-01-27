import { supabase } from './supabase';
import { Supermarket } from '@/types/supermarket';
import { PriceEntry } from '@/types/price';

export const getSupermarkets = async (): Promise<Supermarket[]> => {
    try {
        // 1. Get from Local Cache first (Instant)
        const { getLocalSupermarkets, saveLocalSupermarkets } = await import('./storage');
        const cachedSupermarkets = await getLocalSupermarkets();

        // 2. Background Refresh
        const refresh = async () => {
            try {
                const { data, error } = await supabase.from('supermarkets').select('*').order('name', { ascending: true });
                if (!error && data) await saveLocalSupermarkets(data);
            } catch (e) { }
        };
        refresh();

        if (cachedSupermarkets.length > 0) {
            return cachedSupermarkets;
        }

        // 3. First time fallback (wait once)
        const { data } = await supabase.from('supermarkets').select('*').order('name', { ascending: true });
        return data || [];
    } catch (error) {
        console.error('Unexpected error in getSupermarkets:', error);
        const { getLocalSupermarkets } = await import('./storage');
        return await getLocalSupermarkets();
    }
};

export const getSupermarketById = async (id: string): Promise<Supermarket | null> => {
    try {
        // Note: If ID is not a valid UUID, Supabase might throw.
        const { data, error } = await supabase
            .from('supermarkets')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching supermarket by id:', error);
            return null;
        }

        return data;
    } catch (error) {
        console.error('Unexpected error fetching supermarket details:', error);
        return null;
    }
};

export const getProductsBySupermarketName = async (supermarketName: string): Promise<PriceEntry[]> => {
    try {
        // We filter prices by the supermarket column (which stores the name)
        const { data, error } = await supabase
            .from('prices')
            .select('*')
            .eq('supermarket', supermarketName)
            .order('productName', { ascending: true });

        if (error) {
            console.error(`Error fetching products for ${supermarketName}:`, error);
            return [];
        }

        return data || [];
    } catch (error) {
        console.error(`Unexpected error fetching products for ${supermarketName}:`, error);
        return [];
    }
};
