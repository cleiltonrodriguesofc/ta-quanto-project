export interface Product {
  barcode: string;
  name: string;
  brand?: string;
  imageUrl?: string;
  avgPrice?: number;
  bestPrice?: number;
  supermarket?: string;
  createdAt?: string;
}

export interface ScannedProduct extends Product {
  price?: number;
  supermarket?: string;
  quantity?: string | number;
  rawResponse?: any;
}
