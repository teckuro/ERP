/**
 * Modal "Resumen de nómina" del Administrador (F2).
 *
 * Read-only. Recibe `ResumenValidacionNomina` y un `NominaPeriodoResumen` para
 * contexto. Muestra totales, badges de `puedeCalcular` / `puedeCerrar` y
 * listas separadas de incidencias críticas / advertencias.
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

import type {
  IncidenciaNomina,
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
import { estadoNominaToBadge } from '../../utils/admin-nominas-presentacion.util';

interface MetricaResumenView {
  id: string;
  label: string;
  value: number;
}

@Component({
  selector: 'app-admin-nominas-modal-resumen-nomina',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './admin-nominas-modal-resumen-nomina.component.html',
  styleUrl: './admin-nominas-modal-resumen-nomina.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class AdminNominasModalResumenNominaComponent {
  readonly resumen = input.required<ResumenValidacionNomina>();
  readonly nomina = input<NominaPeriodoResumen | null>(null);
  readonly totalesRectificacion = input<TotalesRectificacionVista | null>(null);
  readonly cerrar = output<void>();
  readonly abrirGenerador = output<void>();
  readonly consultarOriginal = output<void>();

  readonly esRectificacion = computed(() => {
    const n = this.nomina();
    return n ? esNominaRectificacion(n) : false;
  });

  readonly puedeConsultarOriginal = computed(() => {
    const n = this.nomina();
    return n ? puedeConsultarOriginal(n) : false;
  });

  readonly etiquetaAccionPrimaria = computed(() =>
    this.nomina() ? etiquetaAccionResumen(this.nomina()!) : 'Continuar en el generador',
  );

  readonly comparativaRectificacion = computed(() => {
    const totales = this.totalesRectificacion();
    return totales ? prepararComparativaRectificacion(totales) : [];
  });

  readonly metricas = computed<MetricaResumenView[]>(() => {
    const r = this.resumen();
    // Resumen NOIA: 3 métricas máximo. El total de trabajadores y los conteos
    // de críticas/advertencias evitan repetir lo que la grilla ya muestra.
    return [
      { id: 'total', label: 'Trabajadores', value: r.totalTrabajadores },
      { id: 'criticas', label: 'Con críticas', value: r.conIncidenciasCriticas },
      { id: 'advertencias', label: 'Con advertencias', value: r.conAdvertencias },
    ];
  });

  readonly contextoVista = computed(() => {
    const n = this.nomina();
    if (!n) return null;
    // El tipo siempre es mensual en el piloto: omitimos el chip "Mensual"
    // para no saturar la cabecera con información redundante.
    return {
      empresa: n.empresaNombre,
      periodo: n.periodo,
      badge: estadoNominaToBadge(n.estado),
    };
  });

  /**
   * Mensaje único de "Situación" que sustituye las dos guardias paralelas.
   * Resume en una línea el estado operativo: lista, falta cálculo, o tiene
   * bloqueantes. NOIA-ADM-NOM-RESUMEN-02.
   */
  readonly situacion = computed<{ tono: 'ok' | 'pendiente' | 'bloqueada'; texto: string }>(() => {
    const r = this.resumen();
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

  cerrarModal(): void {
    this.cerrar.emit();
  }

  abrirAccionRecomendada(): void {
    this.abrirGenerador.emit();
  }

  consultarOriginalCierre(): void {
    this.consultarOriginal.emit();
  }

  onEscape(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.cerrar.emit();
    }
  }

  trackIncidencia(_index: number, incidencia: IncidenciaNomina): string {
    return incidencia.id;
  }
}
