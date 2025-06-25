"""
Standardized error handling for SilkRoute OS Declaration Helper
Provides consistent error responses across all API endpoints
"""

from fastapi import HTTPException
from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

class APIError(Exception):
    """Base API error class for consistent error handling"""
    
    def __init__(
        self, 
        message: str, 
        code: str, 
        status_code: int = 500,
        details: Optional[Dict[str, Any]] = None
    ):
        self.message = message
        self.code = code
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)

class ValidationError(APIError):
    """Input validation errors"""
    def __init__(self, message: str, field: str = None, details: Dict = None):
        super().__init__(
            message=message,
            code="VALIDATION_ERROR",
            status_code=400,
            details={"field": field, **(details or {})}
        )

class AuthenticationError(APIError):
    """Authentication related errors"""
    def __init__(self, message: str = "Authentication failed"):
        super().__init__(
            message=message,
            code="AUTHENTICATION_ERROR",
            status_code=401
        )

class AuthorizationError(APIError):
    """Authorization related errors"""
    def __init__(self, message: str = "Access denied"):
        super().__init__(
            message=message,
            code="AUTHORIZATION_ERROR",
            status_code=403
        )

class NotFoundError(APIError):
    """Resource not found errors"""
    def __init__(self, resource: str, identifier: str = None):
        message = f"{resource} not found"
        if identifier:
            message += f": {identifier}"
        super().__init__(
            message=message,
            code="NOT_FOUND",
            status_code=404,
            details={"resource": resource, "identifier": identifier}
        )

class ConflictError(APIError):
    """Resource conflict errors"""
    def __init__(self, message: str, resource: str = None):
        super().__init__(
            message=message,
            code="CONFLICT",
            status_code=409,
            details={"resource": resource}
        )

class ProcessingError(APIError):
    """OCR and document processing errors"""
    def __init__(self, message: str, operation: str = None, details: Dict = None):
        super().__init__(
            message=message,
            code="PROCESSING_ERROR",
            status_code=422,
            details={"operation": operation, **(details or {})}
        )

class ExternalServiceError(APIError):
    """External service integration errors"""
    def __init__(self, service: str, message: str = None, details: Dict = None):
        message = message or f"{service} service unavailable"
        super().__init__(
            message=message,
            code="EXTERNAL_SERVICE_ERROR",
            status_code=503,
            details={"service": service, **(details or {})}
        )

class RateLimitError(APIError):
    """Rate limiting errors"""
    def __init__(self, message: str = "Rate limit exceeded"):
        super().__init__(
            message=message,
            code="RATE_LIMIT_EXCEEDED",
            status_code=429
        )

def create_error_response(error: APIError) -> Dict[str, Any]:
    """Create standardized error response"""
    response = {
        "error": {
            "message": error.message,
            "code": error.code,
            "status_code": error.status_code
        }
    }
    
    if error.details:
        response["error"]["details"] = error.details
    
    # Log error for monitoring
    logger.error(
        f"API Error: {error.code} - {error.message}",
        extra={
            "status_code": error.status_code,
            "details": error.details
        }
    )
    
    return response

def handle_api_error(error: APIError) -> HTTPException:
    """Convert APIError to FastAPI HTTPException"""
    return HTTPException(
        status_code=error.status_code,
        detail=create_error_response(error)["error"]
    )