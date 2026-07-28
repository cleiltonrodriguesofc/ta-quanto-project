from pydantic_settings import BaseSettings
from pydantic import ConfigDict

class Settings(BaseSettings):
    model_config = ConfigDict(env_file=".env")

    database_url: str
    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 30
    cosmos_api_token: str = ""
    cosmos_api_url: str = "https://api.cosmos.bluesoft.com.br/gtins"
    host: str = "0.0.0.0"
    port: int = 8000
    environment: str = "development"

settings = Settings()
