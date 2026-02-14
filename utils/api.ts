import { PriceEntry } from '@/types/price';
import { UserProfile } from '@/types/user';
import { supabase } from './supabase';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.18.69:3002';
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
// - Generates deterministic UUID for legacy IDs
const formatPriceForSupabase = (price: PriceEntry) => {


    // Ensure ID is a valid UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    let finalId = price.id;

    if (!uuidRegex.test(price.id)) {
        // Generate deterministic UUID for legacy IDs
        finalId = stringToUuid(price.id);
    }

    return {
        barcode: price.barcode,
        price: price.price,
        supermarket: price.supermarket,
        timestamp: price.timestamp,
        productName: price.productName,
        brand: price.brand || null,
        imageUrl: price.imageUrl || null,
        id: finalId,
        userId: price.userId || null,
    };
};

// Helper to transform UserProfile for Supabase
// - Maps 'avatarId' to 'avatar_url'
// - Maps 'displayName' to 'full_name'
// - Maps 'joinedDate' to 'created_at'
// - Flattens 'stats'
// - Validates ID is UUID (Supabase requirement)
const formatUserForSupabase = (user: UserProfile) => {
    const { avatarId, displayName, joinedDate, stats, level, points, badges, settings, ...rest } = user;

    // Ensure ID is a valid UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    let finalId = user.id;

    if (!uuidRegex.test(user.id)) {
        // Generate deterministic UUID for legacy IDs
        finalId = stringToUuid(user.id);
        console.log(`[API] Converted legacy User ID ${user.id} -> ${finalId}`);
    }

    return {
        ...rest,
        id: finalId,
        avatar_url: avatarId || null,
        full_name: displayName || 'Anonymous',
        created_at: joinedDate || user.joinedDate || new Date().toISOString(),
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
            } catch {
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

    getPricesByUser: async (userId: string): Promise<PriceEntry[]> => {
        if (USE_SUPABASE) {
            // Need to ensure we index userId in Supabase or this might be slow eventually
            const { data, error } = await supabase
                .from('prices')
                .select('*')
                // .eq('userId', userId) // Assuming userId column exists. If not, we might fail.
                // Wait, types/price.ts has userId. But does the DB have it?
                // The DB schema is not fully visible, but we are sending 'rest' which includes userId if it's in the object.
                // Let's assume it exists. If not, this returns everything or errors. 
                // Actually, earlier `formatPriceForSupabase` spreads `...rest`. userId comes from `...rest`.
                // So it should be there IF the column exists.
                // Let's modify the query to filter by userId if possible.
                // .eq('user_id', userId) ? Snake case?
                // `formatPriceForSupabase` preserves keys as camelCase unless mapped.
                // It maps nothing from `rest`. So `userId` is `userId` in JSON data column?
                // Or is it a real column? 
                // Supabase usually implies snake_case columns.
                // Let's check `formatPriceForSupabase` in api.ts again.
                // It returns `...rest`.
                // If the table was created with SQL editor using UserProfile keys?
                // Let's try to query, and handle error.
                // Safe bet: .contains('data', { userId }) if using JSONB, or just try column.
                // Actually, let's just limit to 5 recent for now to be safe, regardless of user? 
                // No, "My Contributions" needs MY prices.
                // Match the quoted "userId" column in Supabase schema
                .eq('userId', userId)
                .order('timestamp', { ascending: false })
                .limit(5);

            if (error) {
                console.warn('[API] Fetch user prices failed (column might be missing):', error.message);
                return [];
            }
            return data || [];
        } else {
            // Local fetch not supported perfectly but...
            return [];
        }
    },

    addPrice: async (price: PriceEntry): Promise<void> => {
        if (USE_SUPABASE) {
            // Check for recent duplicate (same barcode, same supermarket, same price)
            // We only check the LAST entry. If the price hasn't changed, we don't need a new record.
            const { data: latest } = await supabase
                .from('prices')
                .select('price, timestamp')
                .eq('barcode', price.barcode)
                .eq('supermarket', price.supermarket)
                .order('timestamp', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (latest && latest.price === price.price) {
                // If it's the exact same price, check the time. 
                // If it was registered less than 1 hour ago, skip to avoid spam.
                // Otherwise, allow it as a "confirmation" check.
                const lastTimestamp = latest.timestamp ? new Date(latest.timestamp).getTime() : 0;
                const now = new Date().getTime();
                const oneHour = 60 * 60 * 1000;

                if (now - lastTimestamp < oneHour) {
                    console.log('[API] Skipping duplicate price submission (less than 1h ago)');
                    return;
                }
                console.log('[API] Allowing "Price Confirmation" for same value');
            }

            // 1. Sync Product Metadata (Name, Brand, Image)
            const productData = {
                barcode: price.barcode,
                name: price.productName,
                brand: price.brand,
                imageUrl: price.imageUrl,
                createdAt: new Date().toISOString()
            };

            console.log('[API] Syncing product metadata for registration:', price.barcode, productData.name);
            try {
                const { error: productError } = await supabase
                    .from('products')
                    .upsert([productData], { onConflict: 'barcode' });

                if (productError) {
                    if (productError.code === '42501') {
                        console.warn('[API] RLS Restricted: Product metadata not updated (read-only for this user)');
                    } else {
                        console.error('[API] Failed to sync product metadata:', productError);
                    }
                }
            } catch (err) {
                console.error('[API] Unexpected error syncing metadata:', err);
                // Continue regardless of metadata sync
            }

            // 2. Save Price Entry
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
            // Validate UUID before query
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            if (!uuidRegex.test(id)) {
                console.warn(`[API] Skipping getUser for legacy ID: ${id}`);
                return null;
            }

            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    console.log(`[API] User ${id} not found in 'users' table.`);
                    return null;
                }
                console.error(`[API] getUser error:`, error);
                throw new Error(`Supabase error: ${error.message}`);
            }

            console.log(`[API] Found user in DB:`, data.full_name);

            // Fetch actual price count for stats
            const { count: pricesCount } = await supabase
                .from('prices')
                .select('*', { count: 'exact', head: true })
                .eq('userId', id);

            // Map Supabase fields back to UserProfile
            return {
                id: data.id,
                displayName: data.full_name || 'Anonymous',
                avatarId: data.avatar_url || 'avatar1',
                joinedDate: data.created_at,
                stats: {
                    pricesShared: pricesCount || data.pricesShared || 0,
                    totalSavings: data.totalSavings || 0,
                    streakDays: 0,
                    rank: 0
                },
                level: 1, // Will be recalculated in UI
                points: (pricesCount || 0) * 10,
                settings: { notifications: true, darkMode: false }
            } as UserProfile;
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
            if (!formattedUser) return; // Skip invalid users

            console.log(`[API] Saving user to Supabase:`, formattedUser.id, formattedUser.full_name);
            const { error: upsertError } = await supabase.from('users').upsert([formattedUser]);

            if (upsertError) {
                console.error(`[API] Error saving to 'users' table:`, upsertError);
                // Don't throw yet, try Auth metadata update too
            }

            // Also update Supabase Auth metadata if we have a session
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user.id === user.id) {
                console.log(`[API] Updating Auth metadata for:`, user.id);
                const { error: authError } = await supabase.auth.updateUser({
                    data: {
                        full_name: user.displayName,
                        avatar_url: user.avatarId
                    }
                });
                if (authError) console.error(`[API] Error updating Auth metadata:`, authError);
            }

            if (upsertError) throw new Error(`Failed to save to database: ${upsertError.message}`);
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

    uploadAvatar: async (userId: string, imageUri: string): Promise<string> => {
        if (!USE_SUPABASE) return imageUri;

        // If it's already a remote URL, skip upload
        if (imageUri.startsWith('http')) return imageUri;

        try {
            const fileName = `${Date.now()}.jpg`;
            const filePath = `avatars/${userId}/${fileName}`;

            // 1. Get Blob from local URI
            const response = await fetch(imageUri);
            const blob = await response.blob();

            // 2. Convert Blob to ArrayBuffer (more reliable for RN network requests)
            const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    if (reader.result instanceof ArrayBuffer) {
                        resolve(reader.result);
                    } else {
                        reject(new Error('Failed to convert blob to ArrayBuffer'));
                    }
                };
                reader.onerror = reject;
                reader.readAsArrayBuffer(blob);
            });

            // 3. Upload ArrayBuffer
            const { error } = await supabase.storage
                .from('profiles')
                .upload(filePath, arrayBuffer, {
                    contentType: 'image/jpeg',
                    upsert: true,
                    // Limit upload speed/retry if needed
                });

            // Log size in KB for debugging
            console.log(`[API] Uploaded avatar size: ${(arrayBuffer.byteLength / 1024).toFixed(2)} KB`);

            if (arrayBuffer.byteLength > 1024 * 1024) { // 1MB Hard Limit check
                console.warn(`[API] Warning: Large avatar upload detected (${(arrayBuffer.byteLength / 1024 / 1024).toFixed(2)} MB)`);
            }

            if (error) {
                if (error.message.includes('bucket not found')) {
                    throw new Error('Supabase storage bucket "profiles" not found. Please create it in your Supabase dashboard and set it to public.');
                }
                throw error;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('profiles')
                .getPublicUrl(filePath);

            return publicUrl;
        } catch (error: any) {
            console.error('[API] Avatar upload failed:', error);
            throw new Error(`Avatar upload failed: ${error.message}`);
        }
    },

    fetchProductFromCosmos: async (barcode: string): Promise<any> => {
        const token = process.env.EXPO_PUBLIC_COSMOS_API_TOKEN;
        if (!token) {
            console.error('[API] Cosmos Token not found in environment');
            return null;
        }

        try {
            const response = await fetch(`https://api.cosmos.bluesoft.com.br/gtins/${barcode}.json`, {
                headers: {
                    'X-Cosmos-Token': token,
                    'User-Agent': 'Cosmos-API-Request',
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                console.log(`[API] Cosmos Response for ${barcode}:`, JSON.stringify(data));

                // Prioritize image sources
                let finalImageUrl = data.thumbnail || '';

                if (finalImageUrl) {
                    console.log(`[API] Using Cosmos thumbnail for ${barcode}`);
                } else if (data.brand && data.brand.picture) {
                    finalImageUrl = data.brand.picture;
                    console.log(`[API] Using brand picture for ${barcode}`);
                } else {
                    // Bluesoft CDN fallback - try common patterns
                    finalImageUrl = `https://cdn-cosmos.bluesoft.com.br/products/${barcode}`;
                    console.log(`[API] Using CDN fallback for ${barcode}`);
                }

                return {
                    name: data.description,
                    brand: data.brand ? data.brand.name : '',
                    imageUrl: finalImageUrl || '',
                    barcode: barcode,
                    price: data.avg_price || 0
                };
            }
            return null;
        } catch (error) {
            console.error('[API] Error calling Cosmos directly:', error);
            return null;
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
                const { data } = await supabase
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
        } catch {
            console.log(`[API] ${USE_SUPABASE ? 'Supabase' : 'Local'} cache check failed, trying external`);
        }

        let product = null;

        // 2. Fetch from OpenFoodFacts (Public)
        try {
            console.log('[API] Searching in OpenFoodFacts...');
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

        // 3. Fallback to UPCitemdb if not found (Public)
        if (!product) {
            console.log('[API] Not found in OpenFoodFacts, trying UPCitemdb...');
            product = await fetchProductFromUPCitemdb(barcode);
            if (product) console.log('[API] Found in UPCitemdb');
        }

        // 4. Fetch from Cosmos (Private / Limited Access - Fallback)
        if (!product) {
            try {
                console.log('[API] Not found in public APIs, searching in Cosmos API...');
                product = await api.fetchProductFromCosmos(barcode);
                if (product) {
                    console.log('[API] Found in Cosmos');
                }
            } catch (error) {
                console.error('[API] Cosmos search failed:', error);
            }
        }

        // 5. Save to Cache (Fire and Forget)
        if (product) {

            const { price, barcode: pBarcode, ...productMetadata } = product;

            if (USE_SUPABASE) {
                const upsertData = {
                    barcode: barcode,
                    name: productMetadata.name,
                    brand: productMetadata.brand,
                    imageUrl: productMetadata.imageUrl,
                    createdAt: new Date().toISOString()
                };
                console.log('[API] Caching product metadata:', JSON.stringify(upsertData));
                supabase.from('products').upsert([upsertData]).then(({ error }) => {
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
                        ...productMetadata
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
