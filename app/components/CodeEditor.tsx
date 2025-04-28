// app/components/CodeEditor.tsx
"use client";

import { useRef, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { Button } from "@/components/ui/button";
import { CameraIcon } from "lucide-react";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: string;
  className?: string;
  onCaptureImage: (imageData: string) => void;
}

export default function CodeEditor({
  value,
  onChange,
  language,
  className,
  onCaptureImage,
}: CodeEditorProps) {
  const editorRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
  };

  const captureCodeImage = () => {
    if (!editorRef.current || !canvasRef.current) return;

    const editor = editorRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    if (!context) return;

    // Set canvas dimensions based on content size (approximate)
    const lines = editor.getValue().split("\n");
    const lineHeight = 20; // Approximate line height
    const charWidth = 10; // Approximate character width
    const longestLine = Math.max(...lines.map((line) => line.length));

    canvas.width = Math.min(longestLine * charWidth + 40, 800); // Add some padding
    canvas.height = lines.length * lineHeight + 40; // Add some padding

    context.fillStyle = "white";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.font = "14px monospace";
    context.fillStyle = "black";

    lines.forEach((line, index) => {
      context.fillText(line, 20, (index + 1) * lineHeight);
    });

    const imageData = canvas.toDataURL("image/png");
    onCaptureImage(imageData);
  };

  return (
    <div
      className={`w-full h-full border border-gray-200 rounded-md overflow-hidden flex flex-col ${
        className || ""
      }`}
    >
      <div className="flex-1 overflow-hidden">
        <Editor
          height="100%"
          defaultLanguage="javascript"
          language={language}
          value={value}
          onChange={(value) => onChange(value || "")}
          onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontSize: 14,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: "on",
            lineNumbersMinChars: 3,
            scrollbar: {
              verticalScrollbarSize: 8,
              horizontalScrollbarSize: 8,
            },
          }}
          theme="vs-light"
        />
      </div>
      <div className="p-2 border-t border-gray-200 flex justify-end">
        <Button onClick={captureCodeImage} size="sm" className="text-sm">
          <CameraIcon className="h-4 w-4 mr-1" /> Capture as Image
        </Button>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
