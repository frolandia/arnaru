import type { VercelRequest, VercelResponse } from '@vercel/node';
import { OpenAIChatRequest } from '../../../lib/types';
import { parseSSE, parseSSEStream } from '../../../lib/sse-parser';
import { buildArnaruRequest, callArnaruChat, generateId, getTimestamp } from '../../../lib/arnaru';

const VALID_MODELS = new Set([
  'claude-fable-5','claude-haiku-4.5','claude-opus-4.6','claude-opus-4.7','claude-opus-4.8',
  'claude-sonnet-4','claude-sonnet-4.6','claude-sonnet-5',
  'deepseek-r1','deepseek-v3.1','deepseek-v3.2','deepseek-v3.2-online','deepseek-v3.2-think',
  'deepseek-v4-flash','deepseek-v4-pro',
  'gemini-2.0-flash','gemini-2.5-flash','gemini-2.5-pro','gemini-3-flash','gemini-3-pro',
  'gemini-3.1-flash','gemini-3.1-pro','gemini-3.5-flash','gemini-3.5-flash-lite','gemini-3.6-flash',
  'gpt-4.1','gpt-4.1-mini','gpt-4o','gpt-5','gpt-5-mini','gpt-5-nano','gpt-5.1','gpt-5.2',
  'gpt-5.4','gpt-5.5','gpt-5.6-luna','gpt-5.6-sol','gpt-o3-mini',
  'grok-3','grok-3-reasoner','grok-4','grok-4-fast','grok-4-reasoning',
  'grok-4.1','grok-4.1-fast','grok-4.1-reasoning','grok-4.2','grok-4.2-reasoning',
  'grok-4.3-pro','grok-4.3-reasoning','grok-4.5',
  'kimi-k3','llama-4','llama-4.1',
  'mistral-small-3.2','mistral-small-creative',
  'qwen-vl-max','qwen3-235b','qwen3-max',
  'skylark-pro','step-3.5-flash','step-3.5-flash-free'
]);

function validateModel(model: string): string {
  return VALID_MODELS.has(model) ? model : (process.env.DEFAULT_MODEL || 'claude-fable-5');
}

function createCompletion(id: string, model: string, content: string) {
  return {
    id,
    object: 'chat.completion',
    created: getTimestamp(),
    model,
    choices: [{
      index: 0,
      message: { role: 'assistant', content },
      finish_reason: 'stop'
    }],
    usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
  };
}

function createStreamChunk(id: string, model: string, content: string, isFirst: boolean, isLast: boolean) {
  const choice: any = { index: 0, delta: {}, finish_reason: null };
  if (isFirst) choice.delta = { role: 'assistant' };
  if (content) choice.delta = { ...choice.delta, content };
  if (isLast) choice.finish_reason = 'stop';
  return `data: ${JSON.stringify({ id, object: 'chat.completion.chunk', created: getTimestamp(), model, choices: [choice] })}\n\n`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const proxyApiKey = process.env.PROXY_API_KEY;
  const authHeader = req.headers.authorization;
  if (proxyApiKey && authHeader !== `Bearer ${proxyApiKey}`) {
    return res.status(401).json({ error: 'Invalid or missing API key' });
  }

  try {
    const body = req.body as OpenAIChatRequest;

    if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
      return res.status(400).json({ error: { message: 'messages is required', type: 'invalid_request_error' } });
    }

    const isStream = body.stream === true;
    const model = validateModel(body.model || '');
    const requestId = generateId();
    const arnaruBody = buildArnaruRequest({ ...body, model });
    const arnaruResponse = await callArnaruChat(arnaruBody);

    if (!arnaruResponse.ok) {
      const errorText = await arnaruResponse.text();
      console.error('Arnaru API error:', arnaruResponse.status, errorText);
      return res.status(arnaruResponse.status).json({
        error: { message: `Arnaru API error: ${arnaruResponse.status}`, type: 'api_error' }
      });
    }

    const rawText = await arnaruResponse.text();

    if (isStream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('Access-Control-Allow-Origin', '*');

      res.write(createStreamChunk(requestId, model, '', true, false));

      for (const chunk of parseSSEStream(rawText)) {
        if (chunk.error) {
          res.write(`data: ${JSON.stringify({ error: chunk.error })}\n\n`);
          continue;
        }
        if (chunk.text) {
          res.write(createStreamChunk(requestId, model, chunk.text, false, false));
        }
      }

      res.write(createStreamChunk(requestId, model, '', false, true));
      res.write('data: [DONE]\n\n');
      return res.end();
    }

    const parsed = parseSSE(rawText);

    if (parsed.hasError && !parsed.fullMessage) {
      return res.status(500).json({ error: { message: parsed.errorMessage || 'Unknown error', type: 'api_error' } });
    }

    const completion = createCompletion(requestId, model, parsed.fullMessage);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json(completion);

  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({
      error: { message: error instanceof Error ? error.message : 'Internal server error', type: 'internal_error' }
    });
  }
}
