import logging
import os
import secrets

import httpx
from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException
from fastapi.responses import RedirectResponse

from app.constants import GITHUB_AUTH_URL
from app.models.users import LoginUrlResponse, TokenExchangeRequest, TokenExchangeResponse
from app.services import RedisService, UsersService

log = logging.getLogger(__name__)
load_dotenv()

FRONTEND_BASE_URL = os.getenv("FRONTEND_BASE_URL")
SERVER_BASE_URL = os.getenv("SERVER_BASE_URL")
GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID")


router = APIRouter()


class UsersController:
    def __init__(self, users_service: UsersService, redis_service: RedisService):
        self.router = APIRouter()
        self.users_service = users_service
        self.redis_service = redis_service
        self.setup_routes()

    def setup_routes(self):
        router = self.router

        @router.get("/login-url")
        async def get_login_url() -> LoginUrlResponse:
            state = secrets.token_urlsafe()

            await self.redis_service.set(key=f"auth:state:{state}", value="valid")

            params = {
                "client_id": GITHUB_CLIENT_ID,
                "redirect_uri": f"{SERVER_BASE_URL}/api/v1/users/callback",
                "scope": "user repo public_repo",
                "state": state,
            }
            query_string = "&".join([f"{k}={v}" for k, v in params.items()])
            return LoginUrlResponse(url=f"{GITHUB_AUTH_URL}?{query_string}")

        @router.get("/callback")
        async def oauth_callback(code: str, state: str):
            """
            This is where GitHub redirects the user.
            'code' is the temporary exchange code.
            """
            try:
                state_key = f"auth:state:{state}"
                is_valid_state = await self.redis_service.get(state_key)
                if not is_valid_state:
                    raise HTTPException(
                        status_code=httpx.codes.FORBIDDEN,
                        detail="Invalid state parameter. Possible CSRF attack.",
                    )
                await self.redis_service.delete(state_key)

                access_token = await self.users_service.exchange_code_for_access_token(code=code)
                one_time_code = secrets.token_urlsafe()
                await self.redis_service.set(
                    key=f"auth:otc:{one_time_code}",
                    value=access_token,
                )

                # Redirect user back to frontend with the one time code, which will be posted back in /token/exchange
                return RedirectResponse(f"{FRONTEND_BASE_URL}?otc={one_time_code}")

            except Exception as e:
                log.error(f"OAuth callback failed: {e}")
                return RedirectResponse(f"{FRONTEND_BASE_URL}?error=auth_failed")

        @router.post("/token/exchange")
        async def exchange_one_time_code(request: TokenExchangeRequest):
            try:
                redis_key = f"auth:otc:{request.otc}"
                github_token = await self.redis_service.get(redis_key)

                if not github_token:
                    raise HTTPException(
                        status_code=httpx.codes.BAD_REQUEST,
                        detail="Invalid or expired exchange code",
                    )
                await self.redis_service.delete(redis_key)
                return TokenExchangeResponse(access_token=github_token)
            except HTTPException as e:
                raise e
            except Exception as e:
                log.error(f"Error exchanging code: {e}")
                raise HTTPException(
                    status_code=httpx.codes.INTERNAL_SERVER_ERROR,
                    detail=f"An unexpected error occurred: {str(e)}",
                )
