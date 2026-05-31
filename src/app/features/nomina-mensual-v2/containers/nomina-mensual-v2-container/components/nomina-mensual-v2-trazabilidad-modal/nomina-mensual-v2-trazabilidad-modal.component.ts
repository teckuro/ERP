import { ChangeDetectionStrategy, Component, ViewEncapsulation, effect, inject, signal } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

import { MessageBoxComponent } from '../../../../../../shared/components/ui/feedback/message-box/message-box.component';
import type { PayrollStepId } from '../../../../models/nomina-mensual-v2.models';
import type {
  DetalleTrazabilidadPasoNomina,
  EventoTrazabilidadNomina,
} from '../../../../models/nomina-trazabilidad.models';
import { NominaParametrosBaseService } from '../../../../services/nomina-parametros-base.service';
import {
  etiquetaIntegridadVisible,
  formatoFechaTrazabilidad,
} from '../../../../utils/nomina-trazabilidad-presentacion.util';
import { NominaMensualV2OrquestadorPort } from '../../facade/nomina-mensual-v2-orquestador.port';

interface ParametroBaseModalDetalle {
  grupo: string;
  clave: string;
  valor: string;
  vigencia: string | null;
  origen: string;
}

interface FilaDetalleModal {
  label: string;
  value: string;
}

@Component({
  selector: 'app-nomina-mensual-v2-trazabilidad-modal',
  standalone: true,
  imports: [MessageBoxComponent, LucideAngularModule],
  templateUrl: './nomina-mensual-v2-trazabilidad-modal.component.html',
  styleUrl: './nomina-mensual-v2-trazabilidad-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class NominaMensualV2TrazabilidadModalComponent {
  readonly orquestador = inject(NominaMensualV2OrquestadorPort);
  private readonly parametrosBaseService = inject(NominaParametrosBaseService);
  private readonly valoresParametrosBaseRemotos = signal<ParametroBaseModalDetalle[]>([]);
  readonly valoresParametrosBaseLoading = signal(false);
  readonly valoresParametrosBaseError = signal<string | null>(null);
  private readonly idDetalleParametrosBaseCargado = signal<number | null>(null);

  constructor() {
    effect(() => {
      const tipo = this.orquestador.tipoModalDetalleActivo();
      const paso = this.orquestador.trazabilidadPasoActivo();
      const idCalculoPeriodoBase = this.idCalculoPeriodoBaseActivo();
      const valoresEvento = this.valoresParametrosBaseDesdeEventos();

      if (tipo !== 'integrity' || paso !== 'parameters' || !idCalculoPeriodoBase || valoresEvento.length > 0) {
        this.valoresParametrosBaseLoading.set(false);
        this.valoresParametrosBaseError.set(null);
        if (tipo !== 'integrity' || paso !== 'parameters' || valoresEvento.length > 0) {
          this.valoresParametrosBaseRemotos.set([]);
          this.idDetalleParametrosBaseCargado.set(null);
        }
        return;
      }

      if (
        this.valoresParametrosBaseLoading()
        || this.idDetalleParametrosBaseCargado() === idCalculoPeriodoBase
      ) {
        return;
      }

      void this.cargarValoresParametrosBase(idCalculoPeriodoBase);
    });
  }

  cerrar(): void {
    this.orquestador.cerrarTrazabilidadPaso();
  }

  verTrazabilidadCompleta(): void {
    this.orquestador.cerrarTrazabilidadPaso();
    this.orquestador.abrirTrazabilidadCompleta();
  }

  tituloPaso(paso: PayrollStepId): string {
    switch (paso) {
      case 'parameters':
        return 'Parametros';
      case 'scope':
        return 'Alcance';
      case 'employees':
        return 'Empleados';
      case 'movements':
        return 'Novedades';
      case 'calculation':
        return 'Calculo';
      case 'validation':
        return 'Validacion';
      case 'approval':
        return 'Aprobacion';
      case 'payslips':
        return 'Liquidaciones';
    }
  }

  eventosPasoActivo(): EventoTrazabilidadNomina[] {
    const paso = this.orquestador.trazabilidadPasoActivo();
    if (!paso) return [];
    return this.orquestador.eventosTrazabilidad()
      .filter((evento) => evento.paso === paso)
      .sort((a, b) => b.fechaEvento.localeCompare(a.fechaEvento));
  }

  ultimoEventoPaso(): EventoTrazabilidadNomina | null {
    return this.eventosPasoActivo()[0] ?? null;
  }

  tieneRegistroResponsable(detalle: DetalleTrazabilidadPasoNomina): boolean {
    return detalle.estadoActual !== 'Pendiente' && detalle.fechaAccion != null && this.eventosPasoActivo().length > 0;
  }

  filasResponsable(detalle: DetalleTrazabilidadPasoNomina): FilaDetalleModal[] {
    const evento = this.ultimoEventoPaso();
    return [
      { label: 'Responsable', value: this.valorUsuario(detalle.usuarioNombre) },
      { label: 'Accion registrada', value: detalle.accionPrincipal || 'Sin registro' },
      { label: 'Fecha', value: formatoFechaTrazabilidad(detalle.fechaAccion) },
      { label: 'Estado del paso', value: detalle.estadoActual },
      { label: 'Origen', value: this.etiquetaOrigen(evento?.origen) },
    ];
  }

  filasIntegridadTecnica(detalle: DetalleTrazabilidadPasoNomina): FilaDetalleModal[] {
    const evento = this.ultimoEventoPaso();
    const filas: FilaDetalleModal[] = [
      {
        label: 'Estado',
        value: etiquetaIntegridadVisible(detalle.integridad.estadoIntegridad, evento?.origen),
      },
      { label: 'Evento relacionado', value: evento?.descripcion ?? 'Sin evento relacionado' },
      { label: 'Fecha', value: formatoFechaTrazabilidad(detalle.integridad.fechaVerificacion ?? detalle.fechaAccion) },
      { label: 'Origen', value: this.etiquetaOrigen(evento?.origen) },
    ];
    if (detalle.integridad.fingerprintPublico) {
      filas.splice(1, 0, { label: 'Huella publica', value: detalle.integridad.fingerprintPublico });
    }
    return filas;
  }

  muestraDatosParametrosGuardados(detalle: DetalleTrazabilidadPasoNomina): boolean {
    return detalle.paso === 'parameters' && this.idCalculoPeriodoBaseActivo() != null;
  }

  valoresParametrosBaseCongelados(): ParametroBaseModalDetalle[] {
    const detalle = this.orquestador.detalleTrazabilidadActivo();
    if (!detalle || detalle.paso !== 'parameters') return [];
    const desdeEventos = this.valoresParametrosBaseDesdeEventos();
    if (desdeEventos.length) return desdeEventos;
    return this.valoresParametrosBaseRemotos();
  }

  totalParametrosGuardados(): number {
    return this.valoresParametrosBaseCongelados().length;
  }

  trackParametro(_index: number, item: ParametroBaseModalDetalle): string {
    return `${item.grupo}|${item.clave}|${item.vigencia ?? ''}|${item.origen}`;
  }

  trackEvento(_index: number, item: EventoTrazabilidadNomina): string {
    return item.idEvento;
  }

  trackFila(_index: number, item: FilaDetalleModal): string {
    return item.label;
  }

  formatearGrupoParametro(grupo: string): string {
    return grupo
      .split(/[_\s-]+/)
      .filter(Boolean)
      .map((parte) => parte.charAt(0).toUpperCase() + parte.slice(1))
      .join(' ');
  }

  fechaEvento(evento: EventoTrazabilidadNomina): string {
    return formatoFechaTrazabilidad(evento.fechaEvento);
  }

  integridadEvento(evento: EventoTrazabilidadNomina): string {
    return etiquetaIntegridadVisible(evento.integridad.estadoIntegridad, evento.origen);
  }

  etiquetaOrigen(origen: EventoTrazabilidadNomina['origen'] | undefined): string {
    switch (origen) {
      case 'servidor':
        return 'Servidor';
      case 'local':
        return 'Sesion actual';
      case 'mock':
        return 'Referencia demo';
      default:
        return 'Sin origen registrado';
    }
  }

  private valoresParametrosBaseDesdeEventos(): ParametroBaseModalDetalle[] {
    const eventosParametros = this.orquestador.eventosTrazabilidad().filter((e) => e.paso === 'parameters');
    const evento = eventosParametros.find(
      (e) => e.tipoEvento === 'PARAMETROS_CONGELADOS'
        && Array.isArray(e.metadataPublica?.['valoresParametrosBase']),
    ) ?? eventosParametros.find((e) => e.tipoEvento === 'PARAMETROS_CONGELADOS');
    const valores = evento?.metadataPublica?.['valoresParametrosBase'];
    if (!Array.isArray(valores)) return [];
    return valores.flatMap((item) => this.parseParametroCongelado(item));
  }

  private idCalculoPeriodoBaseActivo(): number | null {
    const eventoConSnapshot = this.orquestador.eventosTrazabilidad()
      .find((evento) => evento.paso === 'parameters' && evento.tipoEvento === 'PARAMETROS_CONGELADOS' && evento.idSnapshotRelacionado);
    const idDesdeEvento = Number(eventoConSnapshot?.idSnapshotRelacionado);
    if (Number.isFinite(idDesdeEvento) && idDesdeEvento > 0) return idDesdeEvento;
    return this.orquestador.idCalculoPeriodoBase()
      ?? this.orquestador.estadoParametrosBase()?.idCalculoPeriodoBase
      ?? null;
  }

  private async cargarValoresParametrosBase(idCalculoPeriodoBase: number): Promise<void> {
    this.valoresParametrosBaseLoading.set(true);
    this.valoresParametrosBaseError.set(null);
    try {
      const valores = await this.parametrosBaseService.construirDetalleValoresParametrosBase(idCalculoPeriodoBase);
      this.valoresParametrosBaseRemotos.set(valores.map((valor) => ({
        grupo: valor.grupo,
        clave: valor.clave,
        valor: valor.valor,
        vigencia: valor.vigencia,
        origen: valor.origen,
      })));
      this.idDetalleParametrosBaseCargado.set(idCalculoPeriodoBase);
    } catch (error) {
      console.warn('[Nomina V2] No fue posible cargar datos guardados de parametros', error);
      this.valoresParametrosBaseRemotos.set([]);
      this.idDetalleParametrosBaseCargado.set(idCalculoPeriodoBase);
      this.valoresParametrosBaseError.set('No fue posible cargar los valores guardados de la base de parametros.');
    } finally {
      this.valoresParametrosBaseLoading.set(false);
    }
  }

  private parseParametroCongelado(item: unknown): ParametroBaseModalDetalle[] {
    if (typeof item === 'string' && item.trim().length > 0) {
      return [{
        grupo: 'Base',
        clave: item,
        valor: '',
        vigencia: null,
        origen: 'Evento anterior',
      }];
    }
    if (!item || typeof item !== 'object' || Array.isArray(item)) return [];
    const record = item as Record<string, unknown>;
    return [{
      grupo: this.asTexto(record['grupo'], 'General'),
      clave: this.asTexto(record['clave'], 'Parametro'),
      valor: this.asTexto(record['valor'], 'Sin valor'),
      vigencia: typeof record['vigencia'] === 'string' && record['vigencia'].trim()
        ? record['vigencia']
        : null,
      origen: this.asTexto(record['origen'], 'No informado'),
    }];
  }

  private valorUsuario(value: string | null | undefined): string {
    if (!value || value === '—' || value === 'â€”') return 'Sin responsable registrado';
    return value;
  }

  private asTexto(value: unknown, fallback: string): string {
    if (typeof value === 'string' && value.trim().length > 0) return value;
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
    return fallback;
  }
}
