/**
 * Paso Cierre — F3 fusion (F3e-6) + F12/F14/F15/F16.
 *
 * Checklist operativa: parámetros, dotación, movimientos, cálculo, validación,
 * aprobación, conciliación (mensual), liquidaciones y cierre transaccional.
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
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { MessageBoxComponent } from '../../../../../../shared/components/ui/message-box.component';
import { WorkspaceLoadingComponent } from '../../../../../../shared/components/ui/feedback/workspace-loading/workspace-loading.component';

import type {
  NominaPeriodo,
  ResumenValidacionNomina,
} from '../../../../../nomina-mensual/models/nomina-periodo.models';
import type {
  NominaConsolidacion,
  NominaLiquidacionResumen,
} from '../../../../../nomina-mensual/models/nomina-consolidacion.models';
import { NominaPeriodoService } from '../../../../../nomina-mensual/services/nomina-periodo.service';
import { NominaMensualCapabilitiesService } from '../../../../../nomina-mensual/services/nomina-mensual-capabilities.service';
import { estadoNominaToLabel } from '../../../../../nomina-mensual/presenters/admin-nominas.presenter';
import type {
  PasoNominaPort,
  ResultadoAvancePaso,
} from '../../facade/nomina-mensual-v2-navegacion';
import {
  MENSAJE_CALCULO_NO_VIGENTE,
  RAZON_CIERRE_MODAL_PENDIENTE,
  esCalculoNoVigente,
} from '../../facade/nomina-mensual-v2-navegacion';
import type { NominaCabeceraCambiadaEvent } from '../../../../models/nomina-cabecera-cambiada.models';
import {
  formatearFechaLiquidacion,
  liquidacionVigente,
  prepararFilasLiquidacionesInternas,
} from '../../../../../nomina-mensual/presenters/nomina-liquidaciones-internas.presenter';
import {
  calcularTrabajadoresSinLiquidacion,
  esLiquidacionesSoloLectura,
  puedeRegenerarLiquidacionesInternas,
} from '../../../../../nomina-mensual/rules/nomina-liquidaciones-internas-ui.rules';

interface ChecklistItem {
  id: string;
  label: string;
  cumplido: boolean;
  detalle: string;
}

@Component({
  selector: 'app-nomina-mensual-v2-paso-cierre',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, MessageBoxComponent, WorkspaceLoadingComponent],
  templateUrl: './nomina-mensual-v2-paso-cierre.component.html',
  styleUrl: './nomina-mensual-v2-paso-cierre.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NominaMensualV2PasoCierreComponent implements PasoNominaPort {
  private readonly servicio = inject(NominaPeriodoService);
  private readonly capabilities = inject(NominaMensualCapabilitiesService);
  private readonly router = inject(Router);

  readonly estadoLabel = estadoNominaToLabel;
  readonly formatearFechaLiquidacion = formatearFechaLiquidacion;

  readonly nominaPeriodoId = input<string | null>(null);
  readonly preparacionExterna = input(false);
  readonly nominaCabeceraCambiada = output<NominaCabeceraCambiadaEvent>();

  readonly nomina = signal<NominaPeriodo | null>(null);
  readonly resumen = signal<ResumenValidacionNomina | null>(null);
  readonly consolidaciones = signal<readonly NominaConsolidacion[]>([]);
  readonly liquidaciones = signal<readonly NominaLiquidacionResumen[]>([]);
  readonly cargando = signal(false);
  readonly ejecutando = signal(false);
  readonly error = signal<string | null>(null);
  readonly mensaje = signal<string | null>(null);
  readonly motivoCierre = signal('');
  readonly motivoReapertura = signal('');
  readonly mostrarReabrir = signal(false);
  readonly confirmarCierreVisible = signal(false);
  readonly confirmarAprobacionVisible = signal(false);
  readonly confirmarGeneracionLiquidacionesVisible = signal(false);

  readonly esMensualConsolidadora = computed(() => {
    const n = this.nomina();
    return n?.tipo === 'mensual' && n.naturaleza === 'liquidacion_legal';
  });

  readonly checklist = computed<ChecklistItem[]>(() => {
    const n = this.nomina();
    const r = this.resumen();
    if (!n || !r) return [];

    const items: ChecklistItem[] = [
      {
        id: 'parametros',
        label: 'Parámetros guardados',
        cumplido: n.estado !== 'borrador',
        detalle: 'Los parámetros base del período están confirmados.',
      },
      {
        id: 'dotacion',
        label: 'Dotación lista',
        cumplido: n.trabajadorIds.length > 0,
        detalle: `${n.trabajadorIds.length} trabajadores en la nómina.`,
      },
      {
        id: 'movimientos',
        label: 'Movimientos aplicados',
        cumplido: n.estado !== 'dotacion_generada',
        detalle: 'Recurrentes y manuales registrados.',
      },
      {
        id: 'calculo',
        label: 'Cálculo realizado',
        cumplido: (n.evidenciaCalculo?.calculoVigente ?? false) && !!n.evidenciaCalculo?.idCalculoPeriodo,
        detalle: 'El cálculo del período está guardado y vigente.',
      },
      {
        id: 'validacion',
        label: 'Validación completada',
        cumplido:
          ['validada', 'aprobada', 'liquidada', 'cerrada'].includes(n.estado)
          && r.conIncidenciasCriticas === 0,
        detalle: `${r.conIncidenciasCriticas} críticas · ${r.conAdvertencias} advertencias.`,
      },
      {
        id: 'aprobacion',
        label: 'Aprobación registrada',
        cumplido: ['aprobada', 'liquidada', 'cerrada'].includes(n.estado),
        detalle: n.estado === 'validada'
          ? 'Pendiente de aprobación para continuar con liquidaciones.'
          : 'Aprobación operativa registrada.',
      },
    ];

    if (this.esMensualConsolidadora()) {
      const pendientes = this.consolidaciones().length;
      items.push({
        id: 'conciliacion',
        label: 'Conciliación multi-tipo',
        cumplido: pendientes === 0,
        detalle: pendientes === 0
          ? 'Anticipos y extraordinarias conciliados.'
          : `${pendientes} origen(es) pendiente(s) de aplicar.`,
      });
    }

    items.push({
      id: 'liquidaciones',
      label: 'Liquidaciones generadas',
      cumplido: this.liquidaciones().length > 0,
      detalle: this.liquidaciones().length > 0
        ? `${this.liquidaciones().length} lote(s) persistido(s).`
        : 'Genera liquidaciones desde el cálculo aprobado.',
    });

    return items;
  });

  readonly todoCumplido = computed(() => this.checklist().every((c) => c.cumplido));
  readonly cerrada = computed(() => this.nomina()?.estado === 'cerrada');
  readonly puedeAprobar = computed(
    () =>
      this.capabilities.puedeAprobarNomina()
      && this.nomina()?.estado === 'validada'
      && !this.calculoNoVigente(),
  );
  readonly puedeAccionesAdmin = this.capabilities.puedeAccionesAdminNomina;
  readonly puedeCerrar = this.capabilities.puedeCerrarNomina;
  readonly puedeConsolidar = this.capabilities.puedeConsolidarNomina;
  readonly puedeGenerarLiquidaciones = this.capabilities.puedeGenerarLiquidaciones;

  readonly calculoNoVigente = computed(() => esCalculoNoVigente(this.nomina()?.evidenciaCalculo));
  readonly versionCalculo = computed(() => this.nomina()?.evidenciaCalculo?.versionCalculo ?? 0);
  readonly mensajeCalculoNoVigente = MENSAJE_CALCULO_NO_VIGENTE;

  readonly filasLiquidaciones = computed(() =>
    prepararFilasLiquidacionesInternas(
      this.liquidaciones(),
      this.nomina()?.estado ?? 'borrador',
    ),
  );
  readonly liquidacionVigente = computed(() => liquidacionVigente(this.filasLiquidaciones()));
  readonly soloLecturaLiquidaciones = computed(() =>
    esLiquidacionesSoloLectura(this.nomina()?.estado ?? 'borrador'),
  );
  readonly puedeRegenerarLiquidaciones = computed(() =>
    puedeRegenerarLiquidacionesInternas(
      this.nomina()?.estado ?? 'borrador',
      !this.calculoNoVigente(),
    ) && this.puedeGenerarLiquidaciones(),
  );
  readonly trabajadoresSinLiquidacion = computed(() =>
    calcularTrabajadoresSinLiquidacion(
      this.nomina()?.trabajadorIds.length ?? this.resumen()?.totalTrabajadores ?? 0,
      this.liquidacionVigente()?.totalTrabajadores,
    ),
  );
  readonly etiquetaAccionLiquidaciones = computed(() =>
    this.liquidaciones().length > 0 ? 'Regenerar liquidaciones' : 'Generar liquidaciones',
  );

  readonly metricasCierre = computed(() => {
    const items = this.checklist();
    const cumplidos = items.filter((i) => i.cumplido).length;
    return {
      cumplidos,
      total: items.length,
      pendientes: items.length - cumplidos,
      liquidaciones: this.filasLiquidaciones().length,
      sinLiquidacion: this.trabajadoresSinLiquidacion(),
      trabajadores: this.nomina()?.trabajadorIds.length ?? this.resumen()?.totalTrabajadores ?? 0,
    };
  });

  constructor() {
    effect(() => {
      const id = this.nominaPeriodoId();
      if (id) void this.cargar(id);
    });
  }

  private async cargar(nominaPeriodoId: string): Promise<void> {
    this.cargando.set(true);
    this.error.set(null);
    try {
      const nomina = await this.servicio.obtenerNomina(nominaPeriodoId);
      const [resumen, consolidaciones, liquidaciones] = await Promise.all([
        this.servicio.obtenerResumenValidacionNomina(nominaPeriodoId),
        nomina?.tipo === 'mensual' && nomina.naturaleza === 'liquidacion_legal'
          ? this.servicio.listarConsolidacionesPendientes(nominaPeriodoId)
          : Promise.resolve([]),
        this.servicio.listarLiquidacionesNomina(nominaPeriodoId),
      ]);
      this.nomina.set(nomina);
      this.resumen.set(resumen);
      this.consolidaciones.set(consolidaciones);
      this.liquidaciones.set(liquidaciones);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error desconocido';
      this.error.set(`No fue posible cargar el resumen de cierre: ${msg}`);
    } finally {
      this.cargando.set(false);
    }
  }

  recargar(): void {
    const id = this.nominaPeriodoId();
    if (id && !this.cargando()) void this.cargar(id);
  }

  async aprobarNomina(): Promise<void> {
    const id = this.nominaPeriodoId();
    if (!id) return;
    this.confirmarAprobacionVisible.set(false);
    this.ejecutando.set(true);
    this.error.set(null);
    try {
      await this.servicio.aprobarNomina(id);
      this.mensaje.set('Nómina aprobada. Ya puedes generar liquidaciones.');
      await this.cargar(id);
      this.nominaCabeceraCambiada.emit({ trazabilidad: { tipo: 'aprobacion', motivo: 'Nómina aprobada.' } });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error desconocido';
      this.error.set(`No fue posible aprobar la nómina: ${msg}`);
    } finally {
      this.ejecutando.set(false);
    }
  }

  solicitarAprobacion(): void {
    if (this.puedeAprobar()) this.confirmarAprobacionVisible.set(true);
  }

  async aplicarConsolidaciones(): Promise<void> {
    const id = this.nominaPeriodoId();
    if (!id || !this.esMensualConsolidadora()) return;
    this.ejecutando.set(true);
    this.error.set(null);
    try {
      const resultado = await this.servicio.aplicarConsolidaciones(id);
      this.mensaje.set(
        `Conciliación aplicada: ${resultado.aplicadas} origen(es) incorporados.`,
      );
      await this.cargar(id);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error desconocido';
      this.error.set(`No fue posible aplicar la conciliación: ${msg}`);
    } finally {
      this.ejecutando.set(false);
    }
  }

  async generarLiquidaciones(): Promise<void> {
    const id = this.nominaPeriodoId();
    if (!id) return;
    this.confirmarGeneracionLiquidacionesVisible.set(false);
    this.ejecutando.set(true);
    this.error.set(null);
    try {
      await this.servicio.generarLiquidacionesNomina(id);
      this.mensaje.set(
        this.liquidaciones().length > 0
          ? 'Liquidaciones regeneradas. La versión anterior queda como superada.'
          : 'Liquidaciones generadas correctamente.',
      );
      await this.cargar(id);
      this.nominaCabeceraCambiada.emit({
        trazabilidad: { tipo: 'liquidaciones', motivo: 'Liquidaciones generadas.' },
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error desconocido';
      this.error.set(`No fue posible generar liquidaciones: ${msg}`);
    } finally {
      this.ejecutando.set(false);
    }
  }

  solicitarGeneracionLiquidaciones(): void {
    if (!this.puedeRegenerarLiquidaciones()) return;
    this.confirmarGeneracionLiquidacionesVisible.set(true);
  }

  verLiquidacionesCompletas(): void {
    const id = this.nominaPeriodoId();
    const nomina = this.nomina();
    if (!id || !nomina?.evidenciaCalculo?.idCalculoPeriodo) return;
    void this.router.navigate(['/remuneraciones/liquidaciones'], {
      queryParams: {
        periodo: nomina.periodo,
        nominaPeriodoId: id,
        idCalculoPeriodo: nomina.evidenciaCalculo.idCalculoPeriodo,
      },
    });
  }

  async cerrarNomina(): Promise<void> {
    const id = this.nominaPeriodoId();
    if (!id || !this.todoCumplido()) return;
    this.confirmarCierreVisible.set(false);
    this.ejecutando.set(true);
    this.error.set(null);
    try {
      await this.servicio.cerrarNomina(id, { motivo: this.motivoCierre().trim() || undefined });
      this.mensaje.set('Nómina cerrada correctamente.');
      const refrescada = await this.servicio.obtenerNomina(id);
      this.nomina.set(refrescada);
      this.nominaCabeceraCambiada.emit({
        registrarPasoCompletado: 'closure',
        trazabilidad: {
          tipo: 'cierre',
          motivo: this.motivoCierre().trim() || 'Nómina cerrada operativamente.',
        },
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error desconocido';
      this.error.set(`No fue posible cerrar la nómina: ${msg}`);
    } finally {
      this.ejecutando.set(false);
    }
  }

  solicitarCierre(): void {
    if (this.todoCumplido()) this.confirmarCierreVisible.set(true);
  }

  puedeContinuar(): ResultadoAvancePaso {
    if (this.cerrada()) {
      return { ok: false, razon: 'La nómina ya está cerrada.' };
    }
    if (!this.puedeCerrar()) {
      return {
        ok: false,
        razon: 'El cierre requiere rol de administración de remuneraciones.',
      };
    }
    if (this.ejecutando()) {
      return { ok: false, razon: 'Cierre en curso.' };
    }
    if (this.cargando()) {
      return { ok: false, razon: 'Cargando el resumen de cierre.' };
    }
    if (!this.todoCumplido()) {
      return { ok: false, razon: 'Aún hay ítems pendientes en la checklist de cierre.' };
    }
    return { ok: true };
  }

  async avanzar(): Promise<ResultadoAvancePaso> {
    const diagnostico = this.puedeContinuar();
    if (!diagnostico.ok) return diagnostico;
    this.solicitarCierre();
    return { ok: false, razon: RAZON_CIERRE_MODAL_PENDIENTE };
  }

  abrirReaperturaModal(): void {
    this.motivoReapertura.set('');
    this.error.set(null);
    this.mostrarReabrir.set(true);
  }

  cancelarReapertura(): void {
    if (this.ejecutando()) return;
    this.mostrarReabrir.set(false);
    this.motivoReapertura.set('');
    this.error.set(null);
  }

  async reabrirNomina(): Promise<void> {
    if (this.ejecutando()) return;
    const id = this.nominaPeriodoId();
    const motivo = this.motivoReapertura().trim();
    if (!id || !motivo) {
      this.error.set('Debes ingresar un motivo para reabrir la nómina.');
      return;
    }
    this.ejecutando.set(true);
    this.error.set(null);
    try {
      await this.servicio.reabrirNomina(id, { motivo });
      this.mensaje.set('Nómina reabierta para edición.');
      const refrescada = await this.servicio.obtenerNomina(id);
      this.nomina.set(refrescada);
      this.nominaCabeceraCambiada.emit({
        trazabilidad: { tipo: 'reapertura', motivo },
      });
      this.mostrarReabrir.set(false);
      this.motivoReapertura.set('');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error desconocido';
      this.error.set(`No fue posible reabrir la nómina: ${msg}`);
    } finally {
      this.ejecutando.set(false);
    }
  }

  etiquetaTipoConsolidacion(tipo: string): string {
    return tipo === 'anticipo' ? 'Anticipo' : 'Extraordinaria';
  }
}
