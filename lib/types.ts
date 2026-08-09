export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
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
