import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }

  res.status(200).json({
    status: 'ok',
    proxy: 'arnaru-openai-proxy',
    version: '1.0.0',
    endpoints: [
      { path: '/v1/chat/completions', method: 'POST', description: 'OpenAI-compatible chat' },
      { path: '/v1/models', method: 'GET', description: 'List available models' },
      { path: '/health', method: 'GET', description: 'Health check' }
    ],
    message: 'Proxy is running. Use /v1/chat/completions for chat.'
  });
}
