import os

from dotenv import find_dotenv, load_dotenv

from app.models.users import AuthenticateResponse

load_dotenv()

SERVER_BASE_URL = os.getenv("SERVER_BASE_URL")


class UsersService:
    async def authenticate(self, client_id: str, client_secret: str) -> AuthenticateResponse:
        print(client_id)
        print(client_secret)
        print(SERVER_BASE_URL)
