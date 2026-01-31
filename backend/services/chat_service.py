"""
Chat service for handling AI model interactions using OpenAI SDK with OpenRouter
"""

import os
import json
import asyncio
from typing import AsyncGenerator, Dict, Any, List, Optional

from dotenv import load_dotenv
from openai import AsyncOpenAI

from models.schemas import Message
from services.mcp_service import mcp_manager

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"

# Initialize OpenAI client configured for OpenRouter
openai_client = AsyncOpenAI(
  api_key=OPENROUTER_API_KEY,
  base_url=OPENROUTER_BASE_URL,
)


class ChatService:
  """Service for managing chat interactions with AI models via OpenRouter"""

  def __init__(self, model_id: str, model_data: Dict[str, Any]):
    self.model_id = model_id
    self.model_data = model_data
    self.client = openai_client

  def prepare_messages(self, chat_history: List[Message]) -> List[Dict[str, Any]]:
    """Convert individual messages to OpenRouter message format, handling different modalities"""
    messages = []

    for msg in chat_history:
      content = []

      # Add text content
      if msg.content:
        content.append({"type": "text", "text": msg.content})

      # Add image content
      if msg.image:
        img_data = msg.image
        url = f"data:image/{img_data['format']};base64,{img_data['data']}"
        content.append({"type": "image_url", "image_url": {"url": url}})

      # Add audio content
      if msg.audio:
        audio_data = msg.audio
        content.append(
          {
            "type": "input_audio",
            "input_audio": {
              "data": audio_data["data"],
              "format": audio_data["format"],
            },
          }
        )

      # Add PDF content
      if msg.pdf:
        pdf_data = msg.pdf
        pdf_url = f"data:application/pdf;base64,{pdf_data['data']}"
        content.append(
          {
            "type": "file",
            "file": {
              "filename": pdf_data["filename"],
              "file_data": pdf_url,
            },
          }
        )

      messages.append({"role": msg.role, "content": content})

    return messages

  async def get_mcp_tools(self) -> List[Dict[str, Any]]:
    """Get all available MCP tools in OpenAI format"""
    try:
      clients = await mcp_manager.get_or_create_all_clients()
      tools_results = await asyncio.gather(
        *[client.get_available_tools() for client in clients],
        return_exceptions=True,
      )
      # Flatten and filter out exceptions
      tools = [
        tool
        for sublist in tools_results
        for tool in sublist
        if not isinstance(sublist, Exception)
      ]
      return tools
    except Exception as e:
      print(f"Failed to load MCP tools: {e}")
      return []

  async def stream_response(
    self,
    messages: List[Dict[str, Any]],
    use_mcp: bool = False,
    has_pdf: bool = False,
    accumulated_tool_calls: List[Dict[str, Any]] = None,
    user_token: Optional[str] = None,
  ) -> AsyncGenerator[str, None]:
    """Stream chat response from OpenRouter API using OpenAI SDK"""
    
    # If there are pre-accumulated tool calls, execute them first
    if accumulated_tool_calls:
      messages = await self._execute_tools(
        accumulated_tool_calls, messages, user_token
      )

    # Build request parameters
    request_params: Dict[str, Any] = {
      "model": self.model_id,
      "messages": messages,
      "stream": True,
    }

    # Add output modalities if available
    if self.model_data.get("architecture", {}).get("output_modalities"):
      request_params["modalities"] = self.model_data["architecture"]["output_modalities"]

    # Add MCP tools if enabled
    if use_mcp:
      tools = await self.get_mcp_tools()
      if tools:
        request_params["tools"] = tools

    # Add extra_body for OpenRouter-specific features (like PDF plugins)
    extra_body = {}
    if has_pdf:
      extra_body["plugins"] = [{"id": "file-parser", "pdf": {"engine": "pdf-text"}}]
    
    if extra_body:
      request_params["extra_body"] = extra_body

    # Track accumulated tool calls during streaming
    streaming_tool_calls: List[Dict[str, Any]] = []

    try:
      stream = await self.client.chat.completions.create(**request_params)

      async for chunk in stream:
        # Convert chunk to dict for JSON serialization
        chunk_dict = chunk.model_dump()

        # Handle tool calls in streaming response
        if use_mcp and chunk_dict.get("choices"):
          choice = chunk_dict["choices"][0]
          delta = choice.get("delta", {})

          if delta.get("tool_calls"):
            self._accumulate_tool_calls(delta["tool_calls"], streaming_tool_calls)

        # Only yield if we're not accumulating tool calls, or no tool calls present
        if not use_mcp or not streaming_tool_calls:
          yield json.dumps(chunk_dict)

      # After streaming completes, handle any accumulated tool calls
      if use_mcp and streaming_tool_calls:
        # Add assistant message with tool calls
        messages.append({
          "role": "assistant",
          "content": "",
          "tool_calls": streaming_tool_calls
        })
        
        # Recursively process tool calls
        async for event in self.stream_response(
          messages=messages,
          use_mcp=use_mcp,
          has_pdf=has_pdf,
          accumulated_tool_calls=streaming_tool_calls,
          user_token=user_token,
        ):
          yield event

    except Exception as e:
      error_response = {
        "error": {
          "message": str(e),
          "type": "api_error"
        }
      }
      yield json.dumps(error_response)

  def _accumulate_tool_calls(self, tool_calls: List[Dict], accumulated: List[Dict]):
    """Accumulate streaming tool call data"""
    for tool_call in tool_calls:
      if tool_call.get("index") is not None:
        index = tool_call["index"]
        while len(accumulated) <= index:
          accumulated.append(
            {
              "id": "",
              "type": "function",
              "function": {"name": "", "arguments": ""},
            }
          )

        if tool_call.get("id"):
          accumulated[index]["id"] = tool_call["id"]
        if tool_call.get("function"):
          if tool_call["function"].get("name"):
            accumulated[index]["function"]["name"] = tool_call["function"]["name"]
          if tool_call["function"].get("arguments"):
            accumulated[index]["function"]["arguments"] += tool_call["function"]["arguments"]

  async def _execute_tools(
    self,
    tool_calls: List[Dict],
    messages: List[Dict[str, Any]],
    user_token: Optional[str] = None,
  ) -> List[Dict[str, Any]]:
    """Execute tool calls and append results to messages"""
    await mcp_manager.get_or_create_all_clients()

    for tool_call in tool_calls:
      tool_name = tool_call["function"]["name"]
      tool_args = json.loads(tool_call["function"]["arguments"] or "{}")
      
      # Only add user_token if the tool accepts it as a parameter
      tool_schema = await mcp_manager.get_tool_schema(tool_name)
      if tool_schema and self._tool_accepts_user_token(tool_schema):
        tool_args["user_token"] = user_token
      
      tool_result = await mcp_manager.call_tool(tool_name, tool_args)

      messages.append(
        {
          "role": "tool",
          "tool_call_id": tool_call["id"],
          "name": tool_name,
          "content": (
            json.dumps(tool_result)
            if tool_result["success"]
            else f"Error: {tool_result['error']}"
          ),
        }
      )

    return messages

  def _tool_accepts_user_token(self, tool_schema: Dict[str, Any]) -> bool:
    """Check if a tool accepts user_token as a parameter"""
    if not tool_schema:
      return False
    
    parameters = tool_schema.get("function", {}).get("parameters", {})
    properties = parameters.get("properties", {})
    
    return "user_token" in properties
