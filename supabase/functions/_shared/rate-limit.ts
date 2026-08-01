/**
 * SEC-06: rate limit en memoria del isolate Deno.
 *
 * v1: se reinicia en cold start (aceptable). No sustituye Auth rate limits
 * del Dashboard ni un gateway; protege Edge costosas (asistente / admin).
 */

export type RateLimitOk = { ok: true };
export type RateLimitDenied = { ok: false; retryAfterSec: number };
export type RateLimitResult = RateLimitOk | RateLimitDenied;

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export function checkRateLimit(opts: {
  /** Clave estable: `asistente:u:<id>` / `admin:ip:...` */
  key: string;
  /** Máximo de peticiones en la ventana */
  limit: number;
  /** Ventana en ms */
  windowMs: number;
}): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(opts.key);

  if (!existing || now >= existing.resetAt) {
    buckets.set(opts.key, { count: 1, resetAt: now + opts.windowMs });
    return { ok: true };
  }

  if (existing.count >= opts.limit) {
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;
  return { ok: true };
}

/** Identificador de cliente: user JWT preferente; si no, IP de proxy. */
export function clientKeyFromRequest(req: Request, userId?: string | null): string {
  if (userId?.trim()) {
    return `u:${userId.trim()}`;
  }
  const forwarded = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const ip =
    forwarded ||
    req.headers.get('cf-connecting-ip')?.trim() ||
    req.headers.get('x-real-ip')?.trim() ||
    'unknown';
  return `ip:${ip}`;
}

/** Comparación en tiempo constante para secretos webhook (SEC-06). */
export function timingSafeEqualString(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const ba = enc.encode(a);
  const bb = enc.encode(b);
  const len = Math.max(ba.length, bb.length);
  let diff = ba.length ^ bb.length;
  for (let i = 0; i < len; i++) {
    diff |= (ba[i] ?? 0) ^ (bb[i] ?? 0);
  }
  return diff === 0;
}
