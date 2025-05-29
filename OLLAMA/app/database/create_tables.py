import logging
import sys
import os

# Add the project root to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

# Import after path setup
from app.database.connection import init_db

if __name__ == "__main__":
    print("Initializing database and creating tables...")
    init_db()
    print("Database initialization complete.")