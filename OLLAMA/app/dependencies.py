import logging
from typing import Generator

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.utils.db import get_db

logger = logging.getLogger(__name__)

# Security scheme for optional authentication
security = HTTPBearer(auto_error=False)


async def validate_token(
        credentials: HTTPAuthorizationCredentials = Depends(security)
) -> bool:
    """
    Validate token for API endpoints that require authentication

    Args:
        credentials: HTTP Authorization credentials

    Returns:
        True if token is valid
    """
    if not credentials:
        # Allow anonymous access for now - will integrate with main app auth later
        return True

    # We'll implement proper token validation when integrating with main app
    # For now, just check if token exists
    if not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing token",
            headers={"WWW-Authenticate": "Bearer"}
        )

    # For development purposes, accept any token
    return True