type AppConfig = {
  supabaseUrl: string;
  supabaseAnonKey: string;
  /** Edge Function slug en Supabase (dashboard: super-service) */
  asistentePreguntorFunction?: string;
};

const DEFAULT_ASISTENTE_FUNCTION = 'super-service';
const PLACEHOLDER_KEY = /YOUR_|REPLACE_ME|CHANGEME/i;
const PLACEHOLDER_URL = /YOUR_PROJECT|example\.com/i;

let runtimeConfig: AppConfig | null = null;
let configLoadError: string | null = null;

function normalizeConfig(input: Partial<AppConfig> | null | undefined): AppConfig {
  const fn = input?.asistentePreguntorFunction?.trim();
  return {
    supabaseUrl: input?.supabaseUrl?.trim().replace(/\/$/, '') ?? '',
    supabaseAnonKey: input?.supabaseAnonKey?.trim() ?? '',
    asistentePreguntorFunction: fn || DEFAULT_ASISTENTE_FUNCTION,
  };
}

export function validarAppConfig(config: AppConfig): string | null {
  if (!config.supabaseUrl || !config.supabaseAnonKey) {
    return (
      'Supabase no está configurado. Cree public/app-config.json desde ' +
      'public/app-config.example.json con supabaseUrl y supabaseAnonKey.'
    );
  }

  if (PLACEHOLDER_URL.test(config.supabaseUrl) || PLACEHOLDER_KEY.test(config.supabaseAnonKey)) {
    return 'Reemplace los valores de ejemplo en public/app-config.json con los de su proyecto Supabase.';
  }

  if (!/^https:\/\/.+\.supabase\.co$/i.test(config.supabaseUrl)) {
    return 'supabaseUrl en app-config.json no tiene un formato válido (https://xxxx.supabase.co).';
  }

  // JWT anon típico ~200+ caracteres; claves cortas provocan "No API key found".
  if (config.supabaseAnonKey.length < 80) {
    return (
      'La clave anon en app-config.json parece incompleta. Copie la clave «anon public» ' +
      'completa desde Supabase → Settings → API.'
    );
  }

  return null;
}

export function getConfigLoadError(): string | null {
  return configLoadError;
}

export async function loadRuntimeConfig(): Promise<void> {
  configLoadError = null;
  try {
    const response = await fetch('/app-config.json', { cache: 'no-store' });
    if (!response.ok) {
      runtimeConfig = normalizeConfig(null);
      configLoadError =
        'No se encontró public/app-config.json. Copie app-config.example.json y complete sus datos.';
      return;
    }

    const raw = await response.text();
    if (raw.trim().startsWith('<')) {
      runtimeConfig = normalizeConfig(null);
      configLoadError =
        'No se pudo leer app-config.json. Verifique que el archivo exista en public/ y reinicie npm start.';
      return;
    }

    runtimeConfig = normalizeConfig(JSON.parse(raw) as Partial<AppConfig>);
    configLoadError = validarAppConfig(runtimeConfig);
  } catch {
    runtimeConfig = normalizeConfig(null);
    configLoadError = 'app-config.json no es un JSON válido. Revise comillas y formato.';
  }
}

export function getAppConfig(): AppConfig {
  const config = runtimeConfig ?? normalizeConfig(null);
  const error = configLoadError ?? validarAppConfig(config);

  if (error) {
    throw new Error(error);
  }

  return config;
}
