// app/components/ConversationLog.tsx
"use client";

import { useEffect, useRef } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ConversationLogProps {
  messages: { role: "human" | "ai"; content: string }[];
}

export default function ConversationLog({ messages }: ConversationLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <ScrollArea className="h-full pr-4" ref={scrollRef}>
      <div className="space-y-6 pb-4">
        {messages.map((message, index) => (
          <div key={index} className="flex gap-3 items-start">
            <Avatar
              className={`h-8 w-8 ${
                message.role === "ai" ? "bg-blue-600" : ""
              }`}
            >
              {message.role === "ai" ? (
                <>
                  <AvatarImage src="/avatars/ai-tutor.png" alt="AI Tutor" />
                  <AvatarFallback className="bg-blue-600 text-white">
                    AI
                  </AvatarFallback>
                </>
              ) : (
                <>
                  <AvatarImage src="/avatars/student.png" alt="You" />
                  <AvatarFallback>You</AvatarFallback>
                </>
              )}
            </Avatar>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-zinc-900">
                  {message.role === "ai" ? "AI Tutor" : "You"}
                </p>
              </div>
              <div
                className={`rounded-lg px-3 py-2 text-sm ${
                  message.role === "ai"
                    ? "bg-white border border-zinc-200 text-zinc-800"
                    : "bg-zinc-100 text-zinc-800"
                }`}
              >
                {message.content}
              </div>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
