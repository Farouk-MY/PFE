import logging
from typing import List, Dict, Any, Optional

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import JSONResponse

from app.models.schemas import DocumentInfo, DocumentType, DocumentUpload
from app.api.services.db_service import DocumentService

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/documents/upload", response_model=DocumentInfo, status_code=status.HTTP_201_CREATED)
async def upload_document(
        file: UploadFile = File(...),
        name: str = Form(...),
        description: str = Form(""),
        document_type: DocumentType = Form(...),
):
    """
    Upload a document to the knowledge base

    Args:
        file: The document file
        name: Document name
        description: Document description
        document_type: Type of document

    Returns:
        DocumentInfo: Information about the uploaded document
    """
    try:
        # Read file content
        content = await file.read()

        # Add document to knowledge base
        doc_info = await DocumentService.add_document(
            content=content,
            filename=name,
            description=description,
            doc_type=document_type,
        )

        if not doc_info:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to add document to knowledge base"
            )

        return doc_info
    except Exception as e:
        logger.error(f"Error uploading document: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error uploading document: {str(e)}"
        )


@router.post("/knowledge/generate-product-info", status_code=status.HTTP_200_OK)
async def generate_product_knowledge():
    """
    Generate product knowledge from database

    Returns:
        Success message
    """
    try:
        # Generate product knowledge text
        product_text = await DocumentService.generate_product_knowledge()

        # Add to vector store
        ids = vector_store.add_documents(
            texts=[product_text],
            metadatas=[{
                "source": "product_database",
                "description": "Product information from database",
                "generated": "True"
            }]
        )

        if not ids:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to add product knowledge to vector store"
            )

        return {"message": "Product knowledge generated and added to vector store", "id": ids[0]}
    except Exception as e:
        logger.error(f"Error generating product knowledge: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating product knowledge: {str(e)}"
        )


from app.core.vector_store import vector_store


@router.get("/documents/search", status_code=status.HTTP_200_OK)
async def search_documents(query: str, limit: int = 5):
    """
    Search documents in the knowledge base

    Args:
        query: Search query
        limit: Maximum number of results

    Returns:
        List of relevant documents
    """
    try:
        results = vector_store.search(query, k=limit)
        return {"results": results}
    except Exception as e:
        logger.error(f"Error searching documents: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error searching documents: {str(e)}"
        )


@router.get("/documents", status_code=status.HTTP_200_OK)
async def list_documents():
    """
    List all documents in the database

    Returns:
        List of documents
    """
    try:
        documents = await DocumentService.get_documents()
        return {"documents": documents}
    except Exception as e:
        logger.error(f"Error listing documents: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error listing documents: {str(e)}"
        )


@router.get("/documents/{document_id}", status_code=status.HTTP_200_OK)
async def get_document(document_id: str):
    """
    Get a document by ID

    Args:
        document_id: Document ID

    Returns:
        Document information
    """
    try:
        document = await DocumentService.get_document_by_id(document_id)
        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Document with ID {document_id} not found"
            )
        return document
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving document: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving document: {str(e)}"
        )


@router.delete("/documents/{document_id}", status_code=status.HTTP_200_OK)
async def delete_document(document_id: str):
    """
    Delete a document by ID

    Args:
        document_id: Document ID

    Returns:
        Success message
    """
    try:
        success = await DocumentService.delete_document(document_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Document with ID {document_id} not found or could not be deleted"
            )
        return {"message": f"Document with ID {document_id} successfully deleted"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting document: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting document: {str(e)}"
        )