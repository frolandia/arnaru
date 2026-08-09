# Arnaru OpenAI Proxy v3

Proxy OpenAI-compatible untuk Arnaru AI API.

## Deploy ke Vercel

1. Extract zip, push ke GitHub
2. Import ke Vercel (Framework: Other)
3. Deploy

## Endpoint

- `POST /v1/chat/completions` — Chat (OpenAI-compatible)
- `GET /v1/models` — List models
- `GET /health` — Health check
- `GET /` — Info

## Test

```bash
curl https://your-app.vercel.app/health
curl https://your-app.vercel.app/v1/models
curl -X POST https://your-app.vercel.app/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model":"claude-fable-5","messages":[{"role":"user","content":"Halo"}]}'
```

## RikkaHub Setup

- Provider: OpenAI Compatible
- Base URL: `https://your-app.vercel.app/v1`
- API Key: (kosong, atau isi kalau PROXY_API_KEY diaktifkan)
- Model: `claude-fable-5` (atau model lain)
