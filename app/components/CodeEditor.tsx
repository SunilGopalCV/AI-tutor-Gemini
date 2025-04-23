"use client";

import { useRef } from "react";
import Editor from "@monaco-editor/react";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: string;
  className?: string;
}

export default function CodeEditor({
  value,
  onChange,
  language,
  className,
}: CodeEditorProps) {
  const editorRef = useRef<any>(null);

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
    // Optional: editor.focus(); // Focus might be too aggressive depending on UX
  };

  return (
    // This component expects its parent to provide a defined height for h-full to work.
    // The min-h-[400px] acts as a fallback.
    <div
      className={`w-full h-full min-h-[400px] border border-gray-200 rounded-md overflow-hidden ${
        className || ""
      }`}
    >
      <Editor
        // Use height="100%" to fill the parent div
        height="100%"
        // width="100%" is default behavior but can be explicit if needed
        // width="100%"
        defaultLanguage="javascript"
        language={language}
        value={value}
        onChange={(value) => onChange(value || "")}
        onMount={handleEditorDidMount}
        options={{
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          fontSize: 14,
          automaticLayout: true, // Ensures editor resizes on container changes
          tabSize: 2,
          wordWrap: "on",
          lineNumbersMinChars: 3,
          scrollbar: {
            verticalScrollbarSize: 8,
            horizontalScrollbarSize: 8,
          },
        }}
        theme="vs-light" // Or "vs-dark"
      />
    </div>
  );
}
