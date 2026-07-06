import type { ConceptoMantenimientoFila } from '../models/haber-descuento-asignacion.model';

export const CODIGOS_CONCEPTO_RESERVADOS_CONTRATO = ['SUELDO_BASE'] as const;

export type ConceptoReservadoContratoInput = Pick<
  ConceptoMantenimientoFila,
  'codigo' | 'nombre' | 'esSistema'
>;

function normalizarTexto(value: string | null | undefined): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function esCodigoConceptoReservadoContrato(codigo: string | null | undefined): boolean {
  const normalizado = normalizarTexto(codigo).replace(/[\s-]+/g, '_');
  return CODIGOS_CONCEPTO_RESERVADOS_CONTRATO.some(
    (reservado) => normalizado === reservado.toLowerCase(),
  );
}

export function esNombreDuplicaSueldoBaseContrato(
  nombre: string | null | undefined,
  esSistema = false,
): boolean {
  if (esSistema) return false;
  const texto = normalizarTexto(nombre);
  if (!texto) return false;
  return (
    texto === 'sueldo base'
    || texto === 'sueldo basico'
    || texto.startsWith('sueldo base ')
    || texto.includes(' sueldo base')
  );
}

export function esConceptoReservadoContrato(input: ConceptoReservadoContratoInput): boolean {
  if (input.esSistema && esCodigoConceptoReservadoContrato(input.codigo)) {
    return true;
  }
  if (input.esSistema) {
    return false;
  }
  return (
    esCodigoConceptoReservadoContrato(input.codigo)
    || esNombreDuplicaSueldoBaseContrato(input.nombre, input.esSistema)
  );
}

export function motivoConceptoReservadoContrato(_input: ConceptoReservadoContratoInput): string {
  return 'El sueldo base se registra en la ficha del trabajador, no como concepto manual del mes.';
}

export function filtrarConceptosPermitidosMovimientoManual<
  T extends ConceptoReservadoContratoInput,
>(conceptos: readonly T[]): T[] {
  return conceptos.filter((concepto) => !esConceptoReservadoContrato(concepto));
}
