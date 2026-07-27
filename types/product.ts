export interface Product {
  barcode: string;
  name: string;
  brand?: string;
  imageUrl?: string;
  avgPrice?: number;
  createdAt?: string;
}

export interface ScannedProduct extends Product {
  price?: number;
  supermarket?: string;
  quantity?: string | number;
  rawResponse?: any;
}
