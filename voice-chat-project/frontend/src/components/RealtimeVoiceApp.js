import React, { useState, useEffect } from "react";
import axios from "axios";
import { ReactMediaRecorder } from "react-media-recorder";
import MicIcon from "@mui/icons-material/Mic";
import StopIcon from "@mui/icons-material/Stop";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";

const RealtimeVoiceApp = () => {
  const [transcript, setTranscript] = useState("");
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8000/ws/stt"); // Connect to WebSocket
    setSocket(ws);

    ws.onmessage = (event) => {
      setTranscript((prev) => prev + "\n" + event.data);
    };

    return () => ws.close(); // Cleanup WebSocket on unmount
  }, []);

  const playTTS = async (text) => {
    try {
      const response = await axios.post(
        "http://localhost:8000/tts",
        { text },
        { headers: { "Content-Type": "application/json" } }
      );
      new Audio(response.data.audio_url).play();
    } catch (error) {
      console.error(
        "TTS request failed:",
        error.response?.data || error.message
      );
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-5">
      <div className="bg-white shadow-lg rounded-2xl p-6 w-full max-w-2xl">
        <h1 className="text-2xl font-bold text-gray-800 text-center mb-4">
          🎙️ Meeting Voice Assistant
        </h1>

        <div className="flex justify-center space-x-4 mb-4">
          <ReactMediaRecorder
            audio
            render={({ startRecording, stopRecording, mediaBlobUrl }) => (
              <div className="flex space-x-4">
                <button
                  className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md flex items-center space-x-2"
                  onClick={startRecording}
                >
                  <MicIcon /> <span>Start</span>
                </button>
                <button
                  className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md flex items-center space-x-2"
                  onClick={stopRecording}
                >
                  <StopIcon /> <span>Stop</span>
                </button>
                {mediaBlobUrl && (
                  <button
                    className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md flex items-center space-x-2"
                    onClick={() => new Audio(mediaBlobUrl).play()}
                  >
                    <PlayArrowIcon /> <span>Play</span>
                  </button>
                )}
              </div>
            )}
          />
        </div>

        <button
          className="w-full bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md flex items-center justify-center space-x-2"
          onClick={() => playTTS(transcript)}
        >
          🔊 <span>Play TTS</span>
        </button>

        <div className="bg-gray-200 p-4 rounded-lg mt-4">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Live Transcript
          </h3>
          <p className="text-gray-800 whitespace-pre-wrap">{transcript}</p>
        </div>
      </div>
    </div>
  );
};

export default RealtimeVoiceApp;
