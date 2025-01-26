import logging

from fastapi import APIRouter, HTTPException

from app.models.users import AuthenticateRequest, AuthenticateResponse
from app.services.users import UsersService

log = logging.getLogger(__name__)

router = APIRouter()


class UsersController:
    def __init__(self, service: UsersService):
        self.router = APIRouter()
        self.service = service
        self.setup_routes()

    def setup_routes(self):
        router = self.router

        @router.post(
            "/authenticate",
            response_model=AuthenticateResponse,
        )
        async def authenticate(input: AuthenticateRequest) -> AuthenticateResponse:
            try:
                return await self.service.authenticate(
                    client_id=input.client_id,
                    client_secret=input.client_secret,
                    redirect_uri=input.redirect_uri,
                )
            except Exception as e:
                log.error("Unexpected error in users controller.py: %s", str(e))
                raise HTTPException(status_code=500, detail="An unexpected error occurred") from e
