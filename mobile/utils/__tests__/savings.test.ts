
import { calculatePotentialSavings } from '../savings';
import { PriceEntry } from '@/types/price';

describe('calculatePotentialSavings', () => {
    it('should return 0 when input is empty', () => {
        const prices: PriceEntry[] = [];
        const savings = calculatePotentialSavings(prices);
        expect(savings).toBe(0);
    });

    it('should return 0 for single price entries per product', () => {
        const prices: PriceEntry[] = [
            {
                id: '1',
                productName: 'Product A',
                price: 10,
                supermarket: 'Market 1',
                timestamp: '2024-01-01',
                barcode: '123'
            },
            {
                id: '2',
                productName: 'Product B',
                price: 20,
                supermarket: 'Market 2',
                timestamp: '2024-01-01',
                barcode: '456'
            }
        ];
        const savings = calculatePotentialSavings(prices);
        expect(savings).toBe(0);
    });

    it('should calculate savings correctly for a single product with multiple prices', () => {
        const prices: PriceEntry[] = [
            {
                id: '1',
                productName: 'Product A',
                price: 10,
                supermarket: 'Market 1',
                timestamp: '2024-01-01',
                barcode: '123'
            },
            {
                id: '2',
                productName: 'Product A',
                price: 15,
                supermarket: 'Market 2',
                timestamp: '2024-01-01',
                barcode: '123'
            },
            {
                id: '3',
                productName: 'Product A',
                price: 8, // New Min
                supermarket: 'Market 3',
                timestamp: '2024-01-01',
                barcode: '123'
            }
        ];
        // Max: 15, Min: 8 -> Savings: 7
        const savings = calculatePotentialSavings(prices);
        expect(savings).toBe(7);
    });

    it('should calculate total savings across multiple products', () => {
        const prices: PriceEntry[] = [
            // Product A: 10, 15 -> Savings 5
            {
                id: '1',
                productName: 'Product A',
                price: 10,
                supermarket: 'Market 1',
                timestamp: '2024-01-01',
                barcode: '123'
            },
            {
                id: '2',
                productName: 'Product A',
                price: 15,
                supermarket: 'Market 2',
                timestamp: '2024-01-01',
                barcode: '123'
            },
            // Product B: 20, 22 -> Savings 2
            {
                id: '3',
                productName: 'Product B',
                price: 20,
                supermarket: 'Market 1',
                timestamp: '2024-01-01',
                barcode: '456'
            },
            {
                id: '4',
                productName: 'Product B',
                price: 22,
                supermarket: 'Market 2',
                timestamp: '2024-01-01',
                barcode: '456'
            }
        ];
        // Total: 5 + 2 = 7
        const savings = calculatePotentialSavings(prices);
        expect(savings).toBe(7);
    });

    it('should handle products without barcodes by falling back to name', () => {
        const prices: PriceEntry[] = [
            {
                id: '1',
                productName: 'Product A',
                price: 10,
                supermarket: 'Market 1',
                timestamp: '2024-01-01',
            },
            {
                id: '2',
                productName: 'Product A',
                price: 14,
                supermarket: 'Market 2',
                timestamp: '2024-01-01',
            }
        ];
        // Max: 14, Min: 10 -> Savings: 4
        const savings = calculatePotentialSavings(prices);
        expect(savings).toBe(4);
    });
});
