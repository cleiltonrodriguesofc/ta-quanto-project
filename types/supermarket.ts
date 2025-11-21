export interface Supermarket {
    id: number;
    name: string;
    type: 'Supermarket' | 'Small Market' | 'Fruit Store/Sacolão';
    address: string;
    latitude?: number;
    longitude?: number;
}
