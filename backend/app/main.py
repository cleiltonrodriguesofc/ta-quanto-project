import time
from datetime import datetime, timezone

from fastapi import FastAPI, Response, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.core.presentation.routers import auth, prices, products, users, supermarkets, basket
from app.core.infrastructure.database.session import engine, AsyncSessionLocal
from app.core.infrastructure.database.models import Base

# Registra o instante em que o processo subiu (para calcular uptime)
_PROCESS_START = time.monotonic()

app = FastAPI(
    title="TaQuanto? API",
    description="Backend da plataforma TaQuanto? — comparação de preços de supermercado.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS — permite requests do Expo Go e builds do app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Em produção, restringir para o domínio do app
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router)
app.include_router(prices.router)
app.include_router(products.router)
app.include_router(users.router)
app.include_router(supermarkets.router)
app.include_router(basket.router)


@app.on_event("startup")
async def on_startup():
    """Cria as tabelas no banco se não existirem (desenvolvimento)."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


@app.get("/")
async def root():
    return {"status": "ok", "service": "taquanto-api"}


@app.get("/health")
async def health_check(response: Response):
    """
    Health check completo:
    - Verifica conectividade com o banco de dados (SELECT 1)
    - Mede a latência da query
    - Retorna uptime do processo e timestamp UTC
    - HTTP 200 se tudo ok, HTTP 503 se o DB estiver inacessível
    """
    db_ok = False
    db_latency_ms: float | None = None
    db_error: str | None = None

    try:
        t0 = time.monotonic()
        async with AsyncSessionLocal() as session:
            await session.execute(text("SELECT 1"))
        db_latency_ms = round((time.monotonic() - t0) * 1000, 2)
        db_ok = True
    except Exception as exc:
        db_error = str(exc)

    uptime_seconds = round(time.monotonic() - _PROCESS_START, 1)

    if not db_ok:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE

    return {
        "status": "ok" if db_ok else "degraded",
        "service": "taquanto-api",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "uptime_seconds": uptime_seconds,
        "database": {
            "connected": db_ok,
            "latency_ms": db_latency_ms,
            **({"error": db_error} if db_error else {}),
        },
    }
