import React from "react";

function VoiceInput({ setMessages }) {
  const handleClick = async () => {
    const response = await fetch("http://localhost:5000/voice-chat", {
      method: "POST",
    });
    const data = await response.json();

    setMessages((prev) => [
      ...prev,
      { text: data.user_input, type: "user" },
      { text: data.chatbot_response, type: "bot" },
    ]);
  };

  return (
    <button
      onClick={handleClick}
      className="mt-4 p-2 bg-blue-500 text-white rounded"
    >
      Speak
    </button>
  );
}

export default VoiceInput;
