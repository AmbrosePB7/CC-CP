import os
from TTS.api import TTS

# Load the Coqui TTS model (Ensure you have a valid model installed)
tts = TTS(model_name="tts_models/en/ljspeech/tacotron2-DDC", progress_bar=False, gpu=False)

# Define output directory
OUTPUT_DIR = "generated_audio"
os.makedirs(OUTPUT_DIR, exist_ok=True)

def generate_speech(text: str) -> str:
    """Generate speech from text and save it as an audio file."""
    if not text or text.strip() == "":
        raise ValueError("Text input for TTS is empty.")

    # Define output file path
    audio_output_path = os.path.join(OUTPUT_DIR, "output.wav")

    # Generate speech and save to file
    tts.tts_to_file(text=text, file_path=audio_output_path)

    return audio_output_path
