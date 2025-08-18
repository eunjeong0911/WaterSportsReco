import httpx


async def get_http_client():
    async with httpx.AsyncClient(timeout=10) as client:
        yield client


