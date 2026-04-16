import os
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import anthropic
import chromadb
from openai import OpenAI

from tutor import (
    expand_query,
    retrieve_passages,
    format_passages_for_claude,
    chat,
    SYSTEM_PROMPT
)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class StartRequest(BaseModel):
    question: str

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    student_message: str
    messages: List[Message]

@app.post("/start")
async def start(request: StartRequest):
    expanded = expand_query(request.question)
    passages = retrieve_passages(expanded)
    formatted = format_passages_for_claude(passages)

    first_message = f"""The student asks: "{request.question}"

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
async def chat_endpoint(request: ChatRequest):
    messages = [{"role": m.role, "content": m.content} for m in request.messages]
    messages.append({"role": "user", "content": request.student_message})
    tutor_response = chat(messages)
    messages.append({"role": "assistant", "content": tutor_response})

    return {
        "tutor_message": tutor_response,
        "messages": messages
    }

@app.get("/health")
async def health():
    return {"status": "ok"}