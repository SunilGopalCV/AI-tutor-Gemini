// app/components/MathTutor.tsx
"use client";

import { useState, useRef } from "react";
import MathCanvas from "./MathCanvas";
import AudioInterface from "./AudioInterface";
import ConversationLog from "./ConversationLog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlayIcon, Square, Upload } from "lucide-react";

export default function MathTutor() {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [messages, setMessages] = useState<
    { role: "human" | "ai"; content: string }[]
  >([
    {
      role: "ai",
      content:
        "Welcome to the math tutoring session! I'm your AI tutor. Once you start the session, you can upload an image of a math problem or draw on the canvas. Then speak to me about your questions and I'll help you solve the problem step by step.",
    },
  ]);
  const canvasRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTranscription = (text: string) => {
    setMessages((prev) => [...prev, { role: "ai", content: text }]);
  };

  const captureContent = () => {
    // Get the canvas image data
    if (canvasRef.current) {
      return canvasRef.current.getImageData();
    }
    return "";
  };

  const startSession = () => {
    setIsSessionActive(true);
    setMessages((prev) => [
      ...prev,
      {
        role: "ai",
        content:
          "Session started. I can now see your math work and hear you. Ask me any questions about the problem you're working on.",
      },
    ]);
  };

  const stopSession = () => {
    setIsSessionActive(false);
    setMessages((prev) => [
      ...prev,
      {
        role: "ai",
        content:
          "Session ended. Your conversation history is preserved. Start again any time you need help.",
      },
    ]);
  };

  const handleImageUpload = () => {
    fileInputRef.current?.click();
  };

  const onFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && canvasRef.current) {
      try {
        await canvasRef.current.loadImage(file);
      } catch (error) {
        console.error("Error loading image:", error);
      }
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[calc(100vh-160px)]">
      <div className="flex flex-col space-y-4">
        <Card className="flex-1 border shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg font-semibold">
                Math Canvas
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  onClick={handleImageUpload}
                  variant="outline"
                  className="text-sm"
                  size="sm"
                >
                  <Upload className="h-4 w-4 mr-1" /> Upload Problem
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={onFileSelected}
                  accept="image/*"
                  className="hidden"
                />
                <Button
                  onClick={isSessionActive ? stopSession : startSession}
                  variant={isSessionActive ? "destructive" : "default"}
                  className="text-sm"
                  size="sm"
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
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-2 h-full">
            <MathCanvas ref={canvasRef} />
          </CardContent>
        </Card>

        <AudioInterface
          onTranscription={handleTranscription}
          captureContentCallback={captureContent}
          contentType="math"
          isSessionActive={isSessionActive}
        />
      </div>

      <div className="flex flex-col h-full">
        <Card className="h-full border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">
              Conversation History
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2 h-[calc(100%-64px)] pb-4">
            <ConversationLog messages={messages} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
