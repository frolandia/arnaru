// OpenAI-compatible types

export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenAIChatRequest {
  model?: string;
  messages: OpenAIMessage[];
  stream?: boolean;
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  conversationId?: string;
  webSearch?: boolean;
  systemPrompt?: string;
}

export interface OpenAIChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: OpenAIChoice[];
  usage?: OpenAIUsage;
}

export interface OpenAIChoice {
  index: number;
  message?: OpenAIMessage;
  delta?: OpenAIDelta;
  finish_reason: string | null;
}

export interface OpenAIDelta {
  role?: string;
  content?: string;
}

export interface OpenAIUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface OpenAIModel {
  id: string;
  object: string;
  created: number;
  owned_by: string;
}

export interface OpenAIModelsResponse {
  object: string;
  data: OpenAIModel[];
}

// Arnaru API types

export interface ArnaruChatRequest {
  question: string;
  model?: string;
  conversationId?: string;
  webSearch?: boolean;
  systemPrompt?: string;
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

export interface SSEParseResult {
  fullMessage: string;
  newConversationId: string | null;
  hasError: boolean;
  errorMessage: string | null;
}
