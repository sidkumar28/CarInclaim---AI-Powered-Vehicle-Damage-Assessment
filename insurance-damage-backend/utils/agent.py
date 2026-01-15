import os
from openai import OpenAI

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

SYSTEM_PROMPT = """
You are an insurance claim assistant.
You explain damage assessment decisions clearly and honestly.
You never hallucinate.
You only use the provided data.
"""

def ask_agent(detections, decision, user_question):
    prompt = f"""
Here is the damage detection result:
Detections: {detections}

Final Decision:
{decision}

User question:
{user_question}

Explain the answer clearly in simple terms.
"""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt}
        ]
    )

    return response.choices[0].message.content
