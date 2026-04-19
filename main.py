import os
import sqlite3
import json
import uuid
from datetime import datetime, timezone
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import List
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from tutor import (
    expand_query,
    retrieve_passages,
    format_passages_for_claude,
    chat,
    SYSTEM_PROMPT
)

DB_PATH = "chats.db"

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    with get_db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS chats (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                question TEXT NOT NULL,
                conversation TEXT NOT NULL,
                messages TEXT NOT NULL,
                passages TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
        """)
        conn.execute("CREATE INDEX IF NOT EXISTS idx_user_id ON chats(user_id)")

init_db()

limiter = Limiter(key_func=get_remote_address)

app = FastAPI()
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

origins = ["http://localhost:5173"]
if os.environ.get("FRONTEND_URL"):
    origins.append(os.environ["FRONTEND_URL"])

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

class StartRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=500)

class Message(BaseModel):
    role: str
    content: str = Field(..., max_length=20000)

class ChatRequest(BaseModel):
    student_message: str = Field(..., min_length=1, max_length=500)
    messages: List[Message] = Field(..., max_length=50)

class ConversationMessage(BaseModel):
    role: str
    text: str

class SaveChatRequest(BaseModel):
    user_id: str = Field(..., min_length=1, max_length=100)
    question: str = Field(..., min_length=1, max_length=500)
    conversation: List[ConversationMessage]
    messages: List[Message]
    passages: List[dict]

@app.post("/start")
@limiter.limit("10/minute")
async def start(request: Request, body: StartRequest):
    expanded = expand_query(body.question)
    passages = retrieve_passages(expanded)
    formatted = format_passages_for_claude(passages)

    first_message = f"""The student asks: "{body.question}"

Here are the relevant passages from Jane Eyre:
{formatted}

Please help the student think through these passages using the Socratic approach."""

    messages = [{"role": "user", "content": first_message}]
    tutor_response = chat(messages)
    messages.append({"role": "assistant", "content": tutor_response})

    return {
        "passages": [
            {
                "text": p["text"],
                "chapter": p["chapter"],
                "paragraph": p["paragraph"]
            }
            for p in passages
        ],
        "tutor_message": tutor_response,
        "messages": messages
    }

@app.post("/chat")
@limiter.limit("20/minute")
async def chat_endpoint(request: Request, body: ChatRequest):
    messages = [{"role": m.role, "content": m.content} for m in body.messages]
    messages.append({"role": "user", "content": body.student_message})
    tutor_response = chat(messages)
    messages.append({"role": "assistant", "content": tutor_response})

    return {
        "tutor_message": tutor_response,
        "messages": messages
    }

@app.post("/chats")
@limiter.limit("30/minute")
async def save_chat(request: Request, body: SaveChatRequest):
    chat_id = str(uuid.uuid4())
    created_at = datetime.now(timezone.utc).isoformat()
    with get_db() as conn:
        conn.execute(
            "INSERT INTO chats (id, user_id, question, conversation, messages, passages, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (
                chat_id,
                body.user_id,
                body.question,
                json.dumps([m.model_dump() for m in body.conversation]),
                json.dumps([m.model_dump() for m in body.messages]),
                json.dumps(body.passages),
                created_at,
            )
        )
    return {"id": chat_id, "created_at": created_at}

@app.get("/chats/{user_id}")
@limiter.limit("30/minute")
async def get_chats(request: Request, user_id: str):
    with get_db() as conn:
        rows = conn.execute(
            "SELECT id, question, conversation, messages, passages, created_at FROM chats WHERE user_id = ? ORDER BY created_at DESC LIMIT 50",
            (user_id,)
        ).fetchall()
    return [
        {
            "id": row["id"],
            "question": row["question"],
            "conversation": json.loads(row["conversation"]),
            "messages": json.loads(row["messages"]),
            "passages": json.loads(row["passages"]),
            "created_at": row["created_at"],
        }
        for row in rows
    ]

@app.delete("/chats/{chat_id}")
@limiter.limit("30/minute")
async def delete_chat(request: Request, chat_id: str, user_id: str):
    with get_db() as conn:
        conn.execute("DELETE FROM chats WHERE id = ? AND user_id = ?", (chat_id, user_id))
    return {"ok": True}

@app.get("/health")
async def health():
    return {"status": "ok"}
