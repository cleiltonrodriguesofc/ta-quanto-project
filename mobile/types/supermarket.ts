import { SupermarketLocation } from '@/src/domain/entities';

export { SupermarketLocation };

export interface Supermarket {
  id: string | number;
  name: string;
  type?: string;
  address?: string;
  location?: SupermarketLocation;
}
