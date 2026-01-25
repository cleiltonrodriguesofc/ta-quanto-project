export interface ScannedProduct {
    barcode: string;
    name: string;
    brand?: string;
    quantity?: string;
    imageUrl?: string;
    rawResponse?: any;
}
