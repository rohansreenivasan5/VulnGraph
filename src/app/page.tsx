"use client";
import { useState } from "react";

import GraphPanel from "@/components/graph/GraphPanel";
import ChatPanel from "@/components/chat/ChatPanel";
import TableView from "@/components/ui/TableView";
import { transformNeo4jToGraph } from "@/lib/graphTransform";

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
  
  // Transform Neo4j results to graph format
  const transformedResult = result?.rawResults ? transformNeo4jToGraph(result.rawResults as unknown[]) : null;

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
        {transformedResult?.type === 'graph' && transformedResult.graph ? (
          <GraphPanel graphData={transformedResult.graph} />
        ) : transformedResult?.type === 'table' && transformedResult.table ? (
          <TableView data={transformedResult.table} />
        ) : (
          <div className="w-full h-full bg-zinc-900 border border-zinc-700 rounded flex items-center justify-center text-gray-400">
            <div className="text-center">
              <p className="text-lg mb-2">No data available</p>
              <p className="text-sm">Run a query to see the results</p>
            </div>
          </div>
        )}
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
