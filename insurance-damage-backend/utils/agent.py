import os
from openai import OpenAI

def ask_agent(prompt, prediction):
    api_key = os.getenv("OPENAI_API_KEY")

    if not api_key:
        return "AI agent is not configured. Please contact support."

    client = OpenAI(api_key=api_key)

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": "You are an insurance claim assistant."
            },
            {
                "role": "user",
                "content": f"Prediction: {prediction}\nQuestion: {prompt}"
            }
        ]
    )

    return response.choices[0].message.content
