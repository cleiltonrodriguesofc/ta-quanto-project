import { supabase } from './supabase';
import { Product } from '@/types/product';

export const getProducts = async (): Promise<Product[]> => {
    try {
        // 1. Fetch "official" products metadata (Cache)
        const { data: productsData, error: productsError } = await supabase
            .from('products')
            .select('*');

        if (productsError) console.warn('Error fetching products table:', productsError);

        // 2. Fetch all unique products from "prices" history
        const { data: pricesData, error: pricesError } = await supabase
            .from('prices')
            .select('barcode, productName, brand, imageUrl, timestamp, price, supermarket')
            .order('price', { ascending: true }); // Get CHEAPEST first

        if (pricesError) {
            console.error('Error fetching prices for products:', pricesError);
            return (productsData || []) as Product[];
        }

        // 3. Merge Strategies
        const productMap = new Map<string, Product>();
        const getKey = (item: any) => item.barcode || item.productName || 'unknown';

        // A. Process "Prices" first (Base layer)
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

        // B. Process "Products" table (Overlay/Enhancement)
        if (productsData) {
            for (const prod of productsData) {
                const key = getKey(prod);
                const existing = productMap.get(key);
                productMap.set(key, {
                    ...existing,
                    ...prod,
                    barcode: prod.barcode || existing?.barcode || '',
                });
            }
        }

        // 4. Convert to array and sort
        return Array.from(productMap.values()).sort((a, b) => {
            return a.name.localeCompare(b.name);
        });

    } catch (error) {
        console.error('Unexpected error fetching products:', error);
        return [];
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
