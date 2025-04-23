// app/page.tsx
"use client";

import PlatformSelector from "./components/PlatformSelector";

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-gray-800">AI Tutor</h1>
        <p className="text-gray-600 mt-2">
          Your interactive learning partner for coding and mathematics
        </p>
      </header>
      <main>
        <PlatformSelector />
      </main>
    </div>
  );
}
