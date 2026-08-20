"""
conftest.py — fixtures compartilhadas para unit e integration tests.

Estratégia de banco para testes:
  - SQLite em memória (aiosqlite) — sem precisar de PostgreSQL instalado.
  - Engine compartilhado pela sessão; tabelas criadas uma vez.
  - Cada teste usa uma sessão nova com autocommit liberado (sem SAVEPOINT aninhado).
  - O override do get_db injeta a sessão de teste no FastAPI.
"""
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.infrastructure.database.session import Base, get_db
from app.main import app

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest_asyncio.fixture(scope="session")
async def engine():
    """Motor assíncrono SQLite em memória, compartilhado pela sessão de testes."""
    _engine = create_async_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    async with _engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield _engine
    async with _engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await _engine.dispose()


@pytest_asyncio.fixture()
async def client(engine):
    """
    AsyncClient com override de get_db.
    Cada teste recebe uma sessão nova (autocommit pelo app).
    O isolamento é garantido pelo engine compartilhado (SQLite em memória) e
    pelo fato de que cada suite limpa os dados de forma independente.
    """
    # Fábrica de sessão ligada ao engine de testes
    test_session_factory = async_sessionmaker(
        engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )

    async def override_get_db():
        async with test_session_factory() as session:
            try:
                yield session
            finally:
                await session.close()

    app.dependency_overrides[get_db] = override_get_db
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as ac:
        yield ac
    app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# Helpers reutilizáveis
# ---------------------------------------------------------------------------

async def _register_user(
    client: AsyncClient,
    email: str = "test@example.com",
    password: str = "Senha@123",
    name: str = "Usuário Teste",
) -> dict:
    """Registra um usuário e retorna o payload de tokens."""
    response = await client.post("/api/v1/auth/register", json={
        "name": name,
        "email": email,
        "password": password,
    })
    assert response.status_code == 201, response.text
    return response.json()


async def _auth_headers(
    client: AsyncClient,
    email: str = "test@example.com",
    password: str = "Senha@123",
) -> dict:
    """Registra (ou faz login) e retorna headers Authorization."""
    try:
        data = await _register_user(client, email, password)
    except AssertionError:
        resp = await client.post("/api/v1/auth/login", json={"email": email, "password": password})
        data = resp.json()
    return {"Authorization": f"Bearer {data['access_token']}"}
