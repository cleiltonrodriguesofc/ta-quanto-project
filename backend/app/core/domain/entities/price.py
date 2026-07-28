from dataclasses import dataclass
from typing import Optional

@dataclass
class Price:
    id: str
    product_name: str
    price: float
    supermarket: str
    barcode: Optional[str] = None
    brand: Optional[str] = None
    image_url: Optional[str] = None
    user_id: Optional[str] = None
    created_at: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

@dataclass
class NewPrice:
    product_name: str
    price: float
    supermarket: str
    barcode: str
    brand: Optional[str] = None
    image_url: Optional[str] = None
    user_id: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
