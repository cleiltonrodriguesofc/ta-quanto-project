export interface PriceEntry {
  id: string;
  productName: string;
  price: number;
  supermarket: string;
  quantity?: string;
  timestamp: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
}