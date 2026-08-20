"""
Testes de integração — Auth Router
Cobre: register, login, refresh token, logout.
"""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "taquanto-api"}


@pytest.mark.asyncio
async def test_register_success(client: AsyncClient):
    response = await client.post("/api/v1/auth/register", json={
        "name": "João Silva",
        "email": "joao@example.com",
        "password": "Senha@123",
    })
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_register_duplicate_email(client: AsyncClient):
    payload = {"name": "A", "email": "dup@example.com", "password": "Senha@123"}
    await client.post("/api/v1/auth/register", json=payload)
    response = await client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 409
    assert "E-mail já cadastrado" in response.json()["detail"]


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient):
    email = "login@example.com"
    password = "Senha@123"
    await client.post("/api/v1/auth/register", json={"name": "Login", "email": email, "password": password})

    response = await client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data


@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient):
    email = "wrong@example.com"
    await client.post("/api/v1/auth/register", json={"name": "W", "email": email, "password": "Certa@123"})

    response = await client.post("/api/v1/auth/login", json={"email": email, "password": "Errada@123"})
    assert response.status_code == 401
    assert "Credenciais inválidas" in response.json()["detail"]


@pytest.mark.asyncio
async def test_login_nonexistent_user(client: AsyncClient):
    response = await client.post("/api/v1/auth/login", json={"email": "naoexiste@example.com", "password": "x"})
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_refresh_token_rotation(client: AsyncClient):
    reg = await client.post("/api/v1/auth/register", json={
        "name": "Refresh", "email": "refresh@example.com", "password": "Senha@123"
    })
    old_refresh = reg.json()["refresh_token"]

    response = await client.post("/api/v1/auth/refresh", json={"refresh_token": old_refresh})
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    # Token rotacionado — novo refresh deve ser diferente
    assert data["refresh_token"] != old_refresh


@pytest.mark.asyncio
async def test_refresh_invalid_token(client: AsyncClient):
    response = await client.post("/api/v1/auth/refresh", json={"refresh_token": "token.invalido.aqui"})
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_logout_revokes_token(client: AsyncClient):
    reg = await client.post("/api/v1/auth/register", json={
        "name": "Logout", "email": "logout@example.com", "password": "Senha@123"
    })
    refresh_token = reg.json()["refresh_token"]

    # Logout
    resp = await client.post("/api/v1/auth/logout", json={"refresh_token": refresh_token})
    assert resp.status_code == 204

    # Tentar usar o refresh após logout → deve falhar
    resp2 = await client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
    assert resp2.status_code == 401
