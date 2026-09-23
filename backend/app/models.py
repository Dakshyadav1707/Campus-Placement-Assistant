"""
Request/response shapes for the /chat endpoint.
Keeping these separate from main.py keeps main.py focused on routing.
"""
from typing import Optional
from pydantic import BaseModel


class ChatRequest(BaseModel):
    message: str
    # session_id lets ONE backend serve MANY simultaneous users/browser tabs,
    # each with their own conversation history. The frontend generates a
    # random id once per browser tab and sends it on every request.
    session_id: Optional[str] = "default"


class ChatResponse(BaseModel):
    response: str
    conversation_id: Optional[str] = None
