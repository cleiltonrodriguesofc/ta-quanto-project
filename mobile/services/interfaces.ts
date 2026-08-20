import { Supermarket } from '@/types/supermarket';
import { PriceEntry } from '@/types/price';
import { UserProfile } from '@/types/user';

export interface ISupermarketService {
  getAll(): Promise<Supermarket[]>;
  add(name: string): Promise<Supermarket>;
  getNearest(lat: number, lon: number, supermarkets: Supermarket[]): Supermarket | null;
}

export interface IProductService {
  getByBarcode(barcode: string): Promise<any | null>;
  save(product: any): Promise<void>;
}

export interface IPriceService {
  getAll(barcode?: string): Promise<PriceEntry[]>;
  add(price: PriceEntry): Promise<void>;
  batchUpload(prices: PriceEntry[]): Promise<void>;
}

export interface IUserService {
  get(id: string): Promise<UserProfile | null>;
  save(user: UserProfile): Promise<void>;
}
