from pydantic import BaseModel


class AuthenticateRequest(BaseModel):
    client_id: str
    client_secret: str
    code: str


class AuthenticateResponse(BaseModel):
    access_token: str


class TokenExchangeRequest(BaseModel):
    code: str


class TokenExchangeResponse(BaseModel):
    access_token: str
