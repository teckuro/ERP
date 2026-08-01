/**
 * SEC-05/SEC-06: CORS restringido al origen del ERP cuando `ERP_ALLOWED_ORIGIN` está definido.
 *
 * - Sin env o `*`: Allow-Origin `*` (dev).
 * - Con origen fijo: solo ese Origin recibe Allow-Origin; el resto no (preflight 403).
 * - Request sin header Origin (webhooks/curl): no se otorga Allow-Origin; el caller
 *   decide si rechaza (browser APIs con Origin presente) o acepta (webhook + secreto).
 */

export type CorsResolveResult = {
  /** true si el request puede recibir Allow-Origin usable */
  allowed: boolean;
  headers: Record<string, string>;
};

function buildAllowHeaders(extraAllowHeaders: string): string {
  return extraAllowHeaders
    ? `authorization, x-client-info, apikey, content-type, ${extraAllowHeaders}`
    : 'authorization, x-client-info, apikey, content-type';
}

/** Resuelve CORS; preferir sobre `buildCorsHeaders` cuando haga falta rechazar OPTIONS. */
export function resolveCors(req: Request, extraAllowHeaders = ''): CorsResolveResult {
  const configured = Deno.env.get('ERP_ALLOWED_ORIGIN')?.trim();
  const origin = req.headers.get('Origin');
  const allowHeaders = buildAllowHeaders(extraAllowHeaders);

  if (!configured || configured === '*') {
    return {
      allowed: true,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': allowHeaders,
      },
    };
  }

  if (origin === configured) {
    return {
      allowed: true,
      headers: {
        'Access-Control-Allow-Origin': configured,
        'Access-Control-Allow-Headers': allowHeaders,
        Vary: 'Origin',
      },
    };
  }

  // Origen ausente o distinto: no otorgar Allow-Origin (el browser bloquea).
  return {
    allowed: false,
    headers: {
      'Access-Control-Allow-Headers': allowHeaders,
      Vary: 'Origin',
    },
  };
}

/** Compat: headers CORS (puede omitir Allow-Origin si el origen no está permitido). */
export function buildCorsHeaders(req: Request, extraAllowHeaders = ''): Record<string, string> {
  return resolveCors(req, extraAllowHeaders).headers;
}

/** Respuesta OPTIONS: 204 si permitido, 403 si origen no autorizado con ERP_ALLOWED_ORIGIN. */
export function corsPreflightResponse(req: Request, extraAllowHeaders = ''): Response {
  const { allowed, headers } = resolveCors(req, extraAllowHeaders);
  if (!allowed) {
    return new Response('Origen no permitido', { status: 403, headers });
  }
  return new Response('ok', {
    status: 204,
    headers: {
      ...headers,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Max-Age': '86400',
    },
  });
}
