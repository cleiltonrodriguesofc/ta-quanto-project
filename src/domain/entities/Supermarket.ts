export interface SupermarketLocation {
  latitude: number;
  longitude: number;
}

export interface Supermarket {
  id: number | string;
  name: string;
  type?: string;
  address?: string;
  location?: SupermarketLocation;
}

export type NewSupermarket = Omit<Supermarket, 'id'>;
