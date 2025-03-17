import React from "react";

function ChatbotUI({ messages }) {
  return (
    <div className="border p-4 rounded-lg bg-white">
      {messages.map((msg, index) => (
        <p
          key={index}
          className={
            msg.type === "user"
              ? "text-right text-blue-500"
              : "text-left text-black"
          }
        >
          {msg.text}
        </p>
      ))}
    </div>
  );
}

export default ChatbotUI;
