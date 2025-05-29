import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.models.schemas import MessageRole, Message, ChatRequest

client = TestClient(app)


def test_chat_endpoint():
    """Test the chat endpoint with a simple query"""
    request_data = {
        "query": "What products do you sell?",
        "history": [
            {"role": "user", "content": "Hello"},
            {"role": "assistant", "content": "Hello! How can I help you today?"}
        ]
    }

    response = client.post("/api/v1/chat/chat", json=request_data)

    assert response.status_code == 200
    assert "answer" in response.json()

    # The response should contain either a valid answer or an indication of no knowledge
    answer = response.json()["answer"]
    assert len(answer) > 0


def test_order_tracking_query():
    """Test the chat endpoint with an order tracking query"""
    request_data = {
        "query": "Where is my order #12345?",
        "history": []
    }

    response = client.post("/api/v1/chat/chat", json=request_data)

    assert response.status_code == 200
    assert "answer" in response.json()

    # The answer should mention the order number or ask for order information
    answer = response.json()["answer"]
    assert "12345" in answer or "order" in answer.lower()


def test_stock_check_query():
    """Test the chat endpoint with a stock check query"""
    request_data = {
        "query": "Is the iPhone in stock?",
        "history": []
    }

    response = client.post("/api/v1/chat/chat", json=request_data)

    assert response.status_code == 200
    assert "answer" in response.json()

    # The answer should mention stock availability or the product
    answer = response.json()["answer"]
    assert "stock" in answer.lower() or "iphone" in answer.lower()