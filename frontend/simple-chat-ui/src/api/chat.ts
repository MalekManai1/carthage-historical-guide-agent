import type { ChatResponse } from "../types";

const API_URL = import.meta.env.VITE_API_URL ?? "";

export interface ChatApiResult extends ChatResponse {
  clientElapsedMs: number;
}

export async function sendChatMessage(
  sessionId: string,
  message: string,
  language = "auto",
): Promise<ChatApiResult> {
  const started = performance.now();
  const response = await fetch(`${API_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId, message, language }),
  });

  const payload = await response.json();
  const clientElapsedMs = performance.now() - started;
  if (!response.ok) {
    const detail =
      typeof payload.detail === "string"
        ? payload.detail
        : "Erreur lors de l'appel à l'API";
    throw new Error(detail);
  }

  return { ...(payload as ChatResponse), clientElapsedMs };
}
