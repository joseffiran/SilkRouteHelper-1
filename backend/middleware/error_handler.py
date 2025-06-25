"""
Error handling middleware for consistent API responses
"""

from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
import logging
import traceback
from typing import Any

from core.exceptions import APIError, create_error_response

logger = logging.getLogger(__name__)

class ErrorHandlingMiddleware(BaseHTTPMiddleware):
    """
    Middleware to catch and standardize all API errors
    """
    
    async def dispatch(self, request: Request, call_next):
        try:
            response = await call_next(request)
            return response
            
        except APIError as e:
            # Handle our custom API errors
            error_response = create_error_response(e)
            return JSONResponse(
                status_code=e.status_code,
                content=error_response
            )
            
        except HTTPException as e:
            # Handle FastAPI HTTP exceptions
            logger.warning(f"HTTP Exception: {e.status_code} - {e.detail}")
            return JSONResponse(
                status_code=e.status_code,
                content={
                    "error": {
                        "message": str(e.detail),
                        "code": f"HTTP_{e.status_code}",
                        "status_code": e.status_code
                    }
                }
            )
            
        except Exception as e:
            # Handle unexpected errors
            logger.error(
                f"Unexpected error: {str(e)}",
                extra={
                    "path": request.url.path,
                    "method": request.method,
                    "traceback": traceback.format_exc()
                }
            )
            
            return JSONResponse(
                status_code=500,
                content={
                    "error": {
                        "message": "Internal server error",
                        "code": "INTERNAL_SERVER_ERROR",
                        "status_code": 500
                    }
                }
            )

class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware to log all API requests for monitoring
    """
    
    async def dispatch(self, request: Request, call_next):
        # Log request
        logger.info(
            f"API Request: {request.method} {request.url.path}",
            extra={
                "method": request.method,
                "path": request.url.path,
                "query_params": dict(request.query_params),
                "client_ip": request.client.host if request.client else None
            }
        )
        
        # Process request
        response = await call_next(request)
        
        # Log response
        logger.info(
            f"API Response: {request.method} {request.url.path} - {response.status_code}",
            extra={
                "method": request.method,
                "path": request.url.path,
                "status_code": response.status_code
            }
        )
        
        return response