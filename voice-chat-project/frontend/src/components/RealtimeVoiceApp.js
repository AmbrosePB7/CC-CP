import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { ReactMediaRecorder } from "react-media-recorder";
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  IconButton,
  Divider,
  Dialog,
  DialogContent,
  DialogTitle,
  CircularProgress,
} from "@mui/material";
import {
  Mic,
  Stop,
  PlayArrow,
  Translate,
  VolumeUp,
  Refresh,
  FileCopy,
  Settings,
  CloudUpload,
} from "@mui/icons-material";

// API URL - change for production
const API_URL = "http://localhost:8000";
const WS_URL = "ws://localhost:8000/ws/voice";

// Language options
const LANGUAGES = {
  en: "English",
  fr: "French",
  es: "Spanish",
  de: "German",
  it: "Italian",
  zh: "Chinese",
  ja: "Japanese",
  ru: "Russian",
  ar: "Arabic",
  hi: "Hindi",
  pt: "Portuguese",
};

const RealtimeVoiceApp = () => {
  // State for transcript and translation
  const [transcript, setTranscript] = useState("");
  const [translatedText, setTranslatedText] = useState("");

  // UI state
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState("");

  // Language settings
  const [srcLang, setSrcLang] = useState("en");
  const [targetLang, setTargetLang] = useState("fr");
  const [ttsLang, setTtsLang] = useState("en");

  // File upload
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);

  // WebSocket and audio
  const socket = useRef(null);
  const audioRef = useRef(new Audio());
  const mediaRecorderRef = useRef(null);

  // Initialize WebSocket connection
  useEffect(() => {
    connectWebSocket();

    // Clean up on unmount
    return () => {
      if (socket.current && socket.current.readyState === WebSocket.OPEN) {
        socket.current.close();
      }
    };
  }, []);

  // Connect to WebSocket
  const connectWebSocket = () => {
    if (socket.current && socket.current.readyState === WebSocket.OPEN) {
      socket.current.close();
    }

    socket.current = new WebSocket(WS_URL);

    socket.current.onopen = () => {
      console.log("WebSocket connection established");
      setIsConnected(true);
      setError("");
    };

    socket.current.onclose = () => {
      console.log("WebSocket connection closed");
      setIsConnected(false);
    };

    socket.current.onerror = (error) => {
      console.error("WebSocket error:", error);
      setError("Connection error. Try again.");
      setIsConnected(false);
    };

    socket.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleWebSocketMessage(data);
    };
  };

  // Handle WebSocket messages
  const handleWebSocketMessage = (data) => {
    const { type, content } = data;

    switch (type) {
      case "stt_result":
        setTranscript((prev) => (prev ? `${prev}\n${content}` : content));
        setIsProcessing(false);
        break;

      case "translation_result":
        setTranslatedText(content);
        setIsProcessing(false);
        break;

      case "tts_result":
        playAudio(`${API_URL}/audio/${content}`);
        setIsProcessing(false);
        break;

      case "error":
        setError(`Error: ${content}`);
        setIsProcessing(false);
        break;

      default:
        console.log("Unknown message type:", type);
    }
  };

  // Send message to WebSocket
  const sendMessage = (type, content, options = {}) => {
    if (!socket.current || socket.current.readyState !== WebSocket.OPEN) {
      setError("Connection lost. Reconnecting...");
      connectWebSocket();
      return false;
    }

    // For binary data (audio), send directly without wrapping in JSON
    if (content instanceof Uint8Array) {
      socket.current.send(content);
      return true;
    }

    // For text-based messages, wrap in JSON
    const message = {
      type,
      content,
      ...options,
    };

    socket.current.send(JSON.stringify(message));
    return true;
  };

  // Handle recording stop - process audio for STT
  const handleRecordingStop = async (blobUrl, blob) => {
    setIsRecording(false);
    setIsProcessing(true);

    try {
      // Convert blob to array buffer
      const arrayBuffer = await blob.arrayBuffer();
      const audioData = new Uint8Array(arrayBuffer);

      // Send audio data directly for STT
      const sent = sendMessage("stt", audioData);

      if (!sent) {
        setIsProcessing(false);
        setError("Failed to send audio data");
      }
    } catch (error) {
      console.error("Error processing audio:", error);
      setIsProcessing(false);
      setError("Error processing audio");
    }
  };

  // Translate text
  const handleTranslate = () => {
    if (!transcript.trim()) {
      setError("No text to translate");
      return;
    }

    setIsProcessing(true);
    sendMessage("translate", transcript, {
      sourceLanguage: srcLang,
      targetLanguage: targetLang,
    });
  };

  // Text to speech
  const handleTTS = (text, language) => {
    if (!text || !text.trim()) {
      setError("No text to speak");
      return;
    }

    setIsProcessing(true);
    sendMessage("tts", text, {
      language: language || ttsLang,
    });
  };

  // Upload and transcribe audio file
  const handleFileUpload = async () => {
    if (!uploadFile) {
      setError("No file selected");
      return;
    }

    setIsProcessing(true);
    setUploadDialogOpen(false);

    try {
      const formData = new FormData();
      formData.append("file", uploadFile);

      const response = await axios.post(`${API_URL}/upload-audio`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data && response.data.text) {
        setTranscript((prev) =>
          prev ? `${prev}\n${response.data.text}` : response.data.text
        );
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      setError("Failed to upload and transcribe file");
    } finally {
      setIsProcessing(false);
    }
  };

  // Play audio
  const playAudio = (url) => {
    audioRef.current.pause();
    audioRef.current.src = url;
    audioRef.current.onplay = () => setIsPlaying(true);
    audioRef.current.onended = () => setIsPlaying(false);
    audioRef.current.onerror = () => {
      setError("Error playing audio");
      setIsPlaying(false);
    };
    audioRef.current.play();
  };

  // Copy text to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        // Show temporary success message
        const origError = error;
        setError("Copied to clipboard!");
        setTimeout(() => setError(origError), 2000);
      })
      .catch((err) => setError("Failed to copy"));
  };

  // Clear transcripts
  const clearTranscripts = () => {
    setTranscript("");
    setTranslatedText("");
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper
        elevation={3}
        sx={{
          p: 4,
          borderRadius: 2,
          background: "linear-gradient(to right bottom, #ffffff, #f8f9fa)",
        }}
      >
        <Typography
          variant="h4"
          gutterBottom
          sx={{ fontWeight: 600, color: "#1976d2", textAlign: "center" }}
        >
          🎙️ Real-time Voice Conversion Assistant
        </Typography>

        <Typography
          variant="subtitle1"
          gutterBottom
          sx={{ textAlign: "center", mb: 3, color: "#555" }}
        >
          Perfect for meetings, calls, and real-time translation
        </Typography>

        {/* Status indicator */}
        <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
          <Typography
            variant="body2"
            color={isConnected ? "success.main" : "error.main"}
          >
            {isConnected ? "Connected ●" : "Disconnected ○"}
          </Typography>
          {error && (
            <Typography variant="body2" color="error.main" sx={{ ml: 2 }}>
              {error}
            </Typography>
          )}
        </Box>

        {/* Control Panel */}
        <Box sx={{ mb: 3 }}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Grid container spacing={2} alignItems="center">
              {/* Language Selection */}
              <Grid item xs={12} md={8}>
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={4}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Source</InputLabel>
                      <Select
                        value={srcLang}
                        label="Source"
                        onChange={(e) => setSrcLang(e.target.value)}
                      >
                        {Object.entries(LANGUAGES).map(([code, name]) => (
                          <MenuItem key={code} value={code}>
                            {name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Target</InputLabel>
                      <Select
                        value={targetLang}
                        label="Target"
                        onChange={(e) => setTargetLang(e.target.value)}
                      >
                        {Object.entries(LANGUAGES).map(([code, name]) => (
                          <MenuItem key={code} value={code}>
                            {name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth size="small">
                      <InputLabel>TTS Voice</InputLabel>
                      <Select
                        value={ttsLang}
                        label="TTS Voice"
                        onChange={(e) => setTtsLang(e.target.value)}
                      >
                        {Object.entries(LANGUAGES).map(([code, name]) => (
                          <MenuItem key={code} value={code}>
                            {name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </Grid>

              {/* Action Buttons */}
              <Grid item xs={12} md={4}>
                <Grid
                  container
                  spacing={1}
                  justifyContent={{ xs: "flex-start", md: "flex-end" }}
                >
                  <Grid item>
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      startIcon={<Refresh />}
                      onClick={clearTranscripts}
                    >
                      Clear
                    </Button>
                  </Grid>
                  <Grid item>
                    <Button
                      variant="outlined"
                      color="primary"
                      size="small"
                      startIcon={<CloudUpload />}
                      onClick={() => setUploadDialogOpen(true)}
                    >
                      Upload
                    </Button>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Paper>
        </Box>

        {/* Recording Controls */}
        <Box sx={{ mb: 4, display: "flex", justifyContent: "center" }}>
          <ReactMediaRecorder
            audio
            blobPropertyBag={{ type: "audio/wav" }}
            onStop={handleRecordingStop}
            render={({
              startRecording,
              stopRecording,
              mediaBlobUrl,
              status,
            }) => (
              <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                {status !== "recording" ? (
                  <Button
                    variant="contained"
                    color="primary"
                    size="large"
                    startIcon={<Mic />}
                    onClick={() => {
                      startRecording();
                      setIsRecording(true);
                    }}
                    disabled={isProcessing || status === "recording"}
                  >
                    Start Recording
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    color="error"
                    size="large"
                    startIcon={<Stop />}
                    onClick={stopRecording}
                  >
                    Stop Recording
                  </Button>
                )}

                {mediaBlobUrl && (
                  <IconButton
                    color="secondary"
                    onClick={() => playAudio(mediaBlobUrl)}
                    disabled={isPlaying}
                  >
                    <PlayArrow />
                  </IconButton>
                )}

                {isProcessing && <CircularProgress size={24} />}
              </Box>
            )}
          />
        </Box>

        {/* Transcript and Translation Area */}
        <Grid container spacing={3}>
          {/* Original Transcript */}
          <Grid item xs={12} md={6}>
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                height: 300,
                overflowY: "auto",
                borderRadius: 2,
                position: "relative",
              }}
            >
              <Typography variant="h6" gutterBottom sx={{ color: "#1976d2" }}>
                Transcript
                <Box component="span" sx={{ float: "right" }}>
                  <IconButton
                    size="small"
                    onClick={() => copyToClipboard(transcript)}
                  >
                    <FileCopy fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleTTS(transcript, srcLang)}
                  >
                    <VolumeUp fontSize="small" />
                  </IconButton>
                </Box>
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Typography
                variant="body1"
                component="div"
                sx={{
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  minHeight: "200px",
                }}
              >
                {transcript || (
                  <em style={{ color: "#999" }}>
                    Your transcript will appear here...
                  </em>
                )}
              </Typography>
            </Paper>
          </Grid>

          {/* Translation */}
          <Grid item xs={12} md={6}>
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                height: 300,
                overflowY: "auto",
                borderRadius: 2,
                position: "relative",
              }}
            >
              <Typography variant="h6" gutterBottom sx={{ color: "#1976d2" }}>
                Translation
                <Box component="span" sx={{ float: "right" }}>
                  <IconButton
                    size="small"
                    onClick={() => copyToClipboard(translatedText)}
                  >
                    <FileCopy fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleTTS(translatedText, targetLang)}
                  >
                    <VolumeUp fontSize="small" />
                  </IconButton>
                </Box>
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Button
                variant="contained"
                color="secondary"
                startIcon={<Translate />}
                onClick={handleTranslate}
                disabled={!transcript || isProcessing}
                sx={{ position: "absolute", bottom: 16, right: 16 }}
              >
                Translate
              </Button>

              <Typography
                variant="body1"
                component="div"
                sx={{
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  minHeight: "200px",
                }}
              >
                {translatedText || (
                  <em style={{ color: "#999" }}>
                    Translated text will appear here...
                  </em>
                )}
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Manual Input Area */}
        <Box sx={{ mt: 3 }}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Manual Text Input
            </Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={8}>
                <TextField
                  fullWidth
                  variant="outlined"
                  size="small"
                  placeholder="Type or paste text here..."
                  multiline
                  rows={2}
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<Translate />}
                      onClick={handleTranslate}
                      disabled={!transcript || isProcessing}
                    >
                      Translate
                    </Button>
                  </Grid>
                  <Grid item xs={6}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<VolumeUp />}
                      onClick={() => handleTTS(transcript)}
                      disabled={!transcript || isProcessing}
                    >
                      Speak
                    </Button>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Paper>
        </Box>
      </Paper>

      {/* File Upload Dialog */}
      <Dialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
      >
        <DialogTitle>Upload Audio File</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, pb: 2 }}>
            <input
              type="file"
              accept="audio/*"
              onChange={(e) => setUploadFile(e.target.files[0])}
            />
          </Box>
          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
            <Button onClick={() => setUploadDialogOpen(false)} sx={{ mr: 1 }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleFileUpload}
              disabled={!uploadFile}
            >
              Upload & Transcribe
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default RealtimeVoiceApp;
