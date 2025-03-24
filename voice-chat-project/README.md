# Real-time Voice Conversion Tool

A comprehensive tool for real-time voice conversion, translation, and transcription designed for meetings and calls.

## Features

- **Speech-to-Text (STT)**: Transcribe spoken words into text in real-time
- **Text-to-Speech (TTS)**: Convert text to natural-sounding speech
- **Voice Translation**: Translate between multiple languages
- **Real-time Processing**: Process audio in real-time during meetings
- **Multiple Language Support**: Support for English, French, Spanish, German, Italian, and more
- **File Upload**: Upload audio files for transcription
- **Modern UI**: Clean, responsive interface with Material UI

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:

   ```
   cd backend
   ```

2. Create a virtual environment and activate it:

   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:

   ```
   pip install -r requirements.txt
   ```

4. Start the FastAPI server:
   ```
   uvicorn app:app --reload
   ```

### Frontend Setup

1. Navigate to the frontend directory:

   ```
   cd frontend
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Start the development server:
   ```
   npm start
   ```

## Usage

1. Open your browser and go to `http://localhost:3000`
2. Use the microphone button to start recording
3. Once recording is complete, the speech will be transcribed
4. Use the translate button to translate the text
5. Use the TTS buttons to hear the text or translation spoken

## API Endpoints

- `ws://localhost:8000/ws/voice` - WebSocket for real-time audio processing
- `POST /upload-audio` - Upload audio files for transcription
- `POST /tts` - Convert text to speech
- `POST /translate` - Translate text between languages
- `GET /audio/{filename}` - Get generated audio files

## Requirements

- Python 3.8+
- Node.js 14+
- NPM 6+
- PyAudio dependencies (for microphone access)
- Internet access (for model downloads if not cached)
