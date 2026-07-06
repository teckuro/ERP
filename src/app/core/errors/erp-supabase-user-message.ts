/** Mensaje RRHH para errores de red/Supabase sin exponer JSON crudo. */
export function mensajeErrorSupabaseParaUsuario(error: unknown, contexto = 'la operación'): string {
  const texto = extraerTextoError(error);
  const contextoLimpio = contexto.replace(/\.\s*$/, '').trim() || 'la operación';

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
    return `El entorno aún no tiene desplegadas las tablas necesarias para ${contextoLimpio}. Ejecute las migraciones en Supabase.`;
  }

  if (/could not find the function|PGRST202/i.test(texto)) {
    return `El entorno aún no tiene desplegados los servicios necesarios para ${contextoLimpio}.`;
  }

  if (/column .* does not exist|42703/i.test(texto)) {
    return 'El entorno de base de datos está desactualizado. Contacte al administrador para aplicar las migraciones pendientes.';
  }

  if (/no tiene plantilla mensual mes activa|no existe plantilla mensual mes activa/i.test(texto)) {
    return (
      'Falta la configuración base para crear nóminas mensuales en esta empresa. ' +
      'Contacte al administrador del sistema.'
    );
  }

  if (/sin empresa activa en la sesi[oó]n/i.test(texto)) {
    return 'Tu sesión no tiene empresa asignada. Cierra sesión, vuelve a entrar o contacta al administrador.';
  }

  if (/solo consulta|no puedes modificar n[oó]minas/i.test(texto)) {
    return 'Tu perfil es de solo consulta. No puedes crear nóminas.';
  }

  if (/el universo cambi[oó] desde la vista previa/i.test(texto)) {
    return 'Los datos cambiaron mientras confirmabas. Cierra el modal, vuelve a abrirlo e intenta de nuevo.';
  }

  if (/la previsualizaci[oó]n no permite crear|sin trabajadores incluidos/i.test(texto)) {
    return 'No hay trabajadores aptos para este período. Revise contratos vigentes y fichas en Empleados.';
  }

  if (/no fue posible recuperar la n[oó]mina/i.test(texto)) {
    return 'La nómina se creó pero no pudimos abrirla en la bandeja. Recarga el Administrador de nóminas.';
  }

  if (/jwt|session|not authenticated|401/i.test(texto)) {
    return 'Su sesión expiró o no tiene permiso. Vuelva a iniciar sesión.';
  }

  if (/failed to fetch|network|timeout/i.test(texto)) {
    return 'No hay conexión con el servidor. Compruebe su red e intente de nuevo.';
  }

  return `No se pudo ${contextoLimpio}. Intente de nuevo o contacte a soporte.`;
}

function extraerTextoError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null) {
    const o = error as { message?: string; hint?: string; code?: string };
    return [o.message, o.hint, o.code].filter(Boolean).join(' ');
  }
  return String(error ?? '');
}
