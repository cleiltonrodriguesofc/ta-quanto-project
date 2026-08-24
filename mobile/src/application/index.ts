import {
  apiAuthService,
} from '@/src/infrastructure/api';

import {
  supabasePriceRepository,
  supabaseProductRepository,
  supabaseUserRepository,
  supabaseSupermarketRepository,
  supabaseSavedBasketRepository,
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

// Auth: FastAPI JWT próprio (não muda)
export const authUseCases = new AuthUseCases(apiAuthService);

// Dados: Supabase como banco de dados
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
  supabaseSavedBasketRepository as any,
);

export const manageSavedBasketUseCase = new ManageSavedBasketUseCase(
  supabaseSavedBasketRepository,
);

export const getSupermarketsUseCase = new GetSupermarketsUseCase(
  supabaseSupermarketRepository,
  asyncStorageSupermarketRepository,
);

export const getNearestSupermarketUseCase = new GetNearestSupermarketUseCase(
  supabaseSupermarketRepository,
);

export * from './use-cases';
