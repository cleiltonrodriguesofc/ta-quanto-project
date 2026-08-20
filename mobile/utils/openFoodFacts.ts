import { ScannedProduct } from '@/types/product';

const BASE_URL = 'https://world.openfoodfacts.org/api/v0/product';

export async function fetchProductByBarcode(barcode: string): Promise<ScannedProduct | null> {
    try {
        const response = await fetch(`${BASE_URL}/${barcode}.json`);
        const data = await response.json();

        if (data.status === 1 && data.product) {
            const product = data.product;

            // Extract the best available name (prefer Portuguese, then English, then generic)
            const name = product.product_name_pt ||
                product.product_name_en ||
                product.product_name ||
                'Unknown Product';

            // Extract brand
            const brand = product.brands || product.brands_tags?.[0] || undefined;

            // Extract quantity
            const quantity = product.quantity || product.product_quantity || undefined;

            // Format name to be descriptive: "Brand - Name" if brand is available and not already in name
            let formattedName = name;
            if (brand && !name.toLowerCase().includes(brand.toLowerCase())) {
                formattedName = `${brand} - ${name}`;
            }

            return {
                barcode,
                name: formattedName,
                brand,
                quantity,
                imageUrl: product.image_url,
                rawResponse: product,
            };
        }

        return null;
    } catch (error) {
        console.error('Error fetching product from Open Food Facts:', error);
        return null;
    }
}
