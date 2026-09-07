import { Price } from '@/src/domain/entities';

export interface PriceLocation {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface PriceEntry extends Omit<Price, 'id'> {
  id: string;
  location?: PriceLocation;
}