import os

import aiohttp
from dotenv import load_dotenv
from fastapi import HTTPException

from app.models.users import AuthenticateResponse

load_dotenv()

SERVER_BASE_URL = os.getenv("SERVER_BASE_URL")
GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID")
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET")
GITHUB_AUTH_URL = "https://github.com/login/oauth/authorize"
GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token"


class UsersService:
    async def exchange_token(self, code: str) -> AuthenticateResponse:
        data = {
            "client_id": GITHUB_CLIENT_ID,
            "client_secret": GITHUB_CLIENT_SECRET,
            "code": code,
            "redirect_uri": f"{SERVER_BASE_URL}/api/v1/users/callback",
        }
        headers = {
            "Accept": "application/json",
        }

        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(GITHUB_TOKEN_URL, data=data, headers=headers) as response:
                    if response.status != 200:
                        raise HTTPException(
                            status_code=response.status,
                            detail="Failed to exchange code for access token",
                        )

                    token_data = await response.json()
                    access_token = token_data.get("access_token")
                    refresh_token = token_data.get("refresh_token")

                    if not access_token:
                        raise HTTPException(
                            status_code=400,
                            detail="Access token not found in response",
                        )

                    return AuthenticateResponse(
                        access_token=access_token,
                        refresh_token=refresh_token,
                    )
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"An unexpected error occurred: {str(e)}",
            )
