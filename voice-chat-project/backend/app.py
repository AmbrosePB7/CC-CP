from fastapi import FastAPI, WebSocket, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from tts import generate_speech

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

# Define request model
class TTSRequest(BaseModel):
    text: str

@app.websocket("/ws/stt")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("WebSocket connection established")

    try:
        while True:
            data = await websocket.receive_text()
            print(f"Received: {data}")

            if not data.strip():
                await websocket.send_text("Error: Empty message")
                continue

            # Simulate response (Replace this with actual STT processing)
            response_text = f"Processed: {data}"
            await websocket.send_text(response_text)

    except Exception as e:
        print("WebSocket error:", e)

    finally:
        print("WebSocket connection closed")
        if websocket.client_state.CONNECTED:
          await websocket.close()


@app.post("/tts")
async def text_to_speech(request: TTSRequest):
    text = request.text.strip()

    if not text:
        raise HTTPException(status_code=400, detail="Text cannot be empty.")

    print("Received text for TTS:", text)

    try:
        audio_path = generate_speech(text)
        return {"audio_path": audio_path}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

