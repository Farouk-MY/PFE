import logging
from typing import Dict, List, Any, Optional, Generator

import httpx  # This is the problematic import
from langchain_community.llms import Ollama
from langchain.callbacks.manager import CallbackManager
from langchain.callbacks.streaming_stdout import StreamingStdOutCallbackHandler
from langchain.schema import LLMResult

from app.config import OLLAMA_BASE_URL, OLLAMA_MODEL, SYSTEM_PROMPT

logger = logging.getLogger(__name__)


class OllamaClient:
    """Client for interacting with Ollama hosting Llama 3.2"""

    def __init__(self):
        self.base_url = OLLAMA_BASE_URL
        self.model = OLLAMA_MODEL

        # Initialize the Ollama client for LangChain
        self.llm = Ollama(
            base_url=self.base_url,
            model=self.model,
            callback_manager=CallbackManager([StreamingStdOutCallbackHandler()])
        )

        # Test connection
        self._test_connection()

    def _test_connection(self):
        """Test the connection to Ollama server"""
        try:
            with httpx.Client() as client:
                response = client.get(f"{self.base_url}/api/tags")
                if response.status_code != 200:
                    logger.error(f"Failed to connect to Ollama: {response.text}")
                else:
                    models = response.json().get("models", [])
                    model_names = [model.get("name") for model in models]
                    if self.model not in model_names:
                        logger.warning(f"Model {self.model} not found in Ollama. Available models: {model_names}")
                    else:
                        logger.info(f"Successfully connected to Ollama with model {self.model}")
        except Exception as e:
            logger.error(f"Error connecting to Ollama: {str(e)}")

    def query(self, prompt: str, system_prompt: str = SYSTEM_PROMPT) -> str:
        """
        Send a query to the LLM model

        Args:
            prompt: The user prompt
            system_prompt: System instructions for the LLM

        Returns:
            The response from the LLM
        """
        try:
            response = self.llm.invoke(
                prompt,
                system=system_prompt
            )
            return response
        except Exception as e:
            logger.error(f"Error querying Ollama: {str(e)}")
            return "I'm having trouble processing your request. Please try again later."

    def query_with_context(self, prompt: str, context: str, system_prompt: str = SYSTEM_PROMPT) -> str:
        """
        Send a query with context to the LLM model

        Args:
            prompt: The user prompt
            context: The context to provide to the LLM
            system_prompt: System instructions for the LLM

        Returns:
            The response from the LLM
        """
        try:
            full_prompt = f"""Context information is below.
---------------------
{context}
---------------------

Given the context information and not prior knowledge, answer the question: {prompt}
"""
            return self.query(full_prompt, system_prompt)
        except Exception as e:
            logger.error(f"Error querying Ollama with context: {str(e)}")
            return "I'm having trouble processing your request with the provided context. Please try again later."


# Create a singleton instance
ollama_client = OllamaClient()