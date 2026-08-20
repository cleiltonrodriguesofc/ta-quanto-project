"""
Testes de integração — Prices Router
Cobre: GET /prices, GET /prices/barcode/{barcode}, POST /prices (autenticado).
"""
import pytest
from httpx import AsyncClient
from tests.conftest import _register_user


@pytest.mark.asyncio
async def test_get_prices_empty(client: AsyncClient):
    """Lista de preços vazia no banco de teste limpo."""
    response = await client.get("/api/v1/prices/")
    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.asyncio
async def test_register_price_unauthenticated(client: AsyncClient):
    """POST sem token deve retornar 401 ou 403 (HTTPBearer)."""
    response = await client.post("/api/v1/prices/", json={
        "product_name": "Feijão",
        "barcode": "7891234567890",
        "price": 8.90,
        "supermarket": "Extra",
    })
    assert response.status_code in (401, 403)


@pytest.mark.asyncio
async def test_register_price_authenticated(client: AsyncClient):
    """POST com token válido deve criar o preço e retornar 201."""
    tokens = await _register_user(client, "prices@example.com")
    headers = {"Authorization": f"Bearer {tokens['access_token']}"}

    response = await client.post("/api/v1/prices/", json={
        "product_name": "Feijão Carioca 1kg",
        "barcode": "7891234567890",
        "price": 8.90,
        "supermarket": "Extra",
        "brand": "Camil",
    }, headers=headers)

    assert response.status_code == 201
    data = response.json()
    assert data["product_name"] == "Feijão Carioca 1kg"
    assert data["price"] == 8.90
    assert data["supermarket"] == "Extra"
    assert data["barcode"] == "7891234567890"
    assert "id" in data
    assert "created_at" in data


@pytest.mark.asyncio
async def test_get_prices_after_register(client: AsyncClient):
    """Preço registrado deve aparecer na listagem geral."""
    tokens = await _register_user(client, "prices2@example.com")
    headers = {"Authorization": f"Bearer {tokens['access_token']}"}

    await client.post("/api/v1/prices/", json={
        "product_name": "Arroz 5kg",
        "barcode": "7890000000001",
        "price": 24.90,
        "supermarket": "Carrefour",
    }, headers=headers)

    response = await client.get("/api/v1/prices/")
    assert response.status_code == 200
    prices = response.json()
    assert len(prices) >= 1
    names = [p["product_name"] for p in prices]
    assert "Arroz 5kg" in names


@pytest.mark.asyncio
async def test_get_prices_by_barcode(client: AsyncClient):
    """Busca por barcode deve retornar só preços daquele produto."""
    tokens = await _register_user(client, "prices3@example.com")
    headers = {"Authorization": f"Bearer {tokens['access_token']}"}

    barcode = "7890000099999"
    await client.post("/api/v1/prices/", json={
        "product_name": "Produto X",
        "barcode": barcode,
        "price": 5.00,
        "supermarket": "Pão de Açúcar",
    }, headers=headers)

    response = await client.get(f"/api/v1/prices/barcode/{barcode}")
    assert response.status_code == 200
    prices = response.json()
    assert len(prices) == 1
    assert prices[0]["barcode"] == barcode


@pytest.mark.asyncio
async def test_get_prices_by_barcode_not_found(client: AsyncClient):
    """Barcode inexistente deve retornar lista vazia."""
    response = await client.get("/api/v1/prices/barcode/0000000000000")
    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.asyncio
async def test_register_price_increments_user_xp(client: AsyncClient):
    """
    Gamificação: registrar preço deve incrementar contributions e XP do usuário.
    """
    tokens = await _register_user(client, "xp@example.com")
    headers = {"Authorization": f"Bearer {tokens['access_token']}"}

    # Verifica XP inicial
    me_before = await client.get("/api/v1/users/me", headers=headers)
    xp_before = me_before.json()["xp"]
    contrib_before = me_before.json()["contributions"]

    # Registra preço
    await client.post("/api/v1/prices/", json={
        "product_name": "Teste XP",
        "barcode": "7891111111111",
        "price": 1.00,
        "supermarket": "Qualquer",
    }, headers=headers)

    # Verifica XP após
    me_after = await client.get("/api/v1/users/me", headers=headers)
    assert me_after.json()["xp"] == xp_before + 10
    assert me_after.json()["contributions"] == contrib_before + 1
