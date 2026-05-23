import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Eres un asistente para usuarios de RRHH de un ERP chileno de remuneraciones.
Responde solo en español de Chile, de forma breve y clara.
Si no sabes algo, dilo sin inventar datos legales ni montos.
No ejecutes acciones en el sistema; solo orienta.`;

const DEFAULT_MODEL = "qwen/qwen3.5-122b-a10b";
const NIM_URL = "https://integrate.api.nvidia.com/v1/chat/completions";

interface ReqPayload {
  pregunta?: string;
}

console.info("asistente-preguntor: worker started");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Método no permitido" }, 405);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return jsonResponse({ error: "No autorizado" }, 401);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: authHeader } } },
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return jsonResponse({ error: "Sesión inválida" }, 401);
  }

  let body: ReqPayload;
  try {
    body = (await req.json()) as ReqPayload;
  } catch {
    return jsonResponse({ error: "Cuerpo JSON inválido" }, 400);
  }

  const pregunta = body.pregunta?.trim() ?? "";
  if (!pregunta) {
    return jsonResponse({ error: "Escribe una pregunta" }, 400);
  }

  const apiKey = Deno.env.get("NVIDIA_API_KEY");
  const model = Deno.env.get("NVIDIA_MODEL") ?? DEFAULT_MODEL;
  if (!apiKey) {
    return jsonResponse(
      { error: "Asistente no configurado en el servidor (NVIDIA_API_KEY)" },
      503,
    );
  }

  try {
    const respuesta = await completarConNimStream(apiKey, model, pregunta);
    if (!respuesta) {
      return jsonResponse({ error: "Respuesta vacía del asistente" }, 502);
    }
    return jsonResponse({ respuesta }, 200);
  } catch (err) {
    console.error("NVIDIA NIM error", err);
    return jsonResponse(
      { error: "No se pudo obtener respuesta del asistente" },
      502,
    );
  }
});

async function completarConNimStream(
  apiKey: string,
  model: string,
  pregunta: string,
): Promise<string> {
  const nimRes = await fetch(NIM_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "text/event-stream",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      stream: true,
      temperature: 0.6,
      top_p: 0.95,
      max_tokens: 16384,
      chat_template_kwargs: { enable_thinking: true },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: pregunta },
      ],
    }),
  });

  if (!nimRes.ok) {
    const detail = await nimRes.text();
    throw new Error(`NIM ${nimRes.status}: ${detail}`);
  }

  if (!nimRes.body) {
    throw new Error("NIM sin cuerpo en stream");
  }

  const reader = nimRes.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let respuesta = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line.startsWith("data:")) continue;

      const payload = line.startsWith("data: ")
        ? line.slice(6).trim()
        : line.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;

      try {
        const json = JSON.parse(payload);
        const delta = json.choices?.[0]?.delta;
        if (!delta) continue;

        // Thinking / reasoning: solo logs, no al usuario RRHH
        if (delta.reasoning_content) {
          console.info("[nim-thinking]");
        }

        if (delta.content) {
          respuesta += delta.content;
        }
      } catch {
        /* SSE parcial */
      }
    }
  }

  return respuesta.trim();
}

function jsonResponse(payload: unknown, status: number): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
