import logging
from typing import Dict, List, Any, Optional, Tuple

from app.core.ollama_client import ollama_client
from app.core.vector_store import vector_store
from app.config import QUERY_PROMPT, SYSTEM_PROMPT

logger = logging.getLogger(__name__)


class RAGEngine:
    """Retrieval-Augmented Generation engine for the chatbot"""

    def __init__(self):
        self.vector_store = vector_store
        self.llm = ollama_client

    def process_query(
            self,
            query: str,
            history: Optional[List[Dict[str, str]]] = None,
            db_info: str = ""
    ) -> Tuple[str, List[Dict[str, Any]]]:
        """
        Process a user query using RAG

        Args:
            query: The user's query
            history: Optional chat history
            db_info: Optional database information

        Returns:
            Tuple of (answer, relevant_docs)
        """
        try:
            # 1. Retrieve relevant documents
            relevant_docs = self.vector_store.search(query)

            # 2. Format context for the LLM
            context = self._format_context(relevant_docs)

            # 3. Generate an answer with the LLM
            prompt = QUERY_PROMPT.format(context=context, db_info=db_info, query=query)

            # 4. Process chat history if available
            system_prompt = self._process_history(history) if history else SYSTEM_PROMPT

            # 5. Generate the answer
            answer = self.llm.query(prompt, system_prompt=system_prompt)

            return answer, relevant_docs
        except Exception as e:
            logger.error(f"Error in RAG processing: {str(e)}")
            return "I'm sorry, I encountered an error while processing your question. Please try again.", []

    def _format_context(self, documents: List[Dict[str, Any]]) -> str:
        """Format retrieved documents into a context string"""
        if not documents:
            return "No relevant information found."

        context_parts = []
        for i, doc in enumerate(documents):
            # Extract source if available
            source = doc.get("metadata", {}).get("source", f"Document {i + 1}")

            # Add content with source reference
            context_parts.append(f"[Source: {source}]\n{doc['content']}")

        return "\n\n".join(context_parts)

    def _process_history(self, history: List[Dict[str, str]]) -> str:
        """Process chat history to enhance system prompt"""
        if not history:
            return SYSTEM_PROMPT

        # Extract key information from history to enhance the system prompt
        # This is a simple approach - can be improved with more sophisticated methods
        history_str = "\nRecent conversation:\n"
        for msg in history[-5:]:  # Use last 5 messages
            role = msg.get("role", "")
            content = msg.get("content", "")
            history_str += f"{role.upper()}: {content}\n"

        return f"{SYSTEM_PROMPT}\n{history_str}"


# Create a singleton instance
rag_engine = RAGEngine()