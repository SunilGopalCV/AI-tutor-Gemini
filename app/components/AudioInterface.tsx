"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, PlayIcon, Square } from "lucide-react";
import { GeminiWebSocket } from "../services/geminiWebSocket";
import { Base64 } from "js-base64";

interface AudioInterfaceProps {
  onTranscription: (text: string) => void;
  captureContentCallback: () => string;
  contentType: "code" | "math";
  onSessionStateChange?: (isActive: boolean) => void;
}

export default function AudioInterface({
  onTranscription,
  captureContentCallback,
  contentType,
  onSessionStateChange,
}: AudioInterfaceProps) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const geminiWsRef = useRef<GeminiWebSocket | null>(null);
  const audioWorkletNodeRef = useRef<AudioWorkletNode | null>(null);
  const [isAudioSetup, setIsAudioSetup] = useState(false);
  const setupInProgressRef = useRef(false);
  const [isWebSocketReady, setIsWebSocketReady] = useState(false);
  const contentIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isModelSpeaking, setIsModelSpeaking] = useState(false);
  const [outputAudioLevel, setOutputAudioLevel] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<
    "disconnected" | "connecting" | "connected"
  >("disconnected");
  const [isSessionActive, setIsSessionActive] = useState(false);

  const cleanupAudio = useCallback(() => {
    if (audioWorkletNodeRef.current) {
      audioWorkletNodeRef.current.disconnect();
      audioWorkletNodeRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  }, []);

  const cleanupWebSocket = useCallback(() => {
    if (geminiWsRef.current) {
      geminiWsRef.current.disconnect();
      geminiWsRef.current = null;
    }
  }, []);

  // Send audio data to Gemini
  const sendAudioData = (b64Data: string) => {
    if (!geminiWsRef.current || !isWebSocketReady) return;
    geminiWsRef.current.sendMediaChunk(b64Data, "audio/pcm");
  };

  // Toggle audio capture
  const toggleListening = async () => {
    if (isListening && stream) {
      setIsListening(false);
      // Note: We DON'T cleanup WebSocket here to maintain context
      cleanupAudio();
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      // Keep the connection status as connected since WebSocket stays open
      setConnectionStatus("connected");
    } else {
      if (!isSessionActive) {
        // If session is not active, start it first
        toggleSession();
      }

      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            sampleRate: 16000,
            channelCount: 1,
            echoCancellation: true,
            autoGainControl: true,
            noiseSuppression: true,
          },
        });

        audioContextRef.current = new AudioContext({
          sampleRate: 16000,
        });

        setStream(audioStream);
        setIsListening(true);

        // Connect WebSocket if not already connected
        if (geminiWsRef.current && !isWebSocketReady) {
          setConnectionStatus("connecting");
          geminiWsRef.current.connect();
        }
      } catch (err) {
        console.error("Error accessing audio devices:", err);
        cleanupAudio();
      }
    }
  };

  // Create WebSocket once and reuse to maintain conversation context
  useEffect(() => {
    if (!isSessionActive) {
      // Cleanup WebSocket when session ends
      if (geminiWsRef.current) {
        console.log("[Audio] Cleaning up WebSocket on session end");
        cleanupWebSocket();
        setIsWebSocketReady(false);
        setConnectionStatus("disconnected");
      }
      return;
    }

    // Only create the WebSocket if it doesn't exist yet
    if (!geminiWsRef.current) {
      console.log("[Audio] Creating new WebSocket connection");
      setConnectionStatus("connecting");
      geminiWsRef.current = new GeminiWebSocket(
        (text) => {
          console.log("Received from Gemini:", text);
        },
        () => {
          console.log("[Audio] WebSocket setup complete");
          setIsWebSocketReady(true);
          setConnectionStatus("connected");
        },
        (isPlaying) => {
          setIsModelSpeaking(isPlaying);
        },
        (level) => {
          setOutputAudioLevel(level);
        },
        onTranscription
      );
      geminiWsRef.current.connect();
    }
  }, [isSessionActive, onTranscription, cleanupWebSocket]);

  // Start content capture only after WebSocket is ready
  useEffect(() => {
    if (!isListening || !isWebSocketReady || !isSessionActive) return;

    console.log(`[${contentType}] Starting content capture interval`);
    contentIntervalRef.current = setInterval(captureAndSendContent, 2000);

    return () => {
      if (contentIntervalRef.current) {
        clearInterval(contentIntervalRef.current);
        contentIntervalRef.current = null;
      }
    };
  }, [isListening, isWebSocketReady, contentType, isSessionActive]);

  // Update audio processing setup
  useEffect(() => {
    if (
      !isListening ||
      !stream ||
      !audioContextRef.current ||
      !isWebSocketReady ||
      isAudioSetup ||
      setupInProgressRef.current ||
      !isSessionActive
    )
      return;

    let isActive = true;
    setupInProgressRef.current = true;

    const setupAudioProcessing = async () => {
      try {
        const ctx = audioContextRef.current;
        if (!ctx || ctx.state === "closed" || !isActive) {
          setupInProgressRef.current = false;
          return;
        }

        if (ctx.state === "suspended") {
          await ctx.resume();
        }

        await ctx.audioWorklet.addModule("/worklets/audio-processor.js");

        if (!isActive) {
          setupInProgressRef.current = false;
          return;
        }

        audioWorkletNodeRef.current = new AudioWorkletNode(
          ctx,
          "audio-processor",
          {
            numberOfInputs: 1,
            numberOfOutputs: 1,
            processorOptions: {
              sampleRate: 16000,
              bufferSize: 4096,
            },
            channelCount: 1,
            channelCountMode: "explicit",
            channelInterpretation: "speakers",
          }
        );

        const source = ctx.createMediaStreamSource(stream);
        audioWorkletNodeRef.current.port.onmessage = (event) => {
          if (!isActive || isModelSpeaking) return;
          const { pcmData, level } = event.data;
          setAudioLevel(level);

          const pcmArray = new Uint8Array(pcmData);
          const b64Data = Base64.fromUint8Array(pcmArray);
          sendAudioData(b64Data);
        };

        source.connect(audioWorkletNodeRef.current);
        setIsAudioSetup(true);
        setupInProgressRef.current = false;

        return () => {
          source.disconnect();
          if (audioWorkletNodeRef.current) {
            audioWorkletNodeRef.current.disconnect();
          }
          setIsAudioSetup(false);
        };
      } catch (error) {
        if (isActive) {
          cleanupAudio();
          setIsAudioSetup(false);
        }
        setupInProgressRef.current = false;
      }
    };

    console.log("[Audio] Starting audio processing setup");
    setupAudioProcessing();

    return () => {
      isActive = false;
      setIsAudioSetup(false);
      setupInProgressRef.current = false;
      if (audioWorkletNodeRef.current) {
        audioWorkletNodeRef.current.disconnect();
        audioWorkletNodeRef.current = null;
      }
    };
  }, [isListening, stream, isWebSocketReady, isModelSpeaking, isSessionActive]);

  // Capture and send content
  const captureAndSendContent = () => {
    if (!geminiWsRef.current || !isWebSocketReady) return;

    try {
      // Get content (code or math canvas) from parent component
      const contentData = captureContentCallback();
      if (!contentData) return;

      // Determine content type and send to Gemini
      const isBase64 = contentData.startsWith("data:image");

      if (isBase64) {
        // If it's a base64 image
        const b64Data = contentData.split(",")[1];
        geminiWsRef.current.sendMediaChunk(b64Data, "image/png");
      } else {
        // For code content, send as text
        const textEncoder = new TextEncoder();
        const contentBytes = textEncoder.encode(contentData);
        const b64Content = Base64.fromUint8Array(contentBytes);

        // Check if sendTextContent method exists in GeminiWebSocket
        if (typeof geminiWsRef.current.sendTextContent === "function") {
          geminiWsRef.current.sendTextContent(b64Content);
        } else {
          console.warn(
            "sendTextContent method not available in GeminiWebSocket"
          );
          // Fallback to sending as media chunk if method doesn't exist
          geminiWsRef.current.sendMediaChunk(b64Content, "text/plain");
        }
      }
    } catch (error) {
      console.error(`Error capturing ${contentType} content:`, error);
    }
  };

  // Toggle session
  const toggleSession = () => {
    const newSessionState = !isSessionActive;
    setIsSessionActive(newSessionState);

    if (onSessionStateChange) {
      onSessionStateChange(newSessionState);
    }

    if (!newSessionState && isListening) {
      // Stop listening if session is stopped
      setIsListening(false);
      cleanupAudio();
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        setStream(null);
      }
      // WebSocket cleanup is handled in the session effect
    }
  };

  return (
    <div className="space-y-4">
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-800">
                AI Tutor {isModelSpeaking ? "Speaking" : "Listening"}
              </h3>
              <p className="text-sm text-gray-500">
                {isSessionActive
                  ? connectionStatus === "connected"
                    ? "Connected to Gemini"
                    : connectionStatus === "connecting"
                    ? "Connecting..."
                    : "Session active - Start speaking"
                  : "Session inactive - Start session to begin"}
              </p>
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={toggleSession}
                size="sm"
                variant={isSessionActive ? "destructive" : "default"}
                className="text-sm"
              >
                {isSessionActive ? (
                  <>
                    <Square className="h-4 w-4 mr-1" /> Stop Session
                  </>
                ) : (
                  <>
                    <PlayIcon className="h-4 w-4 mr-1" /> Start Session
                  </>
                )}
              </Button>
              {isSessionActive && (
                <Button
                  onClick={toggleListening}
                  size="icon"
                  className={`rounded-full w-12 h-12 transition-colors
                  ${
                    isListening
                      ? "bg-red-500 hover:bg-red-600 text-white"
                      : "bg-green-500 hover:bg-green-600 text-white"
                  }`}
                >
                  {isListening ? (
                    <MicOff className="h-6 w-6" />
                  ) : (
                    <Mic className="h-6 w-6" />
                  )}
                </Button>
              )}
            </div>
          </div>

          {isSessionActive && (
            <div className="w-full h-2 rounded-full bg-gray-100">
              <div
                className="h-full rounded-full transition-all bg-blue-500"
                style={{
                  width: `${
                    isModelSpeaking
                      ? outputAudioLevel
                      : isListening
                      ? audioLevel
                      : 0
                  }%`,
                  transition: "width 100ms ease-out",
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
