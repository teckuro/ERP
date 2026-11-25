import { mensajeErrorSupabaseConocido } from '../../../core/errors/erp-supabase-user-message';

export interface SupabaseWriteError {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
}

export class EmpleadoRutDuplicadoError extends Error {
  constructor(readonly rut: string) {
    super(
      `No es posible guardar la ficha con RUT ${rut}, porque ya existe una ficha registrada con ese identificador.`,
    );
    this.name = 'EmpleadoRutDuplicadoError';
  }
}

export class EmpleadoReferenciaInvalidaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EmpleadoReferenciaInvalidaError';
  }
}

/**
 * `message`: texto de negocio del repositorio (p. ej. 'No fue posible cargar las comunas.').
 * `details`: `error.message` crudo de Supabase/Postgres. Nunca se muestra tal cual: solo se agrega
 * su versión humanizada cuando es un caso conocido (RLS/solo consulta, sesión, red, entorno).
 */
export function buildRepositoryError(message: string, details?: string): Error {
  const causa = details ? mensajeErrorSupabaseConocido({ message: details }) : null;
  return new Error(causa ? `${message} ${causa}` : message);
}

export function isUniqueConstraintError(
  error: SupabaseWriteError,
  constraintName: string,
): boolean {
  const text = getErrorText(error);

  return text.includes('23505') && text.includes(constraintName.toLowerCase());
}

export function buildForeignKeyError(
  error: SupabaseWriteError,
  messagesByConstraint: Record<string, string>,
  fallbackMessage: string,
): EmpleadoReferenciaInvalidaError | null {
  if (!isForeignKeyConstraintError(error)) {
    return null;
  }

  const text = getErrorText(error);
  const match = Object.entries(messagesByConstraint).find(([constraintName]) =>
    text.includes(constraintName.toLowerCase()),
  );

  return new EmpleadoReferenciaInvalidaError(match?.[1] ?? fallbackMessage);
}

function isForeignKeyConstraintError(error: SupabaseWriteError): boolean {
  return getErrorText(error).includes('23503');
}

function getErrorText(error: SupabaseWriteError): string {
  return [error.code, error.message, error.details, error.hint]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}
