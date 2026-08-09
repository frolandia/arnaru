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
    endpoints: {
      chat: { path: '/v1/chat/completions', method: 'POST' },
      models: { path: '/v1/models', method: 'GET' }
    },
    message: 'Proxy is running. Send POST to /v1/chat/completions with OpenAI-compatible body.'
  });
}
