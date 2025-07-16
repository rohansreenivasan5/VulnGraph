// Utility for calling LiteLLM's OpenAI-compatible chat completion endpoint

export interface LiteLLMChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LiteLLMChatCompletionResponse {
  choices: Array<{
    message: LiteLLMChatMessage;
    finish_reason: string;
    index: number;
  }>;
  usage?: unknown;
  [key: string]: unknown;
}

const LITELLM_API_KEY = process.env.LITELLM_API_KEY!;
const LITELLM_BASE_URL = process.env.LITELLM_BASE_URL!;

export async function litellmChatCompletion({
  messages,
  model = 'gpt-4.1',
  stream = false,
  temperature = 0.2,
}: {
  messages: LiteLLMChatMessage[];
  model?: string;
  stream?: boolean;
  temperature?: number;
}): Promise<LiteLLMChatCompletionResponse> {
  const res = await fetch(`${LITELLM_BASE_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${LITELLM_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages,
      stream,
      temperature,
    }),
  });
  if (!res.ok) {
    throw new Error(`LiteLLM error: ${res.status} ${await res.text()}`);
  }
  return res.json();
} 