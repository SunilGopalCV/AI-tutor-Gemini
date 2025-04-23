// app/components/CodeTutor.tsx
"use client";

import { useState } from "react";
import CodeEditor from "./CodeEditor";
import AudioInterface from "./AudioInterface";
import ConversationLog from "./ConversationLog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlayIcon, Square } from "lucide-react";

export default function CodeTutor() {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [code, setCode] = useState(
    "// Write your code here\nfunction hello() {\n  console.log('Hello, world!');\n}\n"
  );
  const [messages, setMessages] = useState<
    { role: "human" | "ai"; content: string }[]
  >([
    {
      role: "ai",
      content:
        "Welcome to the coding session! I'm your AI tutor. Once you start the session, you can speak to me about your code and I'll help you understand concepts, debug issues, or improve your implementation.",
    },
  ]);
  const [language, setLanguage] = useState("javascript");

  const handleTranscription = (text: string) => {
    setMessages((prev) => [...prev, { role: "ai", content: text }]);
  };

  const captureContent = () => {
    // For code, we return the code text with language information
    return `Language: ${language}\n\nCode:\n${code}`;
  };

  const startSession = () => {
    setIsSessionActive(true);
    setMessages((prev) => [
      ...prev,
      {
        role: "ai",
        content:
          "Session started. I can now see your code and hear you. Ask me any questions about your code.",
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

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[calc(100vh-160px)]">
      <div className="flex flex-col space-y-4">
        <Card className="flex-1 border shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg font-semibold">
                Code Editor
              </CardTitle>
              <div className="flex gap-2">
                <select
                  value={language}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="border rounded px-2 py-1 text-sm bg-white"
                >
                  <option value="javascript">JavaScript</option>
                  <option value="typescript">TypeScript</option>
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                  <option value="csharp">C#</option>
                  <option value="cpp">C++</option>
                  <option value="go">Go</option>
                  <option value="rust">Rust</option>
                  <option value="php">PHP</option>
                  <option value="ruby">Ruby</option>
                </select>
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
            <CodeEditor value={code} onChange={setCode} language={language} />
          </CardContent>
        </Card>

        <AudioInterface
          onTranscription={handleTranscription}
          captureContentCallback={captureContent}
          contentType="code"
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
          <CardContent className="pt-2 h-full] pb-4">
            <ConversationLog messages={messages} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
