import { AsyncStoragePriceRepository } from './AsyncStoragePriceRepository';
import { AsyncStorageUserRepository } from './AsyncStorageUserRepository';
import { AsyncStorageSupermarketRepository } from './AsyncStorageSupermarketRepository';
import { AsyncStorageBasketRepository } from './AsyncStorageBasketRepository';

export const asyncStoragePriceRepository = new AsyncStoragePriceRepository();
export const asyncStorageUserRepository = new AsyncStorageUserRepository();
export const asyncStorageSupermarketRepository = new AsyncStorageSupermarketRepository();
export const asyncStorageBasketRepository = new AsyncStorageBasketRepository();

export {
  AsyncStoragePriceRepository,
  AsyncStorageUserRepository,
  AsyncStorageSupermarketRepository,
  AsyncStorageBasketRepository,
};
