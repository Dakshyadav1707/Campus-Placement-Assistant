"""
FastAPI backend for the Azure Campus Placement Agent.

This file ONLY handles HTTP routing and error handling. All the actual
Foundry logic lives in foundry_client.py - main.py just calls into it.
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.models import ChatRequest, ChatResponse
from app import foundry_client

app = FastAPI(title="Azure Campus Placement Agent - Backend")

# CORS: allows the React dev server (localhost:5173) to call this backend
# (localhost:8000) from the browser. Browsers block cross-origin requests
# by default unless the server explicitly allows them.
#
# NOTE: we list the exact frontend URL, not "*", so that only our own
# frontend can call this backend once it's deployed publicly later.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def health_check():
    """Simple endpoint to confirm the backend is running (used by the
    'Agent Online' indicator in the frontend later)."""
    return {"status": "ok", "message": "Campus Placement Agent backend is running"}


@app.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest):
    message = req.message.strip()
    if not message:
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    session_id = req.session_id or "default"

    try:
        reply = foundry_client.ask_agent(message, session_id)
        conversation_id = foundry_client._conversations.get(session_id)
        return ChatResponse(response=reply, conversation_id=conversation_id)

    except Exception as e:
        # We log the REAL error to our own terminal for debugging,
        # but never send Azure error details/stack traces to the browser.
        print(f"[ERROR] Foundry call failed: {e}")
        raise HTTPException(
            status_code=502,
            detail="Sorry, I couldn't connect to the placement agent. Please try again.",
        )
