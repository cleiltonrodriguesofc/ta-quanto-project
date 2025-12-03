import { PriceEntry } from '@/types/price';
import { UserProfile } from '@/types/user';
import { supabase } from './supabase';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.18.14:3001';
const USE_SUPABASE = process.env.EXPO_PUBLIC_USE_SUPABASE === 'true';

console.log(`[API] Initializing. Mode: ${USE_SUPABASE ? 'SUPABASE' : 'LOCAL'}, URL: ${API_URL}`);

export const checkApiConnection = async (): Promise<boolean> => {
    if (USE_SUPABASE) {
        try {
            const { error } = await supabase.from('supermarkets').select('count', { count: 'exact', head: true });
            return !error;
        } catch (error) {
            console.log('[API] Supabase connection failed:', error);
            return false;
        }
    } else {
        try {
            const response = await fetch(`${API_URL}/health`, {
                headers: { 'Bypass-Tunnel-Reminder': 'true' }
            });
            const text = await response.text();
            try {
                const data = JSON.parse(text);
                return data.status === 'ok';
            } catch (e) {
                console.log('[API] Local connection failed: Response was not JSON', text.substring(0, 100));
                return false;
            }
        } catch (error) {
            console.log('[API] Local connection failed:', error);
            return false;
        }
    }
};

export const api = {
    getPrices: async (barcode?: string): Promise<PriceEntry[]> => {
        if (USE_SUPABASE) {
            let query = supabase
                .from('prices')
                .select('*')
                .order('timestamp', { ascending: false });

            if (barcode) {
                query = query.eq('barcode', barcode);
            }

            const { data, error } = await query;
            if (error) throw new Error(`Supabase error: ${error.message}`);
            return data || [];
        } else {
            const url = barcode ? `${API_URL}/prices?barcode=${barcode}` : `${API_URL}/prices`;
            const response = await fetch(url, {
                headers: { 'Bypass-Tunnel-Reminder': 'true' }
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(`Failed to fetch prices: ${response.status} ${text}`);
            }
            return response.json();
        }
    },

    addPrice: async (price: PriceEntry): Promise<void> => {
        if (USE_SUPABASE) {
            const { error } = await supabase.from('prices').insert([price]);
            if (error) throw new Error(`Supabase error: ${error.message}`);
        } else {
            const response = await fetch(`${API_URL}/prices`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Bypass-Tunnel-Reminder': 'true'
                },
                body: JSON.stringify(price),
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(`Failed to add price: ${response.status} ${text}`);
            }
        }
    },

    batchUploadPrices: async (prices: PriceEntry[]): Promise<void> => {
        if (USE_SUPABASE) {
            const { error } = await supabase.from('prices').insert(prices);
            if (error) throw new Error(`Supabase error: ${error.message}`);
        } else {
            const response = await fetch(`${API_URL}/prices/batch`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Bypass-Tunnel-Reminder': 'true'
                },
                body: JSON.stringify(prices),
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(`Failed to batch upload prices: ${response.status} ${text}`);
            }
        }
    },

    getUser: async (id: string): Promise<UserProfile | null> => {
        if (USE_SUPABASE) {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                if (error.code === 'PGRST116') return null;
                throw new Error(`Supabase error: ${error.message}`);
            }
            return data;
        } else {
            const response = await fetch(`${API_URL}/users/${id}`, {
                headers: { 'Bypass-Tunnel-Reminder': 'true' }
            });

            if (response.status === 404) return null;
            if (!response.ok) {
                const text = await response.text();
                throw new Error(`Failed to fetch user: ${response.status} ${text}`);
            }
            return response.json();
        }
    },

    saveUser: async (user: UserProfile): Promise<void> => {
        if (USE_SUPABASE) {
            const { error } = await supabase.from('users').upsert([user]);
            if (error) throw new Error(`Supabase error: ${error.message}`);
        } else {
            const response = await fetch(`${API_URL}/users`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Bypass-Tunnel-Reminder': 'true'
                },
                body: JSON.stringify(user),
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(`Failed to save user: ${response.status} ${text}`);
            }
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
        // 1. Check Cache (Supabase or Local)
        try {
            if (USE_SUPABASE) {
                const { data, error } = await supabase
                    .from('products')
                    .select('*')
                    .eq('barcode', barcode)
                    .single();

                if (data) {
                    console.log('[API] Found product in Supabase cache');
                    return data;
                }
            } else {
                const localResponse = await fetch(`${API_URL}/products/${barcode}`, {
                    headers: { 'Bypass-Tunnel-Reminder': 'true' }
                });
                if (localResponse.ok) {
                    const localProduct = await localResponse.json();
                    console.log('[API] Found product in local cache');
                    return localProduct;
                }
            }
        } catch (e) {
            console.log(`[API] ${USE_SUPABASE ? 'Supabase' : 'Local'} cache check failed, trying external`);
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

        // 4. Save to Cache (Fire and Forget)
        if (product) {
            if (USE_SUPABASE) {
                supabase.from('products').upsert([{
                    barcode,
                    ...product,
                    createdAt: new Date().toISOString()
                }]).then(({ error }) => {
                    if (error) console.error('[API] Failed to cache product in Supabase:', error);
                });
            } else {
                fetch(`${API_URL}/products`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Bypass-Tunnel-Reminder': 'true'
                    },
                    body: JSON.stringify({
                        barcode,
                        ...product
                    })
                }).catch(err => console.error('[API] Failed to cache product locally:', err));
            }

            return product;
        }

        return null;
    } catch (error) {
        console.error('Error fetching product:', error);
        return null;
    }
};
