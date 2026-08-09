export interface OpenAITextPart {
  type: 'text';
  text: string;
}

export interface OpenAIImageUrlPart {
  type: 'image_url';
  image_url: {
    url: string; // data:<mime>;base64,<data>  atau  http(s)://...
    detail?: string;
  };
}

export interface OpenAIFilePart {
  type: 'file';
  file: {
    filename?: string;
    file_data?: string; // data:<mime>;base64,<data>
    file_id?: string;
  };
}

export type OpenAIContentPart = OpenAITextPart | OpenAIImageUrlPart | OpenAIFilePart;

export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | OpenAIContentPart[];
}

export interface ArnaruFileAttachment {
  buffer: Buffer;
  filename: string;
  mimeType: string;
}

export interface OpenAIChatRequest {
  model?: string;
  messages: OpenAIMessage[];
  stream?: boolean;
  conversationId?: string;
  webSearch?: boolean;
  systemPrompt?: string;
}

export interface OpenAIChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message?: OpenAIMessage;
    delta?: { role?: string; content?: string };
    finish_reason: string | null;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface ArnaruSSEData {
  data?: string;
  answer?: string;
  text?: string;
  response?: string;
  message?: string;
  content?: string;
  delta?: string;
  token?: string;
  output?: string;
  result?: string;
  generated_text?: string;
  conversationId?: string;
  error?: string;
  choices?: Array<{
    delta?: { content?: string };
    message?: { content?: string };
    text?: string;
  }>;
}
