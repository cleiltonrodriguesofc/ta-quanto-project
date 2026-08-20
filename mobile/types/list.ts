export interface ShoppingListItem {
    id: string;
    productName: string;
    isChecked: boolean;
    quantity?: string;
    estimatedPrice?: number;
}

export interface ShoppingList {
    id: string;
    name: string;
    items: ShoppingListItem[];
    createdAt: string;
    updatedAt: string;
}
