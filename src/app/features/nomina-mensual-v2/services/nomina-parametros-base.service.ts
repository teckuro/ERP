import { Injectable, inject } from '@angular/core';

import { AuthService } from '../../../core/auth/auth.service';
import { resolverUsuarioResponsableActual } from '../../../core/auth/auth-user-label';
import { PeriodoActivoService } from '../../../core/services/periodo-activo.service';
import { NominaCalculoSnapshotRepository } from '../../nomina-mensual/data-access/nomina-calculo-snapshot.repository';
import { construirParametrosCongelados } from '../../nomina-mensual/rules/proceso-mensual-snapshot.rules';
import { ParametrosGeneralesService } from '../../parametros-generales/services/parametros-generales.service';
import {
  buildMetadataMantenerBaseConDiferencias,
  buildMetadataPersistenciaParametrosBase,
  buildSnapshotParametrosBasePayload,
  buildVistaPreviaParametrosBase,
  buildDetalleParametrosBaseCongelados,
  copyOrigenBaseAlAvanzar,
} from '../mappers/nomina-parametros-base.mapper';
import type { NominaParametrosResumen } from '../models/nomina-parametros-resumen.models';
import type {
  EstadoBaseParametrosPeriodoView,
  OrigenBaseParametrosAlAvanzar,
  RamaAccionPreparacionParametros,
  VistaPreviaParametrosBase,
} from '../models/nomina-parametros-base.models';
import {
  compararParametrosCongelados,
  resolverOrigenTrasAccionDiferencias,
  resolverRamaAccionPreparacion,
} from '../rules/nomina-parametros-base-comparacion.rules';

@Injectable({ providedIn: 'root' })
export class NominaParametrosBaseService {
  private readonly snapshotRepository = inject(NominaCalculoSnapshotRepository);
  private readonly parametrosService = inject(ParametrosGeneralesService);
  private readonly periodoActivo = inject(PeriodoActivoService);
  private readonly auth = inject(AuthService);

  async obtenerEstadoBasePeriodo(
    periodo = this.periodoActivo.periodoYm(),
  ): Promise<EstadoBaseParametrosPeriodoView> {
    const base = await this.snapshotRepository.obtenerSnapshotParametrosBase(periodo);
    if (!base?.idCalculoPeriodo) {
      return {
        estado: 'pendiente',
        idCalculoPeriodoBase: null,
        fechaBaseGuardada: null,
        comparacion: null,
      };
    }

    const [parametrosBase, parametrosActuales] = await Promise.all([
      this.snapshotRepository.listarParametrosSnapshot(base.idCalculoPeriodo),
      this.cargarParametrosCongeladosActuales(periodo),
    ]);
    const comparacion = compararParametrosCongelados(parametrosBase, parametrosActuales);

    return {
      estado: comparacion.hayDiferencias ? 'conDiferencias' : 'guardado',
      idCalculoPeriodoBase: base.idCalculoPeriodo,
      fechaBaseGuardada: base.fechaGeneracion,
      comparacion,
    };
  }

  resolverRamaAccionPreparacion(
    resumen: NominaParametrosResumen,
    estadoBase: EstadoBaseParametrosPeriodoView,
  ): RamaAccionPreparacionParametros {
    return resolverRamaAccionPreparacion({ resumen, estadoBase });
  }

  async construirVistaPreviaParametrosBase(
    resumen: NominaParametrosResumen,
    periodo = resumen.periodo,
  ): Promise<VistaPreviaParametrosBase> {
    const parametros = await this.cargarParametrosCongeladosActuales(periodo);
    return buildVistaPreviaParametrosBase(resumen, parametros.length);
  }

  async construirDetalleValoresParametrosBase(idCalculoPeriodoBase: number) {
    const parametros = await this.snapshotRepository.listarParametrosSnapshot(idCalculoPeriodoBase);
    return buildDetalleParametrosBaseCongelados(parametros);
  }

  async guardarSnapshotParametrosBase(
    resumen: NominaParametrosResumen,
    origenAlGuardar: OrigenBaseParametrosAlAvanzar = 'recienGuardada',
  ): Promise<{ idCalculoPeriodoBase: number; fechaBaseGuardada: string }> {
    const periodo = resumen.periodo;
    const parametrosGeneral = await this.parametrosService.obtenerUltimoHastaPeriodo(periodo, { enriquecer: true });
    const fechaGeneracion = new Date().toISOString();
    const usuario = await this.resolverUsuarioActual();
    const snapshot = buildSnapshotParametrosBasePayload({
      periodo,
      parametros: parametrosGeneral,
      resumen,
      fechaGeneracion,
      usuarioGenerador: usuario.id,
    });
    const metadata = {
      ...buildMetadataPersistenciaParametrosBase(resumen),
      hashParametros: snapshot.hashParametros,
      origenAlGuardar,
      usuarioResponsableId: usuario.id,
      usuarioResponsableNombre: usuario.nombre,
      periodoBaseParametros: periodo,
    };
    const resultado = await this.snapshotRepository.guardarSnapshotParametrosBase(snapshot, metadata);
    const id = resultado.snapshot.idCalculoPeriodo;
    if (!id) {
      throw new Error('No fue posible confirmar el guardado de la base de parámetros.');
    }
    return { idCalculoPeriodoBase: id, fechaBaseGuardada: resultado.snapshot.fechaGeneracion };
  }

  async actualizarSnapshotParametrosBase(
    resumen: NominaParametrosResumen,
  ): Promise<{ idCalculoPeriodoBase: number; fechaBaseGuardada: string }> {
    return this.guardarSnapshotParametrosBase(resumen, 'actualizadaExplicitamente');
  }

  /**
   * Persiste la decisión «Mantener base con diferencias» sin reemplazar parámetros congelados.
   */
  async registrarMantenerBaseConDiferencias(
    idCalculoPeriodoBase: number,
    resumen: NominaParametrosResumen,
  ): Promise<void> {
    const estado = await this.obtenerEstadoBasePeriodo(resumen.periodo);
    if (estado.idCalculoPeriodoBase !== idCalculoPeriodoBase) {
      throw new Error('La base de parámetros ya no es la vigente para este período.');
    }
    const base = await this.snapshotRepository.obtenerSnapshotParametrosBase(resumen.periodo);
    const usuario = await this.resolverUsuarioActual();
    const metadata = buildMetadataMantenerBaseConDiferencias(
      resumen,
      base?.metadataOperativa ?? null,
      usuario,
      estado.comparacion
        ? { hashBase: estado.comparacion.hashBase, hashActual: estado.comparacion.hashActual }
        : null,
    );
    await this.snapshotRepository.actualizarMetadataParametrosBase(idCalculoPeriodoBase, metadata);
  }

  descripcionOrigenBase(origen: OrigenBaseParametrosAlAvanzar): string {
    return copyOrigenBaseAlAvanzar(origen);
  }

  origenTrasAccionDiferencias(accion: 'mantener' | 'actualizar'): OrigenBaseParametrosAlAvanzar {
    return resolverOrigenTrasAccionDiferencias(accion);
  }

  private async cargarParametrosCongeladosActuales(periodo: string) {
    const parametrosGeneral = await this.parametrosService.obtenerUltimoHastaPeriodo(periodo, { enriquecer: true });
    return construirParametrosCongelados(parametrosGeneral);
  }

  private async resolverUsuarioActual() {
    const user = this.auth.currentUser() ?? (await this.auth.getSession())?.user ?? null;
    return resolverUsuarioResponsableActual(user);
  }
}
