import { PriceEntry } from '@/types/price';
import { UserProfile } from '@/types/user';
import {
  getCommunityPricesUseCase,
  registerPriceUseCase,
  getPricesByBarcodeUseCase,
  getUserProfileUseCase,
  saveUserProfileUseCase,
  uploadAvatarUseCase,
  lookupProductUseCase,
} from '@/src/application';
import { supabasePriceRepository } from '@/src/infrastructure/supabase';
import { NewPrice } from '@/src/domain/entities';

export async function checkApiConnection(): Promise<boolean> {
  return true;
}

export async function fetchPrices(barcode?: string): Promise<PriceEntry[]> {
  try {
    const prices = await getCommunityPricesUseCase.execute(barcode);
    return prices as unknown as PriceEntry[];
  } catch (error) {
    console.error('[API Facade] fetchPrices error:', error);
    return [];
  }
}

export async function postPrice(price: Partial<PriceEntry>): Promise<PriceEntry> {
  const newPrice: NewPrice = {
    barcode: price.barcode || '',
    productName: price.productName || '',
    price: price.price || 0,
    supermarket: price.supermarket || '',
    brand: price.brand,
    imageUrl: price.imageUrl,
    userId: price.userId,
    timestamp: price.timestamp || new Date().toISOString(),
  };

  const saved = await registerPriceUseCase.execute(newPrice);
  return saved as unknown as PriceEntry;
}

export async function getPricesForProduct(barcode: string): Promise<PriceEntry[]> {
  const prices = await getPricesByBarcodeUseCase.execute(barcode);
  return prices as unknown as PriceEntry[];
}

export async function getPricesByUser(userId: string): Promise<PriceEntry[]> {
  try {
    const prices = await supabasePriceRepository.getByUser(userId);
    return prices as unknown as PriceEntry[];
  } catch (error) {
    console.error('[API Facade] getPricesByUser error:', error);
    return [];
  }
}

export async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  const user = await getUserProfileUseCase.execute(userId);
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

export async function updateUserProfile(profile: UserProfile): Promise<UserProfile> {
  const user = {
    id: profile.id,
    displayName: profile.displayName,
    avatarId: profile.avatarId,
    joinedDate: profile.joinedDate,
    stats: profile.stats,
    level: profile.level,
    points: profile.points,
    settings: profile.settings,
  };

  await saveUserProfileUseCase.execute(user);
  return profile;
}

export async function uploadAvatar(userId: string, imageUri: string): Promise<string> {
  return uploadAvatarUseCase.execute(userId, imageUri);
}

export async function fetchProductFromCosmos(barcode: string) {
  const product = await lookupProductUseCase.execute(barcode);
  if (!product) return null;
  return {
    barcode: product.barcode,
    name: product.name,
    brand: product.brand,
    imageUrl: product.imageUrl,
    price: product.avgPrice,
  };
}

export async function fetchProductFromOpenFoodFacts(barcode: string) {
  return fetchProductFromCosmos(barcode);
}

export async function fetchProductFromUPCitemdb(barcode: string) {
  return fetchProductFromCosmos(barcode);
}

export async function fetchProductMetadata(barcode: string) {
  return lookupProductUseCase.execute(barcode);
}

export async function uploadPricesBatch(prices: PriceEntry[]): Promise<void> {
  for (const price of prices) {
    await postPrice(price);
  }
}

// Legacy api object facade for backward compatibility
export const api = {
  getPrices: fetchPrices,
  postPrice,
  getPricesForProduct,
  getPricesByUser,
  fetchUserProfile,
  updateUserProfile,
  uploadAvatar,
  uploadPricesBatch,
  fetchProductMetadata,
  checkApiConnection,
};
