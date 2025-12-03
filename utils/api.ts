import { PriceEntry } from '@/types/price';
import { UserProfile } from '@/types/user';

// REPLACE WITH YOUR COMPUTER'S LOCAL IP ADDRESS
// For Android Emulator use 'http://10.0.2.2:3000'
// For Physical Device use 'http://YOUR_LOCAL_IP:3000' (e.g., 192.168.1.5)
// To find your local IP:
// - Windows: Open Command Prompt and run 'ipconfig' -> Look for IPv4 Address
// - Mac/Linux: Open Terminal and run 'ifconfig' or 'hostname -I'
import { supabase } from './supabase';

export const checkApiConnection = async (): Promise<boolean> => {
    try {
        const { error } = await supabase.from('supermarkets').select('count', { count: 'exact', head: true });
        return !error;
    } catch (error) {
        console.log('API Connection failed:', error);
        return false;
    }
};

export const api = {
    getPrices: async (barcode?: string): Promise<PriceEntry[]> => {
        let query = supabase
            .from('prices')
            .select('*')
            .order('timestamp', { ascending: false });

        if (barcode) {
            query = query.eq('barcode', barcode);
        }

        const { data, error } = await query;

        if (error) {
            throw new Error(`Failed to fetch prices: ${error.message}`);
        }

        return data || [];
    },

    addPrice: async (price: PriceEntry): Promise<void> => {
        const { error } = await supabase
            .from('prices')
            .insert([price]);

        if (error) {
            throw new Error(`Failed to add price: ${error.message}`);
        }
    },

    batchUploadPrices: async (prices: PriceEntry[]): Promise<void> => {
        const { error } = await supabase
            .from('prices')
            .insert(prices);

        if (error) {
            throw new Error(`Failed to batch upload prices: ${error.message}`);
        }
    },

    getUser: async (id: string): Promise<UserProfile | null> => {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null; // Not found
            throw new Error(`Failed to fetch user: ${error.message}`);
        }

        return data;
    },

    saveUser: async (user: UserProfile): Promise<void> => {
        const { error } = await supabase
            .from('users')
            .upsert([user]);

        if (error) {
            throw new Error(`Failed to save user: ${error.message}`);
        }
    },
};

export const fetchProductFromUPCitemdb = async (barcode: string) => {
    try {
        const response = await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${barcode}`);
        const data = await response.json();

        if (data.code === 'OK' && data.items && data.items.length > 0) {
            const item = data.items[0];
            return {
                name: item.title,
                brand: item.brand,
                imageUrl: item.images && item.images.length > 0 ? item.images[0] : undefined,
            };
        }
        return null;
    } catch (error) {
        console.error('Error fetching from UPCitemdb:', error);
        return null;
    }
};

export const fetchProductFromOpenFoodFacts = async (barcode: string) => {
    try {
        // 1. Check Supabase Cache
        try {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('barcode', barcode)
                .single();

            if (data) {
                console.log('[API] Found product in Supabase cache');
                return data;
            }
        } catch (e) {
            console.log('[API] Supabase cache check failed, trying external');
        }

        let product = null;

        // 2. Fetch from OpenFoodFacts
        try {
            const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
            const data = await response.json();

            if (data.status === 1) {
                product = {
                    name: data.product.product_name,
                    brand: data.product.brands,
                    imageUrl: data.product.image_url,
                };
                console.log('[API] Found in OpenFoodFacts');
            }
        } catch (error) {
            console.error('Error fetching from OpenFoodFacts:', error);
        }

        // 3. Fallback to UPCitemdb if not found
        if (!product) {
            console.log('[API] Not found in OpenFoodFacts, trying UPCitemdb...');
            product = await fetchProductFromUPCitemdb(barcode);
            if (product) console.log('[API] Found in UPCitemdb');
        }

        // 4. Save to Supabase Cache (Fire and Forget)
        if (product) {
            supabase.from('products').upsert([{
                barcode,
                ...product,
                createdAt: new Date().toISOString()
            }]).then(({ error }) => {
                if (error) console.error('[API] Failed to cache product in Supabase:', error);
            });

            return product;
        }

        return null;
    } catch (error) {
        console.error('Error fetching product:', error);
        return null;
    }
};
