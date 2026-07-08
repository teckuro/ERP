import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-lm-webhook-secret, svix-id, svix-timestamp, svix-signature",
};

const FOLIO_REGEX = /\bLM[-\s]?\d{4}[-\s]?\d{3,}\b/i;
const ISO_DATE_REGEX = /\b(20\d{2})[-/](\d{2})[-/](\d{2})\b/g;

interface ResendInboundEmail {
  from?: string;
  to?: string | string[];
  subject?: string;
  text?: string;
  html?: string;
  headers?: Record<string, string>;
  message_id?: string;
  attachments?: Array<{
    filename?: string;
    content_type?: string;
    size?: number;
    download_url?: string;
  }>;
}

interface ResendInboundPayload {
  type?: string;
  created_at?: string;
  data?: ResendInboundEmail;
}

interface MailgunPayload {
  sender?: string;
  from?: string;
  subject?: string;
  "body-plain"?: string;
  "body-html"?: string;
  "Message-Id"?: string;
  timestamp?: string;
  attachment_count?: string;
}

console.info("licencia-medica-inbound: worker started");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Método no permitido" }, 405);
  }

  if (!validarSecreto(req)) {
    return jsonResponse({ error: "No autorizado" }, 401);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  const idEmpresa = Number(Deno.env.get("LM_INBOUND_EMPRESA_ID") ?? "");
  if (!Number.isFinite(idEmpresa) || idEmpresa <= 0) {
    return jsonResponse({ error: "LM_INBOUND_EMPRESA_ID no configurado" }, 503);
  }

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return jsonResponse({ error: "Cuerpo JSON inválido" }, 400);
  }

  const normalizado = normalizarCorreo(rawBody, req);
  if (!normalizado.remitente) {
    return jsonResponse({ error: "Correo sin remitente" }, 400);
  }

  if (normalizado.messageId) {
    const { data: existente } = await supabase
      .from("licencia_medica_ingreso_correo")
      .select("id_ingreso, id_licencia")
      .eq("id_empresa", idEmpresa)
      .eq("message_id", normalizado.messageId)
      .maybeSingle();

    if (existente?.id_ingreso) {
      return jsonResponse({
        ok: true,
        deduplicado: true,
        idIngreso: existente.id_ingreso,
        idLicencia: existente.id_licencia,
      });
    }
  }

  const heuristica = extraerHeuristica(
    [normalizado.asunto, normalizado.cuerpoTexto].filter(Boolean).join("\n"),
  );

  const { data: ingreso, error: ingresoError } = await supabase
    .from("licencia_medica_ingreso_correo")
    .insert({
      id_empresa: idEmpresa,
      remitente: normalizado.remitente,
      asunto: normalizado.asunto,
      cuerpo_texto: normalizado.cuerpoTexto,
      cuerpo_html: normalizado.cuerpoHtml,
      adjuntos: normalizado.adjuntos,
      message_id: normalizado.messageId,
      recibido_en: normalizado.recibidoEn,
      estado: "pendiente_revision",
    })
    .select("id_ingreso")
    .single();

  if (ingresoError || !ingreso) {
    console.error("ingreso correo", ingresoError);
    return jsonResponse({ error: "No fue posible guardar el ingreso" }, 500);
  }

  const licenciaPayload: Record<string, unknown> = {
    id_empresa: idEmpresa,
    origen: "correo",
    estado: "pendiente_revision",
    id_ingreso: ingreso.id_ingreso,
    observacion: normalizado.asunto ? `Ingreso por correo: ${normalizado.asunto}` : "Ingreso por correo",
  };

  if (heuristica.folio) {
    licenciaPayload.folio = heuristica.folio;
  }
  if (heuristica.fechaInicio) {
    licenciaPayload.fecha_inicio = heuristica.fechaInicio;
  }
  if (heuristica.fechaTermino) {
    licenciaPayload.fecha_termino = heuristica.fechaTermino;
  }
  if (heuristica.fechaInicio && heuristica.fechaTermino) {
    licenciaPayload.dias = calcularDiasInclusive(heuristica.fechaInicio, heuristica.fechaTermino);
  }

  const { data: licencia, error: licenciaError } = await supabase
    .from("licencia_medica")
    .insert(licenciaPayload)
    .select("id_licencia")
    .single();

  if (licenciaError) {
    console.error("licencia borrador", licenciaError);
    return jsonResponse({
      ok: true,
      idIngreso: ingreso.id_ingreso,
      advertencia: "Ingreso guardado sin licencia borrador (posible folio duplicado)",
    });
  }

  await supabase
    .from("licencia_medica_ingreso_correo")
    .update({ id_licencia: licencia.id_licencia })
    .eq("id_ingreso", ingreso.id_ingreso);

  return jsonResponse({
    ok: true,
    idIngreso: ingreso.id_ingreso,
    idLicencia: licencia.id_licencia,
    heuristica,
  });
});

function validarSecreto(req: Request): boolean {
  const esperado = Deno.env.get("LM_INBOUND_WEBHOOK_SECRET")?.trim();
  if (!esperado) {
    return false;
  }
  const recibido = req.headers.get("x-lm-webhook-secret")?.trim()
    ?? req.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  return recibido === esperado;
}

function normalizarCorreo(
  raw: unknown,
  req: Request,
): {
  remitente: string;
  asunto: string | null;
  cuerpoTexto: string | null;
  cuerpoHtml: string | null;
  adjuntos: unknown[];
  messageId: string | null;
  recibidoEn: string;
} {
  const resend = raw as ResendInboundPayload;
  if (resend?.type === "email.received" && resend.data) {
    const email = resend.data;
    return {
      remitente: limpiarRemitente(email.from ?? ""),
      asunto: email.subject?.trim() || null,
      cuerpoTexto: email.text?.trim() || null,
      cuerpoHtml: email.html?.trim() || null,
      adjuntos: (email.attachments ?? []).map((a) => ({
        nombre: a.filename ?? "adjunto",
        tipo: a.content_type ?? null,
        tamano: a.size ?? null,
        url: a.download_url ?? null,
      })),
      messageId: email.message_id?.trim()
        || email.headers?.["message-id"]?.trim()
        || req.headers.get("svix-id"),
      recibidoEn: resend.created_at ?? new Date().toISOString(),
    };
  }

  const mailgun = raw as MailgunPayload;
  if (mailgun?.sender || mailgun?.from || mailgun?.["body-plain"]) {
    return {
      remitente: limpiarRemitente(mailgun.sender ?? mailgun.from ?? ""),
      asunto: mailgun.subject?.trim() || null,
      cuerpoTexto: mailgun["body-plain"]?.trim() || null,
      cuerpoHtml: mailgun["body-html"]?.trim() || null,
      adjuntos: [],
      messageId: mailgun["Message-Id"]?.trim() || null,
      recibidoEn: mailgun.timestamp
        ? new Date(Number(mailgun.timestamp) * 1000).toISOString()
        : new Date().toISOString(),
    };
  }

  const generic = raw as Record<string, unknown>;
  return {
    remitente: limpiarRemitente(String(generic.from ?? generic.remitente ?? "")),
    asunto: String(generic.subject ?? generic.asunto ?? "").trim() || null,
    cuerpoTexto: String(generic.text ?? generic.cuerpo_texto ?? "").trim() || null,
    cuerpoHtml: String(generic.html ?? generic.cuerpo_html ?? "").trim() || null,
    adjuntos: Array.isArray(generic.adjuntos) ? generic.adjuntos : [],
    messageId: String(generic.message_id ?? generic.messageId ?? "").trim() || null,
    recibidoEn: new Date().toISOString(),
  };
}

function limpiarRemitente(value: string): string {
  const trimmed = value.trim();
  const match = /<([^>]+)>/.exec(trimmed);
  return (match?.[1] ?? trimmed).trim();
}

function extraerHeuristica(texto: string): {
  folio: string | null;
  fechaInicio: string | null;
  fechaTermino: string | null;
} {
  const folioMatch = FOLIO_REGEX.exec(texto);
  const folio = folioMatch
    ? folioMatch[0].replace(/\s+/g, "-").toUpperCase().replace(/--+/g, "-")
    : null;

  const fechas: string[] = [];
  for (const match of texto.matchAll(ISO_DATE_REGEX)) {
    fechas.push(`${match[1]}-${match[2]}-${match[3]}`);
    if (fechas.length >= 2) {
      break;
    }
  }

  return {
    folio,
    fechaInicio: fechas[0] ?? null,
    fechaTermino: fechas[1] ?? null,
  };
}

function calcularDiasInclusive(inicio: string, fin: string): number {
  const a = Date.parse(`${inicio}T00:00:00Z`);
  const b = Date.parse(`${fin}T00:00:00Z`);
  if (!Number.isFinite(a) || !Number.isFinite(b) || b < a) {
    return 0;
  }
  return Math.floor((b - a) / 86_400_000) + 1;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
