import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

from app.main import app
from app.api.services.auth_chat_service import auth_chat_service
from app.models.schemas import ChatResponse


client = TestClient(app)


@pytest.fixture
def mock_auth_chat_service():
    with patch('app.api.routes.auth_chat.chat_service') as mock_service:
        yield mock_service


@pytest.fixture
def mock_validate_token():
    with patch('app.api.routes.auth_chat.validate_token') as mock_validate:
        yield mock_validate


def test_authenticated_chat_endpoint(mock_auth_chat_service):
    # Setup mock response
    mock_response = ChatResponse(
        answer="Here are your recent orders: Order #123 - 2023-05-15 - Status: Delivered",
        context=None,
        sources=None
    )
    mock_auth_chat_service.process_authenticated_message.return_value = mock_response
    
    # Test request with authentication
    response = client.post(
        "/api/v1/auth-chat/chat",
        json={
            "query": "What are my recent orders?",
            "history": []
        },
        headers={"Authorization": "Bearer test_token"}
    )
    
    assert response.status_code == 200
    assert "recent orders" in response.json()["answer"]


def test_order_tracking_endpoint_authenticated(mock_auth_chat_service, mock_validate_token):
    # Setup mock response
    mock_response = ChatResponse(
        answer="Here's the status of your order #123: Status: Shipped, Expected delivery: 2023-05-20",
        context=None,
        sources=None
    )
    mock_auth_chat_service.process_authenticated_message.return_value = mock_response
    mock_validate_token.return_value = True
    
    # Test request with authentication
    response = client.post(
        "/api/v1/auth-chat/order-tracking",
        json={
            "query": "Where is my order #123?",
            "history": []
        },
        headers={"Authorization": "Bearer test_token"}
    )
    
    assert response.status_code == 200
    assert "order #123" in response.json()["answer"]


def test_order_tracking_endpoint_unauthenticated(mock_validate_token):
    # Setup mock to return False for unauthenticated request
    mock_validate_token.return_value = False
    
    # Test request without authentication
    response = client.post(
        "/api/v1/auth-chat/order-tracking",
        json={
            "query": "Where is my order #123?",
            "history": []
        }
    )
    
    assert response.status_code == 200
    assert "log in" in response.json()["answer"]
    assert "guest" in response.json()["answer"]