from transformers import pipeline

chatbot = pipeline("conversational", model="facebook/blenderbot-400M-distill")

def generate_response(user_input):
    response = chatbot(user_input)
    return response[0]["generated_text"]
