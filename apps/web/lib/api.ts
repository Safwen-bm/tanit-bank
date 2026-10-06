export type Role = "CUSTOMER" | "ADMIN";

export interface PublicUser {
  id: string;
  email: string;
  fullName: string;
  role: Role;
}

export interface AuthResponse {
  accessToken: string;
  user: PublicUser;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// The access token lives in memory only: never in localStorage, never readable after a reload.
// A reload restores the session through the httpOnly refresh cookie.
let accessToken: string | null = null;
let refreshInFlight: Promise<AuthResponse | null> | null = null;
let onSessionLost: (() => void) | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function setSessionLostHandler(handler: (() => void) | null) {
  onSessionLost = handler;
}

async function toApiError(res: Response): Promise<ApiError> {
  let message = res.statusText || "Request failed";
  try {
    const body = await res.json();
    const raw = body?.message;
    message = Array.isArray(raw) ? raw.join(", ") : (raw ?? message);
  } catch {
    // body was not JSON
  }
  return new ApiError(res.status, message);
}

/** Single-flight: parallel callers share one refresh request (the token rotates on each call). */
export function refreshSession(): Promise<AuthResponse | null> {
  refreshInFlight ??= (async () => {
    try {
      const res = await fetch("/api/auth/refresh", { method: "POST", credentials: "same-origin" });
      if (!res.ok) {
        accessToken = null;
        return null;
      }
      const data = (await res.json()) as AuthResponse;
      accessToken = data.accessToken;
      return data;
    } catch {
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

interface Options {
  method?: string;
  body?: unknown;
  auth?: boolean;
  headers?: Record<string, string>;
}

export async function api<T>(
  path: string,
  { method = "GET", body, auth = true, headers }: Options = {},
): Promise<T> {
  const send = () =>
    fetch(`/api${path}`, {
      method,
      credentials: "same-origin",
      headers: {
        ...headers,
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(auth && accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

  let res = await send();

  if (res.status === 401 && auth) {
    const session = await refreshSession();
    if (session) {
      res = await send();
    } else {
      onSessionLost?.();
    }
  }

  if (!res.ok) throw await toApiError(res);
  return (res.status === 204 ? undefined : await res.json()) as T;
}

export async function loginRequest(email: string, password: string) {
  const data = await api<AuthResponse>("/auth/login", { method: "POST", body: { email, password }, auth: false });
  accessToken = data.accessToken;
  return data;
}

export interface RegisterInput {
  email: string;
  password: string;
  fullName: string;
  monthlyIncome: string;
  phone?: string;
}

export async function registerRequest(input: RegisterInput) {
  const data = await api<AuthResponse>("/auth/register", { method: "POST", body: input, auth: false });
  accessToken = data.accessToken;
  return data;
}

export async function logoutRequest() {
  try {
    await api("/auth/logout", { method: "POST", auth: false });
  } finally {
    accessToken = null;
  }
}