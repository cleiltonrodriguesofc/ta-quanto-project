import { PriceEntry } from '@/types/price';
import { UserProfile } from '@/types/user';
import {
  asyncStoragePriceRepository,
  asyncStorageUserRepository,
  asyncStorageSupermarketRepository,
  asyncStorageBasketRepository,
} from '@/src/infrastructure/storage';
import { getPricesByBarcodeUseCase, lookupProductUseCase } from '@/src/application';
import { Supermarket, Product } from '@/src/domain/entities';
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function getStoredPrices(barcode?: string): Promise<PriceEntry[]> {
  const prices = await asyncStoragePriceRepository.getAll(barcode);
  return prices as unknown as PriceEntry[];
}
export const getLocalPrices = getStoredPrices;
export const getPricesByBarcode = async (barcode: string): Promise<PriceEntry[]> => {
  const prices = await getPricesByBarcodeUseCase.execute(barcode);
  return prices as unknown as PriceEntry[];
};

export async function storePrice(price: Partial<PriceEntry>): Promise<PriceEntry> {
  const added = await asyncStoragePriceRepository.add({
    barcode: price.barcode || '',
    productName: price.productName || '',
    price: price.price || 0,
    supermarket: price.supermarket || '',
    brand: price.brand,
    imageUrl: price.imageUrl,
    userId: price.userId,
    timestamp: price.timestamp || new Date().toISOString(),
  });
  return added as unknown as PriceEntry;
}
export const savePriceEntry = storePrice;
export const saveLocalPrices = async (prices: PriceEntry[]) => {
  await asyncStoragePriceRepository.batchUpload(prices as any);
};

export async function getStoredProfile(userId?: string): Promise<UserProfile | null> {
  const user = await asyncStorageUserRepository.getById(userId || '');
  if (!user) return null;
  return {
    id: user.id,
    displayName: user.displayName,
    avatarId: user.avatarId,
    joinedDate: user.joinedDate,
    stats: user.stats,
    level: user.level,
    points: user.points,
    settings: user.settings,
  } as unknown as UserProfile;
}
export const getLocalProfile = getStoredProfile;
export const getUserProfile = getStoredProfile;

export async function storeProfile(profile: UserProfile): Promise<void> {
  await asyncStorageUserRepository.save({
    id: profile.id,
    displayName: profile.displayName,
    avatarId: profile.avatarId,
    joinedDate: profile.joinedDate,
    stats: profile.stats,
    level: profile.level,
    points: profile.points,
    settings: profile.settings,
  });
}
export const saveLocalProfile = storeProfile;
export const saveUserProfile = storeProfile;

export async function getStoredSupermarkets(): Promise<Supermarket[]> {
  return asyncStorageSupermarketRepository.getAll();
}
export const getLocalSupermarkets = getStoredSupermarkets;

export async function storeSupermarket(supermarket: Supermarket): Promise<void> {
  await asyncStorageSupermarketRepository.add(supermarket);
}
export const saveLocalSupermarkets = async (markets: Supermarket[]) => {
  await asyncStorageSupermarketRepository.saveAll(markets);
};

export const getLocalProducts = async (): Promise<Product[]> => {
  const stored = await AsyncStorage.getItem('taquanto_products');
  return stored ? JSON.parse(stored) : [];
};

export const saveLocalProducts = async (products: Product[]): Promise<void> => {
  await AsyncStorage.setItem('taquanto_products', JSON.stringify(products));
};

export const getProductByBarcode = async (barcode: string): Promise<Product | null> => {
  return lookupProductUseCase.execute(barcode);
};

export async function getStoredBasket(): Promise<any[]> {
  return asyncStorageBasketRepository.getItems();
}

export async function storeBasket(basket: any[]): Promise<void> {
  await asyncStorageBasketRepository.saveAll(basket);
}

export async function clearStoredPrices(): Promise<void> {
  await asyncStoragePriceRepository.clear();
}
export const clearAllPrices = clearStoredPrices;

export async function clearAllData(): Promise<void> {
  await AsyncStorage.clear();
}