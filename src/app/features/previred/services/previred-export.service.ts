import { inject, Injectable } from '@angular/core';

import { AuthService } from '../../../core/auth/auth.service';
import {
  resolverUsuarioResponsableActual,
  usuarioResponsableDisponible,
} from '../../../core/auth/auth-user-label';
import { LiquidacionesOficialesRepository } from '../../liquidaciones-oficiales/data-access/liquidaciones-oficiales.repository';
import { nominasConLiquidacionesDisponibles } from '../../nomina-mensual/rules/nomina-liquidaciones-internas-ui.rules';
import type { NominaPeriodoResumen } from '../../nomina-mensual/models/nomina-periodo.models';
import { NominaPeriodoService } from '../../nomina-mensual/services/nomina-periodo.service';
import { PreviredExportRepository } from '../data-access/previred-export.repository';
import type {
  PreviredBorradorExport,
  PreviredCanalExportacion,
  PreviredExportacionRegistro,
} from '../models/previred-export.model';
import { PREVIRED_FORMATO_ARCHIVO_OFICIAL } from '../rules/previred-archivo-oficial.rules';
import { construirBorradorPrevired } from '../rules/previred-export.rules';

export interface PreviredBorradorCargaResult {
  borrador: PreviredBorradorExport;
  fasePreviredDesplegada: boolean;
}

@Injectable({ providedIn: 'root' })
export class PreviredExportService {
  private readonly liquidaciones = inject(LiquidacionesOficialesRepository);
  private readonly nominaService = inject(NominaPeriodoService);
  private readonly previredRepo = inject(PreviredExportRepository);
  private readonly auth = inject(AuthService);

  async listarNominasExportables(): Promise<NominaPeriodoResumen[]> {
    const resumenes = await this.nominaService.listarResumenes();
    return nominasConLiquidacionesDisponibles(resumenes);
  }

  async construirBorradorDesdeNomina(
    nominaPeriodoId: string,
  ): Promise<PreviredBorradorCargaResult | null> {
    const nomina = await this.nominaService.obtenerCabeceraNomina(nominaPeriodoId);
    if (!nomina) return null;

    const idCalculo = nomina.evidenciaCalculo?.idCalculoPeriodo;
    if (!idCalculo) return null;

    const [liquidacion, catalogoPrevired] = await Promise.all([
      this.liquidaciones.obtenerLiquidacionPeriodo(nomina.periodo, idCalculo),
      this.previredRepo.listarCatalogoPrevired(),
    ]);
    if (!liquidacion) return null;

    const trabajadores = await this.liquidaciones.obtenerLiquidacionesTrabajadores(
      liquidacion.idLiquidacionPeriodo,
    );
    const detalles = await Promise.all(
      trabajadores.map(async (trabajador) => ({
        trabajador,
        conceptos: await this.liquidaciones.obtenerDetalleTrabajador(
          trabajador.idLiquidacionTrabajador,
        ),
      })),
    );

    return {
      borrador: construirBorradorPrevired({
        periodo: nomina.periodo,
        empresaNombre: nomina.empresaNombre,
        idNominaPeriodo: nomina.id,
        idLiquidacionPeriodo: liquidacion.idLiquidacionPeriodo,
        versionLiquidacion: liquidacion.version,
        trabajadores: detalles,
        catalogoPrevired: catalogoPrevired.entradas,
      }),
      fasePreviredDesplegada: catalogoPrevired.tablaDesplegada,
    };
  }

  async obtenerUltimaExportacion(idLiquidacionPeriodo: number): Promise<{
    registro: PreviredExportacionRegistro | null;
    tablaDesplegada: boolean;
  }> {
    return this.previredRepo.obtenerUltimaExportacion(idLiquidacionPeriodo);
  }

  async registrarDescarga(
    borrador: PreviredBorradorExport,
    canal: PreviredCanalExportacion,
  ): Promise<PreviredExportacionRegistro> {
    const metadata = await this.metadataUsuarioResponsable();
    return this.previredRepo.registrarExportacion({
      idLiquidacionPeriodo: borrador.idLiquidacionPeriodo,
      idNominaPeriodo: borrador.idNominaPeriodo,
      totalLineas: borrador.lineas.length,
      totalTrabajadores: borrador.totalTrabajadores,
      conceptosSinMapeo: borrador.conceptosSinMapeoCatalogo,
      conceptosSinCodigo: borrador.conceptosSinCodigo,
      canal,
      metadata: {
        ...metadata,
        listoParaEnvio: borrador.listoParaEnvio,
        versionLiquidacion: borrador.versionLiquidacion,
        ...(canal === 'archivo_oficial_rem_v1'
          ? { formatoArchivo: PREVIRED_FORMATO_ARCHIVO_OFICIAL }
          : { formatoArchivo: 'csv_borrador' }),
      },
    });
  }

  private async metadataUsuarioResponsable(): Promise<Record<string, unknown>> {
    const user = this.auth.currentUser() ?? (await this.auth.getSession())?.user ?? null;
    const usuario = resolverUsuarioResponsableActual(user);
    return usuarioResponsableDisponible(usuario) ? { usuarioResponsable: usuario } : {};
  }
}
