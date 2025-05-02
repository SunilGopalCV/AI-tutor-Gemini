"use client";

import { useSession } from "@/app/context/SessionContext";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CodeIcon, BookOpen, Clock, FileText } from "lucide-react";

export default function DashboardHome() {
  const { sessions, notes } = useSession();

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <div className="text-center md:text-left mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Welcome to VisionTutor
        </h1>
        <p className="text-gray-400 mt-2 text-lg">
          Your AI-powered tutoring platform for code and math
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="bg-[#10101a] border-[#1e1e2e] shadow-lg hover:shadow-xl transition-all duration-300 hover:border-blue-500/30">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="bg-blue-500/20 p-3 rounded-lg">
                <CodeIcon className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-xl text-white">
                  Start Coding Session
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Get help with programming problems and concepts
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300">
              Use your voice to ask coding questions and receive AI guidance in
              real-time. Debug issues, learn new languages, and improve your
              implementation.
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/code" className="w-full">
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                Start Coding Session
              </Button>
            </Link>
          </CardFooter>
        </Card>

        <Card className="bg-[#10101a] border-[#1e1e2e] shadow-lg hover:shadow-xl transition-all duration-300 hover:border-purple-500/30">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="bg-purple-500/20 p-3 rounded-lg">
                <BookOpen className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <CardTitle className="text-xl text-white">
                  Start Math Session
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Solve math problems with AI assistance
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300">
              Draw equations or upload images of math problems for instant help.
              Get step-by-step solutions and in-depth explanations.
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/math" className="w-full">
              <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                Start Math Session
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="bg-[#10101a] border-[#1e1e2e] shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="bg-indigo-500/20 p-2 rounded-lg">
                <Clock className="h-5 w-5 text-indigo-400" />
              </div>
              <CardTitle className="text-xl text-white">
                Recent Sessions
              </CardTitle>
            </div>
            <CardDescription className="text-gray-400">
              Your latest tutoring sessions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sessions.length > 0 ? (
              <ul className="space-y-2">
                {sessions.slice(0, 5).map((session) => (
                  <li
                    key={session._id}
                    className="p-3 bg-[#15151f] hover:bg-[#1a1a28] rounded-lg transition-colors"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-200 flex items-center">
                        {session.sessionType === "code" ? (
                          <CodeIcon className="h-4 w-4 mr-2 text-blue-400" />
                        ) : (
                          <BookOpen className="h-4 w-4 mr-2 text-purple-400" />
                        )}
                        {session.sessionType === "code" ? "Coding" : "Math"}{" "}
                        Session
                      </span>
                      <span className="text-sm text-gray-400">
                        {new Date(session.startTime).toLocaleDateString()}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-6 bg-[#15151f] rounded-lg">
                <p className="text-gray-400">No sessions yet. Start one now!</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-[#10101a] border-[#1e1e2e] shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="bg-teal-500/20 p-2 rounded-lg">
                <FileText className="h-5 w-5 text-teal-400" />
              </div>
              <CardTitle className="text-xl text-white">Recent Notes</CardTitle>
            </div>
            <CardDescription className="text-gray-400">
              Notes you&apos;ve saved from your sessions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {notes.length > 0 ? (
              <ul className="space-y-2">
                {notes.slice(0, 5).map((note) => (
                  <li
                    key={note._id}
                    className="p-3 bg-[#15151f] hover:bg-[#1a1a28] rounded-lg transition-colors"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-200 flex items-center">
                        <FileText className="h-4 w-4 mr-2 text-teal-400" />
                        {note.title}
                      </span>
                      <span className="text-sm text-gray-400">
                        {new Date(note.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-6 bg-[#15151f] rounded-lg">
                <p className="text-gray-400">
                  No notes yet. Save some from your next session!
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
