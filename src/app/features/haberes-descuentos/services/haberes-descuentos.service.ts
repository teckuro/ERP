import { Injectable, inject } from '@angular/core';

import { vigenciaIntersecaMes } from '../../../core/services/periodo-activo.service';
import { HaberesDescuentosRepository } from '../data-access/haberes-descuentos.repository';
import {
  CatalogoLreOpcion,
  ConceptoListado,
  ConceptoMantenimientoFila,
  ConceptoMantenimientoPayload,
  ContratoResumenPersona,
  HaberDescuentoAsignacionListado,
  HaberDescuentoAsignacionPayload,
  HaberDescuentoAsignacionPrevalidacionMensualFila,
  PERIODICIDADES_HD,
} from '../models/haber-descuento-asignacion.model';
import {
  esConceptoAsignable,
  inicioDiaReferencia,
  motivosNoAsignableConcepto,
  type ConceptoAsignableInput,
} from '../rules/concepto-asignabilidad.rules';

/** Snapshot alineado a `MovimientoVariableConceptoSnapshot` (evita dependencia circular con movimientos-variables). */
export type SnapshotConceptoMovimientoVariable = {
  tipo: string | null;
  calculoAutomatico: boolean;
  esSistema: boolean;
};
import {
  clasificarVigenciaAsignacion,
  etiquetaEstadoVigenciaAsignacion,
  validarCierreAsignacion,
  validarRangoAsignacionRecurrente,
  type RangoVigenciaAsignacion,
} from '../rules/haber-descuento-vigencia.rules';

function fechaInicioMesYmLocal(ym: string): Date {
  const t = ym.trim();
  const [ys, ms] = t.split('-');
  const y = Number(ys);
  const m = Number(ms);
  return inicioDiaReferencia(new Date(y, m - 1, 1));
}

function conceptoMantenimientoToListado(row: ConceptoMantenimientoFila): ConceptoListado {
  return {
    idConcepto: row.idConcepto,
    codigo: row.codigo,
    nombre: row.nombre,
    tipo: row.tipo,
    naturaleza: row.naturaleza,
    imponible: row.imponible,
    tributable: row.tributable,
    codigoLre: row.codigoLre,
  };
}

@Injectable({ providedIn: 'root' })
export class HaberesDescuentosService {
  private readonly repository = inject(HaberesDescuentosRepository);

  listarCatalogoLre(): Promise<CatalogoLreOpcion[]> {
    return this.repository.listarCatalogoLreVigentes();
  }

  listarContratosPersona(idPersona: number): Promise<ContratoResumenPersona[]> {
    return this.repository.listarContratosPorPersona(idPersona);
  }

  /**
   * Opciones del selector de asignaciones: misma regla que el catálogo Conceptos (`esConceptoAsignable`).
   * @param fechaReferencia fecha civil de referencia (por defecto hoy), alineada al listado de conceptos.
   */
  listarConceptos(fechaReferencia?: Date): Promise<ConceptoListado[]> {
    const ref = fechaReferencia ?? inicioDiaReferencia(new Date());
    return this.repository.listarConceptosMantenimiento().then((rows) =>
      rows.filter((r) => esConceptoAsignable(r, ref)).map(conceptoMantenimientoToListado),
    );
  }

  listarConceptosMantenimiento(): Promise<ConceptoMantenimientoFila[]> {
    return this.repository.listarConceptosMantenimiento();
  }

  listarPorPersona(idPersona: number, fechaReferencia?: Date): Promise<HaberDescuentoAsignacionListado[]> {
    const ref = fechaReferencia ?? inicioDiaReferencia(new Date());
    return this.repository.listarAsignacionesPorPersona(idPersona).then((rows) =>
      rows.map((row) => {
        const estadoVigencia = clasificarVigenciaAsignacion(
          {
            vigenciaInicio: row.vigenciaInicio,
            vigenciaFin: row.vigenciaFin,
            estado: row.estado,
          },
          ref,
        );
        return {
          ...row,
          estadoVigencia,
          estadoVigenciaEtiqueta: etiquetaEstadoVigenciaAsignacion(estadoVigencia),
        };
      }),
    );
  }

  /**
   * Todas las asignaciones recurrentes con clasificacion de vigencia al inicio del mes del periodo
   * e indicador de interseccion con el mes (para proceso mensual / prevalidacion; sin motor).
   */
  async listarAsignacionesParaPrevalidacionMensual(
    periodo: string,
  ): Promise<HaberDescuentoAsignacionPrevalidacionMensualFila[]> {
    const rows = await this.repository.listarTodasAsignacionesConConcepto();
    const ref = fechaInicioMesYmLocal(periodo);
    return rows.map((asignacion) => ({
      asignacion,
      estadoVigencia: clasificarVigenciaAsignacion(
        {
          vigenciaInicio: asignacion.vigenciaInicio,
          vigenciaFin: asignacion.vigenciaFin,
          estado: asignacion.estado,
        },
        ref,
      ),
      intersectaPeriodo: vigenciaIntersecaMes(
        asignacion.vigenciaInicio,
        asignacion.vigenciaFin,
        periodo,
      ),
    }));
  }

  private async assertConceptoPermiteAsignacionManual(idConcepto: number): Promise<void> {
    await this.resolverSnapshotConceptoParaMovimientoVariableManual(idConcepto, inicioDiaReferencia(new Date()));
  }

  /**
   * Resuelve el concepto en catalogo y aplica la misma regla que asignaciones recurrentes (`esConceptoAsignable`)
   * en la fecha de referencia (p. ej. primer dia del periodo `YYYY-MM` del movimiento variable).
   * CHILE-FIX-01: la UI no es fuente de verdad; `MovimientosVariablesService` debe llamar esto antes de crear/actualizar.
   */
  async resolverSnapshotConceptoParaMovimientoVariableManual(
    idConcepto: number,
    refDate: Date,
  ): Promise<SnapshotConceptoMovimientoVariable> {
    const meta = await this.repository.obtenerConceptoParaAsignacion(idConcepto);
    if (!meta) {
      throw new Error('No se pudo validar el concepto de remuneracion seleccionado.');
    }
    const ref = inicioDiaReferencia(refDate);
    const tipoNorm = (meta.tipo ?? '').trim().toUpperCase();
    if (tipoNorm === 'APORTE_EMPLEADOR') {
      throw new Error('Los aportes del empleador no se registran como movimientos del mes del trabajador.');
    }
    if (meta.esSistema || meta.calculoAutomatico) {
      throw new Error('Los conceptos automaticos o de sistema no se cargan manualmente.');
    }
    const input: ConceptoAsignableInput = {
      tipo: meta.tipo ?? '',
      esSistema: meta.esSistema,
      calculoAutomatico: meta.calculoAutomatico,
      vigente: meta.vigente,
      vigenciaInicio: meta.vigenciaInicio,
      vigenciaFin: meta.vigenciaFin,
    };
    if (!esConceptoAsignable(input, ref)) {
      const motivos = motivosNoAsignableConcepto(input, ref);
      throw new Error(motivos[0] ?? 'El concepto seleccionado no puede usarse como movimiento puntual manual.');
    }
    return {
      tipo: meta.tipo ?? null,
      calculoAutomatico: meta.calculoAutomatico,
      esSistema: meta.esSistema,
    };
  }

  private async validarContratoPersona(
    idPersona: number,
    idContrato: number | null,
  ): Promise<void> {
    if (idContrato == null) {
      return;
    }
    const ok = await this.repository.contratoPerteneceAPersona(idPersona, idContrato);
    if (!ok) {
      throw new Error('El contrato seleccionado no pertenece al trabajador.');
    }
  }

  private async validarAsignacionRecurrente(
    payload: HaberDescuentoAsignacionPayload,
    idAsignacion?: number,
  ): Promise<void> {
    const existentes = await this.repository.listarAsignacionesPorPersonaYConcepto(
      payload.idPersona,
      payload.idConcepto,
    );
    const candidata: RangoVigenciaAsignacion = {
      idAsignacion: idAsignacion ?? null,
      idPersona: payload.idPersona,
      idConcepto: payload.idConcepto,
      vigenciaInicio: payload.vigenciaInicio,
      vigenciaFin: payload.vigenciaFin,
      estado: payload.estado,
    };
    const resultado = validarRangoAsignacionRecurrente(
      candidata,
      existentes.map((row) => ({
        idAsignacion: row.idAsignacion,
        idPersona: row.idPersona,
        idConcepto: row.idConcepto,
        vigenciaInicio: row.vigenciaInicio,
        vigenciaFin: row.vigenciaFin,
        estado: row.estado,
      })),
      inicioDiaReferencia(new Date()),
    );

    if (!resultado.valido) {
      throw new Error(resultado.motivos[0] ?? 'La asignacion recurrente no cumple las reglas de vigencia.');
    }
  }

  async crear(payload: HaberDescuentoAsignacionPayload): Promise<void> {
    this.validarPayloadAsignacion(payload);
    await this.validarContratoPersona(payload.idPersona, payload.idContrato);
    await this.assertConceptoPermiteAsignacionManual(payload.idConcepto);
    await this.validarAsignacionRecurrente(payload);
    await this.repository.crearAsignacion(payload);
  }

  async actualizar(
    idAsignacion: number,
    payload: HaberDescuentoAsignacionPayload,
  ): Promise<void> {
    this.validarPayloadAsignacion(payload);
    await this.validarContratoPersona(payload.idPersona, payload.idContrato);
    await this.assertConceptoPermiteAsignacionManual(payload.idConcepto);
    await this.validarAsignacionRecurrente(payload, idAsignacion);
    await this.repository.actualizarAsignacion(idAsignacion, payload);
  }

  async cerrarAsignacion(idAsignacion: number, fechaCierre?: string | Date): Promise<void> {
    const asignacion = await this.repository.obtenerAsignacionPorId(idAsignacion);
    if (!asignacion) {
      throw new Error('No se encontro la asignacion recurrente.');
    }

    const ref = inicioDiaReferencia(new Date());
    const resultado = validarCierreAsignacion(
      {
        idAsignacion: asignacion.idAsignacion,
        idPersona: asignacion.idPersona,
        idConcepto: asignacion.idConcepto,
        vigenciaInicio: asignacion.vigenciaInicio,
        vigenciaFin: asignacion.vigenciaFin,
        estado: asignacion.estado,
        fechaCierre: fechaCierre ?? ref,
      },
      ref,
    );

    if (!resultado.valido) {
      throw new Error(resultado.motivos[0] ?? 'No se pudo cerrar la asignacion recurrente.');
    }

    await this.repository.cerrarAsignacion(idAsignacion, {
      estado: resultado.estadoResultante,
      vigenciaFin: resultado.vigenciaFinResultante,
    });
  }

  desactivar(idAsignacion: number): Promise<void> {
    return this.cerrarAsignacion(idAsignacion);
  }

  async crearConcepto(payload: ConceptoMantenimientoPayload): Promise<number> {
    this.validarPayloadConcepto(payload);
    return this.repository.crearConcepto(payload);
  }

  async actualizarConcepto(idConcepto: number, payload: ConceptoMantenimientoPayload): Promise<void> {
    this.validarPayloadConcepto(payload);
    await this.repository.actualizarConcepto(idConcepto, payload);
  }

  async eliminarConcepto(idConcepto: number): Promise<void> {
    const flags = await this.repository.obtenerConceptoFlags(idConcepto);
    if (flags?.esSistema) {
      throw new Error('No se puede eliminar un concepto de sistema.');
    }
    const uso = await this.repository.contarUsoConcepto(idConcepto);
    if (uso.liquidacionDetalle > 0) {
      throw new Error('No se puede eliminar: el concepto tiene líneas en liquidaciones.');
    }
    if (uso.asignaciones > 0) {
      throw new Error('No se puede eliminar: el concepto está asignado a trabajadores.');
    }
    await this.repository.eliminarConcepto(idConcepto);
  }

  private validarPayloadAsignacion(payload: HaberDescuentoAsignacionPayload): void {
    if (!payload.idPersona || !payload.idConcepto) {
      throw new Error('Trabajador y concepto son obligatorios.');
    }
    if (payload.periodicidad != null && !PERIODICIDADES_HD.includes(payload.periodicidad)) {
      throw new Error('La periodicidad no es válida.');
    }
    if (payload.vigenciaInicio && payload.vigenciaFin) {
      if (payload.vigenciaFin < payload.vigenciaInicio) {
        throw new Error('La fecha de termino no puede ser anterior a la fecha de inicio.');
      }
    }
    if (!payload.vigenciaInicio && payload.vigenciaFin) {
      throw new Error('Si informa vigencia fin, debe informar vigencia inicio.');
    }
    if (payload.tipoValor === 'FIJO') {
      if (payload.monto == null || payload.monto < 0) {
        throw new Error('El monto debe ser mayor o igual a 0.');
      }
    } else if (payload.tipoValor === 'PORCENTAJE') {
      if (payload.porcentaje == null || payload.porcentaje < 0) {
        throw new Error('El porcentaje debe ser mayor o igual a 0.');
      }
      if (payload.porcentaje > 100) {
        throw new Error('El porcentaje no puede superar 100.');
      }
    } else {
      throw new Error('Tipo de valor invalido.');
    }
  }

  private validarPayloadConcepto(p: ConceptoMantenimientoPayload): void {
    if (!p.codigo?.trim()) {
      throw new Error('El código es obligatorio.');
    }
    if (!p.nombre?.trim()) {
      throw new Error('El nombre es obligatorio.');
    }
    if (!p.tipo || !['HABER', 'DESCUENTO', 'APORTE_EMPLEADOR'].includes(p.tipo)) {
      throw new Error('El tipo de concepto no es válido.');
    }
    if (p.naturaleza != null && !['IMPONIBLE', 'NO_IMPONIBLE'].includes(p.naturaleza)) {
      throw new Error('La naturaleza no es válida.');
    }
    if (p.vigenciaInicio && p.vigenciaFin && p.vigenciaFin < p.vigenciaInicio) {
      throw new Error('La vigencia fin debe ser mayor o igual a la vigencia inicio.');
    }
    if (!Number.isInteger(p.ordenImpresion) || p.ordenImpresion < 0) {
      throw new Error('Orden impresión inválido.');
    }
  }
}
