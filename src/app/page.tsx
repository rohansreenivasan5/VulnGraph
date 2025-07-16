"use client";
import { useState } from "react";

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
    <main className="max-w-xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">VulnGraph Chat Demo</h1>
      <form onSubmit={handleSubmit} className="mb-4 flex gap-2">
        <input
          className="border rounded px-2 py-1 flex-1"
          type="text"
          placeholder="Ask a security question..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          disabled={loading}
        />
        <button
          className="bg-blue-600 text-white px-4 py-1 rounded disabled:opacity-50"
          type="submit"
          disabled={loading || !query.trim()}
        >
          {loading ? "Loading..." : "Ask"}
        </button>
      </form>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      {result && (
        <div className="bg-gray-50 border rounded p-4">
          <h2 className="font-semibold mb-2">Answer</h2>
          <div className="prose mb-4" dangerouslySetInnerHTML={{ __html: result.answer.replace(/\n/g, '<br/>') }} />
          <h3 className="font-semibold mt-4">Reasoning Steps</h3>
          <ol className="list-decimal ml-6">
            {result.reasoning?.map((r: ReasoningStep, i: number) => (
              <li key={i}><b>{r.step}:</b> {r.details}</li>
            ))}
          </ol>
          {result.cypher && (
            <div className="mt-4">
              <h4 className="font-semibold">Cypher Query</h4>
              <pre className="bg-gray-200 p-2 rounded text-xs overflow-x-auto">{result.cypher}</pre>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
