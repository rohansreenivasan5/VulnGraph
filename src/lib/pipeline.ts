import { LiteLLMChatMessage, litellmChatCompletion } from './litellm';
import { runCypher } from './neo4j';
import fs from 'fs/promises';
import path from 'path';

export interface PipelineResult {
  answer: string;
  reasoning: Array<{ step: string; details: string }>;
  cypher: string | null;
  rawResults: unknown;
}

const SCHEMA_GUIDE_PATH = path.resolve(process.cwd(), 'DB_SCHEMA_AND_QUERY_GUIDE.md');

async function loadSchemaGuide(): Promise<string> {
  return fs.readFile(SCHEMA_GUIDE_PATH, 'utf8');
}

function isReadOnlyCypher(query: string): boolean {
  // Only allow MATCH, OPTIONAL MATCH, RETURN, WHERE, WITH, ORDER BY, LIMIT, SKIP, UNWIND, CALL, etc.
  // Disallow CREATE, MERGE, DELETE, SET, REMOVE, LOAD CSV, etc.
  const forbidden = /\b(CREATE|MERGE|DELETE|SET|REMOVE|LOAD\s+CSV|DROP|CALL\s+db\.ms|CALL\s+db\.write|CALL\s+apoc\.create|CALL\s+apoc\.load|CALL\s+apoc\.periodic|CALL\s+apoc\.refactor)\b/i;
  return !forbidden.test(query);
}

export async function runPipeline(userMessage: string): Promise<PipelineResult> {
  const reasoning: Array<{ step: string; details: string }> = [];

  // 1. Load schema guide
  const schemaGuide = await loadSchemaGuide();
  reasoning.push({ step: 'Load Schema Guide', details: 'Loaded DB schema and query guide for LLM context.' });

  // 2. Intent classification & entity extraction
  const intentPrompt: LiteLLMChatMessage[] = [
    {
      role: 'system',
      content: `You are a security knowledge graph assistant. Given a user question, classify the intent (e.g., list, aggregate, trace, map, etc.) and extract relevant entities (service, severity, vulnerability type, etc.). Respond in JSON with { "intent": string, "entities": object }.`
    },
    { role: 'user', content: userMessage }
  ];
  const intentResp = await litellmChatCompletion({ messages: intentPrompt, model: 'gpt-4.1' });
  let intentJson: { intent: string; entities: Record<string, unknown> } = { intent: '', entities: {} };
  try {
    intentJson = JSON.parse(intentResp.choices[0].message.content.trim());
  } catch (e) {
    reasoning.push({ step: 'Intent Extraction', details: `Failed to parse LLM response: ${intentResp.choices[0].message.content}` });
    return { answer: 'Sorry, I could not understand your question.', reasoning, cypher: null, rawResults: null };
  }
  reasoning.push({ step: 'Intent Extraction', details: `Intent: ${intentJson.intent}, Entities: ${JSON.stringify(intentJson.entities)}` });

  // 3. Cypher query generation
  const cypherPrompt: LiteLLMChatMessage[] = [
    {
      role: 'system',
      content: `You are an expert Cypher query generator for a Neo4j vulnerability knowledge graph. Use ONLY the schema and query patterns in the following guide. Generate a Cypher query that answers the user's question. Only output the Cypher code, nothing else.\n\nSCHEMA GUIDE:\n${schemaGuide}`
    },
    {
      role: 'user',
      content: `User question: ${userMessage}\nIntent: ${intentJson.intent}\nEntities: ${JSON.stringify(intentJson.entities)}`
    }
  ];
  const cypherResp = await litellmChatCompletion({ messages: cypherPrompt, model: 'gpt-4.1' });
  let cypher = cypherResp.choices[0].message.content.trim();
  // Remove markdown code block if present
  cypher = cypher.replace(/^```[a-z]*\n?/i, '').replace(/```$/, '').trim();
  reasoning.push({ step: 'Cypher Generation', details: `Generated Cypher:\n${cypher}` });

  // 4. Cypher safety validation
  if (!isReadOnlyCypher(cypher)) {
    reasoning.push({ step: 'Cypher Validation', details: 'Rejected unsafe Cypher (mutation detected).' });
    return { answer: 'Sorry, the generated query was not safe to run.', reasoning, cypher, rawResults: null };
  }
  reasoning.push({ step: 'Cypher Validation', details: 'Cypher query validated as read-only.' });

  // 5. Query execution
  let rawResults: unknown = null;
  try {
    rawResults = await runCypher(cypher);
    reasoning.push({ step: 'Query Execution', details: `Query executed. Rows returned: ${Array.isArray(rawResults) ? rawResults.length : 0}` });
  } catch (e) {
    reasoning.push({ step: 'Query Execution', details: `Cypher execution error: ${e}` });
    return { answer: 'Sorry, there was an error running the query.', reasoning, cypher, rawResults: null };
  }

  // 6. Result formatting for LLM summarization
  const resultPreview = Array.isArray(rawResults) ? JSON.stringify(rawResults.slice(0, 5), null, 2) : String(rawResults);

  // 7. LLM-based answer generation
  const answerPrompt: LiteLLMChatMessage[] = [
    {
      role: 'system',
      content: `You are a security analyst assistant. Given the user's question, the Cypher query, and the query results, write a clear, concise answer for a security engineer. Include reasoning steps and highlight any important findings. If the results are empty, explain why. Format the answer in markdown.`
    },
    { role: 'user', content: `User question: ${userMessage}\nCypher: ${cypher}\nResults (preview):\n${resultPreview}` }
  ];
  const answerResp = await litellmChatCompletion({ messages: answerPrompt, model: 'gemini-2.5-flash' });
  const answer = answerResp.choices[0].message.content.trim();
  reasoning.push({ step: 'Answer Generation', details: 'LLM generated the final answer and summary.' });

  return {
    answer,
    reasoning,
    cypher,
    rawResults,
  };
} 