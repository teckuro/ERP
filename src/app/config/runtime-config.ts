type AppConfig = {
  supabaseUrl: string;
  supabaseAnonKey: string;
  /** Edge Function slug en Supabase (dashboard: super-service) */
  asistentePreguntorFunction?: string;
};

const DEFAULT_ASISTENTE_FUNCTION = 'super-service';
const PLACEHOLDER_KEY = /YOUR_|REPLACE_ME|CHANGEME/i;
const PLACEHOLDER_URL = /YOUR_PROJECT|example\.com/i;
const PUBLISHABLE_KEY = /^sb_publishable_[A-Za-z0-9_-]+$/;
const SECRET_KEY = /^sb_secret_/;

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

  if (SECRET_KEY.test(config.supabaseAnonKey)) {
    return 'La clave de Supabase no puede ser sb_secret_ en frontend. Use una publishable key o anon public key.';
  }

  // JWT anon legacy típico ~200+ caracteres; las publishable keys nuevas usan sb_publishable_.
  if (!PUBLISHABLE_KEY.test(config.supabaseAnonKey) && config.supabaseAnonKey.length < 80) {
    return (
      'La clave anon en app-config.json parece incompleta. Use una publishable key ' +
      'sb_publishable_... o la clave «anon public» completa desde Supabase → Settings → API.'
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
