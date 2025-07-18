"use client";
import { useState } from "react";

import GraphPanel from "@/components/graph/GraphPanel";
import ChatPanel from "@/components/chat/ChatPanel";

interface ReasoningStep {
  step: string;
  details: string;
}

interface ResultType {
  answer: string;
  reasoning: ReasoningStep[];
  cypher: string | null;
  rawResults: unknown;
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResultType | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/chat/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: query }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data);
      } else {
        setError(data.error || "Unknown error");
      }
    } catch (err) {
      setError((err as Error).message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen h-screen min-w-0 w-full bg-black text-white font-sans flex flex-row max-w-full mx-auto p-8 gap-4">
      {/* Graph Panel (Left/Main) */}
      <section className="flex-1 min-w-0 min-h-0 h-full">
        <GraphPanel graphData={result?.rawResults as { nodes: unknown[]; links: unknown[] } | undefined} />
      </section>
      {/* Chat Panel (Right) */}
      <aside className="relative bg-zinc-950 w-[400px] max-w-[50vw] h-full min-h-0 flex-shrink-0 overflow-auto">
        <ChatPanel
          query={query}
          setQuery={setQuery}
          loading={loading}
          result={result}
          error={error}
          handleSubmit={handleSubmit}
        />
      </aside>
    </main>
  );
}
