import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

import { PeriodoActivoService } from '../../../../core/services/periodo-activo.service';
import { BadgeComponent } from '../../../../shared/components/ui/badge.component';
import { ButtonComponent } from '../../../../shared/components/ui/button.component';
import { CardComponent, CardContentComponent } from '../../../../shared/components/ui/card.component';
import type {
  BaseNominaParametrosEstado,
  BaseNominaTrabajadorEstado,
  ClasificacionParametroGrupo,
  MotorCalculoPeriodoResultado,
  MotorCalculoIssue,
  MotorCalculoEstadoTrabajador,
  MotorCalculoSeveridad,
  NominaCalculoConceptoSnapshot,
  NominaCalculoPeriodoSnapshot,
  NominaSnapshotCompletoView,
  ProcesoMensualArea,
  ProcesoMensualEstado,
  ProcesoMensualItemEstado,
  ProcesoMensualMensaje,
  ProcesoMensualPreNominaEstado,
  ProcesoMensualPreNominaPeriodo,
  ProcesoMensualPrevalidacion,
} from '../../models/proceso-mensual.model';
import { ProcesoMensualService } from '../../services/proceso-mensual.service';
import { validarPeriodoEntradaMensual } from '../../entradas/rules/entradas-mensuales-periodo.rules';
import {
  resolverEstadoOperativoProcesoMensual,
  type ProcesoMensualAccionLocal,
  type ProcesoMensualEstadoSeveridad,
  type ProcesoMensualPendienteVm,
} from '../../rules/proceso-mensual-estado-operativo.rules';

type ValidacionCalculoEstado = 'pendiente' | 'listo' | 'advertencias' | 'bloqueado';
type ValidacionOperativaSeveridad = 'bloqueo' | 'advertencia' | 'info';
type ValidacionAccionLocal = ProcesoMensualAccionLocal;
type ResultadoPreliminarEstado =
  | 'sin_resultado'
  | 'no_guardado'
  | 'guardado'
  | 'actualizado_sin_guardar'
  | 'error_guardado'
  | 'con_bloqueos';
type RevisionAprobacionEstado =
  | 'sin_resultado_guardado'
  | 'pendiente_guardado'
  | 'pendiente_revision'
  | 'actualizado_sin_guardar'
  | 'no_apto'
  | 'listo'
  | 'aprobado'
  | 'aprobado_desactualizado';
type RevisionChecklistEstado = 'Completo' | 'Pendiente' | 'Requiere atencion' | 'No aplica';
type EtapaOperativaActiva = 'base' | 'calculo' | 'resultado' | 'guardado' | 'aprobacion' | 'cierre' | 'liquidaciones';
type PasoPeriodoEstado = 'Actual' | 'Completo' | 'Pendiente' | 'Bloqueada';

interface ValidacionOperativaItemView {
  codigo: string;
  titulo: string;
  descripcion: string;
  severidad: ValidacionOperativaSeveridad;
  accionLabel?: string;
  ruta?: string;
  accionLocal?: ValidacionAccionLocal;
}

interface ValidacionCalculoPreliminarView {
  estado: ValidacionCalculoEstado;
  estadoLabel: string;
  puedeCalcular: boolean;
  razonDeshabilitado?: string;
  siguienteAccion: {
    label: string;
    descripcion: string;
    ruta?: string;
    accionLocal?: ValidacionAccionLocal;
  };
  bloqueos: ValidacionOperativaItemView[];
  advertencias: ValidacionOperativaItemView[];
  informaciones: ValidacionOperativaItemView[];
}

interface ResultadoObservacionView {
  codigo: string;
  titulo: string;
  descripcion: string;
  accionLabel?: string;
  ruta?: string;
}

interface TrabajadorResultadoPreliminarView {
  idPersona: number | string;
  trabajadorLabel: string;
  rutLabel: string;
  estadoLabel: 'Calculado' | 'Con observaciones' | 'Omitido' | 'No calculado';
  haberesLabel: string;
  descuentosLabel: string;
  liquidoLabel: string;
  observacionLabel: string;
  accionLabel?: string;
  ruta?: string;
}

interface ResultadoPreliminarView {
  estado: ResultadoPreliminarEstado;
  estadoLabel: string;
  descripcionEstado: string;
  resumen: {
    trabajadoresCalculados: number;
    trabajadoresConObservaciones: number;
    trabajadoresOmitidos: number;
    totalHaberes: number | null;
    totalDescuentos: number | null;
    totalLiquido: number | null;
    totalCostoEmpresa: number | null;
  };
  trabajadores: TrabajadorResultadoPreliminarView[];
  bloqueos: ResultadoObservacionView[];
  advertencias: ResultadoObservacionView[];
  informaciones: ResultadoObservacionView[];
  detalleTecnico: {
    versionCalculo: string;
    identificadorTecnico: string;
    generadoEn: string;
  };
  ultimoGuardado?: {
    versionLabel: string;
    fechaGuardadoLabel: string;
    versionCalculoLabel: string;
    identificadorTecnicoLabel: string;
    estadoLabel: string;
    trabajadoresCalculados: number;
    trabajadoresConObservaciones: number;
    trabajadoresOmitidos: number;
    totalLiquidoLabel: string;
    advertenciasLabel: string;
  };
  acciones: {
    puedeRecalcular: boolean;
    puedeGuardarPreliminar: boolean;
    razonNoPuedeGuardar?: string;
    helperGuardar: string;
    modoGuardadoLabel: string;
  };
}

interface RevisionAprobacionChecklistItemView {
  titulo: string;
  descripcion: string;
  estado: RevisionChecklistEstado;
}

interface RevisionAprobacionView {
  estado: RevisionAprobacionEstado;
  estadoLabel: string;
  descripcion: string;
  checklist: RevisionAprobacionChecklistItemView[];
  bloqueos: ResultadoObservacionView[];
  advertencias: ResultadoObservacionView[];
  informaciones: ResultadoObservacionView[];
  accionPrincipalLabel: string;
  puedeGuardarActualizado: boolean;
  puedeRecalcular: boolean;
  puedeAprobar: boolean;
  razonNoPuedeAprobar?: string;
  aprobacion: AprobacionOperativaRegistroView | null;
  notaAprobacion: string;
}

interface AprobacionOperativaRegistroView {
  fechaAprobacionLabel: string;
  usuarioLabel: string;
  versionCalculoLabel: string;
  identificadorTecnicoLabel: string;
  identificadorResultado: string | null;
  idCalculoPeriodo: number | null;
  trabajadoresCalculados: number;
  totalHaberesLabel: string;
  totalDescuentosLabel: string;
  totalLiquidoLabel: string;
  advertencias: string[];
}

interface CierreOperativoView {
  estadoLabel: string;
  descripcion: string;
  puedeCerrar: boolean;
  razonNoPuedeCerrar?: string;
  fechaCierreLabel?: string;
  usuarioLabel?: string;
  observacionLabel?: string;
  resumen: {
    periodo: string;
    identificadorTecnicoLabel: string;
    versionCalculoLabel: string;
    trabajadoresCalculados: number;
    totalHaberesLabel: string;
    totalDescuentosLabel: string;
    totalLiquidoLabel: string;
    advertenciasLabel: string;
  } | null;
}

interface SnapshotCompletoTrabajadorView {
  id: number | string;
  trabajadorLabel: string;
  estadoLabel: string;
  haberesLabel: string;
  descuentosLabel: string;
  liquidoLabel: string;
  conceptos: string[];
  observaciones: string[];
}

interface SnapshotCompletoObservacionView {
  codigo: string;
  nivelLabel: 'Bloqueo' | 'Advertencia' | 'Informacion';
  mensaje: string;
  trabajadorLabel: string;
}

interface SnapshotCompletoDetalleView {
  estadoLabel: string;
  descripcion: string;
  resumen: {
    periodo: string;
    fechaGeneracionLabel: string;
    versionCalculoLabel: string;
    identificadorTecnicoLabel: string;
    trabajadores: number;
    totalHaberesLabel: string;
    totalDescuentosLabel: string;
    totalLiquidoLabel: string;
    totalConceptos: number;
    totalObservaciones: number;
    totalTrazas: number;
    aprobacionLabel: string;
  };
  trabajadores: SnapshotCompletoTrabajadorView[];
  observaciones: SnapshotCompletoObservacionView[];
  trazabilidad: string[];
  advertenciaDetalleFaltante: string | null;
  reemplazoLabel: string | null;
}

interface PasoPeriodoView {
  numero: string;
  titulo: string;
  estado: PasoPeriodoEstado;
  descripcion: string;
}

@Component({
  selector: 'app-proceso-mensual-container',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterLink,
    LucideAngularModule,
    CardComponent,
    CardContentComponent,
    BadgeComponent,
    ButtonComponent,
  ],
  templateUrl: './proceso-mensual-container.html',
  styleUrl: './proceso-mensual-container.css',
})
export class ProcesoMensualContainer {
  readonly periodoActivo = inject(PeriodoActivoService);
  readonly procesoMensual = inject(ProcesoMensualService);

  readonly periodoSeleccionado = computed(() => this.periodoActivo.periodoYm());
  readonly resultado = signal<ProcesoMensualPrevalidacion | null>(null);
  readonly preNomina = signal<ProcesoMensualPreNominaPeriodo | null>(null);
  readonly calculo = signal<MotorCalculoPeriodoResultado | null>(null);
  readonly snapshotActivo = signal<NominaCalculoPeriodoSnapshot | null>(null);
  readonly validando = signal(false);
  readonly generandoPreNomina = signal(false);
  readonly calculandoPreliminar = signal(false);
  readonly guardandoSnapshot = signal(false);
  readonly consultandoSnapshot = signal(false);
  readonly consultandoSnapshotCompleto = signal(false);
  readonly errorEjecucion = signal<string | null>(null);
  readonly errorGuardadoResultado = signal<string | null>(null);
  readonly errorAprobacionOperativa = signal<string | null>(null);
  readonly errorCierreOperativo = signal<string | null>(null);
  readonly errorSnapshotCompleto = signal<string | null>(null);
  readonly exitoGuardadoResultado = signal<string | null>(null);
  readonly identificadorResultadoGuardadoActual = signal<string | null>(null);
  readonly aprobacionOperativa = signal<AprobacionOperativaRegistroView | null>(null);
  readonly aprobandoResultado = signal(false);
  readonly cerrandoNomina = signal(false);
  readonly snapshotCompleto = signal<NominaSnapshotCompletoView | null>(null);

  constructor() {
    effect(() => {
      this.periodoSeleccionado();
      untracked(() => {
        this.resetearEstadoPeriodo();
        this.verSnapshotActivo();
      });
    });
  }

  readonly baseNominaTrazabilidad = computed(() => this.preNomina()?.trazabilidad ?? null);

  readonly cierreOperativo = computed<CierreOperativoView>(() => {
    const snapshot = this.snapshotActivo();
    const cierre = snapshot?.cierreOperativo ?? null;
    const resumen = snapshot ? {
      periodo: snapshot.periodo,
      identificadorTecnicoLabel: snapshot.hashSnapshot || 'Referencia interna no disponible',
      versionCalculoLabel: snapshot.versionMotor || 'Version no disponible',
      trabajadoresCalculados: snapshot.totalTrabajadores,
      totalHaberesLabel: this.formatoMonto(snapshot.totalHaberes),
      totalDescuentosLabel: this.formatoMonto(snapshot.totalDescuentos),
      totalLiquidoLabel: this.formatoMonto(snapshot.totalLiquido),
      advertenciasLabel: snapshot.totalAdvertencias > 0
        ? `${snapshot.totalAdvertencias} advertencia(s) visibles quedaran registradas en la trazabilidad interna.`
        : 'Sin advertencias visibles al cierre.',
    } : null;

    if (cierre) {
      return {
        estadoLabel: 'Nomina cerrada operativamente',
        descripcion: 'La nomina del periodo esta cerrada operativamente. Para modificarla se requerira una fase futura de reapertura.',
        puedeCerrar: false,
        razonNoPuedeCerrar: 'La nomina ya esta cerrada operativamente.',
        fechaCierreLabel: this.formatoFechaHora(cierre.fecha),
        usuarioLabel: cierre.usuarioLabel,
        observacionLabel: cierre.observacion ?? undefined,
        resumen,
      };
    }

    const razonNoPuedeCerrar = this.motivoNoPuedeCerrarNomina();
    return {
      estadoLabel: razonNoPuedeCerrar ? 'Cierre no disponible' : 'Disponible para cierre',
      descripcion: 'El cierre operativo congela este resultado para continuar con etapas posteriores. No emite liquidaciones ni genera archivos legales.',
      puedeCerrar: !razonNoPuedeCerrar,
      razonNoPuedeCerrar,
      resumen,
    };
  });

  readonly snapshotCompletoDetalle = computed<SnapshotCompletoDetalleView | null>(() => {
    const completo = this.snapshotCompleto();
    if (!completo) return null;
    const trabajadorPorId = new Map(
      completo.trabajadores.map((t) => [
        t.idCalculoTrabajador,
        `${t.nombreCompletoSnapshot?.trim() || 'Trabajador sin ficha visible'} · ${t.rut?.trim() || 'RUT no disponible'}`,
      ]),
    );
    const trabajadores = completo.trabajadores.slice(0, 8).map<SnapshotCompletoTrabajadorView>((trabajador) => ({
      id: trabajador.idCalculoTrabajador ?? trabajador.idPersona,
      trabajadorLabel: `${trabajador.nombreCompletoSnapshot?.trim() || 'Trabajador sin ficha visible'} · ${trabajador.rut?.trim() || 'RUT no disponible'}`,
      estadoLabel: this.etiquetaEstadoSnapshotTrabajador(trabajador.estado),
      haberesLabel: this.formatoMonto(trabajador.totalHaberesImponibles + trabajador.totalHaberesNoImponibles),
      descuentosLabel: this.formatoMonto(trabajador.totalDescuentosLegales + trabajador.totalDescuentosVoluntarios),
      liquidoLabel: this.formatoMonto(trabajador.liquidoPreliminar),
      conceptos: trabajador.conceptos.slice(0, 4).map((concepto) => this.etiquetaConceptoSnapshot(concepto)),
      observaciones: trabajador.issues.slice(0, 3).map((issue) => issue.mensaje),
    }));
    const observaciones = completo.observaciones.slice(0, 8).map<SnapshotCompletoObservacionView>((obs) => ({
      codigo: String(obs.idIssue ?? obs.codigo),
      nivelLabel: this.etiquetaNivelObservacion(obs.severidad),
      mensaje: obs.mensaje,
      trabajadorLabel: obs.idCalculoTrabajador == null
        ? 'Resultado completo'
        : trabajadorPorId.get(obs.idCalculoTrabajador) ?? 'Trabajador sin ficha visible',
    }));
    return {
      estadoLabel: completo.resumen.esActivoVigente
        ? 'Resultado guardado vigente'
        : 'Resultado reemplazado',
      descripcion: completo.aprobacionOperativa
        ? 'Resultado guardado aprobado operativamente.'
        : 'Resultado guardado pendiente de aprobacion operativa.',
      resumen: {
        periodo: completo.cabecera.periodo,
        fechaGeneracionLabel: this.formatoFechaHora(completo.cabecera.fechaGeneracion),
        versionCalculoLabel: completo.cabecera.versionMotor || 'Version no disponible',
        identificadorTecnicoLabel: completo.cabecera.hashSnapshot || 'Referencia interna no disponible',
        trabajadores: completo.trabajadores.length,
        totalHaberesLabel: this.formatoMonto(completo.cabecera.totalHaberes),
        totalDescuentosLabel: this.formatoMonto(completo.cabecera.totalDescuentos),
        totalLiquidoLabel: this.formatoMonto(completo.cabecera.totalLiquido),
        totalConceptos: completo.resumen.totalConceptos,
        totalObservaciones: completo.resumen.totalObservaciones,
        totalTrazas: completo.resumen.totalTrazas,
        aprobacionLabel: completo.aprobacionOperativa ? 'Aprobado operativamente' : 'Pendiente de aprobacion',
      },
      trabajadores,
      observaciones,
      trazabilidad: completo.trazabilidad.slice(0, 5).map((traza) =>
        `${traza.codigo}: ${traza.observacion || traza.formula || traza.origen}`,
      ),
      advertenciaDetalleFaltante: completo.trabajadores.length === 0
        ? 'El resultado guardado tiene cabecera, pero no se encontraron detalles asociados.'
        : null,
      reemplazoLabel: completo.resumen.fueReemplazado
        ? 'Este resultado fue reemplazado por un resultado posterior.'
        : null,
    };
  });

  readonly resultadoPreliminar = computed<ResultadoPreliminarView>(() => {
    const calculo = this.calculo();
    const base = this.baseNominaTrazabilidad();
    const snapshot = this.snapshotActivo();

    if (!calculo) {
      const guardado = snapshot != null;
      const estado: ResultadoPreliminarEstado = this.errorGuardadoResultado()
        ? 'error_guardado'
        : guardado
          ? 'guardado'
          : 'sin_resultado';
      return {
        estado,
        estadoLabel: this.etiquetaResultadoPreliminar(estado),
        descripcionEstado: this.descripcionEstadoGuardado(estado),
        resumen: {
          trabajadoresCalculados: snapshot?.totalTrabajadores ?? 0,
          trabajadoresConObservaciones: snapshot?.totalAdvertencias ?? 0,
          trabajadoresOmitidos: snapshot?.totalBloqueados ?? 0,
          totalHaberes: snapshot?.totalHaberes ?? null,
          totalDescuentos: snapshot?.totalDescuentos ?? null,
          totalLiquido: snapshot?.totalLiquido ?? null,
          totalCostoEmpresa: null,
        },
        trabajadores: [],
        bloqueos: [],
        advertencias: [],
        informaciones: guardado
          ? [{
              codigo: 'RESULTADO_GUARDADO',
              titulo: 'Resultado preliminar guardado',
              descripcion: 'Existe un resultado preliminar activo para revisar.',
            }]
          : [],
        detalleTecnico: {
          versionCalculo: snapshot?.versionMotor ?? 'Version no disponible',
          identificadorTecnico: snapshot?.hashSnapshot ?? 'Referencia interna no disponible',
          generadoEn: snapshot?.fechaGeneracion ?? 'Fecha no disponible',
        },
        ultimoGuardado: snapshot ? this.ultimoGuardadoDesdeSnapshot(snapshot) : undefined,
        acciones: {
          puedeRecalcular: this.validacionCalculo().puedeCalcular,
          puedeGuardarPreliminar: false,
          razonNoPuedeGuardar: guardado
            ? 'No hay cambios para guardar. El resultado preliminar actual ya esta guardado.'
            : 'Primero calcula preliminarmente la nomina.',
          helperGuardar: 'Guarda una version revisable del calculo. No emite liquidaciones ni cierra el periodo.',
          modoGuardadoLabel: 'Al guardar, se reemplazara el resultado preliminar activo del periodo.',
        },
      };
    }

    const bloqueos = this.observacionesResultado(calculo, 'BLOQUEO');
    const advertencias = this.observacionesResultado(calculo, 'ADVERTENCIA');
    const trabajadoresCalculadosIds = new Set(calculo.liquidaciones.map((liq) => liq.idPersona));
    const omitidosBase = (base?.trabajadores ?? [])
      .filter((trabajador) => !trabajadoresCalculadosIds.has(trabajador.idPersona) || trabajador.estado === 'bloqueado' || trabajador.estado === 'excluido')
      .map<TrabajadorResultadoPreliminarView>((trabajador) => ({
        idPersona: `omitido-${trabajador.idPersona}`,
        trabajadorLabel: trabajador.trabajadorLabel || 'Trabajador sin ficha visible',
        rutLabel: trabajador.rutLabel || 'RUT no disponible',
        estadoLabel: 'Omitido',
        haberesLabel: 'Monto no disponible',
        descuentosLabel: 'Monto no disponible',
        liquidoLabel: 'Monto no disponible',
        observacionLabel: trabajador.observacion || 'No calculado en el resultado preliminar.',
        accionLabel: 'Revisar base de nomina',
      }));
    const trabajadores = [
      ...calculo.liquidaciones.map<TrabajadorResultadoPreliminarView>((liq) => {
        const estadoLabel = this.estadoResultadoTrabajador(liq.estado);
        return {
          idPersona: liq.idPersona,
          trabajadorLabel: liq.nombreCompleto?.trim() || 'Trabajador sin ficha visible',
          rutLabel: liq.rut?.trim() || 'RUT no disponible',
          estadoLabel,
          haberesLabel: this.formatoMonto(liq.totalHaberes),
          descuentosLabel: this.formatoMonto(liq.totalDescuentos),
          liquidoLabel: this.formatoMonto(liq.liquidoAPago),
          observacionLabel: liq.issues.length ? liq.issues.map((issue) => issue.mensaje).join('; ') : 'Sin observaciones',
          ...this.accionResultadoDesdeIssues(liq.issues),
        };
      }),
      ...omitidosBase,
    ];
    for (const omitido of omitidosBase) {
      bloqueos.push({
        codigo: String(omitido.idPersona),
        titulo: 'Trabajador omitido del calculo',
        descripcion: omitido.observacionLabel,
        accionLabel: 'Revisar base de nomina',
      });
    }

    const trabajadoresConObservaciones = trabajadores.filter((t) => t.estadoLabel === 'Con observaciones').length;
    const trabajadoresOmitidos = trabajadores.filter((t) => t.estadoLabel === 'Omitido' || t.estadoLabel === 'No calculado').length;
    const estado: ResultadoPreliminarEstado = this.resolverEstadoGuardadoResultado(calculo, bloqueos);
    const puedeGuardarPreliminar = this.puedeGuardarSnapshot();

    return {
      estado,
      estadoLabel: this.etiquetaResultadoPreliminar(estado),
      descripcionEstado: this.descripcionEstadoGuardado(estado),
      resumen: {
        trabajadoresCalculados: calculo.resumen.totalTrabajadoresCalculados,
        trabajadoresConObservaciones,
        trabajadoresOmitidos,
        totalHaberes: calculo.resumen.totalHaberes,
        totalDescuentos: calculo.resumen.totalDescuentos,
        totalLiquido: calculo.resumen.totalLiquidoPreliminar,
        totalCostoEmpresa: null,
      },
      trabajadores,
      bloqueos,
      advertencias,
      informaciones: [{
        codigo: 'RESULTADO_GENERADO',
        titulo: 'Resultado preliminar generado',
        descripcion: 'Revisa trabajadores, observaciones y totales antes de guardar.',
      }],
      detalleTecnico: {
        versionCalculo: snapshot?.versionMotor ?? 'Version no disponible',
        identificadorTecnico: snapshot?.hashSnapshot ?? 'Referencia interna no disponible',
        generadoEn: calculo.generadoEn,
      },
      ultimoGuardado: snapshot ? this.ultimoGuardadoDesdeSnapshot(snapshot) : undefined,
      acciones: {
        puedeRecalcular: this.validacionCalculo().puedeCalcular,
        puedeGuardarPreliminar,
        razonNoPuedeGuardar: puedeGuardarPreliminar
          ? undefined
          : this.razonNoPuedeGuardarResultado(bloqueos),
        helperGuardar: 'Guarda una version revisable del calculo. No emite liquidaciones ni cierra el periodo.',
        modoGuardadoLabel: 'Al guardar, se reemplazara el resultado preliminar activo del periodo.',
      },
    };
  });

  readonly revisionAprobacion = computed<RevisionAprobacionView>(() => {
    const resultado = this.resultadoPreliminar();
    const validacion = this.validacionCalculo();
    const guardado = resultado.ultimoGuardado;
    const hayResultadoActual = this.calculo() != null;
    const hayGuardado = guardado != null;
    const actualizadoSinGuardar = resultado.estado === 'actualizado_sin_guardar';
    const bloqueos = [
      ...resultado.bloqueos,
      ...validacion.bloqueos.map((item) => this.observacionDesdeValidacion(item)),
    ];
    const advertencias = [
      ...resultado.advertencias,
      ...validacion.advertencias.map((item) => this.observacionDesdeValidacion(item)),
    ];
    const informaciones: ResultadoObservacionView[] = [
      ...resultado.informaciones,
      ...validacion.informaciones.map((item) => this.observacionDesdeValidacion(item)),
    ];

    let estado: RevisionAprobacionEstado;
    if ((hayResultadoActual || hayGuardado) && (bloqueos.length > 0 || (guardado?.trabajadoresOmitidos ?? 0) > 0)) {
      estado = 'no_apto';
    } else if (!hayGuardado) {
      estado = hayResultadoActual ? 'pendiente_guardado' : 'sin_resultado_guardado';
    } else if (actualizadoSinGuardar) {
      estado = 'actualizado_sin_guardar';
    } else if (advertencias.length > 0 || (guardado?.trabajadoresConObservaciones ?? 0) > 0) {
      estado = 'pendiente_revision';
    } else {
      estado = 'listo';
    }

    const aprobacion = this.aprobacionOperativa();
    const aprobacionVigente =
      !!aprobacion &&
      hayGuardado &&
      !actualizadoSinGuardar &&
      aprobacion.identificadorResultado === (this.snapshotActivo()?.hashSnapshot ?? null);
    if (aprobacion) {
      estado = aprobacionVigente ? 'aprobado' : 'aprobado_desactualizado';
    }

    const puedeAprobar =
      hayGuardado &&
      !actualizadoSinGuardar &&
      bloqueos.length === 0 &&
      (guardado?.trabajadoresOmitidos ?? 0) === 0 &&
      validarPeriodoEntradaMensual(this.periodoSeleccionado()) &&
      !this.guardandoSnapshot() &&
      !this.aprobandoResultado() &&
      !this.nominaEstaCerradaOperativamente();

    return {
      estado,
      estadoLabel: this.etiquetaRevisionAprobacion(estado),
      descripcion: this.descripcionRevisionAprobacion(estado),
      checklist: this.checklistRevisionAprobacion({
        hayGuardado,
        guardado,
        actualizadoSinGuardar,
        hayResultadoActual,
        bloqueos,
        advertencias,
      }),
      bloqueos,
      advertencias,
      informaciones,
      accionPrincipalLabel: actualizadoSinGuardar || estado === 'pendiente_guardado'
        ? 'Guardar resultado actualizado'
        : hayGuardado
          ? 'Revisar resultado guardado'
          : 'Calcular preliminar',
      puedeGuardarActualizado: resultado.acciones.puedeGuardarPreliminar,
      puedeRecalcular: resultado.acciones.puedeRecalcular,
      puedeAprobar: puedeAprobar && !aprobacionVigente,
      razonNoPuedeAprobar: this.razonNoPuedeAprobar({
        hayResultadoActual,
        hayGuardado,
        actualizadoSinGuardar,
        bloqueos,
        omitidos: guardado?.trabajadoresOmitidos ?? 0,
        aprobacionVigente,
      }),
      aprobacion,
      notaAprobacion: 'Esta aprobacion es interna y no reemplaza el cierre del periodo ni la emision de liquidaciones oficiales.',
    };
  });

  readonly validacionCalculo = computed<ValidacionCalculoPreliminarView>(() => {
    const periodo = this.periodoSeleccionado();
    const resultado = this.resultado();
    const preNomina = this.preNomina();
    const base = this.baseNominaTrazabilidad();
    const bloqueos: ValidacionOperativaItemView[] = [];
    const advertencias: ValidacionOperativaItemView[] = [];
    const informaciones: ValidacionOperativaItemView[] = [];

    if (!validarPeriodoEntradaMensual(periodo)) {
      bloqueos.push({
        codigo: 'BLOQ-001',
        titulo: 'Periodo invalido',
        descripcion: 'Selecciona un periodo valido antes de preparar la nomina.',
        severidad: 'bloqueo',
        accionLabel: 'Seleccionar periodo valido',
      });
    }

    if (this.nominaEstaCerradaOperativamente()) {
      bloqueos.push({
        codigo: 'BLOQ-CIERRE-OPERATIVO',
        titulo: 'Nomina cerrada operativamente',
        descripcion: 'La nomina del periodo esta cerrada operativamente. Para modificarla se requerira una fase futura de reapertura.',
        severidad: 'bloqueo',
        accionLabel: 'Consultar resultado guardado',
      });
    }

    if (this.errorEjecucion()) {
      bloqueos.push({
        codigo: 'BLOQ-002',
        titulo: 'No fue posible cargar la informacion',
        descripcion: this.errorEjecucion() ?? 'Reintenta la validacion del periodo.',
        severidad: 'bloqueo',
        accionLabel: 'Validar periodo',
        accionLocal: 'validarPeriodo',
      });
    }

    if (!resultado) {
      return this.buildValidacionCalculo({
        bloqueos,
        advertencias,
        informaciones,
        estadoForzado: bloqueos.length ? 'bloqueado' : 'pendiente',
        razonDeshabilitado: bloqueos.length
          ? bloqueos[0].descripcion
          : 'Valida el periodo para revisar la base antes de calcular.',
        siguienteAccion: bloqueos.length
          ? {
              label: bloqueos[0].accionLabel ?? 'Validar periodo',
              descripcion: bloqueos[0].descripcion,
              accionLocal: bloqueos[0].accionLocal,
            }
          : {
              label: 'Validar periodo',
              descripcion: 'Revisa trabajadores, parametros, asignaciones recurrentes y movimientos del mes.',
              accionLocal: 'validarPeriodo',
            },
      });
    }

    for (const bloqueo of resultado.bloqueos) {
      bloqueos.push(this.itemDesdeMensaje(bloqueo, 'bloqueo'));
    }

    const faltantesMinimos = resultado.resumen.parametrosGrupos.filter((g) => this.parametroMinimoBloqueante(g.id, g.clasificacion));
    if (faltantesMinimos.length > 0 && !bloqueos.some((b) => b.codigo === 'BLOQ-004')) {
      bloqueos.push({
        codigo: 'BLOQ-004',
        titulo: 'Faltan parametros minimos para calcular',
        descripcion: 'Revisa los parametros obligatorios del periodo antes de calcular preliminarmente.',
        severidad: 'bloqueo',
        accionLabel: 'Revisar parametros',
        ruta: '/parametros',
      });
    }

    if (!preNomina) {
      bloqueos.push({
        codigo: 'BLOQ-005',
        titulo: 'Base de nomina no generada',
        descripcion: 'Genera la base de nomina para revisar trabajadores y entradas consideradas.',
        severidad: 'bloqueo',
        accionLabel: 'Generar base de nomina',
        accionLocal: 'generarBase',
      });
    } else if ((base?.trabajadoresConsiderados ?? preNomina.trabajadoresIncluidos) === 0) {
      bloqueos.push({
        codigo: 'BLOQ-003',
        titulo: 'No hay trabajadores considerados',
        descripcion: 'La base de nomina no tiene trabajadores para calcular.',
        severidad: 'bloqueo',
        accionLabel: 'Actualizar base de nomina',
        accionLocal: 'actualizarBase',
      });
    }

    if (base?.bloqueados && base.bloqueados > 0) {
      bloqueos.push({
        codigo: 'BLOQ-006',
        titulo: 'Hay trabajadores bloqueados',
        descripcion: 'Revisa los trabajadores bloqueados en la base antes de calcular.',
        severidad: 'bloqueo',
        accionLabel: 'Revisar base de nomina',
      });
    }

    for (const advertencia of resultado.advertencias) {
      if (!this.parametroMinimoBloqueanteDesdeCodigo(advertencia.codigo)) {
        advertencias.push(this.itemDesdeMensaje(advertencia, 'advertencia'));
      }
    }

    const resumenEntradas = resultado.resumen.resumenEntradasMensuales;
    const totalMovimientosMes =
      (resumenEntradas?.novedadesMensuales ?? 0) + (resumenEntradas?.legacyMovimientos ?? 0);
    if (totalMovimientosMes === 0) {
      advertencias.push({
        codigo: 'ADV-001',
        titulo: 'No hay movimientos del mes registrados',
        descripcion: 'Puedes continuar si este periodo no requiere movimientos puntuales.',
        severidad: 'advertencia',
        accionLabel: 'Revisar movimientos del mes',
        ruta: '/remuneraciones/novedades-mensuales',
      });
    }

    if (resultado.resumen.recurrentesAplicablesAlPeriodo === 0) {
      advertencias.push({
        codigo: 'ADV-002',
        titulo: 'No hay asignaciones recurrentes activas',
        descripcion: 'Puedes continuar si no aplican asignaciones recurrentes para este periodo.',
        severidad: 'advertencia',
        accionLabel: 'Revisar asignaciones recurrentes',
        ruta: '/remuneraciones/haberes-descuentos',
      });
    }

    if (base?.conObservaciones && base.conObservaciones > 0) {
      advertencias.push({
        codigo: 'ADV-003',
        titulo: 'Hay trabajadores con observaciones',
        descripcion: 'Las observaciones no bloqueantes deben revisarse antes de guardar un resultado.',
        severidad: 'advertencia',
        accionLabel: 'Revisar base de nomina',
      });
    }

    const parametrosOpcionales = resultado.resumen.parametrosGrupos.filter((g) => this.parametroOpcionalAdvertencia(g.id, g.clasificacion));
    if (parametrosOpcionales.length > 0) {
      advertencias.push({
        codigo: 'ADV-004',
        titulo: 'Hay parametros opcionales pendientes',
        descripcion: 'Puedes calcular preliminarmente; estos datos quedan para cierre o reconciliacion.',
        severidad: 'advertencia',
        accionLabel: 'Revisar parametros',
        ruta: '/parametros',
      });
    }

    if (preNomina) {
      informaciones.push({
        codigo: 'INFO-001',
        titulo: 'Base de nomina generada',
        descripcion: 'La base esta disponible para revisar antes del calculo preliminar.',
        severidad: 'info',
      });
    }
    if (resultado.resumen.parametrosOperativos && faltantesMinimos.length === 0) {
      informaciones.push({
        codigo: 'INFO-002',
        titulo: 'Parametros minimos disponibles',
        descripcion: 'Los parametros necesarios para el calculo preliminar estan disponibles.',
        severidad: 'info',
      });
    }
    if (totalMovimientosMes > 0) {
      informaciones.push({
        codigo: 'INFO-003',
        titulo: 'Movimientos del mes cargados',
        descripcion: 'Hay movimientos del mes disponibles para la revision del periodo.',
        severidad: 'info',
      });
    }
    if (resultado.resumen.recurrentesAplicablesAlPeriodo > 0) {
      informaciones.push({
        codigo: 'INFO-004',
        titulo: 'Asignaciones recurrentes cargadas',
        descripcion: 'Hay asignaciones recurrentes vigentes consideradas para el periodo.',
        severidad: 'info',
      });
    }

    return this.buildValidacionCalculo({ bloqueos, advertencias, informaciones });
  });

  readonly dashboardResumen = computed(() => {
    const resultado = this.resultado();
    const preNomina = this.preNomina();
    const calculo = this.calculo();
    const snapshot = this.snapshotActivo();
    const resumen = resultado?.resumen;
    const conteoEstados = resumen?.conteoEntradasPorEstado ?? {};
    const movimientosAprobados =
      (conteoEstados['aprobada'] ?? 0) +
      (conteoEstados['incorporada_a_pre_nomina'] ?? 0) +
      (conteoEstados['calculada'] ?? 0) +
      (resumen?.conteoMovimientosPorEstado['VALIDADO'] ?? 0);
    const movimientosPendientes =
      (conteoEstados['borrador'] ?? 0) +
      (conteoEstados['pendiente_revision'] ?? 0) +
      (resumen?.conteoMovimientosPorEstado['BORRADOR'] ?? 0);

    return {
      estadoPeriodo: resultado?.estado ?? null,
      trabajadoresAptos: resumen?.trabajadoresActivosAptos ?? null,
      trabajadoresPorRevisar: resumen?.trabajadoresActivosNoAptos ?? null,
      parametrosListos: resumen?.parametrosOperativos ?? null,
      movimientosAprobados,
      movimientosPendientes,
      asignacionesAplicables: resumen?.recurrentesAplicablesAlPeriodo ?? null,
      asignacionesPorRevisar: resumen ? resumen.recurrentesInvalidas + resumen.recurrentesFueraDelMes : null,
      resultadoPreliminar: snapshot
        ? 'Guardado para revision'
        : calculo
          ? 'Calculado preliminar'
          : preNomina
            ? 'Base generada'
            : 'Sin calculo',
    };
  });

  readonly estadoOperativo = computed(() => {
    const validacion = this.validacionCalculo();
    const resultado = this.resultadoPreliminar();
    const revision = this.revisionAprobacion();
    return resolverEstadoOperativoProcesoMensual({
      periodoValido: validarPeriodoEntradaMensual(this.periodoSeleccionado()),
      tienePrevalidacion: this.resultado() != null,
      bloqueosPrevalidacion: validacion.bloqueos.map((item) => this.pendienteDesdeValidacion(item)),
      advertenciasPrevalidacion: validacion.advertencias.map((item) => this.pendienteDesdeValidacion(item, 'warning')),
      informacionesPrevalidacion: validacion.informaciones.map((item) => this.pendienteDesdeValidacion(item, 'info')),
      baseGenerada: this.preNomina() != null,
      calculoGenerado: this.calculo() != null,
      calculoConBloqueos: resultado.bloqueos.length > 0 || this.calculo()?.estado === 'con_bloqueos',
      calculoConAdvertencias: resultado.advertencias.length > 0,
      bloqueosCalculo: resultado.bloqueos.map((item) => this.pendienteDesdeResultado(item, 'danger')),
      advertenciasCalculo: resultado.advertencias.map((item) => this.pendienteDesdeResultado(item, 'warning')),
      resultadoGuardado: this.snapshotActivo() != null,
      aprobadoOperativamente: this.aprobacionOperativa() != null,
      cerradoOperativamente: this.nominaEstaCerradaOperativamente(),
      liquidacionesDisponibles: false,
      puedeGenerarBase: this.puedeGenerarPreNomina(),
      puedeCalcular: this.puedeCalcularPreliminar(),
      puedeGuardarResultado: resultado.acciones.puedeGuardarPreliminar,
      puedeAprobar: revision.puedeAprobar,
      puedeCerrar: this.puedeCerrarNominaOperativa(),
      razonNoPuedeGuardar: resultado.acciones.razonNoPuedeGuardar,
      razonNoPuedeAprobar: revision.razonNoPuedeAprobar,
      razonNoPuedeCerrar: this.cierreOperativo().razonNoPuedeCerrar,
    });
  });

  readonly etapaOperativaActiva = computed<EtapaOperativaActiva>(() => {
    return this.estadoOperativo().disclosureActivo;
  });

  mostrarDetalleOperativo(etapa: EtapaOperativaActiva): boolean {
    const estado = this.estadoOperativo().estadoClave;
    const orden: Record<EtapaOperativaActiva, number> = {
      base: 1,
      calculo: 2,
      resultado: 2,
      guardado: 3,
      aprobacion: 4,
      cierre: 5,
      liquidaciones: 6,
    };
    const etapaPorEstado: Record<string, number> = {
      pendiente_validacion: 0,
      periodo_con_pendientes: 1,
      listo_para_generar_base: 1,
      base_lista: 2,
      resultado_con_bloqueos: 2,
      resultado_preliminar_revisable: 2,
      resultado_listo_para_guardar: 2,
      resultado_guardado: 4,
      aprobado_operativamente: 5,
      nomina_cerrada: 6,
      liquidaciones_disponibles: 6,
    };
    const maxEtapa = etapaPorEstado[estado] ?? 0;
    return orden[etapa] <= maxEtapa && maxEtapa > 0;
  }

  readonly pasosPeriodo = computed<PasoPeriodoView[]>(() => {
    return this.estadoOperativo().timeline;
  });

  readonly siguienteAccion = computed(() => {
    const accion = this.validacionCalculo().siguienteAccion;
    const calculo = this.calculo();
    const snapshot = this.snapshotActivo();

    if (!calculo) {
      return `${accion.label}: ${accion.descripcion}`;
    }
    if (!snapshot) {
      return 'Guarda el resultado preliminar para revision.';
    }
    return 'Resultado preliminar disponible para revision.';
  });

  validarPeriodo(): void {
    const p = this.periodoSeleccionado();
    this.validando.set(true);
    this.errorEjecucion.set(null);
    void this.procesoMensual
      .ejecutarPrevalidaciones(p)
      .then((r) => {
        this.resultado.set(r);
        this.preNomina.set(null);
        this.calculo.set(null);
        this.snapshotActivo.set(null);
        this.errorGuardadoResultado.set(null);
        this.errorAprobacionOperativa.set(null);
        this.errorCierreOperativo.set(null);
        this.exitoGuardadoResultado.set(null);
        this.identificadorResultadoGuardadoActual.set(null);
        this.aprobacionOperativa.set(null);
        this.snapshotCompleto.set(null);
        this.errorSnapshotCompleto.set(null);
        return this.cargarSnapshotActivo(p);
      })
      .catch((e: unknown) => {
        this.resultado.set(null);
        this.errorEjecucion.set(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        this.validando.set(false);
      });
  }

  generarPreNomina(): void {
    const p = this.periodoSeleccionado();
    this.generandoPreNomina.set(true);
    this.errorEjecucion.set(null);
    void this.procesoMensual
      .generarPreNominaPeriodo(p)
      .then((r) => {
        this.preNomina.set(r);
        this.calculo.set(null);
        this.snapshotActivo.set(null);
        this.errorGuardadoResultado.set(null);
        this.errorAprobacionOperativa.set(null);
        this.errorCierreOperativo.set(null);
        this.exitoGuardadoResultado.set(null);
        this.identificadorResultadoGuardadoActual.set(null);
        this.aprobacionOperativa.set(null);
        this.snapshotCompleto.set(null);
        this.errorSnapshotCompleto.set(null);
      })
      .catch((e: unknown) => {
        this.preNomina.set(null);
        this.errorEjecucion.set(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        this.generandoPreNomina.set(false);
      });
  }

  calcularPreliminar(): void {
    if (!this.puedeCalcularPreliminar()) return;
    const p = this.periodoSeleccionado();
    this.calculandoPreliminar.set(true);
    this.errorEjecucion.set(null);
    void this.procesoMensual
      .generarCalculoPeriodo(p)
      .then((r) => {
        this.calculo.set(r);
        this.errorGuardadoResultado.set(null);
        this.errorAprobacionOperativa.set(null);
        this.exitoGuardadoResultado.set(null);
        this.identificadorResultadoGuardadoActual.set(null);
        this.snapshotCompleto.set(null);
        this.errorSnapshotCompleto.set(null);
      })
      .catch((e: unknown) => {
        this.calculo.set(null);
        this.errorEjecucion.set(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        this.calculandoPreliminar.set(false);
      });
  }

  guardarSnapshotPreliminar(): void {
    if (!this.confirmarGuardarPreliminar()) return;
    const p = this.periodoSeleccionado();
    this.guardandoSnapshot.set(true);
    this.errorEjecucion.set(null);
    this.errorGuardadoResultado.set(null);
    this.errorCierreOperativo.set(null);
    this.exitoGuardadoResultado.set(null);
    void this.procesoMensual
      .guardarSnapshotPreliminar(p)
      .then((r) => {
        if (!r.ok || !r.snapshot) {
          const msg = r.issues.map((i) => i.mensaje).join(' ') || 'No se pudo guardar el resultado preliminar.';
          throw new Error(msg);
        }
        this.aplicarSnapshotActivo(r.snapshot);
        this.identificadorResultadoGuardadoActual.set(r.snapshot.hashSnapshot ?? null);
        this.errorAprobacionOperativa.set(null);
        this.errorCierreOperativo.set(null);
        void this.cargarSnapshotCompletoActivo(p);
        this.exitoGuardadoResultado.set('Resultado preliminar guardado correctamente. Revisa y aprueba operativamente este nuevo resultado si corresponde.');
      })
      .catch((e: unknown) => {
        this.errorGuardadoResultado.set(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        this.guardandoSnapshot.set(false);
      });
  }

  verSnapshotActivo(): void {
    const p = this.periodoSeleccionado();
    this.consultandoSnapshot.set(true);
    this.errorEjecucion.set(null);
    void this.procesoMensual
      .obtenerSnapshotActivo(p)
      .then((snapshot) => {
        if (this.periodoSeleccionado() !== p) {
          return null;
        }
        this.aplicarSnapshotActivo(snapshot);
        this.errorGuardadoResultado.set(null);
        this.errorAprobacionOperativa.set(null);
        this.errorCierreOperativo.set(null);
        this.exitoGuardadoResultado.set(null);
        return this.cargarSnapshotCompletoActivo(p);
      })
      .catch((e: unknown) => {
        if (this.periodoSeleccionado() !== p) {
          return;
        }
        this.errorEjecucion.set(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        this.consultandoSnapshot.set(false);
      });
  }

  consultarDetalleResultadoGuardado(): void {
    void this.cargarSnapshotCompletoActivo(this.periodoSeleccionado());
  }

  private resetearEstadoPeriodo(): void {
    this.resultado.set(null);
    this.preNomina.set(null);
    this.calculo.set(null);
    this.snapshotActivo.set(null);
    this.snapshotCompleto.set(null);
    this.errorEjecucion.set(null);
    this.errorGuardadoResultado.set(null);
    this.errorAprobacionOperativa.set(null);
    this.errorCierreOperativo.set(null);
    this.errorSnapshotCompleto.set(null);
    this.exitoGuardadoResultado.set(null);
    this.identificadorResultadoGuardadoActual.set(null);
    this.aprobacionOperativa.set(null);
  }

  recalcularYReemplazarSnapshot(): void {
    const p = this.periodoSeleccionado();
    this.guardandoSnapshot.set(true);
    this.errorEjecucion.set(null);
    this.errorGuardadoResultado.set(null);
    this.exitoGuardadoResultado.set(null);
    void this.procesoMensual
      .reemplazarSnapshotPreliminar(p)
      .then((r) => {
        if (!r.ok || !r.snapshot) {
          const msg = r.issues.map((i) => i.mensaje).join(' ') || 'No se pudo reemplazar el resultado preliminar.';
          throw new Error(msg);
        }
        this.aplicarSnapshotActivo(r.snapshot);
        this.calculo.set(this.procesoMensual.obtenerResultadoCalculoPeriodo(p));
        this.identificadorResultadoGuardadoActual.set(r.snapshot.hashSnapshot ?? null);
        this.errorAprobacionOperativa.set(null);
        void this.cargarSnapshotCompletoActivo(p);
        this.exitoGuardadoResultado.set('Resultado preliminar guardado correctamente. Revisa y aprueba operativamente este nuevo resultado si corresponde.');
      })
      .catch((e: unknown) => {
        this.errorGuardadoResultado.set(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        this.guardandoSnapshot.set(false);
      });
  }

  etiquetaEstadoGlobal(estado: ProcesoMensualEstado | null): string {
    switch (estado) {
      case 'LISTO_PARA_CALCULO':
        return 'Listo para calcular';
      case 'CON_ADVERTENCIAS':
        return 'Con advertencias';
      case 'BLOQUEADO':
        return 'Bloqueado';
      case 'SIN_EVALUAR':
      default:
        return 'Sin evaluar';
    }
  }

  badgeVariantEstado(estado: ProcesoMensualEstado | null): 'success' | 'warning' | 'error' | 'default' {
    switch (estado) {
      case 'LISTO_PARA_CALCULO':
        return 'success';
      case 'CON_ADVERTENCIAS':
        return 'warning';
      case 'BLOQUEADO':
        return 'error';
      default:
        return 'default';
    }
  }

  etiquetaEstadoPreNomina(estado: ProcesoMensualPreNominaEstado | null): string {
    switch (estado) {
      case 'GENERADA':
        return 'Base de nomina generada';
      case 'GENERADA_CON_ADVERTENCIAS':
        return 'Base generada con advertencias';
      case 'NO_GENERABLE':
        return 'Base no generable';
      default:
        return 'Sin generar';
    }
  }

  badgeVariantPreNomina(estado: ProcesoMensualPreNominaEstado | null): 'success' | 'warning' | 'error' | 'default' {
    switch (estado) {
      case 'GENERADA':
        return 'success';
      case 'GENERADA_CON_ADVERTENCIAS':
        return 'warning';
      case 'NO_GENERABLE':
        return 'error';
      default:
        return 'default';
    }
  }

  puedeGenerarPreNomina(): boolean {
    const r = this.resultado();
    return !!r && r.estado !== 'BLOQUEADO' && !this.nominaEstaCerradaOperativamente() && !this.validando() && !this.generandoPreNomina();
  }

  puedeCalcularPreliminar(): boolean {
    return this.validacionCalculo().puedeCalcular && !this.nominaEstaCerradaOperativamente() && !this.validando() && !this.generandoPreNomina() && !this.calculandoPreliminar();
  }

  aprobarResultadoPreliminar(): void {
    const revision = this.revisionAprobacion();
    const snapshot = this.snapshotActivo();
    if (!revision.puedeAprobar || !snapshot) return;
    const advertenciasAprobacion = revision.advertencias.map((advertencia) => advertencia.descripcion);
    if (advertenciasAprobacion.length === 0 && snapshot.totalAdvertencias > 0) {
      advertenciasAprobacion.push(`Resultado guardado con ${snapshot.totalAdvertencias} advertencia(s) no bloqueante(s).`);
    }
    if (!this.confirmarAprobacionOperativa(advertenciasAprobacion.length > 0)) return;

    this.aprobandoResultado.set(true);
    this.errorAprobacionOperativa.set(null);
    void this.procesoMensual
      .aprobarResultadoPreliminarOperativamente({
        idCalculoPeriodo: snapshot.idCalculoPeriodo!,
        periodo: this.periodoSeleccionado(),
        advertencias: advertenciasAprobacion,
      })
      .then((persistido) => {
        this.aplicarSnapshotActivo(persistido);
      })
      .catch(() => {
        this.errorAprobacionOperativa.set('No se pudo registrar la aprobacion operativa. Intenta nuevamente o revisa la conexion.');
      })
      .finally(() => {
        this.aprobandoResultado.set(false);
      });
  }

  revisarBaseNomina(): void {
    document.querySelector('#base-nomina')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  revisarBloqueosOperativos(): void {
    document.querySelector('#pm-que-falta-ahora')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  puedeGuardarSnapshot(): boolean {
    const calc = this.calculo();
    if (!validarPeriodoEntradaMensual(this.periodoSeleccionado())) return false;
    if (this.nominaEstaCerradaOperativamente()) return false;
    if (!calc || this.errorEjecucion()) return false;
    if (this.guardandoSnapshot()) return false;
    if (calc.estado === 'con_bloqueos' || calc.issues.some((i) => i.severidad === 'BLOQUEO')) return false;
    const snapshot = this.snapshotActivo();
    return !snapshot || this.identificadorResultadoGuardadoActual() !== snapshot.hashSnapshot;
  }

  nominaEstaCerradaOperativamente(): boolean {
    return this.snapshotActivo()?.cierreOperativo?.estado === 'cerrado_operativamente';
  }

  puedeCerrarNominaOperativa(): boolean {
    return !this.motivoNoPuedeCerrarNomina();
  }

  motivoNoPuedeCerrarNomina(): string | undefined {
    const snapshot = this.snapshotActivo();
    if (!validarPeriodoEntradaMensual(this.periodoSeleccionado())) return 'El periodo seleccionado no es valido.';
    if (!snapshot?.idCalculoPeriodo) return 'Primero debe existir un resultado preliminar guardado vigente.';
    if (snapshot.cierreOperativo?.estado === 'cerrado_operativamente') return 'La nomina ya esta cerrada operativamente.';
    if (snapshot.aprobacionOperativa?.estado !== 'aprobado_operativamente') return 'El resultado debe estar aprobado operativamente antes de cerrar.';
    if (this.resultadoPreliminar().estado === 'actualizado_sin_guardar') return 'Hay un resultado actualizado sin guardar.';
    if (snapshot.totalBloqueados > 0) return 'Existen bloqueos operativos pendientes en el resultado guardado.';
    if (this.guardandoSnapshot() || this.aprobandoResultado() || this.cerrandoNomina()) return 'Hay una operacion en curso.';
    return undefined;
  }

  confirmarCierreNominaOperativa(): boolean {
    const periodo = this.periodoSeleccionado();
    const mensaje = [
      `Vas a cerrar operativamente la nomina de ${periodo}.`,
      '',
      'Esta accion congelara el resultado aprobado y bloqueara nuevos calculos o reemplazos para el periodo mientras no exista un flujo de reapertura.',
      '',
      'No se emitiran liquidaciones oficiales.',
      'No se generaran archivos Previred, LRE, banco ni PDF.',
      '',
      'Deseas continuar?',
    ].join('\n');
    try {
      return typeof window === 'undefined' || typeof window.confirm !== 'function' ? true : window.confirm(mensaje);
    } catch {
      return true;
    }
  }

  badgeVariantPasoPeriodo(estado: PasoPeriodoEstado): 'success' | 'warning' | 'error' | 'default' | 'info' {
    switch (estado) {
      case 'Completo':
        return 'success';
      case 'Actual':
        return 'info';
      case 'Bloqueada':
        return 'error';
      default:
        return 'default';
    }
  }

  badgeVariantEstadoOperativo(severidad: ProcesoMensualEstadoSeveridad): 'success' | 'warning' | 'error' | 'default' | 'info' {
    switch (severidad) {
      case 'success':
        return 'success';
      case 'warning':
        return 'warning';
      case 'danger':
        return 'error';
      case 'info':
        return 'info';
      case 'neutral':
      default:
        return 'default';
    }
  }

  cerrarNominaOperativa(): void {
    const snapshot = this.snapshotActivo();
    if (!snapshot?.idCalculoPeriodo || !this.puedeCerrarNominaOperativa()) return;
    if (!this.confirmarCierreNominaOperativa()) return;

    this.cerrandoNomina.set(true);
    this.errorCierreOperativo.set(null);
    void this.procesoMensual
      .cerrarNominaOperativamente({
        idCalculoPeriodo: snapshot.idCalculoPeriodo,
        periodo: this.periodoSeleccionado(),
      })
      .then((persistido) => {
        this.aplicarSnapshotActivo(persistido);
        void this.cargarSnapshotCompletoActivo(this.periodoSeleccionado());
      })
      .catch(() => {
        this.errorCierreOperativo.set('No se pudo cerrar operativamente la nomina. No se realizaron cambios parciales.');
      })
      .finally(() => {
        this.cerrandoNomina.set(false);
      });
  }

  etiquetaArea(area: ProcesoMensualArea, fallback?: string): string {
    switch (area) {
      case 'PARAMETROS':
        return 'Parametros';
      case 'TRABAJADORES':
        return 'Trabajadores';
      case 'CONCEPTOS':
        return 'Conceptos de remuneracion';
      case 'HABERES_RECURRENTES':
        return 'Asignaciones recurrentes';
      case 'ENTRADAS_MENSUALES':
      case 'MOVIMIENTOS_VARIABLES':
        return 'Movimientos del mes';
      case 'PROCESO':
        return 'Preparacion del periodo';
      default:
        return fallback ?? area;
    }
  }

  etiquetaItemEstado(estado: ProcesoMensualItemEstado): string {
    switch (estado) {
      case 'LISTO':
        return 'Listo';
      case 'CON_PROBLEMAS':
        return 'Revisar';
      case 'PENDIENTE_INTEGRACION':
        return 'Pendiente de integracion';
      case 'NO_EVALUADO':
      default:
        return 'Sin evaluar';
    }
  }

  badgeVariantItemEstado(estado: ProcesoMensualItemEstado): 'success' | 'warning' | 'error' | 'info' | 'default' {
    switch (estado) {
      case 'LISTO':
        return 'success';
      case 'CON_PROBLEMAS':
        return 'error';
      case 'PENDIENTE_INTEGRACION':
        return 'info';
      default:
        return 'default';
    }
  }

  accionArea(area: ProcesoMensualArea): { label: string; route: string } | null {
    switch (area) {
      case 'PARAMETROS':
        return { label: 'Revisar parametros', route: '/parametros' };
      case 'CONCEPTOS':
        return { label: 'Revisar conceptos', route: '/remuneraciones/conceptos' };
      case 'HABERES_RECURRENTES':
        return { label: 'Revisar asignaciones', route: '/remuneraciones/haberes-descuentos' };
      case 'ENTRADAS_MENSUALES':
      case 'MOVIMIENTOS_VARIABLES':
        return { label: 'Revisar movimientos', route: '/remuneraciones/novedades-mensuales' };
      default:
        return null;
    }
  }

  referenciaTecnica(mensaje: ProcesoMensualMensaje): string {
    return `Referencia tecnica: ${mensaje.codigo}`;
  }

  etiquetaEstadoTrabajador(estado: string): string {
    switch (estado) {
      case 'calculado_preliminar':
        return 'Calculado preliminar';
      case 'con_advertencias':
        return 'Con advertencias';
      case 'con_bloqueos':
        return 'Con bloqueos';
      default:
        return estado;
    }
  }

  badgeVariantResultadoPreliminar(estado: ResultadoPreliminarEstado): 'success' | 'warning' | 'error' | 'info' | 'default' {
    switch (estado) {
      case 'no_guardado':
      case 'guardado':
        return 'success';
      case 'actualizado_sin_guardar':
        return 'warning';
      case 'error_guardado':
      case 'con_bloqueos':
        return 'error';
      case 'sin_resultado':
      default:
        return 'default';
    }
  }

  badgeVariantRevisionAprobacion(estado: RevisionAprobacionEstado): 'success' | 'warning' | 'error' | 'info' | 'default' {
    switch (estado) {
      case 'listo':
      case 'aprobado':
        return 'success';
      case 'aprobado_desactualizado':
      case 'pendiente_revision':
      case 'actualizado_sin_guardar':
        return 'warning';
      case 'no_apto':
        return 'error';
      case 'pendiente_guardado':
        return 'info';
      case 'sin_resultado_guardado':
      default:
        return 'default';
    }
  }

  badgeVariantRevisionChecklist(estado: RevisionChecklistEstado): 'success' | 'warning' | 'error' | 'info' | 'default' {
    switch (estado) {
      case 'Completo':
        return 'success';
      case 'Pendiente':
        return 'warning';
      case 'Requiere atencion':
        return 'error';
      case 'No aplica':
      default:
        return 'default';
    }
  }

  badgeVariantEstadoResultadoTrabajador(
    estado: TrabajadorResultadoPreliminarView['estadoLabel'],
  ): 'success' | 'warning' | 'error' | 'info' | 'default' {
    switch (estado) {
      case 'Calculado':
        return 'success';
      case 'Con observaciones':
        return 'warning';
      case 'Omitido':
      case 'No calculado':
        return 'error';
      default:
        return 'default';
    }
  }

  etiquetaEstadoBaseTrabajador(estado: BaseNominaTrabajadorEstado): string {
    switch (estado) {
      case 'listo':
        return 'Listo para calculo';
      case 'con_observaciones':
        return 'Con observaciones';
      case 'bloqueado':
        return 'Bloqueado';
      case 'excluido':
        return 'Excluido';
      default:
        return estado;
    }
  }

  badgeVariantEstadoBaseTrabajador(
    estado: BaseNominaTrabajadorEstado,
  ): 'success' | 'warning' | 'error' | 'info' | 'default' {
    switch (estado) {
      case 'listo':
        return 'success';
      case 'con_observaciones':
        return 'warning';
      case 'bloqueado':
        return 'error';
      case 'excluido':
        return 'default';
      default:
        return 'default';
    }
  }

  etiquetaParametrosBase(estado: BaseNominaParametrosEstado): string {
    switch (estado) {
      case 'listos':
        return 'Listos';
      case 'con_observaciones':
        return 'Con observaciones';
      case 'por_revisar':
        return 'Por revisar';
      case 'sin_evaluar':
      default:
        return 'Sin evaluar';
    }
  }

  badgeVariantParametrosBase(estado: BaseNominaParametrosEstado): 'success' | 'warning' | 'error' | 'info' | 'default' {
    switch (estado) {
      case 'listos':
        return 'success';
      case 'con_observaciones':
        return 'warning';
      case 'por_revisar':
        return 'error';
      default:
        return 'default';
    }
  }

  badgeVariantValidacionCalculo(estado: ValidacionCalculoEstado): 'success' | 'warning' | 'error' | 'info' | 'default' {
    switch (estado) {
      case 'listo':
        return 'success';
      case 'advertencias':
        return 'warning';
      case 'bloqueado':
        return 'error';
      case 'pendiente':
      default:
        return 'default';
    }
  }

  ejecutarAccionValidacion(accion: ValidacionAccionLocal): void {
    switch (accion) {
      case 'validarPeriodo':
        this.validarPeriodo();
        break;
      case 'generarBase':
      case 'actualizarBase':
        this.generarPreNomina();
        break;
      case 'calcularPreliminar':
        this.calcularPreliminar();
        break;
      case 'guardarResultado':
        this.guardarSnapshotPreliminar();
        break;
      case 'aprobarResultado':
        this.aprobarResultadoPreliminar();
        break;
      case 'cerrarNomina':
        this.cerrarNominaOperativa();
        break;
      case 'revisarBloqueos':
        this.revisarBloqueosOperativos();
        break;
    }
  }

  private etiquetaRevisionAprobacion(estado: RevisionAprobacionEstado): string {
    switch (estado) {
      case 'aprobado':
        return 'Aprobado operativamente';
      case 'aprobado_desactualizado':
        return 'Aprobacion desactualizada';
      case 'pendiente_guardado':
        return 'Pendiente de guardado';
      case 'pendiente_revision':
        return 'Listo para aprobar con advertencias';
      case 'actualizado_sin_guardar':
        return 'Resultado actualizado sin guardar';
      case 'no_apto':
        return 'No apto para aprobacion';
      case 'listo':
        return 'Listo para aprobar';
      case 'sin_resultado_guardado':
      default:
        return 'Sin resultado guardado';
    }
  }

  private descripcionRevisionAprobacion(estado: RevisionAprobacionEstado): string {
    switch (estado) {
      case 'aprobado':
        return 'Resultado preliminar aprobado operativamente.';
      case 'aprobado_desactualizado':
        return 'La aprobacion operativa anterior quedo desactualizada porque existe un resultado posterior. Guarda y aprueba nuevamente el resultado actualizado.';
      case 'pendiente_guardado':
        return 'El resultado calculado debe guardarse antes de revisarlo para aprobacion.';
      case 'pendiente_revision':
        return 'El resultado preliminar guardado esta listo para aprobacion operativa, con advertencias visibles para decision RRHH.';
      case 'actualizado_sin_guardar':
        return 'Hay un calculo preliminar mas reciente que el ultimo guardado. Guarda la version actual antes de revisarla.';
      case 'no_apto':
        return 'Existen bloqueos que impiden aprobar operativamente este resultado.';
      case 'listo':
        return 'El resultado preliminar guardado esta listo para aprobacion operativa.';
      case 'sin_resultado_guardado':
      default:
        return 'Guarda un resultado preliminar antes de aprobar operativamente la nomina.';
    }
  }

  private checklistRevisionAprobacion(input: {
    hayGuardado: boolean;
    guardado: ResultadoPreliminarView['ultimoGuardado'];
    actualizadoSinGuardar: boolean;
    hayResultadoActual: boolean;
    bloqueos: ResultadoObservacionView[];
    advertencias: ResultadoObservacionView[];
  }): RevisionAprobacionChecklistItemView[] {
    const totalCalculados = input.guardado?.trabajadoresCalculados ?? 0;
    const omitidos = input.guardado?.trabajadoresOmitidos ?? 0;
    return [
      {
        titulo: 'Resultado preliminar guardado',
        descripcion: input.hayGuardado
          ? 'Existe una version preliminar activa para este periodo.'
          : input.hayResultadoActual
            ? 'Guarda el calculo preliminar para que quede disponible para revision.'
            : 'Primero calcula y guarda un resultado preliminar.',
        estado: input.hayGuardado ? 'Completo' : 'Pendiente',
      },
      {
        titulo: 'Resultado guardado vigente',
        descripcion: input.actualizadoSinGuardar
          ? 'El calculo actual es mas reciente que la version guardada.'
          : input.hayGuardado
            ? 'La version guardada coincide con el ultimo resultado disponible.'
            : 'Se evaluara despues del guardado.',
        estado: !input.hayGuardado ? 'Pendiente' : input.actualizadoSinGuardar ? 'Requiere atencion' : 'Completo',
      },
      {
        titulo: 'Trabajadores calculados revisables',
        descripcion: input.hayGuardado
          ? `${totalCalculados} trabajador(es) calculado(s) en el resultado guardado.`
          : 'Aun no hay trabajadores guardados para revisar.',
        estado: !input.hayGuardado ? 'Pendiente' : totalCalculados > 0 ? 'Completo' : 'Requiere atencion',
      },
      {
        titulo: 'Sin bloqueos operativos',
        descripcion: input.bloqueos.length
          ? 'Hay bloqueos que requieren correccion antes de avanzar.'
          : 'No hay bloqueos visibles en la revision operativa.',
        estado: input.bloqueos.length || omitidos > 0 ? 'Requiere atencion' : input.hayGuardado ? 'Completo' : 'Pendiente',
      },
      {
        titulo: 'Advertencias visibles para decision RRHH',
        descripcion: input.advertencias.length
          ? 'Las advertencias quedan visibles para decidir si se corrigen o se aceptan operativamente.'
          : 'No hay advertencias pendientes en la version revisada.',
        estado: !input.hayGuardado ? 'Pendiente' : input.advertencias.length ? 'Requiere atencion' : 'Completo',
      },
      {
        titulo: 'Resultado aprobado operativamente',
        descripcion: this.aprobacionOperativa()
          ? 'RRHH registro una aprobacion operativa interna para el resultado preliminar.'
          : 'Pendiente de aprobacion operativa interna por RRHH.',
        estado: this.aprobacionOperativa() ? 'Completo' : input.hayGuardado ? 'Pendiente' : 'No aplica',
      },
      {
        titulo: 'Acciones legales pendientes para fase posterior',
        descripcion: 'Liquidaciones oficiales, cierre, Previred, LRE y bancos no se ejecutan en esta revision.',
        estado: 'No aplica',
      },
    ];
  }

  private observacionDesdeValidacion(item: ValidacionOperativaItemView): ResultadoObservacionView {
    return {
      codigo: item.codigo,
      titulo: item.titulo,
      descripcion: item.descripcion,
      accionLabel: item.accionLabel,
      ruta: item.ruta,
    };
  }

  private pendienteDesdeValidacion(
    item: ValidacionOperativaItemView,
    severidad: ProcesoMensualEstadoSeveridad = item.severidad === 'bloqueo' ? 'danger' : item.severidad === 'advertencia' ? 'warning' : 'info',
  ): ProcesoMensualPendienteVm {
    return {
      codigo: item.codigo,
      titulo: item.titulo,
      descripcion: item.descripcion,
      severidad,
      ruta: item.ruta,
      accionLocal: item.accionLocal,
      accionLabel: item.accionLabel,
    };
  }

  private pendienteDesdeResultado(
    item: ResultadoObservacionView,
    severidad: ProcesoMensualEstadoSeveridad,
  ): ProcesoMensualPendienteVm {
    return {
      codigo: item.codigo,
      titulo: item.titulo,
      descripcion: item.descripcion,
      severidad,
      ruta: item.ruta,
      accionLabel: item.accionLabel,
    };
  }

  private buildValidacionCalculo(input: {
    bloqueos: ValidacionOperativaItemView[];
    advertencias: ValidacionOperativaItemView[];
    informaciones: ValidacionOperativaItemView[];
    estadoForzado?: ValidacionCalculoEstado;
    razonDeshabilitado?: string;
    siguienteAccion?: ValidacionCalculoPreliminarView['siguienteAccion'];
  }): ValidacionCalculoPreliminarView {
    const estado =
      input.estadoForzado ??
      (input.bloqueos.length > 0 ? 'bloqueado' : input.advertencias.length > 0 ? 'advertencias' : 'listo');
    const puedeCalcular = estado === 'listo' || estado === 'advertencias';
    const razonDeshabilitado = puedeCalcular ? undefined : input.razonDeshabilitado ?? input.bloqueos[0]?.descripcion;
    return {
      estado,
      estadoLabel: this.etiquetaValidacionCalculo(estado),
      puedeCalcular,
      razonDeshabilitado,
      siguienteAccion: input.siguienteAccion ?? this.resolverSiguienteAccion(input.bloqueos, input.advertencias),
      bloqueos: input.bloqueos,
      advertencias: input.advertencias,
      informaciones: input.informaciones,
    };
  }

  private etiquetaValidacionCalculo(estado: ValidacionCalculoEstado): string {
    switch (estado) {
      case 'listo':
        return 'Listo para calcular';
      case 'advertencias':
        return 'Con advertencias';
      case 'bloqueado':
        return 'Bloqueado';
      case 'pendiente':
      default:
        return 'Pendiente de validar';
    }
  }

  private resolverSiguienteAccion(
    bloqueos: readonly ValidacionOperativaItemView[],
    advertencias: readonly ValidacionOperativaItemView[],
  ): ValidacionCalculoPreliminarView['siguienteAccion'] {
    const prioridad = ['BLOQ-001', 'BLOQ-004', 'BLOQ-005', 'BLOQ-003', 'BLOQ-006'];
    const bloqueo = prioridad.map((codigo) => bloqueos.find((b) => b.codigo === codigo)).find((b): b is ValidacionOperativaItemView => !!b) ?? bloqueos[0];
    if (bloqueo) {
      return {
        label: bloqueo.accionLabel ?? 'Resolver bloqueo',
        descripcion: bloqueo.descripcion,
        ruta: bloqueo.ruta,
        accionLocal: bloqueo.accionLocal,
      };
    }
    if (advertencias.length > 0) {
      return {
        label: 'Revisar advertencias o calcular preliminar',
        descripcion: `La base de nomina puede calcularse con ${advertencias.length} advertencia(s) no bloqueante(s).`,
        accionLocal: 'calcularPreliminar',
      };
    }
    return {
      label: 'Calcular preliminar',
      descripcion: 'La base de nomina esta lista para calcular preliminarmente.',
      accionLocal: 'calcularPreliminar',
    };
  }

  private itemDesdeMensaje(
    mensaje: ProcesoMensualMensaje,
    severidad: ValidacionOperativaSeveridad,
  ): ValidacionOperativaItemView {
    const accion = this.accionArea(mensaje.area);
    return {
      codigo: mensaje.codigo,
      titulo: this.tituloMensajeOperativo(mensaje),
      descripcion: mensaje.texto,
      severidad,
      accionLabel: accion?.label,
      ruta: accion?.route,
    };
  }

  private tituloMensajeOperativo(mensaje: ProcesoMensualMensaje): string {
    if (mensaje.area === 'PARAMETROS') return 'Parametros del periodo por revisar';
    if (mensaje.area === 'TRABAJADORES') return 'Trabajadores por revisar';
    if (mensaje.area === 'HABERES_RECURRENTES') return 'Asignaciones recurrentes por revisar';
    if (mensaje.area === 'ENTRADAS_MENSUALES' || mensaje.area === 'MOVIMIENTOS_VARIABLES') return 'Movimientos del mes por revisar';
    if (mensaje.area === 'CONCEPTOS') return 'Conceptos de remuneracion por revisar';
    return 'Preparacion del periodo por revisar';
  }

  private parametroMinimoBloqueante(id: string, clasificacion: ClasificacionParametroGrupo): boolean {
    const obligatorios = new Set(['mensuales_uf_utm_sueldo', 'topes_base', 'catalogos_afp_impuesto']);
    return obligatorios.has(id) && (clasificacion === 'FALTANTE' || clasificacion === 'PARCIAL');
  }

  private parametroMinimoBloqueanteDesdeCodigo(codigo: string): boolean {
    return ['PARAM_MIN_mensuales_uf_utm_sueldo', 'PARAM_MIN_topes_base', 'PARAM_MIN_catalogos_afp_impuesto']
      .some((prefix) => codigo.startsWith(prefix));
  }

  private parametroOpcionalAdvertencia(id: string, clasificacion: ClasificacionParametroGrupo): boolean {
    return !this.parametroMinimoBloqueante(id, clasificacion) && (clasificacion === 'FALTANTE' || clasificacion === 'PARCIAL');
  }

  private etiquetaResultadoPreliminar(estado: ResultadoPreliminarEstado): string {
    switch (estado) {
      case 'no_guardado':
        return 'Resultado no guardado';
      case 'guardado':
        return 'Resultado guardado';
      case 'actualizado_sin_guardar':
        return 'Resultado actualizado sin guardar';
      case 'error_guardado':
        return 'No se pudo guardar';
      case 'con_bloqueos':
        return 'Resultado con bloqueos';
      case 'sin_resultado':
      default:
        return 'Sin resultado';
    }
  }

  private descripcionEstadoGuardado(estado: ResultadoPreliminarEstado): string {
    switch (estado) {
      case 'no_guardado':
        return 'Revisa el calculo preliminar y guardalo como version revisable si corresponde.';
      case 'guardado':
        return 'Este resultado preliminar quedo guardado como version revisable. No emite liquidaciones ni cierra el periodo.';
      case 'actualizado_sin_guardar':
        return 'Volviste a calcular despues del ultimo guardado. Guarda esta nueva version si quieres conservarla.';
      case 'error_guardado':
        return 'No se pudo guardar el resultado preliminar. Intenta nuevamente o revisa las observaciones del resultado.';
      case 'con_bloqueos':
        return 'No puedes guardar este resultado preliminar. Hay bloqueos del resultado que deben resolverse.';
      case 'sin_resultado':
      default:
        return 'Primero calcula preliminarmente la nomina para revisar montos y observaciones antes de guardar.';
    }
  }

  private resolverEstadoGuardadoResultado(
    calculo: MotorCalculoPeriodoResultado,
    bloqueos: ResultadoObservacionView[],
  ): ResultadoPreliminarEstado {
    if (this.errorGuardadoResultado()) return 'error_guardado';
    if (calculo.estado === 'con_bloqueos' || bloqueos.length > 0) return 'con_bloqueos';
    const snapshot = this.snapshotActivo();
    if (!snapshot) return 'no_guardado';
    return this.identificadorResultadoGuardadoActual() === snapshot.hashSnapshot
      ? 'guardado'
      : 'actualizado_sin_guardar';
  }

  private razonNoPuedeGuardarResultado(bloqueos: ResultadoObservacionView[]): string {
    if (!validarPeriodoEntradaMensual(this.periodoSeleccionado())) return 'El periodo seleccionado no es valido.';
    if (this.nominaEstaCerradaOperativamente()) return 'La nomina del periodo esta cerrada operativamente. Para modificarla se requerira una fase futura de reapertura.';
    if (!this.calculo()) return 'Primero calcula preliminarmente la nomina.';
    if (this.errorEjecucion()) return 'Hay un error tecnico activo que debes resolver antes de guardar.';
    if (bloqueos.length > 0) return 'El resultado tiene bloqueos que deben revisarse.';
    const snapshot = this.snapshotActivo();
    if (snapshot && this.identificadorResultadoGuardadoActual() === snapshot.hashSnapshot) {
      return 'No hay cambios para guardar. El resultado preliminar actual ya esta guardado.';
    }
    if (this.guardandoSnapshot()) return 'El guardado del resultado preliminar esta en curso.';
    return 'Genera un resultado preliminar sin bloqueos antes de guardar.';
  }

  private ultimoGuardadoDesdeSnapshot(snapshot: NominaCalculoPeriodoSnapshot): ResultadoPreliminarView['ultimoGuardado'] {
    const advertencias = snapshot.totalAdvertencias ?? 0;
    return {
      versionLabel: snapshot.idCalculoPeriodo
        ? `Disponible como referencia interna ${snapshot.idCalculoPeriodo}`
        : 'Version numerica no disponible en esta etapa.',
      fechaGuardadoLabel: this.formatoFechaHora(snapshot.fechaGeneracion),
      versionCalculoLabel: snapshot.versionMotor || 'Version no disponible',
      identificadorTecnicoLabel: snapshot.hashSnapshot || 'Referencia interna no disponible',
      estadoLabel: this.etiquetaEstadoSnapshot(snapshot.estado),
      trabajadoresCalculados: snapshot.totalTrabajadores,
      trabajadoresConObservaciones: advertencias,
      trabajadoresOmitidos: snapshot.totalBloqueados,
      totalLiquidoLabel: this.formatoMonto(snapshot.totalLiquido),
      advertenciasLabel: advertencias > 0
        ? `Este resultado se guardo con ${advertencias} advertencia(s) no bloqueante(s).`
        : 'Resultado guardado sin advertencias.',
    };
  }

  private cargarSnapshotActivo(periodo: string): Promise<void> {
    return this.procesoMensual.obtenerSnapshotActivo(periodo)
      .then((snapshot) => {
        this.aplicarSnapshotActivo(snapshot);
        return this.cargarSnapshotCompletoActivo(periodo);
      });
  }

  private cargarSnapshotCompletoActivo(periodo: string): Promise<void> {
    this.consultandoSnapshotCompleto.set(true);
    this.errorSnapshotCompleto.set(null);
    return this.procesoMensual.obtenerSnapshotCompletoActivo(periodo)
      .then((snapshot) => {
        if (this.periodoSeleccionado() !== periodo) {
          return;
        }
        this.snapshotCompleto.set(snapshot);
      })
      .catch(() => {
        if (this.periodoSeleccionado() !== periodo) {
          return;
        }
        this.snapshotCompleto.set(null);
        this.errorSnapshotCompleto.set('No se pudo cargar el detalle del resultado guardado. Intenta nuevamente o revisa la conexion.');
      })
      .finally(() => {
        this.consultandoSnapshotCompleto.set(false);
      });
  }

  private aplicarSnapshotActivo(snapshot: NominaCalculoPeriodoSnapshot | null): void {
    this.snapshotActivo.set(snapshot);
    this.aprobacionOperativa.set(snapshot ? this.aprobacionDesdeSnapshot(snapshot) : null);
  }

  private aprobacionDesdeSnapshot(snapshot: NominaCalculoPeriodoSnapshot): AprobacionOperativaRegistroView | null {
    const aprobacion = snapshot.aprobacionOperativa;
    if (!aprobacion) return null;
    return {
      fechaAprobacionLabel: this.formatoFechaHora(aprobacion.fecha),
      usuarioLabel: aprobacion.usuarioLabel || 'Usuario no disponible en esta sesion',
      versionCalculoLabel: snapshot.versionMotor || 'Version no disponible',
      identificadorTecnicoLabel: snapshot.hashSnapshot || 'Referencia interna no disponible',
      identificadorResultado: snapshot.hashSnapshot ?? null,
      idCalculoPeriodo: snapshot.idCalculoPeriodo ?? null,
      trabajadoresCalculados: snapshot.totalTrabajadores,
      totalHaberesLabel: this.formatoMonto(snapshot.totalHaberes),
      totalDescuentosLabel: this.formatoMonto(snapshot.totalDescuentos),
      totalLiquidoLabel: this.formatoMonto(snapshot.totalLiquido),
      advertencias: aprobacion.advertencias,
    };
  }

  private etiquetaEstadoSnapshotTrabajador(estado: MotorCalculoEstadoTrabajador): string {
    switch (estado) {
      case 'calculado_preliminar':
        return 'Calculado';
      case 'con_advertencias':
        return 'Con observaciones';
      case 'con_bloqueos':
        return 'Con bloqueos';
      default:
        return 'No calculado';
    }
  }

  private etiquetaConceptoSnapshot(concepto: NominaCalculoConceptoSnapshot): string {
    const nombre = concepto.nombreConceptoSnapshot?.trim() || 'Concepto no disponible';
    const codigo = concepto.codigoLreSnapshot?.trim();
    return `${nombre}${codigo ? ` (${codigo})` : ''}: ${this.formatoMonto(concepto.monto)}`;
  }

  private etiquetaNivelObservacion(severidad: MotorCalculoSeveridad): SnapshotCompletoObservacionView['nivelLabel'] {
    switch (severidad) {
      case 'BLOQUEO':
        return 'Bloqueo';
      case 'ADVERTENCIA':
        return 'Advertencia';
      case 'INFO':
      default:
        return 'Informacion';
    }
  }

  private etiquetaEstadoSnapshot(estado: NominaCalculoPeriodoSnapshot['estado']): string {
    switch (estado) {
      case 'preliminar':
        return 'Preliminar';
      case 'recalculado':
        return 'Recalculado';
      case 'observado':
        return 'Observado';
      case 'listo_para_revision':
        return 'Listo para revision';
      case 'aprobado_para_liquidacion':
        return 'Aprobado para fase posterior';
      case 'anulado':
        return 'Anulado';
      case 'borrador':
      default:
        return 'Borrador';
    }
  }

  private razonNoPuedeAprobar(input: {
    hayResultadoActual: boolean;
    hayGuardado: boolean;
    actualizadoSinGuardar: boolean;
    bloqueos: ResultadoObservacionView[];
    omitidos: number;
    aprobacionVigente: boolean;
  }): string | undefined {
    if (input.aprobacionVigente) return 'El resultado preliminar guardado ya esta aprobado operativamente.';
    if (this.nominaEstaCerradaOperativamente()) return 'La nomina del periodo esta cerrada operativamente. Para modificarla se requerira una fase futura de reapertura.';
    if (!validarPeriodoEntradaMensual(this.periodoSeleccionado())) return 'El periodo no es valido para aprobacion operativa.';
    if (!input.hayResultadoActual && !input.hayGuardado) return 'Primero calcula el resultado preliminar.';
    if (!input.hayGuardado) return 'Primero guarda el resultado preliminar.';
    if (input.actualizadoSinGuardar) return 'Hay un resultado actualizado sin guardar.';
    if (input.bloqueos.length > 0 || input.omitidos > 0) return 'Existen bloqueos operativos pendientes.';
    return undefined;
  }

  private confirmarAprobacionOperativa(tieneAdvertencias: boolean): boolean {
    const partes = [
      'Aprobar resultado preliminar',
      '',
      'Esta accion marca el resultado preliminar guardado como aprobado operativamente para revision interna.',
      'No emite liquidaciones, no cierra el periodo y no genera archivos legales.',
    ];
    if (tieneAdvertencias) {
      partes.push(
        '',
        'Existen advertencias visibles. Puedes aprobar operativamente, pero quedaran registradas como observaciones de revision.',
      );
    }
    partes.push('', 'Deseas aprobar el resultado preliminar?');
    try {
      return typeof window === 'undefined' || typeof window.confirm !== 'function'
        ? true
        : window.confirm(partes.join('\n'));
    } catch {
      return true;
    }
  }

  private confirmarGuardarPreliminar(): boolean {
    const mensaje = [
      'Guardar resultado preliminar',
      '',
      'Se guardara una version revisable del calculo preliminar para este periodo.',
      'Esto no emite liquidaciones, no cierra el periodo y no genera archivos legales.',
      '',
      'Deseas continuar?',
    ].join('\n');
    try {
      return typeof window === 'undefined' || typeof window.confirm !== 'function' ? true : window.confirm(mensaje);
    } catch {
      return true;
    }
  }

  private estadoResultadoTrabajador(estado: string): TrabajadorResultadoPreliminarView['estadoLabel'] {
    switch (estado) {
      case 'calculado_preliminar':
        return 'Calculado';
      case 'con_advertencias':
        return 'Con observaciones';
      case 'con_bloqueos':
        return 'Omitido';
      default:
        return 'No calculado';
    }
  }

  private observacionesResultado(
    calculo: MotorCalculoPeriodoResultado,
    severidad: MotorCalculoIssue['severidad'],
  ): ResultadoObservacionView[] {
    return [
      ...calculo.issues,
      ...calculo.liquidaciones.flatMap((liq) => liq.issues),
    ]
      .filter((issue) => issue.severidad === severidad)
      .map((issue) => ({
        codigo: issue.codigo,
        titulo: severidad === 'BLOQUEO' ? 'Bloqueo del resultado' : 'Advertencia del resultado',
        descripcion: issue.mensaje,
        ...this.accionResultadoDesdeIssues([issue]),
      }));
  }

  private accionResultadoDesdeIssues(
    issues: readonly MotorCalculoIssue[],
  ): Pick<ResultadoObservacionView, 'accionLabel' | 'ruta'> {
    const origen = issues.map((issue) => `${issue.origen} ${issue.codigo}`.toLowerCase()).join(' ');
    if (origen.includes('entrada') || origen.includes('movimiento')) {
      return { accionLabel: 'Revisar movimientos del mes', ruta: '/remuneraciones/novedades-mensuales' };
    }
    if (origen.includes('recurrente') || origen.includes('haber')) {
      return { accionLabel: 'Revisar asignaciones recurrentes', ruta: '/remuneraciones/haberes-descuentos' };
    }
    return { accionLabel: 'Revisar base de nomina' };
  }

  private formatoMonto(valor: number | null | undefined): string {
    if (typeof valor !== 'number' || !Number.isFinite(valor)) return 'Monto no disponible';
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0,
    }).format(valor);
  }

  private formatoFechaHora(valor: string | null | undefined): string {
    if (!valor) return 'Fecha no disponible';
    const fecha = new Date(valor);
    if (Number.isNaN(fecha.getTime())) return valor;
    return new Intl.DateTimeFormat('es-CL', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(fecha);
  }
}
