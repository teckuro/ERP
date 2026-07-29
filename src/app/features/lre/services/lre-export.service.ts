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
import { LreExportRepository } from '../data-access/lre-export.repository';
import type {
  LreBorradorExport,
  LreCanalExportacion,
  LreExportacionRegistro,
} from '../models/lre-export.model';
import { construirBorradorLre } from '../rules/lre-export.rules';
import { LRE_FORMATO_DT_V1 } from '../rules/lre-formato-dt.rules';
import { LRE_FORMATO_OFICIAL_DT } from '../rules/lre-formato-oficial.rules';
import { DocumentoLiquidacionService } from '../../../core/services/documento-liquidacion.service';

@Injectable({ providedIn: 'root' })
export class LreExportService {
  private readonly liquidaciones = inject(LiquidacionesOficialesRepository);
  private readonly nominaService = inject(NominaPeriodoService);
  private readonly lreRepo = inject(LreExportRepository);
  private readonly auth = inject(AuthService);
  private readonly documentoEmpresa = inject(DocumentoLiquidacionService);

  async listarNominasExportables(): Promise<NominaPeriodoResumen[]> {
    const resumenes = await this.nominaService.listarResumenes();
    return nominasConLiquidacionesDisponibles(resumenes);
  }

  async construirBorradorDesdeNomina(nominaPeriodoId: string): Promise<LreBorradorExport | null> {
    const nomina = await this.nominaService.obtenerCabeceraNomina(nominaPeriodoId);
    if (!nomina?.evidenciaCalculo?.idCalculoPeriodo) return null;

    const liquidacion = await this.liquidaciones.obtenerLiquidacionPeriodo(
      nomina.periodo,
      nomina.evidenciaCalculo.idCalculoPeriodo,
    );
    if (!liquidacion) return null;

    const trabajadores = await this.liquidaciones.obtenerLiquidacionesTrabajadores(
      liquidacion.idLiquidacionPeriodo,
    );
    const detalles = await Promise.all(
      trabajadores.map(async (trabajador) => ({
        trabajador,
        conceptos: await this.liquidaciones.obtenerDetalleTrabajador(trabajador.idLiquidacionTrabajador),
      })),
    );

    return construirBorradorLre({
      periodo: nomina.periodo,
      empresaNombre: nomina.empresaNombre,
      idNominaPeriodo: nominaPeriodoId,
      idLiquidacionPeriodo: liquidacion.idLiquidacionPeriodo,
      versionLiquidacion: liquidacion.version,
      trabajadores: detalles,
    });
  }

  async obtenerUltimaExportacion(idLiquidacionPeriodo: number): Promise<{
    registro: LreExportacionRegistro | null;
    tablaDesplegada: boolean;
  }> {
    return this.lreRepo.obtenerUltimaExportacion(idLiquidacionPeriodo);
  }

  async registrarDescarga(
    borrador: LreBorradorExport,
    canal: LreCanalExportacion,
  ): Promise<LreExportacionRegistro> {
    const metadata = await this.metadataUsuarioResponsable();
    const formatoArchivo =
      canal === 'formato_oficial_dt'
        ? LRE_FORMATO_OFICIAL_DT
        : canal === 'formato_dt_v1'
          ? LRE_FORMATO_DT_V1
          : 'csv_borrador';
    return this.lreRepo.registrarExportacion({
      idLiquidacionPeriodo: borrador.idLiquidacionPeriodo,
      idNominaPeriodo: borrador.idNominaPeriodo,
      totalLineas: borrador.lineas.length,
      totalTrabajadores: borrador.totalTrabajadores,
      conceptosSinCodigo: borrador.conceptosSinCodigoLre,
      canal,
      metadata: {
        ...metadata,
        listoParaEnvio: borrador.listoParaEnvio,
        versionLiquidacion: borrador.versionLiquidacion,
        formatoArchivo,
      },
    });
  }

  async obtenerRutEmpleador(fallbackNombre?: string | null): Promise<string | null> {
    const empresa = await this.documentoEmpresa.obtenerEmpresaDocumento(fallbackNombre);
    return empresa.rut?.trim() || null;
  }

  private async metadataUsuarioResponsable(): Promise<Record<string, unknown>> {
    const user = this.auth.currentUser() ?? (await this.auth.getSession())?.user ?? null;
    const usuario = resolverUsuarioResponsableActual(user);
    return usuarioResponsableDisponible(usuario) ? { usuarioResponsable: usuario } : {};
  }
}
