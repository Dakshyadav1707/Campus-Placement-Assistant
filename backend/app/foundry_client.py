"""
This is the ONLY file in the whole project that talks to Microsoft Foundry.
Keeping all Foundry logic in one place means:
  - main.py doesn't need to know HOW we talk to Foundry, just that
    ask_agent(message) returns a string.
  - If Microsoft changes the SDK later, we only edit this one file.

Your existing Foundry agent (CampusPlacementAgent, a Prompt Agent) already
contains all placement knowledge, instructions, and tools. This file does
NOT duplicate any of that - it just forwards questions to it and returns
whatever it says.
"""
import os
from dotenv import load_dotenv
from azure.identity import DefaultAzureCredential
from azure.ai.projects import AIProjectClient

load_dotenv()  # reads backend/.env into environment variables

FOUNDRY_PROJECT_ENDPOINT = os.getenv("FOUNDRY_PROJECT_ENDPOINT")
FOUNDRY_AGENT_NAME = os.getenv("FOUNDRY_AGENT_NAME")

if not FOUNDRY_PROJECT_ENDPOINT or not FOUNDRY_AGENT_NAME:
    raise RuntimeError(
        "Missing FOUNDRY_PROJECT_ENDPOINT or FOUNDRY_AGENT_NAME. "
        "Copy backend/.env.example to backend/.env and fill in your values."
    )

# --- Lazy, cached client setup -------------------------------------------
# We build the Foundry clients once and reuse them for every request,
# instead of reconnecting on every single chat message (slow + wasteful).
_openai_client = None


def _get_openai_client():
    global _openai_client
    if _openai_client is None:
        # DefaultAzureCredential automatically uses your `az login` session
        # locally, and a managed identity if this is later deployed to
        # Azure. No secret ever appears in code or in .env.
        project = AIProjectClient(
            endpoint=FOUNDRY_PROJECT_ENDPOINT,
            credential=DefaultAzureCredential(),
        )
        # get_openai_client(agent_name=...) returns a client pre-bound to
        # your specific agent, so every call below automatically runs
        # THIS agent (CampusPlacementAgent) - not a raw, un-configured model.
        _openai_client = project.get_openai_client(agent_name=FOUNDRY_AGENT_NAME)
    return _openai_client


# --- Conversation (session) tracking --------------------------------------
# Foundry's Responses API is conversation-based: you create a conversation
# once, then send multiple messages into it, and the AGENT remembers earlier
# turns for you (no need to resend chat history yourself).
#
# We keep a simple in-memory dictionary mapping OUR session_id (one per
# browser tab) -> Foundry's conversation_id.
#
# LIMITATION (fine for a college demo, call this out in your evaluation):
# this dictionary lives in RAM, so if you restart the backend, everyone's
# conversation history/context is lost and a new conversation starts.
_conversations: dict[str, str] = {}


def get_or_create_conversation(session_id: str) -> str:
    if session_id not in _conversations:
        client = _get_openai_client()
        conversation = client.conversations.create()
        _conversations[session_id] = conversation.id
    return _conversations[session_id]


def ask_agent(message: str, session_id: str = "default") -> str:
    """Send one user message to the Foundry agent and return its reply text."""
    client = _get_openai_client()
    conversation_id = get_or_create_conversation(session_id)

    response = client.responses.create(
        conversation=conversation_id,
        input=message,
    )
    return response.output_text
