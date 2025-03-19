import whisper
import pyaudio
import wave
import numpy as np

# Load Whisper Model
model = whisper.load_model("base")

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

def transcribe_audio(filename="temp_audio.wav"):
    """Transcribes recorded audio to text using Whisper."""
    result = model.transcribe(filename)
    return result["text"]

if __name__ == "__main__":
    record_audio()
    text = transcribe_audio()
    print(f"Transcribed Text: {text}")
