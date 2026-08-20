import { PriceEntry } from '@/types/price';

export const calculatePotentialSavings = (prices: PriceEntry[]): number => {
    if (!prices || prices.length === 0) return 0;

    const productMap = new Map<string, number[]>();

    // Group prices by unique product identifier (barcode preferred, fallback to name)
    prices.forEach((price) => {
        const key = price.barcode || price.productName;
        if (key) {
            if (!productMap.has(key)) {
                productMap.set(key, []);
            }
            productMap.get(key)?.push(price.price);
        }
    });

    let totalSavings = 0;

    // Calculate savings for each product
    productMap.forEach((productPrices) => {
        if (productPrices.length > 1) {
            const maxPrice = Math.max(...productPrices);
            const minPrice = Math.min(...productPrices);
            totalSavings += maxPrice - minPrice;
        }
    });

    return totalSavings;
};
