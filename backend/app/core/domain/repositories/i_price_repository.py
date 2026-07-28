from abc import ABC, abstractmethod
from typing import List, Optional
from app.core.domain.entities.price import Price, NewPrice

class IPriceRepository(ABC):
    @abstractmethod
    async def get_all(self, limit: int = 50) -> List[Price]:
        pass

    @abstractmethod
    async def get_by_barcode(self, barcode: str) -> List[Price]:
        pass

    @abstractmethod
    async def get_by_user(self, user_id: str) -> List[Price]:
        pass

    @abstractmethod
    async def add(self, price: NewPrice) -> Price:
        pass

    @abstractmethod
    async def batch_upload(self, prices: List[NewPrice]) -> int:
        pass
