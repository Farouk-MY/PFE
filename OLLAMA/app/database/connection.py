import logging
from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import QueuePool

from app.config import DATABASE_URL

logger = logging.getLogger(__name__)

# Create engine with connection pooling
engine = create_engine(
    DATABASE_URL,
    poolclass=QueuePool,
    pool_size=5,
    max_overflow=10,
    pool_timeout=30,
    pool_recycle=1800,
    echo=True  # Set to False in production
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create base class for declarative models
Base = declarative_base()


def get_db():
    """Get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Initialize database connection and create tables"""
    try:
        # Test the connection
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
            logger.info("✅ Database connection successful")

            # Create all tables defined in models
            from app.database.models import Document, Product, Category, Client, Panier, LignePanier, Commande, Livraison, Paiement
            Base.metadata.create_all(bind=engine)
            logger.info("✅ All database tables created successfully")

            # Log table names for debugging
            result = conn.execute(text("""
                                       SELECT table_name
                                       FROM information_schema.tables
                                       WHERE table_schema = 'public'
                                       """))
            tables = [row[0] for row in result]
            logger.info(f"Available tables: {', '.join(tables)}")
    except Exception as e:
        logger.error(f"❌ Error connecting to database: {str(e)}")
        raise