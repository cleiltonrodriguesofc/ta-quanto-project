import {
  apiAuthService,
  apiPriceRepository,
  apiSavedBasketRepository,
  apiProductRepository,
  apiUserRepository,
  apiSupermarketRepository,
} from '@/src/infrastructure/api';

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

export const lookupProductUseCase = new LookupProductUseCase(apiProductRepository);

export const getProductsBySupermarketUseCase = new GetProductsBySupermarketUseCase(
  apiPriceRepository,
);

export const getUserProfileUseCase = new GetUserProfileUseCase(
  apiUserRepository,
  asyncStorageUserRepository,
);

export const saveUserProfileUseCase = new SaveUserProfileUseCase(
  asyncStorageUserRepository,
  apiUserRepository,
);

export const uploadAvatarUseCase = new UploadAvatarUseCase(apiUserRepository);

export const manageBasketUseCase = new ManageBasketUseCase(
  asyncStorageBasketRepository,
  apiSavedBasketRepository as any,
);

export const manageSavedBasketUseCase = new ManageSavedBasketUseCase(
  apiSavedBasketRepository,
);

export const getSupermarketsUseCase = new GetSupermarketsUseCase(
  apiSupermarketRepository,
  asyncStorageSupermarketRepository,
);

export const getNearestSupermarketUseCase = new GetNearestSupermarketUseCase(
  apiSupermarketRepository,
);

export * from './use-cases';
