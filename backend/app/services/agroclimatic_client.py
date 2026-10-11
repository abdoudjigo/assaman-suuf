import httpx

from app.core.config import settings


async def check_agroclimatic_api() -> dict:
    base_url = settings.AGROCLIMATIC_API_URL.strip()

    if not base_url:
        return {
            "configured": False,
            "status": "not_configured",
            "message": (
                "L'URL de l'API agroclimatique "
                "n'est pas encore configurée."
            ),
        }

    health_path = settings.AGROCLIMATIC_HEALTH_PATH.strip()

    url = (
        base_url.rstrip("/")
        + "/"
        + health_path.lstrip("/")
    )

    try:
        async with httpx.AsyncClient(
            timeout=settings.AGROCLIMATIC_TIMEOUT
        ) as client:
            response = await client.get(url)

        return {
            "configured": True,
            "status": (
                "available"
                if response.is_success
                else "unhealthy"
            ),
            "http_status": response.status_code,
            "url": url,
        }

    except httpx.RequestError:
        return {
            "configured": True,
            "status": "unreachable",
            "url": url,
            "message": (
                "L'API agroclimatique n'est pas joignable."
            ),
        }