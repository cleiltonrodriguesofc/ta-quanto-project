"""
Testes de integração — Saved Baskets Router
Cobre: GET, POST, GET /{id}/items, DELETE /{id}.
Valida isolamento por usuário (um user não pode ver cestas do outro).
"""
import pytest
from httpx import AsyncClient
from tests.conftest import _register_user

BASKET_PAYLOAD = {
    "name": "Compras da Semana",
    "supermarket": "Extra",
    "total_amount": 150.00,
    "items": [
        {
            "barcode": "7890000000001",
            "product_name": "Arroz 5kg",
            "price": 24.90,
            "quantity": 2,
        },
        {
            "barcode": "7890000000002",
            "product_name": "Feijão 1kg",
            "price": 8.90,
            "quantity": 3,
        },
    ],
}


@pytest.mark.asyncio
async def test_get_baskets_unauthenticated(client: AsyncClient):
    """GET sem token deve retornar 401 ou 403 (HTTPBearer)."""
    response = await client.get("/api/v1/saved-baskets/")
    assert response.status_code in (401, 403)


@pytest.mark.asyncio
async def test_create_basket(client: AsyncClient):
    """POST cria cesta com itens e retorna 201."""
    tokens = await _register_user(client, "basket@example.com")
    headers = {"Authorization": f"Bearer {tokens['access_token']}"}

    response = await client.post("/api/v1/saved-baskets/", json=BASKET_PAYLOAD, headers=headers)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Compras da Semana"
    assert data["supermarket"] == "Extra"
    assert data["total_amount"] == 150.00
    assert data["items_count"] == 2
    assert "id" in data


@pytest.mark.asyncio
async def test_list_my_baskets(client: AsyncClient):
    """GET lista apenas as cestas do usuário autenticado."""
    tokens = await _register_user(client, "basket2@example.com")
    headers = {"Authorization": f"Bearer {tokens['access_token']}"}

    # Cria duas cestas
    await client.post("/api/v1/saved-baskets/", json={**BASKET_PAYLOAD, "name": "Cesta A"}, headers=headers)
    await client.post("/api/v1/saved-baskets/", json={**BASKET_PAYLOAD, "name": "Cesta B"}, headers=headers)

    response = await client.get("/api/v1/saved-baskets/", headers=headers)
    assert response.status_code == 200
    baskets = response.json()
    assert len(baskets) == 2
    names = [b["name"] for b in baskets]
    assert "Cesta A" in names
    assert "Cesta B" in names


@pytest.mark.asyncio
async def test_basket_isolation_between_users(client: AsyncClient):
    """Usuário A não deve ver cestas do Usuário B."""
    tokens_a = await _register_user(client, "user_a@example.com")
    headers_a = {"Authorization": f"Bearer {tokens_a['access_token']}"}

    tokens_b = await _register_user(client, "user_b@example.com")
    headers_b = {"Authorization": f"Bearer {tokens_b['access_token']}"}

    # Usuário A cria uma cesta
    await client.post("/api/v1/saved-baskets/", json={**BASKET_PAYLOAD, "name": "Cesta do A"}, headers=headers_a)

    # Usuário B não deve ver
    response_b = await client.get("/api/v1/saved-baskets/", headers=headers_b)
    assert response_b.status_code == 200
    assert response_b.json() == []


@pytest.mark.asyncio
async def test_get_basket_items(client: AsyncClient):
    """GET /{id}/items retorna os itens da cesta."""
    tokens = await _register_user(client, "items@example.com")
    headers = {"Authorization": f"Bearer {tokens['access_token']}"}

    create_resp = await client.post("/api/v1/saved-baskets/", json=BASKET_PAYLOAD, headers=headers)
    basket_id = create_resp.json()["id"]

    response = await client.get(f"/api/v1/saved-baskets/{basket_id}/items", headers=headers)
    assert response.status_code == 200
    items = response.json()
    assert len(items) == 2
    names = [i["product_name"] for i in items]
    assert "Arroz 5kg" in names
    assert "Feijão 1kg" in names


@pytest.mark.asyncio
async def test_get_items_wrong_user(client: AsyncClient):
    """Usuário B não pode acessar itens da cesta do Usuário A → 404."""
    tokens_a = await _register_user(client, "owner@example.com")
    headers_a = {"Authorization": f"Bearer {tokens_a['access_token']}"}

    tokens_b = await _register_user(client, "intruder@example.com")
    headers_b = {"Authorization": f"Bearer {tokens_b['access_token']}"}

    create_resp = await client.post("/api/v1/saved-baskets/", json=BASKET_PAYLOAD, headers=headers_a)
    basket_id = create_resp.json()["id"]

    response = await client.get(f"/api/v1/saved-baskets/{basket_id}/items", headers=headers_b)
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_delete_basket(client: AsyncClient):
    """DELETE remove a cesta e ela não aparece mais na listagem."""
    tokens = await _register_user(client, "delete@example.com")
    headers = {"Authorization": f"Bearer {tokens['access_token']}"}

    create_resp = await client.post("/api/v1/saved-baskets/", json=BASKET_PAYLOAD, headers=headers)
    basket_id = create_resp.json()["id"]

    delete_resp = await client.delete(f"/api/v1/saved-baskets/{basket_id}", headers=headers)
    assert delete_resp.status_code == 204

    list_resp = await client.get("/api/v1/saved-baskets/", headers=headers)
    assert list_resp.json() == []


@pytest.mark.asyncio
async def test_delete_basket_wrong_user(client: AsyncClient):
    """Usuário B não pode deletar cesta do Usuário A → 404."""
    tokens_a = await _register_user(client, "del_owner@example.com")
    headers_a = {"Authorization": f"Bearer {tokens_a['access_token']}"}

    tokens_b = await _register_user(client, "del_intruder@example.com")
    headers_b = {"Authorization": f"Bearer {tokens_b['access_token']}"}

    create_resp = await client.post("/api/v1/saved-baskets/", json=BASKET_PAYLOAD, headers=headers_a)
    basket_id = create_resp.json()["id"]

    response = await client.delete(f"/api/v1/saved-baskets/{basket_id}", headers=headers_b)
    assert response.status_code == 404
