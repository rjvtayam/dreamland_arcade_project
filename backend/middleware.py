import time
import logging
from collections import defaultdict
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from fastapi.exceptions import HTTPException

logger = logging.getLogger("dreamland.security")


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data:; font-src 'self' https://fonts.gstatic.com"
        return response


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, max_requests: int = 100, window_seconds: int = 60):
        super().__init__(app)
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests = defaultdict(list)

    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host if request.client else "unknown"
        now = time.time()
        cutoff = now - self.window_seconds

        self.requests[client_ip] = [t for t in self.requests[client_ip] if t > cutoff]

        if len(self.requests[client_ip]) >= self.max_requests:
            logger.warning(f"Rate limit exceeded for {client_ip}")
            return JSONResponse(
                status_code=429,
                content={"detail": "Too many requests. Please try again later."}
            )

        self.requests[client_ip].append(now)
        return await call_next(request)


class LoginThrottleMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, max_attempts: int = 5, lockout_seconds: int = 300):
        super().__init__(app)
        self.max_attempts = max_attempts
        self.lockout_seconds = lockout_seconds
        self.attempts = {}
        self.lockouts = {}

    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host if request.client else "unknown"
        now = time.time()

        if client_ip in self.lockouts and now < self.lockouts[client_ip]:
            remaining = int(self.lockouts[client_ip] - now)
            logger.warning(f"Locked out: {client_ip} ({remaining}s remaining)")
            return JSONResponse(
                status_code=429,
                content={"detail": f"Account locked. Try again in {remaining} seconds."}
            )

        if client_ip in self.lockouts and now >= self.lockouts[client_ip]:
            del self.lockouts[client_ip]
            self.attempts.pop(client_ip, None)

        is_pin_endpoint = request.url.path in ("/api/auth/login", "/api/attendance/clock-in", "/api/attendance/clock-out") and request.method == "POST"

        try:
            response = await call_next(request)
        except HTTPException as e:
            if is_pin_endpoint and e.status_code in (401, 403, 400):
                self.attempts[client_ip] = self.attempts.get(client_ip, 0) + 1
                logger.warning(f"Failed PIN attempt {self.attempts[client_ip]} from {client_ip}")
                if self.attempts[client_ip] >= self.max_attempts:
                    self.lockouts[client_ip] = now + self.lockout_seconds
                    logger.warning(f"Locked out {client_ip} for {self.lockout_seconds}s")
            raise
        except Exception:
            raise

        if is_pin_endpoint and response.status_code in (401, 403, 400):
            self.attempts[client_ip] = self.attempts.get(client_ip, 0) + 1
            logger.warning(f"Failed PIN attempt {self.attempts[client_ip]} from {client_ip}")
            if self.attempts[client_ip] >= self.max_attempts:
                self.lockouts[client_ip] = now + self.lockout_seconds
                logger.warning(f"Locked out {client_ip} for {self.lockout_seconds}s")
        elif is_pin_endpoint and response.status_code == 200:
            self.attempts.pop(client_ip, None)

        return response


class SecureErrorsMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        try:
            response = await call_next(request)
            return response
        except Exception as e:
            logger.error(f"Unhandled error: {type(e).__name__}: {str(e)}")
            return JSONResponse(
                status_code=500,
                content={"detail": "An internal error occurred. Please try again later."}
            )


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start = time.time()
        client_ip = request.client.host if request.client else "unknown"
        response = await call_next(request)
        duration = round((time.time() - start) * 1000, 2)
        logger.info(f"{request.method} {request.url.path} | {response.status_code} | {duration}ms | {client_ip}")
        return response
