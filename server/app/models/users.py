from pydantic import BaseModel


class AuthenticateRequest(BaseModel):
    client_id: str
    client_secret: str
    redirect_uri: str


class AuthenticateResponse(BaseModel):
    access_token: str
    refresh_token: str
