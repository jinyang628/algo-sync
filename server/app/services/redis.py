import logging
import os
from typing import Optional

import redis.asyncio as redis

log = logging.getLogger(__name__)


class RedisService:
    def __init__(self):
        self.redis_url = os.getenv("REDIS_URL")
        self.client: Optional[redis.Redis] = None

    async def connect(self):
        if not self.redis_url:
            raise ValueError("REDIS_URL environment variable is not set")
        try:
            self.client = redis.from_url(self.redis_url, encoding="utf-8", decode_responses=True)
            await self.client.ping()
            log.info(f"Connected to Redis successfully at {self.redis_url}")
        except Exception as e:
            log.error(f"Failed to connect to Redis at {self.redis_url}: {e}")
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
