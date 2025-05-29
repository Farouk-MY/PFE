import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Base directory of the project
BASE_DIR = Path(__file__).resolve().parent.parent

# API configuration
API_PREFIX = "/api"
API_V1_STR = "/v1"
PROJECT_NAME = "E-commerce RAG Chatbot"
DEBUG = os.getenv("DEBUG", "False").lower() in ("true", "1", "t")

# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:0000@localhost:5432/mediasoft")

# Ollama configuration
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.1")

# Vector store configuration
VECTOR_STORE_DIR = os.path.join(BASE_DIR, "data", "vector_store")

# Document storage
DOCUMENT_DIR = os.path.join(BASE_DIR, "data")
PDF_DIR = os.path.join(DOCUMENT_DIR, "pdf")
CSV_DIR = os.path.join(DOCUMENT_DIR, "csv")
JSON_DIR = os.path.join(DOCUMENT_DIR, "json")

# Ensure directories exist
os.makedirs(VECTOR_STORE_DIR, exist_ok=True)
os.makedirs(PDF_DIR, exist_ok=True)
os.makedirs(CSV_DIR, exist_ok=True)
os.makedirs(JSON_DIR, exist_ok=True)

# RAG Configuration
CHUNK_SIZE = 512
CHUNK_OVERLAP = 50
TOP_K_RESULTS = 5

# Chatbot prompt templates
SYSTEM_PROMPT = """You're AiVerse, a friendly and helpful assistant for TechVerse online store. 
Be conversational and natural - respond like a helpful human would.
Keep your answers short and to the point.
Use casual language and occasionally add friendly expressions.
If someone greets you, greet them back warmly.
For product questions, provide only essential details.
If you don't know something, briefly say so and offer alternative help.
Never mention that you're an AI - just be AiVerse, the store's helpful assistant."""

QUERY_PROMPT = """Reply to this message in a conversational, human-like way.
Keep it brief - usually 1-3 short sentences is perfect.
Base your answer on the context and database info provided.
If you can't help with the specific request, briefly suggest what you can help with instead.

Context:
{context}

Database Info:
{db_info}

Customer Message:
{query}

Your Response:"""