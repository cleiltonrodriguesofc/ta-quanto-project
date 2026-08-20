import { Price } from '@/src/domain/entities';

export interface PriceLocation {
  latitude: number;
  longitude: number;
}

export interface PriceEntry extends Omit<Price, 'id'> {
  id: string;
  location?: PriceLocation;
}