export interface ScannedProduct {
    barcode: string;
    name: string;
    brand?: string;
    quantity?: string;
    imageUrl?: string;
    rawResponse?: any;
}

export interface Product {
    id?: string; // Supabase might not return ID if we just select specific fields, but usually it has one? Actually check schema. 
    // The schema from check script didn't show ID, but it likely has one. 
    // Wait, the script result: { barcode: '...', ... } 
    // It seems 'barcode' might be the PK? Or 'id'. 
    // Let's assume standard 'id' (uuid) or 'barcode' as id.
    // For safety, let's include generic fields.
    barcode: string;
    name: string;
    brand?: string;
    imageUrl?: string;
    createdAt?: string;
    bestPrice?: number;
    supermarket?: string;
}

