import os
from openai import OpenAI
import chromadb
import anthropic

openai_client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])
chroma_client = chromadb.PersistentClient(path="./chroma_db")
collection = chroma_client.get_or_create_collection(name="jane_eyre")
anthropic_client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

SYSTEM_PROMPT = """You are a thoughtful English literature tutor helping a high school student think through Jane Eyre. You have been given several passages from the novel retrieved based on the student's question. Your job is not to answer for the student but to help them think.

STRICT RULE: Never quote specific text from Jane Eyre unless it appears word-for-word in the passages provided in this conversation. You may discuss themes, characters, and context from your broader knowledge of the novel, but all direct quotations must come only from the provided passages.

Start by asking the student one single specific question about a concrete moment or detail in one of the passages — point them to something particular (a word choice, an action, a description). Wait for their response before moving on. As the conversation develops, guide them through these areas one at a time, in whatever order feels natural:
- The tone of the passages
- Literary devices they notice
- Motifs across the passages
- How the characters change or relate to each other
- A specific insight about the passages
- The overarching theme the passages reveal — something that could point them toward a thesis

Only ask one question at a time. React to what the student says before moving to the next idea. Never ask more than one question per response.

As the conversation continues, react to the student's answers thoughtfully. Affirm what they notice, gently correct misconceptions, and keep pushing their thinking deeper. If they give a strong answer, acknowledge it and ask a harder follow-up. If they're stuck, help them look more closely at the text without giving the answer away.

Always stay anchored to the student's original question. If the student asked about nature imagery, keep returning to nature imagery. If the conversation starts to drift toward a different topic, gently steer it back. The final thesis question should connect back to the original topic the student asked about.

Never ask leading questions that have a specific answer in mind. React to what the student actually says rather than steering them toward a predetermined conclusion. If the student pushes back or says they're confused, take their pushback seriously and adjust your approach.

When a student has articulated a clear, arguable theme or thesis — even if it could be refined further — affirm it specifically, summarize the textual evidence they identified that supports it, and bring the conversation to a close. Do not keep pushing once they have something workable. A workable thesis is one that makes a specific claim about the text that could be argued and supported with evidence.

Never write the essay for them."""

def expand_query(question):
    response = anthropic_client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=100,
        system="You are helping retrieve passages from Jane Eyre for a high school student. Rewrite the student's question as a specific, concrete, retrieval-friendly query that will find the most relevant passages. Return only the rewritten query, nothing else.",
        messages=[{"role": "user", "content": question}]
    )
    expanded = response.content[0].text.strip()
    print(f"Expanded query: {expanded}\n")
    return expanded

def retrieve_passages(question, n_results=5):
    response = openai_client.embeddings.create(
        input=[question],
        model="text-embedding-3-small"
    )
    query_embedding = response.data[0].embedding
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=n_results
    )
    passages = []
    for doc, metadata in zip(results["documents"][0], results["metadatas"][0]):
        passages.append({
            "text": doc,
            "chapter": metadata["chapter"],
            "paragraph": metadata["paragraph"],
            "context_before": metadata["context_before"],
            "context_after": metadata["context_after"]
        })
    return passages

def format_passages_for_claude(passages):
    formatted = ""
    for i, passage in enumerate(passages):
        formatted += f"\n--- Passage {i+1} | {passage['chapter']} ---\n"
        if passage["context_before"]:
            formatted += f"[Context before: {passage['context_before']}]\n\n"
        formatted += passage["text"]
        if passage["context_after"]:
            formatted += f"\n\n[Context after: {passage['context_after']}]"
        formatted += "\n"
    return formatted

def display_passages(passages):
    print("\n" + "="*60)
    print("RETRIEVED PASSAGES")
    print("="*60)
    for i, passage in enumerate(passages):
        print(f"\nPassage {i+1} | {passage['chapter']}")
        print("-"*40)
        print(passage["text"])
    print("\n" + "="*60 + "\n")

def chat(messages):
    response = anthropic_client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1000,
        system=SYSTEM_PROMPT,
        messages=messages
    )
    return response.content[0].text

def tutor(question):
    print("\nRetrieving passages...\n")
    expanded = expand_query(question)
    passages = retrieve_passages(expanded)
    display_passages(passages)
    formatted = format_passages_for_claude(passages)

    first_message = f"""The student asks: "{question}"

Here are the relevant passages from Jane Eyre:
{formatted}

Please help the student think through these passages using the Socratic approach."""

    messages = [{"role": "user", "content": first_message}]

    response = chat(messages)
    print(f"\nTutor: {response}\n")
    messages.append({"role": "assistant", "content": response})

    while True:
        student_input = input("You: ").strip()
        if student_input.lower() in ["quit", "exit", "done"]:
            print("\nTutor: Great work today. Use what you've noticed in these passages as the foundation for your essay. Good luck!")
            break
        if not student_input:
            continue

        messages.append({"role": "user", "content": student_input})
        response = chat(messages)
        print(f"\nTutor: {response}\n")
        messages.append({"role": "assistant", "content": response})

if __name__ == "__main__":
    tutor("how does Bronte use weather and nature imagery")