import { ArnaruSSEData } from './types';

export interface SSEParseResult {
  fullMessage: string;
  newConversationId: string | null;
  hasError: boolean;
  errorMessage: string | null;
}

export function parseSSE(rawText: string): SSEParseResult {
  let fullMessage = '';
  let newConversationId: string | null = null;
  let hasError = false;
  let errorMessage: string | null = null;

  const lines = rawText.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || !trimmed.startsWith('data:')) continue;

    let dataStr = trimmed.slice(5).trim();
    if (dataStr === '[DONE]' || dataStr === '') continue;

    try {
      const data: ArnaruSSEData = JSON.parse(dataStr);
      if (data.data === '[DONE]') continue;
      if (data.conversationId) newConversationId = data.conversationId;
      if (data.error) {
        hasError = true;
        errorMessage = data.error;
        continue;
      }

      if (data.answer) fullMessage += data.answer;
      else if (data.text) fullMessage += data.text;
      else if (data.response) fullMessage += data.response;
      else if (data.message) fullMessage += data.message;
      else if (data.content) fullMessage += data.content;
      else if (typeof data.data === 'string' && data.data !== '[DONE]') fullMessage += data.data;
      else if (data.delta) fullMessage += data.delta;
      else if (data.token) fullMessage += data.token;
      else if (data.output) fullMessage += data.output;
      else if (data.result) fullMessage += data.result;
      else if (data.generated_text) fullMessage += data.generated_text;
      else if (data.choices && data.choices[0]) {
        const c = data.choices[0];
        if (c.delta && c.delta.content) fullMessage += c.delta.content;
        else if (c.message && c.message.content) fullMessage += c.message.content;
        else if (c.text) fullMessage += c.text;
      }
    } catch {
      let cleanText = dataStr
        .replace(/^["']+|["']+$/g, '')
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '')
        .replace(/\\t/g, '\t')
        .replace(/\[DONE\]/gi, '')
        .trim();
      if (cleanText) fullMessage += cleanText;
    }
  }

  if (!fullMessage.trim()) {
    try {
      const data: ArnaruSSEData = JSON.parse(rawText);
      if (data.conversationId) newConversationId = data.conversationId;
      if (data.error) {
        hasError = true;
        errorMessage = data.error;
        fullMessage = `[Error: ${data.error}]`;
      } else {
        fullMessage = data.answer || data.text || data.response || data.message || data.content || data.output || data.result || '';
      }
    } catch {
      let cleaned = rawText.replace(/^data:\s*/gm, '').replace(/\[DONE\]/gi, '').trim();
      if (cleaned) {
        try {
          const data: ArnaruSSEData = JSON.parse(cleaned);
          fullMessage = data.answer || data.text || data.response || data.message || data.content || '';
        } catch {
          fullMessage = cleaned;
        }
      }
    }
  }

  return {
    fullMessage: fullMessage.replace(/['"]?\[DONE\]['"]?/gi, '').trim(),
    newConversationId,
    hasError,
    errorMessage
  };
}

export function* parseSSEStream(rawText: string): Generator<{ text: string; conversationId?: string; error?: string }> {
  const lines = rawText.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || !trimmed.startsWith('data:')) continue;
    let dataStr = trimmed.slice(5).trim();
    if (dataStr === '[DONE]' || dataStr === '') continue;

    let chunkText = '';
    let conversationId: string | undefined;
    let error: string | undefined;

    try {
      const data: ArnaruSSEData = JSON.parse(dataStr);
      if (data.data === '[DONE]') continue;
      if (data.conversationId) conversationId = data.conversationId;
      if (data.error) { error = data.error; }
      else if (data.answer) chunkText = data.answer;
      else if (data.text) chunkText = data.text;
      else if (data.response) chunkText = data.response;
      else if (data.message) chunkText = data.message;
      else if (data.content) chunkText = data.content;
      else if (typeof data.data === 'string' && data.data !== '[DONE]') chunkText = data.data;
      else if (data.delta) chunkText = data.delta;
      else if (data.token) chunkText = data.token;
      else if (data.output) chunkText = data.output;
      else if (data.result) chunkText = data.result;
      else if (data.generated_text) chunkText = data.generated_text;
      else if (data.choices && data.choices[0]) {
        const c = data.choices[0];
        if (c.delta && c.delta.content) chunkText = c.delta.content;
        else if (c.message && c.message.content) chunkText = c.message.content;
        else if (c.text) chunkText = c.text;
      }
    } catch {
      let cleanText = dataStr.replace(/^["']+|["']+$/g, '').replace(/\\n/g, '\n').replace(/\\r/g, '').replace(/\\t/g, '\t').replace(/\[DONE\]/gi, '').trim();
      if (cleanText) chunkText = cleanText;
    }

    if (chunkText || error) {
      yield { text: chunkText, conversationId, error };
    }
  }
}
