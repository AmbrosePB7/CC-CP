import whisper
import pyaudio
import wave
import numpy as np
import os
import tempfile

# Initialize a global model with lazy loading
_model = None

def get_model(model_size="base"):
    """Lazy loading of the Whisper model"""
    global _model
    if _model is None:
        _model = whisper.load_model(model_size)
    return _model

def record_audio(filename="temp_audio.wav", duration=5, rate=16000, channels=1):
    """Records audio from microphone and saves to a file."""
    p = pyaudio.PyAudio()
    stream = p.open(format=pyaudio.paInt16, channels=channels, rate=rate, input=True, frames_per_buffer=1024)
    
    frames = []
    print("Recording...")
    
    for _ in range(0, int(rate / 1024 * duration)):
        data = stream.read(1024)
        frames.append(data)
    
    print("Recording finished.")
    
    stream.stop_stream()
    stream.close()
    p.terminate()
    
    with wave.open(filename, 'wb') as wf:
        wf.setnchannels(channels)
        wf.setsampwidth(p.get_sample_size(pyaudio.paInt16))
        wf.setframerate(rate)
        wf.writeframes(b''.join(frames))
    
    return filename

def transcribe_audio(audio_file, language="en"):
    """Transcribes audio file to text using Whisper.
    
    Args:
        audio_file: Path to the audio file to transcribe
        language: Language code (auto for auto-detection)
        
    Returns:
        Transcribed text
    """
    model = get_model()
    
    # If the file is a binary data, save it to a temporary file
    if isinstance(audio_file, bytes):
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as temp_file:
            temp_file.write(audio_file)
            audio_file = temp_file.name
    
    # Handle language selection
    transcription_options = {}
    if language != "auto":
        transcription_options["language"] = language
    
    # Transcribe the audio
    result = model.transcribe(audio_file, **transcription_options)
    
    # Clean up temporary file if created
    if isinstance(audio_file, bytes) and os.path.exists(audio_file):
        os.remove(audio_file)
    
    return result["text"]

def process_streaming_audio(audio_chunk, language="en"):
    """Process audio chunk for streaming recognition."""
    # Convert audio chunk to a temporary file
    with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as temp_file:
        temp_file.write(audio_chunk)
        audio_file = temp_file.name
    
    # Transcribe the audio chunk
    text = transcribe_audio(audio_file, language)
    
    # Clean up
    os.remove(audio_file)
    
    return text

if __name__ == "__main__":
    # Test standalone operation
    audio_file = record_audio(duration=5)
    text = transcribe_audio(audio_file)
    print(f"Transcribed Text: {text}")
    
    # Clean up test file
    os.remove(audio_file)
