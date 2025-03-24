import os
from TTS.api import TTS
import uuid

# Load the Coqui TTS model
tts = TTS(model_name="tts_models/en/ljspeech/tacotron2-DDC", progress_bar=False, gpu=False)

# Define output directory
OUTPUT_DIR = "generated_audio"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Language model mapping
LANGUAGE_MODELS = {
    "en": "tts_models/en/ljspeech/tacotron2-DDC",
    "es": "tts_models/es/css10/vits",
    "fr": "tts_models/fr/css10/vits",
    "de": "tts_models/de/thorsten/vits",
    "it": "tts_models/it/mai_mls/vits"
}

def generate_speech(text: str, language: str = "en") -> str:
    """Generate speech from text and save it as an audio file."""
    if not text or text.strip() == "":
        raise ValueError("Text input for TTS is empty.")
    
    # Use the appropriate model for the language
    model_name = LANGUAGE_MODELS.get(language, LANGUAGE_MODELS["en"])
    
    # Load the correct model if needed
    if tts.model_name != model_name:
        tts.load_model(model_name)
    
    # Generate a unique filename
    filename = f"{uuid.uuid4()}.wav"
    audio_output_path = os.path.join(OUTPUT_DIR, filename)
    
    # Generate speech and save to file
    tts.tts_to_file(text=text, file_path=audio_output_path)
    
    return audio_output_path
