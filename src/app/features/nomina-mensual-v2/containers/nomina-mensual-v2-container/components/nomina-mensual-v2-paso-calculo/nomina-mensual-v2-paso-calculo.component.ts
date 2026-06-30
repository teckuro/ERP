/**
 * Paso Cálculo — Generador V2 (rediseño NOIA-CALC-DESGLOSE-01).
 *
 * Orquesta el motor V1 (`ProcesoMensualService.generarCalculoPeriodo` vía el
 * adapter) sobre el período de la nómina activa, y presenta el resultado en
 * una grilla unificada por trabajador con desglose expandible inline y un
 * preview tipo PDF de la liquidación al alcance de un click.
 *
 * No reescribe motor: orquesta, persiste snapshot vía adapter al generar y
 * rehidrata el resultado guardado al volver al paso si `evidenciaCalculo`
 * sigue vigente. Registra auditoría en `evento_auditoria_nomina` vía
 * `NominaPeriodoService` y mapea las `LiquidacionCalculada` a viewmodel local
 * con `presentarFilaCalculo`.
 *
 * Antes de calcular, evalúa `obtenerResumenValidacionNomina` y bloquea
 * la ejecución si hay incidencias bloqueantes.
 */

import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';

import type {
  MotorCalculoPeriodoResultado,
  LiquidacionCalculada,
} from '../../../../../nomina-mensual/models/proceso-mensual.model';
import type {
  NominaPeriodo,
  ResumenValidacionNomina,
} from '../../../../../nomina-mensual/models/nomina-periodo.models';
import { NominaPeriodoService } from '../../../../../nomina-mensual/services/nomina-periodo.service';
import { NominaPeriodoCalculoAdapterService } from '../../../../../nomina-mensual/services/nomina-periodo-calculo-adapter.service';
import {
  PREFERENCIA_UI_VALOR_CERRADO,
  USUARIO_PREFERENCIA_UI_CLAVES,
} from '../../../../../../core/constants/usuario-preferencia-ui.claves';
import { UsuarioPreferenciaUiService } from '../../../../../../core/services/usuario-preferencia-ui.service';
import {
  DataGridCellDirective,
  DataGridComponent,
  DataGridRowDetailDirective,
} from '../../../../../../shared/components/ui/data-grid';
import { MessageBoxComponent } from '../../../../../../shared/components/ui/feedback/message-box/message-box.component';
import { WorkspaceLoadingComponent } from '../../../../../../shared/components/ui/feedback/workspace-loading/workspace-loading.component';
import {
  calcularStatsCalculo,
  construirFiltrosCalculo,
  COLUMNAS_GRILLA_CALCULO,
  etiquetaImponibilidad,
  PERSISTENCIA_GRILLA_CALCULO,
  presentarFilaCalculo,
  type FilaCalculoTrabajador,
  type LineaDesgloseCalculo,
  type StatsCalculoCabecera,
} from '../../../../presenters/paso-calculo-fila.presenter';
import { LiquidacionPreviewModalComponent } from '../../../../components/liquidacion-preview-modal/liquidacion-preview-modal.component';
import type {
  PasoNominaPort,
  ResultadoAvancePaso,
} from '../../facade/nomina-mensual-v2-navegacion';
import { MENSAJE_CALCULO_NO_VIGENTE } from '../../facade/nomina-mensual-v2-navegacion';
import { NominaMensualV2OrquestadorPort } from '../../facade/nomina-mensual-v2-orquestador.port';
import { NominaMensualV2TrazabilidadService } from '../../../../services/nomina-mensual-v2-trazabilidad.service';

@Component({
  selector: 'app-nomina-mensual-v2-paso-calculo',
  standalone: true,
  imports: [
    CommonModule,
    DataGridComponent,
    DataGridCellDirective,
    DataGridRowDetailDirective,
    MessageBoxComponent,
    WorkspaceLoadingComponent,
    LiquidacionPreviewModalComponent,
  ],
  templateUrl: './nomina-mensual-v2-paso-calculo.component.html',
  styleUrl: './nomina-mensual-v2-paso-calculo.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NominaMensualV2PasoCalculoComponent implements PasoNominaPort {
  private readonly calculoAdapter = inject(NominaPeriodoCalculoAdapterService);
  private readonly servicio = inject(NominaPeriodoService);
  private readonly preferenciaUi = inject(UsuarioPreferenciaUiService);
  private readonly orquestador = inject(NominaMensualV2OrquestadorPort);
  private readonly trazabilidadService = inject(NominaMensualV2TrazabilidadService);

  readonly nominaPeriodoId = input<string | null>(null);
  readonly nominaCabeceraCambiada = output<void>();

  readonly nomina = signal<NominaPeriodo | null>(null);
  readonly preValidacion = signal<ResumenValidacionNomina | null>(null);
  readonly resultado = signal<MotorCalculoPeriodoResultado | null>(null);
  readonly calculando = signal(false);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  /** Trabajador cuya previsualización tipo PDF está abierta (null = cerrada). */
  readonly filaPreviewAbierta = signal<string | null>(null);

  /** Hint dismissible en el chevron de la primera fila (persistido en BD). */
  readonly hintExpandVisible = signal(false);

  readonly puedeCalcular = computed(() => {
    if (this.calculando()) return false;
    const valid = this.preValidacion();
    return !!valid && valid.puedeCalcular;
  });

  readonly puedeAvanzar = computed(() => this.resultado() != null);

  /**
   * `true` cuando el snapshot persistido en `evidenciaCalculo` dejó de ser
   * vigente por cambios posteriores (dotación/movimientos). Activa el banner
   * de advertencia replicado en Validación y Cierre (CAL-INV-05).
   */
  readonly calculoNoVigente = computed(() => {
    const ev = this.nomina()?.evidenciaCalculo;
    return ev != null && ev.versionCalculo > 0 && ev.calculoVigente === false;
  });

  readonly versionCalculo = computed(() => this.nomina()?.evidenciaCalculo?.versionCalculo ?? 0);

  /**
   * Filas de la grilla, una por trabajador calculado. Ordenadas por defecto
   * por líquido descendente (los más caros primero, comportamiento operativo
   * típico de revisión RRHH).
   */
  readonly filasGrilla = computed<FilaCalculoTrabajador[]>(() => {
    const liqs = this.resultado()?.liquidaciones ?? [];
    return liqs
      .map((liq) =>
        presentarFilaCalculo(liq, {
          afp: inferirAfp(liq),
          salud: inferirSalud(liq),
        }),
      )
      .sort((a, b) => (b.liquidoAPago ?? 0) - (a.liquidoAPago ?? 0));
  });

  readonly statsCabecera = computed<StatsCalculoCabecera>(() =>
    calcularStatsCalculo(this.resultado()?.liquidaciones ?? []),
  );

  readonly filtrosGrilla = computed(() => construirFiltrosCalculo(this.filasGrilla()));

  readonly liquidacionPreview = computed<LiquidacionCalculada | null>(() => {
    const trabajadorId = this.filaPreviewAbierta();
    if (!trabajadorId) return null;
    const fila = this.filasGrilla().find((f) => f.trabajadorId === trabajadorId);
    return fila?.origen ?? null;
  });

  readonly filaPreview = computed<FilaCalculoTrabajador | null>(() => {
    const trabajadorId = this.filaPreviewAbierta();
    if (!trabajadorId) return null;
    return this.filasGrilla().find((f) => f.trabajadorId === trabajadorId) ?? null;
  });

  readonly columnas = COLUMNAS_GRILLA_CALCULO;
  readonly persistenceKey = PERSISTENCIA_GRILLA_CALCULO;
  readonly mensajeCalculoNoVigente = MENSAJE_CALCULO_NO_VIGENTE;

  readonly expandHintGrilla = computed(() => {
    if (!this.resultado()) return null;
    return {
      text: 'Abre el desglose de haberes y descuentos de cada trabajador.',
      dismissLabel: 'Entendido',
      visible: this.hintExpandVisible(),
    };
  });

  rowKeyTrabajador = (fila: FilaCalculoTrabajador): string => fila.trabajadorId;

  etiquetaImponibilidad = etiquetaImponibilidad;

  /** Texto del CTA según estado (Calculando… / Recalcular / Calcular nómina). */
  textoCtaCalculo(): string {
    if (this.calculando()) return 'Calculando…';
    return this.resultado() ? 'Recalcular' : 'Calcular nómina';
  }

  /** Suma defensiva de líneas de desglose para el bloque "Bases". */
  totalLineas(lineas: readonly LineaDesgloseCalculo[]): number {
    let total = 0;
    for (const l of lineas) total += l.monto ?? 0;
    return total;
  }

  constructor() {
    effect(() => {
      const id = this.nominaPeriodoId();
      if (id) void this.cargar(id);
    });
  }

  private async cargar(nominaPeriodoId: string): Promise<void> {
    this.cargando.set(true);
    this.error.set(null);
    this.resultado.set(null);
    try {
      const [nomina, validacion] = await Promise.all([
        this.servicio.obtenerNomina(nominaPeriodoId),
        this.servicio.obtenerResumenValidacionNomina(nominaPeriodoId),
      ]);
      this.nomina.set(nomina);
      this.preValidacion.set(validacion);

      const persistido = await this.calculoAdapter.obtenerResultadoPersistido(nominaPeriodoId);
      if (persistido) {
        this.resultado.set(persistido);
      }

      if (this.resultado()) {
        await this.sincronizarHintExpandDesglose();
      } else {
        this.hintExpandVisible.set(false);
      }
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : 'Error desconocido';
      this.error.set(`No fue posible preparar el cálculo: ${mensaje}`);
    } finally {
      this.cargando.set(false);
    }
  }

  async calcular(): Promise<void> {
    const nomina = this.nomina();
    if (!nomina) return;
    this.calculando.set(true);
    this.error.set(null);
    try {
      const { resultado } = await this.calculoAdapter.calcular(nomina.id);
      this.resultado.set(resultado);
      await this.sincronizarHintExpandDesglose();
      this.nomina.set(await this.servicio.obtenerNomina(nomina.id));
      this.preValidacion.set(await this.servicio.obtenerResumenValidacionNomina(nomina.id));
      await this.registrarEventoCalculo(nomina, resultado);
      this.registrarEventoCalculoTrazabilidad(resultado);
      this.nominaCabeceraCambiada.emit();
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : 'Error desconocido';
      this.error.set(`No fue posible ejecutar el cálculo: ${mensaje}`);
    } finally {
      this.calculando.set(false);
    }
  }

  private registrarEventoCalculoTrazabilidad(resultado: MotorCalculoPeriodoResultado): void {
    const resumen = resultado.resumen;
    this.orquestador.registrarEventoTrazabilidad(
      this.trazabilidadService.crearEventoLocal({
        paso: 'calculation',
        tipoEvento: 'CALCULO_EJECUTADO',
        descripcion: `${resumen.totalTrabajadoresCalculados} trabajadores calculados · líquido $${resumen.totalLiquidoPreliminar.toLocaleString('es-CL')}`,
        integridad: { estadoIntegridad: 'registrado' },
      }),
    );
  }

  private async registrarEventoCalculo(
    nomina: NominaPeriodo,
    resultado: MotorCalculoPeriodoResultado,
  ): Promise<void> {
    try {
      await this.servicio.registrarEventoAuditoria({
        nominaPeriodoId: nomina.id,
        accion: 'calculada',
        motivo: `${resultado.resumen.totalTrabajadoresCalculados} trabajadores calculados · líquido $${resultado.resumen.totalLiquidoPreliminar.toLocaleString('es-CL')}`,
      });
    } catch (error) {
      console.error('[Cálculo] No fue posible registrar evento de auditoría', error);
    }
  }

  /**
   * Diagnóstico puro de "completitud" del paso. Requiere cálculo procesado y
   * vigente. Sin side-effects.
   */
  puedeContinuar(): ResultadoAvancePaso {
    if (this.cargando()) {
      return { ok: false, razon: 'Cargando el resumen de cálculo.' };
    }
    if (this.calculando()) {
      return { ok: false, razon: 'Cálculo en curso.' };
    }
    if (this.calculoNoVigente()) {
      return {
        ok: false,
        razon: 'El cálculo no está vigente. Vuelve a procesarlo antes de continuar.',
      };
    }
    if (!this.puedeAvanzar()) {
      return { ok: false, razon: 'Procesa el cálculo antes de continuar.' };
    }
    return { ok: true };
  }

  /**
   * Comando único de avance (AG-NAV-03). Paso navegacional con guard: requiere
   * un resultado de cálculo vigente. La acción operativa real (`Calcular
   * nómina`) sigue siendo un botón inline en el cuerpo del paso.
   */
  async avanzar(): Promise<ResultadoAvancePaso> {
    return this.puedeContinuar();
  }

  cerrarHintExpandDesglose(): void {
    this.hintExpandVisible.set(false);
    void this.preferenciaUi
      .guardar(
        USUARIO_PREFERENCIA_UI_CLAVES.NOMINA_CALCULO_EXPAND_DESGLOSE,
        PREFERENCIA_UI_VALOR_CERRADO,
      )
      .catch(() => undefined);
  }

  private async sincronizarHintExpandDesglose(): Promise<void> {
    if (!this.resultado()) {
      this.hintExpandVisible.set(false);
      return;
    }
    try {
      const establecida = await this.preferenciaUi.estaEstablecida(
        USUARIO_PREFERENCIA_UI_CLAVES.NOMINA_CALCULO_EXPAND_DESGLOSE,
      );
      this.hintExpandVisible.set(!establecida);
    } catch {
      this.hintExpandVisible.set(false);
    }
  }

  /** Abre la previsualización tipo PDF del trabajador indicado. */
  abrirPreview(fila: FilaCalculoTrabajador): void {
    this.filaPreviewAbierta.set(fila.trabajadorId);
  }

  cerrarPreview(): void {
    this.filaPreviewAbierta.set(null);
  }

  /** Dispara el diálogo de impresión del navegador para guardar como PDF. */
  imprimirPreview(): void {
    if (typeof window !== 'undefined') {
      window.print();
    }
  }
}

/**
 * Heurística pragmática: extrae el nombre de la AFP desde la descripción del
 * descuento legal (`"Cotizacion AFP <Nombre>"`). Si el motor no entrega el
 * nombre (descripción genérica "Cotizacion AFP trabajador"), devuelve null y
 * la grilla muestra "—". Cuando el container conecte el catálogo de AFPs,
 * podrá inyectar el nombre real vía `presentarFilaCalculo` reemplazando este
 * helper sin tocar el presenter.
 */
function inferirAfp(liq: LiquidacionCalculada): string | null {
  const linea = liq.descuentosLegales.find((d) => d.codigo === 'AFP');
  if (!linea) return null;
  const match = /AFP\s+(.+)$/i.exec(linea.descripcion);
  const nombre = match?.[1]?.trim();
  if (!nombre || /trabajador/i.test(nombre)) return null;
  return nombre;
}

function inferirSalud(liq: LiquidacionCalculada): string | null {
  const linea = liq.descuentosLegales.find((d) => d.codigo === 'SALUD');
  if (!linea) return null;
  if (/Fonasa/i.test(linea.descripcion)) return 'Fonasa';
  if (/Isapre/i.test(linea.descripcion)) {
    const match = /Isapre\s+(.+)$/i.exec(linea.descripcion);
    return match?.[1]?.trim() ?? 'Isapre';
  }
  return null;
}
