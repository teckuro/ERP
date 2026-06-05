/**
 * Paso Movimientos — F3 fusion (F3e-3).
 *
 * Tabs operativos:
 *  - Recurrentes activos del catálogo (con switch aplicar / omitir).
 *  - Movimientos manuales del período (con alta sencilla).
 *  - Movimientos omitidos (informativo, lectura).
 *
 * Idempotencia: `NominaPeriodoService.aplicarRecurrentesANomina` ya respeta la
 * clave (nómina, persona, recurrente, tipo) y NO reaplica omitidos. Este
 * componente sólo invoca el servicio: no duplica esa lógica.
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

import type {
  MovimientoCategoria,
  MovimientoNomina,
  MovimientoRecurrente,
  MovimientoTipo,
} from '../../../../../nomina-mensual/models/movimiento-nomina.models';
import { NominaPeriodoService } from '../../../../../nomina-mensual/services/nomina-periodo.service';
import type { FilaTrabajadorNominaResumen } from '../../../../../nomina-mensual/models/nomina-periodo.models';

type TabMovimientos = 'recurrentes' | 'manuales' | 'omitidos';

interface BorradorManual {
  trabajadorId: string;
  tipo: MovimientoTipo;
  categoria: MovimientoCategoria;
  monto?: number;
  glosa?: string;
}

@Component({
  selector: 'app-nomina-mensual-v2-paso-movimientos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './nomina-mensual-v2-paso-movimientos.component.html',
  styleUrl: './nomina-mensual-v2-paso-movimientos.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NominaMensualV2PasoMovimientosComponent {
  private readonly servicio = inject(NominaPeriodoService);

  readonly nominaPeriodoId = input<string | null>(null);
  readonly avanceSolicitado = output<void>();
  readonly volverDotacion = output<void>();

  readonly tabActivo = signal<TabMovimientos>('recurrentes');
  readonly loading = signal(false);
  readonly aplicando = signal(false);
  readonly error = signal<string | null>(null);
  readonly mensaje = signal<string | null>(null);
  readonly recurrentes = signal<MovimientoRecurrente[]>([]);
  readonly movimientos = signal<MovimientoNomina[]>([]);
  readonly trabajadores = signal<FilaTrabajadorNominaResumen[]>([]);
  readonly busquedaTrabajador = signal('');
  readonly buscandoTrabajadores = signal(false);
  readonly borradorManual = signal<BorradorManual>({
    trabajadorId: '',
    tipo: 'haber-extra',
    categoria: 'haber',
  });
  private secuenciaBusquedaTrabajador = 0;

  readonly movimientosAplicados = computed(() =>
    this.movimientos().filter((m) => m.estado === 'aplicado'),
  );
  readonly movimientosManuales = computed(() =>
    this.movimientos().filter((m) => m.origen === 'manual'),
  );
  readonly movimientosOmitidos = computed(() =>
    this.movimientos().filter((m) => m.estado === 'omitido'),
  );
  readonly puedeAvanzar = computed(() => true); // no bloquea — el cálculo valida

  /**
   * Cache acumulativo de identidad humana (nombre + RUT) por `trabajadorId`,
   * usado por los listados de movimientos. Crece con cada carga / búsqueda
   * en el search-select de trabajadores. No es un signal reactivo a propósito:
   * se trata como side-store de presentación y se sincroniza en `cargar()` y
   * `buscarTrabajadores()`.
   */
  private readonly identidadesTrabajador = new Map<
    string,
    { nombre: string; rut: string }
  >();

  constructor() {
    effect(() => {
      const id = this.nominaPeriodoId();
      if (id) void this.cargar();
    });
  }

  private sincronizarIdentidades(filas: FilaTrabajadorNominaResumen[]): void {
    for (const fila of filas) {
      this.identidadesTrabajador.set(fila.trabajadorId, {
        nombre: fila.nombre,
        rut: fila.rut,
      });
    }
  }

  /** Nombre humano del trabajador o fallback explícito si no está en cache. */
  nombreTrabajador(trabajadorId: string): string {
    return this.identidadesTrabajador.get(trabajadorId)?.nombre ?? 'Trabajador sin identificar';
  }

  /** RUT del trabajador o cadena vacía si no está en cache. */
  rutTrabajador(trabajadorId: string): string {
    return this.identidadesTrabajador.get(trabajadorId)?.rut ?? '';
  }

  async cargar(): Promise<void> {
    const id = this.nominaPeriodoId();
    if (!id) return;
    this.loading.set(true);
    this.error.set(null);
    try {
      const [recurrentes, movimientos, dotacion] = await Promise.all([
        this.servicio.listarRecurrentes(),
        this.servicio.listarMovimientos(id),
        this.servicio.filtrarDotacion(id, {}, { page: 1, pageSize: 50, total: 0 }),
      ]);
      this.recurrentes.set(recurrentes);
      this.movimientos.set(movimientos);
      this.trabajadores.set(dotacion.filas);
      this.sincronizarIdentidades(dotacion.filas);
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : 'Error desconocido';
      this.error.set(`No fue posible cargar los movimientos: ${mensaje}`);
    } finally {
      this.loading.set(false);
    }
  }

  cambiarTab(tab: TabMovimientos): void {
    this.tabActivo.set(tab);
    this.mensaje.set(null);
  }

  async aplicarRecurrentes(): Promise<void> {
    const id = this.nominaPeriodoId();
    if (!id) return;
    this.aplicando.set(true);
    this.error.set(null);
    this.mensaje.set(null);
    try {
      const aplicados = await this.servicio.aplicarRecurrentesANomina(id);
      this.mensaje.set(
        `${aplicados.length} movimientos recurrentes aplicados (se respetan omitidos previos).`,
      );
      await this.cargar();
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : 'Error desconocido';
      this.error.set(`No fue posible aplicar recurrentes: ${mensaje}`);
    } finally {
      this.aplicando.set(false);
    }
  }

  async omitirMovimiento(movimientoId: string): Promise<void> {
    this.error.set(null);
    try {
      await this.servicio.omitirMovimiento(movimientoId);
      await this.cargar();
      this.mensaje.set('Movimiento omitido para este período.');
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : 'Error desconocido';
      this.error.set(`No fue posible omitir el movimiento: ${mensaje}`);
    }
  }

  async aplicarMovimientoIndividual(movimientoId: string): Promise<void> {
    this.error.set(null);
    try {
      await this.servicio.aplicarMovimiento(movimientoId);
      await this.cargar();
      this.mensaje.set('Movimiento aplicado.');
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : 'Error desconocido';
      this.error.set(`No fue posible aplicar el movimiento: ${mensaje}`);
    }
  }

  async crearMovimientoManual(): Promise<void> {
    const id = this.nominaPeriodoId();
    const borrador = this.borradorManual();
    if (!id || !borrador.trabajadorId) return;
    this.aplicando.set(true);
    this.error.set(null);
    try {
      await this.servicio.agregarMovimientoManual({
        id: '',
        nominaPeriodoId: id,
        trabajadorId: borrador.trabajadorId,
        tipo: borrador.tipo,
        categoria: borrador.categoria,
        monto: borrador.monto,
        estado: 'aplicado',
        glosa: borrador.glosa,
      });
      this.mensaje.set('Movimiento manual agregado.');
      this.borradorManual.set({ trabajadorId: '', tipo: 'haber-extra', categoria: 'haber' });
      await this.cargar();
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : 'Error desconocido';
      this.error.set(`No fue posible agregar el movimiento: ${mensaje}`);
    } finally {
      this.aplicando.set(false);
    }
  }

  actualizarTrabajadorManual(valor: string): void {
    this.borradorManual.update((b) => ({ ...b, trabajadorId: valor.trim() }));
  }

  async buscarTrabajadores(valor: string): Promise<void> {
    const id = this.nominaPeriodoId();
    if (!id) return;

    const busqueda = valor.trim();
    const secuencia = ++this.secuenciaBusquedaTrabajador;
    this.busquedaTrabajador.set(valor);
    this.buscandoTrabajadores.set(true);
    try {
      const pagina = await this.servicio.filtrarDotacion(
        id,
        busqueda ? { busqueda } : {},
        { page: 1, pageSize: 50, total: 0 },
      );
      if (secuencia === this.secuenciaBusquedaTrabajador) {
        this.trabajadores.set(pagina.filas);
        this.sincronizarIdentidades(pagina.filas);
      }
    } catch (error) {
      if (secuencia === this.secuenciaBusquedaTrabajador) {
        const mensaje = error instanceof Error ? error.message : 'Error desconocido';
        this.error.set(`No fue posible buscar trabajadores: ${mensaje}`);
      }
    } finally {
      if (secuencia === this.secuenciaBusquedaTrabajador) {
        this.buscandoTrabajadores.set(false);
      }
    }
  }

  actualizarTipoManual(valor: MovimientoTipo): void {
    this.borradorManual.update((b) => ({ ...b, tipo: valor }));
  }

  actualizarCategoriaManual(valor: MovimientoCategoria): void {
    this.borradorManual.update((b) => ({ ...b, categoria: valor }));
  }

  actualizarMontoManual(valor: number | null): void {
    this.borradorManual.update((b) => ({ ...b, monto: valor ?? undefined }));
  }

  actualizarGlosaManual(valor: string): void {
    this.borradorManual.update((b) => ({ ...b, glosa: valor.trim() || undefined }));
  }

  emitirAvance(): void {
    this.avanceSolicitado.emit();
  }

  emitirVolver(): void {
    this.volverDotacion.emit();
  }
}
