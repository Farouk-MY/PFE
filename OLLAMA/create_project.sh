#!/bin/bash


# Create directory structure
mkdir -p app/models
mkdir -p app/core
mkdir -p app/api/routes
mkdir -p app/api/services
mkdir -p app/utils
mkdir -p data/pdf
mkdir -p data/csv
mkdir -p data/json
mkdir -p tests

# __init__.py files
touch app/__init__.py
touch app/models/__init__.py
touch app/core/__init__.py
touch app/api/__init__.py
touch app/api/routes/__init__.py
touch app/api/services/__init__.py
touch app/utils/__init__.py
touch tests/__init__.py

# App-level files
touch app/main.py
touch app/config.py
touch app/dependencies.py
touch app/models/schemas.py
touch app/core/ollama_client.py
touch app/core/rag_engine.py
touch app/core/vector_store.py
touch app/api/routes/chat.py
touch app/api/routes/admin.py
touch app/api/services/chat_service.py
touch app/api/services/db_service.py
touch app/utils/db.py
touch app/utils/parsers.py

# Data dirs (empty but created)
mkdir -p data/pdf
mkdir -p data/csv
mkdir -p data/json

# Tests
touch tests/test_chat.py
touch tests/test_rag.py

# Root files
touch .env
touch .gitignore
touch requirements.txt
touch docker-compose.yml
touch README.md

echo "✅ Project structure for ecommerce-rag-chatbot created successfully!"
