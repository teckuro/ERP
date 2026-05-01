import { CrearEmpleadoPayload } from '../models/empleado-payload.model';

/**
 * Decide si el bloque previsional/salud/cuenta2/APV puede persistirse en un borrador
 * sin exigir APVI completo ni datos finales del paso 9.
 */
export function puedePersistirPrevisionBorrador(payload: CrearEmpleadoPayload): boolean {
  if (payload.tipoPrevision === 'NINGUNA') {
    return true;
  }
  if (payload.tipoPrevision === 'AFP') {
    return payload.idAfp !== null && payload.idRegimenPrevisional !== null;
  }
  if (payload.tipoPrevision === 'IPS') {
    if (payload.idRegimenPrevisional === null) {
      return false;
    }
    const exManual =
      Boolean(payload.nombreExCaja?.trim()) &&
      Boolean(payload.regimenExCaja?.trim()) &&
      payload.tasaExCaja !== null;
    return (
      (payload.idEntidadPrevisionalIps !== null && payload.idExCajaPrevisional !== null) ||
      exManual
    );
  }
  return false;
}

/** Campos de persona actualizados al guardar borrador (meta wizard). */
export function buildPersonaMetaBorradorUpdate(pasoWizard: number) {
  return {
    estado: 'BORRADOR' as const,
    estado_ficha: 'INCOMPLETO' as const,
    apto_para_remuneraciones: false,
    paso_alta_avanzada: pasoWizard,
  };
}
