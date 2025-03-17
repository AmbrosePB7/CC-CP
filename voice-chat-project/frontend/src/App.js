import React, { useState } from "react";
import VoiceInput from "./components/VoiceInput";
import ChatbotUI from "./components/ChatbotUI";

function App() {
  const [messages, setMessages] = useState([]);

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <h1 className="text-xl font-bold text-center">Voice Chatbot</h1>
      <ChatbotUI messages={messages} />
      <VoiceInput setMessages={setMessages} />
    </div>
  );
}

export default App;
