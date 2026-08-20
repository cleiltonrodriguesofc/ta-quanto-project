"""
Testes de integração — Supermarkets Router
Cobre: GET /supermarkets (público), POST /supermarkets (autenticado).
"""
import pytest
from httpx import AsyncClient
from tests.conftest import _register_user


@pytest.mark.asyncio
async def test_list_supermarkets_empty(client: AsyncClient):
    """Lista de supermercados vazia no banco de teste limpo."""
    response = await client.get("/api/v1/supermarkets/")
    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.asyncio
async def test_create_supermarket_unauthenticated(client: AsyncClient):
    """POST sem token deve retornar 401 ou 403 (HTTPBearer)."""
    response = await client.post("/api/v1/supermarkets/", json={"name": "Extra"})
    assert response.status_code in (401, 403)


@pytest.mark.asyncio
async def test_create_supermarket_authenticated(client: AsyncClient):
    """POST com token cria supermercado e retorna 201."""
    tokens = await _register_user(client, "super@example.com")
    headers = {"Authorization": f"Bearer {tokens['access_token']}"}

    response = await client.post("/api/v1/supermarkets/", json={
        "name": "Extra Supermercados",
        "address": "Av. Paulista, 1000",
        "latitude": -23.5617,
        "longitude": -46.6559,
    }, headers=headers)

    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Extra Supermercados"
    assert data["address"] == "Av. Paulista, 1000"
    assert data["latitude"] == -23.5617
    assert "id" in data


@pytest.mark.asyncio
async def test_list_supermarkets_after_creation(client: AsyncClient):
    """Supermercado criado deve aparecer na listagem."""
    tokens = await _register_user(client, "super2@example.com")
    headers = {"Authorization": f"Bearer {tokens['access_token']}"}

    await client.post("/api/v1/supermarkets/", json={"name": "Carrefour"}, headers=headers)

    response = await client.get("/api/v1/supermarkets/")
    assert response.status_code == 200
    names = [s["name"] for s in response.json()]
    assert "Carrefour" in names


@pytest.mark.asyncio
async def test_create_supermarket_minimal(client: AsyncClient):
    """POST com apenas 'name' deve funcionar (demais campos são opcionais)."""
    tokens = await _register_user(client, "supermin@example.com")
    headers = {"Authorization": f"Bearer {tokens['access_token']}"}

    response = await client.post("/api/v1/supermarkets/", json={"name": "Mercadinho"}, headers=headers)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Mercadinho"
    assert data["latitude"] is None
    assert data["longitude"] is None
