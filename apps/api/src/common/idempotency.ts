import { BadRequestException } from "@nestjs/common";

const KEY_PATTERN = /^[A-Za-z0-9_-]{8,80}$/;

/** Reads the Idempotency-Key header. Required for transfers, optional for cash movements. */
export function parseIdempotencyKey(raw: string | undefined, required: boolean): string | undefined {
  if (!raw) {
    if (required) throw new BadRequestException("Idempotency-Key header is required");
    return undefined;
  }
  if (!KEY_PATTERN.test(raw)) {
    throw new BadRequestException("Idempotency-Key must be 8 to 80 characters (letters, digits, - or _)");
  }
  return raw;
}