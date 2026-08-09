import { OpenAIMessage } from './types';

const ARNARU_BASE_URL = process.env.ARNARU_BASE_URL || 'https://arnaru-ai.vercel.app';
const DEFAULT_MODEL = process.env.DEFAULT_MODEL || 'claude-fable-5';
const DEFAULT_WEB_SEARCH = process.env.DEFAULT_WEB_SEARCH === 'true';

export function convertMessagesToQuestion(messages: OpenAIMessage[]): { question: string; systemPrompt?: string } {
  let systemPrompt = '';
  const parts: string[] = [];

  for (const msg of messages) {
    if (msg.role === 'system') {
      systemPrompt = msg.content;
    } else if (msg.role === 'user') {
      parts.push(`User: ${msg.content}`);
    } else if (msg.role === 'assistant') {
      parts.push(`Assistant: ${msg.content}`);
    }
  }

  if (parts.length === 1 && parts[0].startsWith('User: ')) {
    return { question: parts[0].slice(6), systemPrompt: systemPrompt || undefined };
  }

  return { question: parts.join('\n\n'), systemPrompt: systemPrompt || undefined };
}

export function buildArnaruRequest(body: any) {
  const { question, systemPrompt } = convertMessagesToQuestion(body.messages);
  return {
    question,
    model: body.model || DEFAULT_MODEL,
    conversationId: body.conversationId,
    webSearch: body.webSearch ?? DEFAULT_WEB_SEARCH,
    systemPrompt: body.systemPrompt || systemPrompt
  };
}

export async function callArnaruChat(requestBody: any): Promise<Response> {
  return fetch(`${ARNARU_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody)
  });
}

export function generateId(): string {
  return 'chatcmpl-' + Math.random().toString(36).substring(2, 15);
}

export function getTimestamp(): number {
  return Math.floor(Date.now() / 1000);
}
