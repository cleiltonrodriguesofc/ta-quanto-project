from dataclasses import dataclass, field
from typing import Optional, List

@dataclass
class BasketItem:
    barcode: str
    product_name: str
    price: float
    supermarket: str
    quantity: int = 1
    image_url: Optional[str] = None
    brand: Optional[str] = None

@dataclass
class SavedBasket:
    id: str
    user_id: str
    name: str
    supermarket: str
    total_amount: float
    created_at: str
    updated_at: str
    items_count: int = 0

@dataclass
class SavedBasketItem:
    id: str
    basket_id: str
    barcode: str
    product_name: str
    price: float
    quantity: int
    image_url: Optional[str] = None
    brand: Optional[str] = None
