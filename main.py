import os
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
    content: str = Field(..., max_length=2000)

class ChatRequest(BaseModel):
    student_message: str = Field(..., min_length=1, max_length=500)
    messages: List[Message] = Field(..., max_length=50)

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

@app.get("/health")
async def health():
    return {"status": "ok"}
