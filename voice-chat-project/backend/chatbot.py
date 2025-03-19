import openai

openai.api_key = "your-api-key"

def chatbot_response(prompt):
    """Generates AI-based responses using GPT."""
    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[{"role": "system", "content": "You are an assistant."},
                  {"role": "user", "content": prompt}]
    )
    return response["choices"][0]["message"]["content"]

if __name__ == "__main__":
    print(chatbot_response("Turn off the lights"))
