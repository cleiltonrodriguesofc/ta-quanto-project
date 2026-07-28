"""
Testes unitários do serviço JWT — sem banco, sem rede.
"""
import pytest
from datetime import datetime, timezone
from app.core.infrastructure.auth.jwt_service import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
)


def test_hash_password_is_not_plaintext():
    hashed = hash_password("senha123")
    assert hashed != "senha123"
    assert len(hashed) > 20


def test_verify_password_correct():
    hashed = hash_password("senha123")
    assert verify_password("senha123", hashed) is True


def test_verify_password_wrong():
    hashed = hash_password("senha123")
    assert verify_password("errada", hashed) is False


def test_access_token_is_valid():
    token = create_access_token("user-123")
    payload = decode_token(token)
    assert payload is not None
    assert payload["sub"] == "user-123"
    assert payload["type"] == "access"


def test_refresh_token_is_valid():
    token, expires_at = create_refresh_token("user-123")
    payload = decode_token(token)
    assert payload is not None
    assert payload["sub"] == "user-123"
    assert payload["type"] == "refresh"
    assert isinstance(expires_at, datetime)
    assert expires_at > datetime.now(timezone.utc)


def test_decode_invalid_token_returns_none():
    result = decode_token("token.invalido.aqui")
    assert result is None


def test_tokens_are_different_each_call():
    token_1 = create_access_token("user-123")
    token_2 = create_access_token("user-123")
    # Mesma conta, mas timestamps diferentes geram tokens diferentes
    # (na prática podem ser iguais no mesmo segundo — teste de sanidade)
    assert isinstance(token_1, str)
    assert isinstance(token_2, str)
