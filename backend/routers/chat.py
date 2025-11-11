"""
Chat-related API routes
"""

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
import requests

from models.schemas import ChatRequest
from services.chat_service import ChatService
import json

router = APIRouter()

@router.post("/chat_streaming")
async def chat_streaming(request: ChatRequest):
  """
  Chat endpoint with streaming support and optional MCP tools
  
  Args:
    request: ChatRequest with chat_history
  
  Returns:
    Streaming response
  """
  # Get model data
  model_id = "anthropic/claude-haiku-4.5"

  all_models = requests.get('https://openrouter.ai/api/v1/models').json()['data']
  model_data = next((m for m in all_models if m['id'] == model_id), next(iter(all_models), None))

  if not model_data:
    return {"error": "Model not found"}

  chat_service = ChatService(model_id, model_data)
  messages = chat_service.prepare_messages(request.chat_history)
  
  # Check if any messages have PDFs
  has_pdf = any(msg.pdf for msg in request.chat_history)
  
  payload = await chat_service.create_payload(
    messages,
    use_mcp=True,
    has_pdf=has_pdf
  )
  print(f"Payload for model {model_id}: {json.dumps(payload)}")

  async def event_generator():
    async for event in chat_service.stream_response(
            payload,
            use_mcp=True,
            accumulated_tool_calls=request.approved_tool_calls if hasattr(request, 'approved_tool_calls') else [],
            user_token=request.user_token
        ):
        yield event
  
  return StreamingResponse(event_generator(), media_type="application/stream+json")
