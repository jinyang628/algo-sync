import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routers.v1 import v1_router
from app.services.redis import RedisService
from app.constants import CHROME_EXTENSION_ID

logging.getLogger("httpx").setLevel(logging.WARNING)
logging.basicConfig(
    level=logging.INFO,
    format="%(name)s - %(message)s",
)
log = logging.getLogger(__name__)

log.addHandler(logging.StreamHandler())

redis_service = RedisService()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Entry point lifecycle event. Runs before the server starts"""
    try:
        log.info("Starting up server...")
        await redis_service.connect()
        yield
    except Exception as e:
        log.exception("Failed to initialize renpAI server: %s", e)
        raise e
    finally:
        log.info("Shutting down server...")
        await redis_service.disconnect()


def create_app() -> FastAPI:
    """Create FastAPI app with all routes."""

    try:
        app = FastAPI(lifespan=lifespan, debug=True)

        # TODO: This is a quick fix to bypass CORS error. We need to ensure that the origin is shared in production
        app.add_middleware(
            CORSMiddleware,
            allow_origins=[CHROME_EXTENSION_ID],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

        app.include_router(v1_router)

        @app.exception_handler(RequestValidationError)
        async def validation_exception_handler(request, exc: RequestValidationError):
            exc_str = f"{exc}".replace("\n", " ").replace("   ", " ")
            log.error(f"{request}: {exc_str}")

            content = {"status_code": 10422, "message": exc_str, "data": None}
            return JSONResponse(content=content, status_code=status.HTTP_422_UNPROCESSABLE_ENTITY)

        return app
    except Exception as e:
        log.exception("Failed to create friday server: %s", e)
        raise e


app = create_app()
