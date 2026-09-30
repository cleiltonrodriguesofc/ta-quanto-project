import asyncio
import logging
import time
from datetime import datetime, timezone

from fastapi import FastAPI, Response, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.core.presentation.routers import auth, prices, products, users, supermarkets, basket
from app.core.infrastructure.database.session import engine, AsyncSessionLocal
from app.core.infrastructure.database.models import Base

logger = logging.getLogger("taquanto.heartbeat")

# Registra o instante em que o processo subiu (para calcular uptime)
_PROCESS_START = time.monotonic()

# Intervalo do heartbeat: 10 min.
# - Supabase free pausa após 7 dias sem acesso → 10 min é mais que suficiente.
# - UptimeRobot pingando /health a cada 5 min já resolve o Render;
#   este heartbeat é o plano B para quando o Render estiver acordado
#   mas sem tráfego externo por um período longo.
# - SELECT 1 usa <1KB de memória e <0.1ms de CPU → impacto zero no limite
#   de compute do Supabase free (500 horas/mês).
_DB_HEARTBEAT_INTERVAL_SECONDS = 10 * 60  # 10 minutos

_heartbeat_task: asyncio.Task | None = None


async def _db_heartbeat_loop() -> None:
    """Loop assíncrono que faz um SELECT 1 periódico no banco.

    Roda como asyncio.Task — sem thread extra, sem conexão persistente.
    A cada ciclo abre uma conexão do pool, executa SELECT 1 e a devolve
    imediatamente ao pool (footprint de memória ~zero entre os pings).
    """
    while True:
        await asyncio.sleep(_DB_HEARTBEAT_INTERVAL_SECONDS)
        try:
            async with AsyncSessionLocal() as session:
                await session.execute(text("SELECT 1"))
            logger.debug("[DB Heartbeat] ping ok")
        except asyncio.CancelledError:
            # Servidor encerrando — sai limpo
            raise
        except Exception as exc:
            # Não deixa o loop morrer por falha pontual de rede
            logger.warning("[DB Heartbeat] falha no ping: %s", exc)


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
async def on_startup() -> None:
    """Cria as tabelas e inicia o heartbeat do banco."""
    global _heartbeat_task

    # Garante que o schema existe
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Inicia o heartbeat em background (não bloqueia o startup)
    _heartbeat_task = asyncio.create_task(
        _db_heartbeat_loop(),
        name="db-heartbeat",
    )
    logger.info(
        "[DB Heartbeat] iniciado — intervalo: %ds", _DB_HEARTBEAT_INTERVAL_SECONDS
    )


@app.on_event("shutdown")
async def on_shutdown() -> None:
    """Cancela o heartbeat limpo ao encerrar o servidor."""
    global _heartbeat_task
    if _heartbeat_task and not _heartbeat_task.done():
        _heartbeat_task.cancel()
        try:
            await _heartbeat_task
        except asyncio.CancelledError:
            pass
    logger.info("[DB Heartbeat] encerrado.")



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
