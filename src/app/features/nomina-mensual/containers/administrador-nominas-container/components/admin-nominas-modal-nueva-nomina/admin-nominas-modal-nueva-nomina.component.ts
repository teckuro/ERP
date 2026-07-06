/**
 * Modal "Nueva nómina" del Administrador (F04 + F05).
 *
 * Configuración en un solo paso: período y empresa.
 * Solo nómina mensual por ahora; anticipos y ciclos se verán después.
 * La previsualización RPC se ejecuta al confirmar (fingerprint F05) sin pantalla intermedia.
 */

import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';

import { MessageBoxComponent } from '../../../../../../shared/components/ui/feedback/message-box/message-box.component';
import { PeriodoMensualInputComponent } from '../../../../../../shared/components/ui/forms/periodo-mensual-input/periodo-mensual-input.component';
import { EmpresaActivaService } from '../../../../../../core/services/empresa-activa.service';
import { mensajeErrorSupabaseParaUsuario } from '../../../../../../core/errors/erp-supabase-user-message';
import { NominaPeriodoService } from '../../../../services/nomina-periodo.service';
import type { NominaPeriodoResumen } from '../../../../models/nomina-periodo.models';
import {
  buscarNominaCoincidenteBandeja,
  construirAvisoNominaExistente,
  etiquetaPeriodoLegible,
} from '../../../../rules/nomina-creacion-ui.rules';
import type {
  ConfirmarCreacionResultado,
  NominaCreatePreview,
  SiguientePasoCreacion,
} from '../../../../models/nomina-creacion-preview.models';

interface OpcionEmpresa {
  id: string;
  nombre: string;
}

export interface NominaCreadaEvento {
  resumen: NominaPeriodoResumen;
  siguientePaso: SiguientePasoCreacion;
  totalTrabajadoresIniciales: number;
  reutilizada: boolean;
}

function periodoActual(): string {
  const hoy = new Date();
  const anio = hoy.getFullYear();
  const mes = (hoy.getMonth() + 1).toString().padStart(2, '0');
  return `${anio}-${mes}`;
}

function mensajeBloqueoPreview(preview: NominaCreatePreview): string {
  if (preview.totales.conflictos > 0) {
    const primero = preview.conflictos[0]?.motivoHumano;
    return primero
      ? `No se puede crear todavía. ${primero}`
      : 'No se puede crear todavía. Revisa los conflictos del período.';
  }
  return 'Sin trabajadores incluidos. Verifica contratos vigentes y fichas aptas en Empleados.';
}

@Component({
  selector: 'app-admin-nominas-modal-nueva-nomina',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, MessageBoxComponent, PeriodoMensualInputComponent],
  templateUrl: './admin-nominas-modal-nueva-nomina.component.html',
  styleUrl: './admin-nominas-modal-nueva-nomina.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class AdminNominasModalNuevaNominaComponent {
  private readonly servicio = inject(NominaPeriodoService);
  private readonly empresaActiva = inject(EmpresaActivaService);

  readonly empresasDisponibles = input<readonly NominaPeriodoResumen[]>([]);
  readonly periodoInicial = input<string | null>(null);
  readonly creada = output<NominaCreadaEvento>();
  readonly cerrar = output<void>();

  readonly periodo = signal(periodoActual());
  readonly empresaId = signal('');
  readonly guardando = signal(false);
  readonly error = signal<string | null>(null);

  readonly empresas = computed<OpcionEmpresa[]>(() => {
    const fuente = this.empresasDisponibles();
    const mapa = new Map<string, string>();
    for (const r of fuente) {
      if (!mapa.has(r.empresaId)) {
        mapa.set(r.empresaId, r.empresaNombre);
      }
    }
    const empresaActivaSnap = this.empresaActiva.empresa();
    if (empresaActivaSnap) {
      const id = String(empresaActivaSnap.idEmpresa);
      if (!mapa.has(id)) {
        mapa.set(id, empresaActivaSnap.nombre || empresaActivaSnap.razonSocial);
      }
    }
    return [...mapa.entries()]
      .map(([id, nombre]) => ({ id, nombre }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  });

  readonly periodoEsValido = computed(() => /^\d{4}-(0[1-9]|1[0-2])$/.test(this.periodo()));

  readonly empresaSeleccionadaNombre = computed(() => {
    const id = this.empresaId();
    return this.empresas().find((e) => e.id === id)?.nombre ?? '';
  });

  readonly multiplesEmpresas = computed(() => this.empresas().length > 1);
  readonly empresaContexto = computed(() => this.empresaSeleccionadaNombre());
  readonly etiquetaPeriodo = computed(() => etiquetaPeriodoLegible(this.periodo()));

  readonly puedeCrear = computed(() => {
    return !this.guardando() && this.periodoEsValido() && this.empresaId().length > 0;
  });

  readonly avisoNominaExistente = computed(() => {
    const fila = buscarNominaCoincidenteBandeja(
      this.empresasDisponibles(),
      this.periodo(),
      this.empresaId(),
      'mensual',
    );
    return fila ? construirAvisoNominaExistente(fila) : null;
  });

  readonly subtituloConfiguracion = computed(() => {
    if (this.periodoEsValido()) {
      return `Período ${etiquetaPeriodoLegible(this.periodo())}. La fecha de pago y el cierre se configuran en el generador.`;
    }
    return 'Indica el período a procesar. La fecha de pago y el cierre se configuran en el generador.';
  });

  constructor() {
    effect(() => {
      const inicial = this.periodoInicial();
      if (inicial && /^\d{4}-(0[1-9]|1[0-2])$/.test(inicial)) {
        this.periodo.set(inicial);
      }
    }, { allowSignalWrites: true });

    const primera = this.empresas()[0];
    if (primera) {
      this.empresaId.set(primera.id);
    }
  }

  setPeriodo(valor: string): void {
    this.periodo.set(valor);
  }

  setEmpresa(valor: string): void {
    this.empresaId.set(valor);
  }

  cerrarModal(): void {
    if (this.guardando()) return;
    this.cerrar.emit();
  }

  onEscape(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.cerrarModal();
    }
  }

  async crearNomina(): Promise<void> {
    if (!this.puedeCrear()) return;
    this.guardando.set(true);
    this.error.set(null);
    try {
      const preview = await this.servicio.previsualizarCreacion({
        periodo: this.periodo(),
        tipo: 'mensual',
        codigoCiclo: null,
      });
      if (!preview.puedeCrear) {
        this.error.set(mensajeBloqueoPreview(preview));
        return;
      }

      const resultado: ConfirmarCreacionResultado = await this.servicio.confirmarCreacion({
        periodo: this.periodo(),
        tipo: 'mensual',
        fingerprint: preview.fingerprint,
        codigoCiclo: preview.codigoCiclo ?? null,
      });

      let resumen = resultado.idNominaPeriodo
        ? await this.servicio.obtenerCabeceraNomina(resultado.idNominaPeriodo)
        : null;
      if (!resumen) {
        const resumenes = await this.servicio.listarResumenes();
        resumen = resumenes.find(
          (r) => r.id === resultado.idNominaPeriodo
            || (r.periodo === this.periodo() && r.tipo === 'mensual'),
        ) ?? null;
      }
      if (!resumen) {
        throw new Error('No fue posible recuperar la nómina recién creada.');
      }
      this.creada.emit({
        resumen,
        siguientePaso: resultado.siguientePaso,
        totalTrabajadoresIniciales: resultado.totalTrabajadores,
        reutilizada: resultado.reutilizada,
      });
    } catch (err) {
      this.error.set(mensajeErrorSupabaseParaUsuario(err, 'crear la nómina'));
    } finally {
      this.guardando.set(false);
    }
  }
}
