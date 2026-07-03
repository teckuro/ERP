/**
 * Modal "Resumen de nómina" del Administrador (F2).
 *
 * Read-only. Shell `app-message-box` modal (z-index y foco del sistema NOIA).
 * Apertura inmediata con estado de carga; el contenedor inyecta datos al terminar.
 */

import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
  output,
} from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

import {
  MessageBoxComponent,
  type MessageBoxAction,
  type MessageBoxVariantInput,
} from '../../../../../../shared/components/ui/feedback/message-box/message-box.component';
import type {
  NominaPeriodoResumen,
  ResumenValidacionNomina,
} from '../../../../models/nomina-periodo.models';
import type { TotalesRectificacionVista } from '../../../../rules/proceso-mensual-motor-rectificacion.rules';
import {
  etiquetaAccionResumen,
  esNominaRectificacion,
  puedeConsultarOriginal,
} from '../../../../rules/nomina-rectificacion-ui.rules';
import { prepararComparativaRectificacion } from '../../../../presenters/nomina-rectificacion-ui.presenter';
import {
  estadoNominaToBadge,
  proximoPasoToLabel,
} from '../../utils/admin-nominas-presentacion.util';

interface MetricaResumenView {
  id: string;
  label: string;
  display: string;
  tone: 'neutral' | 'ok' | 'warning' | 'danger';
}

interface ObservacionResumenView {
  id: string;
  mensaje: string;
  tono: 'danger' | 'warning';
  icono: string;
}

@Component({
  selector: 'app-admin-nominas-modal-resumen-nomina',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, MessageBoxComponent],
  templateUrl: './admin-nominas-modal-resumen-nomina.component.html',
  styleUrl: './admin-nominas-modal-resumen-nomina.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class AdminNominasModalResumenNominaComponent {
  readonly nomina = input.required<NominaPeriodoResumen>();
  readonly resumen = input<ResumenValidacionNomina | null>(null);
  readonly cargando = input(false);
  readonly error = input<string | null>(null);
  readonly totalesRectificacion = input<TotalesRectificacionVista | null>(null);
  readonly cerrar = output<void>();
  readonly abrirGenerador = output<void>();
  readonly consultarOriginal = output<void>();

  readonly tituloModal = computed(() => {
    const n = this.nomina();
    return `${n.empresaNombre} · ${n.periodo}`;
  });

  readonly variantModal = computed((): MessageBoxVariantInput => {
    if (this.cargando()) return 'loading';
    if (this.error()) return 'danger';
    return 'info';
  });

  readonly mensajeModal = computed(() => {
    if (this.cargando()) {
      return 'Consultando validación y observaciones de la nómina.';
    }
    if (this.error()) {
      return this.error()!;
    }
    return `Siguiente paso recomendado: ${proximoPasoToLabel(this.nomina().proximoPaso)}`;
  });

  readonly contextoNomina = computed(() => {
    const n = this.nomina();
    return {
      estado: estadoNominaToBadge(n.estado),
      trabajadores: n.totalTrabajadores,
      siguiente: proximoPasoToLabel(n.proximoPaso),
    };
  });

  readonly esRectificacion = computed(() => esNominaRectificacion(this.nomina()));

  readonly puedeConsultarOriginal = computed(() => puedeConsultarOriginal(this.nomina()));

  readonly etiquetaAccionPrimaria = computed(() => etiquetaAccionResumen(this.nomina()));

  readonly comparativaRectificacion = computed(() => {
    const totales = this.totalesRectificacion();
    return totales ? prepararComparativaRectificacion(totales) : [];
  });

  readonly metricas = computed<MetricaResumenView[]>(() => {
    const r = this.resumen();
    if (!r) return [];
    const items: MetricaResumenView[] = [
      {
        id: 'listos',
        label: 'Listos para cálculo',
        display: `${r.listosParaCalculo} / ${r.totalTrabajadores}`,
        tone: r.listosParaCalculo < r.totalTrabajadores ? 'warning' : 'ok',
      },
    ];
    if (r.conMovimientosEspeciales > 0) {
      items.push({
        id: 'especiales',
        label: 'Movimientos especiales',
        display: String(r.conMovimientosEspeciales),
        tone: 'warning',
      });
    }
    return items;
  });

  readonly observaciones = computed<ObservacionResumenView[]>(() => {
    const r = this.resumen();
    if (!r) return [];
    const criticas: ObservacionResumenView[] = r.incidenciasCriticas.map((inc) => ({
      id: inc.id,
      mensaje: inc.mensaje,
      tono: 'danger',
      icono: 'circle-alert',
    }));
    const advertencias: ObservacionResumenView[] = r.advertencias.map((inc) => ({
      id: inc.id,
      mensaje: inc.mensaje,
      tono: 'warning',
      icono: 'triangle-alert',
    }));
    return [...criticas, ...advertencias];
  });

  readonly totalObservaciones = computed(() => this.observaciones().length);

  readonly situacionIcono = computed(() => {
    const tono = this.situacion()?.tono;
    if (!tono) return 'clock';
    if (tono === 'bloqueada') return 'circle-alert';
    if (tono === 'pendiente') return 'clock';
    return 'circle-check';
  });

  readonly situacion = computed<{ tono: 'ok' | 'pendiente' | 'bloqueada'; texto: string } | null>(() => {
    const r = this.resumen();
    if (!r) return null;
    if (!r.puedeCalcular) {
      return {
        tono: 'bloqueada',
        texto: 'Hay incidencias críticas bloqueantes. Resuélvelas antes de calcular.',
      };
    }
    if (!r.puedeCerrar) {
      return {
        tono: 'pendiente',
        texto: 'Lista para calcular. Falta el resultado para habilitar el cierre.',
      };
    }
    return {
      tono: 'ok',
      texto: 'Lista para calcular y cerrar.',
    };
  });

  readonly acciones = computed<MessageBoxAction[]>(() => {
    if (this.cargando() || this.error() || !this.resumen()) return [];
    const items: MessageBoxAction[] = [];
    if (this.puedeConsultarOriginal()) {
      items.push({
        label: 'Consultar cierre original',
        role: 'ghost',
        align: 'left',
        value: 'original',
      });
    }
    items.push({
      label: this.etiquetaAccionPrimaria(),
      role: 'primary',
      align: 'right',
      value: 'generador',
    });
    return items;
  });

  cerrarModal(): void {
    this.cerrar.emit();
  }

  onAction(value: string): void {
    if (value === 'generador') {
      this.abrirGenerador.emit();
      return;
    }
    if (value === 'original') {
      this.consultarOriginal.emit();
    }
  }
}
