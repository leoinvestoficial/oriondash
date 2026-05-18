// Tipos compartilhados entre edge functions do Cérebro v2.

export type ChatRole = "user" | "assistant" | "system";
export type ChatMessage = { role: ChatRole; content: string };

// Memória recuperada por embedding.
export interface RetrievedMemory {
  id: string;
  memory_type: string;
  source: string;
  title: string;
  summary: string | null;
  content: string | null;
  tags: string[];
  importance: number;
  occurred_at: string;
  similarity: number;
}

// Resultado da escolha de agente pelo orchestrator.
export type AgentName = "strategist" | "copywriter";

export interface AgentChoice {
  primary: AgentName;
  // No futuro, multi-agente: secondary?: AgentName[];
}

// Configuração de um agente — system prompt + modelo recomendado.
export interface AgentConfig {
  name: AgentName;
  systemPrompt: string;
  model: string;
  maxTokens: number;
}

// Logging — payload pra ai_call_log.
export interface AiCallLogEntry {
  user_id: string;
  call_type: "chat" | "embedding" | "image_generation" | "analyst" | "playbook_update";
  provider: "anthropic" | "openai" | "replicate" | "lovable";
  model?: string;
  agent?: string;
  tokens_in?: number;
  tokens_out?: number;
  cost_usd?: number;
  latency_ms?: number;
  status?: "success" | "error" | "timeout" | "rate_limited";
  error_message?: string;
  request_id?: string;
  metadata?: Record<string, unknown>;
}
