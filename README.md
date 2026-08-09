# Arnaru OpenAI Proxy

Proxy server yang mengkonversi API **Arnaru AI** menjadi format **OpenAI-compatible** (`/v1/chat/completions`).

## Fitur

- ✅ **OpenAI-compatible endpoint** — `/v1/chat/completions`
- ✅ **Streaming & non-streaming** — support `stream: true`
- ✅ **Semua model Arnaru** — Claude, GPT, Gemini, Grok, DeepSeek, Llama, Qwen, dll
- ✅ **Conversation memory** — via `conversationId`
- ✅ **Web search** — via `webSearch: true`
- ✅ **System prompt** — via `systemPrompt` atau `messages` dengan `role: system`
- ✅ **CORS enabled** — bisa dipakai dari browser/frontend mana pun
- ✅ **Optional API Key** — bisa dipasang proteksi via `PROXY_API_KEY`

## Deploy ke Vercel

### 1. Fork / Upload ke GitHub

Upload repository ini ke GitHub kamu.

### 2. Import ke Vercel

1. Buka [vercel.com](https://vercel.com)
2. Klik **Add New Project**
3. Import dari GitHub
4. Framework Preset: **Other**
5. Klik **Deploy**

### 3. Environment Variables (Optional)

Di Vercel Dashboard → Project Settings → Environment Variables:

| Variable | Default | Keterangan |
|----------|---------|------------|
| `ARNARU_BASE_URL` | `https://arnaru-ai.vercel.app` | Base URL Arnaru API |
| `DEFAULT_MODEL` | `claude-fable-5` | Model default jika tidak dispecify |
| `DEFAULT_WEB_SEARCH` | `true` | Aktifkan web search default |
| `PROXY_API_KEY` | *(kosong)* | API key untuk proteksi proxy (opsional) |

## Cara Pakai

### Non-Streaming

```bash
curl -X POST https://your-proxy.vercel.app/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "claude-fable-5",
    "messages": [
      { "role": "system", "content": "Kamu adalah asisten AI." },
      { "role": "user", "content": "Halo, apa kabar?" }
    ]
  }'
```

### Streaming

```bash
curl -X POST https://your-proxy.vercel.app/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-5.5",
    "messages": [
      { "role": "user", "content": "Ceritakan tentang Indonesia" }
    ],
    "stream": true
  }'
```

### Dengan Conversation Memory

```bash
curl -X POST https://your-proxy.vercel.app/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "claude-sonnet-5",
    "messages": [
      { "role": "user", "content": "Nama saya Budi" }
    ],
    "conversationId": "conv_abc123"
  }'
```

### Dengan Web Search

```bash
curl -X POST https://your-proxy.vercel.app/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "deepseek-v3.2-online",
    "messages": [
      { "role": "user", "content": "Berita terbaru hari ini?" }
    ],
    "webSearch": true
  }'
```

### Dengan API Key (jika diaktifkan)

```bash
curl -X POST https://your-proxy.vercel.app/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-secret-key" \
  -d '{
    "model": "grok-4",
    "messages": [
      { "role": "user", "content": "Hello" }
    ]
  }'
```

### List Models

```bash
curl https://your-proxy.vercel.app/v1/models
```

## Integrasi dengan RikkaHub

1. Buka RikkaHub → Settings → AI Provider → Add New Provider
2. Pilih **OpenAI Compatible**
3. **Base URL**: `https://your-proxy.vercel.app/v1`
4. **API Key**: *(kosong, atau isi jika `PROXY_API_KEY` diaktifkan)*
5. **Model**: pilih dari list atau ketik manual, e.g. `claude-fable-5`
6. Save dan test!

## Struktur Project

```
arnaru-openai-proxy/
├── api/
│   └── v1/
│       ├── chat/
│       │   └── completions.ts    # Endpoint utama
│       └── models.ts             # List model
├── lib/
│   ├── types.ts                  # TypeScript interfaces
│   ├── sse-parser.ts             # Parser SSE dari Arnaru
│   └── arnaru.ts                 # Helper Arnaru API
├── package.json
├── tsconfig.json
├── vercel.json
├── .env.example
└── README.md
```

## Response Format

### Non-Streaming

```json
{
  "id": "chatcmpl-xxx",
  "object": "chat.completion",
  "created": 1699999999,
  "model": "claude-fable-5",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Halo! Saya baik-baik saja."
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 0,
    "completion_tokens": 0,
    "total_tokens": 0
  }
}
```

### Streaming

```
data: {"id":"chatcmpl-xxx","object":"chat.completion.chunk","created":1699999999,"model":"claude-fable-5","choices":[{"index":0,"delta":{"role":"assistant"},"finish_reason":null}]}

data: {"id":"chatcmpl-xxx","object":"chat.completion.chunk","created":1699999999,"model":"claude-fable-5","choices":[{"index":0,"delta":{"content":"Halo"},"finish_reason":null}]}

data: {"id":"chatcmpl-xxx","object":"chat.completion.chunk","created":1699999999,"model":"claude-fable-5","choices":[{"index":0,"delta":{"content":"!"},"finish_reason":null}]}

data: {"id":"chatcmpl-xxx","object":"chat.completion.chunk","created":1699999999,"model":"claude-fable-5","choices":[{"index":0,"delta":{},"finish_reason":"stop"}]}

data: [DONE]
```

## Catatan

- `usage.tokens` selalu 0 karena Arnaru API tidak expose token count.
- `temperature`, `top_p`, `max_tokens` dari OpenAI request **diabaikan** karena Arnaru API tidak support parameter tersebut.
- Untuk file upload (vision), saat ini belum diimplementasikan di proxy ini. Hanya text-based chat.

## Credits

- Proxy by: **Aarmaaa28** (Arnaru AI)
- Arnaru API: [arnaru-ai.vercel.app](https://arnaru-ai.vercel.app)
