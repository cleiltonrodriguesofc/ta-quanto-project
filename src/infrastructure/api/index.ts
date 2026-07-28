export * from './apiClient';
export * from './ApiPriceRepository';
export * from './ApiProductRepository';
export * from './ApiUserRepository';
export * from './ApiSavedBasketRepository';
export * from './ApiSupermarketRepository';
export * from './ApiAuthService';

// Initialize the instances
import { ApiPriceRepository } from './ApiPriceRepository';
import { ApiProductRepository } from './ApiProductRepository';
import { ApiUserRepository } from './ApiUserRepository';
import { ApiSavedBasketRepository } from './ApiSavedBasketRepository';
import { ApiSupermarketRepository } from './ApiSupermarketRepository';
import { ApiAuthService } from './ApiAuthService';

export const apiPriceRepository = new ApiPriceRepository();
export const apiProductRepository = new ApiProductRepository();
export const apiUserRepository = new ApiUserRepository();
export const apiSavedBasketRepository = new ApiSavedBasketRepository();
export const apiSupermarketRepository = new ApiSupermarketRepository();
export const apiAuthService = new ApiAuthService();
