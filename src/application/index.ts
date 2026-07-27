import {
  supabasePriceRepository,
  supabaseProductRepository,
  supabaseUserRepository,
  supabaseSupermarketRepository,
  supabaseBasketRepository,
  supabaseSavedBasketRepository,
  supabaseAuthService,
} from '@/src/infrastructure/supabase';

import {
  asyncStoragePriceRepository,
  asyncStorageUserRepository,
  asyncStorageSupermarketRepository,
  asyncStorageBasketRepository,
} from '@/src/infrastructure/storage';

import {
  GetCommunityPricesUseCase,
  GetPricesByBarcodeUseCase,
  RegisterPriceUseCase,
  LookupProductUseCase,
  GetProductsBySupermarketUseCase,
  GetUserProfileUseCase,
  SaveUserProfileUseCase,
  UploadAvatarUseCase,
  ManageBasketUseCase,
  ManageSavedBasketUseCase,
  AuthUseCases,
  GetSupermarketsUseCase,
  GetNearestSupermarketUseCase,
} from './use-cases';

// Pre-instantiated use cases with default dependencies
export const getCommunityPricesUseCase = new GetCommunityPricesUseCase(
  supabasePriceRepository,
  asyncStoragePriceRepository,
);

export const getPricesByBarcodeUseCase = new GetPricesByBarcodeUseCase(
  supabasePriceRepository,
  asyncStoragePriceRepository,
);

export const registerPriceUseCase = new RegisterPriceUseCase(
  asyncStoragePriceRepository,
  supabasePriceRepository,
);

export const lookupProductUseCase = new LookupProductUseCase(supabaseProductRepository);

export const getProductsBySupermarketUseCase = new GetProductsBySupermarketUseCase(
  supabasePriceRepository,
);

export const getUserProfileUseCase = new GetUserProfileUseCase(
  supabaseUserRepository,
  asyncStorageUserRepository,
);

export const saveUserProfileUseCase = new SaveUserProfileUseCase(
  asyncStorageUserRepository,
  supabaseUserRepository,
);

export const uploadAvatarUseCase = new UploadAvatarUseCase(supabaseUserRepository);

export const manageBasketUseCase = new ManageBasketUseCase(
  asyncStorageBasketRepository,
  supabaseBasketRepository,
);

export const manageSavedBasketUseCase = new ManageSavedBasketUseCase(
  supabaseSavedBasketRepository,
);

export const authUseCases = new AuthUseCases(supabaseAuthService);

export const getSupermarketsUseCase = new GetSupermarketsUseCase(
  supabaseSupermarketRepository,
  asyncStorageSupermarketRepository,
);

export const getNearestSupermarketUseCase = new GetNearestSupermarketUseCase(
  supabaseSupermarketRepository,
);

export * from './use-cases';
