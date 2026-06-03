import { ChangeDetectionStrategy, Component, ViewEncapsulation, effect, inject, signal } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

import { MessageBoxComponent } from '../../../../../../shared/components/ui/feedback/message-box/message-box.component';
import type { PayrollStepId } from '../../../../models/nomina-mensual-v2.models';
import type {
  DetalleTrazabilidadPasoNomina,
  EventoTrazabilidadNomina,
} from '../../../../models/nomina-trazabilidad.models';
import { NominaParametrosBaseService } from '../../../../services/nomina-parametros-base.service';
import { formatoFechaTrazabilidad } from '../../../../utils/nomina-trazabilidad-presentacion.util';
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
      if (!paso || !tipo) {
        return;
      }

      if (tipo !== 'integrity' || paso !== 'parameters') {
        this.valoresParametrosBaseLoading.set(false);
        this.valoresParametrosBaseError.set(null);
        this.valoresParametrosBaseRemotos.set([]);
        this.idDetalleParametrosBaseCargado.set(null);
        return;
      }

      const idCalculoPeriodoBase = this.idCalculoPeriodoBaseActivo();
      const valoresEvento = this.valoresParametrosBaseDesdeEventos();

      if (!idCalculoPeriodoBase || valoresEvento.length > 0) {
        this.valoresParametrosBaseLoading.set(false);
        this.valoresParametrosBaseError.set(null);
        if (valoresEvento.length > 0) {
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
        return 'Parámetros';
      case 'scope':
        return 'Alcance';
      case 'employees':
        return 'Empleados';
      case 'movements':
        return 'Novedades';
      case 'calculation':
        return 'Cálculo';
      case 'validation':
        return 'Validación';
      case 'approval':
        return 'Aprobación';
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
      { label: 'Registro', value: detalle.accionPrincipal || evento?.descripcion || 'Sin registro' },
      { label: 'Fecha y hora', value: formatoFechaTrazabilidad(detalle.fechaAccion ?? evento?.fechaEvento) },
      { label: 'Estado operativo', value: this.estadoOperativo(detalle.estadoActual) },
    ];
  }

  filasControlOperativo(detalle: DetalleTrazabilidadPasoNomina): FilaDetalleModal[] {
    const evento = this.ultimoEventoPaso();
    return [
      { label: 'Estado operativo', value: this.estadoOperativo(detalle.estadoActual) },
      { label: 'Último registro', value: evento?.descripcion ?? detalle.accionPrincipal ?? 'Sin registro' },
      { label: 'Responsable', value: this.valorUsuario(detalle.usuarioNombre || evento?.usuarioNombre) },
      { label: 'Fecha y hora', value: formatoFechaTrazabilidad(detalle.fechaAccion ?? evento?.fechaEvento) },
    ];
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
    switch (this.normalizarParametro(grupo)) {
      case 'uf_utm':
      case 'uf_utm_sueldo':
      case 'mensuales_uf_utm_sueldo':
        return 'Datos oficiales';
      case 'topes_base':
        return 'Topes imponibles';
      case 'catalogos_afp_impuesto':
        return 'AFP e impuesto';
      case 'salud_catalogo':
        return 'Salud';
      case 'mutualidad_ley16744_ccaf':
      case 'ccaf_mutual':
        return 'CCAF / Mutual';
      case 'afc_catalogo':
        return 'Seguro de cesantía';
      case 'sis_fila_mensual':
        return 'SIS mensual';
      case 'reforma_previsional':
        return 'Reforma previsional';
      case 'parametros_base':
        return 'Configuración del período';
      case 'parametros_generales':
        return 'Parámetros generales';
      default:
        return this.humanizarParametro(grupo);
    }
  }

  formatearNombreParametro(clave: string): string {
    switch (this.normalizarParametro(clave)) {
      case 'uf':
        return 'UF';
      case 'utm':
        return 'UTM';
      case 'uta':
        return 'UTA';
      case 'sueldo_minimo':
      case 'ingreso_minimo':
        return 'Sueldo mínimo';
      case 'sueldo_minimo_18a65':
        return 'Sueldo mínimo 18 a 65 años';
      case 'sueldo_minimo_menor18_mayor65':
        return 'Sueldo mínimo menor de 18 y mayor de 65 años';
      case 'sueldo_minimo_casa_particular':
        return 'Sueldo mínimo casa particular';
      case 'ingreso_minimo_no_remuneracional':
        return 'Ingreso mínimo no remuneracional';
      case 'gratificacion':
        return 'Gratificación legal';
      case 'imm_gratificacion':
        return 'Factor tope gratificación';
      case 'tope_imponible':
        return 'Tope imponible';
      case 'tope_imponible_afp':
      case 'tope_afp':
        return 'Tope AFP';
      case 'tope_afp_uf':
        return 'Tope AFP en UF';
      case 'tope_imponible_salud':
        return 'Tope salud';
      case 'tope_ips':
        return 'Tope IPS';
      case 'tope_ips_uf':
        return 'Tope IPS en UF';
      case 'tope_afc':
      case 'tope_cesantia':
        return 'Tope seguro de cesantía';
      case 'tope_cesantia_uf':
        return 'Tope seguro de cesantía en UF';
      case 'tope_apv_mensual':
        return 'Tope APV mensual';
      case 'tope_apv_mensual_uf':
        return 'Tope APV mensual en UF';
      case 'tope_apv_anual':
        return 'Tope APV anual';
      case 'tope_apv_anual_uf':
        return 'Tope APV anual en UF';
      case 'tope_deposito_convenido_anual':
        return 'Tope depósito convenido anual';
      case 'tope_deposito_convenido_anual_uf':
        return 'Tope depósito convenido anual en UF';
      case 'tope_afp_voluntario':
        return 'Tope ahorro previsional voluntario';
      case 'impuesto_unico':
        return 'Impuesto único';
      case 'afp':
        return 'AFP';
      case 'salud':
        return 'Salud';
      case 'salud_obligatoria':
        return 'Cotización obligatoria de salud';
      case 'salud_ccaf':
        return 'Salud CCAF';
      case 'salud_fonasa_con_ccaf':
        return 'FONASA con CCAF';
      case 'mutual':
        return 'Mutualidad';
      case 'ccaf':
        return 'Caja de compensación';
      case 'sis':
        return 'Seguro SIS';
      case 'sanna':
        return 'Seguro SANNA';
      case 'seguro_social_expectativa_vida':
        return 'Seguro social expectativa de vida';
      case 'aporte_empleador_afp':
        return 'Aporte empleador AFP';
      case 'descuentos_base_por_dia':
        return 'Descuentos base por día';
      case 'afc_empleador':
        return 'Aporte AFC empleador';
      case 'afc_trabajador':
        return 'Aporte AFC trabajador';
      case 'afc_trabajador_indefinido':
        return 'AFC trabajador contrato indefinido';
      case 'afc_empleador_indefinido':
        return 'AFC empleador contrato indefinido';
      case 'afc_empleador_plazo':
        return 'AFC empleador contrato a plazo';
      case 'afc_empleador_indefinido_once_anos_mas':
        return 'AFC empleador indefinido 11 años o más';
      case 'afc_empleador_casa_particular':
        return 'AFC empleador casa particular';
      case 'trabajo_pesado_empleador':
        return 'Trabajo pesado empleador';
      case 'trabajo_pesado_trabajador':
        return 'Trabajo pesado trabajador';
      case 'trabajo_menos_pesado_empleador':
        return 'Trabajo menos pesado empleador';
      case 'trabajo_menos_pesado_trabajador':
        return 'Trabajo menos pesado trabajador';
      default:
        return this.humanizarParametro(clave);
    }
  }

  formatearValorParametro(valor: string): string {
    const limpio = valor.trim();
    if (!limpio) return 'Sin valor';
    switch (limpio.toLowerCase()) {
      case 'true':
        return 'Sí';
      case 'false':
        return 'No';
      default:
        return limpio;
    }
  }

  formatearVigenciaParametro(vigencia: string | null): string {
    if (!vigencia) return 'Período vigente';
    return vigencia;
  }

  formatearFuenteParametro(origen: string): string {
    switch (this.normalizarParametro(origen)) {
      case 'oficial':
        return 'Dato oficial';
      case 'manual':
        return 'Ingreso manual';
      case 'parametros_base':
        return 'Configuración guardada';
      case 'parametros_generales':
        return 'Mantenedor de parámetros';
      case 'evento_anterior':
        return 'Registro anterior';
      case 'sistema':
        return 'Sistema';
      case 'no_informado':
        return 'Sin fuente';
      default:
        return this.humanizarParametro(origen);
    }
  }

  fechaEvento(evento: EventoTrazabilidadNomina): string {
    return formatoFechaTrazabilidad(evento.fechaEvento);
  }

  estadoOperativo(estado: string | null | undefined): string {
    switch ((estado ?? '').toLowerCase()) {
      case 'pendiente':
        return 'Pendiente';
      case 'registrado':
      case 'validado':
      case 'aprobado':
      case 'congelado':
        return 'Listo';
      case 'requiere revision':
      case 'requiererevision':
        return 'Requiere revisión';
      case 'invalidado':
        return 'Debe actualizarse';
      default:
        return estado || 'Sin estado';
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
      console.warn('[Nomina V2] No fue posible cargar datos guardados de parámetros', error);
      this.valoresParametrosBaseRemotos.set([]);
      this.idDetalleParametrosBaseCargado.set(idCalculoPeriodoBase);
      this.valoresParametrosBaseError.set('No fue posible cargar los valores guardados de la configuración de parámetros.');
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

  private normalizarParametro(value: string): string {
    return value
      .trim()
      .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  private humanizarParametro(value: string): string {
    const limpio = value.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
    if (!limpio) return 'Sin informacion';
    return limpio.charAt(0).toUpperCase() + limpio.slice(1);
  }

  private asTexto(value: unknown, fallback: string): string {
    if (typeof value === 'string' && value.trim().length > 0) return value;
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
    return fallback;
  }
}
