/** SEC-05: CORS restringido al origen del ERP cuando `ERP_ALLOWED_ORIGIN` está definido. */
export function buildCorsHeaders(req: Request, extraAllowHeaders = ''): Record<string, string> {
  const configured = Deno.env.get('ERP_ALLOWED_ORIGIN')?.trim();
  const origin = req.headers.get('Origin');
  const allowOrigin =
    configured && configured !== '*'
      ? origin === configured
        ? configured
        : configured
      : '*';

  const allowHeaders = extraAllowHeaders
    ? `authorization, x-client-info, apikey, content-type, ${extraAllowHeaders}`
    : 'authorization, x-client-info, apikey, content-type';

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': allowHeaders,
  };
}
