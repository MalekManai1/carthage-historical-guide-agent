export interface SourceRef {
  source_type: string;
  source_id: number | null;
  title: string | null;
  score: number | null;
  url?: string | null;
}

export interface MemoryContext {
  preferred_language: string;
  interests: string[];
  available_time_minutes: number | null;
  mobility_mode: string | null;
  last_mentioned_monuments: string[];
  primary_site_id: number | null;
  primary_site_name: string | null;
}

export interface LatencyDebug {
  memory_retrieval_ms?: number | null;
  retrieval_ms?: number | null;
  prompt_construction_ms?: number | null;
  llm_generation_ms?: number | null;
  memory_update_ms?: number | null;
  web_search_ms?: number | null;
}

export interface ChatResponse {
  session_id: string;
  answer: string;
  sources: SourceRef[];
  memory_context: MemoryContext;
  suggested_actions: string[];
  latency_ms?: number | null;
  latency_debug?: LatencyDebug | null;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: SourceRef[];
  memory?: MemoryContext;
  actions?: string[];
  elapsedMs?: number;
  latencyMs?: number;
  latencyDebug?: LatencyDebug;
  createdAt: number;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}
