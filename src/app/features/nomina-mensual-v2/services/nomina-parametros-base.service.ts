import { Injectable, inject } from '@angular/core';

import { ErpPermisosRemuneracionesService } from '../../../core/auth/erp-permisos-remuneraciones.service';
import { AuthService } from '../../../core/auth/auth.service';
import { resolverUsuarioResponsableActual } from '../../../core/auth/auth-user-label';
import { PeriodoActivoService } from '../../../core/services/periodo-activo.service';
import { NominaCalculoSnapshotRepository } from '../../nomina-mensual/data-access/nomina-calculo-snapshot.repository';
import { NominaPeriodoService } from '../../nomina-mensual/services/nomina-periodo.service';
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
import type { NominaParametrosContext } from '../models/nomina-parametros-context.models';
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
import { resolverPeriodoConsultaParametros } from '../rules/nomina-parametros-rango.rules';

@Injectable({ providedIn: 'root' })
export class NominaParametrosBaseService {
  private readonly snapshotRepository = inject(NominaCalculoSnapshotRepository);
  private readonly parametrosService = inject(ParametrosGeneralesService);
  private readonly periodoActivo = inject(PeriodoActivoService);
  private readonly auth = inject(AuthService);
  private readonly nominaPeriodoService = inject(NominaPeriodoService);
  private readonly permisosRemuneraciones = inject(ErpPermisosRemuneracionesService);

  async obtenerEstadoBasePeriodo(
    periodo = this.periodoActivo.periodoYm(),
  ): Promise<EstadoBaseParametrosPeriodoView> {
    return this.obtenerEstadoBaseInterno(periodo, null, null);
  }

  async obtenerEstadoBaseNomina(
    context: NominaParametrosContext,
  ): Promise<EstadoBaseParametrosPeriodoView> {
    const periodo = resolverPeriodoConsultaParametros(context);
    return this.obtenerEstadoBaseInterno(periodo, context.idEmpresa, context.nominaPeriodoId);
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
    context?: NominaParametrosContext | null,
  ): Promise<{ idCalculoPeriodoBase: number; fechaBaseGuardada: string }> {
    this.validarResumenConContexto(resumen, context);
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
      idEmpresa: context?.idEmpresa ?? null,
      nominaPeriodoId: context?.nominaPeriodoId ?? resumen.nominaPeriodoId ?? null,
      fechaInicioRango: context?.fechaInicio ?? resumen.fechaInicioRango ?? null,
      fechaFinRango: context?.fechaFin ?? resumen.fechaFinRango ?? null,
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
      throw new Error('No fue posible confirmar el guardado de la configuración de parámetros.');
    }
    if (context?.nominaPeriodoId && resultado.reemplazoAnterior) {
      await this.nominaPeriodoService.invalidarCalculoPorActualizacionParametros(context.nominaPeriodoId);
    }
    return { idCalculoPeriodoBase: id, fechaBaseGuardada: resultado.snapshot.fechaGeneracion };
  }

  async actualizarSnapshotParametrosBase(
    resumen: NominaParametrosResumen,
    context?: NominaParametrosContext | null,
  ): Promise<{ idCalculoPeriodoBase: number; fechaBaseGuardada: string }> {
    this.permisosRemuneraciones.exigirPermisoRecargaParametrosBase();
    return this.guardarSnapshotParametrosBase(resumen, 'actualizadaExplicitamente', context);
  }

  async registrarMantenerBaseConDiferencias(
    idCalculoPeriodoBase: number,
    resumen: NominaParametrosResumen,
    context?: NominaParametrosContext | null,
  ): Promise<void> {
    const estado = context
      ? await this.obtenerEstadoBaseNomina(context)
      : await this.obtenerEstadoBasePeriodo(resumen.periodo);
    if (estado.idCalculoPeriodoBase !== idCalculoPeriodoBase) {
      throw new Error('La base de parámetros ya no es la vigente para esta nómina.');
    }
    const base = await this.snapshotRepository.obtenerSnapshotParametrosBase(
      resumen.periodo,
      context?.idEmpresa ?? null,
      context?.nominaPeriodoId ?? resumen.nominaPeriodoId ?? null,
    );
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

  private async obtenerEstadoBaseInterno(
    periodo: string,
    idEmpresa: number | null,
    nominaPeriodoId: string | null,
  ): Promise<EstadoBaseParametrosPeriodoView> {
    const base = await this.snapshotRepository.obtenerSnapshotParametrosBase(
      periodo,
      idEmpresa,
      nominaPeriodoId,
    );
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

  private async cargarParametrosCongeladosActuales(periodo: string) {
    const parametrosGeneral = await this.parametrosService.obtenerUltimoHastaPeriodo(periodo, { enriquecer: true });
    return construirParametrosCongelados(parametrosGeneral);
  }

  private validarResumenConContexto(
    resumen: NominaParametrosResumen,
    context?: NominaParametrosContext | null,
  ): void {
    if (context) {
      const periodoConsulta = resolverPeriodoConsultaParametros(context);
      if (resumen.periodo !== periodoConsulta) {
        throw new Error(
          `El resumen corresponde al período ${resumen.periodo}, distinto del período de la nómina ${periodoConsulta}.`,
        );
      }
      if (resumen.nominaPeriodoId && resumen.nominaPeriodoId !== context.nominaPeriodoId) {
        throw new Error('El resumen no corresponde a la nómina activa.');
      }
      return;
    }
    const periodoActivo = this.periodoActivo.periodoYm();
    if (resumen.periodo !== periodoActivo) {
      throw new Error(
        `El resumen corresponde al período ${resumen.periodo}, distinto del período activo ${periodoActivo}.`,
      );
    }
  }

  private async resolverUsuarioActual() {
    const user = this.auth.currentUser() ?? (await this.auth.getSession())?.user ?? null;
    return resolverUsuarioResponsableActual(user);
  }
}
