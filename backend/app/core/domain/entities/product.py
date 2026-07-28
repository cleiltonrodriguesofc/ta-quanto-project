from dataclasses import dataclass
from typing import Optional

@dataclass
class Product:
    barcode: str
    name: str
    brand: Optional[str] = None
    image_url: Optional[str] = None
    avg_price: Optional[float] = None
    supermarket: Optional[str] = None
    created_at: Optional[str] = None
