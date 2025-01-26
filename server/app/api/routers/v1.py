import logging

from fastapi import APIRouter

from app.controllers.users import UsersController
from app.services.users import UsersService

log = logging.getLogger(__name__)

v1_router = APIRouter(prefix="/api/v1")


### Health check


@v1_router.get("/status")
async def status():
    """Health check endpoint"""
    logging.info("Status endpoint called")
    return {"status": "ok"}


### Users


def get_users_controller_router():
    service = UsersService()
    return UsersController(service=service).router


v1_router.include_router(
    get_users_controller_router(),
    tags=["users"],
    prefix="/users",
)
