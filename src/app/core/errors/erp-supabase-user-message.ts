/** Mensaje RRHH para errores de red/Supabase sin exponer JSON crudo. */
export function mensajeErrorSupabaseParaUsuario(error: unknown, contexto = 'la operación'): string {
  const texto = extraerTextoError(error);

  if (/no api key found|apikey.*not found/i.test(texto)) {
    return (
      'No se pudo conectar con el servidor. Revise que public/app-config.json tenga la clave ' +
      'anon completa del proyecto Supabase (Dashboard → Settings → API → anon public).'
    );
  }

  if (/supabase no esta configurado|app-config\.json/i.test(texto)) {
    return (
      'Falta la configuración del servidor. Copie public/app-config.example.json a ' +
      'public/app-config.json y complete supabaseUrl y supabaseAnonKey.'
    );
  }

  if (/clave anon|anon key/i.test(texto)) {
    return texto;
  }

  if (/could not find the table|42P01|PGRST205/i.test(texto)) {
    return `El entorno aún no tiene desplegadas las tablas necesarias para ${contexto}. Ejecute las migraciones en Supabase.`;
  }

  if (/could not find the function|PGRST202/i.test(texto)) {
    return `El entorno aún no tiene desplegados los servicios necesarios para ${contexto}.`;
  }

  if (/jwt|session|not authenticated|401/i.test(texto)) {
    return 'Su sesión expiró o no tiene permiso. Vuelva a iniciar sesión.';
  }

  if (/failed to fetch|network|timeout/i.test(texto)) {
    return 'No hay conexión con el servidor. Compruebe su red e intente de nuevo.';
  }

  return `No se pudo completar ${contexto}. Intente de nuevo o contacte a soporte.`;
}

function extraerTextoError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null) {
    const o = error as { message?: string; hint?: string; code?: string };
    return [o.message, o.hint, o.code].filter(Boolean).join(' ');
  }
  return String(error ?? '');
}
