export type GoogleWorkspaceErrorCode =
  | "AUTH_ERROR"
  | "PERMISSION_ERROR"
  | "VALIDATION_ERROR"
  | "API_ERROR"
  | "NETWORK_ERROR";

export class GoogleWorkspaceError extends Error {
  readonly code: GoogleWorkspaceErrorCode;
  readonly status?: number;
  readonly reason?: string;

  constructor(
    message: string,
    code: GoogleWorkspaceErrorCode,
    options?: { status?: number; reason?: string },
  ) {
    super(message);
    this.name = "GoogleWorkspaceError";
    this.code = code;
    this.status = options?.status;
    this.reason = options?.reason;
  }
}

function getReason(payload: unknown): string | undefined {
  if (!payload || typeof payload !== "object") return undefined;
  const error = (payload as { error?: unknown }).error;
  if (!error || typeof error !== "object") return undefined;
  const errors = (error as { errors?: unknown }).errors;
  if (!Array.isArray(errors) || !errors[0] || typeof errors[0] !== "object") return undefined;
  const reason = (errors[0] as { reason?: unknown }).reason;
  return typeof reason === "string" ? reason.slice(0, 80) : undefined;
}

export async function throwForGoogleResponse(
  response: Response,
  operation: string,
): Promise<never> {
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    payload = undefined;
  }

  const reason = getReason(payload);
  const code: GoogleWorkspaceErrorCode = response.status === 401
    ? "AUTH_ERROR"
    : response.status === 403
      ? "PERMISSION_ERROR"
      : response.status >= 400 && response.status < 500
        ? "VALIDATION_ERROR"
        : "API_ERROR";

  throw new GoogleWorkspaceError(
    `${operation} failed (${response.status}).`,
    code,
    { status: response.status, reason },
  );
}

export function toGoogleWorkspaceError(error: unknown, operation: string): GoogleWorkspaceError {
  if (error instanceof GoogleWorkspaceError) return error;
  if (error instanceof TypeError) {
    return new GoogleWorkspaceError(`${operation} could not reach Google.`, "NETWORK_ERROR");
  }
  return new GoogleWorkspaceError(`${operation} failed.`, "API_ERROR");
}

export function isGoogleWorkspaceAuthError(error: unknown): boolean {
  return error instanceof GoogleWorkspaceError && (error.code === "AUTH_ERROR" || error.code === "PERMISSION_ERROR");
}

export function googleWorkspaceUserMessage(error: unknown, language: "en" | "ar"): string {
  const code = error instanceof GoogleWorkspaceError ? error.code : "API_ERROR";
  const messages = {
    en: {
      AUTH_ERROR: "Google authorization expired. Reconnect Google and try again.",
      PERMISSION_ERROR: "Google did not grant permission for this export. Reconnect and approve the requested access.",
      VALIDATION_ERROR: "Google could not accept this export. Please try again with a shorter lesson title or notes.",
      NETWORK_ERROR: "Google could not be reached. Check your connection and try again.",
      API_ERROR: "Google could not complete this export. Please try again.",
    },
    ar: {
      AUTH_ERROR: "انتهى تفويض Google. أعد الاتصال بـ Google ثم حاول مرة أخرى.",
      PERMISSION_ERROR: "لم يمنح Google الإذن المطلوب للتصدير. أعد الاتصال ووافق على الصلاحيات المطلوبة.",
      VALIDATION_ERROR: "تعذر على Google قبول هذا التصدير. حاول بعنوان أو ملاحظات أقصر.",
      NETWORK_ERROR: "تعذر الوصول إلى Google. تحقق من الاتصال ثم حاول مرة أخرى.",
      API_ERROR: "تعذر على Google إكمال التصدير. حاول مرة أخرى.",
    },
  } as const;
  return messages[language][code];
}
