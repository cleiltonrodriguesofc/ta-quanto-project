export interface BasketItem {
  id: string;
  barcode: string;
  productName: string;
  price: number;
  quantity: number;
  supermarket: string;
  imageUrl?: string;
  timestamp: string;
}

export type NewBasketItem = Omit<BasketItem, 'id'>;

// ─── Saved Basket (named lists persisted in Supabase) ────────────────────────

export interface SavedBasket {
  id: string;
  userId: string;
  name: string;
  supermarket: string;
  totalAmount: number;
  itemCount: number;
  createdAt: string;
  updatedAt?: string;
}

export interface SavedBasketItem {
  id: string;
  basketId: string;
  barcode: string;
  productName: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

export type NewSavedBasketItem = Omit<SavedBasketItem, 'id' | 'basketId'>;
