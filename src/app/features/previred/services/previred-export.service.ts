import { inject, Injectable } from '@angular/core';

import { AuthService } from '../../../core/auth/auth.service';
import {
  resolverUsuarioResponsableActual,
  usuarioResponsableDisponible,
} from '../../../core/auth/auth-user-label';
import { LiquidacionesOficialesRepository } from '../../liquidaciones-oficiales/data-access/liquidaciones-oficiales.repository';
import { NovedadesMensualesRepository } from '../../nomina-mensual/novedades/data-access/novedades-mensuales.repository';
import { nominasConLiquidacionesDisponibles } from '../../nomina-mensual/rules/nomina-liquidaciones-internas-ui.rules';
import type { NominaPeriodoResumen } from '../../nomina-mensual/models/nomina-periodo.models';
import { NominaPeriodoService } from '../../nomina-mensual/services/nomina-periodo.service';
import { PreviredExportRepository } from '../data-access/previred-export.repository';
import type {
  PreviredArchivo105Resumen,
  PreviredBorradorExport,
  PreviredCanalExportacion,
  PreviredExportacionRegistro,
} from '../models/previred-export.model';
import { PREVIRED_FORMATO_ARCHIVO_OFICIAL } from '../rules/previred-archivo-oficial.rules';
import { PREVIRED_FORMATO_ARCHIVO_105_POSICION } from '../rules/previred-archivo-105-posicion.rules';
import {
  construirArchivo105Previred,
  type PreviredArchivo105Export,
} from '../rules/previred-export-105.rules';
import { claveTrabajadorPrevired } from '../rules/previred-trabajador-datos.rules';
import { periodoAnteriorErp } from '../rules/previred-movimiento-personal.rules';
import { construirBorradorPrevired } from '../rules/previred-export.rules';

export interface PreviredBorradorCargaResult {
  borrador: PreviredBorradorExport;
  archivo105: PreviredArchivo105Resumen | null;
  fasePreviredDesplegada: boolean;
}

@Injectable({ providedIn: 'root' })
export class PreviredExportService {
  private readonly liquidaciones = inject(LiquidacionesOficialesRepository);
  private readonly nominaService = inject(NominaPeriodoService);
  private readonly novedadesRepo = inject(NovedadesMensualesRepository);
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

    const [
      liquidacion,
      catalogoPrevired,
      catalogoCampoArchivo,
      parametrosEmpresa,
      novedadesPeriodo,
    ] = await Promise.all([
      this.liquidaciones.obtenerLiquidacionPeriodo(nomina.periodo, idCalculo),
      this.previredRepo.listarCatalogoPrevired(),
      this.previredRepo.listarCatalogoCampoArchivo(),
      this.previredRepo.obtenerParametrosEmpresaPrevired(nomina.periodo),
      this.novedadesRepo.listarPorPeriodo(nomina.periodo),
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

    const nombresFallback = new Map<number, string>();
    const idsPersona: number[] = [];
    for (const fila of detalles) {
      if (fila.trabajador.idPersona != null) {
        idsPersona.push(fila.trabajador.idPersona);
        nombresFallback.set(fila.trabajador.idPersona, fila.trabajador.nombreTrabajador);
      }
    }

    const [enriquecidos, rentasMesAnterior] = await Promise.all([
      this.previredRepo.obtenerTrabajadoresEnriquecidos(idsPersona, nombresFallback),
      this.obtenerRentasImponiblesMesAnterior(nomina.periodo),
    ]);

    const novedadesPorPersona = new Map<number, typeof novedadesPeriodo>();
    for (const novedad of novedadesPeriodo) {
      const actual = novedadesPorPersona.get(novedad.idPersona) ?? [];
      actual.push(novedad);
      novedadesPorPersona.set(novedad.idPersona, actual);
    }

    const archivo105Export = construirArchivo105Previred({
      periodo: nomina.periodo,
      catalogoCampoArchivo: catalogoCampoArchivo.entradas,
      parametrosEmpresa,
      trabajadores: detalles.map((fila) => {
        const idPersona = fila.trabajador.idPersona;
        const clave =
          idPersona != null
            ? claveTrabajadorPrevired(idPersona, fila.trabajador.idContrato)
            : null;
        return {
          trabajador: fila.trabajador,
          conceptos: fila.conceptos,
          enriquecido: clave ? (enriquecidos.get(clave) ?? null) : null,
          novedades: idPersona != null ? (novedadesPorPersona.get(idPersona) ?? []) : [],
          rentaImponibleMesAnterior:
            idPersona != null ? (rentasMesAnterior.get(idPersona) ?? null) : null,
        };
      }),
    });

    const borrador = construirBorradorPrevired({
      periodo: nomina.periodo,
      empresaNombre: nomina.empresaNombre,
      idNominaPeriodo: nomina.id,
      idLiquidacionPeriodo: liquidacion.idLiquidacionPeriodo,
      versionLiquidacion: liquidacion.version,
      trabajadores: detalles,
      catalogoPrevired: catalogoPrevired.entradas,
    });

    return {
      borrador,
      archivo105: mapArchivo105Resumen(archivo105Export),
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
    extras?: {
      archivo105?: PreviredArchivo105Resumen | null;
    },
  ): Promise<PreviredExportacionRegistro> {
    const metadata = await this.metadataUsuarioResponsable();
    const archivo105 = extras?.archivo105;

    const totalLineas =
      canal === 'archivo_oficial_105_posicion'
        ? (archivo105?.totalLineas ?? 0)
        : borrador.lineas.length;

    const conceptosSinMapeo =
      canal === 'archivo_oficial_105_posicion'
        ? (archivo105?.conceptosSinCampoArchivo ?? 0)
        : borrador.conceptosSinMapeoCatalogo;

    return this.previredRepo.registrarExportacion({
      idLiquidacionPeriodo: borrador.idLiquidacionPeriodo,
      idNominaPeriodo: borrador.idNominaPeriodo,
      totalLineas,
      totalTrabajadores:
        canal === 'archivo_oficial_105_posicion'
          ? (archivo105?.totalTrabajadores ?? borrador.totalTrabajadores)
          : borrador.totalTrabajadores,
      conceptosSinMapeo,
      conceptosSinCodigo: borrador.conceptosSinCodigo,
      canal,
      metadata: {
        ...metadata,
        listoParaEnvio:
          canal === 'archivo_oficial_105_posicion'
            ? (archivo105?.listoParaEnvio105 ?? false)
            : borrador.listoParaEnvio,
        versionLiquidacion: borrador.versionLiquidacion,
        formatoArchivo:
          canal === 'archivo_oficial_105_posicion'
            ? PREVIRED_FORMATO_ARCHIVO_105_POSICION
            : canal === 'archivo_oficial_rem_v1'
              ? PREVIRED_FORMATO_ARCHIVO_OFICIAL
              : 'csv_borrador',
      },
    });
  }

  private async obtenerRentasImponiblesMesAnterior(
    periodo: string,
  ): Promise<Map<number, number>> {
    const resultado = new Map<number, number>();
    const periodoAnterior = periodoAnteriorErp(periodo);
    if (!periodoAnterior) return resultado;

    const nominas = await this.listarNominasExportables();
    const nominaAnterior = nominas.find((n) => n.periodo === periodoAnterior);
    if (!nominaAnterior?.evidenciaCalculo?.idCalculoPeriodo) return resultado;

    const liquidacion = await this.liquidaciones.obtenerLiquidacionPeriodo(
      periodoAnterior,
      nominaAnterior.evidenciaCalculo.idCalculoPeriodo,
    );
    if (!liquidacion) return resultado;

    const trabajadores = await this.liquidaciones.obtenerLiquidacionesTrabajadores(
      liquidacion.idLiquidacionPeriodo,
    );
    for (const trabajador of trabajadores) {
      if (trabajador.idPersona != null) {
        resultado.set(trabajador.idPersona, Math.round(trabajador.baseImponible));
      }
    }
    return resultado;
  }

  private async metadataUsuarioResponsable(): Promise<Record<string, unknown>> {
    const user = this.auth.currentUser() ?? (await this.auth.getSession())?.user ?? null;
    const usuario = resolverUsuarioResponsableActual(user);
    return usuarioResponsableDisponible(usuario) ? { usuarioResponsable: usuario } : {};
  }
}

function mapArchivo105Resumen(exportacion: PreviredArchivo105Export): PreviredArchivo105Resumen {
  return {
    formato: exportacion.formato,
    periodo: exportacion.periodo,
    contenido: exportacion.contenido,
    totalTrabajadores: exportacion.totalTrabajadores,
    totalLineas: exportacion.totalLineas,
    listoParaEnvio105: exportacion.listoParaEnvio105,
    conceptosSinCampoArchivo: exportacion.conceptosSinCampoArchivo,
    trabajadoresSinDatos: exportacion.trabajadoresSinDatos,
    advertencias: exportacion.advertencias,
  };
}

export type { PreviredArchivo105Export };
export {
  construirArchivo105Previred,
  descargarArchivo105Previred,
  puedeDescargarArchivo105Previred,
} from '../rules/previred-export-105.rules';
