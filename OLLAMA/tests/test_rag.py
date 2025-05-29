import pytest
from unittest.mock import patch, MagicMock

from app.core.rag_engine import RAGEngine


@pytest.fixture
def mock_vector_store():
    """Create a mock vector store"""
    mock = MagicMock()
    mock.search.return_value = [
        {
            "content": "Product A is a high-quality item priced at $99.99.",
            "metadata": {"source": "product_catalog.pdf"},
            "relevance_score": 0.85
        },
        {
            "content": "Product B is available in red, blue, and green colors.",
            "metadata": {"source": "product_catalog.pdf"},
            "relevance_score": 0.75
        }
    ]
    return mock


@pytest.fixture
def mock_llm():
    """Create a mock LLM client"""
    mock = MagicMock()
    mock.query.return_value = "Based on the available information, Product A costs $99.99."
    return mock


@pytest.fixture
def rag_engine(mock_vector_store, mock_llm):
    """Create a RAG engine with mocked components"""
    engine = RAGEngine()
    engine.vector_store = mock_vector_store
    engine.llm = mock_llm
    return engine


def test_process_query(rag_engine, mock_vector_store, mock_llm):
    """Test processing a query with the RAG engine"""
    query = "How much does Product A cost?"

    answer, docs = rag_engine.process_query(query)

    # Check that vector store was called correctly
    mock_vector_store.search.assert_called_once_with(query)

    # Check that LLM was called with appropriate context
    assert mock_llm.query.call_count == 1

    # Verify the LLM received context containing product information
    context_arg = mock_llm.query.call_args[0][0]
    assert "Product A" in context_arg
    assert "$99.99" in context_arg

    # Check the answer matches what the LLM returned
    assert answer == "Based on the available information, Product A costs $99.99."

    # Check that documents were returned properly
    assert len(docs) == 2
    assert docs[0]["content"] == "Product A is a high-quality item priced at $99.99."
    assert docs[0]["metadata"]["source"] == "product_catalog.pdf"


def test_format_context(rag_engine):
    """Test formatting documents into context string"""
    documents = [
        {
            "content": "Test content 1",
            "metadata": {"source": "source1.pdf"}
        },
        {
            "content": "Test content 2",
            "metadata": {"source": "source2.pdf"}
        }
    ]

    context = rag_engine._format_context(documents)

    assert "[Source: source1.pdf]" in context
    assert "Test content 1" in context
    assert "[Source: source2.pdf]" in context
    assert "Test content 2" in context


def test_process_history(rag_engine):
    """Test processing chat history for system prompt"""
    history = [
        {"role": "user", "content": "Hello"},
        {"role": "assistant", "content": "Hi there! How can I help?"},
        {"role": "user", "content": "I'm looking for products"}
    ]

    system_prompt = rag_engine._process_history(history)

    assert "Hello" in system_prompt
    assert "Hi there! How can I help?" in system_prompt
    assert "I'm looking for products" in system_prompt