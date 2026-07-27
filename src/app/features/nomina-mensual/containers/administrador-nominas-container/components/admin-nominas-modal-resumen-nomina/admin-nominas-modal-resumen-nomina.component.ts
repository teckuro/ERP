/**
 * Modal "Resumen de nómina" del Administrador (F2).
 *
 * Solo para nóminas cerradas o con liquidaciones emitidas. Resumen ejecutivo
 * del cierre: totales, fechas clave y observaciones. Shell MessageBox modal lg.
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
import { WorkspaceLoadingComponent } from '../../../../../../shared/components/ui/feedback/workspace-loading/workspace-loading.component';
import type {
  NominaPeriodoResumen,
  ResumenValidacionNomina,
} from '../../../../models/nomina-periodo.models';
import { tieneLiquidaciones } from '../../../../rules/admin-nominas.rules';
import type { TotalesRectificacionVista } from '../../../../rules/proceso-mensual-motor-rectificacion.rules';
import {
  esNominaRectificacion,
  formatearMonedaClp,
  puedeConsultarOriginal,
} from '../../../../rules/nomina-rectificacion-ui.rules';
import { prepararComparativaRectificacion } from '../../../../presenters/nomina-rectificacion-ui.presenter';
import {
  estadoNominaToBadge,
  etiquetaMetaNomina,
  formatearActualizadaCompleta,
  formatearRangoLegal,
} from '../../utils/admin-nominas-presentacion.util';

interface ObservacionResumenView {
  id: string;
  mensaje: string;
  tono: 'danger' | 'warning';
  icono: string;
}

interface IndicadorResumenView {
  id: string;
  label: string;
  valor: string;
  destacado?: boolean;
}

@Component({
  selector: 'app-admin-nominas-modal-resumen-nomina',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, MessageBoxComponent, WorkspaceLoadingComponent],
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
  readonly verLiquidaciones = output<void>();
  readonly consultarOriginal = output<void>();

  readonly tituloModal = computed(() => {
    const n = this.nomina();
    return `${n.empresaNombre} · ${n.periodo}`;
  });

  readonly variantModal = computed((): MessageBoxVariantInput => {
    if (this.error()) return 'danger';
    return 'info';
  });

  readonly mensajeModal = computed(() => {
    if (this.error()) {
      return this.error()!;
    }
    const n = this.nomina();
    if (n.estado === 'cerrada') {
      return 'Período cerrado. Revisa totales, fechas y liquidaciones asociadas.';
    }
    if (n.estado === 'liquidada') {
      return 'Liquidaciones emitidas. Pendiente el cierre administrativo del período.';
    }
    return 'Resumen del período para consulta y liquidaciones.';
  });

  readonly contextoNomina = computed(() => {
    const n = this.nomina();
    const meta = etiquetaMetaNomina(n);
    return {
      estado: estadoNominaToBadge(n.estado),
      rango: formatearRangoLegal(n.fechaInicio, n.fechaFin),
      meta,
      trabajadores: n.totalTrabajadores,
    };
  });

  readonly esRectificacion = computed(() => esNominaRectificacion(this.nomina()));

  readonly puedeConsultarOriginal = computed(() => puedeConsultarOriginal(this.nomina()));

  readonly puedeVerLiquidaciones = computed(() => {
    const n = this.nomina();
    return tieneLiquidaciones(n.estado) && !!n.evidenciaCalculo?.idCalculoPeriodo;
  });

  readonly comparativaRectificacion = computed(() => {
    const totales = this.totalesRectificacion();
    return totales ? prepararComparativaRectificacion(totales) : [];
  });

  readonly indicadores = computed<IndicadorResumenView[]>(() => {
    const n = this.nomina();
    const items: IndicadorResumenView[] = [
      {
        id: 'trabajadores',
        label: 'Trabajadores',
        valor: String(n.totalTrabajadores),
      },
      {
        id: 'haberes',
        label: 'Total haberes',
        valor: formatearMonedaClp(n.totalHaberes),
      },
      {
        id: 'descuentos',
        label: 'Total descuentos',
        valor: formatearMonedaClp(n.totalDescuentos),
      },
      {
        id: 'liquido',
        label: 'Líquido a pago',
        valor: formatearMonedaClp(n.totalLiquido),
        destacado: true,
      },
    ];

    if (n.fechaPago) {
      items.push({
        id: 'fecha-pago',
        label: 'Fecha de pago',
        valor: formatearFechaCorta(n.fechaPago),
      });
    }
    if (n.closedAt) {
      items.push({
        id: 'cierre',
        label: 'Cierre registrado',
        valor: formatearActualizadaCompleta(n.closedAt),
      });
    }

    const evidencia = n.evidenciaCalculo;
    if (evidencia?.versionCalculo) {
      items.push({
        id: 'version',
        label: 'Versión de cálculo',
        valor: `v${evidencia.versionCalculo}`,
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
    const estado = this.nomina().estado;
    if (estado === 'cerrada') return 'circle-check';
    if (estado === 'liquidada') return 'receipt';
    return 'info';
  });

  readonly situacion = computed<{ tono: 'ok' | 'pendiente' | 'info'; texto: string }>(() => {
    const n = this.nomina();
    if (n.estado === 'cerrada') {
      return {
        tono: 'ok',
        texto: this.puedeVerLiquidaciones()
          ? 'Nómina cerrada. Siguiente: consultar liquidaciones del período.'
          : 'Nómina cerrada. Los montos quedaron registrados para consulta.',
      };
    }
    if (n.estado === 'liquidada') {
      return {
        tono: 'pendiente',
        texto: 'Liquidaciones generadas. Siguiente: completar el cierre administrativo del período.',
      };
    }
    if (n.estado === 'aprobada') {
      return {
        tono: 'pendiente',
        texto: 'Aprobada. Siguiente: generar liquidaciones en el generador.',
      };
    }
    if (n.naturaleza === 'rectificacion') {
      return {
        tono: 'info',
        texto: 'Rectificación. Siguiente: continuar en el generador o consultar el cierre original.',
      };
    }
    return {
      tono: 'info',
      texto: 'Resumen disponible. Siguiente: abrir el generador si falta completar el ciclo.',
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
    if (this.puedeVerLiquidaciones()) {
      items.push({
        label: 'Ver liquidaciones',
        role: 'primary',
        align: 'right',
        value: 'liquidaciones',
      });
    }
    return items;
  });

  cerrarModal(): void {
    this.cerrar.emit();
  }

  onAction(value: string): void {
    if (value === 'liquidaciones') {
      this.verLiquidaciones.emit();
      return;
    }
    if (value === 'original') {
      this.consultarOriginal.emit();
    }
  }
}

function formatearFechaCorta(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!match) return iso;
  return `${match[3]}/${match[2]}/${match[1]}`;
}
