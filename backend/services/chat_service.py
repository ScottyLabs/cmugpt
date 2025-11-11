"""
Chat service for handling AI model interactions
"""

import os
from dotenv import load_dotenv
import requests
import json
import asyncio
from typing import AsyncGenerator, Generator, Dict, Any, List, Optional
from models.schemas import Message
from services.mcp_service import mcp_manager

load_dotenv()
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
print("OPENROUTER_API_KEY:", OPENROUTER_API_KEY)

class ChatService:
  """Service for managing chat interactions with AI models"""

  def __init__(self, model_id: str, model_data: Dict[str, Any]):
    self.model_id = model_id
    self.model_data = model_data

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

  async def create_payload(
    self,
    messages: List[Dict[str, Any]],
    use_mcp: bool = False,
    has_pdf: bool = False,
  ) -> Dict[str, Any]:
    """Create overall request payload for OpenRouter API"""
    output_modalities = self.model_data["architecture"]["output_modalities"]

    payload = {
      "model": self.model_id,
      "messages": messages,
      "modalities": output_modalities,
    }

    # Add MCP tools if enabled
    if use_mcp:
      try:
        clients = await mcp_manager.get_or_create_all_clients()
        tools = await asyncio.gather(
          *[client.get_available_tools() for client in clients],
          return_exceptions=True,
        )
        if tools:
          # flatten and nullcheck tools list
          payload["tools"] = [
            tool
            for sublist in tools
            for tool in sublist
            if not isinstance(tool, Exception)
          ]
      except Exception as e:
        print(f"Failed to load MCP tools: {e}")

    # Add file parser plugin if PDFs are present
    if has_pdf:
      payload["plugins"] = [{"id": "file-parser", "pdf": {"engine": "pdf-text"}}]

    return payload

  async def stream_response(
    self,
    payload: Dict[str, Any],
    use_mcp: bool = False,
    accumulated_tool_calls: List[Dict[str, Any]] = None,
    user_token: Optional[str] = None,
  ) -> AsyncGenerator[str, None]:
    """Stream chat response from OpenRouter API"""
    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
      "Authorization": f"Bearer {OPENROUTER_API_KEY}",
      "Content-Type": "application/json",
    }

    payload["stream"] = True
    buffer = ""

    if accumulated_tool_calls:
      # If there are pre-accumulated tool calls, execute them and continue
      payload = await self._execute_tools(
        accumulated_tool_calls, payload, user_token
      )
      print("Updated payload with accumulated tool calls:", payload)

    accumulated_tool_calls = []

    with requests.post(url, headers=headers, json=payload, stream=True) as r:
      accumulated_message = ""
      tool_calls_complete = False

      for chunk in r.iter_content(chunk_size=1024, decode_unicode=False):
        chunk = chunk.decode("utf-8") if isinstance(chunk, bytes) else chunk
        buffer += chunk

        while True:
          try:
            line_end = buffer.find("\n")
            if line_end == -1:
              break

            line = buffer[:line_end].strip()
            buffer = buffer[line_end + 1 :]

            if line.startswith("data: "):
              data = line[6:]
              try:
                parsed_data = json.loads(data)

                # Handle tool calls in streaming response
                if (
                  use_mcp
                  and "choices" in parsed_data
                  and len(parsed_data["choices"]) > 0
                ):
                  choice = parsed_data["choices"][0]

                  if (
                    "delta" in choice
                    and "content" in choice["delta"]
                  ):
                    accumulated_message += (
                      choice["delta"]["content"] or ""
                    )

                  if (
                    "delta" in choice
                    and "tool_calls" in choice["delta"]
                  ):
                    self._accumulate_tool_calls(
                      choice["delta"]["tool_calls"],
                      accumulated_tool_calls,
                    )

                if (
                  not use_mcp
                  or not accumulated_tool_calls
                ):
                  print("Streaming data:", data)
                  print("acc mcp:", accumulated_tool_calls)
                  yield data

              except json.JSONDecodeError:
                pass
          except Exception:
            break

      # Handle tool calls after streaming
      print("Final accumulated tool calls:", accumulated_tool_calls)
      if use_mcp and accumulated_tool_calls:
        async for event in self.stream_response(
          payload,
          use_mcp=use_mcp,
          accumulated_tool_calls=accumulated_tool_calls,
        ):
          yield event

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

        if "id" in tool_call:
          accumulated[index]["id"] = tool_call["id"]
        if "function" in tool_call:
          if "name" in tool_call["function"]:
            accumulated[index]["function"]["name"] = tool_call["function"][
              "name"
            ]
          if "arguments" in tool_call["function"]:
            accumulated[index]["function"]["arguments"] += tool_call[
              "function"
            ]["arguments"]

  async def _execute_tools(
    self,
    tool_calls: List[Dict],
    payload: Dict[str, Any],
    user_token: Optional[str] = None,
  ) -> Dict[str, Any]:
    print("user_token:", user_token)
    """Execute approved tool calls and stream final response"""
    print("tool_calls:", tool_calls)
    await mcp_manager.get_or_create_all_clients()

    messages = payload["messages"]
    messages.append(
      {"role": "assistant", "content": "", "tool_calls": tool_calls}
    )

    for tool_call in tool_calls:
      tool_name = tool_call["function"]["name"]
      tool_args = json.loads(tool_call["function"]["arguments"] or "{}")
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

    return payload

      

  def execute_approved_tools_streaming(
    self,
    tool_calls: List[Dict],
    chat_history: List[Message],
  ) -> Generator[str, None, None]:
    """
    Execute approved tool calls and stream the final response.
    This is a public method for use by the tool approval endpoint.
    """
    messages = self.prepare_messages(chat_history)

    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
      "Authorization": f"Bearer {OPENROUTER_API_KEY}",
      "Content-Type": "application/json",
    }

    payload = {"model": self.model_id, "messages": messages}

    yield from self._execute_tools_and_continue(
      tool_calls,
      payload,
      headers,
      url,
    )
