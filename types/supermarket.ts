export interface Supermarket {
    id: string;
    name: string;
    type?: 'Supermarket' | 'Small Market' | 'Fruit Store/Sacolão';
    address?: string;
    latitude?: number;
    longitude?: number;
    count?: number;
}
