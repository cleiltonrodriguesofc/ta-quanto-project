import { PriceEntry } from '@/types/price';
import { UserProfile } from '@/types/user';

// REPLACE WITH YOUR COMPUTER'S LOCAL IP ADDRESS
// For Android Emulator use 'http://10.0.2.2:3000'
// For Physical Device use 'http://YOUR_LOCAL_IP:3000' (e.g., 192.168.1.5)
// To find your local IP:
// - Windows: Open Command Prompt and run 'ipconfig' -> Look for IPv4 Address
// - Mac/Linux: Open Terminal and run 'ifconfig' or 'hostname -I'
export const API_URL = 'http://192.168.1.5:3001';

export const checkApiConnection = async (): Promise<boolean> => {
    try {
        const response = await fetch(`${API_URL}/health`, {
            headers: { 'Bypass-Tunnel-Reminder': 'true' }
        });

        const text = await response.text();
        try {
            const data = JSON.parse(text);
            return data.status === 'ok';
        } catch (e) {
            console.log('API Connection failed: Response was not JSON', text.substring(0, 100));
            return false;
        }
    } catch (error) {
        console.log('API Connection failed:', error);
        return false;
    }
};

export const api = {
    getPrices: async (barcode?: string): Promise<PriceEntry[]> => {
        const url = barcode ? `${API_URL}/prices?barcode=${barcode}` : `${API_URL}/prices`;
        const response = await fetch(url, {
            headers: { 'Bypass-Tunnel-Reminder': 'true' }
        });

        const text = await response.text();
        if (!response.ok) {
            throw new Error(`Failed to fetch prices: ${response.status} ${text}`);
        }

        try {
            return JSON.parse(text);
        } catch (e) {
            throw new Error(`Invalid JSON response from server: ${text.substring(0, 100)}`);
        }
    },

    addPrice: async (price: PriceEntry): Promise<void> => {
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
    },

    batchUploadPrices: async (prices: PriceEntry[]): Promise<void> => {
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
    },

    getUser: async (id: string): Promise<UserProfile | null> => {
        const response = await fetch(`${API_URL}/users/${id}`, {
            headers: { 'Bypass-Tunnel-Reminder': 'true' }
        });

        if (response.status === 404) return null;

        const text = await response.text();
        if (!response.ok) {
            throw new Error(`Failed to fetch user: ${response.status} ${text}`);
        }

        try {
            return JSON.parse(text);
        } catch (e) {
            throw new Error(`Invalid JSON response from server: ${text.substring(0, 100)}`);
        }
    },

    saveUser: async (user: UserProfile): Promise<void> => {
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
        // 1. Check Local Cache
        try {
            const localResponse = await fetch(`${API_URL}/products/${barcode}`, {
                headers: { 'Bypass-Tunnel-Reminder': 'true' }
            });
            if (localResponse.ok) {
                const localProduct = await localResponse.json();
                console.log('[API] Found product in local cache');
                return localProduct;
            }
        } catch (e) {
            console.log('[API] Local cache check failed, trying external');
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

        // 4. Save to Local Cache (Fire and Forget)
        if (product) {
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
            }).catch(err => console.error('[API] Failed to cache product:', err));

            return product;
        }

        return null;
    } catch (error) {
        console.error('Error fetching product:', error);
        return null;
    }
};
