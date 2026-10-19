from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "Assaman Suuf Geospatial API"
    APP_VERSION: str = "0.1.0"
    APP_ENV: str = "development"
    API_PREFIX: str = "/api/v1"

    DATABASE_URL: str

    FRONTEND_ORIGIN: str = "http://localhost:5173"

    # API agroclimatique de ton coéquipier
    AGROCLIMATIC_API_URL: str = ""
    AGROCLIMATIC_HEALTH_PATH: str = "/health"
    AGROCLIMATIC_TIMEOUT: float = 10.0

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()