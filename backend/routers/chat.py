"""
Chat-related API routes
"""

from typing import Annotated
from fastapi import APIRouter, Header
from fastapi.responses import StreamingResponse

from openai import AsyncOpenAI

from models.schemas import ChatRequest
from services.chat_service import ChatService

router = APIRouter()

# OpenAI client configured for OpenRouter (for fetching model data)
openrouter_client = AsyncOpenAI(
  api_key="",  # Not needed for models endpoint
  base_url="https://openrouter.ai/api/v1",
)


@router.post("/chat_streaming")
async def chat_streaming(request: ChatRequest, authorization: Annotated[str, Header()] = None):
  """
  Chat endpoint with streaming support and optional MCP tools
  
  Args:
    request: ChatRequest with chat_history
  
  Returns:
    Streaming response
  """
  model_id = "anthropic/claude-haiku-4.5"

  # Fetch model data from OpenRouter
  try:
    models_response = await openrouter_client.models.list()
    all_models = [model.model_dump() for model in models_response.data]
    model_data = next((m for m in all_models if m.get('id') == model_id), None)
    
    if not model_data:
      # Use a default model data structure if not found
      model_data = {
        "id": model_id,
        "architecture": {
          "output_modalities": ["text"]
        }
      }
  except Exception as e:
    # Fallback to basic model data if API call fails
    model_data = {
      "id": model_id,
      "architecture": {
        "output_modalities": ["text"]
      }
    }

  chat_service = ChatService(model_id, model_data)
  messages = chat_service.prepare_messages(request.chat_history)
  
  # Check if any messages have PDFs
  has_pdf = any(msg.pdf for msg in request.chat_history)
  
  # Extract user token from authorization header
  user_token = authorization.split("Bearer ")[-1] if authorization else None

  async def event_generator():
    async for event in chat_service.stream_response(
      messages=messages,
      use_mcp=True,
      has_pdf=has_pdf,
      accumulated_tool_calls=request.approved_tool_calls if hasattr(request, 'approved_tool_calls') else [],
      user_token=user_token,
    ):
      yield f"data: {event}\n\n"
  
  return StreamingResponse(event_generator(), media_type="text/event-stream")
