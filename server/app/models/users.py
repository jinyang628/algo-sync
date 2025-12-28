from pydantic import BaseModel


class TokenExchangeRequest(BaseModel):
    code: str


class TokenExchangeResponse(BaseModel):
    access_token: str


class LoginUrlResponse(BaseModel):
    url: str
