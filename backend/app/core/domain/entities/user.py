from dataclasses import dataclass
from typing import Optional

@dataclass
class UserProfile:
    id: str
    name: str
    email: str
    avatar_url: Optional[str] = None
    level: int = 1
    xp: int = 0
    contributions: int = 0
    saved_amount: float = 0.0
    streak_days: int = 0
    badge: str = "Iniciante"
    created_at: Optional[str] = None
