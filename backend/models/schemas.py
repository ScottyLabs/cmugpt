"""
Pydantic models for request/response validation
"""

from pydantic import BaseModel
from typing import Optional, List


class ImageData(BaseModel):
  """Image data with base64 encoding"""
  data: str
  format: str


class PdfData(BaseModel):
  """PDF data with base64 encoding"""
  data: str
  filename: str


class Message(BaseModel):
  """Chat message with optional multimodal attachments"""
  role: str
  content: str
  image: Optional[dict] = None
  audio: Optional[dict] = None
  pdf: Optional[dict] = None


class ChatRequest(BaseModel):
  """Request model for chat endpoint"""
  chat_history: List[Message]
  user_token: Optional[str] = None

