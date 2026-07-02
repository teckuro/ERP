import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { config } from 'dotenv';

config({ path: resolve(process.cwd(), '.env'), quiet: true });

export type SupabaseE2eConfig = {
  supabaseUrl: string;
  supabaseAnonKey: string;
};

/** Supabase hosted projects use `.supabase.co`, not `.supabase.com`. */
export function normalizeSupabaseUrl(raw: string): string {
  return raw.replace(/\/$/, '').replace('.supabase.com', '.supabase.co');
}

export function loadSupabaseE2eConfig(): SupabaseE2eConfig {
  const configPath = resolve(process.cwd(), 'public', 'app-config.json');
  let rawFromFile: Partial<SupabaseE2eConfig> = {};

  try {
    const rawConfig = readFileSync(configPath, 'utf8').replace(/^\uFEFF/, '');
    rawFromFile = JSON.parse(rawConfig) as Partial<SupabaseE2eConfig>;
  } catch {
    rawFromFile = {};
  }

  const supabaseUrl = normalizeSupabaseUrl(
    process.env['E2E_SUPABASE_URL'] ?? rawFromFile.supabaseUrl ?? '',
  );
  const supabaseAnonKey =
    process.env['E2E_SUPABASE_ANON_KEY'] ?? rawFromFile.supabaseAnonKey ?? '';

  return { supabaseUrl, supabaseAnonKey };
}
