# Authenticated Chat Integration

## Overview
The authenticated chat integration allows the chatbot to provide personalized responses based on user authentication status. When a user is authenticated, they can receive specific information about their orders and account. Non-authenticated users receive general information.

## Features
- Authentication-aware chat responses
- Personalized order tracking for authenticated users
- General information for non-authenticated users
- Seamless integration with existing chat functionality

## API Endpoints

### Authenticated Chat
- **URL**: `/api/v1/auth-chat/chat`
- **Method**: `POST`
- **Authentication**: Bearer token (optional)
- **Request Body**:
  ```json
  {
    "query": "What's the status of my order?",
    "history": [],
    "metadata": {}
  }
  ```
- **Response**:
  ```json
  {
    "answer": "Here are your recent orders: Order #123 - 2023-05-15 - Status: Delivered...",
    "context": null,
    "sources": null
  }
  ```

### Order Tracking
- **URL**: `/api/v1/auth-chat/order-tracking`
- **Method**: `POST`
- **Authentication**: Bearer token (required for personalized information)
- **Request Body**:
  ```json
  {
    "query": "Where is my order #123?",
    "history": [],
    "metadata": {}
  }
  ```
- **Response**:
  ```json
  {
    "answer": "Here's the status of your order #123: Status: Shipped, Expected delivery: 2023-05-20...",
    "context": null,
    "sources": null
  }
  ```

## Testing with Postman

### Testing Authenticated Chat

1. Create a new request in Postman:
   - Method: `POST`
   - URL: `{{base_url}}/auth-chat/chat`
   - Headers: 
     - `Content-Type: application/json`
     - `Authorization: Bearer your_token_here` (for authenticated requests)
   - Body (raw JSON):
   ```json
   {
     "query": "What are my recent orders?",
     "history": []
   }
   ```

2. Send the request and observe the response. Authenticated users should get personalized information.

### Testing Order Tracking

1. Create a new request in Postman:
   - Method: `POST`
   - URL: `{{base_url}}/auth-chat/order-tracking`
   - Headers: 
     - `Content-Type: application/json`
     - `Authorization: Bearer your_token_here` (for authenticated requests)
   - Body (raw JSON):
   ```json
   {
     "query": "Where is my order #123?",
     "history": []
   }
   ```

2. Send the request and observe the response. Authenticated users should get their specific order information.

## Implementation Notes

- The authentication status is determined by the presence of a valid token in the Authorization header.
- For non-authenticated users, general information is provided with prompts to log in for personalized details.
- The system uses the existing order tracking functionality but adds authentication awareness.
- In a production environment, you would extract the user ID from the authentication token to fetch the correct user's orders.