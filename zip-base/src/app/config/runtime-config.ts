type AppConfig = {
  supabaseUrl: string;
  supabaseAnonKey: string;
};

let runtimeConfig: AppConfig | null = null;

function normalizeConfig(input: Partial<AppConfig> | null | undefined): AppConfig {
  return {
    supabaseUrl: input?.supabaseUrl?.trim().replace(/\/$/, '') ?? '',
    supabaseAnonKey: input?.supabaseAnonKey?.trim() ?? '',
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
