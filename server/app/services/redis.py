import logging
from typing import Optional

from upstash_redis import Redis

log = logging.getLogger(__name__)


class RedisService:
    def __init__(self):
        self.client: Optional[Redis] = None

    async def connect(self):
        try:
            self.client = Redis.from_env()
            await self.client.ping()
            log.info(f"Connected to Redis successfully")
        except Exception as e:
            log.error(f"Failed to connect to Redis: {e}")
            raise

    async def disconnect(self):
        if self.client:
            await self.client.close()
            log.info("Disconnected from Redis")

    async def set(self, key: str, value: str, expire: int = 60):
        if not self.client:
            raise RuntimeError("Redis client not initialized")
        await self.client.set(key, value, ex=expire)

    async def get(self, key: str) -> Optional[str]:
        if not self.client:
            raise RuntimeError("Redis client not initialized")
        return await self.client.get(key)

    async def delete(self, key: str):
        if not self.client:
            raise RuntimeError("Redis client not initialized")
        await self.client.delete(key)

    async def exists(self, key: str) -> bool:
        if not self.client:
            raise RuntimeError("Redis client not initialized")
        return await self.client.exists(key) > 0
