import { ScannedProduct } from '@/types/product';

const OPEN_FOOD_FACTS_API_URL = 'https://world.openfoodfacts.org/api/v0/product';

export const fetchProductFromOpenFoodFacts = async (barcode: string): Promise<ScannedProduct | null> => {
    try {
        const response = await fetch(`${OPEN_FOOD_FACTS_API_URL}/${barcode}.json`);
        const data = await response.json();

        if (data.status === 1) {
            const product = data.product;
            return {
                barcode: product.code || barcode,
                name: product.product_name || product.product_name_en || 'Unknown Product',
                brand: product.brands,
                quantity: product.quantity,
                imageUrl: product.image_front_url || product.image_url,
                rawResponse: product,
            };
        }

        return null;
    } catch (error) {
        console.error('Error fetching product from Open Food Facts:', error);
        return null;
    }
};
