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
import { apiClient } from '@/src/infrastructure/api/apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PRODUCT_CACHE_KEY = 'taquanto_products';

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
  // Return as soon as the device has durably stored the report. Network sync
  // runs after the save and cannot delay the registration screen.
  void import('./syncService').then(({ syncOfflineData }) => syncOfflineData()).catch(error => {
    console.warn('[storage] Background price sync failed:', error);
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
    id: user.id, displayName: user.displayName, avatarId: user.avatarId,
    joinedDate: user.joinedDate, stats: user.stats, level: user.level,
    points: user.points, settings: user.settings,
  } as unknown as UserProfile;
}
export const getLocalProfile = getStoredProfile;
export const getUserProfile = getStoredProfile;

export async function storeProfile(profile: UserProfile): Promise<void> {
  await asyncStorageUserRepository.save({
    id: profile.id, displayName: profile.displayName, avatarId: profile.avatarId,
    joinedDate: profile.joinedDate, stats: profile.stats, level: profile.level,
    points: profile.points, settings: profile.settings,
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
  const stored = await AsyncStorage.getItem(PRODUCT_CACHE_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const getCachedProductByBarcode = async (barcode: string): Promise<Product | null> => {
  const products = await getLocalProducts();
  return products.find(product => product.barcode === barcode) || null;
};

export const saveLocalProducts = async (products: Product[]): Promise<void> => {
  await AsyncStorage.setItem(PRODUCT_CACHE_KEY, JSON.stringify(products));
};

export async function syncProductCatalogToDevice(): Promise<number> {
  const response = await apiClient.get<any[]>('/api/v1/products/catalog', {
    params: { limit: 200 },
  });
  const incoming: Product[] = response.data.map((item: any) => ({
    barcode: String(item.barcode),
    name: item.name,
    brand: item.brand || undefined,
    imageUrl: item.image_url || undefined,
    avgPrice: item.avg_price ?? undefined,
    createdAt: item.updated_at || new Date().toISOString(),
    source: item.source || undefined,
    sourceLicense: item.source_license || undefined,
  }));
  const current = await getLocalProducts();
  const byBarcode = new Map<string, Product>(current.map(product => [product.barcode, product] as const));
  for (const product of incoming) {
    const previous = byBarcode.get(product.barcode);
    byBarcode.set(product.barcode, {
      ...previous,
      ...product,
      brand: product.brand || previous?.brand,
      imageUrl: product.imageUrl || previous?.imageUrl,
    });
  }
  await saveLocalProducts(Array.from(byBarcode.values()));
  return incoming.length;
}

export const getProductByBarcode = async (barcode: string): Promise<Product | null> => {
  const existingLookup = productLookupsInFlight.get(barcode);
  if (existingLookup) return existingLookup;

  const lookup = findOrFetchProductByBarcode(barcode);
  productLookupsInFlight.set(barcode, lookup);
  try {
    return await lookup;
  } finally {
    productLookupsInFlight.delete(barcode);
  }
};

const productLookupsInFlight = new Map<string, Promise<Product | null>>();

const findOrFetchProductByBarcode = async (barcode: string): Promise<Product | null> => {
  const local = await getLocalProducts();
  const cached = local.find(product => product.barcode === barcode);
  if (cached) return cached;

  const product = await lookupProductUseCase.execute(barcode);
  if (!product) return null;
  await saveLocalProducts([...local.filter(item => item.barcode !== barcode), product]);
  return product;
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
