import { supabase } from "./supabase";

export type AiClientErrorCode =
  | "AUTH_ERROR"
  | "RATE_LIMITED"
  | "TIMEOUT_ERROR"
  | "VERCEL_SERVER_ERROR"
  | "INVALID_RESPONSE"
  | "SERVER_ERROR";

export class AiClientError extends Error {
  constructor(public readonly code: AiClientErrorCode, message?: string) {
    super(message || code);
    this.name = "AiClientError";
  }
}

interface AiResponse {
  data?: unknown;
  lessonPlan?: unknown;
  quiz?: unknown;
  homework?: unknown;
  error?: string;
}

function isAiResponse(value: unknown): value is AiResponse {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export async function requestAuthenticatedAi<T>(
  endpoint: string,
  body: Record<string, unknown>,
  select: (response: AiResponse) => unknown = (response) => response.data,
): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) {
    throw new AiClientError("AUTH_ERROR");
  }

  const abortController = new AbortController();
  const timeoutId = window.setTimeout(() => abortController.abort(), 35_000);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
      signal: abortController.signal,
    });

    const text = await response.text();
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new AiClientError(text.includes("504") ? "TIMEOUT_ERROR" : "VERCEL_SERVER_ERROR");
    }

    const payload = isAiResponse(parsed) ? parsed : {};
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) throw new AiClientError("AUTH_ERROR");
      if (response.status === 429) throw new AiClientError("RATE_LIMITED");
      throw new AiClientError("SERVER_ERROR", payload.error || "The AI request failed.");
    }

    const selected = select(payload);
    if (!selected) {
      throw new AiClientError("INVALID_RESPONSE");
    }

    return selected as T;
  } catch (error) {
    if (error instanceof AiClientError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new AiClientError("TIMEOUT_ERROR");
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}
