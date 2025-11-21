export interface PriceEntry {
  id: string;
  userId?: string;
  productName: string;
  price: number;
  supermarket: string;
  quantity?: string;
  timestamp: string;
  barcode?: string;
  brand?: string;
  imageUrl?: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
}