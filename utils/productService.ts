import { supabase } from './supabase';
import { Product } from '@/types/product';

export const getProducts = async (): Promise<Product[]> => {
    // 0. Define background refresh logic
    const refreshCache = async () => {
        try {
            const { saveLocalProducts } = await import('./storage');
            const { data: productsData, error: productsError } = await supabase.from('products').select('*');
            const { data: pricesData, error: pricesError } = await supabase.from('prices')
                .select('barcode, productName, brand, imageUrl, timestamp, price, supermarket')
                .order('price', { ascending: true });

            if (!productsError && !pricesError) {
                const productMap = new Map<string, Product>();
                const getKey = (item: any) => item.barcode || item.productName || 'unknown';

                if (pricesData) {
                    for (const price of pricesData) {
                        const key = getKey(price);
                        if (!productMap.has(key)) {
                            productMap.set(key, {
                                barcode: price.barcode || '',
                                name: price.productName,
                                brand: price.brand,
                                imageUrl: price.imageUrl,
                                createdAt: price.timestamp,
                                id: price.barcode || undefined,
                                bestPrice: price.price,
                                supermarket: price.supermarket
                            });
                        }
                    }
                }

                if (productsData) {
                    for (const prod of productsData) {
                        const key = getKey(prod);
                        const existing = productMap.get(key);
                        productMap.set(key, { ...existing, ...prod, barcode: prod.barcode || existing?.barcode || '' });
                    }
                }

                const mergedProducts = Array.from(productMap.values()).sort((a, b) => a.name.localeCompare(b.name));
                await saveLocalProducts(mergedProducts);
            }
        } catch (e) {
            console.warn('[ProductService] Background refresh failed:', e);
        }
    };

    try {
        // 1. Get from Local Cache first (Instant)
        const { getLocalProducts } = await import('./storage');
        const cachedProducts = await getLocalProducts();

        // 2. Fire background refresh
        // Don't await it, just let it run.
        refreshCache();

        // 3. If we have cache, return it immediately
        if (cachedProducts.length > 0) {
            return cachedProducts;
        }

        // 4. If no cache, we MUST wait for the first load (or return empty if we prefer)
        // But for first-run experience, waiting a bit is safer than showing an empty screen.
        // However, we can return empty if we want extreme speed. Let's wait only if cache is empty.
        const { data: productsData, error: productsError } = await supabase.from('products').select('*');
        if (productsError) {
            console.error('Error fetching products on initial load:', productsError);
            return []; // Return empty if initial fetch fails
        }
        return (productsData || []) as Product[];

    } catch (error) {
        console.error('Unexpected error in getProducts:', error);
        const { getLocalProducts } = await import('./storage');
        return await getLocalProducts(); // Fallback to local cache even on unexpected error
    }
};

export const getProductByBarcode = async (barcode: string): Promise<Product | null> => {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('barcode', barcode)
            .single();

        if (error) {
            console.error('Error fetching product by barcode:', error);
            return null;
        }

        return data as Product;
    } catch (error) {
        console.error('Unexpected error fetching product details:', error);
        return null;
    }
};
