import type {
  ParametroGeneral,
  ParametrosGeneralesCatalogos,
} from '../../parametros-generales/models/parametro-general.model';

import type { ProcesoMensualGrupoParametro } from '../models/proceso-mensual.model';

function campoMensualOficialInvalido(valor: number | null | undefined): boolean {
  return valor == null || valor === 0;
}

/** Textos de completitud para UF/UTM/sueldo mínimo (null o cero). */
export function detallePendientesMensualesOficiales(fila: ParametroGeneral): string {
  const partes: string[] = [];
  if (fila.uf == null) {
    partes.push('Falta dato oficial: uf.');
  } else if (fila.uf === 0) {
    partes.push('Dato oficial en cero: uf.');
  }
  if (fila.utm == null) {
    partes.push('Falta dato oficial: utm.');
  } else if (fila.utm === 0) {
    partes.push('Dato oficial en cero: utm.');
  }
  const sueldo = fila.sueldoMinimo18a65 ?? fila.sueldoMinimo;
  if (sueldo == null) {
    partes.push('Falta dato oficial: sueldoMinimo18a65.');
  } else if (sueldo === 0) {
    partes.push('Dato oficial en cero: sueldoMinimo18a65.');
  }
  return partes.join(' ');
}

export interface RevisionParametrosMinimosInput {
  periodo: string;
  fila: ParametroGeneral | null;
  lecturaFila: 'ok' | 'error';
  catalogos: ParametrosGeneralesCatalogos | null;
  lecturaCatalogos: 'ok' | 'error' | 'omitido';
  errorCatalogos?: string;
}

/**
 * Clasifica grupos minimos de parametros para proceso mensual (sin valores demo; solo estado).
 */
export function revisarGruposParametrosMinimos(input: RevisionParametrosMinimosInput): ProcesoMensualGrupoParametro[] {
  const out: ProcesoMensualGrupoParametro[] = [];
  const { periodo, fila, lecturaFila, catalogos, lecturaCatalogos } = input;

  if (lecturaFila === 'error') {
    out.push({
      id: 'parametros_generales_lectura',
      clasificacion: 'PENDIENTE_INTEGRACION',
      detalle: 'lectura_fila_error',
    });
    return out;
  }

  const exacta = fila != null && fila.periodo === periodo;

  const sisOk = fila != null && exacta && fila.sis != null;

  if (!fila) {
    out.push({ id: 'mensuales_uf_utm_sueldo', clasificacion: 'FALTANTE', detalle: 'sin_fila' });
    out.push({ id: 'topes_base', clasificacion: 'FALTANTE', detalle: 'sin_fila' });
  } else if (!exacta) {
    out.push({
      id: 'mensuales_uf_utm_sueldo',
      clasificacion: 'PARCIAL',
      detalle: `fila_${fila.periodo}_vs_${periodo}`,
    });
    const topesParciales =
      (fila.topeAfp == null && fila.topeAfpUf == null) ||
      (fila.topeIps == null && fila.topeIpsUf == null) ||
      (fila.topeCesantia == null && fila.topeCesantiaUf == null);
    out.push({
      id: 'topes_base',
      clasificacion: topesParciales ? 'PARCIAL' : 'OK',
      detalle: topesParciales ? 'topes_incompletos' : undefined,
    });
  } else {
    const invalidosMensuales = [
      campoMensualOficialInvalido(fila.uf),
      campoMensualOficialInvalido(fila.utm),
      campoMensualOficialInvalido(fila.sueldoMinimo18a65 ?? fila.sueldoMinimo),
    ].filter(Boolean).length;
    if (invalidosMensuales === 0) {
      out.push({ id: 'mensuales_uf_utm_sueldo', clasificacion: 'OK' });
    } else {
      const detalleMensual = detallePendientesMensualesOficiales(fila);
      out.push({
        id: 'mensuales_uf_utm_sueldo',
        clasificacion: invalidosMensuales === 3 ? 'FALTANTE' : 'PARCIAL',
        detalle: detalleMensual || `invalidos_${invalidosMensuales}`,
      });
    }

    const tieneTopeAfp = fila.topeAfp != null || fila.topeAfpUf != null;
    const tieneTopeIps = fila.topeIps != null || fila.topeIpsUf != null;
    const tieneTopeCes = fila.topeCesantia != null || fila.topeCesantiaUf != null;
    const topesOk = tieneTopeAfp && tieneTopeIps && tieneTopeCes;
    if (topesOk) {
      out.push({ id: 'topes_base', clasificacion: 'OK' });
    } else {
      const faltan = [!tieneTopeAfp, !tieneTopeIps, !tieneTopeCes].filter(Boolean).length;
      out.push({
        id: 'topes_base',
        clasificacion: faltan === 3 ? 'FALTANTE' : 'PARCIAL',
        detalle: 'topes_incompletos',
      });
    }
  }

  if (lecturaCatalogos === 'error') {
    out.push({
      id: 'catalogos_afp_impuesto',
      clasificacion: 'PENDIENTE_INTEGRACION',
      detalle: input.errorCatalogos ?? 'catalogos_error',
    });
  } else if (lecturaCatalogos === 'omitido' || catalogos == null) {
    out.push({ id: 'catalogos_afp_impuesto', clasificacion: 'NO_APLICA_AUN' });
  } else {
    const okCat =
      catalogos.afp.length > 0 &&
      catalogos.tramosImpuesto.length > 0 &&
      catalogos.tablaImpuestoUnico.length > 0;
    out.push({
      id: 'catalogos_afp_impuesto',
      clasificacion: okCat ? 'OK' : 'FALTANTE',
      detalle: okCat ? undefined : 'afp_o_impuesto_vacio',
    });
  }

  if (lecturaCatalogos === 'ok' && catalogos != null) {
    const afcOk = catalogos.afcParametros.length > 0;
    out.push({
      id: 'afc_catalogo',
      clasificacion: afcOk ? 'OK' : 'PARCIAL',
      detalle: afcOk ? undefined : 'sin_filas_afc',
    });

    out.push({
      id: 'sis_fila_mensual',
      clasificacion: sisOk ? 'OK' : exacta ? 'PARCIAL' : 'FALTANTE',
      detalle: sisOk ? undefined : 'sis_null',
    });

    const saludOk = catalogos.isapres.length > 0 || catalogos.saludInstituciones.length > 0;
    out.push({
      id: 'salud_catalogo',
      clasificacion: saludOk ? 'OK' : 'PARCIAL',
      detalle: saludOk ? undefined : 'sin_isapre',
    });

    const leyOk = catalogos.ley16744Parametros.length > 0 || catalogos.organismosLey16744.length > 0;
    const ccafOk = catalogos.ccafEntidades.length > 0;
    out.push({
      id: 'mutualidad_ley16744_ccaf',
      clasificacion: leyOk || ccafOk ? 'OK' : 'NO_APLICA_AUN',
      detalle: leyOk || ccafOk ? undefined : 'sin_ley16744_ni_ccaf',
    });

    const reformaOk = catalogos.reformaPrevisional.length > 0;
    out.push({
      id: 'reforma_previsional',
      clasificacion: reformaOk ? 'OK' : 'NO_APLICA_AUN',
      detalle: reformaOk ? undefined : 'sin_reforma',
    });
  }

  return out;
}
