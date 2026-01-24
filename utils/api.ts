import { PriceEntry } from '@/types/price';
import { UserProfile } from '@/types/user';
import { supabase } from './supabase';

<<<<<<< Updated upstream
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.18.14:3001';
=======

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.18.69:3002';
>>>>>>> Stashed changes
const USE_SUPABASE = process.env.EXPO_PUBLIC_USE_SUPABASE === 'true';

console.log(`[API] Initializing. Mode: ${USE_SUPABASE ? 'SUPABASE' : 'LOCAL'}, URL: ${API_URL}`);

// Simple hash function for deterministic UUIDs (DJB2-ish or simple math for demo, usually use proper SHA-1)
// But for this environment, a simple string-to-uuid mapping is needed to keep it consistent.
// We'll use a pseudo-random generator seeded by the string.
const stringToUuid = (str: string): string => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0; // Convert to 32bit integer
    }
    // Mix it up to look like UUID segments
    const hex = (Math.abs(hash)).toString(16).padStart(8, '0');
    // We need 32 hex chars. Let's repeat/mix.
    // This is NOT secure, just determinstic for migration.
    const fullHex = (hex + hex + hex + hex).substring(0, 32);

    return `${fullHex.substring(0, 8)}-${fullHex.substring(8, 12)}-4${fullHex.substring(13, 16)}-8${fullHex.substring(17, 20)}-${fullHex.substring(20, 32)}`;
};

// Helper to transform PriceEntry for Supabase
// - Removes 'quantity' (not in schema)
// - Flattens 'location' objects into separate columns
// - CURRENTLY EXCLUDES address/lat/long because Supabase schema is missing them
const formatPriceForSupabase = (price: PriceEntry) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { quantity, location, id, ...rest } = price;

    // Ensure ID is a valid UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    let finalId = id;

    if (!uuidRegex.test(id)) {
        // Generate deterministic UUID for legacy IDs
        finalId = stringToUuid(id);
        console.log(`[API] Converted legacy ID ${id} -> ${finalId}`);
    }

    return {
        ...rest,
        id: finalId,
        // latitude: location?.latitude,
        // longitude: location?.longitude,
        // address: location?.address,
    };
};

// Helper to transform UserProfile for Supabase
// - Maps 'avatarId' to 'avatar_url'
// - Maps 'displayName' to 'full_name'
// - Maps 'joinedDate' to 'created_at'
// - Flattens 'stats'
// Helper to transform UserProfile for Supabase
// - Maps 'avatarId' to 'avatar_url'
// - Maps 'displayName' to 'full_name'
// - Maps 'joinedDate' to 'created_at'
// - Flattens 'stats'
// - Validates ID is UUID (Supabase requirement)
const formatUserForSupabase = (user: UserProfile) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { avatarId, displayName, joinedDate, stats, ...rest } = user;

    // Check if ID is a valid UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(user.id)) {
        console.warn(`[API] Skipping user sync for legacy ID: ${user.id}`);
        return null; // Return null for invalid IDs
    }

    return {
        ...rest,
        avatar_url: avatarId, // Map avatarId -> avatar_url
        full_name: displayName, // Map displayName -> full_name
        created_at: joinedDate, // Map joinedDate -> created_at
    };
};

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
            const { error } = await supabase.from('prices').upsert([formatPriceForSupabase(price)]);
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
            const formattedPrices = prices.map(formatPriceForSupabase);
            const { error } = await supabase.from('prices').upsert(formattedPrices);
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
            const formattedUser = formatUserForSupabase(user);
            if (!formattedUser) return; // Skip invalid/legacy users

            const { error } = await supabase.from('users').upsert([formattedUser]);
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
