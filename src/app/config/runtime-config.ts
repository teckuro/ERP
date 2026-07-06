type AppConfig = {
  supabaseUrl: string;
  supabaseAnonKey: string;
  /** Edge Function slug en Supabase (dashboard: super-service) */
  asistentePreguntorFunction?: string;
};

const DEFAULT_ASISTENTE_FUNCTION = 'super-service';

let runtimeConfig: AppConfig | null = null;

function normalizeConfig(input: Partial<AppConfig> | null | undefined): AppConfig {
  const fn = input?.asistentePreguntorFunction?.trim();
  return {
    supabaseUrl: input?.supabaseUrl?.trim().replace(/\/$/, '') ?? '',
    supabaseAnonKey: input?.supabaseAnonKey?.trim() ?? '',
    asistentePreguntorFunction: fn || DEFAULT_ASISTENTE_FUNCTION,
  };
}

export async function loadRuntimeConfig(): Promise<void> {
  try {
    const response = await fetch('/app-config.json', { cache: 'no-store' });
    if (!response.ok) {
      runtimeConfig = normalizeConfig(null);
      return;
    }

    runtimeConfig = normalizeConfig((await response.json()) as Partial<AppConfig>);
  } catch {
    runtimeConfig = normalizeConfig(null);
  }
}

export function getAppConfig(): AppConfig {
  const config = runtimeConfig ?? normalizeConfig(null);

  if (!config.supabaseUrl || !config.supabaseAnonKey) {
    throw new Error(
      'Supabase no esta configurado. Crea public/app-config.json desde public/app-config.example.json.',
    );
  }

  return config;
}
