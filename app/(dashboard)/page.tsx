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

export default function DashboardHome() {
  const { sessions, notes } = useSession();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Welcome to VisionTutor</h1>
        <p className="text-slate-600 mt-2">
          Your AI-powered tutoring platform for code and math
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Start Coding Session</CardTitle>
            <CardDescription>
              Get help with programming problems and concepts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>
              Use your voice to ask coding questions and receive AI guidance.
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/code" className="w-full">
              <Button className="w-full">Start Coding Session</Button>
            </Link>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Start Math Session</CardTitle>
            <CardDescription>
              Solve math problems with AI assistance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>
              Draw equations or upload images of math problems for instant help.
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/math" className="w-full">
              <Button className="w-full">Start Math Session</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Sessions</CardTitle>
            <CardDescription>Your latest tutoring sessions</CardDescription>
          </CardHeader>
          <CardContent>
            {sessions.length > 0 ? (
              <ul className="space-y-2">
                {sessions.slice(0, 5).map((session) => (
                  <li
                    key={session._id}
                    className="p-2 hover:bg-slate-50 rounded"
                  >
                    <div className="flex justify-between">
                      <span className="font-medium">
                        {session.sessionType === "code" ? "Coding" : "Math"}{" "}
                        Session
                      </span>
                      <span className="text-sm text-slate-500">
                        {new Date(session.startTime).toLocaleDateString()}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-500">No sessions yet. Start one now!</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Notes</CardTitle>
            <CardDescription>
              Notes you &apos ve saved from your sessions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {notes.length > 0 ? (
              <ul className="space-y-2">
                {notes.slice(0, 5).map((note) => (
                  <li key={note._id} className="p-2 hover:bg-slate-50 rounded">
                    <div className="flex justify-between">
                      <span className="font-medium">{note.title}</span>
                      <span className="text-sm text-slate-500">
                        {new Date(note.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-500">
                No notes yet. Save some from your next session!
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
