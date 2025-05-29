from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any, Union
from datetime import datetime
from enum import Enum


class MessageRole(str, Enum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


class Message(BaseModel):
    role: MessageRole
    content: str


class ChatRequest(BaseModel):
    query: str = Field(..., description="User query")
    history: Optional[List[Message]] = Field(default=[], description="Chat history")
    metadata: Optional[Dict[str, Any]] = Field(default={}, description="Additional metadata")


class ChatResponse(BaseModel):
    answer: str
    context: Optional[List[str]] = None
    sources: Optional[List[str]] = None


class DocumentType(str, Enum):
    PDF = "pdf"
    CSV = "csv"
    JSON = "json"
    TEXT = "text"


class DocumentUpload(BaseModel):
    name: str
    description: Optional[str] = None
    document_type: DocumentType
    metadata: Optional[Dict[str, Any]] = None


class DocumentInfo(DocumentUpload):
    id: str
    created_at: datetime
    updated_at: datetime
    file_path: str


class ErrorResponse(BaseModel):
    detail: str


class OrderTrackingRequest(BaseModel):
    order_id: int


class OrderTrackingResponse(BaseModel):
    order_id: int
    status: str
    delivery_date: Optional[datetime] = None
    shipping_info: Optional[Dict[str, Any]] = None
    items: Optional[List[Dict[str, Any]]] = None


class ProductStockRequest(BaseModel):
    product_id: Optional[int] = None
    product_name: Optional[str] = None


class ProductStockResponse(BaseModel):
    product_id: Optional[int] = None
    product_name: Optional[str] = None
    available: int
    price: float
    details: Optional[Dict[str, Any]] = None