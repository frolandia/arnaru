import { OpenAIMessage, OpenAIContentPart, ArnaruFileAttachment } from './types';

const ARNARU_BASE_URL = process.env.ARNARU_BASE_URL || 'https://arnaru-ai.vercel.app';
const DEFAULT_MODEL = process.env.DEFAULT_MODEL || 'claude-fable-5';
const DEFAULT_WEB_SEARCH = process.env.DEFAULT_WEB_SEARCH === 'true';
const MAX_FILES = 9; // batas sesuai dokumentasi Arnaru API (/api/chat -> files, max 9)

const MIME_EXT_MAP: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/heic': 'heic',
  'application/pdf': 'pdf',
  'text/plain': 'txt',
  'text/csv': 'csv',
  'application/json': 'json',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx'
};

function guessExtension(mimeType: string): string {
  return MIME_EXT_MAP[mimeType] || (mimeType.split('/')[1] || 'bin').split('+')[0];
}

function parseDataUri(uri: string): { mimeType: string; buffer: Buffer } | null {
  const match = uri.match(/^data:([^;,]+);base64,(.+)$/s);
  if (!match) return null;
  return { mimeType: match[1], buffer: Buffer.from(match[2], 'base64') };
}

async function fetchAsBuffer(url: string): Promise<{ mimeType: string; buffer: Buffer } | null> {
  try {
    const resp = await fetch(url);
    if (!resp.ok) return null;
    const mimeType = (resp.headers.get('content-type') || 'application/octet-stream').split(';')[0].trim();
    const arrayBuf = await resp.arrayBuffer();
    return { mimeType, buffer: Buffer.from(arrayBuf) };
  } catch {
    return null;
  }
}

async function resolveAttachment(url: string, filenameHint?: string): Promise<ArnaruFileAttachment | null> {
  if (!url) return null;

  let resolved: { mimeType: string; buffer: Buffer } | null = null;
  if (url.startsWith('data:')) {
    resolved = parseDataUri(url);
  } else if (/^https?:\/\//i.test(url)) {
    resolved = await fetchAsBuffer(url);
  }
  if (!resolved || resolved.buffer.length === 0) return null;

  const ext = guessExtension(resolved.mimeType);
  const filename = filenameHint || `upload_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
  return { buffer: resolved.buffer, filename, mimeType: resolved.mimeType };
}

/**
 * Mengubah messages OpenAI (termasuk yang berisi content multimodal: text + image_url/file)
 * menjadi satu string "question" untuk Arnaru, plus daftar file lampiran (image/dokumen)
 * yang akan dikirim sebagai multipart form-data.
 */
export async function extractMessageContent(messages: OpenAIMessage[]): Promise<{
  question: string;
  systemPrompt?: string;
  files: ArnaruFileAttachment[];
}> {
  let systemPrompt = '';
  const parts: string[] = [];
  const files: ArnaruFileAttachment[] = [];

  for (const msg of messages) {
    // Kasus lama: content berupa string biasa
    if (typeof msg.content === 'string') {
      if (msg.role === 'system') systemPrompt = msg.content;
      else if (msg.role === 'user') parts.push(`User: ${msg.content}`);
      else if (msg.role === 'assistant') parts.push(`Assistant: ${msg.content}`);
      continue;
    }

    // Kasus baru: content berupa array bagian (multimodal) seperti dikirim RikkaHub
    const textFragments: string[] = [];
    for (const part of (msg.content as OpenAIContentPart[]) || []) {
      if (!part || typeof part !== 'object') continue;

      if (part.type === 'text') {
        if (part.text) textFragments.push(part.text);
      } else if (part.type === 'image_url' && msg.role === 'user') {
        if (files.length >= MAX_FILES) continue;
        const attachment = await resolveAttachment(part.image_url?.url);
        if (attachment) files.push(attachment);
      } else if (part.type === 'file' && msg.role === 'user') {
        if (files.length >= MAX_FILES) continue;
        const fileData = part.file?.file_data;
        if (fileData) {
          const attachment = await resolveAttachment(fileData, part.file?.filename);
          if (attachment) files.push(attachment);
        }
      }
    }

    const text = textFragments.join('\n').trim();
    if (msg.role === 'system') systemPrompt = text;
    else if (msg.role === 'user') parts.push(`User: ${text}`);
    else if (msg.role === 'assistant') parts.push(`Assistant: ${text}`);
  }

  let question: string;
  if (parts.length === 1 && parts[0].startsWith('User: ')) {
    question = parts[0].slice(6);
  } else {
    question = parts.join('\n\n');
  }

  return { question, systemPrompt: systemPrompt || undefined, files };
}

export async function buildArnaruRequest(body: any): Promise<{ arnaruBody: any; files: ArnaruFileAttachment[] }> {
  const { question, systemPrompt, files } = await extractMessageContent(body.messages);
  const arnaruBody = {
    question,
    model: body.model || DEFAULT_MODEL,
    conversationId: body.conversationId,
    webSearch: body.webSearch ?? DEFAULT_WEB_SEARCH,
    systemPrompt: body.systemPrompt || systemPrompt
  };
  return { arnaruBody, files };
}

export async function callArnaruChat(requestBody: any): Promise<Response> {
  return fetch(`${ARNARU_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody)
  });
}

/** Kirim ke Arnaru sebagai multipart/form-data ketika ada file/gambar yang dilampirkan. */
export async function callArnaruChatWithFiles(requestBody: any, files: ArnaruFileAttachment[]): Promise<Response> {
  const formData = new FormData();
  formData.append('question', requestBody.question ?? '');
  if (requestBody.model) formData.append('model', requestBody.model);
  if (requestBody.conversationId) formData.append('conversationId', requestBody.conversationId);
  if (requestBody.webSearch !== undefined) formData.append('webSearch', String(requestBody.webSearch));
  if (requestBody.systemPrompt) formData.append('systemPrompt', requestBody.systemPrompt);

  for (const file of files.slice(0, MAX_FILES)) {
    const blob = new Blob([new Uint8Array(file.buffer)], { type: file.mimeType });
    formData.append('files', blob, file.filename);
  }

  return fetch(`${ARNARU_BASE_URL}/api/chat`, {
    method: 'POST',
    body: formData
  });
}

export function generateId(): string {
  return 'chatcmpl-' + Math.random().toString(36).substring(2, 15);
}

export function getTimestamp(): number {
  return Math.floor(Date.now() / 1000);
}
