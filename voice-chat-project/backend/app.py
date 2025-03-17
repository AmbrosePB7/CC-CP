from flask import Flask, request, jsonify
from speech_recognition import recognize_speech
from text_to_speech import speak_text
from chatbot import generate_response
from actions import perform_action

app = Flask(__name__)

@app.route("/voice-chat", methods=["POST"])
def voice_chat():
    user_text = recognize_speech()
    if not user_text:
        return jsonify({"error": "Could not recognize speech"}), 400

    response_text = generate_response(user_text)
    action_result = perform_action(response_text)
    
    speak_text(response_text)
    
    return jsonify({
        "user_input": user_text,
        "chatbot_response": response_text,
        "action_result": action_result
    })

if __name__ == "__main__":
    app.run(debug=True)
