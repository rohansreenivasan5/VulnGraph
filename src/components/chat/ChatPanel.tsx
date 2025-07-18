import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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

interface ChatPanelProps {
  query: string;
  setQuery: (q: string) => void;
  loading: boolean;
  result: ResultType | null;
  error: string | null;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({
  query,
  setQuery,
  loading,
  result,
  error,
  handleSubmit,
}) => {
  const [showReasoning, setShowReasoning] = useState(false);
  const [showCypher, setShowCypher] = useState(false);

  return (
    <div className="min-h-0 min-w-0 w-full flex flex-col bg-zinc-950 border border-zinc-800 rounded p-4 overflow-x-auto break-words max-w-full">
      <form onSubmit={handleSubmit} className="mb-4 flex gap-2 min-w-0 max-w-full">
        <input
          className="border rounded px-2 py-1 flex-1 bg-zinc-900 text-white placeholder-gray-400 min-w-0 max-w-full"
          type="text"
          placeholder="Ask a security question..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          disabled={loading}
        />
        <button
          className="bg-blue-600 text-white px-4 py-1 rounded disabled:opacity-50 min-w-0 max-w-full"
          type="submit"
          disabled={loading || !query.trim()}
        >
          {loading ? "Loading..." : "Ask"}
        </button>
      </form>
      {error && <div className="text-red-400 mb-2 break-words overflow-x-auto min-w-0 max-w-full">{error}</div>}
      {result && (
        <div className="bg-zinc-900 border border-zinc-700 rounded p-4 text-white break-words overflow-x-auto min-w-0 max-w-full">
          <h2 className="font-semibold mb-2 text-lg">Answer</h2>
          <div className="prose prose-invert mb-4 text-white break-words overflow-x-auto min-w-0 max-w-full">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({node, className, children, ...props}) {
                  const isBlock = (node && node.type === 'element' && node.tagName === 'code' && (node as unknown as { position?: { start?: { line?: number }, end?: { line?: number } } }).position?.start?.line !== (node as unknown as { position?: { start?: { line?: number }, end?: { line?: number } } }).position?.end?.line) || (className && className.includes('language-'));
                  if (isBlock) {
                    return (
                      <pre className="bg-zinc-800 p-2 rounded text-xs overflow-x-auto text-green-300 break-words whitespace-pre-wrap w-full max-w-full min-w-0">
                        <code {...props} className={className + ' w-full max-w-full min-w-0'}>{children}</code>
                      </pre>
                    );
                  }
                  return (
                    <code {...props} className={className + ' bg-zinc-800 rounded px-1 text-green-300 break-words max-w-full min-w-0'}>{children}</code>
                  );
                }
              }}
            >
              {result.answer}
            </ReactMarkdown>
          </div>
          {/* Reasoning Dropdown */}
          <div className="mt-2">
            <button
              className="text-blue-400 underline text-sm mb-1"
              type="button"
              onClick={() => setShowReasoning(v => !v)}
            >
              {showReasoning ? 'Hide Reasoning' : 'Show Reasoning'}
            </button>
            {showReasoning && (
              <ol className="list-decimal ml-6 text-white break-words">
                {result.reasoning?.map((r: ReasoningStep, i: number) => (
                  <li key={i}><b>{r.step}:</b> {r.details}</li>
                ))}
              </ol>
            )}
          </div>
          {/* Cypher Dropdown */}
          {result.cypher && (
            <div className="mt-2">
              <button
                className="text-green-400 underline text-sm mb-1"
                type="button"
                onClick={() => setShowCypher(v => !v)}
              >
                {showCypher ? 'Hide Cypher Query' : 'Show Cypher Query'}
              </button>
              {showCypher && (
                <pre className="bg-zinc-800 p-2 rounded text-xs overflow-x-auto text-green-300 break-words whitespace-pre-wrap">{result.cypher}</pre>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatPanel; 