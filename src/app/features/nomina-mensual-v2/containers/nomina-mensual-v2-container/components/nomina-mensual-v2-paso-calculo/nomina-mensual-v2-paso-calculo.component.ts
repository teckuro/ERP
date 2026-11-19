/**
 * Paso Cálculo — Generador V2 (rediseño NOIA-CALC-DESGLOSE-01).
 *
 * Orquesta el motor V1 vía adapter, persiste snapshot al generar y presenta
 * resultados paginados server-side desde BD (BKL-09). El desglose expandible
 * y la previsualización PDF cargan el detalle del trabajador bajo demanda.
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
  LiquidacionCalculada,
  MotorCalculoPeriodoResultado,
} from '../../../../../nomina-mensual/models/proceso-mensual.model';
import type {
  FiltroCalculoPorTrabajador,
  NominaPeriodo,
  ResumenCalculoNomina,
  ResumenValidacionNomina,
} from '../../../../../nomina-mensual/models/nomina-periodo.models';
import { NominaPeriodoService } from '../../../../../nomina-mensual/services/nomina-periodo.service';
import { NominaPeriodoCalculoAdapterService } from '../../../../../nomina-mensual/services/nomina-periodo-calculo-adapter.service';
import {
  PREFERENCIA_UI_VALOR_CERRADO,
  USUARIO_PREFERENCIA_UI_CLAVES,
} from '../../../../../../core/constants/usuario-preferencia-ui.claves';
import {
  DocumentoLiquidacionService,
  type DocumentoLiquidacionEmpresa,
} from '../../../../../../core/services/documento-liquidacion.service';
import { ParametrosGeneralesService } from '../../../../../parametros-generales/services/parametros-generales.service';
import {
  enriquecerDocumentoDesdeCalculo,
  type LiquidacionDocumentoCierreInput,
  type LiquidacionDocumentoDetalleInput,
  type LiquidacionDocumentoTrabajadorMetaInput,
} from '../../../../../../shared/components/documento-liquidacion-sheet';
import { UsuarioPreferenciaUiService } from '../../../../../../core/services/usuario-preferencia-ui.service';
import {
  DataGridCellDirective,
  DataGridComponent,
  DataGridRowDetailDirective,
  type DataGridServerQuery,
} from '../../../../../../shared/components/ui/data-grid';
import { MessageBoxComponent } from '../../../../../../shared/components/ui/feedback/message-box/message-box.component';
import { WorkspaceLoadingComponent } from '../../../../../../shared/components/ui/feedback/workspace-loading/workspace-loading.component';
import {
  COLUMNAS_GRILLA_CALCULO,
  PERSISTENCIA_GRILLA_CALCULO,
  construirFiltrosCalculo,
  etiquetaImponibilidad,
  filtroCalculoDesdeGrid,
  presentarFilaCalculo,
  presentarFilaCalculoListado,
  statsDesdeResumenCalculo,
  type FilaCalculoTrabajador,
  type LineaDesgloseCalculo,
  type StatsCalculoCabecera,
} from '../../../../presenters/paso-calculo-fila.presenter';
import { LiquidacionPreviewModalComponent } from '../../../../components/liquidacion-preview-modal/liquidacion-preview-modal.component';
import type {
  PasoNominaPort,
  ResultadoAvancePaso,
} from '../../facade/nomina-mensual-v2-navegacion';
import { MENSAJE_CALCULO_NO_VIGENTE, esCalculoNoVigente } from '../../facade/nomina-mensual-v2-navegacion';
import type { TotalesRectificacionVista } from '../../../../../nomina-mensual/rules/proceso-mensual-motor-rectificacion.rules';
import { NominaMensualV2OrquestadorPort } from '../../facade/nomina-mensual-v2-orquestador.port';
import { NominaMensualV2TrazabilidadService } from '../../../../services/nomina-mensual-v2-trazabilidad.service';
import {
  ultimoDiffRecalculoConCambios,
  type DiffRecalculoView,
} from '../../../../presenters/nomina-calculo-version-diff.presenter';
import { PuedeEscribirDirective } from '../../../../../../core/auth/puede-escribir.directive';

const RESUMEN_CALCULO_VACIO: ResumenCalculoNomina = {
  trabajadoresCalculados: 0,
  totalHaberes: 0,
  totalDescuentos: 0,
  totalLiquido: 0,
  conAdvertencias: 0,
  conBloqueos: 0,
};

@Component({
  selector: 'app-nomina-mensual-v2-paso-calculo',
  standalone: true,
  imports: [PuedeEscribirDirective, 
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
  private readonly documentoLiquidacion = inject(DocumentoLiquidacionService);
  private readonly parametrosGenerales = inject(ParametrosGeneralesService);
  private readonly servicio = inject(NominaPeriodoService);
  private readonly preferenciaUi = inject(UsuarioPreferenciaUiService);
  private readonly orquestador = inject(NominaMensualV2OrquestadorPort);
  private readonly trazabilidadService = inject(NominaMensualV2TrazabilidadService);

  readonly nominaPeriodoId = input<string | null>(null);
  readonly preparacionExterna = input(false);
  readonly nominaCabeceraCambiada = output<void>();

  readonly nomina = signal<NominaPeriodo | null>(null);
  readonly preValidacion = signal<ResumenValidacionNomina | null>(null);
  readonly resumenCalculo = signal<ResumenCalculoNomina | null>(null);
  readonly filasGrilla = signal<FilaCalculoTrabajador[]>([]);
  readonly totalFiltrado = signal(0);
  readonly filtro = signal<FiltroCalculoPorTrabajador>({});
  readonly pagina = signal(1);
  readonly pageSize = signal(25);
  readonly calculando = signal(false);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  readonly totalesRectificacion = signal<TotalesRectificacionVista | null>(null);
  readonly diffRecalculo = signal<DiffRecalculoView | null>(null);

  readonly esRectificacion = computed(() => this.nomina()?.naturaleza === 'rectificacion');

  readonly filaPreviewAbierta = signal<string | null>(null);
  readonly liquidacionPreviewCargada = signal<LiquidacionCalculada | null>(null);
  readonly previewCargando = signal(false);
  readonly empresaDocumento = signal<DocumentoLiquidacionEmpresa | null>(null);
  readonly previewExtras = signal<{
    trabajadorMeta: LiquidacionDocumentoTrabajadorMetaInput;
    detalle: LiquidacionDocumentoDetalleInput;
    cierre: LiquidacionDocumentoCierreInput;
    numeroDocumento: string;
    fechaEmision: string | null;
  } | null>(null);

  readonly hintExpandVisible = signal(false);
  readonly detalleCargando = signal<Set<string>>(new Set());
  private readonly filasExpandidas = new Set<string>();

  readonly calculoDisponible = computed(
    () =>
      !!this.nomina()?.evidenciaCalculo?.calculoVigente
      && (this.resumenCalculo()?.trabajadoresCalculados ?? 0) > 0,
  );

  readonly puedeCalcular = computed(() => {
    if (this.calculando()) return false;
    const valid = this.preValidacion();
    return !!valid && valid.puedeCalcular;
  });

  readonly puedeAvanzar = computed(() => this.calculoDisponible());

  readonly calculoNoVigente = computed(() => esCalculoNoVigente(this.nomina()?.evidenciaCalculo));

  private readonly calculoNoVigenteAvisoCerrado = signal(false);

  readonly mostrarModalCalculoNoVigente = computed(
    () => this.calculoNoVigente() && !this.calculoNoVigenteAvisoCerrado(),
  );

  private readonly resetAvisoCalculoNoVigente = effect(() => {
    if (!this.calculoNoVigente()) {
      this.calculoNoVigenteAvisoCerrado.set(false);
    }
  });

  readonly versionCalculo = computed(() => this.nomina()?.evidenciaCalculo?.versionCalculo ?? 0);

  readonly mostrarDiffRecalculo = computed(
    () => this.calculoDisponible() && this.versionCalculo() > 1 && !!this.diffRecalculo(),
  );

  readonly statsCabecera = computed<StatsCalculoCabecera>(() =>
    statsDesdeResumenCalculo(this.resumenCalculo()),
  );

  readonly filtrosGrilla = computed(() => construirFiltrosCalculo(this.filasGrilla()));

  readonly filaPreview = computed<FilaCalculoTrabajador | null>(() => {
    const trabajadorId = this.filaPreviewAbierta();
    if (!trabajadorId) return null;
    return this.filasGrilla().find((f) => f.trabajadorId === trabajadorId) ?? null;
  });

  readonly liquidacionPreview = computed(() => this.liquidacionPreviewCargada());

  readonly columnas = COLUMNAS_GRILLA_CALCULO;
  readonly persistenceKey = PERSISTENCIA_GRILLA_CALCULO;
  readonly mensajeCalculoNoVigente = MENSAJE_CALCULO_NO_VIGENTE;

  readonly expandHintGrilla = computed(() => {
    if (!this.calculoDisponible()) return null;
    return {
      text: 'Abre el desglose de haberes y descuentos de cada trabajador.',
      dismissLabel: 'Entendido',
      visible: this.hintExpandVisible(),
    };
  });

  rowKeyTrabajador = (fila: FilaCalculoTrabajador): string => fila.trabajadorId;

  etiquetaImponibilidad = etiquetaImponibilidad;

  textoCtaCalculo(): string {
    if (this.calculando()) return 'Calculando…';
    return this.calculoDisponible() ? 'Recalcular' : 'Calcular nómina';
  }

  totalLineas(lineas: readonly LineaDesgloseCalculo[]): number {
    let total = 0;
    for (const l of lineas) total += l.monto ?? 0;
    return total;
  }

  constructor() {
    effect(() => {
      const id = this.nominaPeriodoId();
      if (id) {
        this.pagina.set(1);
        this.filtro.set({});
        this.filasExpandidas.clear();
        void this.cargar(id);
      }
    });
  }

  private async cargar(nominaPeriodoId: string): Promise<void> {
    this.cargando.set(true);
    this.error.set(null);
    this.resumenCalculo.set(null);
    this.filasGrilla.set([]);
    this.totalFiltrado.set(0);
    try {
      const [nomina, validacion] = await Promise.all([
        this.servicio.obtenerNomina(nominaPeriodoId),
        this.servicio.obtenerResumenValidacionNomina(nominaPeriodoId),
      ]);
      this.nomina.set(nomina);
      this.preValidacion.set(validacion);

      if (nomina?.naturaleza === 'rectificacion') {
        this.totalesRectificacion.set(await this.calculoAdapter.obtenerTotalesRectificacion(nominaPeriodoId));
      } else {
        this.totalesRectificacion.set(null);
      }

      if (nomina?.evidenciaCalculo?.calculoVigente) {
        await this.cargarGrilla(true);
        await this.cargarDiffRecalculo(nominaPeriodoId);
        if (this.calculoDisponible()) {
          await this.sincronizarHintExpandDesglose();
        } else {
          this.hintExpandVisible.set(false);
        }
      } else {
        this.hintExpandVisible.set(false);
        this.diffRecalculo.set(null);
      }
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : 'Error desconocido';
      this.error.set(`No fue posible preparar el cálculo: ${mensaje}`);
    } finally {
      this.cargando.set(false);
    }
  }

  private async cargarGrilla(refrescarResumen: boolean): Promise<void> {
    const id = this.nominaPeriodoId();
    if (!id) return;
    const paginacion = { page: this.pagina(), pageSize: this.pageSize(), total: 0 };
    const [pagina, resumen] = await Promise.all([
      this.calculoAdapter.listarFilasCalculoPaginado(id, this.filtro(), paginacion),
      refrescarResumen
        ? this.calculoAdapter.obtenerResumenCalculo(id)
        : Promise.resolve(this.resumenCalculo()),
    ]);
    this.filasGrilla.set(pagina.filas.map((fila) => presentarFilaCalculoListado(fila)));
    this.totalFiltrado.set(pagina.total);
    if (refrescarResumen) {
      this.resumenCalculo.set(resumen ?? RESUMEN_CALCULO_VACIO);
    }
    await this.rehidratarFilasExpandidas();
  }

  async manejarConsultaServidor(consulta: DataGridServerQuery): Promise<void> {
    this.pagina.set(consulta.page);
    this.pageSize.set(consulta.pageSize);
    this.filtro.set(filtroCalculoDesdeGrid(consulta.filterValues));
    this.cargando.set(true);
    try {
      await this.cargarGrilla(false);
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : 'Error desconocido';
      this.error.set(`No fue posible cargar el cálculo: ${mensaje}`);
    } finally {
      this.cargando.set(false);
    }
  }

  async manejarExpansionFila(evento: {
    row: FilaCalculoTrabajador;
    expanded: boolean;
  }): Promise<void> {
    const trabajadorId = evento.row.trabajadorId;
    if (!evento.expanded) {
      this.filasExpandidas.delete(trabajadorId);
      return;
    }
    this.filasExpandidas.add(trabajadorId);
    if (evento.row.detalleCargado) return;
    await this.cargarDetalleFila(trabajadorId);
  }

  estaCargandoDetalleFila(trabajadorId: string): boolean {
    return this.detalleCargando().has(trabajadorId);
  }

  private async cargarDetalleFila(trabajadorId: string): Promise<void> {
    const fila = this.filasGrilla().find((f) => f.trabajadorId === trabajadorId);
    const periodo = this.nomina()?.periodo;
    if (!fila?.idCalculoTrabajador || !periodo) return;

    this.detalleCargando.update((s) => new Set(s).add(trabajadorId));
    try {
      const detalle = await this.calculoAdapter.obtenerDetalleTrabajadorCalculo(
        fila.idCalculoTrabajador,
        periodo,
      );
      if (!detalle) return;
      const filaCompleta = presentarFilaCalculo(detalle.liquidacion, {
        afp: inferirAfp(detalle.liquidacion),
        salud: inferirSalud(detalle.liquidacion),
        sueldoBase: detalle.trabajador.sueldoBase,
      });
      this.filasGrilla.update((filas) =>
        filas.map((f) =>
          f.trabajadorId === trabajadorId
            ? { ...filaCompleta, detalleCargado: true, idCalculoTrabajador: fila.idCalculoTrabajador }
            : f,
        ),
      );
    } finally {
      this.detalleCargando.update((s) => {
        const next = new Set(s);
        next.delete(trabajadorId);
        return next;
      });
    }
  }

  private async rehidratarFilasExpandidas(): Promise<void> {
    for (const trabajadorId of this.filasExpandidas) {
      const fila = this.filasGrilla().find((f) => f.trabajadorId === trabajadorId);
      if (fila && !fila.detalleCargado) {
        await this.cargarDetalleFila(trabajadorId);
      }
    }
  }

  async calcular(): Promise<void> {
    const nomina = this.nomina();
    if (!nomina) return;
    this.calculando.set(true);
    this.error.set(null);
    try {
      const { resultado } = await this.calculoAdapter.calcular(nomina.id);
      this.nomina.set(await this.servicio.obtenerNomina(nomina.id));
      this.preValidacion.set(await this.servicio.obtenerResumenValidacionNomina(nomina.id));
      this.pagina.set(1);
      this.filtro.set({});
      await this.cargarGrilla(true);
      if (this.nomina()?.naturaleza === 'rectificacion') {
        this.totalesRectificacion.set(await this.calculoAdapter.obtenerTotalesRectificacion(nomina.id));
      }
      await this.sincronizarHintExpandDesglose();
      await this.cargarDiffRecalculo(nomina.id);
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

  private async cargarDiffRecalculo(nominaPeriodoId: string): Promise<void> {
    try {
      const diffs = await this.calculoAdapter.obtenerDiffsRecalculo(nominaPeriodoId);
      this.diffRecalculo.set(ultimoDiffRecalculoConCambios(diffs));
    } catch {
      this.diffRecalculo.set(null);
    }
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

  async avanzar(): Promise<ResultadoAvancePaso> {
    return this.puedeContinuar();
  }

  cerrarModalCalculoNoVigente(): void {
    this.calculoNoVigenteAvisoCerrado.set(true);
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
    if (!this.calculoDisponible()) {
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

  async abrirPreview(fila: FilaCalculoTrabajador): Promise<void> {
    this.filaPreviewAbierta.set(fila.trabajadorId);
    this.liquidacionPreviewCargada.set(fila.origen ?? null);
    this.previewExtras.set(null);
    void this.cargarEmpresaDocumento();
    if (fila.origen) {
      await this.armarPreviewExtras(fila, fila.origen);
      return;
    }

    const periodo = this.nomina()?.periodo;
    if (!fila.idCalculoTrabajador || !periodo) return;

    this.previewCargando.set(true);
    try {
      const detalle = await this.calculoAdapter.obtenerDetalleTrabajadorCalculo(
        fila.idCalculoTrabajador,
        periodo,
      );
      if (detalle) {
        this.liquidacionPreviewCargada.set(detalle.liquidacion);
        this.filasGrilla.update((filas) =>
          filas.map((f) => {
            if (f.trabajadorId !== fila.trabajadorId) return f;
            const completa = presentarFilaCalculo(detalle.liquidacion, {
              afp: inferirAfp(detalle.liquidacion),
              salud: inferirSalud(detalle.liquidacion),
              sueldoBase: detalle.trabajador.sueldoBase,
            });
            return {
              ...completa,
              detalleCargado: true,
              idCalculoTrabajador: fila.idCalculoTrabajador,
            };
          }),
        );
        await this.armarPreviewExtras(
          {
            ...fila,
            afp: inferirAfp(detalle.liquidacion) ?? fila.afp,
            salud: inferirSalud(detalle.liquidacion) ?? fila.salud,
            sueldoBase: detalle.trabajador.sueldoBase ?? fila.sueldoBase,
          },
          detalle.liquidacion,
        );
      }
    } finally {
      this.previewCargando.set(false);
    }
  }

  cerrarPreview(): void {
    this.filaPreviewAbierta.set(null);
    this.liquidacionPreviewCargada.set(null);
    this.previewExtras.set(null);
  }

  private async armarPreviewExtras(
    fila: FilaCalculoTrabajador,
    liquidacion: LiquidacionCalculada,
  ): Promise<void> {
    const periodo = this.nomina()?.periodo || liquidacion.periodo;
    await this.cargarEmpresaDocumento();
    const parametros = await this.parametrosGenerales
      .obtenerUltimoHastaPeriodo(periodo)
      .catch(() => null);
    this.previewExtras.set(
      enriquecerDocumentoDesdeCalculo({
        liquidacion,
        periodo,
        empresa: this.empresaDocumento(),
        parametros: parametros ? { uf: parametros.uf, utm: parametros.utm } : null,
        idReferencia: fila.idPersona,
        trabajadorMeta: {
          afp: fila.afp,
          salud: fila.salud,
          tipoContrato: fila.tipoContrato,
          sueldoBase: fila.sueldoBase,
        },
      }),
    );
  }

  private async cargarEmpresaDocumento(): Promise<void> {
    if (this.empresaDocumento()) return;
    const empresa = await this.documentoLiquidacion.obtenerEmpresaDocumento(
      this.nomina()?.empresaNombre,
    );
    this.empresaDocumento.set(empresa);
  }

  imprimirPreview(): void {
    if (typeof window !== 'undefined') {
      window.print();
    }
  }
}

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
