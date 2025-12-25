import logging
import os

from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException
from fastapi.responses import RedirectResponse
import secrets

from app.models.users import AuthenticateResponse, TokenExchangeRequest, TokenExchangeResponse
from app.services import UsersService, RedisService

log = logging.getLogger(__name__)
load_dotenv()

FRONTEND_BASE_URL = os.getenv("FRONTEND_BASE_URL")
router = APIRouter()


class UsersController:
    def __init__(self, users_service: UsersService, redis_service: RedisService):
        self.router = APIRouter()
        self.users_service = users_service
        self.redis_service = redis_service
        self.setup_routes()

    def setup_routes(self):
        router = self.router

        @router.get("/callback")
        async def exchange_token(code: str):
            try:
                access_token: str = await self.users_service.exchange_token(
                    code=code
                )
                one_time_code = secrets.token_urlsafe()
                await self.redis_service.set(
                    key=f"auth:one_time:{one_time_code}",
                    value=access_token,
                    expire=60,
                )

                return RedirectResponse(f"{FRONTEND_BASE_URL}?code={one_time_code}")
            except HTTPException as e:
                raise e
            except Exception as e:
                log.error(f"Error in callback: {e}")
                raise HTTPException(
                    status_code=500,
                    detail=f"An unexpected error occurred: {str(e)}",
                )

        @router.post("/token/exchange")
        async def exchange_one_time_code(request: TokenExchangeRequest):
            try:
                token = await self.redis_service.get(f"auth:one_time:{request.code}")
                if not token:
                    raise HTTPException(status_code=400, detail="Invalid or expired code")
                await self.redis_service.delete(f"auth:one_time:{request.code}")

                return TokenExchangeResponse(access_token=token)

            except HTTPException as e:
                raise e
            except Exception as e:
                log.error(f"Error exchanging code: {e}")
                raise HTTPException(
                    status_code=500,
                    detail=f"An unexpected error occurred: {str(e)}",
                )
