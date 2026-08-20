"""
Testes de integração — Users Router
Cobre: GET /users/me, PUT /users/me (atualização de perfil).
"""
import pytest
from httpx import AsyncClient
from tests.conftest import _register_user


@pytest.mark.asyncio
async def test_get_me_unauthenticated(client: AsyncClient):
    """GET /me sem token deve retornar 401 ou 403 (HTTPBearer)."""
    response = await client.get("/api/v1/users/me")
    assert response.status_code in (401, 403)


@pytest.mark.asyncio
async def test_get_me_authenticated(client: AsyncClient):
    """GET /me com token válido retorna perfil do usuário."""
    tokens = await _register_user(client, "me@example.com")
    headers = {"Authorization": f"Bearer {tokens['access_token']}"}

    response = await client.get("/api/v1/users/me", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "me@example.com"
    assert data["name"] == "Usuário Teste"
    assert data["level"] == 1
    assert data["xp"] == 0
    assert data["contributions"] == 0
    assert "id" in data


@pytest.mark.asyncio
async def test_update_profile_name(client: AsyncClient):
    """PUT /me deve atualizar o nome do usuário."""
    tokens = await _register_user(client, "update@example.com")
    headers = {"Authorization": f"Bearer {tokens['access_token']}"}

    response = await client.put("/api/v1/users/me", json={"name": "Novo Nome"}, headers=headers)
    assert response.status_code == 200
    assert response.json()["name"] == "Novo Nome"


@pytest.mark.asyncio
async def test_update_profile_avatar(client: AsyncClient):
    """PUT /me deve atualizar o avatar_url do usuário."""
    tokens = await _register_user(client, "avatar@example.com")
    headers = {"Authorization": f"Bearer {tokens['access_token']}"}

    avatar_url = "https://example.com/avatar.png"
    response = await client.put("/api/v1/users/me", json={"avatar_url": avatar_url}, headers=headers)
    assert response.status_code == 200
    assert response.json()["avatar_url"] == avatar_url


@pytest.mark.asyncio
async def test_update_profile_partial(client: AsyncClient):
    """PUT /me com apenas um campo não deve zerar os outros."""
    tokens = await _register_user(client, "partial@example.com")
    headers = {"Authorization": f"Bearer {tokens['access_token']}"}

    # Primeiro seta o avatar
    await client.put("/api/v1/users/me", json={"avatar_url": "https://example.com/a.png"}, headers=headers)

    # Depois atualiza só o nome
    response = await client.put("/api/v1/users/me", json={"name": "Só Nome"}, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Só Nome"
    assert data["avatar_url"] == "https://example.com/a.png"  # deve permanecer


@pytest.mark.asyncio
async def test_me_invalid_token(client: AsyncClient):
    """Token inválido deve retornar 401 ou 403."""
    response = await client.get("/api/v1/users/me", headers={"Authorization": "Bearer token.invalido"})
    assert response.status_code in (401, 403)
