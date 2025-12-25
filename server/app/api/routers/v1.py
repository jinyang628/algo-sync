import logging

from fastapi import APIRouter

from app.controllers.users import UsersController
from app.services import UsersService, RedisService

log = logging.getLogger(__name__)

v1_router = APIRouter(prefix="/api/v1")
redis_service = RedisService()

### Health check


@v1_router.get("/status")
async def status():
    """Health check endpoint"""
    logging.info("Status endpoint called")
    return {"status": "ok"}


### Users


def get_users_controller_router():
    users_service = UsersService()
    return UsersController(users_service=users_service, redis_service=redis_service).router


v1_router.include_router(
    get_users_controller_router(),
    tags=["users"],
    prefix="/users",
)
