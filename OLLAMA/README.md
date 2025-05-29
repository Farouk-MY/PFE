# E-commerce RAG Chatbot

This project implements a Retrieval-Augmented Generation (RAG) chatbot for e-commerce, capable of answering questions about products, tracking orders, checking stock availability, and providing customer support based on the knowledge base.

## Authentication-Aware Chat
The chatbot now supports authentication-aware responses. When a user is authenticated, they receive personalized information about their orders and account. Non-authenticated users receive general information.

### Key Features
- Personalized order tracking for authenticated users
- General information for non-authenticated users
- Seamless integration with existing chat functionality

## Table of Contents
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Testing with Postman](#testing-with-postman)
  - [Setting Up Postman](#setting-up-postman)
  - [API Endpoints](#api-endpoints)
  - [Testing the Chat Functionality](#testing-the-chat-functionality)
  - [Testing Document Upload](#testing-document-upload)
  - [Testing Knowledge Generation](#testing-knowledge-generation)
  - [Testing Document Search](#testing-document-search)
- [Common Issues and Troubleshooting](#common-issues-and-troubleshooting)

## Prerequisites

Before getting started, make sure you have the following installed:
- Python 3.9+
- PostgreSQL
- [Ollama](https://ollama.ai/) (for running the LLM locally)
- [Postman](https://www.postman.com/downloads/) (for API testing)

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd e-commerce-rag-chatbot
   ```

2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Configuration

1. Make sure Ollama is running with the llama3.1 model:
   ```bash
   ollama run llama3.1
   ```

2. Create a PostgreSQL database:
   ```bash
   createdb mediasoft
   ```

3. Update the `.env` file with your database credentials and other settings:
   ```
   DATABASE_URL=postgresql://postgres:0000@localhost:5432/mediasoft
   OLLAMA_BASE_URL=http://localhost:11434
   OLLAMA_MODEL=llama3.1
   DEBUG=True
   ```

## Running the Application

Start the FastAPI application:
```bash
uvicorn app.main:app --reload
```

The application will be available at http://localhost:8000. You can access the API documentation at http://localhost:8000/api/docs.

## Testing with Postman

### Setting Up Postman

1. Open Postman and create a new Collection named "E-commerce RAG Chatbot".
2. Create a new environment with the following variables:
   - `base_url`: `http://localhost:8000/api/v1`

### API Endpoints

The main API endpoints for testing are:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/chat/chat` | POST | Send a message to the chatbot |
| `/admin/documents/upload` | POST | Upload a document to the knowledge base |
| `/admin/knowledge/generate-product-info` | POST | Generate product knowledge from database |
| `/admin/documents/search` | GET | Search for documents in the knowledge base |

### Testing the Chat Functionality

1. Create a new request in Postman:
   - Method: `POST`
   - URL: `{{base_url}}/chat/chat`
   - Headers: `Content-Type: application/json`
   - Body (raw JSON):
   ```json
   {
     "query": "What products do you have?",
     "history": []
   }
   ```

2. Send the request and observe the response. You should get a structured response like:
   ```json
   {
     "answer": "Based on the information available, we offer several products...",
     "context": ["..."],
     "sources": ["..."]
   }
   ```

3. Test a follow-up question by including the previous conversation in the history:
   ```json
   {
     "query": "Do you have any in stock?",
     "history": [
       {
         "role": "user",
         "content": "What products do you have?"
       },
       {
         "role": "assistant",
         "content": "Based on the information available, we offer several products..."
       }
     ]
   }
   ```

4. Test order tracking functionality:
   ```json
   {
     "query": "Track my order #12345",
     "history": []
   }
   ```

5. Test stock checking functionality:
   ```json
   {
     "query": "Is the iPhone 13 in stock?",
     "history": []
   }
   ```

### Testing Document Upload

1. Create a new request in Postman:
   - Method: `POST`
   - URL: `{{base_url}}/admin/documents/upload`
   - Change body type to `form-data`
   - Add the following fields:
     - `file`: Select a PDF, CSV, JSON, or text file
     - `name`: Enter a name for the document (e.g., "Product Catalog")
     - `description`: Enter a description (e.g., "List of all products with prices")
     - `document_type`: Enter the document type (e.g., "pdf", "csv", "json", or "text")

2. Send the request and observe the response. You should receive a document info object with an ID.

### Testing Knowledge Generation

1. Create a new request in Postman:
   - Method: `POST`
   - URL: `{{base_url}}/admin/knowledge/generate-product-info`
   - No body is required

2. Send the request. This will generate product knowledge from the database and add it to the vector store.

### Testing Document Search

1. Create a new request in Postman:
   - Method: `GET`
   - URL: `{{base_url}}/admin/documents/search?query=product&limit=5`

2. Send the request. You should receive a list of documents matching the search query.

## Common Issues and Troubleshooting

### Database Connection Issues

If you encounter database connection errors:
1. Verify your PostgreSQL server is running
2. Check the DATABASE_URL in the .env file
3. Ensure the mediasoft database exists

```bash
# Check PostgreSQL status
service postgresql status

# Create database if needed
createdb mediasoft
```

### Ollama Connection Issues

If the chatbot can't connect to Ollama:
1. Verify Ollama is running
2. Check the OLLAMA_BASE_URL in the .env file
3. Make sure the llama3.1 model is installed

```bash
# Pull and start the model if needed
ollama pull llama3.1
ollama run llama3.1
```

### API Not Responding

If the API endpoints don't respond:
1. Check that the FastAPI application is running
2. Verify the URL you're using in Postman
3. Examine the application logs for errors

```bash
# Restart the application with debug output
uvicorn app.main:app --reload --log-level debug
```

### Vector Store Issues

If you're having issues with document search or RAG functionality:
1. Check if the vector store directory exists and is writable
2. Try regenerating the embeddings by resetting the vector store

```bash
# Remove and recreate vector store directory
rm -rf data/vector_store
mkdir -p data/vector_store
```

### Document Upload Failures

If document uploads are failing:
1. Verify the file format is supported (PDF, CSV, JSON, text)
2. Check that the document directories exist and are writable
3. Ensure the file size is reasonable

```bash
# Create document directories if needed
mkdir -p data/pdf data/csv data/json
```

---

For more information, please refer to the code documentation or contact the development team.