import { OpenAIMessage, ArnaruChatRequest, OpenAIChatRequest } from './types';

const ARNARU_BASE_URL = process.env.ARNARU_BASE_URL || 'https://arnaru-ai.vercel.app';
const DEFAULT_MODEL = process.env.DEFAULT_MODEL || 'claude-fable-5';
const DEFAULT_WEB_SEARCH = process.env.DEFAULT_WEB_SEARCH === 'true';

/**
 * Convert OpenAI messages format to Arnaru question string.
 */
export function convertMessagesToQuestion(messages: OpenAIMessage[]): { question: string; systemPrompt?: string } {
  let systemPrompt = '';
  const conversationParts: string[] = [];

  for (const msg of messages) {
    if (msg.role === 'system') {
      systemPrompt = msg.content;
    } else if (msg.role === 'user') {
      conversationParts.push(`User: ${msg.content}`);
    } else if (msg.role === 'assistant') {
      conversationParts.push(`Assistant: ${msg.content}`);
    }
  }

  // If only one user message, use it directly
  if (conversationParts.length === 1 && conversationParts[0].startsWith('User: ')) {
    return {
      question: conversationParts[0].slice(6),
      systemPrompt: systemPrompt || undefined
    };
  }

  return {
    question: conversationParts.join('\n\n'),
    systemPrompt: systemPrompt || undefined
  };
}

/**
 * Build Arnaru request body from OpenAI request.
 */
export function buildArnaruRequest(body: OpenAIChatRequest): ArnaruChatRequest {
  const { question, systemPrompt } = convertMessagesToQuestion(body.messages);

  return {
    question,
    model: body.model || DEFAULT_MODEL,
    conversationId: body.conversationId,
    webSearch: body.webSearch ?? DEFAULT_WEB_SEARCH,
    systemPrompt: body.systemPrompt || systemPrompt
  };
}

/**
 * Call Arnaru chat API.
 */
export async function callArnaruChat(requestBody: ArnaruChatRequest): Promise<Response> {
  const url = `${ARNARU_BASE_URL}/api/chat`;

  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream, application/json, text/plain, */*'
    },
    body: JSON.stringify(requestBody)
  });
}

/**
 * Generate a unique ID for OpenAI-compatible responses.
 */
export function generateId(): string {
  return 'chatcmpl-' + Math.random().toString(36).substring(2, 15);
}

/**
 * Get current Unix timestamp.
 */
export function getTimestamp(): number {
  return Math.floor(Date.now() / 1000);
}
