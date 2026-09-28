from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.presentation.routers import auth, prices, products, users, supermarkets, basket
from app.core.infrastructure.database.session import engine
from app.core.infrastructure.database.models import Base

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
async def health_check():
    return {"status": "ok", "service": "taquanto-api"}
