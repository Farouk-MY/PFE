import logging
from typing import List, Dict, Any, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.models.schemas import ChatRequest, ChatResponse
from app.api.services.chat_service import chat_service
from app.dependencies import validate_token

logger = logging.getLogger(__name__)

router = APIRouter()
security = HTTPBearer(auto_error=False)


@router.post("/chat", response_model=ChatResponse, status_code=status.HTTP_200_OK)
async def authenticated_chat(request: ChatRequest, authenticated: bool = Depends(validate_token)):
    """
    Process a chat message with authentication awareness
    
    If the user is authenticated, personalized information like order tracking will be provided.
    If not authenticated, only general information will be given.
    
    Args:
        request: Chat request with query and optional history
        authenticated: Whether the user is authenticated
        
    Returns:
        ChatResponse: The assistant's response
    """
    try:
        # Add authentication status to metadata
        if not request.metadata:
            request.metadata = {}
        request.metadata["authenticated"] = authenticated
        
        response = await chat_service.process_authenticated_message(request)
        return response
    except Exception as e:
        logger.error(f"Error in authenticated chat endpoint: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error processing chat message"
        )


@router.post("/order-tracking", response_model=ChatResponse, status_code=status.HTTP_200_OK)
async def order_tracking(request: ChatRequest, authenticated: bool = Depends(validate_token)):
    """
    Process an order tracking request with authentication awareness
    
    If the user is authenticated, their order information will be provided.
    If not authenticated, they will be prompted to log in or provide more information.
    
    Args:
        request: Chat request with query about order tracking
        authenticated: Whether the user is authenticated
        
    Returns:
        ChatResponse: The assistant's response with order tracking information
    """
    try:
        if not authenticated:
            return ChatResponse(
                answer="To track your specific order, please log in to your account. As a guest, I can only provide general information about our shipping and delivery processes.",
                context=None,
                sources=None
            )
        
        # Add authentication status to metadata
        if not request.metadata:
            request.metadata = {}
        request.metadata["authenticated"] = True
        request.metadata["request_type"] = "order_tracking"
        
        response = await chat_service.process_authenticated_message(request)
        return response
    except Exception as e:
        logger.error(f"Error in order tracking endpoint: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error processing order tracking request"
        )