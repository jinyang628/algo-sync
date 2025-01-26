from app.models.users import AuthenticateResponse


class UsersService:
    async def authenticate(
        self, client_id: str, client_secret: str
    ) -> AuthenticateResponse:
        pass
