from dataclasses import dataclass
from typing import Optional

@dataclass
class Supermarket:
    id: str
    name: str
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    distance_km: Optional[float] = None
