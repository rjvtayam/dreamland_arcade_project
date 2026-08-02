import sys
import os
import logging
from logging.handlers import RotatingFileHandler
sys.path.insert(0, os.path.dirname(__file__))

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from config import settings
from database import engine, Base
from routers import all_routers
from middleware import (
    SecurityHeadersMiddleware,
    RateLimitMiddleware,
    LoginThrottleMiddleware,
    SecureErrorsMiddleware,
    RequestLoggingMiddleware,
)

log_formatter = logging.Formatter("%(asctime)s | %(levelname)s | %(name)s | %(message)s")
log_handler = RotatingFileHandler(
    os.path.join(os.path.dirname(__file__), "security.log"),
    maxBytes=5_000_000,
    backupCount=3,
)
log_handler.setFormatter(log_formatter)
logging.basicConfig(level=logging.INFO, handlers=[log_handler, logging.StreamHandler()])
logger = logging.getLogger("dreamland")

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    docs_url="/api/docs" if settings.DEBUG else None,
    redoc_url="/api/redoc" if settings.DEBUG else None,
)

app.add_middleware(SecureErrorsMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
    allow_headers=["Authorization", "Content-Type"],
)
app.add_middleware(RequestLoggingMiddleware)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(LoginThrottleMiddleware, max_attempts=5, lockout_seconds=300)
app.add_middleware(RateLimitMiddleware, max_requests=120, window_seconds=60)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled: {type(exc).__name__}")
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal error occurred. Please try again later."},
    )


@app.exception_handler(404)
async def not_found_handler(request: Request, exc):
    return JSONResponse(status_code=404, content={"detail": "Resource not found"})


@app.exception_handler(405)
async def method_not_allowed_handler(request: Request, exc):
    return JSONResponse(status_code=405, content={"detail": "Method not allowed"})


for router in all_routers:
    app.include_router(router)

frontend_path = os.path.join(os.path.dirname(__file__), "..", "frontend")
app.mount("/assets", StaticFiles(directory=os.path.join(frontend_path, "assets")), name="assets")
app.mount("/css", StaticFiles(directory=os.path.join(frontend_path, "css")), name="css")
app.mount("/js", StaticFiles(directory=os.path.join(frontend_path, "js")), name="js")


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    logger.info("Dreamland Arcade server started")
    try:
        from services.email_service import start_imap_poller
        import asyncio
        loop = asyncio.get_event_loop()
        loop.create_task(start_imap_poller())
    except Exception as e:
        logger.warning(f"IMAP poller could not start: {e}")


@app.get("/")
def serve_index():
    return FileResponse(os.path.join(frontend_path, "index.html"))


@app.get("/favicon.ico")
def favicon():
    fav = os.path.join(frontend_path, "assets", "favicon.ico")
    if os.path.exists(fav):
        return FileResponse(fav)
    return {"detail": "no favicon"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
