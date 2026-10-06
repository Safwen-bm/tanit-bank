import { useRef } from "react";
import { ApiError } from "./api";

/**
 * One Idempotency-Key per user intention. It is kept after a network failure (so a retry
 * cannot pay twice) and dropped once the server has answered, success or refusal.
 */
export function useIdempotencyKey() {
  const key = useRef<string | null>(null);
  return {
    current(): string {
      key.current ??= crypto.randomUUID();
      return key.current;
    },
    settle(error?: unknown) {
      if (!error || error instanceof ApiError) key.current = null;
    },
  };
}