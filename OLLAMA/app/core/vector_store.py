import os
import logging
from typing import List, Dict, Any, Optional

from langchain_community.vectorstores import Chroma
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings

from app.config import VECTOR_STORE_DIR, CHUNK_SIZE, CHUNK_OVERLAP, TOP_K_RESULTS

logger = logging.getLogger(__name__)


class VectorStore:
    """Vector database for storing and retrieving document embeddings"""

    def __init__(self):
        self.embedding_model = HuggingFaceEmbeddings(
            model_name="all-MiniLM-L6-v2",
            model_kwargs={'device': 'cpu'},
            encode_kwargs={'normalize_embeddings': True}
        )

        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=CHUNK_SIZE,
            chunk_overlap=CHUNK_OVERLAP,
            length_function=len,
        )

        self.db = self._load_or_create_db()

    def _load_or_create_db(self) -> Chroma:
        """Load existing vector store or create a new one"""
        try:
            if os.path.exists(VECTOR_STORE_DIR) and os.listdir(VECTOR_STORE_DIR):
                logger.info(f"Loading vector store from {VECTOR_STORE_DIR}")
                return Chroma(
                    persist_directory=VECTOR_STORE_DIR,
                    embedding_function=self.embedding_model
                )
            else:
                logger.info(f"Creating new vector store at {VECTOR_STORE_DIR}")
                db = Chroma(
                    persist_directory=VECTOR_STORE_DIR,
                    embedding_function=self.embedding_model
                )
                return db
        except Exception as e:
            logger.error(f"Error loading vector store: {str(e)}")
            # If there's an error, create a new one
            return Chroma(
                persist_directory=VECTOR_STORE_DIR,
                embedding_function=self.embedding_model
            )

    def add_documents(self, texts: List[str], metadatas: Optional[List[Dict[str, Any]]] = None) -> List[str]:
        """
        Add documents to the vector store

        Args:
            texts: List of document texts
            metadatas: List of metadata dictionaries for each document

        Returns:
            List of document IDs
        """
        try:
            # Split texts into chunks
            split_texts = []
            split_metadatas = []

            for i, text in enumerate(texts):
                chunks = self.text_splitter.split_text(text)
                split_texts.extend(chunks)

                # Duplicate metadata for each chunk if provided
                if metadatas and i < len(metadatas):
                    for _ in range(len(chunks)):
                        split_metadatas.append(metadatas[i])

            # Add to vector store
            ids = self.db.add_texts(
                texts=split_texts,
                metadatas=split_metadatas if metadatas else None
            )

            # Persist the changes
            self.db.persist()

            return ids
        except Exception as e:
            logger.error(f"Error adding documents to vector store: {str(e)}")
            return []

    def search(self, query: str, k: int = TOP_K_RESULTS) -> List[Dict[str, Any]]:
        """
        Search for similar documents

        Args:
            query: The search query
            k: Number of results to return

        Returns:
            List of documents with their content and metadata
        """
        try:
            results = self.db.similarity_search_with_relevance_scores(query, k=k)

            documents = []
            for doc, score in results:
                documents.append({
                    "content": doc.page_content,
                    "metadata": doc.metadata,
                    "relevance_score": score
                })

            return documents
        except Exception as e:
            logger.error(f"Error searching vector store: {str(e)}")
            return []

    def get_relevant_context(self, query: str, k: int = TOP_K_RESULTS) -> str:
        """
        Get relevant context as a single string

        Args:
            query: The search query
            k: Number of results to return

        Returns:
            Concatenated context string
        """
        documents = self.search(query, k=k)
        if not documents:
            return ""

        # Filter out documents with low relevance scores
        filtered_docs = [doc for doc in documents if doc["relevance_score"] > 0.5]

        # If all documents have low relevance, use the original list
        if not filtered_docs:
            filtered_docs = documents

        # Create context string with source information
        context_parts = []
        for i, doc in enumerate(filtered_docs):
            source = doc["metadata"].get("source", f"Document {i + 1}")
            context_parts.append(f"[{source}]:\n{doc['content']}\n")

        return "\n".join(context_parts)


# Create a singleton instance
vector_store = VectorStore()