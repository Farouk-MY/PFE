import logging
import os
import json
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime

from app.database.connection import SessionLocal
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.models.schemas import DocumentInfo, DocumentType
from app.utils.parsers import DocumentParser
from app.core.vector_store import vector_store

logger = logging.getLogger(__name__)


class DocumentService:
    """Service for managing knowledge base documents"""

    @staticmethod
    async def add_document(
            content: bytes,
            filename: str,
            description: str,
            doc_type: DocumentType,
            metadata: Optional[Dict[str, Any]] = None
    ) -> Optional[DocumentInfo]:
        """
        Add a document to the knowledge base and database

        Args:
            content: Raw document content
            filename: Original filename
            description: Document description
            doc_type: Type of document
            metadata: Additional metadata

        Returns:
            Document info or None if failed
        """
        try:
            # 1. Parse the document
            text_content, file_path = DocumentParser.parse_document(content, filename, doc_type)

            # 2. Extract metadata
            file_metadata = DocumentParser.extract_metadata(file_path)

            # 3. Combine with user-provided metadata
            if metadata:
                file_metadata.update(metadata)

            # 4. Add description
            file_metadata["description"] = description

            # 5. Add to vector store
            ids = vector_store.add_documents([text_content], [file_metadata])

            if not ids:
                logger.error("Failed to add document to vector store")
                return None

            # 6. Create document info
            doc_info = DocumentInfo(
                id=ids[0],
                name=filename,
                description=description,
                document_type=doc_type,
                metadata=file_metadata,
                created_at=datetime.now(),
                updated_at=datetime.now(),
                file_path=file_path
            )

            # 7. Save metadata to a JSON file for tracking
            metadata_path = file_path + ".metadata.json"
            with open(metadata_path, "w") as f:
                json.dump({
                    "id": ids[0],
                    "name": filename,
                    "description": description,
                    "document_type": doc_type.value,
                    "metadata": file_metadata,
                    "created_at": doc_info.created_at.isoformat(),
                    "updated_at": doc_info.updated_at.isoformat(),
                    "file_path": file_path
                }, f, indent=2)
            
            # 8. Store document metadata in database
            try:
                with SessionLocal() as db:
                    from app.database.models import Document
                    
                    # Create document record
                    db_document = Document(
                        id=ids[0],
                        name=filename,
                        description=description,
                        document_type=doc_type.value,
                        file_path=file_path,
                        doc_metadata=file_metadata,
                        created_at=doc_info.created_at,
                        updated_at=doc_info.updated_at
                    )
                    
                    # Add to database
                    db.add(db_document)
                    db.commit()
                    logger.info(f"Document metadata stored in database with ID: {ids[0]}")
            except Exception as db_error:
                logger.error(f"Error storing document in database: {str(db_error)}")
                # Continue even if database storage fails
                # The document is still available in the file system

            return doc_info

        except Exception as e:
            logger.error(f"Error adding document: {str(e)}")
            return None

    @staticmethod
    def get_product_data() -> List[Dict[str, Any]]:
        """
        Get product data for the chatbot

        Returns:
            List of product dictionaries
        """
        try:
            with SessionLocal() as db:
                query = text("""
                             SELECT p.id,
                                    p.designation,
                                    p.description,
                                    p.prix,
                                    p.qteStock,
                                    p.nbrPoint,
                                    c.name as category_name
                             FROM "Produit" p
                                      LEFT JOIN "Category" c ON p.categoryId = c.id
                             WHERE p.deleted = FALSE
                             """)

                result = db.execute(query)
                products = [dict(row._mapping) for row in result.fetchall()]

                return products
        except SQLAlchemyError as e:
            logger.error(f"Database error in get_product_data: {str(e)}")
            return []

    @staticmethod
    async def generate_product_knowledge() -> str:
        """
        Generate product knowledge text from database

        Returns:
            Formatted product information text
        """
        products = DocumentService.get_product_data()

        if not products:
            return "No product information available."

        # Format as readable text
        text = "# Product Information\n\n"

        for product in products:
            text += f"## {product.get('designation', 'Unknown Product')}\n"
            text += f"ID: {product.get('id', 'N/A')}\n"

            if product.get('description'):
                text += f"Description: {product['description']}\n"

            text += f"Price: ${product.get('prix', 0):.2f}\n"
            text += f"Stock: {product.get('qteStock', 0)} units\n"

            if product.get('category_name'):
                text += f"Category: {product['category_name']}\n"

            if product.get('nbrPoint', 0) > 0:
                text += f"Reward Points: {product['nbrPoint']}\n"

            text += "\n"

        return text
        
    @staticmethod
    async def get_documents() -> List[Dict[str, Any]]:
        """
        Retrieve all documents from the database
        
        Returns:
            List of document dictionaries
        """
        try:
            with SessionLocal() as db:
                from app.database.models import Document
                
                # Query all documents
                documents = db.query(Document).all()
                
                # Convert to dictionaries
                result = [{
                    "id": doc.id,
                    "name": doc.name,
                    "description": doc.description,
                    "document_type": doc.document_type,
                    "file_path": doc.file_path,
                    "metadata": doc.doc_metadata,
                    "created_at": doc.created_at.isoformat() if doc.created_at else None,
                    "updated_at": doc.updated_at.isoformat() if doc.updated_at else None
                } for doc in documents]
                
                return result
        except Exception as e:
            logger.error(f"Error retrieving documents from database: {str(e)}")
            return []
            
    @staticmethod
    async def get_document_by_id(document_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve a document by its ID
        
        Args:
            document_id: The document ID
            
        Returns:
            Document dictionary or None if not found
        """
        try:
            with SessionLocal() as db:
                from app.database.models import Document
                
                # Query document by ID
                document = db.query(Document).filter(Document.id == document_id).first()
                
                if not document:
                    return None
                    
                # Convert to dictionary
                result = {
                    "id": document.id,
                    "name": document.name,
                    "description": document.description,
                    "document_type": document.document_type,
                    "file_path": document.file_path,
                    "metadata": document.doc_metadata,
                    "created_at": document.created_at.isoformat() if document.created_at else None,
                    "updated_at": document.updated_at.isoformat() if document.updated_at else None
                }
                
                return result
        except Exception as e:
            logger.error(f"Error retrieving document from database: {str(e)}")
            return None
            
    @staticmethod
    async def delete_document(document_id: str) -> bool:
        """
        Delete a document by its ID from both database and vector store
        
        Args:
            document_id: The document ID
            
        Returns:
            True if successful, False otherwise
        """
        try:
            # 1. Get document info first to have file path
            document_info = await DocumentService.get_document_by_id(document_id)
            if not document_info:
                logger.error(f"Document with ID {document_id} not found")
                return False
                
            file_path = document_info.get("file_path")
            
            # 2. Delete from database
            with SessionLocal() as db:
                from app.database.models import Document
                
                document = db.query(Document).filter(Document.id == document_id).first()
                if document:
                    db.delete(document)
                    db.commit()
                    logger.info(f"Document with ID {document_id} deleted from database")
                else:
                    logger.warning(f"Document with ID {document_id} not found in database")
            
            # 3. Delete from vector store
            try:
                # Delete from Chroma vector store
                vector_store.db._collection.delete(ids=[document_id])
                vector_store.db.persist()
                logger.info(f"Document with ID {document_id} deleted from vector store")
            except Exception as vs_error:
                logger.error(f"Error deleting document from vector store: {str(vs_error)}")
                # Continue even if vector store deletion fails
            
            # 4. Delete the physical file if it exists
            if file_path and os.path.exists(file_path):
                try:
                    os.remove(file_path)
                    logger.info(f"Document file {file_path} deleted")
                    
                    # Also delete metadata file if it exists
                    metadata_path = file_path + ".metadata.json"
                    if os.path.exists(metadata_path):
                        os.remove(metadata_path)
                        logger.info(f"Document metadata file {metadata_path} deleted")
                except Exception as file_error:
                    logger.error(f"Error deleting document file: {str(file_error)}")
            
            return True
            
        except Exception as e:
            logger.error(f"Error deleting document: {str(e)}")
            return False