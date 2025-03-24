from fastapi import FastAPI, WebSocket, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from tts import generate_speech
from stt import transcribe_audio
from translation import translate_text
import os
import uuid
import json

# Initialize FastAPI
app = FastAPI()

# Enable CORS (Cross-Origin Resource Sharing)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins (change this for security in production)
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

# Define request models
class TTSRequest(BaseModel):
    text: str
    language: str = "en"

class TranslationRequest(BaseModel):
    text: str
    source_language: str
    target_language: str

# Temporary storage for audio
TEMP_DIR = "temp_audio"
os.makedirs(TEMP_DIR, exist_ok=True)

@app.websocket("/ws/voice")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("WebSocket connection established")

    try:
        while True:
            # Receive message which could be text or binary
            message = await websocket.receive()
            
            # Handle different types of messages
            if "text" in message:
                # Text message - parse as JSON
                data = json.loads(message["text"])
                message_type = data.get("type")
                content = data.get("content", "")
                
                response = {"type": "error", "content": "Invalid request"}
                
                # Handle text-based message types
                if message_type == "translate":
                    source_lang = data.get("sourceLanguage", "en")
                    target_lang = data.get("targetLanguage", "fr")
                    
                    translated_text = translate_text(content, source_lang, target_lang)
                    response = {
                        "type": "translation_result", 
                        "content": translated_text,
                        "sourceLanguage": source_lang,
                        "targetLanguage": target_lang
                    }
                    
                elif message_type == "tts":
                    language = data.get("language", "en")
                    audio_path = generate_speech(content, language)
                    
                    # Return the relative path that the client can request
                    response = {
                        "type": "tts_result", 
                        "content": os.path.basename(audio_path),
                        "language": language
                    }
                
                await websocket.send_text(json.dumps(response))
                
            elif "bytes" in message:
                # Binary message - assume it's audio data for STT
                audio_data = message["bytes"]
                
                # Save to temporary file
                audio_path = os.path.join(TEMP_DIR, f"{uuid.uuid4()}.wav")
                with open(audio_path, "wb") as f:
                    f.write(audio_data)
                
                # Process the audio file
                try:
                    text = transcribe_audio(audio_path)
                    response = {"type": "stt_result", "content": text}
                except Exception as e:
                    response = {"type": "error", "content": f"STT processing error: {str(e)}"}
                
                # Clean up the file
                if os.path.exists(audio_path):
                    os.remove(audio_path)
                
                # Send response back
                await websocket.send_text(json.dumps(response))

    except Exception as e:
        print("WebSocket error:", e)
        try:
            await websocket.send_text(json.dumps({"type": "error", "content": str(e)}))
        except:
            pass  # Connection might already be closed

    finally:
        print("WebSocket connection closed")
        if not websocket.client_state == WebSocket.DISCONNECTED:
            await websocket.close()

@app.post("/upload-audio")
async def upload_audio(file: UploadFile = File(...)):
    """Upload audio file for transcription"""
    # Save uploaded file
    file_path = os.path.join(TEMP_DIR, f"{uuid.uuid4()}_{file.filename}")
    with open(file_path, "wb") as f:
        f.write(await file.read())
    
    # Transcribe the audio
    text = transcribe_audio(file_path)
    
    # Clean up
    os.remove(file_path)
    
    return {"text": text}

@app.post("/tts")
async def text_to_speech(request: TTSRequest):
    """Convert text to speech and return audio file path"""
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty.")
    
    try:
        audio_path = generate_speech(request.text, request.language)
        return {"audio_path": f"/audio/{os.path.basename(audio_path)}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/translate")
async def translate(request: TranslationRequest):
    """Translate text from source language to target language"""
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty.")
    
    try:
        translated = translate_text(request.text, request.source_language, request.target_language)
        return {"translated_text": translated}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/audio/{filename}")
async def get_audio(filename: str):
    """Serve generated audio files"""
    audio_path = os.path.join("generated_audio", filename)
    if not os.path.exists(audio_path):
        raise HTTPException(status_code=404, detail="Audio file not found")
    
    return FileResponse(audio_path)

