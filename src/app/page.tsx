"use client";
import { useState, useEffect } from "react";

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
  // Track which view is selected: 'graph' or 'table'
  const [view, setView] = useState<'graph' | 'table'>('graph');
  
  // Transform Neo4j results to graph format
  const transformedResult = result?.rawResults ? transformNeo4jToGraph(result.rawResults as unknown[]) : null;

  // Set default view when new result arrives
  useEffect(() => {
    if (transformedResult) {
      if (transformedResult.table && transformedResult.table.rows.length > 0) {
        setView('table');
      } else if (transformedResult.graph) {
        setView('graph');
      }
    }
  }, [transformedResult?.type]);

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

  // Helper: is there both a graph and a table?
  const hasGraph = !!transformedResult?.graph;
  const hasTable = !!transformedResult?.table && transformedResult.table.rows.length > 0;
  const showToggle = hasGraph && hasTable;

  return (
    <>
      <header className="w-full text-center py-8 bg-zinc-950 border-b border-zinc-800 mb-4">
        <h1 className="text-5xl font-black tracking-tight text-white">
          <span className="text-white">Vulnerability</span>{" "}
          <span className="text-red-500">Explorer</span>
        </h1>
      </header>
      <main className="min-h-screen h-screen min-w-0 w-full bg-black text-white font-sans flex flex-row max-w-full mx-auto p-8 gap-4">
        {/* Graph/Table Panel (Left/Main) */}
        <section className="flex-1 min-w-0 min-h-0 h-full">
          {/* Toggle UI */}
          {showToggle && (
            <div className="flex gap-2 mb-4">
              <button
                className={`px-6 py-3 rounded-lg font-semibold border transition-all duration-200 tracking-wide transform hover:scale-105 ${view === 'table' ? 'bg-red-500 text-white border-red-500 shadow-lg' : 'bg-zinc-900 text-gray-400 hover:bg-red-500 hover:text-white border-zinc-700 hover:border-red-500'}`}
                onClick={() => setView('table')}
                disabled={view === 'table'}
                aria-pressed={view === 'table'}
              >
                Table View
              </button>
              <button
                className={`px-6 py-3 rounded-lg font-semibold border transition-all duration-200 tracking-wide transform hover:scale-105 ${view === 'graph' ? 'bg-red-500 text-white border-red-500 shadow-lg' : 'bg-zinc-900 text-gray-400 hover:bg-red-500 hover:text-white border-zinc-700 hover:border-red-500'}`}
                onClick={() => setView('graph')}
                disabled={view === 'graph'}
                aria-pressed={view === 'graph'}
              >
                Graph View
              </button>
            </div>
          )}
          {/* Main Content */}
          {view === 'graph' && hasGraph ? (
            <GraphPanel graphData={transformedResult.graph} />
          ) : view === 'table' && hasTable && transformedResult.table ? (
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
    </>
  );
}
