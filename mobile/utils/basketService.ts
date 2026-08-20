import { manageSavedBasketUseCase } from '@/src/application';
import { BasketItem, SavedBasket, SavedBasketItem } from '@/src/domain/entities';

export interface BasketMetadata extends SavedBasket { }

export const createBasketInSupabase = async (
  userId: string,
  name: string,
  supermarket: string,
  items: BasketItem[],
  totalAmount: number,
) => {
  return manageSavedBasketUseCase.create(userId, name, supermarket, items, totalAmount);
};

export const fetchUserBaskets = async (userId: string) => {
  return manageSavedBasketUseCase.getAll(userId);
};

export const fetchBasketItems = async (basketId: string) => {
  return manageSavedBasketUseCase.getItems(basketId);
};

export const updateBasketInSupabase = async (
  userId: string,
  basketId: string,
  items: BasketItem[],
  totalAmount: number,
) => {
  await manageSavedBasketUseCase.update(userId, basketId, items, totalAmount);
  return { success: true };
};

export const renameBasketInSupabase = async (
  userId: string,
  basketId: string,
  newName: string,
) => {
  await manageSavedBasketUseCase.rename(userId, basketId, newName);
  return { success: true };
};

export const deleteBasketFromSupabase = async (userId: string, basketId: string) => {
  await manageSavedBasketUseCase.delete(userId, basketId);
  return { success: true };
};
