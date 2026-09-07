import {
  apiAuthService,
  apiPriceRepository,
  apiSavedBasketRepository,
} from '@/src/infrastructure/api';

import {
  supabaseProductRepository,
  supabaseUserRepository,
  supabaseSupermarketRepository,
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

// Dados: FastAPI backend para preços e carrinhos salvos (evita erros RLS do Supabase)
export const getCommunityPricesUseCase = new GetCommunityPricesUseCase(
  apiPriceRepository,
  asyncStoragePriceRepository,
);

export const getPricesByBarcodeUseCase = new GetPricesByBarcodeUseCase(
  apiPriceRepository,
  asyncStoragePriceRepository,
);

export const registerPriceUseCase = new RegisterPriceUseCase(
  asyncStoragePriceRepository,
  apiPriceRepository,
);

export const lookupProductUseCase = new LookupProductUseCase(supabaseProductRepository);

export const getProductsBySupermarketUseCase = new GetProductsBySupermarketUseCase(
  apiPriceRepository,
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
  apiSavedBasketRepository as any,
);

export const manageSavedBasketUseCase = new ManageSavedBasketUseCase(
  apiSavedBasketRepository,
);

export const getSupermarketsUseCase = new GetSupermarketsUseCase(
  supabaseSupermarketRepository,
  asyncStorageSupermarketRepository,
);

export const getNearestSupermarketUseCase = new GetNearestSupermarketUseCase(
  supabaseSupermarketRepository,
);

export * from './use-cases';
