import { inject, InjectionToken } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { getAppConfig } from '../../config/runtime-config';
import { Database } from '../models/database.types';

export const SUPABASE_CLIENT = new InjectionToken<SupabaseClient<Database>>('SupabaseClient');

export function createSupabaseClient(): SupabaseClient<Database> {
  const config = getAppConfig();

  return createClient<Database>(config.supabaseUrl, config.supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storageKey: 'angular-erp-auth',
    },
  });
}

export function injectSupabase(): SupabaseClient<Database> {
  return inject(SUPABASE_CLIENT);
}
