import logging
import os

from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException
from fastapi.responses import RedirectResponse

from app.models.users import AuthenticateResponse
from app.services.users import UsersService

log = logging.getLogger(__name__)
load_dotenv()

FRONTEND_BASE_URL = os.getenv("FRONTEND_BASE_URL")
router = APIRouter()


class UsersController:
    def __init__(self, service: UsersService):
        self.router = APIRouter()
        self.service = service
        self.setup_routes()

    def setup_routes(self):
        router = self.router

        @router.get("/callback")
        async def exchange_token(code: str):
            try:
                token_response = await self.service.exchange_token(code=code)

                return RedirectResponse(
                    f"{FRONTEND_BASE_URL}?access_token={token_response.access_token}"
                )
            except HTTPException as e:
                raise e
            except Exception as e:
                raise HTTPException(
                    status_code=500,
                    detail=f"An unexpected error occurred: {str(e)}",
                )
